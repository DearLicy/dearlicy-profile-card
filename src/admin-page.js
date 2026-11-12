import { CARD_THEMES } from "./config.js";
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

const BASE_STYLE = `
  :root {
    --canvas: #0d0e12;
    --canvas-2: #111319;
    --surface: #17191f;
    --surface-2: #1d2027;
    --field: #111319;
    --ink: #f6f2eb;
    --muted: #a7a2ac;
    --dim: #716d77;
    --line: rgba(255,255,255,.09);
    --line-strong: rgba(255,255,255,.17);
    --accent: #cbb9ff;
    --accent-strong: #b69cff;
    --accent-soft: rgba(203,185,255,.1);
    --accent-line: rgba(203,185,255,.28);
    --on-accent: #17141c;
    --danger: #f08b8b;
    --success: #79d7b0;
    --warning: #e8bd75;
    --shadow: 0 30px 90px rgba(0,0,0,.48);
    --shadow-soft: 0 16px 44px rgba(0,0,0,.2);
    --ease: cubic-bezier(.22,1,.36,1);
    --font-sans: "Geist", "Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  }
  html[data-theme="light"] {
    --canvas: #f3efe7;
    --canvas-2: #ebe6dc;
    --surface: #fcfaf5;
    --surface-2: #f5f0e7;
    --field: #f7f2e9;
    --ink: #191720;
    --muted: #716c76;
    --dim: #98919b;
    --line: rgba(25,23,32,.09);
    --line-strong: rgba(25,23,32,.17);
    --accent: #6451d7;
    --accent-strong: #5240c4;
    --accent-soft: rgba(100,81,215,.09);
    --accent-line: rgba(100,81,215,.25);
    --on-accent: #fff;
    --danger: #ad3948;
    --success: #17735a;
    --warning: #9a6417;
    --shadow: 0 30px 90px rgba(52,42,75,.14);
    --shadow-soft: 0 16px 44px rgba(52,42,75,.08);
  }
  * { box-sizing: border-box; }
  html { min-height: 100%; background: var(--canvas); color-scheme: dark; }
  html[data-theme="light"] { color-scheme: light; }
  body {
    min-height: 100vh;
    margin: 0;
    background:
      radial-gradient(circle at 10% 0%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 34%),
      radial-gradient(circle at 90% 6%, rgba(255,255,255,.035), transparent 25%),
      var(--canvas);
    color: var(--ink);
    font: 15px/1.55 var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, p { margin-top: 0; }
  a { color: inherit; }
  .mono { font-family: "SFMono-Regular", Menlo, Consolas, monospace; }
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
  sl-button[variant="danger"]::part(base) { border-color: color-mix(in srgb, var(--danger) 35%, transparent); background: transparent; color: var(--danger); }
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
  sl-input::part(input), sl-textarea::part(textarea), sl-select::part(display-input) { color: var(--ink); font-family: var(--font-sans); font-size: 13px; }
  sl-input::part(label), sl-textarea::part(label), sl-select::part(label) { color: var(--muted); font-size: 11.5px; font-weight: 600; }
  sl-input::part(help-text), sl-textarea::part(help-text), sl-select::part(help-text) { color: var(--dim); font-size: 10.5px; }
  sl-radio-group::part(form-control-label) { color: var(--muted); font-size: 11.5px; font-weight: 600; }
  sl-radio-button::part(button) { min-height: 40px; border-color: var(--line); background: var(--field); color: var(--muted); font-size: 12px; font-weight: 650; }
  sl-radio-button::part(button--checked) { border-color: var(--accent); background: var(--accent-soft); color: var(--ink); }
  sl-switch::part(control--checked) { background: var(--accent); border-color: var(--accent); }
  sl-switch::part(label) { color: var(--muted); font-size: 12px; }
  sl-range { --track-color: var(--line-strong); --track-color-active: var(--accent); --thumb-color: var(--accent); }
  sl-range::part(label) { color: var(--muted); font-size: 10.5px; font-weight: 600; }
  sl-color-picker::part(base) { border: 1px solid var(--line); border-radius: 13px; background: var(--field); }
  sl-badge::part(base) { border: 1px solid var(--line); background: var(--surface); color: var(--muted); font-size: 10px; font-weight: 650; }
  sl-badge[variant="success"]::part(base) { border-color: color-mix(in srgb, var(--success) 26%, transparent); background: color-mix(in srgb, var(--success) 10%, transparent); color: var(--success); }
  sl-badge[variant="warning"]::part(base) { border-color: color-mix(in srgb, var(--warning) 26%, transparent); background: color-mix(in srgb, var(--warning) 10%, transparent); color: var(--warning); }
  sl-alert::part(base) { border-radius: 16px; }
  .theme-icon { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; }
  #themeButton { width: 42px; height: 42px; }
  #themeButton::part(base) { width: 42px; min-width: 42px; padding: 0; }
  .theme-icon svg { width: 18px; height: 18px; }
  .theme-icon .sun { display: none; }
  html[data-theme="light"] .theme-icon .moon { display: none; }
  html[data-theme="light"] .theme-icon .sun { display: block; }
  .toast {
    position: fixed;
    left: 50%;
    top: 18px;
    z-index: 100;
    max-width: min(460px, calc(100vw - 32px));
    padding: 11px 17px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--surface);
    color: var(--ink);
    box-shadow: var(--shadow);
    font-size: 12px;
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, -10px);
    transition: opacity 200ms var(--ease), transform 200ms var(--ease);
  }
  .toast.visible { opacity: 1; transform: translate(-50%, 0); }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
    sl-button:active::part(base) { transform: none; }
  }
`;

