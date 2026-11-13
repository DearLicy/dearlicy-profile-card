import "server-only";

import { randomUUID } from "node:crypto";

import {
  CARD_THEMES,
  DEFAULT_CARD_CONFIG,
  normalizeCardConfig,
} from "@/src/config.js";
import { normalizeGitHubLogin } from "@/src/github.js";

import { DEFAULT_REPO_URL, DEFAULT_USERNAME } from "@/lib/constants";
import { getDb } from "@/lib/db";

export type StoredSiteConfig = {
  mode: "public" | "private";
  allowPublicUploads: boolean;
  defaultUsername: string;
  defaultProfileId: string;
  allowedUsers: string[];
  repoUrl: string;
  card: ReturnType<typeof normalizeCardConfig>;
  storageDriver: "local" | "google-drive";
  updatedAt: string;
};

type SettingsRow = {
  mode: string;
  allow_public_uploads: number;
  default_profile_id: string | null;
  repo_url: string;
  default_card_json: string;
  storage_driver: string;
  updated_at: string;
};

function safeUrl(value: string | undefined) {
  const fallback = DEFAULT_REPO_URL;
  try {
    const parsed = new URL(String(value || ""));
    return parsed.protocol === "https:" ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function getSiteConfig(): StoredSiteConfig {
  const db = getDb().sqlite;
  const row = db
    .prepare("SELECT * FROM settings WHERE id = 1")
    .get() as SettingsRow;
  const profiles = db
    .prepare("SELECT login, is_allowed FROM profiles ORDER BY created_at")
    .all() as Array<{ login: string; is_allowed: number }>;
  const defaultProfile = db
    .prepare("SELECT login FROM profiles WHERE id = ?")
    .get(row?.default_profile_id) as { login: string } | undefined;
  let cardDefaults = DEFAULT_CARD_CONFIG;
  try {
    cardDefaults = normalizeCardConfig(
      JSON.parse(String(row?.default_card_json || "{}")),
    );
  } catch {}
  return {
    mode: row?.mode === "private" ? "private" : "public",
    allowPublicUploads: Boolean(row?.allow_public_uploads),
    defaultUsername: defaultProfile?.login || DEFAULT_USERNAME,
    defaultProfileId: row?.default_profile_id || "",
    allowedUsers: profiles
      .filter((profile) => Boolean(profile.is_allowed))
      .map((profile) => profile.login),
    repoUrl: safeUrl(row?.repo_url),
    card: cardDefaults,
    storageDriver:
      row?.storage_driver === "google-drive" ? "google-drive" : "local",
    updatedAt: row?.updated_at || "",
  };
}

export function publicSiteConfig() {
  const site = getSiteConfig();
  return {
    mode: site.mode,
    allowPublicUploads: site.allowPublicUploads,
    defaultUsername: site.defaultUsername,
    allowedUsers: site.allowedUsers,
    repoUrl: site.repoUrl,
    card: site.card,
    storageDriver: site.storageDriver,
    themes: Object.fromEntries(
      Object.entries(CARD_THEMES).map(([key, theme]) => [
        key,
        {
          label: theme.label,
          labelZh: theme.labelZh,
          note: theme.note,
          noteZh: theme.noteZh,
          layout: theme.layout,
          dark: theme.dark,
          swatches: theme.swatches,
        },
      ]),
    ),
    updatedAt: site.updatedAt,
  };
}

export function profileAllowed(login: string) {
  const site = getSiteConfig();
  if (site.mode === "public") return true;
  return site.allowedUsers.some(
    (allowed) => allowed.toLowerCase() === login.toLowerCase(),
  );
}

export function updateSiteSettings(input: {
  mode?: string;
  allowPublicUploads?: boolean;
  defaultUsername?: string;
  repoUrl?: string;
  card?: unknown;
  storageDriver?: string;
}) {
  const current = getSiteConfig();
  const db = getDb().sqlite;
  let defaultUsername = current.defaultUsername;
  if (input.defaultUsername !== undefined) {
    defaultUsername = normalizeGitHubLogin(input.defaultUsername);
  }
  const profile = db
    .prepare("SELECT id FROM profiles WHERE lower(login) = lower(?)")
    .get(defaultUsername) as { id: string } | undefined;
  const defaultProfileId = profile?.id || current.defaultProfileId;
  if (!profile) {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO profiles
       (id, login, profile_url, is_default, is_allowed, created_at)
       VALUES (?, ?, ?, 1, 1, ?)`,
    ).run(
      id,
      defaultUsername,
      `https://github.com/${defaultUsername}`,
      new Date().toISOString(),
    );
    db.prepare("UPDATE settings SET default_profile_id = ? WHERE id = 1").run(id);
  }
  const nextMode =
    input.mode === undefined
      ? current.mode
      : input.mode === "private"
        ? "private"
        : "public";
  const nextCard = normalizeCardConfig(
    input.card && typeof input.card === "object" ? input.card : current.card,
  );
  const storageDriver =
    input.storageDriver === "google-drive"
      ? "google-drive"
      : input.storageDriver === "local"
        ? "local"
        : current.storageDriver;
  const updatedAt = new Date().toISOString();
  db.prepare(
    `UPDATE settings SET
      mode = ?,
      allow_public_uploads = ?,
      default_profile_id = ?,
      repo_url = ?,
      default_card_json = ?,
      storage_driver = ?,
      updated_at = ?
     WHERE id = 1`,
  ).run(
    nextMode,
    Number(input.allowPublicUploads ?? current.allowPublicUploads),
    profile?.id || defaultProfileId || null,
    safeUrl(input.repoUrl ?? current.repoUrl),
    JSON.stringify(nextCard),
    storageDriver,
    updatedAt,
  );
  db.prepare("UPDATE profiles SET is_default = 0").run();
  db.prepare("UPDATE profiles SET is_default = 1 WHERE id = ?").run(
    profile?.id || defaultProfileId || "",
  );
  return getSiteConfig();
}

export function themeCatalog() {
  return Object.fromEntries(
    Object.entries(CARD_THEMES).map(([key, theme]) => [
      key,
      {
        label: theme.label,
        labelZh: theme.labelZh,
        note: theme.note,
        noteZh: theme.noteZh,
        layout: theme.layout,
        dark: theme.dark,
        swatches: theme.swatches,
      },
    ]),
  );
}
