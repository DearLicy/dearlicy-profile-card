import { CARD_THEMES, DEFAULT_CARD_CONFIG } from "./config.js";
import {
  COMPONENT_THEME_LINKS,
  FAVICON_LINK,
  ICONS,
  SHOELACE_IMPORTS,
  SHOELACE_IMPORT_MAP,
  escapeHtml,
  json,
  themeBootScript,
} from "./ui.js";

function themeCards(activeTheme) {
  return Object.entries(CARD_THEMES)
    .map(([key, theme]) => {
      const [a, b, c] = theme.swatches;
      return `<sl-button class="theme-card${key === activeTheme ? " is-active" : ""}" data-theme-key="${key}" aria-pressed="${key === activeTheme ? "true" : "false"}">
        <span class="theme-art" style="--swatch-a:${a};--swatch-b:${b};--swatch-c:${c}">
          <i class="theme-art-orb"></i>
          <i class="theme-art-line"></i>
        </span>
        <span class="theme-name"><strong>${escapeHtml(theme.labelZh || theme.label)}</strong><small>${escapeHtml(theme.noteZh || theme.note)}</small></span>
        <span class="theme-check" aria-hidden="true">${ICONS.check}</span>
      </sl-button>`;
    })
    .join("");
}

function field({
  id,
  label,
  value = "",
  maxlength = 64,
  placeholder = "",
  textarea = false,
  type = "text",
  help = "",
}) {
  const common = `id="${id}" label="${escapeHtml(label)}" value="${escapeHtml(value)}" maxlength="${maxlength}" placeholder="${escapeHtml(placeholder)}" ${help ? `help-text="${escapeHtml(help)}"` : ""}`;
  if (textarea) {
    return `<sl-textarea ${common} rows="3" resize="vertical"></sl-textarea>`;
  }
  return `<sl-input ${common} type="${escapeHtml(type)}" autocomplete="off" spellcheck="false"></sl-input>`;
}

