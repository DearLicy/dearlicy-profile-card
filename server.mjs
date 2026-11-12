import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import worker from "./src/index.js";
import { FileSiteStore } from "./server/site-store.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MAX_REQUEST_BYTES = 1024 * 1024;

function parseEnv(contents) {
  const output = {};
  for (const rawLine of String(contents).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
  return output;
}

async function loadEnvironment() {
  try {
    parseEnv(await readFile(path.join(ROOT, ".env"), "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.warn("Unable to read .env; continuing with process environment.");
    }
  }
}

function externalOrigin(request) {
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

async function main() {
  await loadEnvironment();
  const adminSecret = String(process.env.ADMIN_SECRET || "");
  if (adminSecret.length < 24) {
    throw new Error(
      "ADMIN_SECRET must be configured and contain at least 24 characters.",
    );
  }
  const dataDir = path.resolve(
    process.env.DATA_DIR || path.join(ROOT, "data"),
  );
  const store = new FileSiteStore({
    dataDir,
    adminSecret,
    defaults: {
      mode: process.env.SITE_MODE === "private" ? "private" : "public",
      defaultUsername: process.env.DEFAULT_USERNAME || "DearLicy",
      repoUrl:
        process.env.PUBLIC_REPO_URL ||
        "https://github.com/DearLicy/dearlicy-profile-card",
    },
  });
  const env = {
    ...process.env,
    ADMIN_SECRET: adminSecret,
    SITE_STORE: store,
  };
  const port = Number(process.env.PORT || 3410);
  const host = process.env.HOST || "127.0.0.1";

  const server = http.createServer(async (request, response) => {
    const pending = [];
    const ctx = {
      waitUntil(promise) {
        pending.push(Promise.resolve(promise).catch(() => undefined));
      },
    };
    try {
      const origin = externalOrigin(request);
      const url = new URL(request.url || "/", origin);
      const headers = new Headers();
      for (const [name, value] of Object.entries(request.headers)) {
        if (Array.isArray(value)) headers.set(name, value.join(", "));
        else if (value !== undefined) headers.set(name, value);
      }
      if (!headers.has("X-Real-IP")) {
        headers.set("X-Real-IP", request.socket.remoteAddress || "local");
      }
      const body = await bodyBuffer(request);
      const workerRequest = new Request(url, {
        method: request.method,
        headers,
        ...(body && body.length ? { body } : {}),
      });
      const workerResponse = await worker.fetch(workerRequest, env, ctx);
      await Promise.allSettled(pending);
      const responseBody = await workerResponse.arrayBuffer();
      const responseHeaders = {};
      for (const [name, value] of workerResponse.headers.entries()) {
        responseHeaders[name] = value;
      }
      responseHeaders["Content-Length"] = String(responseBody.byteLength);
      response.writeHead(workerResponse.status, responseHeaders);
      response.end(
        request.method === "HEAD" ? undefined : Buffer.from(responseBody),
      );
      const logPath = url.pathname.startsWith("/admin")
        ? url.pathname
        : `${url.pathname}${url.search}`;
      console.log(
        `${request.method} ${logPath} ${workerResponse.status}`,
      );
    } catch (error) {
      const status = Number(error?.status) || 500;
      console.error("Request failed", {
        path: request.url,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      const message =
        status === 413
          ? "Request body is too large."
          : "The server could not complete this request.";
      response.writeHead(status, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Length": String(Buffer.byteLength(message)),
      });
      response.end(message);
    }
  });

  server.listen(port, host, () => {
    console.log(`Profile Card Studio listening on http://${host}:${port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received; closing HTTP server.`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
