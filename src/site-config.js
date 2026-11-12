import {
  CARD_THEMES,
  DEFAULT_CARD_CONFIG,
  normalizeCardConfig,
} from "./config.js";
import { normalizeGitHubLogin } from "./github.js";

export const DEFAULT_REPO_URL =
  "https://github.com/DearLicy/dearlicy-profile-card";

export const DEFAULT_SITE_CONFIG = Object.freeze({
  mode: "public",
  defaultUsername: "DearLicy",
  allowedUsers: ["DearLicy"],
  repoUrl: DEFAULT_REPO_URL,
  card: DEFAULT_CARD_CONFIG,
  updatedAt: "",
});

function normalizedLoginList(value, fallback = []) {
  const source = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/[\s,]+/)
        .filter(Boolean);
  const logins = [];
  for (const item of source) {
    try {
      const login = normalizeGitHubLogin(item);
      if (!logins.some((entry) => entry.toLowerCase() === login.toLowerCase())) {
        logins.push(login);
      }
    } catch {}
  }
  return logins.length ? logins.slice(0, 50) : fallback.slice(0, 50);
}

function httpsUrl(value, fallback = "") {
  const candidate = String(value || "").trim().slice(0, 500);
  if (!candidate) return fallback;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeSiteConfig(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  let defaultUsername = DEFAULT_SITE_CONFIG.defaultUsername;
  try {
    defaultUsername = normalizeGitHubLogin(
      source.defaultUsername || DEFAULT_SITE_CONFIG.defaultUsername,
    );
  } catch {}
  const allowedUsers = normalizedLoginList(source.allowedUsers, [
    defaultUsername,
  ]);
  if (!allowedUsers.some((login) => login.toLowerCase() === defaultUsername.toLowerCase())) {
    allowedUsers.unshift(defaultUsername);
  }
  return {
    mode: source.mode === "private" ? "private" : "public",
    defaultUsername,
    allowedUsers,
    repoUrl: httpsUrl(source.repoUrl, DEFAULT_REPO_URL),
    card: normalizeCardConfig(source.card || {}),
    updatedAt: String(source.updatedAt || "").slice(0, 40),
  };
}

export function profileAllowed(site, login) {
  if (site.mode === "public") return true;
  return site.allowedUsers.some(
    (allowed) => allowed.toLowerCase() === String(login).toLowerCase(),
  );
}

export function publicSiteConfig(site) {
  return {
    mode: site.mode,
    defaultUsername: site.defaultUsername,
    allowedUsers: site.allowedUsers,
    repoUrl: site.repoUrl,
    card: site.card,
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
