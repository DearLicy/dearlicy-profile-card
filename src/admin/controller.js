import { clearAssetCache } from "../assets.js";
import { fetchProfileData } from "../github.js";
import { clearProfileCache } from "../profile-service.js";
import {
  normalizeSiteConfig,
  publicSiteConfig,
} from "../site-config.js";
import {
  adminJsonResponse,
  readAdminJson,
} from "./http.js";
import {
  clientAddress,
  loginLimited,
  registerLoginFailure,
  resetLoginFailures,
  safeEqual,
  sameOrigin,
  validGitHubToken,
} from "./request.js";
import {
  createSession,
  sessionCookie,
} from "./session.js";

function adminSecret(env) {
  return String(env.ADMIN_SECRET || "");
}

function githubStatus(env, secrets) {
  const source = secrets?.githubToken
    ? "stored"
    : env.GITHUB_TOKEN_FROM_ENV
      ? "environment"
      : "";
  return {
    configured: Boolean(secrets?.githubToken || env.GITHUB_TOKEN_FROM_ENV),
    source,
    hasStoredToken: Boolean(secrets?.githubToken),
  };
}

export async function dashboardPayload(env, store, site) {
  const [secrets, storeStatus] = store
    ? await Promise.all([store.getSecrets(), store.status()])
    : [{}, {}];
  return {
    site: publicSiteConfig(site),
    github: githubStatus(env, secrets),
    admin: { store: storeStatus },
  };
}

export async function login(request, env) {
  if (!sameOrigin(request)) {
    return adminJsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  const address = clientAddress(request);
  if (loginLimited(address)) {
    return adminJsonResponse(
      request,
      429,
      {
        error: "TOO_MANY_ATTEMPTS",
        message: "尝试次数过多，请 15 分钟后再试。",
      },
      { "Retry-After": "900" },
    );
  }
  const body = await readAdminJson(request);
  if (!safeEqual(body.secret, adminSecret(env))) {
    registerLoginFailure(address);
    return adminJsonResponse(request, 401, {
      error: "INVALID_SECRET",
      message: "管理员密钥不正确。",
    });
  }
  resetLoginFailures(address);
  const session = await createSession(adminSecret(env));
  return adminJsonResponse(
    request,
    200,
    { ok: true },
    { "Set-Cookie": sessionCookie(session, request) },
  );
}

export function logout(request) {
  return adminJsonResponse(
    request,
    200,
    { ok: true },
    {
      "Set-Cookie": sessionCookie("", request, {
        maxAge: 0,
        clear: true,
      }),
    },
  );
}

export async function updateConfig(request, env, store) {
  if (!sameOrigin(request)) {
    return adminJsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  const body = await readAdminJson(request);
  const action = body.githubTokenAction;
  const token = String(body.githubToken || "").trim();
  if (action === "set" && !validGitHubToken(token)) {
    return adminJsonResponse(request, 400, {
      error: "INVALID_TOKEN",
      message:
        "GitHub 令牌格式不正确。请粘贴以 ghp_、github_pat_ 等开头的完整令牌。",
    });
  }

  const nextSite = normalizeSiteConfig({
    mode: body.mode,
    defaultUsername: body.defaultUsername,
    allowedUsers: body.allowedUsers,
    repoUrl: body.repoUrl,
    card: body.card,
  });
  if (typeof store.updateConfigWithSecret === "function") {
    await store.updateConfigWithSecret(nextSite, {
      action: action === "set" || action === "clear" ? action : "keep",
      name: "githubToken",
      value: token,
    });
  } else {
    await store.updateConfig(nextSite);
    if (action === "set") await store.setSecret("githubToken", token);
    if (action === "clear") await store.clearSecret("githubToken");
  }

  clearProfileCache();
  clearAssetCache();
  return adminJsonResponse(request, 200, {
    ok: true,
    ...(await dashboardPayload(env, store, await store.getPublicConfig())),
  });
}

export async function testGitHubConnection(request, env, site) {
  if (!sameOrigin(request)) {
    return adminJsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  const startedAt = Date.now();
  try {
    const profile = await fetchProfileData(env, site.defaultUsername);
    return adminJsonResponse(request, 200, {
      ok: true,
      login: profile.login,
      stars: profile.stars,
      repositories: profile.repositories,
      source: env.GITHUB_TOKEN ? "graphql" : "public-rest",
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    return adminJsonResponse(request, 502, {
      error: "GITHUB_TEST_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "无法连接 GitHub，请检查令牌后重试。",
    });
  }
}
