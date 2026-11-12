import { clearAssetCache } from "./assets.js";
import { renderAdminLoginPage, renderAdminDashboardPage } from "./admin-page.js";
import { normalizeSiteConfig, publicSiteConfig } from "./site-config.js";
import { clearProfileCache } from "./profile-service.js";

const SESSION_COOKIE = "pcard_admin";
const OAUTH_STATE_COOKIE = "pcard_oauth_state";
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
  const padded = String(value).replaceAll("-", "+").replaceAll("_", "/").padEnd(
    Math.ceil(String(value).length / 4) * 4,
    "=",
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
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
  return (
    forwarded === "https" || new URL(request.url).protocol === "https:"
  );
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
  const payload = `admin.${Date.now()}`;
  return signedValue(secret, payload);
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

function clearFailures(address) {
  attempts.delete(address);
}

function adminHeaders(request, extra = {}) {
  return new Headers({
    "Cache-Control": "no-store",
    "Content-Security-Policy":
      "default-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Robots-Tag": "noindex, nofollow",
    ...extra,
  });
}

function jsonResponse(request, status, payload, extraHeaders = {}) {
  return new Response(request.method === "HEAD" ? null : JSON.stringify(payload), {
    status,
    headers: adminHeaders(request, {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    }),
  });
}

function htmlResponse(request, status, html, extraHeaders = {}) {
  return new Response(request.method === "HEAD" ? null : html, {
    status,
    headers: adminHeaders(request, {
      "Content-Type": "text/html; charset=utf-8",
      ...extraHeaders,
    }),
  });
}

async function readJson(request) {
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > JSON_LIMIT) {
    const error = new Error("请求体过大。");
    error.status = 413;
    throw error;
  }
  let text = "";
  try {
    text = await request.text();
  } catch {
    const error = new Error("无法读取请求内容。");
    error.status = 400;
    throw error;
  }
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
  const host = String(request.headers.get("X-Forwarded-Host") || url.host).split(
    ",",
  )[0].trim();
  const proto = String(
    request.headers.get("X-Forwarded-Proto") || url.protocol.replace(":", ""),
  )
    .split(",")[0]
    .trim();
  return `${proto || "http"}://${host}`;
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  return origin === externalOrigin(request);
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

function secretStatus(env, store, secrets) {
  let source = "";
  if (secrets?.oauthToken) source = "oauth";
  else if (secrets?.githubToken) source = "token";
  else if (env.GITHUB_TOKEN) source = "environment";
  return {
    configured: Boolean(secrets?.oauthToken || secrets?.githubToken || env.GITHUB_TOKEN),
    source,
    oauthConnected: Boolean(secrets?.oauthToken),
  };
}

async function dashboardPayload(env, store, site) {
  const [secrets, storeStatus] = store
    ? await Promise.all([store.getSecrets(), store.status()])
    : [{}, {}];
  return {
    site: publicSiteConfig(site),
    github: secretStatus(env, store, secrets),
    admin: {
      oauthClientConfigured: Boolean(
        (site.oauthClientId || env.GITHUB_CLIENT_ID) &&
          (secrets.oauthClientSecret || env.GITHUB_CLIENT_SECRET),
      ),
      store: storeStatus,
    },
  };
}

async function handleLogin(request, env, store) {
  if (!sameOrigin(request)) {
    return jsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  const address = clientAddress(request);
  if (loginLimited(address)) {
    return jsonResponse(
      request,
      429,
      { error: "TOO_MANY_ATTEMPTS", message: "尝试次数过多，请 15 分钟后再试。" },
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
  clearFailures(address);
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
    oauthClientId: body.oauthClientId,
    oauthLogin: body.oauthLogin,
  });
  await store.updateConfig(nextSite);

  if (body.githubTokenAction === "set") {
    if (!tokenLooksValid(body.githubToken)) {
      return jsonResponse(request, 400, {
        error: "INVALID_TOKEN",
        message: "GitHub Token 格式不正确。",
      });
    }
    await store.setSecret("githubToken", String(body.githubToken).trim());
  } else if (body.githubTokenAction === "clear") {
    await store.clearSecret("githubToken");
  }

  if (body.oauthClientSecretAction === "set") {
    const secret = String(body.oauthClientSecret || "").trim();
    if (secret.length < 20 || secret.length > 200) {
      return jsonResponse(request, 400, {
        error: "INVALID_OAUTH_SECRET",
        message: "GitHub OAuth Client Secret 格式不正确。",
      });
    }
    await store.setSecret("oauthClientSecret", secret);
  } else if (body.oauthClientSecretAction === "clear") {
    await store.clearSecret("oauthClientSecret");
  }
  if (body.clearOAuthToken) await store.clearSecret("oauthToken");

  clearProfileCache();
  clearAssetCache();
  return jsonResponse(request, 200, {
    ok: true,
    ...(await dashboardPayload(env, store, await store.getPublicConfig())),
  });
}

async function beginOAuth(request, env, store, site) {
  if (!sameOrigin(request)) {
    return jsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  const secrets = await store.getSecrets();
  const clientId = site.oauthClientId || env.GITHUB_CLIENT_ID || "";
  const clientSecret = secrets.oauthClientSecret || env.GITHUB_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) {
    return jsonResponse(request, 400, {
      error: "OAUTH_NOT_CONFIGURED",
      message: "请先保存 GitHub OAuth Client ID 和 Client Secret。",
    });
  }
  const payload = `oauth.${Date.now()}.${base64url(crypto.getRandomValues(new Uint8Array(18)))}`;
  const state = await signedValue(adminSecret(env), payload);
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", `${externalOrigin(request)}/admin/oauth/github/callback`);
  authorize.searchParams.set("scope", "read:user");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("allow_signup", "false");
  return new Response(null, {
    status: 302,
    headers: adminHeaders(request, {
      Location: authorize.toString(),
      "Set-Cookie": cookie(OAUTH_STATE_COOKIE, state, request, { maxAge: 900 }),
    }),
  });
}

async function finishOAuth(request, env, store, site) {
  if (!sameOrigin(request)) {
    return htmlResponse(request, 403, "OAuth 请求来源校验失败。");
  }
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const storedState = cookies(request)[OAUTH_STATE_COOKIE];
  const statePayload = await verifySignedValue(adminSecret(env), state, 900);
  if (!code || !statePayload || state !== storedState) {
    return htmlResponse(request, 400, "OAuth state 校验失败，请返回管理后台重试。");
  }
  const secrets = await store.getSecrets();
  const clientId = site.oauthClientId || env.GITHUB_CLIENT_ID || "";
  const clientSecret = secrets.oauthClientSecret || env.GITHUB_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) {
    return htmlResponse(request, 400, "GitHub OAuth 应用配置不完整。");
  }

  let response;
  try {
    response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "DearLicy-profile-card",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${externalOrigin(request)}/admin/oauth/github/callback`,
      }),
    });
  } catch {
    return htmlResponse(request, 502, "连接 GitHub OAuth 失败，请稍后重试。");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    return htmlResponse(
      request,
      502,
      `GitHub OAuth 授权失败：${String(payload.error_description || payload.error || response.status).slice(0, 160)}`,
    );
  }
  const token = String(payload.access_token);
  let login = "";
  try {
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "DearLicy-profile-card",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (userResponse.ok) {
      const user = await userResponse.json();
      login = String(user.login || "").slice(0, 39);
    }
  } catch {}
  await store.setSecret("oauthToken", token);
  await store.updateConfig({ ...site, oauthLogin: login });
  clearProfileCache();
  return new Response(null, {
    status: 302,
    headers: adminHeaders(request, {
      Location: "/admin?oauth=connected",
      "Set-Cookie": cookie(OAUTH_STATE_COOKIE, "", request, {
        maxAge: 0,
        clear: true,
      }),
    }),
  });
}

export async function handleAdminRequest(request, env, ctx, site) {
  const url = new URL(request.url);
  const store = env.SITE_STORE;
  const secret = adminSecret(env);
  if (!store || !secret) {
    return htmlResponse(
      request,
      503,
      "<!doctype html><meta charset=utf-8><title>Admin unavailable</title><body style='font:16px system-ui;padding:40px;background:#0d0e12;color:#f5f2ec'><h1>管理后台尚未启用</h1><p>请先配置 <code>ADMIN_SECRET</code> 并启用持久化存储。</p></body>",
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
        headers: adminHeaders(request, { Location: "/admin" }),
      });
    }
    return htmlResponse(request, 200, renderAdminLoginPage({ origin: externalOrigin(request) }));
  }
  if (url.pathname === "/admin" && (request.method === "GET" || request.method === "HEAD")) {
    if (!authed) {
      return new Response(null, {
        status: 302,
        headers: adminHeaders(request, { Location: "/admin/login" }),
      });
    }
    return htmlResponse(
      request,
      200,
      renderAdminDashboardPage({
        origin: externalOrigin(request),
        oauthMessage: url.searchParams.get("oauth") || "",
      }),
    );
  }
  if (url.pathname === "/admin/api/login" && request.method === "POST") {
    try {
      return await handleLogin(request, env, store);
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
      headers: adminHeaders(request, { Location: "/admin/login" }),
    });
  }

  if (url.pathname === "/admin/api/config" && (request.method === "GET" || request.method === "HEAD")) {
    return jsonResponse(request, 200, await dashboardPayload(env, store, site));
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
  if (url.pathname === "/admin/oauth/github" && request.method === "GET") {
    try {
      return await beginOAuth(request, env, store, site);
    } catch (error) {
      return jsonResponse(request, 500, {
        error: "OAUTH_START_FAILED",
        message: error.message || "无法开始 OAuth。",
      });
    }
  }
  if (url.pathname === "/admin/oauth/github/callback" && request.method === "GET") {
    try {
      return await finishOAuth(request, env, store, site);
    } catch (error) {
      return htmlResponse(request, 500, `OAuth 回调处理失败：${String(error.message || "").slice(0, 160)}`);
    }
  }

  return jsonResponse(request, 404, { error: "NOT_FOUND" });
}

export async function adminConfigured(env) {
  return Boolean(env.SITE_STORE && adminSecret(env));
}
