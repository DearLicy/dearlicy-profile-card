import http from "node:http";

import { createVendorHandler } from "./vendor.mjs";

const MAX_REQUEST_BYTES = 1024 * 1024;
const REDACTED_QUERY_KEYS = new Set([
  "bg",
  "bgData",
  "bgImage",
  "photo",
  "url",
  "user",
  "username",
  "token",
]);

export function externalOrigin(request) {
  const host = String(
    request.headers["x-forwarded-host"] || request.headers.host || "127.0.0.1",
  )
    .split(",")[0]
    .trim();
  const proto = String(request.headers["x-forwarded-proto"] || "http")
    .split(",")[0]
    .trim();
  return `${proto === "https" ? "https" : "http"}://${host}`;
}

async function bodyBuffer(request) {
  if (["GET", "HEAD"].includes(request.method || "GET")) return undefined;
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_REQUEST_BYTES) {
      const error = new Error("REQUEST_TOO_LARGE");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function requestHeaders(request) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) headers.set(name, value.join(", "));
    else if (value !== undefined) headers.set(name, value);
  }
  if (!headers.has("X-Real-IP")) {
    headers.set("X-Real-IP", request.socket.remoteAddress || "local");
  }
  return headers;
}

function executionContext() {
  const pending = [];
  return {
    pending,
    ctx: {
      waitUntil(promise) {
        pending.push(Promise.resolve(promise).catch(() => undefined));
      },
    },
  };
}

function responseHeaders(workerResponse, byteLength) {
  const output = {};
  for (const [name, value] of workerResponse.headers.entries()) {
    output[name] = value;
  }
  output["Content-Length"] = String(byteLength);
  return output;
}

function safeRequestPath(url) {
  if (url.pathname.startsWith("/admin")) return url.pathname;
  const params = new URLSearchParams(url.search);
  let changed = false;
  for (const key of REDACTED_QUERY_KEYS) {
    if (params.has(key)) {
      params.set(key, "[REDACTED]");
      changed = true;
    }
  }
  const search = changed ? `?${params.toString()}` : url.search;
  return `${url.pathname}${search}`;
}

function logRequest(request, url, status) {
  const logPath = safeRequestPath(url);
  const compact = logPath.length > 600 ? `${logPath.slice(0, 600)}…` : logPath;
  console.log(`${request.method} ${compact} ${status}`);
}

function errorStatus(error) {
  return Number(error?.status) || 500;
}

function writeFailure(response, error, requestUrl) {
  let safePath = "/";
  try {
    if (requestUrl) {
      safePath = safeRequestPath(new URL(requestUrl, "http://127.0.0.1"));
    }
  } catch {
    safePath = "/";
  }
  const status = errorStatus(error);
  console.error("Request failed", {
    path: safePath,
    message: error instanceof Error ? error.message : "Unknown error",
  });
  const message =
    status === 413
      ? "Request body is too large."
      : "The server could not complete this request.";
  if (response.headersSent) {
    response.end();
    return;
  }
  response.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": String(Buffer.byteLength(message)),
  });
  response.end(message);
}

export function createApplication({ worker, env, root }) {
  const serveVendorAsset = createVendorHandler(root);

  const server = http.createServer(
    { maxHeaderSize: 64 * 1024 },
    async (request, response) => {
    try {
      if (await serveVendorAsset(request, response)) return;
      const origin = externalOrigin(request);
      const url = new URL(request.url || "/", origin);
      const body = await bodyBuffer(request);
      const workerRequest = new Request(url, {
        method: request.method,
        headers: requestHeaders(request),
        ...(body?.length ? { body } : {}),
      });
      const execution = executionContext();
      const workerResponse = await worker.fetch(
        workerRequest,
        env,
        execution.ctx,
      );
      await Promise.allSettled(execution.pending);
      const responseBody = await workerResponse.arrayBuffer();
      response.writeHead(
        workerResponse.status,
        responseHeaders(workerResponse, responseBody.byteLength),
      );
      response.end(
        request.method === "HEAD" ? undefined : Buffer.from(responseBody),
      );
      logRequest(request, url, workerResponse.status);
    } catch (error) {
      writeFailure(response, error, request.url);
    }
    },
  );

  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  return server;
}
