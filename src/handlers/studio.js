import { configFromSearchParams } from "../config.js";
import {
  PAGE_CSP,
  htmlResponse,
  jsonResponse,
} from "../http.js";
import { renderStudioPage } from "../page.js";
import { CACHE_SECONDS } from "../profile-service.js";
import { requestedLogin } from "../runtime.js";
import { publicSiteConfig } from "../site-config.js";

export function handleStudioPage(request, runtime) {
  const url = new URL(request.url);
  let defaultUsername = runtime.site.defaultUsername;
  try {
    defaultUsername = requestedLogin(url, runtime.site);
  } catch {}
  const html = renderStudioPage({
    origin: url.origin,
    defaultUsername,
    mode: runtime.site.mode,
    repoUrl: runtime.site.repoUrl,
    initialCardConfig: configFromSearchParams(url.searchParams, runtime.site.card),
  });
  return htmlResponse(request, 200, html, {
    "Cache-Control": "no-store",
    "Content-Security-Policy": PAGE_CSP,
    "X-Frame-Options": "DENY",
  });
}

export function handlePublicSite(request, runtime) {
  const payload = publicSiteConfig(runtime.site);
  return jsonResponse(
    request,
    200,
    {
      ...payload,
      allowedUsers: runtime.site.mode === "public" ? [] : payload.allowedUsers,
      tokenConfigured: Boolean(runtime.env.GITHUB_TOKEN),
      adminAvailable: Boolean(runtime.env.SITE_STORE && runtime.env.ADMIN_SECRET),
    },
    {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  );
}

export function handleHealth(request, runtime) {
  return jsonResponse(
    request,
    200,
    {
      ok: true,
      mode: runtime.site.mode,
      defaultUsername: runtime.site.defaultUsername,
      configured: Boolean(runtime.env.GITHUB_TOKEN),
      dataSource: runtime.env.GITHUB_TOKEN ? "graphql" : "public-rest",
      persisted: Boolean(runtime.env.SITE_STORE),
      cacheSeconds: CACHE_SECONDS,
    },
    { "Cache-Control": "no-store" },
  );
}
