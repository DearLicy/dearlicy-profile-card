import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import worker from "../src/index.js";
import { FileSiteStore } from "../server/site-store.mjs";

const baseEnv = {
  SITE_MODE: "public",
  DEFAULT_USERNAME: "DearLicy",
  PUBLIC_REPO_URL: "https://github.com/DearLicy/dearlicy-profile-card",
};

function request(path, options = {}) {
  return new Request(`https://profile.example.com${path}`, options);
}

function sampleWebp(width = 32, height = 24) {
  const buffer = Buffer.alloc(30);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(buffer.byteLength - 8, 4);
  buffer.write("WEBP", 8, "ascii");
  buffer.write("VP8X", 12, "ascii");
  buffer.writeUInt32LE(10, 16);
  buffer.writeUIntLE(width - 1, 24, 3);
  buffer.writeUIntLE(height - 1, 27, 3);
  return buffer;
}

test("router exposes health, site metadata and method guards without upstream calls", async () => {
  const health = await worker.fetch(request("/health"), baseEnv, {});
  assert.equal(health.status, 200);
  const healthPayload = await health.json();
  assert.equal(healthPayload.ok, true);
  assert.equal(healthPayload.mode, "public");

  const site = await worker.fetch(request("/api/site"), baseEnv, {});
  assert.equal(site.status, 200);
  const sitePayload = await site.json();
  assert.deepEqual(sitePayload.allowedUsers, []);
  assert.equal(sitePayload.allowPublicUploads, false);

  const method = await worker.fetch(
    request("/", { method: "POST" }),
    baseEnv,
    {},
  );
  assert.equal(method.status, 405);

  const missing = await worker.fetch(request("/not-a-route"), baseEnv, {});
  assert.equal(missing.status, 404);
});

test("private instances reject unlisted profiles before requesting GitHub", async () => {
  const env = {
    ...baseEnv,
    SITE_MODE: "private",
    DEFAULT_USERNAME: "DearLicy",
    ALLOWED_USERS: "DearLicy",
  };
  const store = {
    async getPublicConfig() {
      return {
        mode: "private",
        defaultUsername: "DearLicy",
        allowedUsers: ["DearLicy"],
        repoUrl: baseEnv.PUBLIC_REPO_URL,
        card: {},
        updatedAt: "",
      };
    },
    async getSecrets() {
      return {};
    },
  };
  const response = await worker.fetch(
    request("/api/summary?username=torvalds"),
    { ...env, SITE_STORE: store },
    {},
  );
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, "PROFILE_NOT_ALLOWED");
});

test("admin login issues an HttpOnly session and protects configuration APIs", async () => {
  const secret = "a-test-admin-secret-with-more-than-24-characters";
  const site = {
    mode: "public",
    defaultUsername: "DearLicy",
    allowedUsers: ["DearLicy"],
    repoUrl: baseEnv.PUBLIC_REPO_URL,
    card: {},
    updatedAt: "",
  };
  const store = {
    async getPublicConfig() {
      return site;
    },
    async getSecrets() {
      return {};
    },
    async status() {
      return { persisted: true, hasToken: false, source: "", fileMode: "100600" };
    },
  };
  const env = { ...baseEnv, ADMIN_SECRET: secret, SITE_STORE: store };

  const unauthorized = await worker.fetch(
    request("/admin/api/config"),
    env,
    {},
  );
  assert.equal(unauthorized.status, 401);

  const login = await worker.fetch(
    request("/admin/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    }),
    env,
    {},
  );
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie");
  assert.match(cookie, /^pcard_admin=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);

  const dashboard = await worker.fetch(
    request("/admin/api/config", { headers: { Cookie: cookie.split(";")[0] } }),
    env,
    {},
  );
  assert.equal(dashboard.status, 200);
  const payload = await dashboard.json();
  assert.equal(payload.site.defaultUsername, "DearLicy");
  assert.equal(payload.github.configured, false);
});

test("image library supports visitor submissions and administrator moderation", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "profile-card-router-"));
  const secret = "an-image-test-admin-secret-with-24-chars";
  try {
    const store = new FileSiteStore({
      dataDir: directory,
      adminSecret: secret,
      defaults: { defaultUsername: "DearLicy" },
    });
    const env = { ...baseEnv, ADMIN_SECRET: secret, SITE_STORE: store };

    const disabled = await worker.fetch(request("/api/images"), env, {});
    assert.equal(disabled.status, 200);
    assert.equal((await disabled.json()).allowPublicUploads, false);

    const rejected = await worker.fetch(
      request("/api/images", {
        method: "POST",
        headers: { "Content-Type": "image/webp" },
        body: sampleWebp(),
      }),
      env,
      {},
    );
    assert.equal(rejected.status, 403);

    await store.updateConfig({
      mode: "public",
      allowPublicUploads: true,
      defaultUsername: "DearLicy",
    });

    const login = await worker.fetch(
      request("/admin/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      }),
      env,
      {},
    );
    const cookie = login.headers.get("set-cookie").split(";")[0];

    const upload = await worker.fetch(
      request("/api/images?label=Visitor%20photo", {
        method: "POST",
        headers: { "Content-Type": "image/webp" },
        body: sampleWebp(),
      }),
      env,
      {},
    );
    assert.equal(upload.status, 201);
    const uploaded = await upload.json();
    assert.equal(uploaded.pending, true);
    assert.equal(uploaded.image.published, false);

    const publicBefore = await (await worker.fetch(request("/api/images"), env, {})).json();
    assert.equal(publicBefore.images.length, 0);
    assert.equal(publicBefore.allowPublicUploads, true);

    const adminList = await worker.fetch(
      request("/admin/api/images", { headers: { Cookie: cookie } }),
      env,
      {},
    );
    assert.equal(adminList.status, 200);
    const library = await adminList.json();
    assert.equal(library.images.length, 1);
    assert.equal(library.stats.pending, 1);

    const hiddenAsset = await worker.fetch(
      request("/images/" + uploaded.image.id + ".webp"),
      env,
      {},
    );
    assert.equal(hiddenAsset.status, 404);

    const publish = await worker.fetch(
      request("/admin/api/images/" + uploaded.image.id, {
        method: "PATCH",
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ published: true }),
      }),
      env,
      {},
    );
    assert.equal(publish.status, 200);

    const publicAfter = await (await worker.fetch(request("/api/images"), env, {})).json();
    assert.equal(publicAfter.images.length, 1);
    assert.equal(publicAfter.images[0].id, uploaded.image.id);
    assert.equal(
      publicAfter.images[0].url,
      "https://profile.example.com/images/" + uploaded.image.id + ".webp",
    );

    const asset = await worker.fetch(
      request("/images/" + uploaded.image.id + ".webp"),
      env,
      {},
    );
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get("content-type"), "image/webp");
    assert.match(asset.headers.get("cache-control"), /immutable/);

    const remove = await worker.fetch(
      request("/admin/api/images/" + uploaded.image.id, {
        method: "DELETE",
        headers: { Cookie: cookie },
      }),
      env,
      {},
    );
    assert.equal(remove.status, 200);
    assert.equal((await worker.fetch(request("/api/images"), env, {})).status, 200);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
