import { handleAdminRequest } from "./admin.js";
import { fetchImageDataUri } from "./assets.js";
import { renderProfileCard, renderErrorCard } from "./card.js";
import { configFromSearchParams } from "./config.js";
import {
  normalizeGitHubLogin,
  ProfileInputError,
  ProfileNotFoundError,
} from "./github.js";
import { renderStudioPage } from "./page.js";
import { CACHE_SECONDS, getProfile } from "./profile-service.js";
import {
  normalizeSiteConfig,
  profileAllowed,
  publicSiteConfig,
} from "./site-config.js";

const CARD_CACHE_CONTROL =
  "public, max-age=300, s-maxage=300, stale-while-revalidate=1200, stale-if-error=86400";
const PRIVATE_CARD_CACHE_CONTROL =
  "private, max-age=300, stale-while-revalidate=1200";
const ERROR_CARD_CACHE_CONTROL =
  "public, max-age=60, s-maxage=60, stale-while-revalidate=300";
const BASE_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
const PAGE_CSP =
  "default-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

class ProfileAccessError extends Error {
  constructor(login) {
    super(`Profile "${login}" is not enabled on this instance`);
    this.name = "ProfileAccessError";
    this.login = login;
  }
}

function headers(values = {}) {
  return new Headers({ ...BASE_HEADERS, ...values });
}

function emptyBody(request, body) {
  return request.method === "HEAD" ? null : body;
}

function cacheState(meta) {
  if (meta.stale) return "STALE";
  return meta.cached ? "HIT" : "MISS";
}

function methodNotAllowed(request, allow = "GET, HEAD") {
  return new Response(
    emptyBody(request, JSON.stringify({ error: "METHOD_NOT_ALLOWED" })),
    {
      status: 405,
      headers: headers({
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        Allow: allow,
      }),
    },
  );
}

function notFound(request) {
  return new Response(
    emptyBody(request, JSON.stringify({ error: "NOT_FOUND" })),
    {
      status: 404,
      headers: headers({
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      }),
    },
  );
}

