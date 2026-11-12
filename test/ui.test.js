import assert from "node:assert/strict";
import test from "node:test";

import {
  renderAdminDashboardPage,
  renderAdminLoginPage,
} from "../src/admin-page.js";
import { renderStudioPage } from "../src/page.js";

const nativeControlPattern = /<(?:button|input|textarea|select|option)\b/i;

function assertComponentUi(html) {
  assert.match(html, /<html lang="zh-CN"/);
  assert.match(html, /type="importmap"/);
  assert.match(html, /shoelace\/components\/button\/button\.js/);
  assert.match(html, /shoelace\/components\/input\/input\.js/);
  assert.doesNotMatch(html, nativeControlPattern);
  assert.doesNotMatch(html, /\bOAuth\b|\boauth\b/);
}

test("studio and admin screens use the shared component system", () => {
  const studio = renderStudioPage({
    origin: "https://profile.example.com",
    defaultUsername: "DearLicy",
  });
  const login = renderAdminLoginPage({ origin: "https://profile.example.com" });
  const dashboard = renderAdminDashboardPage({
    origin: "https://profile.example.com",
  });

  assertComponentUi(studio);
  assertComponentUi(login);
  assertComponentUi(dashboard);
  assert.match(studio, /GitHub 仓库/);
  assert.match(login, /管理员密钥/);
  assert.match(dashboard, /运行总览/);
});
