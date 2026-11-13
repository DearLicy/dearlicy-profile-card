import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  MAX_IMAGE_BYTES,
  MAX_LIBRARY_IMAGES,
} from "@/lib/constants";
import { getDataDirectory, getDb } from "@/lib/db";
import {
  deleteDriveImage,
  getDriveSettings,
  readDriveImage,
  uploadDriveImage,
} from "@/lib/google-drive";
import { getSiteConfig } from "@/lib/site";

const IMAGE_ID = /^[0-9a-f-]{36}$/i;
const WEBP_CHUNKS = new Set(["VP8 ", "VP8L", "VP8X"]);

export type ImageRecord = {
  id: string;
  label: string;
  category: string;
  categoryLabel: string;
  width: number;
  height: number;
  bytes: number;
  mime: string;
  source: "admin" | "guest";
  published: boolean;
  storageDriver: "local" | "google-drive";
  storageKey: string;
  createdAt: string;
  updatedAt: string;
};

type ImageRow = {
  id: string;
  label: string;
  category_slug: string;
  category_label: string;
  width: number;
  height: number;
  bytes: number;
  mime: string;
  source: string;
  published: number;
  storage_driver: string;
  storage_key: string;
  created_at: string;
  updated_at: string;
};

export type ImageCategory = {
  slug: string;
  label: string;
  builtIn: boolean;
  sortOrder: number;
  count?: number;
};

function cleanLabel(value: string, fallback: string) {
  return (
    String(value || "")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || fallback
  );
}

function normalizeCategory(value?: string) {
  const categories = listCategories();
  return categories.some((category) => category.slug === value)
    ? String(value)
    : categories[0]?.slug || "photo";
}

export function validImageId(value: string) {
  return IMAGE_ID.test(String(value || "")) ? String(value) : "";
}

