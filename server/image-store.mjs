import { randomUUID } from "node:crypto";
import {
  chmod,
  mkdir,
  open,
  readFile,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";

export const MAX_IMAGE_BYTES = 1_000_000;
export const MAX_LIBRARY_IMAGES = 500;
export const IMAGE_MIME = "image/webp";
export const IMAGE_CATEGORIES = Object.freeze({
  photo: { label: "写真" },
  anime: { label: "动漫" },
});
export const DEFAULT_IMAGE_CATEGORY = "photo";

const WEBP_CHUNKS = new Set(["VP8 ", "VP8L", "VP8X"]);
const IMAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function imageError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function manifestPath(dataDir) {
  return path.join(dataDir, "image-library.json");
}

function imagesDir(dataDir) {
  return path.join(dataDir, "images");
}

function imagePath(dataDir, id) {
  return path.join(imagesDir(dataDir), `${id}.webp`);
}

export function cleanLabel(value, fallback) {
  const label = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return label || fallback;
}

export function validId(value) {
  const id = String(value ?? "").trim().toLowerCase();
  return IMAGE_ID.test(id) ? id : "";
}

export function normalizeImageCategory(value, fallback = DEFAULT_IMAGE_CATEGORY) {
  const category = String(value ?? "").trim().toLowerCase();
  return Object.hasOwn(IMAGE_CATEGORIES, category) ? category : fallback;
}

export function publicEntry(entry) {
  return {
    id: entry.id,
    label: entry.label,
    category: normalizeImageCategory(entry.category),
    mime: entry.mime,
    bytes: entry.bytes,
    width: entry.width,
    height: entry.height,
    published: Boolean(entry.published),
    source: entry.source,
    createdAt: entry.createdAt,
  };
}

export function normalizeEntry(input) {
  if (!input || typeof input !== "object") return null;
  const id = validId(input.id);
  const width = Number(input.width);
  const height = Number(input.height);
  const bytes = Number(input.bytes);
  if (
    !id ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(bytes)
  ) {
    return null;
  }
  return {
    id,
    label: cleanLabel(input.label, "未命名图片"),
    category: normalizeImageCategory(input.category),
    mime: IMAGE_MIME,
    bytes,
    width,
    height,
    source: input.source === "admin" ? "admin" : "guest",
    published: Boolean(input.published),
    createdAt: String(input.createdAt || "").slice(0, 40),
    storageId: String(input.storageId || "").trim().slice(0, 200),
  };
}

export function normalizeManifest(input) {
  const entries = Array.isArray(input?.images) ? input.images : [];
  return {
    version: 1,
    images: entries.map(normalizeEntry).filter(Boolean),
  };
}

export function emptyManifest() {
  return { version: 1, images: [] };
}

export function parseWebpDimensions(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.byteLength < 30) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buffer.toString("ascii", 8, 12) !== "WEBP") return null;

  let offset = 12;
  while (offset + 8 <= buffer.byteLength) {
    const chunk = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const payload = offset + 8;
    if (!WEBP_CHUNKS.has(chunk)) {
      offset = payload + size + (size % 2);
      continue;
    }
    if (payload + size > buffer.byteLength) return null;

    if (chunk === "VP8X" && size >= 10) {
      return {
        width: 1 + buffer.readUIntLE(payload + 4, 3),
        height: 1 + buffer.readUIntLE(payload + 7, 3),
      };
    }
    if (chunk === "VP8 " && size >= 10) {
      if (
        buffer[payload + 3] !== 0x9d ||
        buffer[payload + 4] !== 0x01 ||
        buffer[payload + 5] !== 0x2a
      ) {
        return null;
      }
      return {
        width: buffer.readUInt16LE(payload + 6) & 0x3fff,
        height: buffer.readUInt16LE(payload + 8) & 0x3fff,
      };
    }
    if (chunk === "VP8L" && size >= 5 && buffer[payload] === 0x2f) {
      const bits = buffer.readUInt32LE(payload + 1);
      return {
        width: 1 + (bits & 0x3fff),
        height: 1 + ((bits >> 14) & 0x3fff),
      };
    }
    return null;
  }
  return null;
}

export function validateImageBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.byteLength) {
    throw imageError("图片内容为空。", 400);
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw imageError("图片超过 1 MB 上限。", 413);
  }
  const dimensions = parseWebpDimensions(buffer);
  if (!dimensions?.width || !dimensions?.height) {
    throw imageError("只接受浏览器压缩后的 WebP 图片。", 415);
  }
  return dimensions;
}

