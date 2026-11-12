import { clearAssetCache } from "./assets.js";
import { renderAdminDashboardPage, renderAdminLoginPage } from "./admin-page.js";
import { fetchProfileData } from "./github.js";
import { clearProfileCache } from "./profile-service.js";
import { normalizeSiteConfig, publicSiteConfig } from "./site-config.js";

const SESSION_COOKIE = "pcard_admin";
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const JSON_LIMIT = 64 * 1024;
const attempts = new Map();
const textEncoder = new TextEncoder();

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64url(value) {
  const padded = String(value)
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(String(value).length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return crypto.subtle.sign("HMAC", key, textEncoder.encode(value));
}

async function signedValue(secret, value) {
  const signature = await hmac(secret, value);
  return `${value}.${base64url(new Uint8Array(signature))}`;
}

async function verifySignedValue(secret, signed, maxAgeSeconds) {
  const separator = String(signed || "").lastIndexOf(".");
  if (separator < 1) return null;
  const value = signed.slice(0, separator);
  const provided = fromBase64url(signed.slice(separator + 1));
  const expected = new Uint8Array(await hmac(secret, value));
  if (provided.length !== expected.length) return null;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= provided[index] ^ expected[index];
  }
  if (difference !== 0) return null;
  const [payload, timestamp] = value.split(".");
  const issuedAt = Number(timestamp);
  if (!payload || !Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > maxAgeSeconds * 1000) return null;
  return payload;
}

function cookies(request) {
  const output = {};
  for (const part of String(request.headers.get("Cookie") || "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    output[part.slice(0, separator).trim()] = part
      .slice(separator + 1)
      .trim();
  }
  return output;
}

function isSecureRequest(request) {
  const forwarded = String(request.headers.get("X-Forwarded-Proto") || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  return forwarded === "https" || new URL(request.url).protocol === "https:";
}

function cookie(
  name,
  value,
  request,
  { maxAge = SESSION_SECONDS, clear = false, sameSite = "Lax" } = {},
) {
  const bits = [
    `${name}=${clear ? "" : value}`,
    "Path=/",
    "HttpOnly",
    `SameSite=${sameSite}`,
    `Max-Age=${clear ? 0 : maxAge}`,
  ];
  if (isSecureRequest(request)) bits.push("Secure");
  return bits.join("; ");
}

async function createSession(secret) {
  return signedValue(secret, `admin.${Date.now()}`);
}

async function hasSession(request, secret) {
  return (
    (await verifySignedValue(
      secret,
      cookies(request)[SESSION_COOKIE],
      SESSION_SECONDS,
    )) === "admin"
  );
}

function safeEqual(left, right) {
  const a = textEncoder.encode(String(left || ""));
  const b = textEncoder.encode(String(right || ""));
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index] ^ b[index];
  }
  return difference === 0;
}

function clientAddress(request) {
  return (
    String(request.headers.get("CF-Connecting-IP") || "").trim() ||
    String(request.headers.get("X-Real-IP") || "").trim() ||
    String(request.headers.get("X-Forwarded-For") || "")
      .split(",")[0]
      .trim() ||
    "local"
  );
}

function loginLimited(address) {
  const entry = attempts.get(address);
  if (!entry) return false;
  if (entry.resetAt <= Date.now()) {
    attempts.delete(address);
    return false;
  }
  return entry.count >= 8;
}

function registerFailure(address) {
  const current = attempts.get(address);
  if (!current || current.resetAt <= Date.now()) {
    attempts.set(address, { count: 1, resetAt: Date.now() + 15 * 60 * 1000 });
  } else {
    current.count += 1;
  }
  while (attempts.size > 500) {
    attempts.delete(attempts.keys().next().value);
  }
}

function adminHeaders(extra = {}) {
  return new Headers({
    "Cache-Control": "no-store",
    "Content-Security-Policy":
      "default-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' data:; font-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Robots-Tag": "noindex, nofollow",
    ...extra,
  });
}

function jsonResponse(request, status, payload, extraHeaders = {}) {
  return new Response(
    request.method === "HEAD" ? null : JSON.stringify(payload),
    {
      status,
      headers: adminHeaders({
        "Content-Type": "application/json; charset=utf-8",
        ...extraHeaders,
      }),
    },
  );
}