const LOGIN_STYLE = `
  ${BASE_STYLE}
  .login-page {
    display: grid;
    grid-template-rows: auto 1fr;
    min-height: 100vh;
    padding: 18px 20px 42px;
    background:
      radial-gradient(circle at 50% 20%, var(--accent-soft), transparent 32%),
      var(--canvas);
  }
  .login-topbar { display: flex; align-items: center; justify-content: space-between; width: min(1100px, 100%); margin: 0 auto; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-mark {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 15px;
    background: var(--accent);
    color: var(--on-accent);
    font-size: 16px;
    font-weight: 780;
  }
  .brand strong { display: block; font-size: 14px; }
  .brand small { display: block; color: var(--muted); font-size: 11px; }
  .login-shell { display: grid; place-items: center; width: min(480px, 100%); margin: 0 auto; padding: 52px 0; }
  .login-card {
    width: 100%;
    padding: 34px;
    border: 1px solid var(--line);
    border-radius: 30px;
    background: color-mix(in srgb, var(--surface) 94%, transparent);
    box-shadow: var(--shadow);
  }
  .login-card h1 { margin: 20px 0 8px; font-size: 34px; line-height: 1.08; letter-spacing: -.045em; }
  .login-card > p { margin-bottom: 26px; color: var(--muted); font-size: 13.5px; }
  .login-actions { display: grid; gap: 12px; margin-top: 18px; }
  .login-actions sl-button::part(base) { width: 100%; min-height: 52px; }
  .login-foot { display: flex; justify-content: space-between; gap: 14px; margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--dim); font-size: 11px; }
  .login-foot a { text-decoration: none; }
  @media (max-width: 520px) {
    .login-page { padding-inline: 16px; }
    .login-card { padding: 26px 22px; border-radius: 26px; }
    .login-card h1 { font-size: 30px; }
  }
`;

