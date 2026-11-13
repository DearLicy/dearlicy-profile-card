import { createSign, randomUUID } from "node:crypto";

import {
  MAX_LIBRARY_IMAGES,
  cleanLabel,
  emptyManifest,
  imageError,
  imageStats,
  makeImageEntry,
  normalizeManifest,
  publicEntry,
  validId,
  validateImageBuffer,
} from "./image-store.mjs";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const MANIFEST_NAME = "profile-card-image-library.json";

export class GoogleDriveError extends Error {
  constructor(message, status = 500, code = "") {
    super(message);
    this.name = "GoogleDriveError";
    this.status = status;
    this.code = code;
  }
}

function base64url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function driveQueryString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function parseGoogleDriveFolderId(value) {
  const input = String(value || "").trim();
  if (!input) return "";
  const urlMatch = input.match(/\/folders\/([A-Za-z0-9_-]+)/);
  return urlMatch ? urlMatch[1] : input;
}

function parseServiceAccount(env) {
  const encoded = String(
    env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64 || "",
  ).trim();
  const raw = encoded
    ? Buffer.from(encoded, "base64").toString("utf8")
    : String(env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw new GoogleDriveError(
      "Google Drive 服务账号 JSON 无法解析。",
      500,
      "INVALID_SERVICE_ACCOUNT",
    );
  }
}

export function createGoogleDriveAuth(env = process.env, { fetchImpl = fetch } = {}) {
  const refreshToken = String(env.GOOGLE_DRIVE_REFRESH_TOKEN || "").trim();
  const clientId = String(env.GOOGLE_DRIVE_CLIENT_ID || "").trim();
  const clientSecret = String(env.GOOGLE_DRIVE_CLIENT_SECRET || "").trim();
  if (refreshToken && clientId && clientSecret) {
    return new GoogleDriveTokenProvider({
      mode: "refresh-token",
      clientId,
      clientSecret,
      refreshToken,
      fetchImpl,
    });
  }

  const serviceAccount = parseServiceAccount(env);
  if (serviceAccount?.client_email && serviceAccount?.private_key) {
    return new GoogleDriveTokenProvider({
      mode: "service-account",
      clientEmail: serviceAccount.client_email,
      privateKey: String(serviceAccount.private_key).replace(/\\n/g, "\n"),
      subject: String(env.GOOGLE_DRIVE_SUBJECT || "").trim(),
      fetchImpl,
    });
  }

  throw new GoogleDriveError(
    "Google Drive 存储缺少授权：请配置 OAuth refresh token，或服务账号 JSON。",
    500,
    "MISSING_CREDENTIALS",
  );
}

export class GoogleDriveTokenProvider {
  constructor(options) {
    this.options = options;
    this.cachedToken = "";
    this.expiresAt = 0;
  }

  async getAccessToken({ force = false } = {}) {
    if (
      !force &&
      this.cachedToken &&
      this.expiresAt - 60_000 > Date.now()
    ) {
      return this.cachedToken;
    }
    const body =
      this.options.mode === "refresh-token"
        ? new URLSearchParams({
            client_id: this.options.clientId,
            client_secret: this.options.clientSecret,
            refresh_token: this.options.refreshToken,
            grant_type: "refresh_token",
          })
        : new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: this.serviceAccountAssertion(),
          });
    const response = await this.options.fetchImpl(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.access_token) {
      const reason =
        payload.error_description || payload.error || "token request failed";
      throw new GoogleDriveError(
        `Google Drive 授权失败：${reason}`,
        response.status || 500,
        "AUTH_FAILED",
      );
    }
    this.cachedToken = payload.access_token;
    const expiresIn = Number(payload.expires_in) || 3600;
    this.expiresAt = Date.now() + expiresIn * 1000;
    return this.cachedToken;
  }

  serviceAccountAssertion() {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = base64url(
      JSON.stringify({
        iss: this.options.clientEmail,
        ...(this.options.subject ? { sub: this.options.subject } : {}),
        scope: DRIVE_SCOPE,
        aud: TOKEN_ENDPOINT,
        iat: now,
        exp: now + 3600,
      }),
    );
    const signingInput = `${header}.${payload}`;
    const signature = createSign("RSA-SHA256")
      .update(signingInput)
      .sign(this.options.privateKey);
    return `${signingInput}.${base64url(signature)}`;
  }
}

export class GoogleDriveClient {
  constructor({
    auth,
    fetchImpl = fetch,
    driveApi = DRIVE_API,
    uploadApi = UPLOAD_API,
  }) {
    this.auth = auth;
    this.fetchImpl = fetchImpl;
    this.driveApi = driveApi;
    this.uploadApi = uploadApi;
  }

  async request(url, options = {}, { retry = true } = {}) {
    const token = await this.auth.getAccessToken({ force: !retry });
    const response = await this.fetchImpl(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 401 && retry) {
      return this.request(url, options, { retry: false });
    }
    return response;
  }

  async json(url, options = {}) {
    const response = await this.request(url, options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new GoogleDriveError(
        `Google Drive 请求失败：${payload?.error?.message || response.status}`,
        response.status,
        payload?.error?.code || "",
      );
    }
    return payload;
  }

