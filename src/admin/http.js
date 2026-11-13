export const ADMIN_JSON_LIMIT = 64 * 1024;
const ADMIN_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Security-Policy":
    "default-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' data:; font-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow",
};

export function adminHeaders(extra = {}) {
  return new Headers({ ...ADMIN_HEADERS, ...extra });
}

export function adminJsonResponse(request, status, payload, extraHeaders = {}) {
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

export function adminHtmlResponse(request, status, html, extraHeaders = {}) {
  return new Response(request.method === "HEAD" ? null : html, {
    status,
    headers: adminHeaders({
      "Content-Type": "text/html; charset=utf-8",
      ...extraHeaders,
    }),
  });
}

export function adminRedirect(location, extraHeaders = {}) {
  return new Response(null, {
    status: 302,
    headers: adminHeaders({ Location: location, ...extraHeaders }),
  });
}

export async function readAdminJson(request) {
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > ADMIN_JSON_LIMIT) {
    const error = new Error("请求体过大。");
    error.status = 413;
    throw error;
  }
  const text = await request.text();
  if (text.length > ADMIN_JSON_LIMIT) {
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
