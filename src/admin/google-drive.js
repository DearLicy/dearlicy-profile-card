import { randomBytes } from "node:crypto";

import {
  ensureGoogleDriveFolder,
  exchangeGoogleDriveCode,
  fetchGoogleDriveAccount,
} from "../../server/google-drive-oauth.mjs";
import {
  adminJsonResponse,
  adminRedirect,
  readAdminJson,
} from "./http.js";
import { externalOrigin, safeEqual, sameOrigin } from "./request.js";
import { browserCookie, requestCookies } from "./session.js";

const GOOGLE_STATE_COOKIE = "pcard_google_oauth";
const GOOGLE_STATE_PATH = "/admin/oauth/google";
const GOOGLE_STATE_SECONDS = 10 * 60;

let migrationJob = {
  status: "idle",
  startedAt: "",
  finishedAt: "",
  total: 0,
  copied: 0,
  skipped: 0,
  failed: 0,
  message: "",
};

function stateCookie(value, request) {
  return browserCookie(GOOGLE_STATE_COOKIE, value, request, {
    maxAge: GOOGLE_STATE_SECONDS,
    path: GOOGLE_STATE_PATH,
  });
}

function clearStateCookie(request) {
  return browserCookie(GOOGLE_STATE_COOKIE, "", request, {
    maxAge: 0,
    clear: true,
    path: GOOGLE_STATE_PATH,
  });
}

function callbackUrl(request) {
  return `${externalOrigin(request)}/admin/oauth/google/callback`;
}

function storageSummary(storage) {
  return {
    driver: storage.driver,
    source: storage.source,
    clientId: storage.clientId,
    folderId: storage.folderId,
    accountEmail: storage.accountEmail,
    connectedAt: storage.connectedAt,
    hasClientSecret: storage.hasClientSecret,
    hasRefreshToken: storage.hasRefreshToken,
    hasServiceAccount: storage.hasServiceAccount,
    localImages: storage.localImages,
  };
}

export async function saveGoogleDriveClient(request, store) {
  if (!sameOrigin(request)) {
    return adminJsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  try {
    const body = await readAdminJson(request);
    const storage = await store.saveGoogleDriveClient({
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      folderId: body.folderId,
    });
    return adminJsonResponse(request, 200, {
      ok: true,
      storage: storageSummary(storage),
    });
  } catch (error) {
    return adminJsonResponse(request, error.status || 500, {
      error: "GOOGLE_CONFIG_FAILED",
      message: error.message || "Google Drive 配置保存失败。",
    });
  }
}

export async function startGoogleDriveOAuth(request, store) {
  const settings = await store.imageSettings();
  if (!settings.clientId || !settings.clientSecret) {
    return adminRedirect("/admin?google=config-required");
  }
  const state = randomBytes(24).toString("hex");
  const redirectUri = callbackUrl(request);
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", settings.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/drive");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("state", state);
  return adminRedirect(authUrl.toString(), {
    "Set-Cookie": stateCookie(state, request),
  });
}

export async function handleGoogleDriveOAuthCallback(request, store) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const cookieState = requestCookies(request)[GOOGLE_STATE_COOKIE] || "";
  const clearCookie = clearStateCookie(request);
  if (!state || !cookieState || !safeEqual(state, cookieState)) {
    return adminRedirect("/admin?google=failed", {
      "Set-Cookie": clearCookie,
    });
  }
  if (url.searchParams.get("error")) {
    return adminRedirect("/admin?google=failed", {
      "Set-Cookie": clearCookie,
    });
  }
  const code = url.searchParams.get("code");
  if (!code) {
    return adminRedirect("/admin?google=failed", {
      "Set-Cookie": clearCookie,
    });
  }
  try {
    const settings = await store.imageSettings();
    const token = await exchangeGoogleDriveCode({
      code,
      clientId: settings.clientId,
      clientSecret: settings.clientSecret,
      redirectUri: callbackUrl(request),
    });
    const account = await fetchGoogleDriveAccount({
      accessToken: token.access_token,
    });
    const folderId = await ensureGoogleDriveFolder({
      accessToken: token.access_token,
      folderId: settings.folderId,
    });
    await store.setGoogleDriveConnection({
      clientId: settings.clientId,
      refreshToken: token.refresh_token,
      folderId,
      accountEmail: account.emailAddress || account.displayName || "",
    });
    return adminRedirect("/admin?google=connected", {
      "Set-Cookie": clearCookie,
    });
  } catch (error) {
    console.error("Google Drive OAuth failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return adminRedirect("/admin?google=failed", {
      "Set-Cookie": clearCookie,
    });
  }
}

