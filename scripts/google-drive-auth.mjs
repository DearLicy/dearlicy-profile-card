#!/usr/bin/env node

import { createHash, randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { access, chmod, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const DEFAULT_FOLDER_NAME = "Profile Card Image Library";
const DEFAULT_PORT = 53682;
const AUTH_TIMEOUT_MS = 10 * 60 * 1000;

function base64url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function commandOption(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  return process.argv[index + 1] || fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

export function buildAuthUrl({
  clientId,
  redirectUri,
  state,
  codeChallenge,
}) {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", DRIVE_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function exchangeCode({
  code,
  clientId,
  clientSecret,
  redirectUri,
  codeVerifier,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.refresh_token) {
    const reason =
      payload.error_description || payload.error || "token exchange failed";
    throw new Error(`Google OAuth 授权失败：${reason}`);
  }
  return payload;
}

function driveQueryString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function folderIdFrom(value) {
  const input = String(value || "").trim();
  if (!input) return "";
  return input.match(/\/folders\/([A-Za-z0-9_-]+)/)?.[1] || input;
}

export async function ensureDriveFolder({
  accessToken,
  folderId = "",
  folderName = DEFAULT_FOLDER_NAME,
  fetchImpl = fetch,
}) {
  if (folderId) return folderId;
  const headers = { Authorization: `Bearer ${accessToken}` };
  const query = new URLSearchParams({
    q: [
      `name = '${driveQueryString(folderName)}'`,
      "mimeType = 'application/vnd.google-apps.folder'",
      "trashed = false",
    ].join(" and "),
    spaces: "drive",
    fields: "files(id,name)",
    pageSize: "10",
  });
  const listed = await fetchImpl(`${DRIVE_API}/files?${query}`, { headers });
  const listing = await listed.json().catch(() => ({}));
  if (!listed.ok) {
    throw new Error(
      `无法查询 Google Drive 文件夹：${listing?.error?.message || listed.status}`,
    );
  }
  const existing = Array.isArray(listing.files) ? listing.files[0] : null;
  if (existing?.id) return existing.id;

  const created = await fetchImpl(`${DRIVE_API}/files?fields=id,name`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  const folder = await created.json().catch(() => ({}));
  if (!created.ok || !folder.id) {
    throw new Error(
      `无法创建 Google Drive 文件夹：${folder?.error?.message || created.status}`,
    );
  }
  return folder.id;
}

function openBrowser(url) {
  const [command, args] =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]];
  execFile(command, args, () => undefined);
}

async function promptForMissing(clientId, clientSecret) {
  if (clientId && clientSecret) return { clientId, clientSecret };
  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    console.log(
      "建议先在 Google Cloud 创建 OAuth 客户端（类型：桌面应用），再通过环境变量传入凭据。",
    );
    const nextClientId =
      clientId ||
      (
        await terminal.question("GOOGLE_DRIVE_CLIENT_ID: ")
      ).trim();
    const nextClientSecret =
      clientSecret ||
      (
        await terminal.question("GOOGLE_DRIVE_CLIENT_SECRET: ")
      ).trim();
    return { clientId: nextClientId, clientSecret: nextClientSecret };
  } finally {
    terminal.close();
  }
}

async function waitForAuthorization({ port, state }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (server.listening) server.close();
      if (error) reject(error);
      else resolve(code);
    };
    const server = http.createServer((request, response) => {
      const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
      if (url.pathname !== "/oauth2callback") {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }
      if (url.searchParams.get("state") !== state) {
        response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("State 校验失败。请关闭此页面并重新运行授权命令。");
        finish(new Error("OAuth state mismatch"));
        return;
      }
      const error = url.searchParams.get("error");
      if (error) {
        response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        response.end(`授权失败：${error}`);
        finish(new Error(`Google OAuth 返回错误：${error}`));
        return;
      }
      const code = url.searchParams.get("code");
      if (!code) {
        response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("缺少授权码。");
        finish(new Error("Google OAuth callback did not include a code"));
        return;
      }
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      response.end(
        "<!doctype html><meta charset=\"utf-8\"><title>授权完成</title><style>body{font-family:system-ui;max-width:38rem;margin:12vh auto;padding:2rem;line-height:1.7}</style><h1>Google Drive 授权完成</h1><p>你可以关闭这个页面，回到终端查看结果。</p>",
      );
      finish(null, code);
    });
    const timeout = setTimeout(() => {
      finish(new Error("等待 Google OAuth 回调超时。"));
    }, AUTH_TIMEOUT_MS);
    timeout.unref();
    server.once("error", (error) => {
      finish(error);
    });
    server.listen(port, "127.0.0.1");
  });
}