function htmlResponse(request, status, html) {
  return new Response(request.method === "HEAD" ? null : html, {
    status,
    headers: adminHeaders({ "Content-Type": "text/html; charset=utf-8" }),
  });
}

async function readJson(request) {
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > JSON_LIMIT) {
    const error = new Error("请求体过大。");
    error.status = 413;
    throw error;
  }
  const text = await request.text();
  if (text.length > JSON_LIMIT) {
    const error = new Error("请求体过大。");
    error.status = 413;
    throw error;
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    const error = new Error("请求格式不是有效 JSON。");
    error.status = 400;
    throw error;
  }
}

function externalOrigin(request) {
  const url = new URL(request.url);
  const host = String(request.headers.get("X-Forwarded-Host") || url.host)
    .split(",")[0]
    .trim();
  const proto = String(
    request.headers.get("X-Forwarded-Proto") || url.protocol.replace(":", ""),
  )
    .split(",")[0]
    .trim();
  return `${proto || "http"}://${host}`;
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === externalOrigin(request);
}

function adminSecret(env) {
  return String(env.ADMIN_SECRET || "");
}

function tokenLooksValid(value) {
  const token = String(value || "").trim();
  return (
    token.length >= 20 &&
    token.length <= 255 &&
    /^(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)$/.test(token)
  );
}

function githubStatus(env, secrets) {
  const source = secrets?.githubToken
    ? "stored"
    : env.GITHUB_TOKEN_FROM_ENV
      ? "environment"
      : "";
  return {
    configured: Boolean(
      secrets?.githubToken || env.GITHUB_TOKEN_FROM_ENV,
    ),
    source,
    hasStoredToken: Boolean(secrets?.githubToken),
  };
}

async function dashboardPayload(env, store, site) {
  const [secrets, storeStatus] = store
    ? await Promise.all([store.getSecrets(), store.status()])
    : [{}, {}];
  return {
    site: publicSiteConfig(site),
    github: githubStatus(env, secrets),
    admin: { store: storeStatus },
  };
}

