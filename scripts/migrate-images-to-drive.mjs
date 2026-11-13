#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvironment, ROOT } from "../server/environment.mjs";
import { createImageStore } from "../server/image-store-factory.mjs";
import { FileImageStore } from "../server/image-store.mjs";

async function main() {
  await loadEnvironment(ROOT);
  const sourceDir = path.resolve(
    process.env.MIGRATE_SOURCE_DATA_DIR ||
      process.env.DATA_DIR ||
      path.join(ROOT, "data"),
  );
  const source = new FileImageStore({ dataDir: sourceDir });
  const target = createImageStore({
    dataDir: sourceDir,
    env: {
      ...process.env,
      IMAGE_STORAGE_DRIVER: "google-drive",
    },
  });
  if (target.driver !== "google-drive") {
    throw new Error("目标存储不是 Google Drive，已停止迁移。");
  }

  const images = await source.list({ includeUnpublished: true });
  if (!images.length) {
    console.log(`本地图片库为空：${path.join(sourceDir, "images")}`);
    return;
  }
  let copied = 0;
  let skipped = 0;
  for (const image of images) {
    const found = await source.get(image.id, { includeUnpublished: true });
    if (!found) {
      console.warn(`跳过缺失文件：${image.id}`);
      skipped += 1;
      continue;
    }
    const imported = await target.import({
      id: found.image.id,
      buffer: found.buffer,
      label: found.image.label,
      source: found.image.source,
      published: found.image.published,
      createdAt: found.image.createdAt,
    });
    if (imported) {
      copied += 1;
      console.log(`已迁移 ${imported.id} (${imported.bytes} bytes)`);
    } else {
      skipped += 1;
      console.log(`已存在，跳过 ${image.id}`);
    }
  }
  console.log(`迁移完成：复制 ${copied} 张，跳过 ${skipped} 张。`);
  console.log("本地文件未删除；确认 Drive 图片库正常后再清理。");
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