async function runtimeContext(env) {
  let site;
  try {
    site = env.SITE_STORE
      ? await env.SITE_STORE.getPublicConfig()
      : normalizeSiteConfig({
          mode: env.SITE_MODE,
          defaultUsername: env.DEFAULT_USERNAME || "DearLicy",
          repoUrl: env.PUBLIC_REPO_URL,
        });
  } catch (error) {
    console.error("Unable to load persisted site configuration", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    site = normalizeSiteConfig({
      mode: env.SITE_MODE,
      defaultUsername: env.DEFAULT_USERNAME || "DearLicy",
      repoUrl: env.PUBLIC_REPO_URL,
    });
  }

  let secrets = {};
  if (env.SITE_STORE?.getSecrets) {
    try {
      secrets = await env.SITE_STORE.getSecrets();
    } catch (error) {
      console.error("Unable to unlock stored GitHub credentials", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
  const githubToken =
    secrets.oauthToken || secrets.githubToken || env.GITHUB_TOKEN || "";
  return {
    site,
    secrets,
    env: {
      ...env,
      GITHUB_TOKEN: githubToken,
      GITHUB_CLIENT_ID: site.oauthClientId || env.GITHUB_CLIENT_ID || "",
      GITHUB_CLIENT_SECRET:
        secrets.oauthClientSecret || env.GITHUB_CLIENT_SECRET || "",
    },
  };
}

function requestedLogin(url, site) {
  const input =
    url.searchParams.get("username") ||
    url.searchParams.get("user") ||
    url.searchParams.get("url");
  return input ? normalizeGitHubLogin(input) : site.defaultUsername;
}

function enforceAccess(site, login) {
  if (!profileAllowed(site, login)) throw new ProfileAccessError(login);
}

function cardConfig(url, site) {
  return configFromSearchParams(url.searchParams, site.card);
}

async function cardImageContext(config, env, profile) {
  let backgroundSource = "";
  let avatarSource = profile.avatarDataUri;
  if (config.backgroundUrl) {
    backgroundSource =
      (await fetchImageDataUri(config.backgroundUrl, env, {
        maxBytes: 2_000_000,
      })) || config.backgroundUrl;
  }
  if (config.avatarUrl) {
    avatarSource =
      (await fetchImageDataUri(config.avatarUrl, env, {
        maxBytes: 1_500_000,
      })) || config.avatarUrl;
  }
  return {
    profile: { ...profile, avatarDataUri: avatarSource },
    backgroundSource,
  };
}

function summaryPayload(profile, meta) {
  const score = Number(profile.rank.score.toFixed(1));
  return {
    login: profile.login,
    profileUrl: `https://github.com/${profile.login}`,
    stars: profile.stars,
    rank: profile.rank.level,
    score,
    percentile: score,
    repositories: profile.repositories,
    followers: profile.followers,
    contributions: profile.contributions,
    languages: profile.languages.length,
    topRepositories: profile.topRepositories,
    fetchedAt: profile.fetchedAt.toISOString(),
    cached: meta.cached,
    stale: meta.stale,
    cacheAgeSeconds: meta.ageSeconds,
    dataTier: profile.dataTier,
  };
}

function errorCardFor(error, config, login) {
  if (error instanceof ProfileInputError) {
    return renderErrorCard(
      {
        title: "Profile not recognized.",
        message: "Use a GitHub username or a github.com profile URL.",
        detail: "Example: DearLicy or https://github.com/DearLicy",
      },
      config,
    );
  }
  if (error instanceof ProfileNotFoundError) {
    return renderErrorCard(
      {
        title: "GitHub profile not found.",
        message: "Check the username or profile URL, then try again.",
        detail: `Requested profile: ${login}`,
      },
      config,
    );
  }
  if (error instanceof ProfileAccessError) {
    return renderErrorCard(
      {
        title: "This profile is private here.",
        message: "The instance owner has limited this API to selected profiles.",
        detail: "Open the Studio or contact the instance owner.",
      },
      config,
    );
  }
  return renderErrorCard(undefined, config);
}

async function servePage(request, env) {
  const url = new URL(request.url);
  const runtime = await runtimeContext(env);
  let defaultUsername = runtime.site.defaultUsername;
  try {
    defaultUsername = requestedLogin(url, runtime.site);
  } catch {}
  const html = renderStudioPage({
    origin: url.origin,
    defaultUsername,
    mode: runtime.site.mode,
    repoUrl: runtime.site.repoUrl,
    adminAvailable: Boolean(env.SITE_STORE && env.ADMIN_SECRET),
    initialCardConfig: configFromSearchParams(url.searchParams, runtime.site.card),
  });
  return new Response(emptyBody(request, html), {
    headers: headers({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": PAGE_CSP,
      "X-Frame-Options": "DENY",
    }),
  });
}

async function serveCard(request, env, ctx) {
  const url = new URL(request.url);
  const runtime = await runtimeContext(env);
  const config = cardConfig(url, runtime.site);
  const forceRefresh = url.searchParams.get("refresh") === "1";
  let login = "";

  try {
    login = requestedLogin(url, runtime.site);
    enforceAccess(runtime.site, login);
    const meta = await getProfile(runtime.env, ctx, login, { forceRefresh });
    const imageContext = await cardImageContext(config, runtime.env, meta.profile);
    return new Response(
      emptyBody(
        request,
        renderProfileCard(imageContext.profile, config, {
          backgroundDataUri: imageContext.backgroundSource,
        }),
      ),
      {
        headers: headers({
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control":
            runtime.site.mode === "public"
              ? CARD_CACHE_CONTROL
              : PRIVATE_CARD_CACHE_CONTROL,
          "X-Profile-Cache": cacheState(meta),
          "X-Data-Fetched-At": meta.profile.fetchedAt.toISOString(),
          "X-GitHub-Username": meta.profile.login,
          "X-Site-Mode": runtime.site.mode,
        }),
      },
    );
  } catch (error) {
    const isInput = error instanceof ProfileInputError;
    const isMissing = error instanceof ProfileNotFoundError;
    const isAccess = error instanceof ProfileAccessError;
    if (!isInput && !isMissing && !isAccess) {
      console.error("Profile card refresh failed", {
        login,
        message:
          error instanceof Error ? error.message : "Unknown upstream error",
      });
    }
    return new Response(emptyBody(request, errorCardFor(error, config, login)), {
      status: 200,
      headers: headers({
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control":
          isInput || isMissing || isAccess
            ? "no-store"
            : ERROR_CARD_CACHE_CONTROL,
        "X-Profile-Cache": isInput
          ? "INVALID"
          : isMissing
            ? "NOT_FOUND"
            : isAccess
              ? "FORBIDDEN"
              : "ERROR",
        ...(login && !isInput ? { "X-GitHub-Username": login } : {}),
      }),
    });
  }
}

async function serveSummary(request, env, ctx) {
  const url = new URL(request.url);
  const runtime = await runtimeContext(env);
  const forceRefresh = url.searchParams.get("refresh") === "1";
  let login = "";
  try {
    login = requestedLogin(url, runtime.site);
    enforceAccess(runtime.site, login);
    const meta = await getProfile(runtime.env, ctx, login, { forceRefresh });
    return new Response(
      emptyBody(request, JSON.stringify(summaryPayload(meta.profile, meta))),
      {
        headers: headers({
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
          "X-Profile-Cache": cacheState(meta),
          "X-GitHub-Username": meta.profile.login,
        }),
      },
    );
  } catch (error) {
    const isInput = error instanceof ProfileInputError;
    const isMissing = error instanceof ProfileNotFoundError;
    const isAccess = error instanceof ProfileAccessError;
    if (!isInput && !isMissing && !isAccess) {
      console.error("Profile summary refresh failed", {
        login,
        message:
          error instanceof Error ? error.message : "Unknown upstream error",
      });
    }
    const status = isInput ? 400 : isMissing ? 404 : isAccess ? 403 : 503;
    return new Response(
      emptyBody(
        request,
        JSON.stringify({
          error: isInput
            ? "INVALID_USERNAME"
            : isMissing
              ? "PROFILE_NOT_FOUND"
              : isAccess
                ? "PROFILE_NOT_ALLOWED"
                : "PROFILE_UNAVAILABLE",
          message: isInput
            ? error.message
            : isMissing
              ? `找不到 GitHub 用户 “${login}”。`
              : isAccess
                ? "这个实例没有开放该 GitHub 用户的数据接口。"
                : "动态数据暂时不可用，请稍后重试。",
        }),
      ),
      {
        status,
        headers: headers({
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
          ...(status >= 500 ? { "Retry-After": "60" } : {}),
        }),
      },
    );
  }
}

async function servePublicSite(request, env) {
  const runtime = await runtimeContext(env);
  const payload = publicSiteConfig(runtime.site);
  return new Response(
    emptyBody(
      request,
      JSON.stringify({
        ...payload,
        allowedUsers: runtime.site.mode === "public" ? [] : payload.allowedUsers,
        tokenConfigured: Boolean(runtime.env.GITHUB_TOKEN),
        adminAvailable: Boolean(env.SITE_STORE && env.ADMIN_SECRET),
      }),
    ),
    {
      headers: headers({
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      }),
    },
  );
}

async function serveHealth(request, env) {
  const runtime = await runtimeContext(env);
  return new Response(
    emptyBody(
      request,
      JSON.stringify({
        ok: true,
        mode: runtime.site.mode,
        defaultUsername: runtime.site.defaultUsername,
        configured: Boolean(runtime.env.GITHUB_TOKEN),
        dataSource: runtime.env.GITHUB_TOKEN ? "graphql" : "public-rest",
        persisted: Boolean(env.SITE_STORE),
        cacheSeconds: CACHE_SECONDS,
      }),
    ),
    {
      headers: headers({
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      }),
    },
  );
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
      const runtime = await runtimeContext(env);
      return handleAdminRequest(request, runtime.env, ctx, runtime.site);
    }

    if (!["GET", "HEAD"].includes(request.method)) {
      return methodNotAllowed(request);
    }
    if (url.pathname === "/") return servePage(request, env);
    if (
      url.pathname === "/api" ||
      url.pathname === "/api/card" ||
      url.pathname === "/card.svg" ||
      url.pathname === "/profile.svg"
    ) {
      return serveCard(request, env, ctx);
    }
    if (url.pathname === "/api/summary") return serveSummary(request, env, ctx);
    if (url.pathname === "/api/site") return servePublicSite(request, env);
    if (url.pathname === "/api/health" || url.pathname === "/health") {
      return serveHealth(request, env);
    }
    return notFound(request);
  },
};
