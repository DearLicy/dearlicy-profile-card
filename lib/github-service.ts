import "server-only";

import {
  fetchProfileData,
  normalizeGitHubLogin,
  ProfileInputError,
  ProfileNotFoundError,
} from "@/src/github.js";

import { getDb } from "@/lib/db";
import { openSecret, sealSecret } from "@/lib/crypto";
import { getSiteConfig, profileAllowed } from "@/lib/site";

const FRESH_TTL_MS = 5 * 60 * 1000;
const STALE_TTL_MS = 24 * 60 * 60 * 1000;
const REFRESH_COOLDOWN_MS = 20 * 1000;
const inFlight = new Map<string, Promise<ProfileResult>>();

export class ProfileAccessError extends Error {
  status = 403;
  code = "PROFILE_NOT_ALLOWED";
  constructor(login: string) {
    super(`这个实例没有开放 GitHub 用户 ${login}。`);
    this.name = "ProfileAccessError";
  }
}

export type ProfileData = {
  login: string;
  displayName: string;
  avatarDataUri: string | null;
  stars: number;
  repositories: number;
  followers: number;
  contributions: number;
  languages: Array<{ name: string; bytes: number; color: string }>;
  totalLanguageBytes: number;
  topRepositories: Array<{ name: string; stars: number }>;
  rank: { level: string; score: number; percentile: number };
  fetchedAt: Date;
  dataTier: "basic" | "full";
};

export type ProfileResult = {
  profile: ProfileData;
  cached: boolean;
  stale: boolean;
  ageSeconds: number;
  warning?: string;
};

type SnapshotRow = {
  payload_json: string;
  fetched_at: string;
  expires_at: string;
  stale_until: string;
};

export function getGitHubToken() {
  const row = getDb()
    .sqlite.prepare(
      "SELECT token_cipher FROM github_credentials WHERE id = 1",
    )
    .get() as { token_cipher?: string | null } | undefined;
  return openSecret(row?.token_cipher);
}

export function getGitHubCredentialStatus() {
  const row = getDb()
    .sqlite.prepare(
      "SELECT status, status_message, last_tested_at FROM github_credentials WHERE id = 1",
    )
    .get() as {
    status: string;
    status_message: string;
    last_tested_at: string;
  };
  const token = getGitHubToken();
  return {
    hasToken: Boolean(token),
    mode: token ? ("token" as const) : ("anonymous" as const),
    status: row.status,
    message: row.status_message,
    lastTestedAt: row.last_tested_at,
  };
}

export function saveGitHubToken(token: string) {
  const normalized = String(token || "").trim();
  if (normalized && !/^(?:github_pat_|gh[pousr]_)[A-Za-z0-9_]{20,}$/.test(normalized)) {
    throw Object.assign(new Error("GitHub Token 格式不正确。"), { status: 400 });
  }
  const now = new Date().toISOString();
  getDb()
    .sqlite.prepare(
      `UPDATE github_credentials SET
       token_cipher = ?,
       status = ?,
       status_message = ?,
       last_tested_at = '',
       updated_at = ?
       WHERE id = 1`,
    )
    .run(
      normalized ? sealSecret(normalized) : "",
      normalized ? "untested" : "anonymous",
      normalized ? "已保存，等待测试" : "使用 GitHub 匿名公开接口",
      now,
    );
  return getGitHubCredentialStatus();
}

function readSnapshot(login: string) {
  const row = getDb()
    .sqlite.prepare(
      "SELECT payload_json, fetched_at, expires_at, stale_until FROM profile_snapshots WHERE login = ?",
    )
    .get(login.toLowerCase()) as SnapshotRow | undefined;
  if (!row) return null;
  try {
    const profile = JSON.parse(row.payload_json) as ProfileData;
    profile.fetchedAt = new Date(profile.fetchedAt);
    return {
      profile,
      fetchedAt: new Date(row.fetched_at),
      expiresAt: new Date(row.expires_at),
      staleUntil: new Date(row.stale_until),
    };
  } catch {
    return null;
  }
}

