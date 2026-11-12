import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { FileSiteStore } from "../server/site-store.mjs";

test("persists public config and encrypts stored credentials", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "profile-card-store-"));
  const adminSecret = "test-admin-secret-with-more-than-24-characters";
  try {
    const store = new FileSiteStore({
      dataDir: directory,
      adminSecret,
      defaults: { defaultUsername: "DearLicy" },
    });
    await store.updateConfig({
      mode: "private",
      defaultUsername: "DearLicy",
      allowedUsers: "DearLicy",
      card: { theme: "ocean" },
    });
    const token = "github_pat_11AA22BB33CC44DD55EE66";
    await store.setSecret("githubToken", token);

    const config = await store.getPublicConfig();
    assert.equal(config.mode, "private");
    assert.equal(config.card.theme, "ocean");

    const onDisk = await readFile(path.join(directory, "config.json"), "utf8");
    assert.ok(!onDisk.includes(token));
    assert.match(onDisk, /"githubToken": "v1\./);

    const secrets = await store.getSecrets();
    assert.equal(secrets.githubToken, token);
    assert.equal(secrets.source, "token");

    const status = await store.status();
    assert.equal(status.hasToken, true);
    assert.equal(status.fileMode, "100600");

    const wrongSecretStore = new FileSiteStore({
      dataDir: directory,
      adminSecret: "a-different-admin-secret-with-24-chars",
    });
    assert.equal((await wrongSecretStore.getSecrets()).githubToken, "");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