  async listFiles(query, {
    fields = "files(id,name,modifiedTime,size)",
    orderBy = "modifiedTime desc",
    pageSize = 20,
  } = {}) {
    const params = new URLSearchParams({
      q: query,
      spaces: "drive",
      fields,
      orderBy,
      pageSize: String(pageSize),
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    return this.json(`${this.driveApi}/files?${params}`);
  }

  async createFile({
    name,
    parentId,
    buffer,
    mimeType,
    appProperties = {},
  }) {
    const params = new URLSearchParams({
      supportsAllDrives: "true",
      fields: "id,name",
    });
    const metadata = await this.json(`${this.driveApi}/files?${params}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        parents: [parentId],
        mimeType,
        appProperties,
      }),
    });
    try {
      await this.updateFileContent(metadata.id, buffer, mimeType);
      return metadata;
    } catch (error) {
      await this.deleteFile(metadata.id).catch(() => undefined);
      throw error;
    }
  }

  async updateFileContent(fileId, buffer, mimeType) {
    const params = new URLSearchParams({
      uploadType: "media",
      supportsAllDrives: "true",
      fields: "id,name,modifiedTime",
    });
    const response = await this.request(
      `${this.uploadApi}/files/${encodeURIComponent(fileId)}?${params}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": mimeType || "application/octet-stream",
        },
        body: buffer,
      },
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new GoogleDriveError(
        `Google Drive 文件写入失败：${payload?.error?.message || response.status}`,
        response.status,
        payload?.error?.code || "",
      );
    }
    return response.json().catch(() => ({}));
  }

  async readFile(fileId) {
    const params = new URLSearchParams({
      alt: "media",
      supportsAllDrives: "true",
    });
    const response = await this.request(
      `${this.driveApi}/files/${encodeURIComponent(fileId)}?${params}`,
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new GoogleDriveError(
        `Google Drive 文件读取失败：${payload?.error?.message || response.status}`,
        response.status,
        payload?.error?.code || "",
      );
    }
    return Buffer.from(await response.arrayBuffer());
  }

  async deleteFile(fileId) {
    const params = new URLSearchParams({ supportsAllDrives: "true" });
    const response = await this.request(
      `${this.driveApi}/files/${encodeURIComponent(fileId)}?${params}`,
      { method: "DELETE" },
    );
    if (!response.ok && response.status !== 404) {
      const payload = await response.json().catch(() => ({}));
      throw new GoogleDriveError(
        `Google Drive 文件删除失败：${payload?.error?.message || response.status}`,
        response.status,
        payload?.error?.code || "",
      );
    }
  }
}

export class GoogleDriveImageStore {
  constructor({
    client,
    folderId,
    cacheTtlMs = 10 * 60 * 1000,
    cacheLimit = 50,
  }) {
    if (!client) throw new Error("GoogleDriveImageStore requires a client");
    this.client = client;
    this.folderId = parseGoogleDriveFolderId(folderId);
    if (!this.folderId) {
      throw new GoogleDriveError(
        "Google Drive 存储缺少 GOOGLE_DRIVE_FOLDER_ID。",
        500,
        "MISSING_FOLDER",
      );
    }
    this.driver = "google-drive";
    this.cacheTtlMs = cacheTtlMs;
    this.cacheLimit = cacheLimit;
    this.cache = new Map();
    this.loaded = null;
    this.manifestFileId = "";
    this.writeQueue = Promise.resolve();
  }

  async load() {
    if (this.loaded) return this.loaded;
    const query = [
      `'${driveQueryString(this.folderId)}' in parents`,
      `name = '${MANIFEST_NAME}'`,
      "trashed = false",
    ].join(" and ");
    const listing = await this.client.listFiles(query, { pageSize: 10 });
    const file = Array.isArray(listing.files) ? listing.files[0] : null;
    if (!file?.id) {
      this.loaded = emptyManifest();
      return this.loaded;
    }
    this.manifestFileId = file.id;
    const buffer = await this.client.readFile(file.id);
    if (!buffer.byteLength) {
      this.loaded = emptyManifest();
      return this.loaded;
    }
    try {
      this.loaded = normalizeManifest(JSON.parse(buffer.toString("utf8")));
    } catch {
      throw new GoogleDriveError(
        "Google Drive 中的图片索引已损坏，请检查 manifest 文件。",
        500,
        "INVALID_MANIFEST",
      );
    }
    return this.loaded;
  }

  async persistManifest(manifest) {
    const buffer = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
    if (this.manifestFileId) {
      try {
        await this.client.updateFileContent(
          this.manifestFileId,
          buffer,
          "application/json",
        );
        return;
      } catch (error) {
        if (error?.status !== 404) throw error;
        this.manifestFileId = "";
      }
    }
    const created = await this.client.createFile({
      name: MANIFEST_NAME,
      parentId: this.folderId,
      buffer,
      mimeType: "application/json",
      appProperties: { profileCardKind: "image-manifest" },
    });
    this.manifestFileId = created.id;
  }

