import { normalizeGitHubLogin } from "./github.js";
import {
  normalizeSiteConfig,
  profileAllowed,
} from "./site-config.js";

export class ProfileAccessError extends Error {
  constructor(login) {
    super(`Profile "${login}" is not enabled on this instance`);
    this.name = "ProfileAccessError";
    this.login = login;
  }
}

function fallbackSite(env) {
  return normalizeSiteConfig({
    mode: env.SITE_MODE,
    defaultUsername: env.DEFAULT_USERNAME || "DearLicy",
    repoUrl: env.PUBLIC_REPO_URL,
  });
}

async function loadSite(env) {
  if (!env.SITE_STORE) return fallbackSite(env);
  try {
    return await env.SITE_STORE.getPublicConfig();
  } catch (error) {
    console.error("Unable to load persisted site configuration", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return fallbackSite(env);
  }
}

async function loadSecrets(env) {
  if (!env.SITE_STORE?.getSecrets) return {};
  try {
    return await env.SITE_STORE.getSecrets();
  } catch (error) {
    console.error("Unable to unlock stored GitHub credentials", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return {};
  }
}

export async function createRuntime(env) {
  const [site, secrets] = await Promise.all([loadSite(env), loadSecrets(env)]);
  const environmentToken = String(env.GITHUB_TOKEN || "");
  const githubToken = secrets.githubToken || environmentToken;
  return {
    site,
    secrets,
    env: {
      ...env,
      GITHUB_TOKEN: githubToken,
      GITHUB_TOKEN_FROM_ENV: environmentToken,
    },
  };
}

export function requestedLogin(url, site) {
  const input =
    url.searchParams.get("username") ||
    url.searchParams.get("user") ||
    url.searchParams.get("url");
  return input ? normalizeGitHubLogin(input) : site.defaultUsername;
}

export function enforceProfileAccess(site, login) {
  if (!profileAllowed(site, login)) throw new ProfileAccessError(login);
}
