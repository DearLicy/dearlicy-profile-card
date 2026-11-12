import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function parseEnv(contents, target = process.env) {
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
    if (!(key in target)) target[key] = value;
  }
}

export async function loadEnvironment(root = ROOT) {
  try {
    parseEnv(await readFile(path.join(root, ".env"), "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.warn("Unable to read .env; continuing with process environment.");
    }
  }
}

export function applicationSettings(environment = process.env) {
  const adminSecret = String(environment.ADMIN_SECRET || "");
  if (adminSecret.length < 24) {
    throw new Error(
      "ADMIN_SECRET must be configured and contain at least 24 characters.",
    );
  }
  return {
    adminSecret,
    dataDir: path.resolve(
      environment.DATA_DIR || path.join(ROOT, "data"),
    ),
    port: Number(environment.PORT || 3410),
    host: environment.HOST || "127.0.0.1",
    siteDefaults: {
      mode: environment.SITE_MODE === "private" ? "private" : "public",
      defaultUsername: environment.DEFAULT_USERNAME || "DearLicy",
      repoUrl:
        environment.PUBLIC_REPO_URL ||
        "https://github.com/DearLicy/dearlicy-profile-card",
    },
  };
}