export function parseWebpDimensions(buffer: Buffer) {
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

export function validateImageBuffer(buffer: Buffer) {
  if (!buffer.byteLength) {
    throw Object.assign(new Error("图片内容为空。"), { status: 400 });
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw Object.assign(new Error("图片超过 1 MB 上限。"), { status: 413 });
  }
  const dimensions = parseWebpDimensions(buffer);
  if (!dimensions?.width || !dimensions?.height) {
    throw Object.assign(new Error("只接受浏览器压缩后的 WebP 图片。"), {
      status: 415,
    });
  }
  return dimensions;
}

function mapImage(row: ImageRow): ImageRecord {
  return {
    id: row.id,
    label: row.label,
    category: row.category_slug,
    categoryLabel: row.category_label,
    width: row.width,
    height: row.height,
    bytes: row.bytes,
    mime: row.mime,
    source: row.source === "admin" ? "admin" : "guest",
    published: Boolean(row.published),
    storageDriver:
      row.storage_driver === "google-drive" ? "google-drive" : "local",
    storageKey: row.storage_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listCategories(withCounts = false): ImageCategory[] {
  const rows = getDb()
    .sqlite.prepare(
      `SELECT c.slug, c.label, c.built_in, c.sort_order,
       ${withCounts ? "(SELECT COUNT(*) FROM images i WHERE i.category_slug = c.slug)" : "0"} AS count
       FROM image_categories c ORDER BY c.sort_order, c.label`,
    )
    .all() as Array<{
    slug: string;
    label: string;
    built_in: number;
    sort_order: number;
    count: number;
  }>;
  return rows.map((row) => ({
    slug: row.slug,
    label: row.label,
    builtIn: Boolean(row.built_in),
    sortOrder: row.sort_order,
    count: Number(row.count),
  }));
}

export function addCategory(labelInput: string) {
  const label = cleanLabel(labelInput, "");
  if (!label) {
    throw Object.assign(new Error("分类名称不能为空。"), { status: 400 });
  }
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const candidate = slug || `category-${randomUUID().slice(0, 6)}`;
  if (listCategories().some((category) => category.slug === candidate)) {
    throw Object.assign(new Error("这个分类已经存在。"), { status: 409 });
  }
  const sortOrder =
    (getDb()
      .sqlite.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS value FROM image_categories")
      .get() as { value: number }).value || 0;
  getDb()
    .sqlite.prepare(
      "INSERT INTO image_categories (slug, label, built_in, sort_order) VALUES (?, ?, 0, ?)",
    )
    .run(candidate, label, sortOrder);
  return listCategories().find((category) => category.slug === candidate)!;
}

export function updateCategory(slug: string, labelInput: string) {
  const label = cleanLabel(labelInput, "");
  if (!label) {
    throw Object.assign(new Error("分类名称不能为空。"), { status: 400 });
  }
  const result = getDb()
    .sqlite.prepare("UPDATE image_categories SET label = ? WHERE slug = ?")
    .run(label, slug);
  if (!result.changes) return null;
  return listCategories().find((category) => category.slug === slug) || null;
}

export function removeCategory(slug: string) {
  const category = listCategories(true).find((entry) => entry.slug === slug);
  if (!category) return false;
  if (category.builtIn) {
    throw Object.assign(new Error("内置分类不能删除。"), { status: 409 });
  }
  if (category.count) {
    throw Object.assign(new Error("分类下仍有图片，不能删除。"), { status: 409 });
  }
  return (
    getDb()
      .sqlite.prepare("DELETE FROM image_categories WHERE slug = ?")
      .run(slug).changes > 0
  );
}

export function listImages(includeUnpublished = false, category?: string) {
  const where = [
    includeUnpublished ? "1 = 1" : "i.published = 1",
    category && category !== "all" ? "i.category_slug = ?" : "1 = 1",
  ];
  const params = category && category !== "all" ? [category] : [];
  const rows = getDb()
    .sqlite.prepare(
      `SELECT i.*, c.label AS category_label
       FROM images i JOIN image_categories c ON c.slug = i.category_slug
       WHERE ${where.join(" AND ")}
       ORDER BY i.created_at DESC`,
    )
    .all(...params) as ImageRow[];
  return rows.map(mapImage);
}

export function getImage(idInput: string, includeUnpublished = false) {
  const id = validImageId(idInput);
  if (!id) return null;
  const row = getDb()
    .sqlite.prepare(
      `SELECT i.*, c.label AS category_label
       FROM images i JOIN image_categories c ON c.slug = i.category_slug
       WHERE i.id = ? ${includeUnpublished ? "" : "AND i.published = 1"}`,
    )
    .get(id) as ImageRow | undefined;
  return row ? mapImage(row) : null;
}

function localImagePath(id: string) {
  return path.join(getDataDirectory(), "images", `${id}.webp`);
}

export async function readImageBytes(image: ImageRecord) {
  if (image.storageDriver === "google-drive") {
    return readDriveImage(image.storageKey);
  }
  return readFile(localImagePath(image.id));
}

export async function createImage(input: {
  buffer: Buffer;
  label: string;
  category: string;
  source: "admin" | "guest";
  published: boolean;
}) {
  const db = getDb().sqlite;
  const count = (
    db.prepare("SELECT COUNT(*) AS count FROM images").get() as { count: number }
  ).count;
  if (count >= MAX_LIBRARY_IMAGES) {
    throw Object.assign(new Error(`图片库最多保存 ${MAX_LIBRARY_IMAGES} 张图片。`), {
      status: 409,
    });
  }
  const dimensions = validateImageBuffer(input.buffer);
  const id = randomUUID();
  const category = normalizeCategory(input.category);
  const driver = getSiteConfig().storageDriver;
  const now = new Date().toISOString();
  let storageKey: string = id;
  if (driver === "google-drive") {
    const settings = getDriveSettings(true);
    if (!settings.refreshToken || !settings.folderId) {
      throw Object.assign(
        new Error("Google Drive 尚未连接，无法写入新图片。"),
        { status: 409 },
      );
    }
    storageKey = await uploadDriveImage(id, input.buffer, settings.folderId);
  } else {
    const filePath = localImagePath(id);
    await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
    await chmod(path.dirname(filePath), 0o700);
    const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, input.buffer, { mode: 0o600 });
    await rename(temporary, filePath);
    await chmod(filePath, 0o600);
  }
  try {
    db.prepare(
      `INSERT INTO images
       (id, label, category_slug, width, height, bytes, mime, source, published,
        storage_driver, storage_key, sha256, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'image/webp', ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      cleanLabel(input.label, "未命名图片"),
      category,
      dimensions.width,
      dimensions.height,
      input.buffer.byteLength,
      input.source,
      Number(input.published),
      driver,
      storageKey,
      createHash("sha256").update(input.buffer).digest("hex"),
      now,
      now,
    );
  } catch (error) {
    if (driver === "google-drive") {
      await deleteDriveImage(storageKey).catch(() => undefined);
    } else {
      await unlink(localImagePath(id)).catch(() => undefined);
    }
    throw error;
  }
  return getImage(id, true)!;
}

export function updateImage(
  id: string,
  patch: {
    label?: string;
    category?: string;
    published?: boolean;
    publishMany?: boolean;
  },
) {
  const image = getImage(id, true);
  if (!image) return null;
  const nextLabel =
    patch.label === undefined ? image.label : cleanLabel(patch.label, image.label);
  const nextCategory =
    patch.category === undefined ? image.category : normalizeCategory(patch.category);
  const nextPublished =
    patch.published === undefined ? image.published : Boolean(patch.published);
  getDb()
    .sqlite.prepare(
      `UPDATE images SET label = ?, category_slug = ?, published = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      nextLabel,
      nextCategory,
      Number(nextPublished),
      new Date().toISOString(),
      id,
    );
  return getImage(id, true);
}

export async function deleteImage(id: string) {
  const image = getImage(id, true);
  if (!image) return false;
  if (image.storageDriver === "google-drive") {
    await deleteDriveImage(image.storageKey);
  } else {
    await unlink(localImagePath(image.id)).catch(() => undefined);
  }
  getDb().sqlite.prepare("DELETE FROM images WHERE id = ?").run(image.id);
  return true;
}

export async function migrateImageToDrive(id: string) {
  const image = getImage(id, true);
  if (!image) return null;
  if (image.storageDriver === "google-drive") return image;
  const settings = getDriveSettings(true);
  if (!settings.folderId || !settings.refreshToken) {
    throw Object.assign(new Error("Google Drive 尚未连接。"), { status: 409 });
  }
  const buffer = await readImageBytes(image);
  const driveId = await uploadDriveImage(image.id, buffer, settings.folderId);
  try {
    getDb()
      .sqlite.prepare(
        "UPDATE images SET storage_driver = 'google-drive', storage_key = ?, updated_at = ? WHERE id = ?",
      )
      .run(driveId, new Date().toISOString(), image.id);
  } catch (error) {
    await deleteDriveImage(driveId).catch(() => undefined);
    throw error;
  }
  await unlink(localImagePath(image.id)).catch(() => undefined);
  return getImage(image.id, true);
}

export function imageStats() {
  const rows = listImages(true);
  const categories = Object.fromEntries(
    listCategories().map((category) => [category.slug, 0]),
  );
  for (const image of rows) categories[image.category] = (categories[image.category] || 0) + 1;
  return {
    total: rows.length,
    published: rows.filter((image) => image.published).length,
    pending: rows.filter((image) => !image.published).length,
    bytes: rows.reduce((sum, image) => sum + image.bytes, 0),
    categories,
  };
}