async function handleLogin(request, env) {
  if (!sameOrigin(request)) {
    return jsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  const address = clientAddress(request);
  if (loginLimited(address)) {
    return jsonResponse(
      request,
      429,
      {
        error: "TOO_MANY_ATTEMPTS",
        message: "尝试次数过多，请 15 分钟后再试。",
      },
      { "Retry-After": "900" },
    );
  }
  const body = await readJson(request);
  if (!safeEqual(body.secret, adminSecret(env))) {
    registerFailure(address);
    return jsonResponse(request, 401, {
      error: "INVALID_SECRET",
      message: "管理员密钥不正确。",
    });
  }
  attempts.delete(address);
  const session = await createSession(adminSecret(env));
  return jsonResponse(
    request,
    200,
    { ok: true },
    { "Set-Cookie": cookie(SESSION_COOKIE, session, request) },
  );
}

function logout(request) {
  return jsonResponse(
    request,
    200,
    { ok: true },
    {
      "Set-Cookie": cookie(SESSION_COOKIE, "", request, {
        maxAge: 0,
        clear: true,
      }),
    },
  );
}

async function updateConfig(request, env, store) {
  if (!sameOrigin(request)) {
    return jsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  const body = await readJson(request);
  const nextSite = normalizeSiteConfig({
    mode: body.mode,
    defaultUsername: body.defaultUsername,
    allowedUsers: body.allowedUsers,
    repoUrl: body.repoUrl,
    card: body.card,
  });
  await store.updateConfig(nextSite);

  if (body.githubTokenAction === "set") {
    if (!tokenLooksValid(body.githubToken)) {
      return jsonResponse(request, 400, {
        error: "INVALID_TOKEN",
        message:
          "GitHub 令牌格式不正确。请粘贴以 ghp_、github_pat_ 等开头的完整令牌。",
      });
    }
    await store.setSecret("githubToken", String(body.githubToken).trim());
  } else if (body.githubTokenAction === "clear") {
    await store.clearSecret("githubToken");
  }

  clearProfileCache();
  clearAssetCache();
  return jsonResponse(request, 200, {
    ok: true,
    ...(await dashboardPayload(env, store, await store.getPublicConfig())),
  });
}

async function testGitHubConnection(request, env, site) {
  if (!sameOrigin(request)) {
    return jsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  const startedAt = Date.now();
  try {
    const profile = await fetchProfileData(env, site.defaultUsername);
    return jsonResponse(request, 200, {
      ok: true,
      login: profile.login,
      stars: profile.stars,
      repositories: profile.repositories,
      source: env.GITHUB_TOKEN ? "graphql" : "public-rest",
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    return jsonResponse(request, 502, {
      error: "GITHUB_TEST_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "无法连接 GitHub，请检查令牌后重试。",
    });
  }
}

export async function handleAdminRequest(request, env, ctx, site) {
  const url = new URL(request.url);
  const store = env.SITE_STORE;
  const secret = adminSecret(env);
  if (!store || !secret) {
    return htmlResponse(
      request,
      503,
      "<!doctype html><html lang='zh-CN'><meta charset='utf-8'><title>管理后台不可用</title><body style='font:16px system-ui;padding:40px;background:#111318;color:#f6f2eb'><h1>管理后台尚未启用</h1><p>请先配置 <code>ADMIN_SECRET</code> 并启用持久化存储。</p></body></html>",
    );
  }
  const authed = await hasSession(request, secret);

  if (url.pathname === "/admin/login" && request.method === "HEAD") {
    return htmlResponse(request, 200, "");
  }
  if (url.pathname === "/admin/login" && request.method === "GET") {
    if (authed) {
      return new Response(null, {
        status: 302,
        headers: adminHeaders({ Location: "/admin" }),
      });
    }
    return htmlResponse(
      request,
      200,
      renderAdminLoginPage({ origin: externalOrigin(request) }),
    );
  }
  if (
    url.pathname === "/admin" &&
    ["GET", "HEAD"].includes(request.method)
  ) {
    if (!authed) {
      return new Response(null, {
        status: 302,
        headers: adminHeaders({ Location: "/admin/login" }),
      });
    }
    return htmlResponse(
      request,
      200,
      renderAdminDashboardPage({ origin: externalOrigin(request) }),
    );
  }
  if (url.pathname === "/admin/api/login" && request.method === "POST") {
    try {
      return await handleLogin(request, env);
    } catch (error) {
      return jsonResponse(request, error.status || 400, {
        error: "BAD_REQUEST",
        message: error.message || "请求失败。",
      });
    }
  }
  if (url.pathname === "/admin/api/logout" && request.method === "POST") {
    return logout(request);
  }

  if (!authed) {
    if (url.pathname.startsWith("/admin/api/")) {
      return jsonResponse(request, 401, {
        error: "UNAUTHORIZED",
        message: "管理员会话已失效，请重新登录。",
      });
    }
    return new Response(null, {
      status: 302,
      headers: adminHeaders({ Location: "/admin/login" }),
    });
  }

  if (
    url.pathname === "/admin/api/config" &&
    ["GET", "HEAD"].includes(request.method)
  ) {
    return jsonResponse(
      request,
      200,
      await dashboardPayload(env, store, site),
    );
  }
  if (url.pathname === "/admin/api/config" && request.method === "PUT") {
    try {
      return await updateConfig(request, env, store);
    } catch (error) {
      return jsonResponse(request, error.status || 500, {
        error: "SAVE_FAILED",
        message: error.message || "配置保存失败。",
      });
    }
  }
  if (url.pathname === "/admin/api/cache/clear" && request.method === "POST") {
    clearProfileCache();
    clearAssetCache();
    return jsonResponse(request, 200, { ok: true });
  }
  if (url.pathname === "/admin/api/github/test" && request.method === "POST") {
    return testGitHubConnection(request, env, site);
  }

  return jsonResponse(request, 404, { error: "NOT_FOUND" });
}

export async function adminConfigured(env) {
  return Boolean(env.SITE_STORE && adminSecret(env));
}
