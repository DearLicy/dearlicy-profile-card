import { ICONS } from "./ui.js";

export const BRAND_MARK = `<span class="brand-mark" aria-hidden="true"><span class="brand-glyph">卡</span><i class="brand-ink brand-ink-red"></i><i class="brand-ink brand-ink-blue"></i></span>`;

export const THEME_TOGGLE = `<sl-button id="themeButton" class="theme-toggle" circle aria-label="切换页面主题">
  <span class="theme-icon">${ICONS.moon}${ICONS.sun}</span>
</sl-button>`;

export const PRINT_THEME_CSS = `
  :root {
    --canvas: #f1eadc;
    --canvas-2: #e7dece;
    --canvas-3: #ddd2bf;
    --surface: #fbf7ed;
    --surface-2: #f4ecdf;
    --surface-3: #ebe1d2;
    --field: #f8f1e5;
    --ink: #1a1714;
    --text-soft: #3f3932;
    --muted: #776e62;
    --dim: #9a9083;
    --line: rgba(31, 26, 21, .13);
    --line-strong: rgba(31, 26, 21, .28);
    --accent: #d6422e;
    --accent-strong: #ae2b1b;
    --accent-soft: rgba(214, 66, 46, .10);
    --accent-line: rgba(214, 66, 46, .34);
    --blue: #17498d;
    --blue-strong: #10366d;
    --blue-soft: rgba(23, 73, 141, .10);
    --blue-line: rgba(23, 73, 141, .30);
    --acid: #c9d442;
    --acid-soft: rgba(201, 212, 66, .18);
    --action: #1a1714;
    --action-strong: #000;
    --on-action: #fff8ec;
    --danger: #b52b25;
    --danger-soft: rgba(181, 43, 37, .09);
    --success: #226b50;
    --warning: #8a5b06;
    --success-soft: rgba(34, 107, 80, .09);
    --warning-soft: rgba(138, 91, 6, .09);
    --grain: rgba(39, 31, 24, .14);
    --shadow: 0 30px 76px rgba(55, 39, 23, .14);
    --shadow-soft: 0 13px 34px rgba(55, 39, 23, .085);
    --shadow-float: 0 18px 44px rgba(55, 39, 23, .12);
    --ease: cubic-bezier(.22, 1, .36, 1);
    --font-sans: "Avenir Next", "Geist", "Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
    --font-editorial: "Iowan Old Style", "Palatino Linotype", "Songti SC", "Noto Serif SC", serif;
    --font-mono: "SFMono-Regular", "Cascadia Code", Menlo, Consolas, monospace;
    color-scheme: light;
  }
  html[data-theme="dark"] {
    --canvas: #11100e;
    --canvas-2: #171511;
    --canvas-3: #1e1b16;
    --surface: #1c1915;
    --surface-2: #24201b;
    --surface-3: #2c2720;
    --field: #171410;
    --ink: #f6efe2;
    --text-soft: #ded4c5;
    --muted: #a39888;
    --dim: #756b5f;
    --line: rgba(246, 239, 226, .12);
    --line-strong: rgba(246, 239, 226, .25);
    --accent: #f15340;
    --accent-strong: #ff806d;
    --accent-soft: rgba(241, 83, 64, .13);
    --accent-line: rgba(241, 83, 64, .36);
    --blue: #82a8ec;
    --blue-strong: #b5cbff;
    --blue-soft: rgba(130, 168, 236, .13);
    --blue-line: rgba(130, 168, 236, .32);
    --acid: #dce669;
    --acid-soft: rgba(220, 230, 105, .13);
    --action: #f1e7d6;
    --action-strong: #fff8ec;
    --on-action: #17130f;
    --danger: #ff978d;
    --danger-soft: rgba(255, 151, 141, .11);
    --success: #83d6b7;
    --warning: #ecc46e;
    --success-soft: rgba(131, 214, 183, .11);
    --warning-soft: rgba(236, 196, 110, .11);
    --grain: rgba(246, 239, 226, .10);
    --shadow: 0 30px 80px rgba(0, 0, 0, .42);
    --shadow-soft: 0 14px 38px rgba(0, 0, 0, .28);
    --shadow-float: 0 20px 48px rgba(0, 0, 0, .34);
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  html { min-height: 100%; background: var(--canvas); }
  body {
    min-height: 100vh;
    margin: 0;
    background: transparent;
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: 16px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-image: radial-gradient(var(--grain) .62px, transparent .62px);
    background-size: 8px 8px;
    opacity: .3;
  }
  a { color: inherit; }
  button, input, textarea, select { font: inherit; }
  .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .brand-mark {
    position: relative;
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    isolation: isolate;
    border: 1px solid var(--ink);
    border-radius: 13px 7px 13px 7px;
    background: var(--surface);
    color: var(--ink);
    box-shadow: 3px 3px 0 var(--ink);
  }
  .brand-glyph {
    position: relative;
    z-index: 2;
    font-family: var(--font-editorial);
    font-size: 20px;
    font-weight: 800;
    line-height: 1;
  }
  .brand-ink { position: absolute; display: block; pointer-events: none; }
  .brand-ink-red {
    right: 5px;
    bottom: 5px;
    z-index: 1;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--accent);
  }
  .brand-ink-blue {
    top: 5px;
    left: 5px;
    z-index: 1;
    width: 12px;
    height: 3px;
    background: var(--blue);
    transform: rotate(-18deg);
  }
  .brand-copy { display: flex; flex-direction: column; min-width: 0; line-height: 1.16; }
  .brand-copy strong { font-size: 14.5px; font-weight: 760; letter-spacing: -.02em; white-space: nowrap; }
  .brand-copy span { color: var(--muted); font-size: 10.5px; letter-spacing: .02em; white-space: nowrap; }
  .theme-toggle { width: 42px; height: 42px; flex: 0 0 auto; }
  .theme-toggle::part(base) {
    width: 42px;
    min-width: 42px;
    padding: 0;
    border-color: var(--line-strong);
    background: var(--surface);
    color: var(--ink);
    box-shadow: none;
  }
  .theme-icon { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; }
  .theme-icon svg { display: block; width: 18px; height: 18px; }
  .theme-icon .sun { display: none; }
  html[data-theme="light"] .theme-icon .moon { display: none; }
  html[data-theme="light"] .theme-icon .sun { display: block; }
  .toast {
    position: fixed;
    top: 18px;
    left: 50%;
    z-index: 120;
    max-width: min(450px, calc(100vw - 32px));
    padding: 11px 18px;
    border: 1px solid var(--ink);
    border-radius: 4px 14px 14px 14px;
    background: var(--surface);
    color: var(--ink);
    box-shadow: 5px 5px 0 var(--ink);
    font-size: 12px;
    font-weight: 650;
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, -10px);
    transition: opacity 200ms var(--ease), transform 200ms var(--ease);
  }
  .toast.visible { opacity: 1; transform: translate(-50%, 0); }
  sl-button::part(base) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 42px;
    padding-inline: 17px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--surface);
    color: var(--ink);
    box-shadow: none;
    font-family: var(--font-sans);
    font-weight: 680;
    line-height: 1.18;
    transition: transform 160ms var(--ease), background-color 180ms var(--ease), border-color 180ms var(--ease), color 180ms var(--ease);
  }
  sl-button::part(label) { display: inline-flex; align-items: center; justify-content: center; gap: 8px; line-height: 1.18; }
  sl-button[variant="primary"]::part(base) {
    border-color: var(--action);
    background: var(--action);
    color: var(--on-action);
    box-shadow: 3px 3px 0 var(--accent);
  }
  sl-button[variant="primary"]::part(label),
  sl-button[variant="primary"]::part(prefix),
  sl-button[variant="primary"]::part(suffix) { color: var(--on-action); }
  sl-button[variant="primary"]:hover::part(base) {
    border-color: var(--action-strong);
    background: var(--action-strong);
    color: var(--on-action);
  }
  sl-button[variant="danger"]::part(base) {
    border-color: color-mix(in srgb, var(--danger) 36%, transparent);
    background: var(--danger-soft);
    color: var(--danger);
  }
  sl-button:active::part(base) { transform: scale(.98); }
  sl-button:focus-visible::part(base) { outline: 2px solid var(--blue); outline-offset: 3px; }
  sl-button > [slot="prefix"], sl-button > [slot="suffix"] { display: inline-flex; align-items: center; justify-content: center; }
  sl-button > [slot="prefix"] svg, sl-button > [slot="suffix"] svg { display: block; width: 17px; height: 17px; }
  sl-input::part(base), sl-textarea::part(base), sl-select::part(combobox) {
    min-height: 44px;
    padding-inline: 14px;
    border-color: var(--line-strong);
    border-radius: 13px;
    background: var(--field);
    color: var(--ink);
    font-family: var(--font-sans);
    box-shadow: none;
    transition: border-color 180ms var(--ease), box-shadow 180ms var(--ease), background-color 180ms var(--ease);
  }
  sl-input::part(base):hover, sl-textarea::part(base):hover, sl-select::part(combobox):hover { border-color: color-mix(in srgb, var(--ink) 48%, transparent); }
  sl-input::part(base):focus-within, sl-textarea::part(base):focus-within, sl-select::part(combobox):focus-within {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px var(--blue-soft);
  }
  sl-input::part(input), sl-textarea::part(textarea), sl-select::part(display-input) {
    padding: 0;
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.35;
  }
  sl-input::part(input)::placeholder, sl-textarea::part(textarea)::placeholder, sl-select::part(display-input)::placeholder { color: var(--dim); opacity: 1; }
  sl-input::part(form-control-label), sl-textarea::part(form-control-label), sl-select::part(form-control-label) {
    color: var(--muted);
    font-size: 11.5px;
    font-weight: 680;
    line-height: 1.35;
  }
  sl-input::part(form-control-help-text), sl-textarea::part(form-control-help-text), sl-select::part(form-control-help-text) {
    color: var(--dim);
    font-size: 10.5px;
  }
  sl-select::part(expand-icon), sl-select::part(clear-button) { display: inline-flex; align-items: center; justify-content: center; color: var(--muted); }
  sl-select::part(listbox) {
    margin-top: 6px;
    padding: 6px;
    border: 1px solid var(--ink);
    border-radius: 12px;
    background: var(--surface);
    box-shadow: 4px 4px 0 var(--ink);
  }
  sl-option::part(base) {
    min-height: 38px;
    padding: 7px 10px;
    border-radius: 8px;
    color: var(--text-soft);
    font-family: var(--font-sans);
    font-size: 12px;
  }
  sl-option:hover::part(base), sl-option:focus::part(base) { background: var(--surface-2); color: var(--ink); }
  sl-option[aria-selected="true"]::part(base) { background: var(--blue-soft); color: var(--ink); }
  sl-option::part(checked-icon) { color: var(--blue); }
  sl-radio-group::part(form-control-label) { color: var(--muted); font-size: 11.5px; font-weight: 680; }
  sl-radio-button::part(button) { min-height: 42px; border-color: var(--line-strong); background: var(--field); color: var(--muted); font-size: 12px; font-weight: 680; }
  sl-radio-button::part(button--checked) { border-color: var(--ink); background: var(--ink); color: var(--canvas); }
  sl-switch::part(control--checked) { background: var(--blue); border-color: var(--blue); }
  sl-switch::part(label) { color: var(--muted); font-size: 12px; }
  sl-range { --track-color: var(--line-strong); --track-color-active: var(--blue); --thumb-color: var(--ink); }
  sl-color-picker::part(base) { border: 1px solid var(--line-strong); border-radius: 12px; background: var(--field); }
  sl-color-picker::part(trigger) { border-radius: 9px; }
  sl-badge::part(base) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 24px;
    padding: 4px 10px;
    border: 1px solid var(--line-strong);
    background: var(--surface);
    color: var(--muted);
    font-size: 10px;
    font-weight: 680;
    line-height: 1;
    white-space: nowrap;
  }
  sl-badge[variant="success"]::part(base) { border-color: color-mix(in srgb, var(--success) 34%, transparent); background: var(--success-soft); color: var(--success); }
  sl-badge[variant="warning"]::part(base) { border-color: color-mix(in srgb, var(--warning) 34%, transparent); background: var(--warning-soft); color: var(--warning); }
  sl-alert::part(base) { border-radius: 12px; }
  sl-details { border-color: var(--line-strong); }
  sl-details::part(header) { border-radius: 11px; }
  code, pre, .mono { font-family: var(--font-mono); }
  @media (hover: hover) {
    sl-button[variant="primary"]:hover::part(base) { transform: translateY(-1px); }
    sl-button:not([variant="primary"]):hover::part(base) { transform: translateY(-1px); border-color: var(--ink); }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      scroll-behavior: auto !important;
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .01ms !important;
    }
    sl-button:active::part(base) { transform: none; }
  }
`;
