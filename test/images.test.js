import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  MAX_IMAGE_BYTES,
  FileImageStore,
  parseWebpDimensions,
} from "../server/image-store.mjs";

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

test("parses WebP dimensions and persists the image library", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "profile-card-images-"));
  try {
    const buffer = sampleWebp(920, 1360);
    assert.deepEqual(parseWebpDimensions(buffer), { width: 920, height: 1360 });
    const store = new FileImageStore({ dataDir: directory });
    const image = await store.create({
      buffer,
      label: "山景",
      category: "anime",
      source: "guest",
      published: false,
    });

    assert.match(image.id, /^[0-9a-f-]{36}$/);
    assert.equal(image.category, "anime");
    assert.equal(image.published, false);
    assert.equal((await store.list()).length, 0);
    assert.equal((await store.list({ includeUnpublished: true })).length, 1);
    assert.equal(await store.get(image.id), null);
    assert.equal((await store.get(image.id, { includeUnpublished: true })).buffer.length, buffer.length);
    assert.equal((await store.stats()).pending, 1);
    assert.equal((await store.stats()).categories.anime.pending, 1);

    await store.update(image.id, { published: true, category: "photo" });
    assert.equal((await store.list()).length, 1);
    assert.equal((await store.get(image.id)).image.label, "山景");
    assert.equal((await store.get(image.id)).image.category, "photo");
    assert.equal((await store.stats()).published, 1);

    assert.equal(await store.remove(image.id), true);
    assert.equal((await store.list({ includeUnpublished: true })).length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects non-WebP, oversized and missing image content", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "profile-card-images-"));
  try {
    const store = new FileImageStore({ dataDir: directory });
    await assert.rejects(
      store.create({ buffer: Buffer.from("not a webp"), published: true }),
      (error) => error.status === 415,
    );
    await assert.rejects(
      store.create({
        buffer: Buffer.concat([sampleWebp(), Buffer.alloc(MAX_IMAGE_BYTES)]),
        published: true,
      }),
      (error) => error.status === 413,
    );
    await assert.rejects(
      store.create({ buffer: Buffer.alloc(0), published: true }),
      (error) => error.status === 400,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