  async list({ includeUnpublished = false } = {}) {
    const manifest = await this.load();
    return manifest.images
      .filter((entry) => includeUnpublished || entry.published)
      .slice()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(publicEntry);
  }

  async get(id, { includeUnpublished = false } = {}) {
    const normalized = validId(id);
    if (!normalized) return null;
    const manifest = await this.load();
    const entry = manifest.images.find((image) => image.id === normalized);
    if (
      !entry ||
      (!entry.published && !includeUnpublished) ||
      !entry.storageId
    ) {
      return null;
    }
    const cached = this.cache.get(entry.storageId);
    if (cached && cached.expiresAt > Date.now()) {
      return { image: publicEntry(entry), buffer: cached.buffer };
    }
    try {
      const buffer = await this.client.readFile(entry.storageId);
      if (!buffer.byteLength || buffer.byteLength !== entry.bytes) return null;
      this.cache.set(entry.storageId, {
        buffer,
        expiresAt: Date.now() + this.cacheTtlMs,
      });
      while (this.cache.size > this.cacheLimit) {
        this.cache.delete(this.cache.keys().next().value);
      }
      return { image: publicEntry(entry), buffer };
    } catch (error) {
      if (error?.status === 404) return null;
      throw error;
    }
  }

  async create({
    buffer,
    label = "",
    source = "guest",
    published = false,
  } = {}) {
    return this.enqueue(async () => {
      validateImageBuffer(buffer);
      const manifest = await this.load();
      if (manifest.images.length >= MAX_LIBRARY_IMAGES) {
        throw imageError(`图片库最多保存 ${MAX_LIBRARY_IMAGES} 张图片。`, 409);
      }
      const id = randomUUID();
      const uploaded = await this.client.createFile({
        name: `${id}.webp`,
        parentId: this.folderId,
        buffer,
        mimeType: "image/webp",
        appProperties: { profileCardKind: "image", profileCardImageId: id },
      });
      const entry = makeImageEntry({
        id,
        buffer,
        label,
        source,
        published,
        storageId: uploaded.id,
      });
      manifest.images.push(entry);
      try {
        await this.persistManifest(manifest);
      } catch (error) {
        manifest.images.pop();
        await this.client.deleteFile(uploaded.id).catch(() => undefined);
        throw error;
      }
      return publicEntry(entry);
    });
  }

  async import({
    id,
    buffer,
    label = "",
    source = "guest",
    published = false,
    createdAt = "",
  } = {}) {
    const normalized = validId(id);
    if (!normalized) {
      throw imageError("待迁移图片的 ID 无效。", 400);
    }
    return this.enqueue(async () => {
      validateImageBuffer(buffer);
      const manifest = await this.load();
      if (manifest.images.some((image) => image.id === normalized)) {
        return null;
      }
      if (manifest.images.length >= MAX_LIBRARY_IMAGES) {
        throw imageError(`图片库最多保存 ${MAX_LIBRARY_IMAGES} 张图片。`, 409);
      }
      const uploaded = await this.client.createFile({
        name: `${normalized}.webp`,
        parentId: this.folderId,
        buffer,
        mimeType: "image/webp",
        appProperties: {
          profileCardKind: "image",
          profileCardImageId: normalized,
        },
      });
      const entry = makeImageEntry({
        id: normalized,
        buffer,
        label,
        source,
        published,
        storageId: uploaded.id,
      });
      if (createdAt) entry.createdAt = String(createdAt).slice(0, 40);
      manifest.images.push(entry);
      try {
        await this.persistManifest(manifest);
      } catch (error) {
        manifest.images.pop();
        await this.client.deleteFile(uploaded.id).catch(() => undefined);
        throw error;
      }
      return publicEntry(entry);
    });
  }

  async update(id, { published, label } = {}) {
    const normalized = validId(id);
    if (!normalized) return null;
    return this.enqueue(async () => {
      const manifest = await this.load();
      const entry = manifest.images.find((image) => image.id === normalized);
      if (!entry) return null;
      const previous = { published: entry.published, label: entry.label };
      if (typeof published === "boolean") entry.published = published;
      if (label !== undefined) entry.label = cleanLabel(label, entry.label);
      try {
        await this.persistManifest(manifest);
      } catch (error) {
        Object.assign(entry, previous);
        throw error;
      }
      return publicEntry(entry);
    });
  }

  async remove(id) {
    const normalized = validId(id);
    if (!normalized) return false;
    return this.enqueue(async () => {
      const manifest = await this.load();
      const index = manifest.images.findIndex(
        (image) => image.id === normalized,
      );
      if (index < 0) return false;
      const [entry] = manifest.images.splice(index, 1);
      try {
        await this.persistManifest(manifest);
      } catch (error) {
        manifest.images.splice(index, 0, entry);
        throw error;
      }
      this.cache.delete(entry.storageId);
      if (entry.storageId) {
        await this.client.deleteFile(entry.storageId).catch(() => undefined);
      }
      return true;
    });
  }

  async stats() {
    const images = await this.list({ includeUnpublished: true });
    return imageStats(images);
  }

  enqueue(task) {
    this.writeQueue = this.writeQueue.catch(() => undefined).then(task);
    return this.writeQueue;
  }
}