async function writeCredentialFile(filePath, values) {
  const contents = [
    "# Generated by npm run google:drive:auth",
    "IMAGE_STORAGE_DRIVER=google-drive",
    `GOOGLE_DRIVE_FOLDER_ID=${values.folderId}`,
    `GOOGLE_DRIVE_CLIENT_ID=${values.clientId}`,
    `GOOGLE_DRIVE_CLIENT_SECRET=${values.clientSecret}`,
    `GOOGLE_DRIVE_REFRESH_TOKEN=${values.refreshToken}`,
    "",
  ].join("\n");
  await writeFile(filePath, contents, { mode: 0o600, flag: "wx" });
  await chmod(filePath, 0o600);
}

async function main() {
  const port = Number(commandOption("--port", DEFAULT_PORT));
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("--port 必须是 1024–65535 之间的整数。");
  }
  const stdout = hasFlag("--stdout");
  const outputPath = path.resolve(
    commandOption("--write", ".env.google-drive"),
  );
  if (!stdout) {
    try {
      await access(outputPath);
      throw new Error(
        `凭据文件已存在：${outputPath}。请先移除，或用 --write 指定其他路径。`,
      );
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  let {
    GOOGLE_DRIVE_CLIENT_ID: clientId = "",
    GOOGLE_DRIVE_CLIENT_SECRET: clientSecret = "",
  } = process.env;
  ({ clientId, clientSecret } = await promptForMissing(clientId, clientSecret));
  if (!clientId || !clientSecret) {
    throw new Error("缺少 Google OAuth 客户端 ID 或客户端密钥。");
  }

  const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
  const state = randomBytes(24).toString("hex");
  const codeVerifier = base64url(randomBytes(48));
  const codeChallenge = base64url(
    createHash("sha256").update(codeVerifier).digest(),
  );
  const authUrl = buildAuthUrl({
    clientId,
    redirectUri,
    state,
    codeChallenge,
  });

  console.log("\n在浏览器中打开以下地址并完成授权：\n");
  console.log(authUrl);
  console.log(
    "\n授权 scope 为 Google Drive 完整读写权限，仅用于访问本实例创建的图片文件。",
  );
  const authorization = waitForAuthorization({ port, state });
  if (!hasFlag("--no-open")) openBrowser(authUrl);
  const code = await authorization;
  const token = await exchangeCode({
    code,
    clientId,
    clientSecret,
    redirectUri,
    codeVerifier,
  });

  const folderId = await ensureDriveFolder({
    accessToken: token.access_token,
    folderId: folderIdFrom(process.env.GOOGLE_DRIVE_FOLDER_ID),
    folderName: commandOption("--folder-name", DEFAULT_FOLDER_NAME),
  });
  const values = {
    folderId,
    clientId,
    clientSecret,
    refreshToken: token.refresh_token,
  };

  if (stdout) {
    console.log("\n请将以下值写入服务器 .env，并妥善保管：\n");
    console.log("IMAGE_STORAGE_DRIVER=google-drive");
    console.log(`GOOGLE_DRIVE_FOLDER_ID=${folderId}`);
    console.log(`GOOGLE_DRIVE_CLIENT_ID=${clientId}`);
    console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${clientSecret}`);
    console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${token.refresh_token}`);
    return;
  }

  await writeCredentialFile(outputPath, values);
  console.log(`\n凭据已写入 ${outputPath}（权限 0600）。`);
  console.log(`Google Drive 文件夹 ID：${folderId}`);
  console.log(
    "请将该文件中的五项配置合并到服务器 .env，然后删除本地生成文件。",
  );
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
