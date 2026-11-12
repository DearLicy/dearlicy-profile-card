import { handleAdminRequest } from "./admin.js";
import {
  handleCardRequest,
  handleSummaryRequest,
} from "./handlers/profile-card.js";
import {
  handleHealth,
  handlePublicSite,
  handleStudioPage,
} from "./handlers/studio.js";
import {
  handleImageAsset,
  handlePublicImageList,
  handlePublicImageUpload,
  publicImageRoute,
} from "./handlers/images.js";
import {
  methodNotAllowed,
  notFound,
} from "./http.js";
import { createRuntime } from "./runtime.js";

const CARD_PATHS = new Set([
  "/api",
  "/api/card",
  "/card.svg",
  "/profile.svg",
]);
const HEALTH_PATHS = new Set(["/api/health", "/health"]);

async function route(request, env, ctx) {
  const url = new URL(request.url);
  const isAdmin = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
  const runtime = await createRuntime(env);

  if (isAdmin) {
    return handleAdminRequest(request, runtime.env, ctx, runtime.site);
  }
  if (url.pathname === "/api/images" && request.method === "POST") {
    return handlePublicImageUpload(request, runtime);
  }
  if (publicImageRoute(url.pathname)) {
    if (!["GET", "HEAD"].includes(request.method)) {
      return methodNotAllowed(request);
    }
    return handleImageAsset(request, runtime.env);
  }
  if (!["GET", "HEAD"].includes(request.method)) {
    return methodNotAllowed(request);
  }
  if (url.pathname === "/") return handleStudioPage(request, runtime);
  if (CARD_PATHS.has(url.pathname)) {
    return handleCardRequest(request, ctx, runtime);
  }
  if (url.pathname === "/api/summary") {
    return handleSummaryRequest(request, ctx, runtime);
  }
  if (url.pathname === "/api/site") return handlePublicSite(request, runtime);
  if (url.pathname === "/api/images") {
    return handlePublicImageList(request, runtime);
  }
  if (HEALTH_PATHS.has(url.pathname)) return handleHealth(request, runtime);
  return notFound(request);
}

export default {
  fetch(request, env, ctx) {
    return route(request, env, ctx);
  },
};
