import { GoogleDriveError } from "./google-drive-store.mjs";

export const GOOGLE_DRIVE_AUTH_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_DRIVE_TOKEN_ENDPOINT =
  "https://oauth2.googleapis.com/token";
export const GOOGLE_DRIVE_SCOPE =
  "https://www.googleapis.com/auth/drive";
export const GOOGLE_DRIVE_DEFAULT_FOLDER = "Profile Card Image Library";

const DRIVE_API = "https://www.googleapis.com/drive/v3";

function driveQueryString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function buildGoogleDriveAuthUrl({
  clientId,
  redirectUri,
  state,
  codeChallenge = "",
}) {
  const url = new URL(GOOGLE_DRIVE_AUTH_ENDPOINT);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_DRIVE_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  if (codeChallenge) {
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }
  return url.toString();
}

export async function exchangeGoogleDriveCode({
  code,
  clientId,
  clientSecret,
  redirectUri,
  codeVerifier = "",
  fetchImpl = fetch,
}) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  if (codeVerifier) body.set("code_verifier", codeVerifier);
  const response = await fetchImpl(GOOGLE_DRIVE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.refresh_token) {
    const reason =
      payload.error_description || payload.error || "token exchange failed";
    throw new GoogleDriveError(
      `Google OAuth 授权失败：${reason}`,
      response.status || 502,
      "OAUTH_EXCHANGE_FAILED",
    );
  }
  return payload;
}

export async function fetchGoogleDriveAccount({
  accessToken,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(
    `${DRIVE_API}/about?fields=user(emailAddress,displayName)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.user) {
    throw new GoogleDriveError(
      `无法读取 Google Drive 账户：${payload?.error?.message || response.status}`,
      response.status || 502,
      "ACCOUNT_LOOKUP_FAILED",
    );
  }
  return payload.user;
}

async function driveJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new GoogleDriveError(
      `Google Drive 请求失败：${payload?.error?.message || response.status}`,
      response.status || 502,
      "DRIVE_REQUEST_FAILED",
    );
  }
  return payload;
}

export async function ensureGoogleDriveFolder({
  accessToken,
  folderId = "",
  folderName = GOOGLE_DRIVE_DEFAULT_FOLDER,
  fetchImpl = fetch,
}) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  if (folderId) {
    const params = new URLSearchParams({
      fields: "id,name,mimeType,trashed",
      supportsAllDrives: "true",
    });
    const response = await fetchImpl(
      `${DRIVE_API}/files/${encodeURIComponent(folderId)}?${params}`,
      { headers },
    );
    const folder = await driveJson(response);
    if (
      folder.mimeType !== "application/vnd.google-apps.folder" ||
      folder.trashed
    ) {
      throw new GoogleDriveError(
        "指定的 Google Drive ID 不是可用文件夹。",
        400,
        "INVALID_FOLDER",
      );
    }
    return folder.id;
  }

  const query = new URLSearchParams({
    q: [
      `name = '${driveQueryString(folderName)}'`,
      "mimeType = 'application/vnd.google-apps.folder'",
      "trashed = false",
    ].join(" and "),
    spaces: "drive",
    fields: "files(id,name)",
    pageSize: "10",
  });
  const listed = await driveJson(
    await fetchImpl(`${DRIVE_API}/files?${query}`, { headers }),
  );
  const existing = Array.isArray(listed.files) ? listed.files[0] : null;
  if (existing?.id) return existing.id;

  const created = await driveJson(
    await fetchImpl(`${DRIVE_API}/files?fields=id,name`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      }),
    }),
  );
  return created.id;
}
