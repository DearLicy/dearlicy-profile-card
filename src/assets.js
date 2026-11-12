export const DEFAULT_ASSET_HOSTS = [
  "avatars.githubusercontent.com",
  "raw.githubusercontent.com",
  "user-images.githubusercontent.com",
  "private-user-images.githubusercontent.com",
  "images.unsplash.com",
  "plus.unsplash.com",
  "cdn.jsdelivr.net",
  "i.imgur.com",
];
const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_LIMIT = 30;
const imageCache = new Map();

function allowedHosts(env) {
  const extra = String(env?.ASSET_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_ASSET_HOSTS, ...extra]);
}

export function isAllowedAssetUrl(value, env) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const hostname = url.hostname.toLowerCase();
    return [...allowedHosts(env)].some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(offset, offset + chunkSize),
    );
  }
  return btoa(binary);
}

function inferredType(url, contentType) {
  const normalized = String(contentType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (IMAGE_TYPES.has(normalized)) return normalized;
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".gif")) return "image/gif";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  return "";
}

export async function fetchImageDataUri(
  imageUrl,
  env,
  { maxBytes = 1_500_000, cacheTtlMs = CACHE_TTL_MS } = {},
) {
  if (!imageUrl || !isAllowedAssetUrl(imageUrl, env)) return null;
  const cached = imageCache.get(imageUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.dataUri;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);
  try {
    let currentUrl = imageUrl;
    let response;
    for (let hop = 0; hop < 4; hop += 1) {
      response = await fetch(currentUrl, {
        headers: {
          Accept: "image/png,image/jpeg,image/webp,image/gif",
          "User-Agent": "DearLicy-profile-card",
        },
        signal: controller.signal,
        redirect: "manual",
        cf: {
          cacheEverything: true,
          cacheTtl: 86_400,
        },
      });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get("Location");
      if (!location) return null;
      currentUrl = new URL(location, currentUrl).toString();
      if (!isAllowedAssetUrl(currentUrl, env)) return null;
    }
    if (!response.ok) return null;

    const contentType = inferredType(
      response.url || currentUrl,
      response.headers.get("Content-Type"),
    );
    if (!contentType) return null;
    const declaredSize = Number(response.headers.get("Content-Length") || 0);
    if (declaredSize > maxBytes) return null;
    const buffer = await response.arrayBuffer();
    if (!buffer.byteLength || buffer.byteLength > maxBytes) return null;

    const dataUri = `data:${contentType};base64,${toBase64(buffer)}`;
    imageCache.set(imageUrl, {
      dataUri,
      expiresAt: Date.now() + cacheTtlMs,
    });
    while (imageCache.size > CACHE_LIMIT) {
      imageCache.delete(imageCache.keys().next().value);
    }
    return dataUri;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function clearAssetCache() {
  imageCache.clear();
}
