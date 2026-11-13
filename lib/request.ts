import "server-only";

import { createHash } from "node:crypto";

export function requestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function hashedIp(request: Request) {
  return createHash("sha256").update(requestIp(request)).digest("hex").slice(0, 24);
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const expected = forwardedHost
    ? `${request.headers.get("x-forwarded-proto") || "https"}://${forwardedHost}`
    : new URL(request.url).origin;
  return origin === expected;
}

export function externalOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    return `${request.headers.get("x-forwarded-proto") || "https"}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}

export function jsonError(
  message: string,
  status = 400,
  error = "BAD_REQUEST",
) {
  return Response.json(
    { error, message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export function jsonOk(payload: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...Object.fromEntries(new Headers(headers)),
    },
  });
}