export function makeImageEntry({
  id = randomUUID(),
  buffer,
  label = "",
  category = DEFAULT_IMAGE_CATEGORY,
  source = "guest",
  published = false,
  storageId = "",
}) {
  const dimensions = validateImageBuffer(buffer);
  return {
    id,
    label: cleanLabel(label, `图片 ${new Date().toLocaleString("zh-CN")}`),
    category: normalizeImageCategory(category),
    mime: IMAGE_MIME,
    bytes: buffer.byteLength,
    width: dimensions.width,
    height: dimensions.height,
    source: source === "admin" ? "admin" : "guest",
    published: Boolean(published),
    createdAt: new Date().toISOString(),
    storageId,
  };
}

export function imageStats(images) {
  const categories = Object.fromEntries(
    Object.keys(IMAGE_CATEGORIES).map((key) => [
      key,
      { total: 0, published: 0, pending: 0, bytes: 0 },
    ]),
  );
  for (const image of images) {
    const category = normalizeImageCategory(image.category);
    categories[category].total += 1;
    categories[category].bytes += Number(image.bytes) || 0;
    if (image.published) categories[category].published += 1;
    else categories[category].pending += 1;
  }
  return {
    total: images.length,
    published: images.filter((image) => image.published).length,
    pending: images.filter((image) => !image.published).length,
    bytes: images.reduce((sum, image) => sum + image.bytes, 0),
    maxBytes: MAX_IMAGE_BYTES,
    capacity: MAX_LIBRARY_IMAGES,
    categories,
  };
}

async function readManifest(filePath) {
  try {
    const raw = JSON.parse(await readFile(filePath, "utf8"));
    return normalizeManifest(raw);
  } catch (error) {
    if (error?.code === "ENOENT") return emptyManifest();
    throw error;
  }
}

async function writeManifest(filePath, manifest) {
  const directory = path.dirname(filePath);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const handle = await open(temporary, "w", 0o600);
  try {
    await handle.writeFile(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporary, filePath);
  await chmod(filePath, 0o600);
}

async function writeImageFile(filePath, buffer) {
  const directory = path.dirname(filePath);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const handle = await open(temporary, "w", 0o600);
  try {
    await handle.writeFile(buffer);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporary, filePath);
  await chmod(filePath, 0o600);
}

export class FileImageStore {
  constructor({ dataDir }) {
    this.dataDir = dataDir;
    this.filePath = manifestPath(dataDir);
    this.loaded = null;
    this.writeQueue = Promise.resolve();
  }

  async load() {
    if (!this.loaded) this.loaded = await readManifest(this.filePath);
    return this.loaded;
  }

  resetCache() {
    this.loaded = null;
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
    if (!entry || (!entry.published && !includeUnpublished)) return null;
    try {
      const buffer = await readFile(imagePath(this.dataDir, normalized));
      if (!buffer.byteLength || buffer.byteLength !== entry.bytes) return null;
      return { image: publicEntry(entry), buffer };
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  }

  async create({
    buffer,
    label = "",
    category = DEFAULT_IMAGE_CATEGORY,
    source = "guest",
    published = false,
  } = {}) {
    const manifest = await this.load();
    if (manifest.images.length >= MAX_LIBRARY_IMAGES) {
      throw imageError(`图片库最多保存 ${MAX_LIBRARY_IMAGES} 张图片。`, 409);
    }
    const id = randomUUID();
    const entry = makeImageEntry({
      id,
      buffer,
      label,
      category,
      source,
      published,
    });
    await writeImageFile(imagePath(this.dataDir, id), buffer);
    try {
      await this.enqueue(async () => {
        const current = await this.load();
        current.images.push(entry);
        await writeManifest(this.filePath, current);
      });
    } catch (error) {
      await unlink(imagePath(this.dataDir, id)).catch(() => undefined);
      throw error;
    }
    return publicEntry(entry);
  }

  async update(id, { published, label, category } = {}) {
    const normalized = validId(id);
    if (!normalized) return null;
    let updated = null;
    await this.enqueue(async () => {
      const manifest = await this.load();
      const entry = manifest.images.find((image) => image.id === normalized);
      if (!entry) return;
      const previous = {
        published: entry.published,
        label: entry.label,
        category: entry.category,
      };
      if (typeof published === "boolean") entry.published = published;
      if (label !== undefined) {
        entry.label = cleanLabel(label, entry.label);
      }
      if (category !== undefined) {
        entry.category = normalizeImageCategory(category, entry.category);
      }
      updated = publicEntry(entry);
      try {
        await writeManifest(this.filePath, manifest);
      } catch (error) {
        Object.assign(entry, previous);
        updated = null;
        throw error;
      }
    });
    return updated;
  }

  async remove(id) {
    const normalized = validId(id);
    if (!normalized) return false;
    let removed = false;
    await this.enqueue(async () => {
      const manifest = await this.load();
      const index = manifest.images.findIndex((image) => image.id === normalized);
      if (index < 0) return;
      manifest.images.splice(index, 1);
      await writeManifest(this.filePath, manifest);
      removed = true;
    });
    if (removed) {
      await unlink(imagePath(this.dataDir, normalized)).catch(() => undefined);
    }
    return removed;
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
