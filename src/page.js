import { CARD_THEMES, DEFAULT_CARD_CONFIG } from "./config.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function json(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

const ICONS = {
  github:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.8a10.2 10.2 0 0 0-3.2 19.9c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.3-.3-4.7-1.1-4.7-5a3.9 3.9 0 0 1 1-2.7c-.1-.3-.4-1.3.1-2.7 0 0 .9-.3 2.8 1.1a9.6 9.6 0 0 1 5.1 0c1.9-1.4 2.8-1.1 2.8-1.1.5 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.7 5 .4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A10.2 10.2 0 0 0 12 1.8Z"/></svg>',
  arrow:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  copy:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M15 5H6.8A1.8 1.8 0 0 0 5 6.8V15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  external:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M10 6H6.8A1.8 1.8 0 0 0 5 7.8v9.4A1.8 1.8 0 0 0 6.8 19h9.4a1.8 1.8 0 0 0 1.8-1.8V14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.4" stroke="currentColor" stroke-width="1.7"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  refresh:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 8a7 7 0 1 0 .4 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M19 4v4h-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  admin:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 5 6v5c0 4.7 2.8 8.1 7 10 4.2-1.9 7-5.3 7-10V6l-7-3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m9.5 12 1.7 1.7 3.6-3.7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  moon:
    '<svg class="moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 15.2A8.4 8.4 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  sun:
    '<svg class="sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
};

function themeCards(activeTheme) {
  return Object.entries(CARD_THEMES)
    .map(([key, theme]) => {
      const [a, b, c] = theme.swatches;
      return `<button class="theme-card${key === activeTheme ? " is-active" : ""}" type="button" data-theme-key="${key}" aria-pressed="${key === activeTheme ? "true" : "false"}">
        <span class="theme-art" style="--swatch-a:${a};--swatch-b:${b};--swatch-c:${c}">
          <i class="theme-art-orb"></i>
          <i class="theme-art-line"></i>
        </span>
        <span class="theme-name"><strong>${escapeHtml(theme.label)}</strong><small>${escapeHtml(theme.note)}</small></span>
        <span class="theme-check" aria-hidden="true">✓</span>
      </button>`;
    })
    .join("");
}

function field({ id, label, value = "", maxlength = 64, placeholder = "", textarea = false }) {
  const safeValue = escapeHtml(value);
  const control = textarea
    ? `<textarea class="input" id="${id}" maxlength="${maxlength}" placeholder="${escapeHtml(placeholder)}">${safeValue}</textarea>`
    : `<input class="input" id="${id}" type="text" value="${safeValue}" maxlength="${maxlength}" placeholder="${escapeHtml(placeholder)}" autocomplete="off" spellcheck="false">`;
  return `<label class="field"><span>${escapeHtml(label)}</span>${control}</label>`;
}