export async function disconnectGoogleDrive(request, store) {
  if (!sameOrigin(request)) {
    return adminJsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  const storage = await store.disconnectGoogleDrive();
  return adminJsonResponse(request, 200, {
    ok: true,
    storage: storageSummary(storage),
  });
}

export async function clearGoogleDriveCredentials(request, store) {
  if (!sameOrigin(request)) {
    return adminJsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  const storage = await store.clearGoogleDriveCredentials();
  return adminJsonResponse(request, 200, {
    ok: true,
    storage: storageSummary(storage),
  });
}

export async function testGoogleDriveConnection(request, store) {
  if (!sameOrigin(request)) {
    return adminJsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  const startedAt = Date.now();
  try {
    const [storage, stats] = await Promise.all([
      store.getStorageStatus(),
      store.images.stats(),
    ]);
    return adminJsonResponse(request, 200, {
      ok: true,
      driver: storage.driver,
      folderId: storage.folderId,
      accountEmail: storage.accountEmail,
      total: stats.total,
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    return adminJsonResponse(request, 502, {
      error: "GOOGLE_DRIVE_TEST_FAILED",
      message: error instanceof Error ? error.message : "Google Drive 连接测试失败。",
    });
  }
}

function emptyMigrationPayload() {
  return { ...migrationJob };
}

export function googleDriveMigrationStatus() {
  return emptyMigrationPayload();
}

export function startGoogleDriveMigration(request, store) {
  if (!sameOrigin(request)) {
    return adminJsonResponse(request, 403, { error: "ORIGIN_REJECTED" });
  }
  if (migrationJob.status === "running") {
    return adminJsonResponse(request, 409, {
      error: "MIGRATION_RUNNING",
      message: "图片迁移正在进行。",
      job: emptyMigrationPayload(),
    });
  }
  const job = {
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: "",
    total: 0,
    copied: 0,
    skipped: 0,
    failed: 0,
    message: "正在读取本地图片库…",
  };
  migrationJob = job;
  const task = (async () => {
    try {
      const storage = await store.getStorageStatus();
      if (storage.driver !== "google-drive") {
        throw new Error("当前没有启用 Google Drive 存储。");
      }
      store.localImages.resetCache();
      const images = await store.localImages.list({ includeUnpublished: true });
      job.total = images.length;
      job.message = images.length ? "正在迁移本地图片…" : "本地图片库为空。";
      for (const image of images) {
        const found = await store.localImages.get(image.id, {
          includeUnpublished: true,
        });
        if (!found) {
          job.skipped += 1;
          continue;
        }
        try {
          const imported = await store.images.import({
            id: found.image.id,
            buffer: found.buffer,
            label: found.image.label,
            category: found.image.category,
            source: found.image.source,
            published: found.image.published,
            createdAt: found.image.createdAt,
          });
          if (imported) job.copied += 1;
          else job.skipped += 1;
        } catch {
          job.failed += 1;
        }
        job.message = `已处理 ${job.copied + job.skipped + job.failed} / ${job.total} 张图片`;
      }
      job.status = "complete";
      job.message = `迁移完成：复制 ${job.copied} 张，跳过 ${job.skipped} 张，失败 ${job.failed} 张。`;
    } catch (error) {
      job.status = "failed";
      job.message = error instanceof Error ? error.message : "迁移失败。";
    } finally {
      job.finishedAt = new Date().toISOString();
    }
  })();
  task.catch(() => undefined);
  return adminJsonResponse(request, 202, {
    ok: true,
    job: emptyMigrationPayload(),
  });
}
