import "server-only";

import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { DEFAULT_REPO_URL, DEFAULT_USERNAME } from "@/lib/constants";
import * as schema from "@/lib/db/schema";

export type AppDatabase = ReturnType<typeof createDatabase>;

function dataDirectory() {
  return process.env.NODE_ENV === "production"
    ? "/data"
    : path.join(process.cwd(), "data");
}

function migrate(sqlite: Database.Database) {
  sqlite.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      mode TEXT NOT NULL DEFAULT 'public',
      allow_public_uploads INTEGER NOT NULL DEFAULT 0,
      default_profile_id TEXT,
      repo_url TEXT NOT NULL,
      default_card_json TEXT NOT NULL DEFAULT '{}',
      storage_driver TEXT NOT NULL DEFAULT 'local',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      login TEXT NOT NULL UNIQUE,
      profile_url TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_allowed INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profile_snapshots (
      login TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      data_tier TEXT NOT NULL DEFAULT 'basic',
      fetched_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      stale_until TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS github_credentials (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      token_cipher TEXT,
      status TEXT NOT NULL DEFAULT 'anonymous',
      status_message TEXT NOT NULL DEFAULT '',
      last_tested_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS google_drive_credentials (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      client_id TEXT NOT NULL DEFAULT '',
      secret_cipher TEXT,
      refresh_token_cipher TEXT,
      folder_id TEXT NOT NULL DEFAULT '',
      account_email TEXT NOT NULL DEFAULT '',
      connected_at TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'disconnected',
      status_message TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS image_categories (
      slug TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      built_in INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      category_slug TEXT NOT NULL REFERENCES image_categories(slug),
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      bytes INTEGER NOT NULL,
      mime TEXT NOT NULL DEFAULT 'image/webp',
      source TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 0,
      storage_driver TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      sha256 TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0,
      reset_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      detail_json TEXT NOT NULL DEFAULT '{}',
      ip_hash TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_images_created ON images(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_images_category ON images(category_slug);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
  `);

  const now = new Date().toISOString();
  sqlite
    .prepare(
      `INSERT OR IGNORE INTO settings
       (id, mode, allow_public_uploads, repo_url, default_card_json, storage_driver, updated_at)
       VALUES (1, 'public', 0, ?, '{}', 'local', ?)`,
    )
    .run(DEFAULT_REPO_URL, now);
  sqlite
    .prepare(
      `INSERT OR IGNORE INTO github_credentials
       (id, status, status_message, last_tested_at, updated_at)
       VALUES (1, 'anonymous', '使用 GitHub 匿名公开接口', '', ?)`,
    )
    .run(now);
  sqlite
    .prepare(
      `INSERT OR IGNORE INTO google_drive_credentials
       (id, status, status_message, updated_at)
       VALUES (1, 'disconnected', '尚未连接 Google Drive', ?)`,
    )
    .run(now);
  sqlite
    .prepare(
      `INSERT OR IGNORE INTO image_categories (slug, label, built_in, sort_order)
       VALUES ('photo', '写真', 1, 0), ('anime', '动漫', 1, 1)`,
    )
    .run();

  const current = sqlite
    .prepare("SELECT default_profile_id AS id FROM settings WHERE id = 1")
    .get() as { id?: string | null } | undefined;
  if (!current?.id) {
    const existing = sqlite
      .prepare("SELECT id FROM profiles ORDER BY created_at LIMIT 1")
      .get() as { id: string } | undefined;
    const id = existing?.id || randomUUID();
    if (!existing) {
      sqlite
        .prepare(
          `INSERT INTO profiles
           (id, login, profile_url, is_default, is_allowed, created_at)
           VALUES (?, ?, ?, 1, 1, ?)`,
        )
        .run(
          id,
          DEFAULT_USERNAME,
          `https://github.com/${DEFAULT_USERNAME}`,
          now,
        );
    }
    sqlite
      .prepare("UPDATE settings SET default_profile_id = ? WHERE id = 1")
      .run(id);
  }
}

export function createDatabase(filePath = path.join(dataDirectory(), "profile-card.sqlite")) {
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const sqlite = new Database(filePath);
  migrate(sqlite);
  return {
    sqlite,
    orm: drizzle(sqlite, { schema }),
    filePath,
  };
}

const globalDatabase = globalThis as typeof globalThis & {
  __profileCardDb?: AppDatabase;
};

export function getDb() {
  if (!globalDatabase.__profileCardDb) {
    globalDatabase.__profileCardDb = createDatabase();
  }
  return globalDatabase.__profileCardDb;
}

export function getDataDirectory() {
  return dataDirectory();
}