export function renderStudioPage({
  origin,
  defaultUsername = "DearLicy",
  mode = "public",
  repoUrl = "https://github.com/DearLicy/dearlicy-profile-card",
  adminAvailable = false,
  initialCardConfig = DEFAULT_CARD_CONFIG,
}) {
  const baseOrigin = String(origin).replace(/\/+$/, "");
  const safeOrigin = escapeHtml(baseOrigin);
  const safeUsername = escapeHtml(defaultUsername);
  const safeRepoUrl = escapeHtml(repoUrl);
  const isPrivate = mode === "private";
  const modeLabel = isPrivate ? "PRIVATE INSTANCE" : "PUBLIC API";
  const modeDescription = isPrivate
    ? "仅允许管理员配置的 GitHub 用户"
    : "任何公开 GitHub 主页均可生成";
  const initial = {
    ...DEFAULT_CARD_CONFIG,
    ...initialCardConfig,
    backgroundCorners: {
      ...DEFAULT_CARD_CONFIG.backgroundCorners,
      ...(initialCardConfig.backgroundCorners || {}),
    },
  };
  const initialTheme = CARD_THEMES[initial.theme] ? initial.theme : "midnight";
  const adminLink = adminAvailable
    ? `<a class="icon-button admin-link" href="/admin" title="管理后台">${ICONS.admin}</a>`
    : "";

  return `<!doctype html>
<html lang="zh-CN" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="color-scheme" content="dark light">
  <meta name="theme-color" content="#0c0d10">
  <meta name="description" content="把任意 GitHub 主页变成一张实时更新、可定制的动态 SVG 卡片。">
  <title>Profile Card Studio · 一张会呼吸的 GitHub 卡片</title>
  <script>
    try {
      const searchTheme = new URLSearchParams(location.search).get("theme");
      document.documentElement.dataset.theme =
        searchTheme === "light" || searchTheme === "dark"
          ? searchTheme
          : localStorage.getItem("profile-card-theme") || "dark";
    } catch {}
  </script>
  <style>
    :root {
      --canvas: #0c0d10;
      --surface: #15171c;
      --surface-2: #1b1d23;
      --surface-3: #22252c;
      --field: #101217;
      --ink: #f7f3ec;
      --text-soft: #e5e0d8;
      --muted: #a29ea8;
      --dim: #74717b;
      --line: rgba(255,255,255,.09);
      --line-strong: rgba(255,255,255,.17);
      --accent: #cbb9ff;
      --accent-strong: #b59cff;
      --accent-soft: rgba(203,185,255,.11);
      --accent-line: rgba(203,185,255,.28);
      --on-accent: #17131e;
      --danger: #ee9ba3;
      --shadow: 0 34px 100px rgba(0,0,0,.5);
      --shadow-soft: 0 18px 50px rgba(0,0,0,.24);
      --ease: cubic-bezier(.22,1,.36,1);
    }
    html[data-theme="light"] {
      --canvas: #f3efe7;
      --surface: #fcfaf5;
      --surface-2: #f5f0e6;
      --surface-3: #ece6db;
      --field: #f7f2e9;
      --ink: #18161d;
      --text-soft: #302c36;
      --muted: #716c77;
      --dim: #9b949e;
      --line: rgba(24,22,29,.09);
      --line-strong: rgba(24,22,29,.17);
      --accent: #6351d5;
      --accent-strong: #513fc4;
      --accent-soft: rgba(99,81,213,.09);
      --accent-line: rgba(99,81,213,.25);
      --on-accent: #ffffff;
      --danger: #b23e4b;
      --shadow: 0 34px 100px rgba(53,42,77,.14);
      --shadow-soft: 0 18px 50px rgba(53,42,77,.08);
    }
    * { box-sizing: border-box; }
    html { min-height: 100%; background: var(--canvas); color-scheme: dark; }
    html[data-theme="light"] { color-scheme: light; }
    body {
      min-height: 100vh;
      margin: 0;
      overflow-x: hidden;
      background: var(--canvas);
      color: var(--ink);
      font-family: "Inter", "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif;
      font-size: 16px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
    }
    button, input, textarea { font: inherit; }
    button, a { -webkit-tap-highlight-color: transparent; }
    a { color: inherit; }
    .app-mesh {
      position: fixed;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      background:
        radial-gradient(circle at 8% 2%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 31%),
        radial-gradient(circle at 92% 7%, rgba(255,255,255,.04), transparent 23%),
        radial-gradient(circle at 55% 92%, color-mix(in srgb, var(--accent) 7%, transparent), transparent 35%);
    }
    html[data-theme="light"] .app-mesh {
      background:
        radial-gradient(circle at 9% 0%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 34%),
        radial-gradient(circle at 92% 4%, rgba(255,255,255,.82), transparent 25%),
        radial-gradient(circle at 58% 100%, rgba(99,81,213,.045), transparent 34%);
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 40;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      min-height: 76px;
      padding: 13px max(20px, calc((100vw - 1376px) / 2));
      border-bottom: 1px solid var(--line);
      background: color-mix(in srgb, var(--canvas) 84%, transparent);
      backdrop-filter: blur(20px) saturate(130%);
      -webkit-backdrop-filter: blur(20px) saturate(130%);
    }
    .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .brand-mark {
      position: relative;
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      flex: 0 0 auto;
      overflow: hidden;
      border-radius: 15px;
      background: var(--accent);
      color: var(--on-accent);
      font: 800 11px/1 "SFMono-Regular", Menlo, monospace;
      letter-spacing: .08em;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.35);
    }
    .brand-mark::after {
      content: "";
      position: absolute;
      width: 18px;
      height: 18px;
      border: 1px solid currentColor;
      border-radius: 50%;
      opacity: .22;
      transform: translate(13px, -13px);
    }
    .brand-copy { display: flex; flex-direction: column; min-width: 0; line-height: 1.18; }
    .brand-copy strong { font-size: 14.5px; font-weight: 700; letter-spacing: -.015em; white-space: nowrap; }
    .brand-copy span { color: var(--muted); font-size: 10.5px; letter-spacing: .035em; white-space: nowrap; }
    .mode-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 34px;
      padding: 0 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface);
      color: var(--muted);
      font: 600 9px/1 "SFMono-Regular", Menlo, monospace;
      letter-spacing: .1em;
      white-space: nowrap;
    }
    .mode-pill i {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 4px var(--accent-soft);
    }
    .mode-pill.is-private i { background: #efba77; box-shadow: 0 0 0 4px rgba(239,186,119,.1); }
    .top-actions { display: flex; align-items: center; gap: 8px; }
    .icon-button {
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      flex: 0 0 auto;
      border: 1px solid var(--line);
      border-radius: 50%;
      background: var(--surface);
      color: var(--muted);
      text-decoration: none;
      cursor: pointer;
      transition: transform 160ms var(--ease), background 180ms, color 180ms, border-color 180ms;
    }
    .icon-button:hover { color: var(--ink); background: var(--surface-2); border-color: var(--line-strong); }
    .icon-button:active { transform: scale(.96); }
    .icon-button svg { width: 18px; height: 18px; }
    .icon-button .sun { display: none; }
    html[data-theme="light"] .icon-button .sun { display: block; }
    html[data-theme="light"] .icon-button .moon { display: none; }
    .repo-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      min-height: 42px;
      padding: 0 17px;
      border: 1px solid var(--accent-line);
      border-radius: 999px;
      background: var(--accent);
      color: var(--on-accent);
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 10px 26px color-mix(in srgb, var(--accent) 19%, transparent);
      transition: transform 160ms var(--ease), background 180ms;
    }
    .repo-button:hover { transform: translateY(-1px); background: var(--accent-strong); }
    .repo-button:active { transform: scale(.98); }
    .repo-button svg { width: 16px; height: 16px; }
    .shell {
      width: min(1376px, calc(100% - 48px));
      margin: 0 auto;
      padding: 64px 0 42px;
    }
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
      gap: 34px;
      margin-bottom: 44px;
    }
    .eyebrow {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--muted);
      font: 600 10px/1.3 "SFMono-Regular", Menlo, monospace;
      letter-spacing: .15em;
    }
    .eyebrow::before { content: ""; width: 24px; height: 1px; background: var(--accent); }
    h1 {
      max-width: 880px;
      margin: 17px 0 0;
      font-size: clamp(45px, 6.2vw, 82px);
      font-weight: 620;
      letter-spacing: -.067em;
      line-height: .97;
    }
    h1 em { color: var(--accent); font-style: normal; }
    .hero-copy { max-width: 670px; margin: 20px 0 0; color: var(--muted); font-size: 15px; line-height: 1.72; }
    .hero-copy code {
      padding: 2px 6px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--surface);
      color: var(--text-soft);
      font: 11px/1.4 "SFMono-Regular", Menlo, monospace;
    }
    .hero-aside {
      display: grid;
      justify-items: end;
      gap: 10px;
      padding-bottom: 6px;
      color: var(--dim);
      text-align: right;
    }
    .hero-aside .live-line {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      color: var(--muted);
      font: 600 10px/1.3 "SFMono-Regular", Menlo, monospace;
      letter-spacing: .1em;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 5px var(--accent-soft);
      animation: livePulse 2.3s ease-in-out infinite;
    }
    .hero-aside small { font-size: 11px; }
    .search-form {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      width: min(730px, 100%);
      margin-top: 28px;
    }
    .search-field {
      position: relative;
      display: flex;
      align-items: center;
      height: 58px;
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      background: var(--surface);
      box-shadow: var(--shadow-soft);
      transition: border-color 180ms, box-shadow 180ms, background 180ms;
    }
    .search-field:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 5px var(--accent-soft), var(--shadow-soft);
    }
    .search-field > svg {
      position: absolute;
      left: 20px;
      width: 19px;
      height: 19px;
      color: var(--muted);
      pointer-events: none;
    }
    .search-field input {
      width: 100%;
      height: 100%;
      padding: 0 20px 0 52px;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--ink);
      font-size: 15px;
    }
    .search-field input::placeholder { color: var(--dim); }
    .primary-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      min-height: 58px;
      padding: 0 25px;
      border: 0;
      border-radius: 999px;
      background: var(--accent);
      color: var(--on-accent);
      font-size: 13.5px;
      font-weight: 720;
      cursor: pointer;
      box-shadow: 0 14px 34px color-mix(in srgb, var(--accent) 20%, transparent);
      transition: transform 160ms var(--ease), background 180ms, opacity 180ms;
    }
    .primary-button:hover { transform: translateY(-1px); background: var(--accent-strong); }
    .primary-button:active { transform: scale(.98); }
    .primary-button:disabled { cursor: wait; opacity: .62; transform: none; }
    .primary-button svg { width: 17px; height: 17px; }
    .form-error { min-height: 18px; margin: 8px 0 0 18px; color: var(--danger); font-size: 12px; }
    .workspace {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(350px, .49fr);
      gap: 24px;
      align-items: start;
    }
    .preview-column, .editor-column { display: grid; gap: 18px; min-width: 0; }
    .preview-shell {
      position: relative;
      padding: 10px;
      border: 1px solid var(--line);
      border-radius: 32px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }
    .preview-toolbar, .preview-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 44px;
      padding: 0 12px;
      color: var(--muted);
    }
    .preview-toolbar {
      font: 500 9px/1 "SFMono-Regular", Menlo, monospace;
      letter-spacing: .09em;
    }
    .preview-toolbar-left { display: inline-flex; align-items: center; gap: 10px; }
    .window-dots { display: inline-flex; gap: 5px; }
    .window-dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--line-strong); }
    .window-dots i:first-child { background: var(--accent); }
    .preview-toolbar .dim { color: var(--dim); }
    .preview-viewport {
      position: relative;
      min-height: 430px;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 23px;
      background:
        radial-gradient(circle at 80% 7%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 26%),
        #090a0d;
    }
    .preview-viewport img {
      display: block;
      width: 100%;
      height: auto;
      opacity: 1;
      transform: none;
    }
    .preview-skeleton {
      position: absolute;
      inset: 0;
      z-index: 1;
      display: none;
      flex-direction: column;
      gap: 15px;
      padding: 34px;
      background: #0a0b0e;
    }
    .preview-viewport.is-loading .preview-skeleton { display: flex; }
    .preview-viewport.is-ready .preview-skeleton { display: none; }
    .preview-skeleton .bar {
      height: 11px;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(255,255,255,.05), rgba(255,255,255,.12), rgba(255,255,255,.05));
      background-size: 200% 100%;
      animation: shimmer 1.4s linear infinite;
    }
    .preview-skeleton .hero-block {
      height: 145px;
      margin-top: 18px;
      border: 1px solid rgba(255,255,255,.05);
      border-radius: 18px;
      background: rgba(255,255,255,.035);
    }
    .preview-skeleton .w-42 { width: 42%; }
    .preview-skeleton .w-68 { width: 68%; }
    .preview-skeleton .w-84 { width: 84%; }
    .preview-skeleton .grid {
      display: grid;
      grid-template-columns: 1.2fr .8fr;
      gap: 14px;
      margin-top: auto;
    }
    .preview-skeleton .mini {
      height: 112px;
      border: 1px solid rgba(255,255,255,.05);
      border-radius: 18px;
      background: rgba(255,255,255,.03);
    }
    .preview-error {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: none;
      place-items: center;
      padding: 30px;
      background: #160f12;
      color: #f2d4d7;
      text-align: center;
      font-size: 13px;
    }
    .preview-error.visible { display: grid; }
    .preview-footer { min-height: 48px; font-size: 11px; }
    .sync-state { display: inline-flex; align-items: center; gap: 8px; color: var(--muted); }
    .sync-state i { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
    .ghost-mini {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      min-height: 34px;
      padding: 0 11px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: var(--muted);
      font-size: 11px;
      cursor: pointer;
      transition: background 180ms, color 180ms, transform 160ms var(--ease);
    }
    .ghost-mini:hover { background: var(--surface-2); color: var(--ink); }
    .ghost-mini:active { transform: scale(.97); }
    .ghost-mini svg { width: 15px; height: 15px; }
    .metrics-surface {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 22px;
      background: var(--surface);
      box-shadow: var(--shadow-soft);
    }
    .metric { min-width: 0; padding: 19px 20px; border-left: 1px solid var(--line); }
    .metric:first-child { border-left: 0; }
    .metric-label {
      display: block;
      margin-bottom: 8px;
      color: var(--muted);
      font: 500 8.5px/1.2 "SFMono-Regular", Menlo, monospace;
      letter-spacing: .1em;
    }
    .metric-value {
      display: block;
      min-height: 34px;
      overflow: hidden;
      color: var(--ink);
      font-size: 27px;
      font-weight: 680;
      letter-spacing: -.045em;
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .metric-value.is-loading {
      width: 2.5em;
      height: 27px;
      margin-top: 3px;
      border-radius: 8px;
      background: linear-gradient(90deg, var(--surface-2), var(--surface-3), var(--surface-2));
      background-size: 200% 100%;
      animation: shimmer 1.4s linear infinite;
      color: transparent;
    }
    .editor-surface {
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 24px;
      background: var(--surface);
      box-shadow: var(--shadow-soft);
    }
    .editor-head { padding: 20px 20px 0; }
    .editor-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
    .editor-title-row h2 { margin: 0; font-size: 16px; font-weight: 680; letter-spacing: -.018em; }
    .editor-title-row p { margin: 4px 0 0; color: var(--muted); font-size: 11.5px; }
    .micro-badge {
      color: var(--dim);
      font: 500 8px/1.4 "SFMono-Regular", Menlo, monospace;
      letter-spacing: .1em;
      white-space: nowrap;
    }
    .tabs {
      position: relative;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3px;
      margin-top: 18px;
      padding: 4px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--field);
    }
    .tab {
      min-height: 36px;
      border: 0;
      border-radius: 10px;
      background: transparent;
      color: var(--muted);
      font-size: 11.5px;
      font-weight: 650;
      cursor: pointer;
      transition: background 180ms, color 180ms, box-shadow 180ms;
    }
    .tab[aria-selected="true"] { background: var(--surface); color: var(--ink); box-shadow: 0 4px 14px rgba(0,0,0,.12); }
    .editor-body { padding: 18px 20px 20px; }
    .tab-panel { display: none; }
    .tab-panel.is-active { display: block; }
    .group-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 0 0 10px;
      color: var(--muted);
      font-size: 11px;
      font-weight: 600;
    }
    .group-label:not(:first-child) { margin-top: 19px; }
    .group-label small { color: var(--dim); font-size: 9.5px; font-weight: 500; }
    .theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .theme-card {
      display: grid;
      grid-template-columns: 46px minmax(0, 1fr) 16px;
      align-items: center;
      gap: 10px;
      min-height: 64px;
      padding: 8px 9px;
      border: 1px solid var(--line);
      border-radius: 15px;
      background: var(--field);
      color: var(--ink);
      text-align: left;
      cursor: pointer;
      transition: transform 160ms var(--ease), border-color 180ms, background 180ms;
    }
    .theme-card:hover { transform: translateY(-1px); border-color: var(--line-strong); background: var(--surface-2); }
    .theme-card:active { transform: scale(.985); }
    .theme-card.is-active { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .theme-art {
      position: relative;
      display: block;
      width: 46px;
      height: 46px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 12px;
      background: linear-gradient(135deg, var(--swatch-a), color-mix(in srgb, var(--swatch-a) 70%, black));
    }
    .theme-art-orb {
      position: absolute;
      right: 5px;
      top: 6px;
      width: 17px;
      height: 17px;
      border: 1px solid var(--swatch-c);
      border-radius: 50%;
      opacity: .8;
    }
    .theme-art-line {
      position: absolute;
      left: 7px;
      bottom: 9px;
      width: 27px;
      height: 2px;
      border-radius: 2px;
      background: var(--swatch-b);
    }
    .theme-art-line::after {
      content: "";
      display: block;
      width: 17px;
      height: 2px;
      margin-top: 4px;
      border-radius: 2px;
      background: var(--swatch-c);
      opacity: .52;
    }
    .theme-name { display: grid; min-width: 0; gap: 2px; }
    .theme-name strong { font-size: 11.5px; font-weight: 650; }
    .theme-name small { overflow: hidden; color: var(--dim); font-size: 8.5px; text-overflow: ellipsis; white-space: nowrap; }
    .theme-check { opacity: 0; color: var(--accent); font-size: 13px; font-weight: 800; transition: opacity 160ms; }
    .theme-card.is-active .theme-check { opacity: 1; }
    .field { display: grid; gap: 6px; min-width: 0; }
    .field + .field { margin-top: 11px; }
    .field span { color: var(--muted); font-size: 10.5px; font-weight: 600; }
    .input {
      width: 100%;
      min-height: 42px;
      padding: 0 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      outline: 0;
      background: var(--field);
      color: var(--ink);
      font-size: 12px;
      transition: border-color 180ms, box-shadow 180ms, background 180ms;
    }
    textarea.input { min-height: 74px; padding: 10px 12px; resize: vertical; line-height: 1.55; }
    .input::placeholder { color: var(--dim); }
    .input:focus { border-color: var(--accent); background: var(--surface); box-shadow: 0 0 0 3px var(--accent-soft); }
    input[type="color"].swatch-input {
      width: 46px;
      height: 42px;
      padding: 5px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--field);
      cursor: pointer;
    }
    .accent-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--field);
    }
    .accent-row .accent-copy { flex: 1; min-width: 0; }
    .accent-row strong { display: block; font-size: 10.5px; font-weight: 600; }
    .accent-row code { color: var(--dim); font: 9px/1.5 "SFMono-Regular", Menlo, monospace; }
    .text-button {
      min-height: 30px;
      padding: 0 9px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--muted);
      font-size: 9.5px;
      cursor: pointer;
    }
    .text-button:hover { background: var(--surface-2); color: var(--ink); }
    .corner-map {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 16px;
      margin-top: 4px;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 15px;
      background:
        linear-gradient(135deg, var(--accent-soft), transparent 55%),
        var(--field);
    }
    .slider-field { display: grid; grid-template-columns: 39px minmax(0, 1fr) 34px; align-items: center; gap: 8px; }
    .slider-field label { color: var(--muted); font-size: 9.5px; }
    .slider-field output { color: var(--text-soft); font: 9px/1 "SFMono-Regular", Menlo, monospace; text-align: right; }
    input[type="range"] { width: 100%; height: 18px; accent-color: var(--accent); cursor: pointer; }
    .reset-row { display: flex; justify-content: flex-end; margin-top: 12px; }
    .outline-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      min-height: 36px;
      padding: 0 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface-2);
      color: var(--muted);
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 160ms var(--ease), background 180ms, color 180ms;
    }
    .outline-button:hover { color: var(--ink); background: var(--surface-3); }
    .outline-button:active { transform: scale(.98); }
    .embed-surface {
      border: 1px solid var(--line);
      border-radius: 24px;
      background: var(--surface);
      box-shadow: var(--shadow-soft);
    }
    .embed-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 20px 0; }
    .embed-head h2 { margin: 0; font-size: 14px; font-weight: 680; }
    .embed-body { padding: 14px 20px 20px; }
    .embed-code {
      max-height: 152px;
      overflow: auto;
      margin: 0 0 11px;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 15px;
      background: var(--field);
      color: var(--muted);
      font: 9.5px/1.7 "SFMono-Regular", Menlo, Consolas, monospace;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .solid-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      min-height: 44px;
      border: 0;
      border-radius: 999px;
      background: var(--accent);
      color: var(--on-accent);
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 160ms var(--ease), background 180ms;
    }
    .solid-button:hover { transform: translateY(-1px); background: var(--accent-strong); }
    .solid-button:active { transform: scale(.98); }
    .solid-button svg { width: 15px; height: 15px; }
    .api-strip {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 14px;
      margin-top: 24px;
      padding: 18px 20px;
      border: 1px solid var(--line);
      border-radius: 20px;
      background: var(--surface);
      color: var(--muted);
    }
    .api-strip .api-icon {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: var(--accent-soft);
      color: var(--accent);
      font: 700 10px/1 "SFMono-Regular", Menlo, monospace;
    }
    .api-strip strong { display: block; color: var(--ink); font-size: 11.5px; }
    .api-strip code {
      display: block;
      overflow: hidden;
      margin-top: 3px;
      color: var(--dim);
      font: 9.5px/1.4 "SFMono-Regular", Menlo, monospace;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .api-strip a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--muted);
      font-size: 10px;
      text-decoration: none;
      white-space: nowrap;
    }
    .api-strip a:hover { color: var(--ink); }
    .api-strip a svg { width: 13px; height: 13px; }
    .page-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      margin-top: 38px;
      padding-top: 18px;
      border-top: 1px solid var(--line);
      color: var(--dim);
      font: 8.5px/1.5 "SFMono-Regular", Menlo, monospace;
      letter-spacing: .07em;
    }
    .shortcuts { display: flex; flex-wrap: wrap; gap: 14px; }
    .shortcuts span { display: inline-flex; gap: 5px; align-items: center; }
    .shortcuts kbd {
      display: inline-grid;
      place-items: center;
      min-width: 19px;
      height: 19px;
      padding: 0 4px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--surface);
      color: var(--muted);
      font: 8px/1 "SFMono-Regular", Menlo, monospace;
    }
    .toast {
      position: fixed;
      top: 18px;
      left: 50%;
      z-index: 100;
      max-width: min(440px, calc(100vw - 32px));
      padding: 11px 18px;
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      background: var(--surface);
      color: var(--ink);
      box-shadow: var(--shadow-soft);
      font-size: 12px;
      opacity: 0;
      pointer-events: none;
      transform: translate(-50%, -10px);
      transition: opacity 200ms var(--ease), transform 200ms var(--ease);
    }
    .toast.visible { opacity: 1; transform: translate(-50%, 0); }
    .spin {
      width: 14px;
      height: 14px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    @keyframes livePulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(.72); opacity: .45; } }
    @keyframes shimmer { to { background-position: -200% 0; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (min-width: 1060px) { .editor-column { position: sticky; top: 96px; } }
    @media (max-width: 1059px) {
      .hero { grid-template-columns: 1fr; }
      .hero-aside { justify-items: start; text-align: left; }
      .workspace { grid-template-columns: 1fr; }
      .preview-viewport { min-height: 0; }
    }
    @media (max-width: 680px) {
      .topbar { min-height: 68px; padding-inline: 16px; }
      .brand-copy span { display: none; }
      .mode-pill { display: none; }
      .repo-button { width: 42px; padding: 0; }
      .repo-button span { display: none; }
      .repo-icon { display: none; }
      .admin-link { display: none; }
      .shell { width: calc(100% - 32px); padding-top: 38px; }
      .hero { gap: 22px; margin-bottom: 30px; }
      h1 { font-size: clamp(40px, 12vw, 56px); }
      .hero-copy { font-size: 14px; }
      .hero-aside { display: none; }
      .search-form { grid-template-columns: 1fr; }
      .primary-button { width: 100%; min-height: 52px; }
      .search-field { height: 54px; }
      .workspace { gap: 16px; }
      .preview-shell { padding: 7px; border-radius: 26px; }
      .preview-toolbar { min-height: 38px; }
      .preview-viewport { border-radius: 20px; }
      .preview-skeleton { padding: 22px; }
      .metrics-surface { grid-template-columns: 1fr 1fr; }
      .metric { border-top: 1px solid var(--line); }
      .metric:nth-child(-n+2) { border-top: 0; }
      .metric:nth-child(odd) { border-left: 0; }
      .metric-value { font-size: 24px; }
      .editor-head, .editor-body, .embed-head, .embed-body { padding-left: 16px; padding-right: 16px; }
      .theme-grid { grid-template-columns: 1fr; }
      .corner-map { grid-template-columns: 1fr; }
      .api-strip { grid-template-columns: auto minmax(0, 1fr); }
      .api-strip a { grid-column: 2; }
      .page-footer { flex-direction: column; align-items: flex-start; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        scroll-behavior: auto !important;
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: .01ms !important;
      }
      .primary-button:hover, .repo-button:hover, .solid-button:hover, .theme-card:hover { transform: none; }
    }
  </style>
</head>
<body>
  <div class="app-mesh" aria-hidden="true"></div>
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark">PC</div>
      <div class="brand-copy">
        <strong>Profile Card Studio</strong>
        <span>One live card for your GitHub profile</span>
      </div>
    </div>
    <span class="mode-pill${isPrivate ? " is-private" : ""}" title="${escapeHtml(modeDescription)}">
      <i aria-hidden="true"></i>${escapeHtml(modeLabel)}
    </span>
    <div class="top-actions">
      <a class="icon-button repo-icon" href="${safeRepoUrl}" target="_blank" rel="noreferrer" aria-label="在 GitHub 查看开源项目">${ICONS.github}</a>
      <a class="repo-button" href="${safeRepoUrl}" target="_blank" rel="noreferrer">${ICONS.github}<span>部署自己的卡片</span></a>
      ${adminLink}
      <button class="icon-button" id="themeButton" type="button" aria-label="切换页面主题">${ICONS.moon}${ICONS.sun}</button>
    </div>
  </header>

  <main class="shell">
    <section class="hero">
      <div>
        <div class="eyebrow">OPEN SOURCE · DYNAMIC PROFILE CARD API</div>
        <h1>把 GitHub 主页，<br>变成一张<em>会呼吸</em>的卡片。</h1>
        <p class="hero-copy">输入用户名或主页链接，实时拉取 Stars、Rank、语言、贡献与热门项目。README 只需要一个 <code>&lt;img&gt;</code>，数据不会过期。</p>
        <form class="search-form" id="profileForm" novalidate>
          <label class="search-field">
            ${ICONS.search}
            <input id="usernameInput" name="username" type="text" value="${safeUsername}" placeholder="GitHub 用户名或 github.com 主页链接" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="formError">
          </label>
          <button class="primary-button" id="generateButton" type="submit">${ICONS.arrow}<span>生成卡片</span></button>
          <p class="form-error" id="formError" role="alert"></p>
        </form>
      </div>
      <aside class="hero-aside">
        <span class="live-line"><i class="live-dot" aria-hidden="true"></i><span id="liveLabel">LIVE DATA</span></span>
        <small>实时 SVG · 5 分钟缓存 · GitHub 失败时自动降级</small>
        <small>${escapeHtml(modeDescription)}</small>
      </aside>
    </section>

    <section class="workspace" aria-label="卡片预览与编辑器">
      <div class="preview-column">
        <article class="preview-shell" aria-labelledby="previewTitle">
          <div class="preview-toolbar">
            <span class="preview-toolbar-left"><span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span id="previewTitle">LIVE PREVIEW</span></span>
            <span class="dim">920 × 1360 · SVG</span>
          </div>
          <div class="preview-viewport" id="previewViewport">
            <div class="preview-skeleton" aria-hidden="true">
              <div class="bar w-42"></div>
              <div class="hero-block"></div>
              <div class="bar w-84"></div>
              <div class="bar w-68"></div>
              <div class="grid"><div class="mini"></div><div class="mini"></div></div>
            </div>
            <img id="cardPreview" alt="${safeUsername} 的动态 GitHub 卡片">
            <div class="preview-error" id="previewError">卡片暂时没有加载成功，请稍后重试。</div>
          </div>
          <div class="preview-footer">
            <span class="sync-state"><i aria-hidden="true"></i><span id="syncLabel">准备同步 GitHub 数据…</span></span>
            <button class="ghost-mini" id="refreshButton" type="button">${ICONS.refresh}<span>刷新</span></button>
          </div>
        </article>

        <div class="metrics-surface" aria-label="实时指标">
          <div class="metric"><span class="metric-label">TOTAL STARS</span><strong class="metric-value is-loading" id="starValue"></strong></div>
          <div class="metric"><span class="metric-label">RANK / SCORE</span><strong class="metric-value is-loading" id="rankValue"></strong></div>
          <div class="metric"><span class="metric-label">LANGUAGES</span><strong class="metric-value is-loading" id="languageValue"></strong></div>
          <div class="metric"><span class="metric-label">LAST SYNC</span><strong class="metric-value is-loading" id="timeValue"></strong></div>
        </div>
      </div>

      <aside class="editor-column">
        <section class="editor-surface" aria-labelledby="editorTitle">
          <div class="editor-head">
            <div class="editor-title-row">
              <div><h2 id="editorTitle">设计你的卡片</h2><p>所有修改立即写入预览与 README 代码。</p></div>
              <span class="micro-badge" id="configBadge">LIVE CONFIG</span>
            </div>
            <div class="tabs" role="tablist" aria-label="卡片编辑分类">
              <button class="tab" type="button" role="tab" aria-selected="true" aria-controls="panelStyle" id="tabStyle" data-tab="style">样式</button>
              <button class="tab" type="button" role="tab" aria-selected="false" aria-controls="panelCopy" id="tabCopy" data-tab="copy">文案</button>
              <button class="tab" type="button" role="tab" aria-selected="false" aria-controls="panelCanvas" id="tabCanvas" data-tab="canvas">背景</button>
            </div>
          </div>
          <div class="editor-body">
            <div class="tab-panel is-active" id="panelStyle" role="tabpanel" aria-labelledby="tabStyle">
              <div class="group-label"><span>主题与头像构图</span><small>5 种视觉</small></div>
              <div class="theme-grid" id="themeGrid">${themeCards(initialTheme)}</div>
              <div class="group-label"><span>强调色</span><small>HEX</small></div>
              <div class="accent-row">
                <input class="swatch-input" id="accentInput" type="color" value="${escapeHtml(initial.accent || CARD_THEMES[initialTheme].colors.accent)}" aria-label="卡片强调色">
                <div class="accent-copy"><strong>Accent</strong><code id="accentValue">${escapeHtml(initial.accent || "THEME DEFAULT")}</code></div>
                <button class="text-button" id="resetAccent" type="button">默认</button>
              </div>
              ${field({ id: "avatarUrl", label: "自定义头像 URL", value: initial.avatarUrl, maxlength: 2048, placeholder: "https://…（留空使用 GitHub 头像）" })}
            </div>

            <div class="tab-panel" id="panelCopy" role="tabpanel" aria-labelledby="tabCopy" hidden>
              ${field({ id: "markInput", label: "左上角标识", value: initial.mark, maxlength: 24, placeholder: "留空自动使用 GitHub 用户名" })}
              ${field({ id: "badgeInput", label: "状态徽标", value: initial.badge, maxlength: 64, placeholder: "CURRENTLY BUILDING · PROJECT" })}
              ${field({ id: "headlineOne", label: "标题第一行", value: initial.headlineOne, maxlength: 42, placeholder: "留空使用默认标题" })}
              ${field({ id: "headlineTwo", label: "标题第二行", value: initial.headlineTwo, maxlength: 48, placeholder: "留空使用默认标题" })}
              ${field({ id: "introInput", label: "简介", value: initial.intro, maxlength: 120, placeholder: "一句简短、清晰的自我介绍", textarea: true })}
              ${field({ id: "footerNote", label: "页脚备注", value: initial.footerNote, maxlength: 64, placeholder: "BUILD WITH CARE." })}
            </div>

            <div class="tab-panel" id="panelCanvas" role="tabpanel" aria-labelledby="tabCanvas" hidden>
              ${field({ id: "backgroundUrl", label: "背景图片 URL", value: initial.backgroundUrl, maxlength: 2048, placeholder: "https://images.unsplash.com/…" })}
              <div class="group-label"><span>四角透明度</span><small>左上 / 右上 / 右下 / 左下</small></div>
              <div class="corner-map">
                <div class="slider-field"><label for="bgTL">左上</label><input id="bgTL" type="range" min="0" max="100" step="1"><output id="bgTLValue"></output></div>
                <div class="slider-field"><label for="bgTR">右上</label><input id="bgTR" type="range" min="0" max="100" step="1"><output id="bgTRValue"></output></div>
                <div class="slider-field"><label for="bgBR">右下</label><input id="bgBR" type="range" min="0" max="100" step="1"><output id="bgBRValue"></output></div>
                <div class="slider-field"><label for="bgBL">左下</label><input id="bgBL" type="range" min="0" max="100" step="1"><output id="bgBLValue"></output></div>
              </div>
              <div class="reset-row"><button class="outline-button" id="resetBackground" type="button">恢复默认透明度</button></div>
            </div>
          </div>
        </section>

        <section class="embed-surface" aria-labelledby="embedTitle">
          <div class="embed-head"><h2 id="embedTitle">README 嵌入</h2><span class="micro-badge">ONE IMAGE</span></div>
          <div class="embed-body">
            <pre class="embed-code" id="embedCode"></pre>
            <button class="solid-button" id="copyButton" type="button">${ICONS.copy}<span>复制 README 代码</span></button>
          </div>
        </section>
      </aside>
    </section>

    <div class="api-strip">
      <span class="api-icon">API</span>
      <div><strong>同一套参数也可直接调用 SVG 接口</strong><code id="endpointValue">${safeOrigin}/api?username=${encodeURIComponent(defaultUsername)}</code></div>
      <a id="openSvg" href="${safeOrigin}/api?username=${encodeURIComponent(defaultUsername)}" target="_blank" rel="noreferrer">打开 SVG ${ICONS.external}</a>
    </div>

    <footer class="page-footer">
      <div class="shortcuts"><span><kbd>/</kbd> 搜索</span><span><kbd>R</kbd> 刷新</span><span><kbd>C</kbd> 复制</span><span><kbd>T</kbd> 主题</span></div>
      <span>OPEN SOURCE · PUBLIC BY DEFAULT · BUILT FOR README</span>
    </footer>
  </main>

  <div class="toast" id="toast" role="status" aria-live="polite"><span id="toastText"></span></div>
  <script>
    const initialUsername = ${json(defaultUsername)};
    const origin = ${json(baseOrigin)};
    const repoUrl = ${json(repoUrl)};
    const initialConfig = ${json(initial)};
    const themes = ${json(Object.fromEntries(Object.entries(CARD_THEMES).map(([key, theme]) => [key, { label: theme.label, colors: theme.colors }])))};
    const defaultCorners = ${json(DEFAULT_CARD_CONFIG.backgroundCorners)};
    const refreshIcon = ${json(ICONS.refresh)};
    const state = {
      username: initialUsername,
      summary: null,
      loading: false,
      requestId: 0,
      controller: null,
      config: initialConfig,
      theme: document.documentElement.dataset.theme || "dark",
      previewTimer: null,
    };
    const elements = {
      form: document.getElementById("profileForm"),
      input: document.getElementById("usernameInput"),
      formError: document.getElementById("formError"),
      generate: document.getElementById("generateButton"),
      preview: document.getElementById("cardPreview"),
      viewport: document.getElementById("previewViewport"),
      previewError: document.getElementById("previewError"),
      sync: document.getElementById("syncLabel"),
      liveLabel: document.getElementById("liveLabel"),
      refresh: document.getElementById("refreshButton"),
      star: document.getElementById("starValue"),
      rank: document.getElementById("rankValue"),
      languages: document.getElementById("languageValue"),
      time: document.getElementById("timeValue"),
      themeGrid: document.getElementById("themeGrid"),
      accent: document.getElementById("accentInput"),
      accentValue: document.getElementById("accentValue"),
      resetAccent: document.getElementById("resetAccent"),
      avatarUrl: document.getElementById("avatarUrl"),
      mark: document.getElementById("markInput"),
      badge: document.getElementById("badgeInput"),
      headlineOne: document.getElementById("headlineOne"),
      headlineTwo: document.getElementById("headlineTwo"),
      intro: document.getElementById("introInput"),
      footerNote: document.getElementById("footerNote"),
      backgroundUrl: document.getElementById("backgroundUrl"),
      resetBackground: document.getElementById("resetBackground"),
      embed: document.getElementById("embedCode"),
      endpoint: document.getElementById("endpointValue"),
      openSvg: document.getElementById("openSvg"),
      copy: document.getElementById("copyButton"),
      themeButton: document.getElementById("themeButton"),
      toast: document.getElementById("toast"),
      toastText: document.getElementById("toastText"),
      configBadge: document.getElementById("configBadge"),
    };
    const corners = ["tl", "tr", "br", "bl"];
    let toastTimer;
    let skeletonTimer;
    let copyResetTimer;

    function formatNumber(value) {
      return new Intl.NumberFormat("zh-CN").format(Number(value) || 0);
    }
    function formatSync(iso) {
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return "刚刚";
      return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
    }
    function showToast(message) {
      clearTimeout(toastTimer);
      elements.toastText.textContent = message;
      elements.toast.classList.add("visible");
      toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 2200);
    }
    function setError(message = "") {
      elements.formError.textContent = message;
      elements.input.setAttribute("aria-invalid", message ? "true" : "false");
    }
    function setMetricSkeleton(enabled) {
      [elements.star, elements.rank, elements.languages, elements.time].forEach((node) => {
        node.classList.toggle("is-loading", enabled);
        if (!enabled) node.style.width = "";
      });
    }
    function beginSkeleton() {
      clearTimeout(skeletonTimer);
      elements.viewport.classList.remove("is-ready", "is-error");
      elements.previewError.classList.remove("visible");
      skeletonTimer = setTimeout(() => {
        if (!elements.preview.complete || !elements.preview.naturalWidth) elements.viewport.classList.add("is-loading");
      }, 150);
    }
    function finishSkeleton() {
      clearTimeout(skeletonTimer);
      elements.viewport.classList.remove("is-loading", "is-error");
      elements.viewport.classList.add("is-ready");
      elements.previewError.classList.remove("visible");
    }
    function showPreviewError(message) {
      clearTimeout(skeletonTimer);
      elements.viewport.classList.remove("is-loading", "is-ready");
      elements.viewport.classList.add("is-error");
      elements.previewError.textContent = message;
      elements.previewError.classList.add("visible");
    }
    function normalizeClientInput(value) {
      let candidate = String(value || "").trim().replace(/^@/, "");
      if (!candidate) return null;
      if (/^(?:https?:\\/\\/)?(?:www\\.)?github\\.com(?:\\/|$)/i.test(candidate)) {
        try {
          const url = new URL(/^https?:\\/\\//i.test(candidate) ? candidate : "https://" + candidate);
          if (!["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) return null;
          const segments = url.pathname.split("/").filter(Boolean);
          if (segments.length !== 1) return null;
          candidate = decodeURIComponent(segments[0]);
        } catch { return null; }
      } else if (/[:/]/.test(candidate)) return null;
      if (!/^[a-z\\d](?:[a-z\\d]|-(?=[a-z\\d])){0,38}$/i.test(candidate)) return null;
      return candidate;
    }
    function cleanConfig() {
      return {
        theme: state.config.theme,
        accent: state.config.accent || "",
        backgroundUrl: (state.config.backgroundUrl || "").trim(),
        avatarUrl: (state.config.avatarUrl || "").trim(),
        mark: (state.config.mark || "").trim(),
        headlineOne: (state.config.headlineOne || "").trim(),
        headlineTwo: (state.config.headlineTwo || "").trim(),
        intro: (state.config.intro || "").trim(),
        badge: (state.config.badge || "").trim(),
        footerNote: (state.config.footerNote || "").trim(),
        backgroundCorners: {
          tl: Number(state.config.backgroundCorners.tl),
          tr: Number(state.config.backgroundCorners.tr),
          br: Number(state.config.backgroundCorners.br),
          bl: Number(state.config.backgroundCorners.bl),
        },
      };
    }
    function configQuery() {
      const config = cleanConfig();
      const query = new URLSearchParams();
      query.set("theme", config.theme);
      if (config.accent) query.set("accent", config.accent);
      if (config.avatarUrl) query.set("photo", config.avatarUrl);
      if (config.backgroundUrl) query.set("bg", config.backgroundUrl);
      if (config.mark) query.set("mark", config.mark);
      if (config.headlineOne) query.set("h1", config.headlineOne);
      if (config.headlineTwo) query.set("h2", config.headlineTwo);
      if (config.intro) query.set("intro", config.intro);
      if (config.badge) query.set("badge", config.badge);
      if (config.footerNote) query.set("note", config.footerNote);
      for (const key of corners) {
        if (Math.abs(config.backgroundCorners[key] - defaultCorners[key]) > .001) query.set("bg" + key.toUpperCase(), config.backgroundCorners[key].toFixed(2));
      }
      return query.toString();
    }
    function cardEndpoint(username, { refresh = false, cacheBust = false } = {}) {
      let url = origin + "/api?" + configQuery() + "&username=" + encodeURIComponent(username);
      if (refresh) url += "&refresh=1";
      if (cacheBust) url += "&v=" + Date.now();
      return url;
    }
    function summaryEndpoint(username, { refresh = false } = {}) {
      let url = origin + "/api/summary?username=" + encodeURIComponent(username);
      if (refresh) url += "&refresh=1&t=" + Date.now();
      return url;
    }
    function readmeSnippet() {
      const studio = origin + "/?username=" + encodeURIComponent(state.username) + "&" + configQuery();
      return '<p align="center">\\n  <a href="' + studio + '">\\n    <img width="100%" src="' + cardEndpoint(state.username) + '" alt="' + state.username + ' — dynamic GitHub profile">\\n  </a>\\n</p>';
    }
    function hexToRgb(hex) {
      const match = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex || "");
      return match ? { r: parseInt(match[1],16), g: parseInt(match[2],16), b: parseInt(match[3],16) } : null;
    }
    function applyAccent(themeKey, customAccent) {
      const theme = themes[themeKey] || themes.midnight;
      const accent = customAccent || theme.colors.accent;
      document.documentElement.style.setProperty("--accent", accent);
      document.documentElement.style.setProperty("--accent-strong", theme.colors.accent2 || accent);
      const rgb = hexToRgb(accent);
      if (rgb) {
        document.documentElement.style.setProperty("--accent-soft", "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.11)");
        document.documentElement.style.setProperty("--accent-line", "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.28)");
      }
    }
    function syncThemeCards() {
      elements.themeGrid.querySelectorAll(".theme-card").forEach((button) => {
        const active = button.dataset.themeKey === state.config.theme;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }
    function setSlider(key, value) {
      const input = document.getElementById("bg" + key.toUpperCase());
      const output = document.getElementById("bg" + key.toUpperCase() + "Value");
      const percent = Math.round(Number(value) * 100);
      input.value = String(percent);
      output.textContent = percent + "%";
    }
    function hydrateControls() {
      elements.accent.value = state.config.accent || themes[state.config.theme].colors.accent;
      elements.accentValue.textContent = state.config.accent || "THEME DEFAULT";
      elements.avatarUrl.value = state.config.avatarUrl || "";
      elements.mark.value = state.config.mark || "";
      elements.badge.value = state.config.badge || "";
      elements.headlineOne.value = state.config.headlineOne || "";
      elements.headlineTwo.value = state.config.headlineTwo || "";
      elements.intro.value = state.config.intro || "";
      elements.footerNote.value = state.config.footerNote || "";
      elements.backgroundUrl.value = state.config.backgroundUrl || "";
      corners.forEach((key) => setSlider(key, state.config.backgroundCorners[key]));
      syncThemeCards();
      applyAccent(state.config.theme, state.config.accent);
    }
    function refreshOutputs() {
      const url = cardEndpoint(state.username, { cacheBust: true });
      elements.openSvg.href = cardEndpoint(state.username);
      elements.endpoint.textContent = origin + "/api?" + configQuery() + "&username=" + encodeURIComponent(state.username);
      elements.embed.textContent = readmeSnippet();
      elements.configBadge.textContent = state.config.theme.toUpperCase() + " / LIVE";
      return url;
    }
    function schedulePreview() {
      clearTimeout(state.previewTimer);
      state.previewTimer = setTimeout(() => {
        const url = refreshOutputs();
        beginSkeleton();
        elements.preview.src = url;
        elements.sync.textContent = "正在渲染新的卡片配置…";
      }, 280);
    }
    function readControls() {
      const next = cleanConfig();
      next.theme = state.config.theme;
      next.accent = elements.accent.value.toUpperCase();
      next.avatarUrl = elements.avatarUrl.value.trim();
      next.mark = elements.mark.value;
      next.badge = elements.badge.value;
      next.headlineOne = elements.headlineOne.value;
      next.headlineTwo = elements.headlineTwo.value;
      next.intro = elements.intro.value;
      next.footerNote = elements.footerNote.value;
      next.backgroundUrl = elements.backgroundUrl.value.trim();
      corners.forEach((key) => {
        next.backgroundCorners[key] = Number(document.getElementById("bg" + key.toUpperCase()).value) / 100;
      });
      state.config = next;
      elements.accentValue.textContent = next.accent || "THEME DEFAULT";
      applyAccent(next.theme, next.accent);
    }
    function cacheKey(username) {
      return "profile-card-summary:v3:" + username.toLowerCase();
    }
    function readCachedSummary(username) {
      try {
        const raw = JSON.parse(localStorage.getItem(cacheKey(username)) || "null");
        if (raw && Date.now() - raw.savedAt < 10 * 60 * 1000) return raw.summary;
      } catch {}
      return null;
    }
    function applySummary(summary, { cached = false } = {}) {
      state.summary = summary;
      const values = [
        [elements.star, formatNumber(summary.stars)],
        [elements.rank, summary.rank + " · " + Number(summary.score).toFixed(1)],
        [elements.languages, formatNumber(summary.languages)],
        [elements.time, formatSync(summary.fetchedAt)],
      ];
      values.forEach(([node, text]) => { node.textContent = text; node.classList.remove("is-loading"); });
      elements.sync.textContent = cached ? "缓存数据 · 正在后台更新" : "刚刚同步 GitHub 数据";
      elements.liveLabel.textContent = cached ? "CACHED DATA" : "LIVE DATA";
    }
    function updateIdentity(username) {
      state.username = username;
      elements.input.value = username;
      elements.preview.alt = username + " 的动态 GitHub 卡片";
      try {
        const url = new URL(location.href);
        url.searchParams.set("username", username);
        history.replaceState(null, "", url.pathname + url.search + url.hash);
      } catch {}
    }
    async function loadSummary({ refresh = false, setCard = false, username = state.username } = {}) {
      const requestId = ++state.requestId;
      if (state.controller) state.controller.abort();
      const controller = new AbortController();
      state.controller = controller;
      state.loading = true;
      elements.generate.disabled = true;
      elements.generate.querySelector("span").textContent = "获取中…";
      elements.refresh.disabled = true;
      elements.refresh.innerHTML = '<span class="spin" aria-hidden="true"></span><span>同步中</span>';
      setMetricSkeleton(!state.summary);
      try {
        const response = await fetch(summaryEndpoint(username, { refresh }), { headers: { Accept: "application/json" }, cache: "no-store", signal: controller.signal });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(payload.message || "同步 GitHub 数据失败。");
          error.status = response.status;
          throw error;
        }
        if (requestId !== state.requestId) return;
        const canonicalUsername = payload.login || username;
        updateIdentity(canonicalUsername);
        applySummary(payload, { cached: Boolean(payload.cached) });
        try { localStorage.setItem(cacheKey(canonicalUsername), JSON.stringify({ summary: payload, savedAt: Date.now() })); } catch {}
        if (setCard || refresh) {
          const url = refreshOutputs();
          beginSkeleton();
          elements.preview.src = url;
        }
      } catch (error) {
        if (controller.signal.aborted || requestId !== state.requestId) return;
        const message = error instanceof Error ? error.message : "同步失败，请稍后重试。";
        elements.sync.textContent = message;
        elements.liveLabel.textContent = "DEGRADED";
        setError(message);
        if (!state.summary) {
          [elements.star, elements.rank, elements.languages, elements.time].forEach((node) => {
            node.textContent = "—";
            node.classList.remove("is-loading");
          });
        }
        if (setCard) showPreviewError(message);
        showToast(message);
      } finally {
        if (requestId === state.requestId) {
          state.loading = false;
          state.controller = null;
          elements.generate.disabled = false;
          elements.generate.querySelector("span").textContent = "生成卡片";
          elements.refresh.disabled = false;
          elements.refresh.innerHTML = refreshIcon + "<span>刷新</span>";
        }
      }
    }
    async function copyText(text, label) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      showToast(label);
    }
    function toggleTheme() {
      state.theme = state.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = state.theme;
      try { localStorage.setItem("profile-card-theme", state.theme); } catch {}
      showToast(state.theme === "dark" ? "页面已切换到深色" : "页面已切换到浅色");
    }
    function markPreviewReady() {
      finishSkeleton();
      elements.sync.textContent = "刚刚同步 GitHub 数据";
    }
    function markPreviewError() {
      showPreviewError("卡片加载失败，请稍后重试。");
      elements.sync.textContent = "卡片加载失败";
    }

    elements.preview.addEventListener("load", markPreviewReady);
    elements.preview.addEventListener("error", markPreviewError);
    elements.form.addEventListener("submit", (event) => {
      event.preventDefault();
      const username = normalizeClientInput(elements.input.value);
      if (!username) {
        setError("请输入有效的 GitHub 用户名或主页链接。");
        elements.input.focus();
        return;
      }
      setError("");
      state.summary = null;
      updateIdentity(username);
      setMetricSkeleton(true);
      beginSkeleton();
      elements.viewport.classList.add("is-loading");
      elements.sync.textContent = "正在获取 GitHub 数据…";
      loadSummary({ username, setCard: true });
    });
    elements.refresh.addEventListener("click", () => loadSummary({ refresh: true }));
    elements.copy.addEventListener("click", async () => {
      await copyText(readmeSnippet(), "README 代码已复制");
      clearTimeout(copyResetTimer);
      elements.copy.querySelector("span").textContent = "已复制";
      copyResetTimer = setTimeout(() => { elements.copy.querySelector("span").textContent = "复制 README 代码"; }, 1400);
    });
    elements.themeButton.addEventListener("click", toggleTheme);
    elements.themeGrid.addEventListener("click", (event) => {
      const button = event.target.closest(".theme-card");
      if (!button) return;
      state.config.theme = button.dataset.themeKey;
      state.config.accent = "";
      hydrateControls();
      refreshOutputs();
      schedulePreview();
    });
    elements.accent.addEventListener("input", () => {
      state.config.accent = elements.accent.value.toUpperCase();
      elements.accentValue.textContent = state.config.accent;
      applyAccent(state.config.theme, state.config.accent);
      refreshOutputs();
      schedulePreview();
    });
    elements.resetAccent.addEventListener("click", () => {
      state.config.accent = "";
      hydrateControls();
      refreshOutputs();
      schedulePreview();
    });
    [elements.avatarUrl, elements.mark, elements.badge, elements.headlineOne, elements.headlineTwo, elements.intro, elements.footerNote, elements.backgroundUrl].forEach((input) => {
      input.addEventListener("input", () => {
        readControls();
        refreshOutputs();
        schedulePreview();
      });
    });
    corners.forEach((key) => {
      const slider = document.getElementById("bg" + key.toUpperCase());
      slider.addEventListener("input", () => {
        document.getElementById("bg" + key.toUpperCase() + "Value").textContent = slider.value + "%";
        state.config.backgroundCorners[key] = Number(slider.value) / 100;
        refreshOutputs();
        schedulePreview();
      });
    });
    elements.resetBackground.addEventListener("click", () => {
      state.config.backgroundCorners = { ...defaultCorners };
      corners.forEach((key) => setSlider(key, defaultCorners[key]));
      refreshOutputs();
      schedulePreview();
      showToast("已恢复默认四角透明度");
    });
    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-tab]").forEach((tab) => {
          const active = tab === button;
          tab.setAttribute("aria-selected", active ? "true" : "false");
          const panel = document.getElementById(tab.dataset.tab === "style" ? "panelStyle" : tab.dataset.tab === "copy" ? "panelCopy" : "panelCanvas");
          panel.hidden = !active;
          panel.classList.toggle("is-active", active);
        });
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
      if (event.key.toLowerCase() === "r") elements.refresh.click();
      if (event.key.toLowerCase() === "c") elements.copy.click();
      if (event.key.toLowerCase() === "t") elements.themeButton.click();
      if (event.key === "/") {
        event.preventDefault();
        elements.input.focus();
        elements.input.select();
      }
    });

    (() => {
      hydrateControls();
      const cached = readCachedSummary(initialUsername);
      if (cached) {
        applySummary(cached, { cached: true });
        beginSkeleton();
        elements.preview.src = refreshOutputs();
        setTimeout(() => loadSummary({ username: initialUsername }), 220);
      } else {
        setMetricSkeleton(true);
        beginSkeleton();
        elements.viewport.classList.add("is-loading");
        elements.preview.src = refreshOutputs();
        loadSummary({ username: initialUsername });
      }
      requestAnimationFrame(() => {
        if (elements.preview.complete) {
          if (elements.preview.naturalWidth > 0) markPreviewReady();
          else markPreviewError();
        }
      });
    })();
  </script>
</body>
</html>`;
}
