import { chmod, mkdir, open, readFile, rename, stat } from "node:fs/promises";
import path from "node:path";

import {
  normalizeSiteConfig,
  normalizeStorageConfig,
} from "../src/site-config.js";
import { openSecret, sealSecret } from "../src/secrets.js";
import { parseGoogleDriveFolderId } from "./google-drive-store.mjs";
import { imageStorageDriver } from "./image-store-factory.mjs";
import { FileImageStore } from "./image-store.mjs";
import { ManagedImageStore } from "./image-store-manager.mjs";

const STORED_SECRETS = new Set([
  "githubToken",
  "googleDriveClientSecret",
  "googleDriveRefreshToken",
]);

const EMPTY_STATE = Object.freeze({
  version: 1,
  config: {},
  secrets: {},
});

function statePath(dataDir) {
  return path.join(dataDir, "config.json");
}

async function readState(filePath) {
  try {
    const raw = JSON.parse(await readFile(filePath, "utf8"));
    return {
      version: 1,
      config: raw?.config && typeof raw.config === "object" ? raw.config : {},
      secrets:
        raw?.secrets && typeof raw.secrets === "object" ? raw.secrets : {},
    };
  } catch (error) {
    if (error?.code === "ENOENT") return { ...EMPTY_STATE, config: {}, secrets: {} };
    throw error;
  }
}

