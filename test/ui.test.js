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
  assert.match(html, /shoelace\/components\/progress-bar\/progress-bar\.js/);
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
  assert.match(studio, /id="appShell" data-view="landing"/);
  assert.match(studio, /id="resultView" hidden/);
  assert.match(studio, /id="changeUserButton"/);
  assert.match(studio, /id="resultRefreshButton"/);
  assert.match(studio, /showLanding\(\);\s*<\/script>/);
  assert.doesNotMatch(studio, /const cached = readCachedSummary/);
  assert.match(studio, /align-items:\s*end/);
  assert.match(studio, /sl-input::part\(form-control-label\)/);
  assert.match(studio, /\.editor-tabs sl-tab \{ flex: 1 1 0;/);
  assert.match(studio, /class="range-name" id="bgTLName"/);
  assert.match(studio, /aria-labelledby="bgTLName"/);
  assert.match(
    studio,
    /id="bgTLName"[\s\S]*id="bgTRName"[\s\S]*id="bgBLName"[\s\S]*id="bgBRName"/,
  );
  assert.match(studio, /const corners = \["tl", "tr", "bl", "br"\]/);
  assert.match(studio, /id="uploadImageButton"/);
  assert.match(studio, /id="imageLibrary"/);
  assert.match(studio, /id="imageUploadProgress" value="0"/);
  assert.match(studio, /<sl-drawer id="imageDrawer"/);
  assert.match(studio, /id="openImageDrawer"/);
  assert.match(studio, /id="selectedImagePreview"/);
  assert.match(studio, /column-count: 2/);
  assert.match(studio, /\.image-drawer::part\(panel\) \{ background: var\(--canvas\); \}/);
  assert.match(studio, /\.github-link::part\(label\) \{ display: none; \}/);
  assert.doesNotMatch(studio, /图片会完整显示|不再裁切成长条|瀑布流预览/);
  assert.doesNotMatch(studio, /library-card-meta/);
  assert.match(studio, /shoelace\/components\/drawer\/drawer\.js/);
  assert.match(studio, /图片库/);
  assert.doesNotMatch(studio, /背景图片 URL|自定义头像 URL|id="avatarUrl"|id="backgroundUrl"/);
  assert.match(
    studio,
    /\.editor-tabs::part\(tabs\) \{ border-bottom: 0;/,
  );
  assert.match(studio, /sl-theme-dark/);
  assert.doesNotMatch(studio, /syncShoelaceTheme/);
  assert.match(login, /管理员密钥/);
  assert.match(dashboard, /运行总览/);
  assert.match(dashboard, /\[hidden\] \{ display: none !important; \}/);
  assert.match(dashboard, /sl-select::part\(listbox\)/);
  assert.match(dashboard, /sl-button\[variant="primary"\]::part\(label\)/);
  assert.match(dashboard, /sl-input::part\(form-control-label\)/);
  assert.match(dashboard, /class="range-name" id="bgTLName"/);
  assert.match(
    dashboard,
    /id="bgTLName"[\s\S]*id="bgTRName"[\s\S]*id="bgBLName"[\s\S]*id="bgBRName"/,
  );
  assert.match(dashboard, /const corners = \["tl", "tr", "bl", "br"\]/);
  assert.match(dashboard, /id="allowPublicUploads"/);
  assert.match(dashboard, /id="adminImageGrid"/);
  assert.match(dashboard, /id="imageLightboxDialog"/);
  assert.match(dashboard, /id="imageLightboxImage"/);
  assert.match(dashboard, /admin-image-preview/);
  assert.match(dashboard, /object-fit: contain/);
  assert.match(dashboard, /<sl-dialog id="imageDeleteDialog"/);
  assert.match(dashboard, /shoelace\/components\/dialog\/dialog\.js/);
  assert.match(dashboard, /图片库/);
  assert.doesNotMatch(dashboard, /背景图片 URL|自定义头像 URL|id="avatarUrl"|id="backgroundUrl"/);
  assert.match(dashboard, /"accent":"#E8442A"/);
  assert.doesNotMatch(dashboard, /token-help::part\(summary\) \{ display: flex/);
});
