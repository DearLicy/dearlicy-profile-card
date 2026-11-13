import { chmod, mkdir, open, readFile, rename, stat } from "node:fs/promises";
import path from "node:path";

import { normalizeSiteConfig } from "../src/site-config.js";
import { openSecret, sealSecret } from "../src/secrets.js";
import { FileImageStore } from "./image-store.mjs";

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
  constructor({ dataDir, adminSecret, defaults = {}, images }) {
    this.filePath = statePath(dataDir);
    this.adminSecret = adminSecret;
    this.defaults = normalizeSiteConfig(defaults);
    this.images = images || new FileImageStore({ dataDir });
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
      source: state.secrets.source || "",
    };
  }

  async updateConfig(input = {}) {
    const nextConfig = normalizeSiteConfig(input);
    this.writeQueue = this.writeQueue.catch(() => undefined).then(async () => {
      const state = await this.load();
      state.config = {
        ...nextConfig,
        updatedAt: new Date().toISOString(),
      };
      this.loaded = state;
      await writeState(this.filePath, state);
    });
    await this.writeQueue;
    return this.getPublicConfig();
  }

  async updateConfigWithSecret(
    input = {},
    { action = "keep", name = "githubToken", value = "" } = {},
  ) {
    if (name !== "githubToken") {
      throw new Error("Unsupported secret name");
    }
    if (!["keep", "set", "clear"].includes(action)) {
      throw new Error("Unsupported secret action");
    }
    const nextConfig = normalizeSiteConfig(input);
    const sealed =
      action === "set" ? await sealSecret(value, this.adminSecret) : "";
    this.writeQueue = this.writeQueue.catch(() => undefined).then(async () => {
      const state = await this.load();
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
    return this.getPublicConfig();
  }

  async setSecret(name, value) {
    if (name !== "githubToken") {
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
  }

  async clearSecret(name) {
    await this.setSecret(name, "");
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
      source: secrets.source,
      fileMode,
    };
  }
}