const DASHBOARD_STYLE = `
  ${BASE_STYLE}
  .admin-shell { display: grid; grid-template-columns: 248px minmax(0, 1fr); min-height: 100vh; }
  .sidebar {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 22px 18px;
    border-right: 1px solid var(--line);
    background: color-mix(in srgb, var(--canvas-2) 88%, transparent);
    backdrop-filter: blur(18px);
  }
  .brand { display: flex; align-items: center; gap: 12px; padding: 2px 4px 24px; }
  .brand-mark {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    border-radius: 15px;
    background: var(--accent);
    color: var(--on-accent);
    font-size: 16px;
    font-weight: 780;
  }
  .brand strong { display: block; font-size: 14px; line-height: 1.2; }
  .brand small { display: block; color: var(--muted); font-size: 10.5px; }
  .side-nav { display: grid; gap: 5px; }
  .side-nav sl-button { width: 100%; }
  .side-nav sl-button::part(base) {
    justify-content: flex-start;
    width: 100%;
    min-height: 45px;
    padding-inline: 14px;
    border-color: transparent;
    background: transparent;
    color: var(--muted);
    text-align: left;
  }
  .side-nav sl-button:hover::part(base) { background: var(--surface); color: var(--ink); }
  .side-nav sl-button.is-active::part(base) { border-color: var(--line); background: var(--surface); color: var(--ink); box-shadow: var(--shadow-soft); }
  .side-nav sl-button::part(label) { width: 100%; display: flex; align-items: center; gap: 11px; }
  .side-nav svg { width: 18px; height: 18px; }
  .side-status { margin-top: auto; padding: 15px; border: 1px solid var(--line); border-radius: 18px; background: var(--surface); }
  .side-status span { color: var(--dim); font-size: 10.5px; }
  .side-status strong { display: block; margin-top: 4px; font-size: 12px; }
  .side-status sl-button { width: 100%; margin-top: 12px; }
  .side-status sl-button::part(base) { width: 100%; min-height: 38px; }
  .main-shell { min-width: 0; }
  .admin-topbar {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    min-height: 82px;
    padding: 14px clamp(20px, 3vw, 42px);
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--canvas) 86%, transparent);
    backdrop-filter: blur(18px);
  }
  .page-heading h1 { margin: 0; font-size: 24px; letter-spacing: -.035em; }
  .page-heading p { margin: 3px 0 0; color: var(--muted); font-size: 11.5px; }
  .top-actions { display: flex; align-items: center; gap: 8px; }
  .admin-content { width: min(1180px, 100%); margin: 0 auto; padding: 34px clamp(20px, 3vw, 42px) 88px; }
  .dashboard-section { display: none; animation: sectionIn 240ms var(--ease); }
  .dashboard-section.is-active { display: block; }
  .overview-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 28px;
    align-items: center;
    padding: 30px;
    border: 1px solid var(--line);
    border-radius: 30px;
    background:
      radial-gradient(circle at 95% 12%, var(--accent-soft), transparent 35%),
      var(--surface);
    box-shadow: var(--shadow-soft);
  }
  .overview-hero h2 { margin: 13px 0 8px; font-size: clamp(28px, 3.2vw, 42px); line-height: 1.08; letter-spacing: -.045em; }
  .overview-hero p { max-width: 620px; margin-bottom: 22px; color: var(--muted); font-size: 13px; line-height: 1.7; }
  .hero-actions { display: flex; flex-wrap: wrap; gap: 9px; }
  .hero-card-preview {
    position: relative;
    min-height: 175px;
    overflow: hidden;
    padding: 24px;
    border: 1px solid var(--accent-line);
    border-radius: 24px;
    background: linear-gradient(145deg, var(--canvas), var(--surface-2));
  }
  .hero-card-preview::before, .hero-card-preview::after {
    content: "";
    position: absolute;
    border: 1px solid var(--accent-line);
    border-radius: 50%;
    opacity: .52;
  }
  .hero-card-preview::before { width: 132px; height: 132px; right: -32px; top: -26px; }
  .hero-card-preview::after { width: 86px; height: 86px; right: -8px; top: -2px; }
  .hero-card-preview span { color: var(--muted); font-size: 10.5px; }
  .hero-card-preview strong { display: block; margin-top: 8px; font-size: 27px; letter-spacing: -.04em; }
  .hero-card-preview small { display: block; max-width: 170px; margin-top: 58px; color: var(--dim); font-size: 10.5px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
  .stat-card { padding: 19px; border: 1px solid var(--line); border-radius: 21px; background: var(--surface); box-shadow: var(--shadow-soft); }
  .stat-card span { color: var(--muted); font-size: 10.5px; }
  .stat-card strong { display: block; margin-top: 9px; font-size: 20px; font-weight: 700; letter-spacing: -.025em; }
  .stat-card small { display: block; margin-top: 5px; color: var(--dim); font-size: 10.5px; }
  .overview-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(270px, .7fr); gap: 16px; margin-top: 16px; }
  .panel { border: 1px solid var(--line); border-radius: 24px; background: var(--surface); box-shadow: var(--shadow-soft); }
  .panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 22px 23px 0; }
  .panel-head h2, .panel-head h3 { margin: 0; font-size: 16px; font-weight: 690; letter-spacing: -.02em; }
  .panel-head p { margin: 5px 0 0; color: var(--muted); font-size: 11.5px; }
  .panel-body { padding: 20px 23px 23px; }
  .status-list { display: grid; }
  .status-row { display: flex; align-items: center; justify-content: space-between; gap: 18px; min-height: 48px; border-top: 1px solid var(--line); font-size: 12px; }
  .status-row:first-child { border-top: 0; }
  .status-row span { color: var(--muted); }
  .status-row strong { font-weight: 600; text-align: right; }
  .action-stack { display: grid; gap: 9px; }
  .action-stack sl-button::part(base) { width: 100%; justify-content: flex-start; }
  .section-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 18px; }
  .section-intro h2 { margin: 0; font-size: 28px; letter-spacing: -.035em; }
  .section-intro p { max-width: 610px; margin: 6px 0 0; color: var(--muted); font-size: 12px; }
  .form-panel { margin-top: 14px; }
  .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 17px; }
  .form-grid .wide { grid-column: 1 / -1; }
  .mode-note, .info-note { display: flex; gap: 10px; padding: 12px 14px; border: 1px solid var(--accent-line); border-radius: 15px; background: var(--accent-soft); color: var(--muted); font-size: 11.5px; line-height: 1.55; }
  .mode-note i, .info-note i { width: 7px; height: 7px; flex: 0 0 auto; margin-top: 5px; border-radius: 50%; background: var(--accent); }
  .accent-row { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 12px; padding: 9px; border: 1px solid var(--line); border-radius: 15px; background: var(--field); }
  .accent-copy strong { display: block; font-size: 11.5px; }
  .accent-copy small { display: block; color: var(--dim); font-size: 10px; }
  .range-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; padding: 14px; border: 1px solid var(--line); border-radius: 17px; background: var(--field); }
  .range-row { display: grid; grid-template-columns: minmax(0,1fr) 38px; align-items: center; gap: 8px; }
  .range-row span { color: var(--text-soft); font-size: 10px; font-variant-numeric: tabular-nums; text-align: right; }
  .github-hero { display: flex; align-items: flex-start; gap: 16px; padding: 24px; border: 1px solid var(--line); border-radius: 24px; background: var(--surface); box-shadow: var(--shadow-soft); }
  .github-icon { display: grid; place-items: center; width: 48px; height: 48px; flex: 0 0 auto; border-radius: 16px; background: var(--accent-soft); color: var(--accent); }
  .github-icon svg { width: 23px; height: 23px; }
  .github-hero h2 { margin: 1px 0 5px; font-size: 18px; }
  .github-hero p { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.65; }
  .github-hero sl-badge { margin-left: auto; }
  .token-actions { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 16px; }
  .token-help { margin-top: 14px; border: 1px solid var(--line); border-radius: 19px; background: var(--surface); }
  .token-help::part(summary) { font-size: 12px; font-weight: 650; }
  .token-help::part(content) { color: var(--muted); font-size: 11.5px; }
  .token-help ol { margin: 4px 0 16px; padding-left: 19px; line-height: 1.8; }
  .savebar {
    position: sticky;
    bottom: 16px;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 20px;
    padding: 10px 10px 10px 18px;
    border: 1px solid var(--line-strong);
    border-radius: 22px;
    background: color-mix(in srgb, var(--surface) 88%, transparent);
    box-shadow: var(--shadow);
    backdrop-filter: blur(20px);
  }
  .savebar span { color: var(--muted); font-size: 11.5px; }
  .savebar sl-button::part(base) { min-width: 150px; }
  @keyframes sectionIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @media (max-width: 980px) {
    .admin-shell { grid-template-columns: 1fr; }
    .sidebar { position: sticky; top: 0; height: auto; flex-direction: row; align-items: center; gap: 12px; overflow-x: auto; padding: 12px 16px; border-right: 0; border-bottom: 1px solid var(--line); z-index: 40; }
    .brand { flex: 0 0 auto; padding: 0; }
    .brand small { display: none; }
    .side-nav { display: flex; min-width: max-content; }
    .side-nav sl-button { width: auto; }
    .side-nav sl-button::part(base) { min-height: 40px; padding-inline: 11px; }
    .side-status { display: none; }
    .overview-hero { grid-template-columns: 1fr; }
    .hero-card-preview { display: none; }
    .stats-grid { grid-template-columns: 1fr 1fr; }
    .overview-grid { grid-template-columns: 1fr; }
    .admin-topbar { top: 66px; }
  }
  @media (max-width: 680px) {
    .sidebar { flex-wrap: nowrap; gap: 8px; overflow: visible; padding: 10px 12px; }
    .sidebar .brand { flex: 0 0 auto; }
    .sidebar .brand > div:last-child { display: none; }
    .sidebar .brand-mark { width: 34px; height: 34px; border-radius: 12px; font-size: 13px; }
    .side-nav { display: grid; flex: 1; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 3px; min-width: 0; }
    .side-nav sl-button { width: 100%; }
    .side-nav sl-button::part(base) { justify-content: center; min-width: 0; min-height: 38px; padding: 4px 2px; }
    .side-nav sl-button::part(label) { justify-content: center; gap: 0; font-size: 9.5px; line-height: 1.15; white-space: nowrap; }
    .side-nav sl-button [slot="prefix"] { display: none; }
    .admin-topbar { min-height: 72px; padding-inline: 16px; }
    .admin-topbar { top: 58px; }
    .page-heading h1 { font-size: 20px; }
    .page-heading p { display: none; }
    .top-actions sl-badge { display: none; }
    .admin-content { padding: 22px 16px 80px; }
    .overview-hero { padding: 22px; border-radius: 25px; }
    .overview-hero h2 { font-size: 29px; }
    .stats-grid { gap: 9px; }
    .stat-card { padding: 16px; }
    .stats-grid .stat-card:nth-child(3), .stats-grid .stat-card:nth-child(4) { display: none; }
    .form-grid, .range-grid { grid-template-columns: 1fr; }
    .panel-head, .panel-body { padding-inline: 18px; }
    .github-hero { flex-wrap: wrap; padding: 19px; }
    .github-hero sl-badge { margin-left: 0; }
    .savebar { padding-left: 13px; }
    .savebar span { max-width: 170px; }
  }
`;

function field({
  id,
  label,
  value = "",
  maxlength = 64,
  placeholder = "",
  textarea = false,
  help = "",
  type = "text",
  wide = false,
}) {
  const common = `id="${id}" label="${escapeHtml(label)}" value="${escapeHtml(value)}" maxlength="${maxlength}" placeholder="${escapeHtml(placeholder)}" ${help ? `help-text="${escapeHtml(help)}"` : ""}`;
  const control = textarea
    ? `<sl-textarea ${common} rows="3" resize="vertical"></sl-textarea>`
    : `<sl-input ${common} type="${escapeHtml(type)}"></sl-input>`;
  return `<div class="${wide ? "wide" : ""}">${control}</div>`;
}

