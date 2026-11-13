import assert from "node:assert/strict";
import test from "node:test";

import {
  GoogleDriveImageStore,
  createGoogleDriveAuth,
  parseGoogleDriveFolderId,
} from "../server/google-drive-store.mjs";
import {
  createImageStore,
  imageStorageDriver,
} from "../server/image-store-factory.mjs";
import { buildAuthUrl } from "../scripts/google-drive-auth.mjs";

function sampleWebp(width = 920, height = 1360, padding = 0) {
  const buffer = Buffer.alloc(30 + padding);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(buffer.byteLength - 8, 4);
  buffer.write("WEBP", 8, "ascii");
  buffer.write("VP8X", 12, "ascii");
  buffer.writeUInt32LE(10, 16);
  buffer.writeUIntLE(width - 1, 24, 3);
  buffer.writeUIntLE(height - 1, 27, 3);
  return buffer;
}

class FakeDriveClient {
  constructor() {
    this.files = new Map();
    this.nextId = 1;
  }

  async listFiles(query) {
    const name = query.match(/name = '([^']+)'/)?.[1] || "";
    return {
      files: [...this.files.values()]
        .filter((file) => !name || file.name === name)
        .map(({ id, name: fileName, modifiedTime, size }) => ({
          id,
          name: fileName,
          modifiedTime,
          size,
        })),
    };
  }

  async createFile({ name, parentId, buffer, mimeType, appProperties }) {
    const id = `drive-${this.nextId++}`;
    this.files.set(id, {
      id,
      name,
      parentId,
      buffer: Buffer.from(buffer),
      mimeType,
      appProperties,
      modifiedTime: new Date().toISOString(),
      size: buffer.byteLength,
    });
    return { id, name };
  }

  async updateFileContent(id, buffer) {
    const file = this.files.get(id);
    if (!file) throw Object.assign(new Error("missing"), { status: 404 });
    file.buffer = Buffer.from(buffer);
    file.modifiedTime = new Date().toISOString();
    file.size = buffer.byteLength;
    return { id, name: file.name };
  }

  async readFile(id) {
    const file = this.files.get(id);
    if (!file) throw Object.assign(new Error("missing"), { status: 404 });
    return Buffer.from(file.buffer);
  }

  async deleteFile(id) {
    if (!this.files.delete(id)) {
      throw Object.assign(new Error("missing"), { status: 404 });
    }
  }
}

test("Google Drive image store persists files and manifest without local disk", async () => {
  const client = new FakeDriveClient();
  const store = new GoogleDriveImageStore({
    client,
    folderId: "drive-folder-123",
  });
  let reads = 0;
  const readFile = client.readFile.bind(client);
  client.readFile = async (id) => {
    reads += 1;
    return readFile(id);
  };
  assert.equal(store.driver, "google-drive");

  const buffer = sampleWebp();
  const pending = await store.create({
    buffer,
    label: "访客图片",
    source: "guest",
    published: false,
  });
  assert.equal(pending.published, false);
  assert.equal((await store.list()).length, 0);
  assert.equal((await store.list({ includeUnpublished: true })).length, 1);
  assert.equal((await store.stats()).pending, 1);
  assert.equal(client.files.size, 2);

  await store.update(pending.id, { published: true });
  assert.equal((await store.list()).length, 1);
  const found = await store.get(pending.id);
  assert.equal(found.image.label, "访客图片");
  assert.deepEqual(found.buffer, buffer);
  await store.get(pending.id);
  assert.equal(reads, 1);

  const manifestFile = [...client.files.values()].find(
    (file) => file.name === "profile-card-image-library.json",
  );
  const manifest = JSON.parse(manifestFile.buffer.toString("utf8"));
  assert.equal(manifest.images.length, 1);
  assert.match(manifest.images[0].storageId, /^drive-/);

  assert.equal(await store.remove(pending.id), true);
  assert.equal((await store.list({ includeUnpublished: true })).length, 0);
  assert.equal(
    [...client.files.values()].some((file) => file.name.endsWith(".webp")),
    false,
  );
});

