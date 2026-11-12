import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";

const baseEnv = {
  SITE_MODE: "public",
  DEFAULT_USERNAME: "DearLicy",
  PUBLIC_REPO_URL: "https://github.com/DearLicy/dearlicy-profile-card",
};

function request(path, options = {}) {
  return new Request(`https://profile.example.com${path}`, options);
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