function themeOptions(selected) {
  return Object.entries(CARD_THEMES)
    .map(
      ([key, theme]) =>
        `<sl-option value="${key}">${escapeHtml(theme.labelZh || theme.label)} · ${escapeHtml(theme.noteZh || theme.note)}</sl-option>`,
    )
    .join("");
}

export function renderAdminLoginPage({ origin }) {
  return `<!doctype html>
<html lang="zh-CN" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow">
  <meta name="color-scheme" content="dark light">
  <title>管理员登录 · 主页卡片</title>
  ${FAVICON_LINK}
  ${themeBootScript("profile-card-admin-theme")}
  ${COMPONENT_THEME_LINKS}
  ${SHOELACE_IMPORT_MAP}
  <style>${LOGIN_STYLE}</style>
</head>
<body>
  <main class="login-page">
    <div class="login-topbar">
      <div class="brand">
        <div class="brand-mark">卡</div>
        <div><strong>主页卡片</strong><small>实例管理</small></div>
      </div>
      <sl-button id="themeButton" circle aria-label="切换页面主题">
        <span class="theme-icon">${ICONS.moon}${ICONS.sun}</span>
      </sl-button>
    </div>
    <div class="login-shell">
      <section class="login-card">
        <sl-badge pill>仅管理员</sl-badge>
        <h1>进入实例管理</h1>
        <p>在这里设置访问模式、默认卡片样式和 GitHub 数据连接。登录凭据只会保存在服务器端。</p>
        <sl-input id="secretInput" type="password" password-toggle label="管理员密钥" placeholder="输入 ADMIN_SECRET" autocomplete="current-password"></sl-input>
        <sl-alert id="formError" variant="danger" hidden></sl-alert>
        <div class="login-actions">
          <sl-button id="loginButton" variant="primary">
            <span id="loginButtonLabel">验证并进入</span>
          </sl-button>
        </div>
        <div class="login-foot">
          <a href="/">返回主页卡片</a>
          <span class="mono">${escapeHtml(new URL(origin).host)}</span>
        </div>
      </section>
    </div>
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
    function toast(message) {
      const node = document.getElementById("toast");
      document.getElementById("toastText").textContent = message;
      node.classList.add("visible");
      clearTimeout(toast.timer);
      toast.timer = setTimeout(() => node.classList.remove("visible"), 2200);
    }
    syncComponentTheme();
    const input = document.getElementById("secretInput");
    const button = document.getElementById("loginButton");
    const label = document.getElementById("loginButtonLabel");
    const alertBox = document.getElementById("formError");
    document.getElementById("themeButton").addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      syncComponentTheme();
      try { localStorage.setItem("profile-card-admin-theme", next); } catch {}
    });
    async function login() {
      alertBox.hidden = true;
      if (!String(input.value || "").trim()) {
        alertBox.textContent = "请输入管理员密钥。";
        alertBox.hidden = false;
        input.focus();
        return;
      }
      button.disabled = true;
      button.loading = true;
      label.textContent = "正在验证…";
      try {
        const response = await fetch("/admin/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: input.value }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || "登录失败，请稍后重试。");
        location.replace("/admin");
      } catch (error) {
        alertBox.textContent = error instanceof Error ? error.message : "登录失败。";
        alertBox.hidden = false;
        input.focus();
        toast(alertBox.textContent);
      } finally {
        button.disabled = false;
        button.loading = false;
        label.textContent = "验证并进入";
      }
    }
    button.addEventListener("click", login);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") login();
    });
  </script>
</body>
</html>`;
}

