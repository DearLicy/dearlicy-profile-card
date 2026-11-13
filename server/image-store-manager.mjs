import { createImageStore } from "./image-store-factory.mjs";

export class ManagedImageStore {
  constructor({ dataDir, settingsProvider }) {
    if (typeof settingsProvider !== "function") {
      throw new Error("ManagedImageStore requires a settings provider");
    }
    this.dataDir = dataDir;
    this.settingsProvider = settingsProvider;
    this.activeStore = null;
    this.activeDriver = "";
  }

  async currentStore() {
    if (this.activeStore) return this.activeStore;
    const settings = await this.settingsProvider();
    const env = {
      IMAGE_STORAGE_DRIVER: settings.driver,
      GOOGLE_DRIVE_FOLDER_ID: settings.folderId,
      GOOGLE_DRIVE_CLIENT_ID: settings.clientId,
      GOOGLE_DRIVE_CLIENT_SECRET: settings.clientSecret,
      GOOGLE_DRIVE_REFRESH_TOKEN: settings.refreshToken,
      GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64:
        settings.serviceAccountJsonBase64,
      GOOGLE_DRIVE_SUBJECT: settings.subject,
    };
    this.activeStore = createImageStore({ dataDir: this.dataDir, env });
    this.activeDriver = settings.driver;
    return this.activeStore;
  }

  invalidate() {
    this.activeStore = null;
    this.activeDriver = "";
  }

  async driver() {
    return (await this.currentStore()).driver;
  }

  async list(options) {
    return (await this.currentStore()).list(options);
  }

  async get(id, options) {
    return (await this.currentStore()).get(id, options);
  }

  async create(input) {
    return (await this.currentStore()).create(input);
  }

  async import(input) {
    const store = await this.currentStore();
    if (typeof store.import !== "function") {
      throw new Error("当前图片存储不支持迁移导入。");
    }
    return store.import(input);
  }

  async update(id, patch) {
    return (await this.currentStore()).update(id, patch);
  }

  async remove(id) {
    return (await this.currentStore()).remove(id);
  }

  async stats() {
    return (await this.currentStore()).stats();
  }
}