function saveSnapshot(profile: ProfileData) {
  const now = Date.now();
  const login = profile.login.toLowerCase();
  getDb()
    .sqlite.prepare(
      `INSERT INTO profile_snapshots
       (login, payload_json, data_tier, fetched_at, expires_at, stale_until)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(login) DO UPDATE SET
         payload_json = excluded.payload_json,
         data_tier = excluded.data_tier,
         fetched_at = excluded.fetched_at,
         expires_at = excluded.expires_at,
         stale_until = excluded.stale_until`,
    )
    .run(
      login,
      JSON.stringify(profile),
      profile.dataTier,
      new Date(now).toISOString(),
      new Date(now + FRESH_TTL_MS).toISOString(),
      new Date(now + STALE_TTL_MS).toISOString(),
    );
}

async function loadProfile(login: string): Promise<ProfileResult> {
  const profile = (await fetchProfileData(
    { GITHUB_TOKEN: getGitHubToken(), ASSET_HOSTS: "" },
    login,
  )) as ProfileData;
  saveSnapshot(profile);
  return { profile, cached: false, stale: false, ageSeconds: 0 };
}

export async function getProfile(
  loginInput: string,
  { forceRefresh = false }: { forceRefresh?: boolean } = {},
): Promise<ProfileResult> {
  const login = normalizeGitHubLogin(loginInput);
  if (!profileAllowed(login)) throw new ProfileAccessError(login);

  const snapshot = readSnapshot(login);
  const now = Date.now();
  const age = snapshot ? now - snapshot.fetchedAt.getTime() : Infinity;
  const fresh = snapshot && snapshot.expiresAt.getTime() > now;
  const refreshAllowed = forceRefresh && age >= REFRESH_COOLDOWN_MS;
  if (snapshot && (forceRefresh ? !refreshAllowed : fresh)) {
    return {
      profile: snapshot.profile,
      cached: true,
      stale: snapshot.staleUntil.getTime() <= now,
      ageSeconds: Math.max(0, Math.floor(age / 1000)),
    };
  }

  const key = login.toLowerCase();
  if (!inFlight.has(key)) {
    inFlight.set(
      key,
      loadProfile(login).finally(() => {
        inFlight.delete(key);
      }),
    );
  }
  try {
    return await inFlight.get(key)!;
  } catch (error) {
    if (snapshot && snapshot.staleUntil.getTime() > now) {
      return {
        profile: snapshot.profile,
        cached: true,
        stale: true,
        ageSeconds: Math.max(0, Math.floor(age / 1000)),
        warning: error instanceof Error ? error.message : "GitHub 请求失败",
      };
    }
    throw error;
  }
}

export async function testGitHubConnection() {
  const token = getGitHubToken();
  const response = await fetch("https://api.github.com/rate_limit", {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "DearLicy-profile-card",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`GitHub 返回 ${response.status}`);
  }
  const mode = token ? "token" : "anonymous";
  getDb()
    .sqlite.prepare(
      `UPDATE github_credentials SET
       status = 'connected',
       status_message = ?,
       last_tested_at = ?,
       updated_at = ?
       WHERE id = 1`,
    )
    .run(
      `${mode === "token" ? "Token 模式" : "匿名模式"} 可用，剩余 ${payload?.rate?.remaining ?? "未知"} 次请求`,
      new Date().toISOString(),
      new Date().toISOString(),
    );
  return {
    ok: true,
    mode,
    remaining: payload?.rate?.remaining ?? null,
    limit: payload?.rate?.limit ?? null,
  };
}

export function clearProfileCache() {
  inFlight.clear();
  getDb().sqlite.prepare("DELETE FROM profile_snapshots").run();
}

export function publicErrorMessage(error: unknown) {
  if (error instanceof ProfileInputError) {
    return { status: 400, code: "INVALID_USERNAME", message: error.message };
  }
  if (error instanceof ProfileNotFoundError) {
    return { status: 404, code: "PROFILE_NOT_FOUND", message: error.message };
  }
  if (error instanceof ProfileAccessError) {
    return { status: 403, code: "PROFILE_NOT_ALLOWED", message: error.message };
  }
  return {
    status: 503,
    code: "PROFILE_UNAVAILABLE",
    message: "动态数据暂时不可用，请稍后重试。",
  };
}

export function requestedLogin(url: URL) {
  const site = getSiteConfig();
  const input =
    url.searchParams.get("username") ||
    url.searchParams.get("user") ||
    url.searchParams.get("url");
  return input ? normalizeGitHubLogin(input) : site.defaultUsername;
}