export function renderStudioPage({
  origin,
  defaultUsername = "DearLicy",
  mode = "public",
  repoUrl = "https://github.com/DearLicy/dearlicy-profile-card",
  initialCardConfig = DEFAULT_CARD_CONFIG,
}) {
  const baseOrigin = String(origin).replace(/\/+$/, "");
  const safeOrigin = escapeHtml(baseOrigin);
  const safeUsername = escapeHtml(defaultUsername);
  const safeRepoUrl = escapeHtml(repoUrl);
  const isPrivate = mode === "private";
  const modeLabel = isPrivate ? "自用模式" : "公开服务";
  const modeDescription = isPrivate
    ? "仅允许管理员授权的 GitHub 用户使用"
    : "任何公开的 GitHub 主页都可以生成";
  const initial = {
    ...DEFAULT_CARD_CONFIG,
    ...initialCardConfig,
    backgroundCorners: {
      ...DEFAULT_CARD_CONFIG.backgroundCorners,
      ...(initialCardConfig.backgroundCorners || {}),
    },
  };
  const initialTheme = CARD_THEMES[initial.theme] ? initial.theme : "midnight";

  return `<!doctype html>
<html lang="zh-CN" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="color-scheme" content="dark light">
  <meta name="theme-color" content="#0c0d10">
  <meta name="description" content="把任意 GitHub 主页变成一张实时更新、可定制的动态卡片。">
  <title>主页卡片 · 一张实时更新的 GitHub 名片</title>
  ${FAVICON_LINK}
  ${themeBootScript("profile-card-theme")}
  ${COMPONENT_THEME_LINKS}
  ${SHOELACE_IMPORT_MAP}
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
      --success: #7bd7b2;
      --shadow: 0 34px 100px rgba(0,0,0,.5);
      --shadow-soft: 0 18px 50px rgba(0,0,0,.24);
      --ease: cubic-bezier(.22,1,.36,1);
      --font-sans: "Geist", "Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
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
      --success: #14795d;
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
      font-family: var(--font-sans);
      font-size: 16px;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
    }
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
      min-height: 74px;
      padding: 12px max(20px, calc((100vw - 1376px) / 2));
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
      font-size: 16px;
      font-weight: 780;
      letter-spacing: -.08em;
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
    .brand-copy strong { font-size: 14.5px; font-weight: 720; letter-spacing: -.015em; white-space: nowrap; }
    .brand-copy span { color: var(--muted); font-size: 11px; white-space: nowrap; }
    .top-actions { display: flex; align-items: center; gap: 8px; }
    .compact-badge { margin-left: 2px; }
    .shell { width: min(1376px, calc(100% - 48px)); margin: 0 auto; padding: 58px 0 42px; }
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
      gap: 36px;
      margin-bottom: 42px;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 650;
    }
    .eyebrow i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 5px var(--accent-soft);
    }
    h1 {
      max-width: 900px;
      margin: 18px 0 0;
      font-size: clamp(45px, 6.1vw, 82px);
      font-weight: 630;
      letter-spacing: -.067em;
      line-height: .99;
    }
    h1 em { color: var(--accent); font-style: normal; }
    .hero-copy { max-width: 670px; margin: 20px 0 0; color: var(--muted); font-size: 15px; line-height: 1.75; }
    .hero-copy code {
      padding: 2px 6px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--surface);
      color: var(--text-soft);
      font-size: 12px;
    }
    .search-form {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      width: min(750px, 100%);
      margin-top: 27px;
    }
    .search-form sl-input { width: 100%; }
    .form-error { min-height: 18px; margin: 8px 0 0 18px; color: var(--danger); font-size: 12px; }
    .feature-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 22px;
      margin-top: 15px;
      color: var(--dim);
      font-size: 11.5px;
    }
    .feature-row span { display: inline-flex; align-items: center; gap: 7px; }
    .feature-row span::before {
      content: "";
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--accent);
    }
    .hero-aside {
      width: 285px;
      padding: 22px;
      border: 1px solid var(--line);
      border-radius: 26px;
      background: color-mix(in srgb, var(--surface) 88%, transparent);
      box-shadow: var(--shadow-soft);
    }
    .hero-aside .aside-kicker { color: var(--accent); font-size: 11px; font-weight: 720; }
    .hero-aside h2 { margin: 9px 0 7px; font-size: 17px; letter-spacing: -.02em; }
    .hero-aside p { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.65; }
    .hero-aside .aside-line { height: 1px; margin: 16px 0; background: var(--line); }
    .hero-aside .status-line { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--dim); font-size: 11px; }
    .hero-aside .status-line strong { color: var(--text-soft); font-weight: 600; }
    .workspace {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(380px, .52fr);
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
    .preview-toolbar { font-size: 11px; font-weight: 600; }
    .preview-toolbar-left { display: inline-flex; align-items: center; gap: 10px; }
    .window-dots { display: inline-flex; gap: 5px; }
    .window-dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--line-strong); }
    .window-dots i:first-child { background: var(--accent); }
    .preview-toolbar .dim { color: var(--dim); font-size: 10px; }
    .preview-viewport {
      position: relative;
      min-height: 430px;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 23px;
      background: #090a0d;
    }
    .preview-viewport img { display: block; width: 100%; height: auto; opacity: 1; }
    .preview-skeleton {
      position: absolute;
      inset: 0;
      z-index: 1;
      display: none;
      flex-direction: column;
      gap: 16px;
      padding: 34px;
      background: #0a0b0e;
    }
    .preview-viewport.is-loading .preview-skeleton { display: flex; }
    .preview-viewport.is-ready .preview-skeleton { display: none; }
    .preview-skeleton sl-skeleton { --border-radius: 999px; }
    .preview-skeleton .hero-skeleton { height: 145px; margin-top: 18px; --border-radius: 18px; }
    .preview-skeleton .grid { display: grid; grid-template-columns: 1.2fr .8fr; gap: 14px; margin-top: auto; }
    .preview-skeleton .mini { height: 112px; --border-radius: 18px; }
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
    .metrics-surface {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 22px;
      background: var(--surface);
      box-shadow: var(--shadow-soft);
    }
    .metric { position: relative; min-width: 0; padding: 19px 20px; border-left: 1px solid var(--line); }
    .metric:first-child { border-left: 0; }
    .metric-label { display: block; margin-bottom: 8px; color: var(--muted); font-size: 10.5px; font-weight: 600; }
    .metric-value {
      display: block;
      min-height: 34px;
      overflow: hidden;
      color: var(--ink);
      font-size: 27px;
      font-weight: 690;
      letter-spacing: -.045em;
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .metric-value.is-loading { color: transparent; }
    .metric-skeleton {
      position: absolute;
      left: 20px;
      right: 20px;
      bottom: 21px;
      display: none;
    }
    .metric-value.is-loading + .metric-skeleton { display: block; }
    .editor-surface {
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 24px;
      background: var(--surface);
      box-shadow: var(--shadow-soft);
    }
    .editor-head { padding: 20px 20px 0; }
    .editor-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
    .editor-title-row h2 { margin: 0; font-size: 17px; font-weight: 690; letter-spacing: -.02em; }
    .editor-title-row p { margin: 4px 0 0; color: var(--muted); font-size: 12px; }
    .editor-tabs { margin-top: 16px; }
    .editor-tabs::part(nav) { border-bottom: 1px solid var(--line); }
    .editor-tabs::part(body) { padding: 18px 0; }
    .editor-body { padding: 0 20px 20px; }
    .group-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 0 0 10px;
      color: var(--muted);
      font-size: 11.5px;
      font-weight: 650;
    }
    .group-label:not(:first-child) { margin-top: 20px; }
    .group-label small { color: var(--dim); font-size: 10px; font-weight: 500; }
    .theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .theme-grid sl-button.theme-card { width: 100%; }
    .theme-grid sl-button.theme-card::part(base) {
      justify-content: flex-start;
      width: 100%;
      min-height: 65px;
      padding: 8px 9px;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: var(--field);
      color: var(--ink);
      box-shadow: none;
    }
    .theme-card::part(label) { display: grid; grid-template-columns: 46px minmax(0, 1fr) 16px; align-items: center; gap: 10px; width: 100%; }
    .theme-card.is-active::part(base) { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
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
    .theme-art-orb { position: absolute; right: 5px; top: 6px; width: 17px; height: 17px; border: 1px solid var(--swatch-c); border-radius: 50%; opacity: .8; }
    .theme-art-line { position: absolute; left: 7px; bottom: 9px; width: 27px; height: 2px; border-radius: 2px; background: var(--swatch-b); }
    .theme-art-line::after { content: ""; display: block; width: 17px; height: 2px; margin-top: 4px; border-radius: 2px; background: var(--swatch-c); opacity: .52; }
    .theme-name { display: grid; min-width: 0; gap: 2px; text-align: left; }
    .theme-name strong { font-size: 12px; font-weight: 650; }
    .theme-name small { overflow: hidden; color: var(--dim); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
    .theme-check { display: grid; place-items: center; opacity: 0; color: var(--accent); transition: opacity 160ms; }
    .theme-check svg { width: 15px; height: 15px; }
    .theme-card.is-active .theme-check { opacity: 1; }
    .field-stack { display: grid; gap: 15px; }
    .accent-row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      padding: 9px;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: var(--field);
    }
    .accent-copy { min-width: 0; }
    .accent-copy strong { display: block; font-size: 12px; font-weight: 650; }
    .accent-copy small { display: block; overflow: hidden; color: var(--dim); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
    .corner-map {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 17px;
      background: linear-gradient(135deg, var(--accent-soft), transparent 55%), var(--field);
    }
    .range-row { display: grid; grid-template-columns: minmax(0,1fr) 38px; align-items: center; gap: 8px; }
    .range-row span { color: var(--text-soft); font-size: 10px; font-variant-numeric: tabular-nums; text-align: right; }
    .reset-row { display: flex; justify-content: flex-end; margin-top: 12px; }
    .embed-surface { border: 1px solid var(--line); border-radius: 24px; background: var(--surface); box-shadow: var(--shadow-soft); }
    .embed-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 20px 0; }
    .embed-head h2 { margin: 0; font-size: 15px; font-weight: 690; }
    .embed-body { padding: 14px 20px 20px; }
    .embed-code {
      max-height: 158px;
      overflow: auto;
      margin: 0 0 11px;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 15px;
      background: var(--field);
      color: var(--muted);
      font: 10px/1.7 "SFMono-Regular", Menlo, Consolas, monospace;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
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
      width: 38px;
      height: 38px;
      border-radius: 13px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 11px;
      font-weight: 760;
    }
    .api-strip strong { display: block; color: var(--ink); font-size: 12px; }
    .api-strip code { display: block; overflow: hidden; margin-top: 3px; color: var(--dim); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
    .page-footer {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      margin-top: 34px;
      padding-top: 18px;
      border-top: 1px solid var(--line);
      color: var(--dim);
      font-size: 11px;
    }
    .page-footer span:last-child { text-align: right; }
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
    sl-button::part(base) {
      min-height: 42px;
      border-color: var(--line);
      border-radius: 999px;
      font-family: var(--font-sans);
      font-weight: 650;
      transition: transform 160ms var(--ease), background 180ms, border-color 180ms;
    }
    sl-button[variant="primary"]::part(base) { border-color: transparent; background: var(--accent); color: var(--on-accent); }
    sl-button[variant="primary"]:hover::part(base) { background: var(--accent-strong); }
    sl-button[variant="default"]::part(base) { background: var(--surface); color: var(--ink); }
    sl-button:active::part(base) { transform: scale(.98); }
    sl-button > [slot="prefix"], sl-button > [slot="suffix"] { display: inline-flex; align-items: center; }
    sl-button > [slot="prefix"] svg, sl-button > [slot="suffix"] svg { display: block; width: 17px; height: 17px; }
    sl-input::part(base), sl-textarea::part(base), sl-select::part(combobox) {
      border-color: var(--line);
      border-radius: 14px;
      background: var(--field);
      color: var(--ink);
      font-family: var(--font-sans);
    }
    sl-input::part(input), sl-textarea::part(textarea) { color: var(--ink); font-family: var(--font-sans); font-size: 13px; }
    sl-input::part(input)::placeholder, sl-textarea::part(textarea)::placeholder { color: var(--dim); }
    sl-input::part(label), sl-textarea::part(label) { color: var(--muted); font-size: 11.5px; font-weight: 600; }
    sl-input::part(help-text), sl-textarea::part(help-text) { color: var(--dim); font-size: 10.5px; }
    sl-input[size="large"]::part(base) { min-height: 58px; border-radius: 999px; }
    sl-tab-group::part(nav) { gap: 3px; padding: 4px; border: 1px solid var(--line); border-radius: 15px; background: var(--field); }
    sl-tab-group::part(body) { padding-top: 18px; }
    sl-tab::part(base) { min-height: 36px; border-radius: 11px; color: var(--muted); font-size: 12px; font-weight: 650; }
    sl-tab[active]::part(base) { background: var(--surface); color: var(--ink); }
    sl-tab-group::part(active-tab-indicator) { display: none; }
    sl-color-picker::part(base) { border: 1px solid var(--line); border-radius: 13px; background: var(--field); }
    sl-range { --track-color: var(--line-strong); --track-color-active: var(--accent); --thumb-color: var(--accent); }
    sl-range::part(label) { color: var(--muted); font-size: 10.5px; font-weight: 600; }
    sl-badge::part(base) { border: 1px solid var(--line); background: var(--surface); color: var(--muted); font-size: 10px; font-weight: 600; }
    .theme-icon { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; }
    #themeButton { width: 42px; height: 42px; }
    #themeButton::part(base) { width: 42px; min-width: 42px; padding: 0; }
    .theme-icon svg { width: 18px; height: 18px; }
    .theme-icon .sun { display: none; }
    html[data-theme="light"] .theme-icon .moon { display: none; }
    html[data-theme="light"] .theme-icon .sun { display: block; }
    sl-input > [slot="prefix"], sl-input > [slot="suffix"] { display: inline-flex; align-items: center; }
    sl-input > [slot="prefix"] svg, sl-input > [slot="suffix"] svg { display: block; width: 17px; height: 17px; }
    @keyframes livePulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(.72); opacity: .45; } }
    @media (min-width: 1060px) { .editor-column { position: sticky; top: 94px; } }
    @media (max-width: 1059px) {
      .hero { grid-template-columns: 1fr; }
      .hero-aside { width: min(100%, 560px); }
      .workspace { grid-template-columns: 1fr; }
      .preview-viewport { min-height: 0; }
    }
    @media (max-width: 680px) {
      .topbar { min-height: 66px; padding-inline: 16px; }
      .brand-copy span, .compact-badge, .github-label { display: none; }
      .github-link::part(base) { width: 42px; min-width: 42px; padding: 0; }
      .shell { width: calc(100% - 32px); padding-top: 36px; }
      h1 { font-size: clamp(32px, 9.8vw, 42px); }
      .hero-copy { font-size: 14px; }
      .hero-aside { display: none; }
      .search-form { grid-template-columns: 1fr; }
      .search-form sl-button::part(base) { width: 100%; min-height: 52px; }
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
      .api-strip sl-button { grid-column: 2; justify-self: start; }
      .page-footer { flex-direction: column; align-items: flex-start; }
      .page-footer span:last-child { text-align: left; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; transition-duration: .01ms !important; }
      sl-button:active::part(base) { transform: none; }
    }
  </style>
</head>
<body>
  <div class="app-mesh" aria-hidden="true"></div>
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark">卡</div>
      <div class="brand-copy">
        <strong>主页卡片</strong>
        <span>实时生成 · 开源可自托管</span>
      </div>
      <sl-badge class="compact-badge" pill>${modeLabel}</sl-badge>
    </div>
    <div class="top-actions">
      <sl-button class="github-link" href="${safeRepoUrl}" target="_blank" rel="noreferrer">
        <span slot="prefix">${ICONS.github}</span>
        <span class="github-label">GitHub 仓库</span>
      </sl-button>
      <sl-button id="themeButton" circle aria-label="切换页面主题">
        <span class="theme-icon">${ICONS.moon}${ICONS.sun}</span>
      </sl-button>
    </div>
  </header>

  <main class="shell">
    <section class="hero">
      <div>
        <span class="eyebrow"><i></i>开源 GitHub 主页卡片</span>
        <h1>把 GitHub 主页，<br>变成一张<em>实时卡片</em>。</h1>
        <p class="hero-copy">输入用户名或主页链接，Stars、等级、语言、贡献和热门仓库会自动更新。README 只需要一个 <code>&lt;img&gt;</code>，不用每天运行 Actions。</p>
        <div class="search-form">
          <sl-input id="usernameInput" size="large" pill clearable label="GitHub 用户名或主页链接" value="${safeUsername}" placeholder="例如 DearLicy 或 github.com/DearLicy">
            <span slot="prefix">${ICONS.search}</span>
          </sl-input>
          <sl-button id="generateButton" variant="primary" size="large">
            <span slot="prefix">${ICONS.arrow}</span>
            <span>生成卡片</span>
          </sl-button>
        </div>
        <p class="form-error" id="formError" role="alert"></p>
        <div class="feature-row"><span>实时数据</span><span>5 分钟缓存</span><span>无需 GitHub Actions</span><span>失败自动降级</span></div>
      </div>
      <aside class="hero-aside">
        <div class="aside-kicker">${modeLabel}</div>
        <h2>一条链接，一张随时更新的名片。</h2>
        <p>用户数据只在内存中短暂缓存，私有仓库不会进入统计，图片也不会保存到服务器。</p>
        <div class="aside-line"></div>
        <div class="status-line"><span>数据状态</span><strong id="asideStatus">等待同步</strong></div>
        <div class="status-line"><span>访问范围</span><strong>${escapeHtml(modeDescription)}</strong></div>
      </aside>
    </section>

    <section class="workspace" aria-label="卡片预览与编辑器">
      <div class="preview-column">
        <article class="preview-shell" aria-labelledby="previewTitle">
          <div class="preview-toolbar">
            <span class="preview-toolbar-left"><span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span id="previewTitle">实时预览</span></span>
            <span class="dim">920 × 1360 · SVG</span>
          </div>
          <div class="preview-viewport" id="previewViewport">
            <div class="preview-skeleton" aria-hidden="true">
              <sl-skeleton effect="sheen" style="width:42%"></sl-skeleton>
              <sl-skeleton class="hero-skeleton"></sl-skeleton>
              <sl-skeleton effect="sheen" style="width:84%"></sl-skeleton>
              <sl-skeleton effect="sheen" style="width:68%"></sl-skeleton>
              <div class="grid"><sl-skeleton class="mini"></sl-skeleton><sl-skeleton class="mini"></sl-skeleton></div>
            </div>
            <img id="cardPreview" alt="${safeUsername} 的 GitHub 主页卡片">
            <div class="preview-error" id="previewError">卡片暂时没有加载成功，请稍后重试。</div>
          </div>
          <div class="preview-footer">
            <span class="sync-state"><i aria-hidden="true"></i><span id="syncLabel">准备同步 GitHub 数据…</span></span>
            <sl-button id="refreshButton" size="small">
              <span slot="prefix">${ICONS.refresh}</span>
              <span>刷新</span>
            </sl-button>
          </div>
        </article>

        <div class="metrics-surface" aria-label="实时指标">
          <div class="metric"><span class="metric-label">获星总数</span><strong class="metric-value is-loading" id="starValue"></strong><span class="metric-skeleton"><sl-skeleton></sl-skeleton></span></div>
          <div class="metric"><span class="metric-label">等级 / 评分</span><strong class="metric-value is-loading" id="rankValue"></strong><span class="metric-skeleton"><sl-skeleton></sl-skeleton></span></div>
          <div class="metric"><span class="metric-label">语言数量</span><strong class="metric-value is-loading" id="languageValue"></strong><span class="metric-skeleton"><sl-skeleton></sl-skeleton></span></div>
          <div class="metric"><span class="metric-label">同步时间</span><strong class="metric-value is-loading" id="timeValue"></strong><span class="metric-skeleton"><sl-skeleton></sl-skeleton></span></div>
        </div>
      </div>

      <aside class="editor-column">
        <section class="editor-surface" aria-labelledby="editorTitle">
          <div class="editor-head">
            <div class="editor-title-row">
              <div><h2 id="editorTitle">设计你的卡片</h2><p>修改会立即写入预览与 README 代码。</p></div>
              <sl-badge pill id="configBadge">午夜主题</sl-badge>
            </div>
            <sl-tab-group class="editor-tabs" id="editorTabs">
              <sl-tab slot="nav" panel="style" active>外观</sl-tab>
              <sl-tab slot="nav" panel="copy">文案</sl-tab>
              <sl-tab slot="nav" panel="canvas">背景</sl-tab>
              <sl-tab-panel name="style">
                <div class="editor-body">
                  <div class="group-label"><span>主题与头像构图</span><small>5 种预设</small></div>
                  <div class="theme-grid" id="themeGrid">${themeCards(initialTheme)}</div>
                  <div class="group-label"><span>强调色</span><small>跟随主题或自定义</small></div>
                  <div class="accent-row">
                    <sl-color-picker id="accentInput" label="卡片强调色" format="hex" value="${escapeHtml(initial.accent || CARD_THEMES[initialTheme].colors.accent)}" size="small"></sl-color-picker>
                    <div class="accent-copy"><strong>卡片强调色</strong><small id="accentValue">${escapeHtml(initial.accent || "跟随主题")}</small></div>
                    <sl-button id="resetAccent" size="small">恢复默认</sl-button>
                  </div>
                  <div class="field-stack" style="margin-top:15px">
                    ${field({ id: "avatarUrl", label: "自定义头像 URL", value: initial.avatarUrl, maxlength: 2048, placeholder: "https://…（留空使用 GitHub 头像）" })}
                  </div>
                </div>
              </sl-tab-panel>
              <sl-tab-panel name="copy">
                <div class="editor-body">
                  <div class="field-stack">
                    ${field({ id: "markInput", label: "左上角标识", value: initial.mark, maxlength: 24, placeholder: "留空自动使用 GitHub 用户名" })}
                    ${field({ id: "badgeInput", label: "状态徽标", value: initial.badge, maxlength: 64, placeholder: "例如：正在开发 · ZIBLL_CHILD" })}
                    ${field({ id: "headlineOne", label: "标题第一行", value: initial.headlineOne, maxlength: 42, placeholder: "留空使用默认标题" })}
                    ${field({ id: "headlineTwo", label: "标题第二行", value: initial.headlineTwo, maxlength: 48, placeholder: "留空使用默认标题" })}
                    ${field({ id: "introInput", label: "简介", value: initial.intro, maxlength: 120, placeholder: "一句简短、清晰的自我介绍", textarea: true })}
                    ${field({ id: "footerNote", label: "页脚备注", value: initial.footerNote, maxlength: 64, placeholder: "例如：保持好奇，持续交付。" })}
                  </div>
                </div>
              </sl-tab-panel>
              <sl-tab-panel name="canvas">
                <div class="editor-body">
                  ${field({ id: "backgroundUrl", label: "背景图片 URL", value: initial.backgroundUrl, maxlength: 2048, placeholder: "https://images.unsplash.com/…" })}
                  <div class="group-label"><span>四角透明度</span><small>每张图片都可以单独调整</small></div>
                  <div class="corner-map">
                    <div class="range-row"><sl-range id="bgTL" label="左上" min="0" max="100" step="1"></sl-range><span id="bgTLValue"></span></div>
                    <div class="range-row"><sl-range id="bgTR" label="右上" min="0" max="100" step="1"></sl-range><span id="bgTRValue"></span></div>
                    <div class="range-row"><sl-range id="bgBR" label="右下" min="0" max="100" step="1"></sl-range><span id="bgBRValue"></span></div>
                    <div class="range-row"><sl-range id="bgBL" label="左下" min="0" max="100" step="1"></sl-range><span id="bgBLValue"></span></div>
                  </div>
                  <div class="reset-row"><sl-button id="resetBackground" size="small">恢复默认透明度</sl-button></div>
                </div>
              </sl-tab-panel>
            </sl-tab-group>
          </div>
        </section>

        <section class="embed-surface" aria-labelledby="embedTitle">
          <div class="embed-head"><h2 id="embedTitle">嵌入 README</h2><sl-badge pill>一张图片</sl-badge></div>
          <div class="embed-body">
            <pre class="embed-code" id="embedCode"></pre>
            <sl-button id="copyButton" variant="primary" style="width:100%">
              <span slot="prefix">${ICONS.copy}</span>
              <span>复制嵌入代码</span>
            </sl-button>
          </div>
        </section>
      </aside>
    </section>

    <div class="api-strip">
      <span class="api-icon">SVG</span>
      <div><strong>同一套参数也可以直接调用卡片接口</strong><code id="endpointValue">${safeOrigin}/api?username=${encodeURIComponent(defaultUsername)}</code></div>
      <sl-button id="openSvg" href="${safeOrigin}/api?username=${encodeURIComponent(defaultUsername)}" target="_blank" rel="noreferrer" size="small">
        <span>打开卡片</span>
        <span slot="suffix">${ICONS.external}</span>
      </sl-button>
    </div>

    <footer class="page-footer">
      <span>数据来自 GitHub 公开接口 · 5 分钟缓存 · 24 小时降级快照</span>
      <span>开源项目 · 可自由部署 · MIT License</span>
    </footer>
  </main>

  <div class="toast" id="toast" role="status" aria-live="polite"><span id="toastText"></span></div>
  <script type="module">
    ${SHOELACE_IMPORTS}

    function syncComponentTheme() {
      const light = document.documentElement.dataset.theme === "light";
      const darkLink = document.getElementById("slThemeDark");
      const lightLink = document.getElementById("slThemeLight");
      if (darkLink) darkLink.disabled = light;
      if (lightLink) lightLink.disabled = !light;
    }
    syncComponentTheme();

    const initialUsername = ${json(defaultUsername)};
    const origin = ${json(baseOrigin)};
    const repoUrl = ${json(repoUrl)};
    const initialConfig = ${json(initial)};
    const themes = ${json(Object.fromEntries(Object.entries(CARD_THEMES).map(([key, theme]) => [key, {
      label: theme.labelZh || theme.label,
      colors: theme.colors,
    }])))};
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
      input: document.getElementById("usernameInput"),
      formError: document.getElementById("formError"),
      generate: document.getElementById("generateButton"),
      preview: document.getElementById("cardPreview"),
      viewport: document.getElementById("previewViewport"),
      previewError: document.getElementById("previewError"),
      sync: document.getElementById("syncLabel"),
      asideStatus: document.getElementById("asideStatus"),
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
      return '<p align="center">\\n  <a href="' + studio + '">\\n    <img width="100%" src="' + cardEndpoint(state.username) + '" alt="' + state.username + ' 的 GitHub 主页卡片">\\n  </a>\\n</p>';
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
      input.value = percent;
      output.textContent = percent + "%";
    }
    function hydrateControls() {
      const theme = themes[state.config.theme] || themes.midnight;
      elements.accent.value = state.config.accent || theme.colors.accent;
      elements.accentValue.textContent = state.config.accent || "跟随主题";
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
      elements.openSvg.setAttribute("href", cardEndpoint(state.username));
      elements.endpoint.textContent = origin + "/api?" + configQuery() + "&username=" + encodeURIComponent(state.username);
      elements.embed.textContent = readmeSnippet();
      elements.configBadge.textContent = themes[state.config.theme]?.label || "自定义主题";
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
      next.accent = String(elements.accent.value || "").toUpperCase();
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
      elements.accentValue.textContent = next.accent || "跟随主题";
      applyAccent(next.theme, next.accent);
    }
    function cacheKey(username) {
      return "profile-card-summary:v4:" + username.toLowerCase();
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
      elements.asideStatus.textContent = cached ? "缓存已显示" : "数据已更新";
    }
    function updateIdentity(username) {
      state.username = username;
      elements.input.value = username;
      elements.preview.alt = username + " 的 GitHub 主页卡片";
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
      elements.generate.loading = true;
      elements.refresh.disabled = true;
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
        elements.asideStatus.textContent = "数据暂时不可用";
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
          elements.generate.loading = false;
          elements.refresh.disabled = false;
        }
      }
    }
    async function copyText(text, label) {
      if (!navigator.clipboard?.writeText) {
        showToast("当前浏览器不支持自动复制，请手动选择代码。");
        return false;
      }
      try {
        await navigator.clipboard.writeText(text);
        showToast(label);
        return true;
      } catch {
        showToast("复制失败，请检查浏览器剪贴板权限。");
        return false;
      }
    }
    function toggleTheme() {
      state.theme = state.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = state.theme;
      syncComponentTheme();
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
    function submitSearch() {
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
    }
    function isEditing() {
      const tag = document.activeElement?.tagName || "";
      return ["SL-INPUT", "SL-TEXTAREA", "SL-SELECT", "SL-COLOR-PICKER"].includes(tag);
    }

    elements.preview.addEventListener("load", markPreviewReady);
    elements.preview.addEventListener("error", markPreviewError);
    elements.generate.addEventListener("click", submitSearch);
    elements.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") submitSearch();
    });
    elements.refresh.addEventListener("click", () => loadSummary({ refresh: true }));
    elements.copy.addEventListener("click", async () => {
      const copied = await copyText(readmeSnippet(), "README 代码已复制");
      if (!copied) return;
      clearTimeout(copyResetTimer);
      elements.copy.textContent = "已复制";
      copyResetTimer = setTimeout(() => {
        elements.copy.innerHTML = '<span slot="prefix">' + ${json(ICONS.copy)} + '</span><span>复制嵌入代码</span>';
      }, 1400);
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
    elements.accent.addEventListener("sl-change", () => {
      state.config.accent = String(elements.accent.value || "").toUpperCase();
      elements.accentValue.textContent = state.config.accent || "跟随主题";
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
      input.addEventListener("sl-input", () => {
        readControls();
        refreshOutputs();
        schedulePreview();
      });
    });
    corners.forEach((key) => {
      const slider = document.getElementById("bg" + key.toUpperCase());
      slider.addEventListener("sl-input", () => {
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
    document.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isEditing()) return;
      if (event.key.toLowerCase() === "r") elements.refresh.click();
      if (event.key.toLowerCase() === "c") elements.copy.click();
      if (event.key.toLowerCase() === "t") elements.themeButton.click();
      if (event.key === "/") {
        event.preventDefault();
        elements.input.focus();
      }
    });

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
  </script>
</body>
</html>`;
}