test("Google Drive configuration validates folder ids and selects the driver", () => {
  assert.equal(
    parseGoogleDriveFolderId("https://drive.google.com/drive/folders/abc_123"),
    "abc_123",
  );
  assert.equal(imageStorageDriver({}), "file");
  assert.equal(
    imageStorageDriver({ GOOGLE_DRIVE_FOLDER_ID: "folder-1" }),
    "google-drive",
  );
  assert.equal(
    imageStorageDriver({
      IMAGE_STORAGE_DRIVER: "file",
      GOOGLE_DRIVE_FOLDER_ID: "folder-1",
    }),
    "file",
  );
  const configured = createImageStore({
    env: {
      IMAGE_STORAGE_DRIVER: "google-drive",
      GOOGLE_DRIVE_FOLDER_ID: "folder-1",
      GOOGLE_DRIVE_CLIENT_ID: "client-id",
      GOOGLE_DRIVE_CLIENT_SECRET: "client-secret",
      GOOGLE_DRIVE_REFRESH_TOKEN: "refresh-token",
    },
  });
  assert.equal(configured.driver, "google-drive");
  assert.equal(configured.folderId, "folder-1");
  assert.throws(
    () =>
      createImageStore({
        env: { IMAGE_STORAGE_DRIVER: "unknown" },
      }),
    /Unsupported IMAGE_STORAGE_DRIVER/,
  );
});

test("Google Drive OAuth refresh tokens are cached and refreshed", async () => {
  let tokenCalls = 0;
  const auth = createGoogleDriveAuth(
    {
      GOOGLE_DRIVE_CLIENT_ID: "client-id",
      GOOGLE_DRIVE_CLIENT_SECRET: "client-secret",
      GOOGLE_DRIVE_REFRESH_TOKEN: "refresh-token",
    },
    {
      fetchImpl: async (_url, options) => {
        tokenCalls += 1;
        assert.equal(
          options.body.get("grant_type"),
          "refresh_token",
        );
        assert.equal(
          options.body.get("refresh_token"),
          "refresh-token",
        );
        return new Response(
          JSON.stringify({ access_token: "access-token", expires_in: 3600 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  );
  assert.equal(await auth.getAccessToken(), "access-token");
  assert.equal(await auth.getAccessToken(), "access-token");
  assert.equal(tokenCalls, 1);
  assert.equal(await auth.getAccessToken({ force: true }), "access-token");
  assert.equal(tokenCalls, 2);
});

test("Google Drive migration preserves ids, publishing state and timestamps", async () => {
  const client = new FakeDriveClient();
  const store = new GoogleDriveImageStore({
    client,
    folderId: "drive-folder-123",
  });
  const id = "a2bd0d65-979a-4b1e-8e59-1f88c479d62b";
  const buffer = sampleWebp(800, 1200);
  const created = await store.import({
    id,
    buffer,
    label: "迁移图片",
    source: "admin",
    published: true,
    createdAt: "2026-11-01T08:00:00.000Z",
  });
  assert.equal(created.id, id);
  assert.equal(created.published, true);
  assert.equal(created.createdAt, "2026-11-01T08:00:00.000Z");
  assert.equal(await store.import({
    id,
    buffer,
    label: "重复图片",
    published: true,
  }), null);
  assert.equal((await store.list()).length, 1);
});

test("Google Drive OAuth URL requests offline Drive access with PKCE", () => {
  const authUrl = new URL(
    buildAuthUrl({
      clientId: "client-id",
      redirectUri: "http://127.0.0.1:53682/oauth2callback",
      state: "state-value",
      codeChallenge: "challenge-value",
    }),
  );
  assert.equal(authUrl.origin, "https://accounts.google.com");
  assert.equal(authUrl.searchParams.get("scope"), "https://www.googleapis.com/auth/drive");
  assert.equal(authUrl.searchParams.get("access_type"), "offline");
  assert.equal(authUrl.searchParams.get("prompt"), "consent");
  assert.equal(authUrl.searchParams.get("code_challenge_method"), "S256");
  assert.equal(authUrl.searchParams.get("state"), "state-value");
});
