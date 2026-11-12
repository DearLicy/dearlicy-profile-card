import { readFile } from "node:fs/promises";
import path from "node:path";

const TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function vendorRoots(root) {
  return new Map([
    ["/vendor/shoelace/", path.join(root, "node_modules", "@shoelace-style", "shoelace", "dist")],
    ["/vendor/lit/", path.join(root, "node_modules", "lit")],
    ["/vendor/lit-html/", path.join(root, "node_modules", "lit-html")],
    ["/vendor/lit-element/", path.join(root, "node_modules", "lit-element")],
    ["/vendor/@lit/reactive-element/", path.join(root, "node_modules", "@lit", "reactive-element")],
    ["/vendor/@lit-labs/ssr-dom-shim/", path.join(root, "node_modules", "@lit-labs", "ssr-dom-shim")],
    ["/vendor/@shoelace-style/localize/", path.join(root, "node_modules", "@shoelace-style", "localize")],
    ["/vendor/@floating-ui/dom/", path.join(root, "node_modules", "@floating-ui", "dom")],
    ["/vendor/@floating-ui/core/", path.join(root, "node_modules", "@floating-ui", "core")],
    ["/vendor/@floating-ui/utils/", path.join(root, "node_modules", "@floating-ui", "utils")],
    ["/vendor/@ctrl/tinycolor/", path.join(root, "node_modules", "@ctrl", "tinycolor")],
    ["/vendor/composed-offset-position/", path.join(root, "node_modules", "composed-offset-position")],
  ]);
}

function resolveVendorPath(roots, requestUrl) {
  const url = new URL(requestUrl || "/", "http://localhost");
  const match = [...roots].find(([prefix]) => url.pathname.startsWith(prefix));
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

export function createVendorHandler(root) {
  const roots = vendorRoots(root);
  return async function serveVendorAsset(request, response) {
    const filename = resolveVendorPath(roots, request.url);
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
    const type = TYPES.get(path.extname(filename).toLowerCase());
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
  };
}