export function renderAdminDashboardPage({ origin }) {
  const tokenUrl =
    "https://github.com/settings/tokens/new?description=Profile%20Card%20(read-only)";
  return `<!doctype html>
<html lang="zh-CN" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow">
  <meta name="color-scheme" content="dark light">
  <title>实例管理 · 主页卡片</title>
  ${FAVICON_LINK}
  ${themeBootScript("profile-card-admin-theme")}
  ${COMPONENT_THEME_LINKS}
  ${SHOELACE_IMPORT_MAP}
  <style>${DASHBOARD_STYLE}</style>
</head>
<body>
  <div class="admin-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">卡</div>
        <div><strong>主页卡片</strong><small>实例管理</small></div>
      </div>
      <nav class="side-nav" aria-label="管理导航">
        <sl-button class="nav-item is-active" data-section="overview"><span slot="prefix">${ICONS.dashboard}</span><span>运行总览</span></sl-button>
        <sl-button class="nav-item" data-section="access"><span slot="prefix">${ICONS.key}</span><span>访问与实例</span></sl-button>
        <sl-button class="nav-item" data-section="appearance"><span slot="prefix">${ICONS.palette}</span><span>卡片外观</span></sl-button>
        <sl-button class="nav-item" data-section="github"><span slot="prefix">${ICONS.github}</span><span>GitHub 数据</span></sl-button>
        <sl-button class="nav-item" data-section="settings"><span slot="prefix">${ICONS.settings}</span><span>系统设置</span></sl-button>
      </nav>
      <div class="side-status">
        <span>前台状态</span>
        <strong id="sideStatusText">正在检查…</strong>
        <sl-button id="sidePreviewButton" size="small"><span slot="prefix">${ICONS.external}</span><span>打开前台</span></sl-button>
      </div>
    </aside>

    <div class="main-shell">
      <header class="admin-topbar">
        <div class="page-heading">
          <h1 id="pageTitle">运行总览</h1>
          <p id="pageSubtitle">查看实例状态、数据连接与最近配置。</p>
        </div>
        <div class="top-actions">
          <sl-badge id="topModeBadge" pill>读取配置</sl-badge>
          <sl-button id="themeButton" circle aria-label="切换管理后台主题"><span class="theme-icon">${ICONS.moon}${ICONS.sun}</span></sl-button>
          <sl-button id="logoutButton" aria-label="退出管理后台"><span slot="prefix">${ICONS.logout}</span><span>退出</span></sl-button>
        </div>
      </header>

      <main class="admin-content">
        <div id="formArea">
          <section class="dashboard-section is-active" data-section="overview">
            <div class="overview-hero">
              <div>
                <sl-badge id="healthBadge" pill>正在检查</sl-badge>
                <h2>你的卡片服务，<br>已经准备就绪。</h2>
                <p id="overviewDescription">正在读取实例配置与数据连接状态。保存后，前台和 API 会立即使用新设置。</p>
                <div class="hero-actions">
                  <sl-button id="openPreviewButton" variant="primary"><span slot="prefix">${ICONS.external}</span><span>打开主页卡片</span></sl-button>
                  <sl-button id="refreshDashboardButton"><span slot="prefix">${ICONS.refresh}</span><span>刷新状态</span></sl-button>
                </div>
              </div>
              <div class="hero-card-preview">
                <span>默认 GitHub 主页</span>
                <strong id="heroUsername">@DearLicy</strong>
                <small id="heroCardTheme">午夜主题 · 轨道构图</small>
              </div>
            </div>

            <div class="stats-grid">
              <article class="stat-card"><span>访问模式</span><strong id="statMode">读取中</strong><small id="statModeNote">正在读取访问范围</small></article>
              <article class="stat-card"><span>GitHub 数据</span><strong id="statData">读取中</strong><small id="statDataNote">正在检查数据源</small></article>
              <article class="stat-card"><span>配置存储</span><strong id="statStorage">读取中</strong><small id="statStorageNote">正在检查持久化</small></article>
              <article class="stat-card"><span>缓存策略</span><strong>5 分钟</strong><small>失败时可回退 24 小时快照</small></article>
            </div>

            <div class="overview-grid">
              <section class="panel">
                <div class="panel-head"><div><h3>服务状态</h3><p>这些状态来自当前实例和最近一次保存。</p></div><sl-badge pill>实时</sl-badge></div>
                <div class="panel-body status-list">
                  <div class="status-row"><span>默认主页</span><strong id="statusUser">@DearLicy</strong></div>
                  <div class="status-row"><span>GitHub 连接</span><strong id="statusGithub">检查中</strong></div>
                  <div class="status-row"><span>上次保存</span><strong id="statusSaved">尚未保存</strong></div>
                  <div class="status-row"><span>管理后台</span><strong class="mono">${escapeHtml(origin)}/admin</strong></div>
                </div>
              </section>
              <section class="panel">
                <div class="panel-head"><div><h3>快速操作</h3><p>常用管理动作集中在这里。</p></div></div>
                <div class="panel-body action-stack">
                  <sl-button id="quickGithubButton"><span slot="prefix">${ICONS.key}</span><span>配置 GitHub 数据</span></sl-button>
                  <sl-button id="quickAppearanceButton"><span slot="prefix">${ICONS.palette}</span><span>修改默认外观</span></sl-button>
                  <sl-button id="clearCacheButton"><span slot="prefix">${ICONS.refresh}</span><span>清空数据缓存</span></sl-button>
                  <sl-button id="repoButton"><span slot="prefix">${ICONS.github}</span><span>打开开源仓库</span></sl-button>
                </div>
              </section>
            </div>
          </section>

          <section class="dashboard-section" data-section="access">
            <div class="section-intro"><div><h2>访问与实例</h2><p>决定谁可以使用这个实例，以及前台默认展示哪个 GitHub 主页。</p></div><sl-badge pill>基础设置</sl-badge></div>
            <section class="panel form-panel">
              <div class="panel-head"><div><h3>访问范围</h3><p>公开模式适合开放给所有人；自用模式只允许指定账号。</p></div></div>
              <div class="panel-body form-grid">
                <div class="wide">
                  <sl-radio-group id="modeGroup" label="访问模式" value="public">
                    <sl-radio-button value="public">公开服务</sl-radio-button>
                    <sl-radio-button value="private">自用模式</sl-radio-button>
                  </sl-radio-group>
                  <div class="mode-note" style="margin-top:12px"><i></i><span id="modeHelp">公开模式允许任何公开 GitHub 主页生成卡片。</span></div>
                </div>
                <sl-input id="defaultUsername" label="默认 GitHub 用户" placeholder="DearLicy" help-text="打开前台时默认展示这个主页。"></sl-input>
                <sl-input id="allowedUsers" label="自用模式允许列表" placeholder="DearLicy, octocat" help-text="使用逗号或空格分隔；公开模式下不会限制访问。"></sl-input>
                <div class="wide">
                  <sl-input id="repoUrl" label="开源仓库地址" placeholder="https://github.com/DearLicy/dearlicy-profile-card" help-text="前台右上角唯一的 GitHub 按钮会指向这里。"></sl-input>
                </div>
              </div>
            </section>
          </section>

          <section class="dashboard-section" data-section="appearance">
            <div class="section-intro"><div><h2>卡片外观</h2><p>设置新请求的默认主题、文案、头像和背景。用户仍可通过前台继续调整。</p></div><sl-badge pill>默认样式</sl-badge></div>
            <section class="panel form-panel">
              <div class="panel-head"><div><h3>主题与强调色</h3><p>这些值会成为前台编辑器的初始状态。</p></div></div>
              <div class="panel-body form-grid">
                <sl-select id="theme" label="主题与构图" value="midnight">${themeOptions("midnight")}</sl-select>
                <div>
                  <span style="display:block;margin-bottom:7px;color:var(--muted);font-size:11.5px;font-weight:600">强调色</span>
                  <div class="accent-row">
                    <sl-color-picker id="accent" label="默认强调色" format="hex" value="#CBB9FF" size="small"></sl-color-picker>
                    <div class="accent-copy"><strong>默认强调色</strong><small>与主题默认色一致时请输入 #CBB9FF</small></div>
                  </div>
                </div>
                ${field({ id: "mark", label: "左上角标识", maxlength: 24, placeholder: "留空自动使用 GitHub 用户名" })}
                ${field({ id: "badge", label: "状态徽标", maxlength: 64, placeholder: "例如：正在开发 · ZIBLL_CHILD" })}
                ${field({ id: "headlineOne", label: "标题第一行", maxlength: 42, placeholder: "留空使用默认文案", wide: true })}
                ${field({ id: "headlineTwo", label: "标题第二行", maxlength: 48, placeholder: "留空使用默认文案", wide: true })}
                ${field({ id: "intro", label: "简介", maxlength: 120, placeholder: "留空使用默认文案", textarea: true, wide: true })}
                ${field({ id: "footerNote", label: "页脚备注", maxlength: 64, placeholder: "例如：保持好奇，持续交付。" })}
                ${field({ id: "avatarUrl", label: "自定义头像 URL", maxlength: 2048, placeholder: "https://…（留空使用 GitHub 头像）" })}
                ${field({ id: "backgroundUrl", label: "背景图片 URL", maxlength: 2048, placeholder: "https://…（HTTPS 图片）", wide: true })}
                <div class="wide">
                  <span style="display:block;margin-bottom:8px;color:var(--muted);font-size:11.5px;font-weight:600">背景四角透明度</span>
                  <div class="range-grid">
                    <div class="range-row"><sl-range id="bgTL" label="左上" min="0" max="100" step="1"></sl-range><span id="bgTLValue"></span></div>
                    <div class="range-row"><sl-range id="bgTR" label="右上" min="0" max="100" step="1"></sl-range><span id="bgTRValue"></span></div>
                    <div class="range-row"><sl-range id="bgBR" label="右下" min="0" max="100" step="1"></sl-range><span id="bgBRValue"></span></div>
                    <div class="range-row"><sl-range id="bgBL" label="左下" min="0" max="100" step="1"></sl-range><span id="bgBLValue"></span></div>
                  </div>
                </div>
              </div>
            </section>
          </section>

          <section class="dashboard-section" data-section="github">
            <div class="section-intro"><div><h2>GitHub 数据</h2><p>只配置一条服务端只读令牌，就能把匿名 REST 提升到更稳定的 GraphQL 数据通道。</p></div><sl-badge id="githubBadge" pill>检查中</sl-badge></div>
            <div class="github-hero">
              <div class="github-icon">${ICONS.github}</div>
              <div><h2 id="githubHeadline">正在检查 GitHub 连接</h2><p id="githubDescription">GitHub 匿名接口通常每小时只有 60 次请求。服务端令牌可以提高到每小时 5,000 次，并启用完整 GraphQL 数据。</p></div>
            </div>
            <section class="panel form-panel">
              <div class="panel-head"><div><h3>连接方式</h3><p>这里使用服务端只读访问令牌。适合读取公开数据，不需要额外配置授权应用或回调地址。</p></div></div>
              <div class="panel-body">
                <sl-input id="githubToken" type="password" password-toggle label="新的只读 GitHub 令牌" placeholder="粘贴 ghp_… 或 github_pat_…" help-text="留空会保留当前令牌；令牌只在服务端加密保存，接口不会返回明文。"></sl-input>
                <sl-switch id="clearToken" style="margin-top:14px">移除已加密保存的令牌</sl-switch>
                <sl-alert id="githubTestAlert" style="margin-top:14px" hidden></sl-alert>
                <div class="token-actions">
                  <sl-button id="createTokenButton" href="${tokenUrl}" target="_blank" rel="noreferrer" variant="primary"><span slot="prefix">${ICONS.external}</span><span>在 GitHub 创建令牌</span></sl-button>
                  <sl-button id="testGithubButton"><span slot="prefix">${ICONS.refresh}</span><span>测试已保存连接</span></sl-button>
                </div>
                <sl-details class="token-help" summary="如何创建正确的只读令牌？">
                  <ol>
                    <li>点击上方“在 GitHub 创建令牌”。</li>
                    <li>备注填写例如“主页卡片只读”，有效期按需选择。</li>
                    <li>这是公开数据代理，不需要勾选私有仓库权限；使用经典令牌时可以不选择 scope。</li>
                    <li>生成后复制完整令牌，粘贴到上方输入框并点击底部“保存配置”。</li>
                  </ol>
                  <div class="info-note"><i></i><span>没有令牌时仍能运行，但匿名接口限制较低。令牌只提升服务端读取额度，不会让本实例访问你的私有代码。</span></div>
                </sl-details>
              </div>
            </section>
          </section>

          <section class="dashboard-section" data-section="settings">
            <div class="section-intro"><div><h2>系统设置</h2><p>查看实例地址、存储方式与安全操作。</p></div><sl-badge pill>运行环境</sl-badge></div>
            <section class="panel form-panel">
              <div class="panel-head"><div><h3>实例信息</h3><p>这些信息只读，由当前部署环境提供。</p></div></div>
              <div class="panel-body form-grid">
                <sl-input id="siteOrigin" label="公开地址" readonly></sl-input>
                <sl-input id="adminOrigin" label="管理后台" readonly></sl-input>
                <div class="wide info-note"><i></i><span>配置写入服务器数据卷中的 <code>config.json</code>。敏感令牌使用管理员密钥派生的 AES-GCM 密钥加密。</span></div>
              </div>
            </section>
            <section class="panel form-panel">
              <div class="panel-head"><div><h3>维护操作</h3><p>清空缓存不会删除配置或令牌。</p></div></div>
              <div class="panel-body action-stack">
                <sl-button id="settingsClearCacheButton"><span slot="prefix">${ICONS.refresh}</span><span>清空卡片与图片缓存</span></sl-button>
                <sl-button id="settingsLogoutButton" variant="danger"><span slot="prefix">${ICONS.logout}</span><span>退出管理后台</span></sl-button>
              </div>
            </section>
          </section>

          <div class="savebar">
            <span id="saveNote">正在读取配置…</span>
            <sl-button id="saveButton" variant="primary"><span>保存配置</span></sl-button>
          </div>
        </div>
      </main>
    </div>
  </div>
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

    const origin = ${json(origin)};
    const themes = ${json(Object.fromEntries(Object.entries(CARD_THEMES).map(([key, theme]) => [key, {
      label: theme.labelZh || theme.label,
      note: theme.noteZh || theme.note,
    }])))};
    const state = { config: null, dirty: false };
    const titles = {
      overview: ["运行总览", "查看实例状态、数据连接与最近配置。"],
      access: ["访问与实例", "控制公开范围、默认用户和项目链接。"],
      appearance: ["卡片外观", "设置所有新请求的默认卡片样式。"],
      github: ["GitHub 数据", "配置只读令牌并检查数据通道。"],
      settings: ["系统设置", "查看实例信息并执行维护操作。"],
    };
    const elements = {
      pageTitle: document.getElementById("pageTitle"),
      pageSubtitle: document.getElementById("pageSubtitle"),
      formArea: document.getElementById("formArea"),
      topModeBadge: document.getElementById("topModeBadge"),
      healthBadge: document.getElementById("healthBadge"),
      modeGroup: document.getElementById("modeGroup"),
      defaultUsername: document.getElementById("defaultUsername"),
      allowedUsers: document.getElementById("allowedUsers"),
      repoUrl: document.getElementById("repoUrl"),
      theme: document.getElementById("theme"),
      accent: document.getElementById("accent"),
      mark: document.getElementById("mark"),
      badge: document.getElementById("badge"),
      headlineOne: document.getElementById("headlineOne"),
      headlineTwo: document.getElementById("headlineTwo"),
      intro: document.getElementById("intro"),
      footerNote: document.getElementById("footerNote"),
      avatarUrl: document.getElementById("avatarUrl"),
      backgroundUrl: document.getElementById("backgroundUrl"),
      githubToken: document.getElementById("githubToken"),
      clearToken: document.getElementById("clearToken"),
      githubBadge: document.getElementById("githubBadge"),
      githubHeadline: document.getElementById("githubHeadline"),
      githubDescription: document.getElementById("githubDescription"),
      githubTestAlert: document.getElementById("githubTestAlert"),
      saveButton: document.getElementById("saveButton"),
      saveNote: document.getElementById("saveNote"),
      toast: document.getElementById("toast"),
      toastText: document.getElementById("toastText"),
      heroUsername: document.getElementById("heroUsername"),
      heroCardTheme: document.getElementById("heroCardTheme"),
      statMode: document.getElementById("statMode"),
      statModeNote: document.getElementById("statModeNote"),
      statData: document.getElementById("statData"),
      statDataNote: document.getElementById("statDataNote"),
      statStorage: document.getElementById("statStorage"),
      statStorageNote: document.getElementById("statStorageNote"),
      statusUser: document.getElementById("statusUser"),
      statusGithub: document.getElementById("statusGithub"),
      statusSaved: document.getElementById("statusSaved"),
      sideStatusText: document.getElementById("sideStatusText"),
      overviewDescription: document.getElementById("overviewDescription"),
      modeHelp: document.getElementById("modeHelp"),
      openPreviewButton: document.getElementById("openPreviewButton"),
      sidePreviewButton: document.getElementById("sidePreviewButton"),
      repoButton: document.getElementById("repoButton"),
      siteOrigin: document.getElementById("siteOrigin"),
      adminOrigin: document.getElementById("adminOrigin"),
    };
    const corners = ["tl", "tr", "br", "bl"];
    let toastTimer;

    function toast(message) {
      clearTimeout(toastTimer);
      elements.toastText.textContent = message;
      elements.toast.classList.add("visible");
      toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 2300);
    }
    function setBadge(node, variant, text) {
      node.setAttribute("variant", variant);
      node.textContent = text;
    }
    function setField(id, value) {
      const node = document.getElementById(id);
      if (node) node.value = value ?? "";
    }
    function setSlider(key, value) {
      const input = document.getElementById("bg" + key.toUpperCase());
      const output = document.getElementById("bg" + key.toUpperCase() + "Value");
      const percent = Math.round(Number(value) * 100);
      input.value = percent;
      output.textContent = percent + "%";
    }
    function readSlider(key) {
      return Number(document.getElementById("bg" + key.toUpperCase()).value) / 100;
    }
    function activateSection(name) {
      document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.section === name));
      document.querySelectorAll(".dashboard-section").forEach((section) => section.classList.toggle("is-active", section.dataset.section === name));
      const [title, subtitle] = titles[name] || titles.overview;
      elements.pageTitle.textContent = title;
      elements.pageSubtitle.textContent = subtitle;
    }
    function sourceLabel(source) {
      if (source === "stored") return "后台令牌";
      if (source === "environment") return "环境变量令牌";
      return "匿名公开接口";
    }
    function cardConfig() {
      const accent = String(elements.accent.value || "").toUpperCase();
      return {
        theme: elements.theme.value,
        accent: accent === "#CBB9FF" ? "" : accent,
        mark: elements.mark.value,
        badge: elements.badge.value,
        headlineOne: elements.headlineOne.value,
        headlineTwo: elements.headlineTwo.value,
        intro: elements.intro.value,
        footerNote: elements.footerNote.value,
        avatarUrl: elements.avatarUrl.value,
        backgroundUrl: elements.backgroundUrl.value,
        backgroundCorners: { tl: readSlider("tl"), tr: readSlider("tr"), br: readSlider("br"), bl: readSlider("bl") },
      };
    }
    function hydrate(payload) {
      state.config = payload.site;
      const site = payload.site;
      const card = site.card;
      elements.modeGroup.value = site.mode;
      setField("defaultUsername", site.defaultUsername);
      setField("allowedUsers", site.allowedUsers.join(", "));
      setField("repoUrl", site.repoUrl);
      setField("theme", card.theme);
      setField("accent", card.accent || "#CBB9FF");
      setField("mark", card.mark);
      setField("badge", card.badge);
      setField("headlineOne", card.headlineOne);
      setField("headlineTwo", card.headlineTwo);
      setField("intro", card.intro);
      setField("footerNote", card.footerNote);
      setField("avatarUrl", card.avatarUrl);
      setField("backgroundUrl", card.backgroundUrl);
      setField("siteOrigin", origin);
      setField("adminOrigin", origin + "/admin");
      corners.forEach((key) => setSlider(key, card.backgroundCorners[key]));

      const dataLabel = payload.github.configured ? "已连接" : "匿名模式";
      const source = sourceLabel(payload.github.source);
      const persisted = Boolean(payload.admin.store?.persisted);
      const theme = themes[card.theme] || themes.midnight;
      setBadge(elements.topModeBadge, site.mode === "public" ? "success" : "warning", site.mode === "public" ? "公开服务" : "自用模式");
      setBadge(elements.healthBadge, "success", "运行正常");
      setBadge(elements.githubBadge, payload.github.configured ? "success" : "warning", dataLabel);
      elements.heroUsername.textContent = "@" + site.defaultUsername;
      elements.heroCardTheme.textContent = theme.label + "主题 · " + theme.note;
      elements.statMode.textContent = site.mode === "public" ? "公开服务" : "自用模式";
      elements.statModeNote.textContent = site.mode === "public" ? "任何公开主页均可使用" : "仅允许列表中的用户";
      elements.statData.textContent = dataLabel;
      elements.statDataNote.textContent = source;
      elements.statStorage.textContent = persisted ? "已持久化" : "默认配置";
      elements.statStorageNote.textContent = persisted ? "配置已写入数据卷" : "保存后写入数据卷";
      elements.statusUser.textContent = "@" + site.defaultUsername;
      elements.statusGithub.textContent = dataLabel + " · " + source;
      elements.statusSaved.textContent = site.updatedAt ? new Date(site.updatedAt).toLocaleString("zh-CN") : "尚未保存";
      elements.sideStatusText.textContent = dataLabel + " · " + (site.mode === "public" ? "公开服务" : "自用模式");
      elements.overviewDescription.textContent = "当前默认展示 @" + site.defaultUsername + "，使用" + source + "。前台和 API 已准备好接收访问。";
      elements.modeHelp.textContent = site.mode === "public" ? "公开模式允许任何公开 GitHub 主页生成卡片。" : "自用模式只允许允许列表中的 GitHub 用户请求。";
      elements.openPreviewButton.setAttribute("href", origin + "/?username=" + encodeURIComponent(site.defaultUsername));
      elements.sidePreviewButton.setAttribute("href", origin + "/?username=" + encodeURIComponent(site.defaultUsername));
      elements.repoButton.setAttribute("href", site.repoUrl);

      elements.githubHeadline.textContent = payload.github.configured ? "GitHub 数据连接已配置" : "当前使用匿名 GitHub 接口";
      elements.githubDescription.textContent = payload.github.configured
        ? "服务端正在使用" + source + "。现在可以通过 GraphQL 读取更完整的公开资料。"
        : "匿名接口通常每小时只有 60 次请求。创建只读令牌后，服务端可以提高到每小时 5,000 次。";
      elements.clearToken.disabled = !payload.github.hasStoredToken;
      state.dirty = false;
      elements.saveNote.textContent = site.updatedAt ? "上次保存：" + new Date(site.updatedAt).toLocaleString("zh-CN") : "当前使用默认配置，保存后写入数据卷。";
    }
    async function load() {
      try {
        const response = await fetch("/admin/api/config", { cache: "no-store" });
        if (response.status === 401) {
          location.replace("/admin/login");
          return;
        }
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "读取配置失败。");
        hydrate(payload);
      } catch (error) {
        toast(error instanceof Error ? error.message : "读取配置失败。");
      }
    }
    function serialize() {
      const token = String(elements.githubToken.value || "").trim();
      return {
        mode: elements.modeGroup.value || "public",
        defaultUsername: elements.defaultUsername.value,
        allowedUsers: elements.allowedUsers.value,
        repoUrl: elements.repoUrl.value,
        card: cardConfig(),
        githubTokenAction: token ? "set" : elements.clearToken.checked ? "clear" : "keep",
        githubToken: token,
      };
    }
    async function save() {
      elements.saveButton.disabled = true;
      elements.saveButton.loading = true;
      try {
        const response = await fetch("/admin/api/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(serialize()),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          location.replace("/admin/login");
          return;
        }
        if (!response.ok) throw new Error(payload.message || "保存失败。");
        elements.githubToken.value = "";
        elements.clearToken.checked = false;
        hydrate(payload);
        toast("配置已保存，前台与 API 已更新");
      } catch (error) {
        toast(error instanceof Error ? error.message : "保存失败。");
      } finally {
        elements.saveButton.disabled = false;
        elements.saveButton.loading = false;
      }
    }
    async function clearCache(button) {
      button.disabled = true;
      button.loading = true;
      try {
        const response = await fetch("/admin/api/cache/clear", { method: "POST" });
        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          location.replace("/admin/login");
          return;
        }
        if (!response.ok) throw new Error(payload.message || "清空缓存失败。");
        toast("缓存已清空");
      } catch (error) {
        toast(error instanceof Error ? error.message : "清空缓存失败。");
      } finally {
        button.disabled = false;
        button.loading = false;
      }
    }
    async function testGithub() {
      const button = document.getElementById("testGithubButton");
      button.disabled = true;
      button.loading = true;
      elements.githubTestAlert.hidden = true;
      try {
        const response = await fetch("/admin/api/github/test", { method: "POST" });
        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          location.replace("/admin/login");
          return;
        }
        if (!response.ok) throw new Error(payload.message || "连接测试失败。");
        elements.githubTestAlert.variant = "success";
        elements.githubTestAlert.textContent = "已通过 " + (payload.source === "graphql" ? "GraphQL" : "公开 REST") + " 连接 GitHub：@" + payload.login + "，用时 " + payload.latencyMs + "ms。";
        elements.githubTestAlert.hidden = false;
        toast("GitHub 连接正常");
      } catch (error) {
        elements.githubTestAlert.variant = "danger";
        elements.githubTestAlert.textContent = error instanceof Error ? error.message : "连接测试失败。";
        elements.githubTestAlert.hidden = false;
        toast("GitHub 连接测试失败");
      } finally {
        button.disabled = false;
        button.loading = false;
      }
    }
    function markDirty() {
      state.dirty = true;
      elements.saveNote.textContent = "有未保存的修改";
    }
    function logout() {
      return fetch("/admin/api/logout", { method: "POST" }).catch(() => undefined).finally(() => location.replace("/admin/login"));
    }

    document.querySelectorAll(".nav-item").forEach((button) => {
      button.addEventListener("click", () => activateSection(button.dataset.section));
    });
    document.getElementById("themeButton").addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      syncComponentTheme();
      try { localStorage.setItem("profile-card-admin-theme", next); } catch {}
    });
    document.getElementById("logoutButton").addEventListener("click", logout);
    document.getElementById("settingsLogoutButton").addEventListener("click", logout);
    document.getElementById("refreshDashboardButton").addEventListener("click", load);
    document.getElementById("clearCacheButton").addEventListener("click", (event) => clearCache(event.currentTarget));
    document.getElementById("settingsClearCacheButton").addEventListener("click", (event) => clearCache(event.currentTarget));
    document.getElementById("testGithubButton").addEventListener("click", testGithub);
    document.getElementById("quickGithubButton").addEventListener("click", () => activateSection("github"));
    document.getElementById("quickAppearanceButton").addEventListener("click", () => activateSection("appearance"));
    elements.saveButton.addEventListener("click", save);
    elements.formArea.addEventListener("sl-input", markDirty);
    elements.formArea.addEventListener("sl-change", (event) => {
      markDirty();
      if (event.target === elements.modeGroup) {
        elements.modeHelp.textContent = elements.modeGroup.value === "public" ? "公开模式允许任何公开 GitHub 主页生成卡片。" : "自用模式只允许允许列表中的 GitHub 用户请求。";
      }
    });
    corners.forEach((key) => {
      document.getElementById("bg" + key.toUpperCase()).addEventListener("sl-input", () => {
        document.getElementById("bg" + key.toUpperCase() + "Value").textContent = document.getElementById("bg" + key.toUpperCase()).value + "%";
      });
    });

    load();
  </script>
</body>
</html>`;
}
