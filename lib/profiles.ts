import "server-only";

import { randomUUID } from "node:crypto";

import { normalizeGitHubLogin } from "@/src/github.js";

import { getDb } from "@/lib/db";
import { getSiteConfig } from "@/lib/site";

export type ProfileRecord = {
  id: string;
  login: string;
  profileUrl: string;
  isDefault: boolean;
  isAllowed: boolean;
  createdAt: string;
};

type ProfileRow = {
  id: string;
  login: string;
  profile_url: string;
  is_default: number;
  is_allowed: number;
  created_at: string;
};

function mapProfile(row: ProfileRow): ProfileRecord {
  return {
    id: row.id,
    login: row.login,
    profileUrl: row.profile_url,
    isDefault: Boolean(row.is_default),
    isAllowed: Boolean(row.is_allowed),
    createdAt: row.created_at,
  };
}

export function listProfiles() {
  return (
    getDb()
      .sqlite.prepare("SELECT * FROM profiles ORDER BY is_default DESC, created_at")
      .all() as ProfileRow[]
  ).map(mapProfile);
}

export function addProfile(input: string) {
  const login = normalizeGitHubLogin(input);
  const db = getDb().sqlite;
  const existing = db
    .prepare("SELECT * FROM profiles WHERE lower(login) = lower(?)")
    .get(login) as ProfileRow | undefined;
  if (existing) return mapProfile(existing);
  const id = randomUUID();
  db.prepare(
    `INSERT INTO profiles
     (id, login, profile_url, is_default, is_allowed, created_at)
     VALUES (?, ?, ?, 0, 1, ?)`,
  ).run(id, login, `https://github.com/${login}`, new Date().toISOString());
  return mapProfile(
    db.prepare("SELECT * FROM profiles WHERE id = ?").get(id) as ProfileRow,
  );
}

export function updateProfile(
  id: string,
  patch: { isAllowed?: boolean; isDefault?: boolean },
) {
  const db = getDb().sqlite;
  const profile = db
    .prepare("SELECT * FROM profiles WHERE id = ?")
    .get(id) as ProfileRow | undefined;
  if (!profile) return null;
  if (patch.isAllowed !== undefined) {
    db.prepare("UPDATE profiles SET is_allowed = ? WHERE id = ?").run(
      Number(patch.isAllowed),
      id,
    );
  }
  if (patch.isDefault) {
    db.prepare("UPDATE profiles SET is_default = 0").run();
    db.prepare("UPDATE profiles SET is_default = 1, is_allowed = 1 WHERE id = ?").run(
      id,
    );
    db.prepare("UPDATE settings SET default_profile_id = ? WHERE id = 1").run(id);
  }
  return listProfiles().find((entry) => entry.id === id) || null;
}

export function removeProfile(id: string) {
  const site = getSiteConfig();
  if (site.defaultProfileId === id) {
    throw Object.assign(new Error("默认主页不能直接删除，请先设置另一个默认主页。"), {
      status: 409,
    });
  }
  return getDb().sqlite.prepare("DELETE FROM profiles WHERE id = ?").run(id)
    .changes > 0;
}

export function allowedProfiles() {
  return listProfiles().filter((profile) => profile.isAllowed);
}
