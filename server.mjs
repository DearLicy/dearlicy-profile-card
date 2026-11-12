import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import worker from "./src/index.js";
import { FileSiteStore } from "./server/site-store.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MAX_REQUEST_BYTES = 1024 * 1024;
const SHOELACE_DIST = path.join(
  ROOT,
  "node_modules",
  "@shoelace-style",
  "shoelace",
  "dist",
);
const VENDOR_ROOTS = new Map([
  ["/vendor/shoelace/", SHOELACE_DIST],
  ["/vendor/lit/", path.join(ROOT, "node_modules", "lit")],
  ["/vendor/lit-html/", path.join(ROOT, "node_modules", "lit-html")],
  ["/vendor/lit-element/", path.join(ROOT, "node_modules", "lit-element")],
  [
    "/vendor/@lit/reactive-element/",
    path.join(ROOT, "node_modules", "@lit", "reactive-element"),
  ],
  [
    "/vendor/@lit-labs/ssr-dom-shim/",
    path.join(ROOT, "node_modules", "@lit-labs", "ssr-dom-shim"),
  ],
  [
    "/vendor/@shoelace-style/localize/",
    path.join(ROOT, "node_modules", "@shoelace-style", "localize"),
  ],
  [
    "/vendor/@floating-ui/dom/",
    path.join(ROOT, "node_modules", "@floating-ui", "dom"),
  ],
  [
    "/vendor/@floating-ui/core/",
    path.join(ROOT, "node_modules", "@floating-ui", "core"),
  ],
  [
    "/vendor/@floating-ui/utils/",
    path.join(ROOT, "node_modules", "@floating-ui", "utils"),
  ],
  [
    "/vendor/@ctrl/tinycolor/",
    path.join(ROOT, "node_modules", "@ctrl", "tinycolor"),
  ],
  [
    "/vendor/composed-offset-position/",
    path.join(ROOT, "node_modules", "composed-offset-position"),
  ],
]);
const VENDOR_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

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

function vendorPath(requestUrl) {
  const url = new URL(requestUrl || "/", "http://localhost");
  const match = [...VENDOR_ROOTS].find(([prefix]) =>
    url.pathname.startsWith(prefix),
  );
  if (!match) return null;
  const [prefix, root] = match;
  let relative;
  try {
    relative = decodeURIComponent(url.pathname.slice(prefix.length));
  } catch {
    return null;
  }
  if (
    !relative ||
    relative.includes("\0") ||
    relative.includes("\\") ||
    relative.split("/").some((part) => part === "..")
  ) {
    return null;
  }
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(`${root}${path.sep}`)) return null;
  return resolved;
}

async function serveVendorAsset(request, response) {
  const filename = vendorPath(request.url);
  if (!filename) return false;
  if (!["GET", "HEAD"].includes(request.method || "GET")) {
    response.writeHead(405, {
      Allow: "GET, HEAD",
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end("Method not allowed.");
    return true;
  }
  const type = VENDOR_TYPES.get(path.extname(filename).toLowerCase());
  if (!type) return false;
  try {
    const body = await readFile(filename);
    response.writeHead(200, {
      "Content-Type": type,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    const missing = error?.code === "ENOENT" || error?.code === "EISDIR";
    response.writeHead(missing ? 404 : 500, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end(missing ? "Asset not found." : "Asset unavailable.");
  }
  return true;
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
      if (await serveVendorAsset(request, response)) return;
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