async function writeState(filePath, state) {
  const directory = path.dirname(filePath);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const handle = await open(temporary, "w", 0o600);
  try {
    await handle.writeFile(`${JSON.stringify(state, null, 2)}\n`, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporary, filePath);
  await chmod(filePath, 0o600);
}

function secretValue(secrets, key, adminSecret) {
  return openSecret(secrets[key], adminSecret);
}

export class FileSiteStore {
  constructor({
    dataDir,
    adminSecret,
    defaults = {},
    images,
    env = process.env,
  }) {
    this.filePath = statePath(dataDir);
    this.adminSecret = adminSecret;
    this.defaults = normalizeSiteConfig(defaults);
    this.env = env;
    this.localImages = new FileImageStore({ dataDir });
    this.images =
      images ||
      new ManagedImageStore({
        dataDir,
        settingsProvider: () => this.imageSettings(),
      });
    this.loaded = null;
    this.writeQueue = Promise.resolve();
  }

  async load() {
    if (!this.loaded) this.loaded = await readState(this.filePath);
    return this.loaded;
  }

  async getPublicConfig() {
    const state = await this.load();
    return normalizeSiteConfig({
      ...this.defaults,
      ...state.config,
      updatedAt: state.config.updatedAt || "",
    });
  }

  async getSecrets() {
    const state = await this.load();
    return {
      githubToken: await secretValue(
        state.secrets,
        "githubToken",
        this.adminSecret,
      ),
      googleDriveClientSecret: await secretValue(
        state.secrets,
        "googleDriveClientSecret",
        this.adminSecret,
      ),
      googleDriveRefreshToken: await secretValue(
        state.secrets,
        "googleDriveRefreshToken",
        this.adminSecret,
      ),
      source: state.secrets.source || "",
    };
  }

  async imageSettings() {
    const [state, secrets] = await Promise.all([this.load(), this.getSecrets()]);
    const stored = normalizeStorageConfig(state.config.storage);
    const environmentDriver = imageStorageDriver(this.env);
    const driver = stored.driver || environmentDriver;
    const fromAdmin =
      Boolean(stored.driver) ||
      Boolean(stored.clientId) ||
      Boolean(stored.folderId) ||
      Boolean(secrets.googleDriveRefreshToken);
    return {
      driver,
      source: fromAdmin
        ? "admin"
        : environmentDriver === "google-drive"
          ? "environment"
          : "default",
      folderId:
        stored.folderId ||
        parseGoogleDriveFolderId(this.env.GOOGLE_DRIVE_FOLDER_ID),
      clientId: stored.clientId || String(this.env.GOOGLE_DRIVE_CLIENT_ID || ""),
      clientSecret:
        secrets.googleDriveClientSecret ||
        String(this.env.GOOGLE_DRIVE_CLIENT_SECRET || ""),
      refreshToken:
        secrets.googleDriveRefreshToken ||
        String(this.env.GOOGLE_DRIVE_REFRESH_TOKEN || ""),
      serviceAccountJsonBase64: String(
        this.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64 || "",
      ),
      subject: String(this.env.GOOGLE_DRIVE_SUBJECT || ""),
      accountEmail: stored.accountEmail,
      connectedAt: stored.connectedAt,
    };
  }

  async getStorageStatus() {
    const settings = await this.imageSettings();
    this.localImages.resetCache();
    const localImages = await this.localImages.stats();
    return {
      driver: settings.driver,
      source: settings.source,
      clientId: settings.clientId,
      folderId: settings.folderId,
      accountEmail: settings.accountEmail,
      connectedAt: settings.connectedAt,
      hasClientSecret: Boolean(settings.clientSecret),
      hasRefreshToken: Boolean(settings.refreshToken),
      hasServiceAccount: Boolean(settings.serviceAccountJsonBase64),
      localImages,
    };
  }

  async updateConfig(input = {}) {
    this.writeQueue = this.writeQueue.catch(() => undefined).then(async () => {
      const state = await this.load();
      const nextConfig = normalizeSiteConfig({
        ...input,
        storage: input.storage ?? state.config.storage,
      });
      state.config = {
        ...nextConfig,
        updatedAt: new Date().toISOString(),
      };
      this.loaded = state;
      await writeState(this.filePath, state);
    });
    await this.writeQueue;
    this.images.invalidate?.();
    return this.getPublicConfig();
  }

  async updateConfigWithSecret(
    input = {},
    { action = "keep", name = "githubToken", value = "" } = {},
  ) {
    if (!STORED_SECRETS.has(name)) {
      throw new Error("Unsupported secret name");
    }
    if (!["keep", "set", "clear"].includes(action)) {
      throw new Error("Unsupported secret action");
    }
    const sealed =
      action === "set" ? await sealSecret(value, this.adminSecret) : "";
    this.writeQueue = this.writeQueue.catch(() => undefined).then(async () => {
      const state = await this.load();
      const nextConfig = normalizeSiteConfig({
        ...input,
        storage: input.storage ?? state.config.storage,
      });
      state.config = {
        ...nextConfig,
        updatedAt: new Date().toISOString(),
      };
      if (action === "set") {
        state.secrets[name] = sealed;
        state.secrets.source = "token";
      } else if (action === "clear") {
        state.secrets[name] = "";
        state.secrets.source = "";
      }
      this.loaded = state;
      await writeState(this.filePath, state);
    });
    await this.writeQueue;
    this.images.invalidate?.();
    return this.getPublicConfig();
  }

  async setSecret(name, value) {
    if (!STORED_SECRETS.has(name)) {
      throw new Error("Unsupported secret name");
    }
    const sealed = value ? await sealSecret(value, this.adminSecret) : "";
    this.writeQueue = this.writeQueue.catch(() => undefined).then(async () => {
      const state = await this.load();
      state.secrets[name] = sealed;
      if (name === "githubToken" && value) state.secrets.source = "token";
      if (!state.secrets.githubToken) {
        state.secrets.source = "";
      }
      this.loaded = state;
      await writeState(this.filePath, state);
    });
    await this.writeQueue;
    this.images.invalidate?.();
  }

  async clearSecret(name) {
    await this.setSecret(name, "");
  }

  async saveGoogleDriveClient({ clientId, clientSecret = "", folderId = "" }) {
    const normalizedClientId = String(clientId || "").trim().slice(0, 300);
    const normalizedSecret = String(clientSecret || "").trim();
    const normalizedFolderId = parseGoogleDriveFolderId(folderId).slice(0, 200);
    if (normalizedClientId.length < 12) {
      throw Object.assign(new Error("Google OAuth 客户端 ID 格式不正确。"), {
        status: 400,
      });
    }
    if (normalizedSecret && (normalizedSecret.length < 8 || normalizedSecret.length > 500)) {
      throw Object.assign(new Error("Google OAuth 客户端密钥格式不正确。"), {
        status: 400,
      });
    }
    const sealed =
      normalizedSecret ? await sealSecret(normalizedSecret, this.adminSecret) : "";
    this.writeQueue = this.writeQueue.catch(() => undefined).then(async () => {
      const state = await this.load();
      const storage = normalizeStorageConfig(state.config.storage);
      state.config.storage = {
        ...storage,
        clientId: normalizedClientId,
        folderId: normalizedFolderId,
      };
      state.config.updatedAt = new Date().toISOString();
      if (sealed) state.secrets.googleDriveClientSecret = sealed;
      this.loaded = state;
      await writeState(this.filePath, state);
    });
    await this.writeQueue;
    this.images.invalidate?.();
    return this.getStorageStatus();
  }

  async setGoogleDriveConnection({
    clientId = "",
    refreshToken,
    folderId,
    accountEmail = "",
  }) {
    const token = String(refreshToken || "").trim();
    const normalizedFolderId = parseGoogleDriveFolderId(folderId);
    if (!token || token.length > 2000) {
      throw Object.assign(new Error("Google Drive 授权令牌无效。"), {
        status: 400,
      });
    }
    if (!normalizedFolderId) {
      throw Object.assign(new Error("Google Drive 文件夹 ID 无效。"), {
        status: 400,
      });
    }
    const sealed = await sealSecret(token, this.adminSecret);
    this.writeQueue = this.writeQueue.catch(() => undefined).then(async () => {
      const state = await this.load();
      const storage = normalizeStorageConfig(state.config.storage);
      state.config.storage = {
        ...storage,
        ...(clientId ? { clientId: String(clientId).trim().slice(0, 300) } : {}),
        driver: "google-drive",
        folderId: normalizedFolderId,
        accountEmail: String(accountEmail || "").trim().slice(0, 200),
        connectedAt: new Date().toISOString(),
      };
      state.config.updatedAt = new Date().toISOString();
      state.secrets.googleDriveRefreshToken = sealed;
      this.loaded = state;
      await writeState(this.filePath, state);
    });
    await this.writeQueue;
    this.images.invalidate?.();
    return this.getStorageStatus();
  }

  async disconnectGoogleDrive() {
    this.writeQueue = this.writeQueue.catch(() => undefined).then(async () => {
      const state = await this.load();
      const storage = normalizeStorageConfig(state.config.storage);
      state.config.storage = {
        ...storage,
        driver: "file",
        accountEmail: "",
        connectedAt: "",
      };
      state.config.updatedAt = new Date().toISOString();
      state.secrets.googleDriveRefreshToken = "";
      this.loaded = state;
      await writeState(this.filePath, state);
    });
    await this.writeQueue;
    this.images.invalidate?.();
    return this.getStorageStatus();
  }

  async clearGoogleDriveCredentials() {
    this.writeQueue = this.writeQueue.catch(() => undefined).then(async () => {
      const state = await this.load();
      state.config.storage = normalizeStorageConfig({
        driver: "file",
      });
      state.config.updatedAt = new Date().toISOString();
      state.secrets.googleDriveRefreshToken = "";
      state.secrets.googleDriveClientSecret = "";
      this.loaded = state;
      await writeState(this.filePath, state);
    });
    await this.writeQueue;
    this.images.invalidate?.();
    return this.getStorageStatus();
  }

  async status() {
    const [state, secrets] = await Promise.all([this.load(), this.getSecrets()]);
    let fileMode = "";
    try {
      fileMode = (await stat(this.filePath)).mode.toString(8);
    } catch {}
    return {
      persisted: Boolean(state.config.updatedAt),
      hasToken: Boolean(secrets.githubToken),
      hasGoogleDriveRefreshToken: Boolean(secrets.googleDriveRefreshToken),
      googleDriveSource: state.config.storage?.driver ? "admin" : "",
      source: secrets.source,
      fileMode,
    };
  }
}
