import "server-only";

import {
  GOOGLE_DRIVE_DEFAULT_FOLDER,
  GOOGLE_DRIVE_SCOPE,
} from "@/lib/constants";
import { getDb } from "@/lib/db";
import { openSecret, sealSecret } from "@/lib/crypto";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export class GoogleDriveError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 500, code = "") {
    super(message);
    this.name = "GoogleDriveError";
    this.status = status;
    this.code = code;
  }
}

type DriveCredentialRow = {
  client_id: string;
  secret_cipher: string | null;
  refresh_token_cipher: string | null;
  folder_id: string;
  account_email: string;
  connected_at: string;
  status: string;
  status_message: string;
  updated_at: string;
};

export function parseDriveFolderId(value: string) {
  const input = String(value || "").trim();
  if (!input) return "";
  const match = input.match(/\/folders\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : input;
}

export function getDriveCredentialRow() {
  return getDb()
    .sqlite.prepare("SELECT * FROM google_drive_credentials WHERE id = 1")
    .get() as DriveCredentialRow;
}

export function getDriveSettings(includeSecrets = false) {
  const row = getDriveCredentialRow();
  const secret = includeSecrets ? openSecret(row.secret_cipher) : "";
  const refreshToken = includeSecrets ? openSecret(row.refresh_token_cipher) : "";
  return {
    clientId: row.client_id,
    clientSecret: secret,
    refreshToken,
    folderId: row.folder_id,
    accountEmail: row.account_email,
    connectedAt: row.connected_at,
    status: row.status,
    message: row.status_message,
    updatedAt: row.updated_at,
    hasClientSecret: Boolean(row.secret_cipher),
    hasRefreshToken: Boolean(row.refresh_token_cipher),
  };
}

export function saveDriveClient(input: {
  clientId: string;
  clientSecret?: string;
  folderId?: string;
}) {
  const clientId = String(input.clientId || "").trim();
  const clientSecret = String(input.clientSecret || "").trim();
  const folderId = parseDriveFolderId(input.folderId || "");
  if (clientId.length < 12 || !clientId.endsWith(".apps.googleusercontent.com")) {
    throw Object.assign(new Error("Google OAuth 客户端 ID 格式不正确。"), {
      status: 400,
    });
  }
  if (
    clientSecret &&
    (clientSecret.length < 8 || clientSecret.length > 500)
  ) {
    throw Object.assign(new Error("Google OAuth 客户端密钥格式不正确。"), {
      status: 400,
    });
  }
  const current = getDriveCredentialRow();
  const now = new Date().toISOString();
  getDb()
    .sqlite.prepare(
      `UPDATE google_drive_credentials SET
       client_id = ?,
       secret_cipher = ?,
       folder_id = ?,
       status = ?,
       status_message = ?,
       updated_at = ?
       WHERE id = 1`,
    )
    .run(
      clientId,
      clientSecret ? sealSecret(clientSecret) : current.secret_cipher,
      folderId,
      current.refresh_token_cipher ? current.status : "configured",
      current.refresh_token_cipher
        ? current.status_message
        : "OAuth 客户端已保存，尚未授权",
      now,
    );
  return getDriveSettings();
}

export async function exchangeDriveCode(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  codeVerifier: string;
}) {
  const body = new URLSearchParams({
    code: input.code,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    redirect_uri: input.redirectUri,
    grant_type: "authorization_code",
    code_verifier: input.codeVerifier,
  });
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.refresh_token) {
    throw new GoogleDriveError(
      payload.error_description || payload.error || "OAuth token 交换失败",
      response.status || 502,
      "OAUTH_EXCHANGE_FAILED",
    );
  }
  return {
    accessToken: payload.access_token as string,
    refreshToken: payload.refresh_token as string,
  };
}

const tokenCache = {
  value: "",
  expiresAt: 0,
};

export async function driveAccessToken(force = false) {
  if (!force && tokenCache.value && tokenCache.expiresAt - 60_000 > Date.now()) {
    return tokenCache.value;
  }
  const settings = getDriveSettings(true);
  if (!settings.clientId || !settings.clientSecret || !settings.refreshToken) {
    throw new GoogleDriveError(
      "Google Drive 尚未完成授权。",
      409,
      "DRIVE_NOT_CONNECTED",
    );
  }
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      refresh_token: settings.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new GoogleDriveError(
      payload.error_description || payload.error || "Google Drive 授权失败",
      response.status || 502,
      "AUTH_FAILED",
    );
  }
  tokenCache.value = payload.access_token;
  tokenCache.expiresAt = Date.now() + (Number(payload.expires_in) || 3600) * 1000;
  return tokenCache.value;
}

async function driveFetch(url: string, init: RequestInit = {}, retry = true) {
  const token = await driveAccessToken(!retry);
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 401 && retry) return driveFetch(url, init, false);
  return response;
}

async function driveJson(url: string, init: RequestInit = {}) {
  const response = await driveFetch(url, init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new GoogleDriveError(
      payload?.error?.message || `Google Drive 返回 ${response.status}`,
      response.status,
      "DRIVE_REQUEST_FAILED",
    );
  }
  return payload;
}

export async function getDriveAccount(accessToken: string) {
  const response = await fetch(
    `${DRIVE_API}/about?fields=user(emailAddress,displayName)`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.user) {
    throw new GoogleDriveError(
      payload?.error?.message || "无法读取 Google Drive 账户。",
      response.status || 502,
      "ACCOUNT_LOOKUP_FAILED",
    );
  }
  return payload.user as { emailAddress?: string; displayName?: string };
}

