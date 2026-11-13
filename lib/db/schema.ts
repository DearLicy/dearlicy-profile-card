import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appMeta = sqliteTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  mode: text("mode").notNull().default("public"),
  allowPublicUploads: integer("allow_public_uploads", { mode: "boolean" })
    .notNull()
    .default(false),
  defaultProfileId: text("default_profile_id"),
  repoUrl: text("repo_url").notNull(),
  defaultCardJson: text("default_card_json").notNull().default("{}"),
  storageDriver: text("storage_driver").notNull().default("local"),
  updatedAt: text("updated_at").notNull(),
});

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  login: text("login").notNull().unique(),
  profileUrl: text("profile_url").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  isAllowed: integer("is_allowed", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const profileSnapshots = sqliteTable("profile_snapshots", {
  login: text("login").primaryKey(),
  payloadJson: text("payload_json").notNull(),
  dataTier: text("data_tier").notNull().default("basic"),
  fetchedAt: text("fetched_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  staleUntil: text("stale_until").notNull(),
});

export const githubCredentials = sqliteTable("github_credentials", {
  id: integer("id").primaryKey(),
  tokenCipher: text("token_cipher"),
  status: text("status").notNull().default("anonymous"),
  statusMessage: text("status_message").notNull().default(""),
  lastTestedAt: text("last_tested_at").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
});

export const googleDriveCredentials = sqliteTable("google_drive_credentials", {
  id: integer("id").primaryKey(),
  clientId: text("client_id").notNull().default(""),
  secretCipher: text("secret_cipher"),
  refreshTokenCipher: text("refresh_token_cipher"),
  folderId: text("folder_id").notNull().default(""),
  accountEmail: text("account_email").notNull().default(""),
  connectedAt: text("connected_at").notNull().default(""),
  status: text("status").notNull().default("disconnected"),
  statusMessage: text("status_message").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
});

export const imageCategories = sqliteTable("image_categories", {
  slug: text("slug").primaryKey(),
  label: text("label").notNull(),
  builtIn: integer("built_in", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const images = sqliteTable("images", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  categorySlug: text("category_slug").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  bytes: integer("bytes").notNull(),
  mime: text("mime").notNull().default("image/webp"),
  source: text("source").notNull(),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  storageDriver: text("storage_driver").notNull(),
  storageKey: text("storage_key").notNull(),
  sha256: text("sha256").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: integer("reset_at").notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(),
  detailJson: text("detail_json").notNull().default("{}"),
  ipHash: text("ip_hash").notNull().default(""),
  createdAt: text("created_at").notNull(),
});
