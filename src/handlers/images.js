import {
  adminJsonResponse,
  readAdminJson,
} from "../admin/http.js";
import { clientAddress, sameOrigin } from "../admin/request.js";
import { hasSession } from "../admin/session.js";
import { jsonResponse, responseHeaders } from "../http.js";
import {
  MAX_IMAGE_BYTES,
  MAX_LIBRARY_IMAGES,
  parseWebpDimensions,
} from "../../server/image-store.mjs";

const IMAGE_PATH =
  /^\/images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.webp$/i;
const ADMIN_IMAGE_PATH =
  /^\/admin\/api\/images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const UPLOAD_WINDOW_MS = 60 * 60 * 1000;
const UPLOAD_LIMIT = 8;
const uploadAttempts = new Map();

function imageStore(runtime) {
  return runtime.env.SITE_STORE?.images || null;
}

function withUrl(image, origin) {
  return { ...image, url: `${origin}/images/${image.id}.webp` };
}

function publicImagePayload(image, origin) {
  return {
    id: image.id,
    label: image.label,
    width: image.width,
    height: image.height,
    bytes: image.bytes,
    createdAt: image.createdAt,
    url: `${origin}/images/${image.id}.webp`,
  };
}

function uploadLimited(address) {
  const now = Date.now();
  const entry = uploadAttempts.get(address);
  if (!entry || entry.resetAt <= now) {
    uploadAttempts.set(address, { count: 1, resetAt: now + UPLOAD_WINDOW_MS });
    while (uploadAttempts.size > 200) {
      uploadAttempts.delete(uploadAttempts.keys().next().value);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > UPLOAD_LIMIT;
}

function unsupportedBody(request) {
  const type = String(request.headers.get("Content-Type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  return type !== "image/webp";
}

function tooLarge(request) {
  return Number(request.headers.get("Content-Length") || 0) > MAX_IMAGE_BYTES;
}

async function readImageBody(request) {
  if (tooLarge(request)) {
    const error = new Error("图片超过 1 MB 上限。");
    error.status = 413;
    throw error;
  }
  const buffer = Buffer.from(await request.arrayBuffer());
  if (!buffer.byteLength) {
    const error = new Error("图片内容为空。");
    error.status = 400;
    throw error;
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    const error = new Error("图片超过 1 MB 上限。");
    error.status = 413;
    throw error;
  }
  return buffer;
}

export async function handlePublicImageList(request, runtime) {
  const store = imageStore(runtime);
  const origin = new URL(request.url).origin;
  try {
    const images = store
      ? (await store.list()).map((image) => publicImagePayload(image, origin))
      : [];
    return jsonResponse(
      request,
      200,
      {
        allowPublicUploads: Boolean(runtime.site.allowPublicUploads),
        maxBytes: MAX_IMAGE_BYTES,
        capacity: MAX_LIBRARY_IMAGES,
        images,
      },
      {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    );
  } catch (error) {
    return jsonResponse(
      request,
      503,
      {
        error: "IMAGE_LIBRARY_UNAVAILABLE",
        message: "图片库暂时不可用。",
      },
      { "Cache-Control": "no-store" },
    );
  }
}

export async function handlePublicImageUpload(request, runtime) {
  const store = imageStore(runtime);
  if (!store) {
    return jsonResponse(request, 503, {
      error: "IMAGE_LIBRARY_UNAVAILABLE",
      message: "图片库尚未启用。",
    });
  }
  if (!runtime.site.allowPublicUploads) {
    return jsonResponse(request, 403, {
      error: "PUBLIC_UPLOADS_DISABLED",
      message: "管理员暂未开放游客上传。",
    });
  }
  if (!sameOrigin(request)) {
    return jsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  if (unsupportedBody(request)) {
    return jsonResponse(request, 415, {
      error: "UNSUPPORTED_IMAGE",
      message: "请先由浏览器压缩为 WebP 再上传。",
    });
  }
  if (uploadLimited(clientAddress(request))) {
    return jsonResponse(
      request,
      429,
      {
        error: "TOO_MANY_UPLOADS",
        message: "上传太频繁，请一小时后再试。",
      },
      { "Retry-After": "3600" },
    );
  }

  try {
    const buffer = await readImageBody(request);
    const label = new URL(request.url).searchParams.get("label") || "";
    const image = await store.create({
      buffer,
      label,
      source: "guest",
      published: false,
    });
    return jsonResponse(
      request,
      201,
      {
        ok: true,
        pending: true,
        image,
        message: "已提交审核，管理员发布后其他访客即可使用。",
      },
      { "Cache-Control": "no-store" },
    );
  } catch (error) {
    const status = Number(error?.status) || 400;
    return jsonResponse(
      request,
      status,
      {
        error: status === 413 ? "IMAGE_TOO_LARGE" : "IMAGE_REJECTED",
        message: error instanceof Error ? error.message : "图片上传失败。",
      },
      { "Cache-Control": "no-store" },
    );
  }
}

export async function handleImageAsset(request, env) {
  const match = new URL(request.url).pathname.match(IMAGE_PATH);
  if (!match) return null;
  const store = env.SITE_STORE?.images;
  if (!store) {
    return new Response("Not found", {
      status: 404,
      headers: responseHeaders({ "Cache-Control": "no-store" }),
    });
  }
  const secret = String(env.ADMIN_SECRET || "");
  const admin = secret ? await hasSession(request, secret) : false;
  const found = await store.get(match[1], { includeUnpublished: admin });
  if (!found) {
    return new Response("Not found", {
      status: 404,
      headers: responseHeaders({
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      }),
    });
  }
  return new Response(request.method === "HEAD" ? null : found.buffer, {
    status: 200,
    headers: responseHeaders({
      "Content-Type": "image/webp",
      "Cache-Control": found.image.published
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
      "Content-Disposition": "inline",
      ...(found.image.published
        ? { "Access-Control-Allow-Origin": "*" }
        : {}),
    }),
  });
}

export async function handleAdminImageList(request, runtime) {
  const store = imageStore(runtime);
  if (!store) {
    return adminJsonResponse(request, 503, {
      error: "IMAGE_LIBRARY_UNAVAILABLE",
      message: "图片库尚未启用。",
    });
  }
  try {
    const [images, stats] = await Promise.all([
      store.list({ includeUnpublished: true }),
      store.stats(),
    ]);
    const origin = new URL(request.url).origin;
    return adminJsonResponse(request, 200, {
      allowPublicUploads: Boolean(runtime.site.allowPublicUploads),
      maxBytes: MAX_IMAGE_BYTES,
      capacity: MAX_LIBRARY_IMAGES,
      stats,
      images: images.map((image) => ({
        ...image,
        url: `${origin}/images/${image.id}.webp`,
      })),
    });
  } catch (error) {
    return adminJsonResponse(request, 500, {
      error: "IMAGE_LIBRARY_READ_FAILED",
      message: "图片库读取失败。",
    });
  }
}

export async function handleAdminImageUpload(request, runtime) {
  if (!sameOrigin(request)) {
    return adminJsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  const store = imageStore(runtime);
  if (!store) {
    return adminJsonResponse(request, 503, {
      error: "IMAGE_LIBRARY_UNAVAILABLE",
      message: "图片库尚未启用。",
    });
  }
  if (unsupportedBody(request)) {
    return adminJsonResponse(request, 415, {
      error: "UNSUPPORTED_IMAGE",
      message: "请先由浏览器压缩为 WebP 再上传。",
    });
  }
  try {
    const buffer = await readImageBody(request);
    const query = new URL(request.url).searchParams;
    const image = await store.create({
      buffer,
      label: query.get("label") || "",
      source: "admin",
      published: true,
    });
    const origin = new URL(request.url).origin;
    return adminJsonResponse(request, 201, {
      ok: true,
      image: withUrl(image, origin),
    });
  } catch (error) {
    const status = Number(error?.status) || 400;
    return adminJsonResponse(request, status, {
      error: status === 413 ? "IMAGE_TOO_LARGE" : "IMAGE_REJECTED",
      message: error instanceof Error ? error.message : "图片上传失败。",
    });
  }
}

export async function handleAdminImageUpdate(request, runtime) {
  if (!sameOrigin(request)) {
    return adminJsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  const match = new URL(request.url).pathname.match(ADMIN_IMAGE_PATH);
  if (!match) return adminJsonResponse(request, 404, { error: "NOT_FOUND" });
  const store = imageStore(runtime);
  if (!store) {
    return adminJsonResponse(request, 503, {
      error: "IMAGE_LIBRARY_UNAVAILABLE",
      message: "图片库尚未启用。",
    });
  }
  const body = await readAdminJson(request);
  const patch = {};
  if (typeof body.published === "boolean") patch.published = body.published;
  if (body.label !== undefined) patch.label = String(body.label);
  const image = await store.update(match[1], patch);
  if (!image) {
    return adminJsonResponse(request, 404, {
      error: "IMAGE_NOT_FOUND",
      message: "图片不存在。",
    });
  }
  const origin = new URL(request.url).origin;
  return adminJsonResponse(request, 200, {
    ok: true,
    image: withUrl(image, origin),
  });
}

export async function handleAdminImageDelete(request, runtime) {
  if (!sameOrigin(request)) {
    return adminJsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  const match = new URL(request.url).pathname.match(ADMIN_IMAGE_PATH);
  if (!match) return adminJsonResponse(request, 404, { error: "NOT_FOUND" });
  const store = imageStore(runtime);
  if (!store) {
    return adminJsonResponse(request, 503, {
      error: "IMAGE_LIBRARY_UNAVAILABLE",
      message: "图片库尚未启用。",
    });
  }
  const removed = await store.remove(match[1]);
  if (!removed) {
    return adminJsonResponse(request, 404, {
      error: "IMAGE_NOT_FOUND",
      message: "图片不存在。",
    });
  }
  return adminJsonResponse(request, 200, { ok: true });
}

export function publicImageRoute(pathname) {
  return IMAGE_PATH.test(pathname);
}

export function adminImagePath(pathname) {
  return ADMIN_IMAGE_PATH.test(pathname);
}

export { parseWebpDimensions };