export async function ensureDriveFolder(
  accessToken: string,
  folderId = "",
) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  if (folderId) {
    const params = new URLSearchParams({
      fields: "id,name,mimeType,trashed",
      supportsAllDrives: "true",
    });
    const response = await fetch(
      `${DRIVE_API}/files/${encodeURIComponent(folderId)}?${params}`,
      { headers },
    );
    const folder = await response.json().catch(() => ({}));
    if (
      !response.ok ||
      folder.mimeType !== "application/vnd.google-apps.folder" ||
      folder.trashed
    ) {
      throw new GoogleDriveError(
        "指定的 Google Drive ID 不是可用文件夹。",
        400,
        "INVALID_FOLDER",
      );
    }
    return folder.id as string;
  }
  const query = new URLSearchParams({
    q: `name = '${GOOGLE_DRIVE_DEFAULT_FOLDER.replaceAll("'", "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    spaces: "drive",
    fields: "files(id,name)",
    pageSize: "10",
  });
  const listed = await fetch(`${DRIVE_API}/files?${query}`, { headers }).then(
    (response) => response.json(),
  );
  if (listed?.files?.[0]?.id) return listed.files[0].id as string;
  const created = await fetch(`${DRIVE_API}/files?fields=id,name`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: GOOGLE_DRIVE_DEFAULT_FOLDER,
      mimeType: "application/vnd.google-apps.folder",
    }),
  }).then((response) => response.json());
  if (!created?.id) {
    throw new GoogleDriveError("无法创建 Google Drive 图片文件夹。", 502);
  }
  return created.id as string;
}

export function setDriveConnection(input: {
  refreshToken: string;
  folderId: string;
  accountEmail: string;
}) {
  const now = new Date().toISOString();
  getDb()
    .sqlite.prepare(
      `UPDATE google_drive_credentials SET
       refresh_token_cipher = ?,
       folder_id = ?,
       account_email = ?,
       connected_at = ?,
       status = 'connected',
       status_message = 'Google Drive 已连接',
       updated_at = ?
       WHERE id = 1`,
    )
    .run(
      sealSecret(input.refreshToken),
      parseDriveFolderId(input.folderId),
      input.accountEmail,
      now,
      now,
    );
  tokenCache.value = "";
  tokenCache.expiresAt = 0;
}

export async function uploadDriveImage(id: string, buffer: Buffer, folderId: string) {
  if (!folderId) {
    throw new GoogleDriveError("Google Drive 文件夹尚未配置。", 409);
  }
  const metadata = await driveJson(
    `${DRIVE_API}/files?supportsAllDrives=true&fields=id,name`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${id}.webp`,
        parents: [folderId],
        mimeType: "image/webp",
        appProperties: {
          profileCardImageId: id,
          profileCardKind: "image",
        },
      }),
    },
  );
  try {
    const params = new URLSearchParams({
      uploadType: "media",
      supportsAllDrives: "true",
      fields: "id,name,modifiedTime",
    });
    const response = await driveFetch(
      `${UPLOAD_API}/files/${encodeURIComponent(metadata.id)}?${params}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "image/webp" },
        body: new Uint8Array(buffer),
      },
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new GoogleDriveError(
        payload?.error?.message || "Google Drive 图片写入失败。",
        response.status,
      );
    }
    return metadata.id as string;
  } catch (error) {
    await deleteDriveImage(metadata.id).catch(() => undefined);
    throw error;
  }
}

export async function readDriveImage(fileId: string) {
  const params = new URLSearchParams({
    alt: "media",
    supportsAllDrives: "true",
  });
  const response = await driveFetch(
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}?${params}`,
  );
  if (!response.ok) {
    throw new GoogleDriveError(
      "Google Drive 图片读取失败。",
      response.status,
      "IMAGE_READ_FAILED",
    );
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function deleteDriveImage(fileId: string) {
  const response = await driveFetch(
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
    { method: "DELETE" },
  );
  if (!response.ok && response.status !== 404) {
    throw new GoogleDriveError("Google Drive 图片删除失败。", response.status);
  }
}

export async function testDriveConnection() {
  const settings = getDriveSettings(true);
  if (!settings.refreshToken) {
    throw new GoogleDriveError("Google Drive 尚未完成授权。", 409);
  }
  const accessToken = await driveAccessToken(true);
  const account = await getDriveAccount(accessToken);
  const folderId = await ensureDriveFolder(accessToken, settings.folderId);
  const now = new Date().toISOString();
  getDb()
    .sqlite.prepare(
      `UPDATE google_drive_credentials SET
       folder_id = ?,
       account_email = ?,
       status = 'connected',
       status_message = '连接测试通过',
       updated_at = ?
       WHERE id = 1`,
    )
    .run(folderId, account.emailAddress || account.displayName || "", now);
  return {
    accountEmail: account.emailAddress || account.displayName || "",
    folderId,
  };
}

export function disconnectDrive() {
  const now = new Date().toISOString();
  getDb()
    .sqlite.prepare(
      `UPDATE google_drive_credentials SET
       status = 'disconnected',
       status_message = '已停用新图片上传；授权仍保留',
       updated_at = ?
       WHERE id = 1`,
    )
    .run(now);
  tokenCache.value = "";
}

export function clearDriveCredentials() {
  const now = new Date().toISOString();
  getDb()
    .sqlite.prepare(
      `UPDATE google_drive_credentials SET
       client_id = '',
       secret_cipher = '',
       refresh_token_cipher = '',
       folder_id = '',
       account_email = '',
       connected_at = '',
       status = 'disconnected',
       status_message = '凭据已移除',
       updated_at = ?
       WHERE id = 1`,
    )
    .run(now);
  tokenCache.value = "";
  tokenCache.expiresAt = 0;
}

export function driveOAuthUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_DRIVE_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}
