import { clearAssetCache } from "../assets.js";
import {
  renderAdminDashboardPage,
  renderAdminLoginPage,
} from "../admin-page.js";
import { clearProfileCache } from "../profile-service.js";
import {
  adminHtmlResponse,
  adminJsonResponse,
  adminRedirect,
} from "./http.js";
import {
  dashboardPayload,
  login,
  logout,
  testGitHubConnection,
  updateConfig,
} from "./controller.js";
import {
  adminImagePath,
  handleAdminImageDelete,
  handleAdminImageList,
  handleAdminImageUpdate,
  handleAdminImageUpload,
} from "../handlers/images.js";
import { externalOrigin } from "./request.js";
import { hasSession } from "./session.js";

function adminSecret(env) {
  return String(env.ADMIN_SECRET || "");
}

function unavailablePage() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>管理后台尚未启用</title>
  <style>
    :root { color-scheme: light; --paper:#f1eadc; --ink:#17130f; --red:#d6422e; }
    body { margin:0; min-height:100vh; display:grid; place-items:center; padding:24px; background:var(--paper); color:var(--ink); font:16px/1.65 "Avenir Next","PingFang SC",sans-serif; }
    main { width:min(560px,100%); padding:34px; border:1px solid var(--ink); border-radius:4px 24px 24px 24px; background:#fbf7ed; box-shadow:7px 7px 0 var(--red); }
    h1 { margin:0 0 12px; font-size:34px; letter-spacing:-.045em; }
    p { margin:0; color:#71685d; }
    code { padding:2px 6px; background:#eae1d2; border:1px solid #cfc2af; border-radius:5px; font-family:Menlo,monospace; }
  </style>
</head>
<body><main><h1>管理后台尚未启用</h1><p>请先配置 <code>ADMIN_SECRET</code> 并启用持久化存储，再重新启动实例。</p></main></body>
</html>`;
}

export async function handleAdminRequest(request, env, ctx, site) {
  const url = new URL(request.url);
  const store = env.SITE_STORE;
  const secret = adminSecret(env);
  if (!store || !secret) {
    return adminHtmlResponse(request, 503, unavailablePage());
  }

  const authed = await hasSession(request, secret);
  if (url.pathname === "/admin/login" && request.method === "HEAD") {
    return adminHtmlResponse(request, 200, "");
  }
  if (url.pathname === "/admin/login" && request.method === "GET") {
    if (authed) return adminRedirect("/admin");
    return adminHtmlResponse(
      request,
      200,
      renderAdminLoginPage({ origin: externalOrigin(request) }),
    );
  }
  if (url.pathname === "/admin" && ["GET", "HEAD"].includes(request.method)) {
    if (!authed) return adminRedirect("/admin/login");
    return adminHtmlResponse(
      request,
      200,
      renderAdminDashboardPage({ origin: externalOrigin(request) }),
    );
  }
  if (url.pathname === "/admin/api/login" && request.method === "POST") {
    try {
      return await login(request, env);
    } catch (error) {
      return adminJsonResponse(request, error.status || 400, {
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
      return adminJsonResponse(request, 401, {
        error: "UNAUTHORIZED",
        message: "管理员会话已失效，请重新登录。",
      });
    }
    return adminRedirect("/admin/login");
  }

  if (
    url.pathname === "/admin/api/config" &&
    ["GET", "HEAD"].includes(request.method)
  ) {
    return adminJsonResponse(
      request,
      200,
      await dashboardPayload(env, store, site),
    );
  }
  if (url.pathname === "/admin/api/config" && request.method === "PUT") {
    try {
      return await updateConfig(request, env, store);
    } catch (error) {
      return adminJsonResponse(request, error.status || 500, {
        error: "SAVE_FAILED",
        message: error.message || "配置保存失败。",
      });
    }
  }
  if (url.pathname === "/admin/api/cache/clear" && request.method === "POST") {
    clearProfileCache();
    clearAssetCache();
    return adminJsonResponse(request, 200, { ok: true });
  }
  if (url.pathname === "/admin/api/github/test" && request.method === "POST") {
    return testGitHubConnection(request, env, site);
  }
  if (url.pathname === "/admin/api/images") {
    const runtime = { env, site };
    if (["GET", "HEAD"].includes(request.method)) {
      return handleAdminImageList(request, runtime);
    }
    if (request.method === "POST") {
      return handleAdminImageUpload(request, runtime);
    }
    return adminJsonResponse(
      request,
      405,
      { error: "METHOD_NOT_ALLOWED" },
      { Allow: "GET, HEAD, POST" },
    );
  }
  if (adminImagePath(url.pathname)) {
    const runtime = { env, site };
    if (request.method === "PATCH") {
      return handleAdminImageUpdate(request, runtime);
    }
    if (request.method === "DELETE") {
      return handleAdminImageDelete(request, runtime);
    }
    return adminJsonResponse(
      request,
      405,
      { error: "METHOD_NOT_ALLOWED" },
      { Allow: "PATCH, DELETE" },
    );
  }
  return adminJsonResponse(request, 404, { error: "NOT_FOUND" });
}

export function adminConfigured(env) {
  return Boolean(env.SITE_STORE && adminSecret(env));
}
