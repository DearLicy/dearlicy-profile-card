import {
  GoogleDriveClient,
  GoogleDriveImageStore,
  createGoogleDriveAuth,
  parseGoogleDriveFolderId,
} from "./google-drive-store.mjs";
import { FileImageStore } from "./image-store.mjs";

export function imageStorageDriver(env = process.env) {
  const explicit = String(env.IMAGE_STORAGE_DRIVER || "")
    .trim()
    .toLowerCase();
  if (explicit) return explicit;
  return String(env.GOOGLE_DRIVE_FOLDER_ID || "").trim()
    ? "google-drive"
    : "file";
}

export function createImageStore({
  dataDir,
  env = process.env,
  fetchImpl = fetch,
} = {}) {
  const driver = imageStorageDriver(env);
  if (driver === "file") {
    return new FileImageStore({ dataDir });
  }
  if (driver === "google-drive") {
    const folderId = parseGoogleDriveFolderId(env.GOOGLE_DRIVE_FOLDER_ID);
    const auth = createGoogleDriveAuth(env, { fetchImpl });
    const client = new GoogleDriveClient({ auth, fetchImpl });
    return new GoogleDriveImageStore({ client, folderId });
  }
  throw new Error(
    `Unsupported IMAGE_STORAGE_DRIVER "${driver}". Use "file" or "google-drive".`,
  );
}
