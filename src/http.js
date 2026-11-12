export const CARD_CACHE_CONTROL =
  "public, max-age=300, s-maxage=300, stale-while-revalidate=1200, stale-if-error=86400";
export const PRIVATE_CARD_CACHE_CONTROL =
  "private, max-age=300, stale-while-revalidate=1200";
export const ERROR_CARD_CACHE_CONTROL =
  "public, max-age=60, s-maxage=60, stale-while-revalidate=300";
export const PAGE_CSP =
  "default-src 'none'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https: data:; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

export const BASE_HEADERS = Object.freeze({
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
});

export function responseHeaders(values = {}) {
  return new Headers({ ...BASE_HEADERS, ...values });
}

export function emptyBody(request, body) {
  return request.method === "HEAD" ? null : body;
}

export function cacheState(meta) {
  if (meta.stale) return "STALE";
  return meta.cached ? "HIT" : "MISS";
}

export function jsonResponse(request, status, payload, extraHeaders = {}) {
  return new Response(
    emptyBody(request, JSON.stringify(payload)),
    {
      status,
      headers: responseHeaders({
        "Content-Type": "application/json; charset=utf-8",
        ...extraHeaders,
      }),
    },
  );
}

export function htmlResponse(request, status, body, extraHeaders = {}) {
  return new Response(emptyBody(request, body), {
    status,
    headers: responseHeaders({
      "Content-Type": "text/html; charset=utf-8",
      ...extraHeaders,
    }),
  });
}

export function methodNotAllowed(request, allow = "GET, HEAD") {
  return jsonResponse(
    request,
    405,
    { error: "METHOD_NOT_ALLOWED" },
    {
      "Cache-Control": "no-store",
      Allow: allow,
    },
  );
}

export function notFound(request) {
  return jsonResponse(
    request,
    404,
    { error: "NOT_FOUND" },
    { "Cache-Control": "no-store" },
  );
}
