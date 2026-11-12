export const ADMIN_SHELL_CSS = `
  .admin-rail {
    --rail-bg: #17130f;
    --rail-ink: #f7efe2;
    --rail-muted: #a79a88;
    --rail-line: rgba(247, 239, 226, .14);
    --rail-accent: #f15340;
    --rail-blue: #82a8ec;
    --rail-acid: #dce669;
  }
  .admin-shell {
    display: grid;
    grid-template-columns: 264px minmax(0, 1fr);
    min-height: 100vh;
  }
  .sidebar {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    padding: 22px 18px 18px;
    border-right: 1px solid var(--rail-line);
    background:
      radial-gradient(circle at 18px 18px, rgba(255,255,255,.035) 1px, transparent 1.5px) 0 0 / 14px 14px,
      var(--rail-bg);
    color: var(--rail-ink);
  }
  .sidebar::after {
    content: "ADMIN";
    position: absolute;
    right: -22px;
    bottom: 112px;
    color: transparent;
    font: 800 86px/.8 var(--font-sans);
    letter-spacing: -.08em;
    opacity: .14;
    -webkit-text-stroke: 1px var(--rail-ink);
    transform: rotate(-90deg);
    transform-origin: right bottom;
    pointer-events: none;
  }
  .sidebar .brand { position: relative; z-index: 1; padding: 2px 5px 26px; }
  .sidebar .brand-mark {
    border-color: var(--rail-ink);
    background: var(--rail-ink);
    color: var(--rail-bg);
    box-shadow: 3px 3px 0 var(--rail-accent);
  }
  .sidebar .brand-ink-red { background: var(--rail-accent); }
  .sidebar .brand-ink-blue { background: var(--rail-blue); }
  .sidebar .brand-copy strong { color: var(--rail-ink); }
  .sidebar .brand-copy span { color: var(--rail-muted); }
  .side-nav {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 5px;
  }
  .side-nav sl-button { width: 100%; }
  .side-nav sl-button::part(base) {
    justify-content: flex-start;
    width: 100%;
    min-height: 46px;
    padding-inline: 13px;
    border-color: transparent;
    border-radius: 4px 12px 12px 12px;
    background: transparent;
    color: var(--rail-muted);
    text-align: left;
    box-shadow: none;
  }
  .side-nav sl-button::part(label) { width: 100%; display: flex; align-items: center; gap: 11px; }
  .side-nav sl-button::part(prefix) { color: var(--rail-muted); }
  .side-nav sl-button:hover::part(base) {
    transform: none;
    border-color: var(--rail-line);
    background: rgba(255,255,255,.055);
    color: var(--rail-ink);
  }
  .side-nav sl-button:hover::part(prefix) { color: var(--rail-ink); }
  .side-nav sl-button.is-active::part(base) {
    border-color: var(--rail-ink);
    background: var(--rail-ink);
    color: var(--rail-bg);
    box-shadow: 3px 3px 0 var(--rail-accent);
  }
  .side-nav sl-button.is-active::part(prefix) { color: var(--rail-bg); }
  .side-nav svg { width: 18px; height: 18px; }
  .side-status {
    position: relative;
    z-index: 1;
    margin-top: auto;
    padding: 15px;
    border: 1px solid var(--rail-line);
    border-radius: 3px 13px 13px 13px;
    background: rgba(255,255,255,.045);
  }
  .side-status span { color: var(--rail-muted); font: 600 9px/1.2 var(--font-mono); letter-spacing: .08em; text-transform: uppercase; }
  .side-status strong { display: block; margin-top: 6px; color: var(--rail-ink); font-size: 12px; line-height: 1.5; }
  .side-status sl-button { width: 100%; margin-top: 12px; }
  .side-status sl-button::part(base) {
    width: 100%;
    min-height: 38px;
    border-color: var(--rail-line);
    background: transparent;
    color: var(--rail-ink);
  }
  .side-status sl-button::part(label),
  .side-status sl-button::part(prefix) { color: var(--rail-ink); }
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
    padding: 14px clamp(20px, 3.2vw, 46px);
    border-bottom: 1px solid var(--line-strong);
    background: color-mix(in srgb, var(--canvas) 92%, transparent);
    backdrop-filter: blur(18px) saturate(112%);
    -webkit-backdrop-filter: blur(18px) saturate(112%);
  }
  .admin-topbar::after {
    content: "";
    position: absolute;
    left: clamp(20px, 3.2vw, 46px);
    bottom: -1px;
    width: 62px;
    height: 3px;
    background: var(--accent);
  }
  .page-heading h1 { margin: 0; font-size: 24px; font-weight: 760; letter-spacing: -.035em; }
  .page-heading p { margin: 3px 0 0; color: var(--muted); font-size: 11.5px; }
  .top-actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
  .top-actions sl-button { flex: 0 0 auto; }
  .admin-content {
    width: min(1220px, 100%);
    margin: 0 auto;
    padding: 38px clamp(20px, 3.2vw, 46px) 96px;
  }
  .dashboard-section { display: none; animation: sectionIn 240ms var(--ease); }
  .dashboard-section.is-active { display: block; }
  .overview-hero {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(260px, .65fr);
    gap: clamp(24px, 4vw, 54px);
    align-items: center;
    padding: clamp(25px, 3.4vw, 42px);
    overflow: hidden;
    border: 1px solid var(--ink);
    border-radius: 4px 26px 26px 26px;
    background: var(--surface);
    box-shadow: 8px 8px 0 var(--accent);
  }
  .overview-hero::before {
    content: "SERVICE / 01";
    position: absolute;
    top: 20px;
    right: 23px;
    color: var(--dim);
    font: 600 8px/1 var(--font-mono);
    letter-spacing: .13em;
  }
  .overview-hero h2 {
    max-width: 720px;
    margin: 15px 0 12px;
    font-size: clamp(34px, 4.7vw, 62px);
    font-weight: 760;
    letter-spacing: -.06em;
    line-height: .98;
    text-wrap: balance;
  }
  .overview-hero h2 .overview-accent { color: var(--blue); }
  .overview-hero p { max-width: 650px; margin-bottom: 23px; color: var(--muted); font-size: 12.5px; line-height: 1.72; }
  .hero-actions { display: flex; flex-wrap: wrap; gap: 9px; }
  .hero-card-preview {
    position: relative;
    min-height: 190px;
    overflow: hidden;
    padding: 24px 22px;
    border: 1px solid #000;
    border-radius: 5px 20px 20px 20px;
    background: #17130f;
    color: #f7efe2;
    box-shadow: 6px 6px 0 var(--blue);
  }
  .hero-card-preview::before {
    content: "";
    position: absolute;
    top: 18px;
    right: -20px;
    width: 103px;
    height: 43px;
    background: var(--accent);
    transform: rotate(-19deg);
  }
  .hero-card-preview::after {
    content: "";
    position: absolute;
    right: 18px;
    bottom: 18px;
    width: 66px;
    height: 66px;
    border: 14px solid rgba(247,239,226,.14);
    border-radius: 50%;
  }
  .hero-card-preview span {
    display: block;
    max-width: 170px;
    color: rgba(247,239,226,.58);
    font: 550 8px/1.5 var(--font-mono);
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .hero-card-preview strong { display: block; margin-top: 9px; font: 750 30px/1 var(--font-editorial); letter-spacing: -.045em; }
  .hero-card-preview small { display: block; max-width: 180px; margin-top: 64px; color: rgba(247,239,226,.67); font-size: 10px; line-height: 1.6; }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-top: 24px;
    border-top: 1px solid var(--line-strong);
    border-bottom: 1px solid var(--line-strong);
  }
  .stat-card {
    position: relative;
    min-width: 0;
    padding: 20px 20px 19px;
    border-left: 1px solid var(--line);
  }
  .stat-card:first-child { border-left: 0; padding-left: 0; }
  .stat-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 20px;
    width: 24px;
    height: 2px;
    background: var(--accent);
    opacity: 0;
  }
  .stat-card:first-child::before { left: 0; opacity: 1; }
  .stat-card span { color: var(--muted); font: 650 9px/1.2 var(--font-mono); letter-spacing: .07em; text-transform: uppercase; }
  .stat-card strong { display: block; overflow: hidden; margin-top: 9px; font: 700 22px/1.1 var(--font-editorial); letter-spacing: -.03em; text-overflow: ellipsis; white-space: nowrap; }
  .stat-card small { display: block; overflow: hidden; margin-top: 6px; color: var(--dim); font-size: 10px; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }
  .overview-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(270px, .8fr);
    margin-top: 24px;
    overflow: hidden;
    border: 1px solid var(--ink);
    border-radius: 3px 20px 20px 20px;
    background: var(--surface);
    box-shadow: 5px 5px 0 var(--blue);
  }
  .panel { border: 0; background: transparent; box-shadow: none; }
  .overview-grid > .panel + .panel { border-left: 1px solid var(--line-strong); }
  .panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 21px 22px 0; }
  .panel-head h2, .panel-head h3 { margin: 0; font-size: 16px; font-weight: 750; letter-spacing: -.025em; }
  .panel-head p { margin: 5px 0 0; color: var(--muted); font-size: 11px; line-height: 1.5; }
  .panel-body { padding: 18px 22px 22px; }
  .status-list { display: grid; }
  .status-row { display: flex; align-items: center; justify-content: space-between; gap: 18px; min-height: 47px; border-top: 1px solid var(--line); font-size: 12px; }
  .status-row:first-child { border-top: 0; }
  .status-row span { color: var(--muted); }
  .status-row strong { max-width: 62%; overflow: hidden; font-weight: 650; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
  .action-stack { display: grid; gap: 8px; }
  .action-stack sl-button::part(base) { width: 100%; justify-content: flex-start; }
  .section-intro {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 18px;
    padding-bottom: 17px;
    border-bottom: 1px solid var(--line-strong);
  }
  .section-intro h2 { margin: 0; font-size: clamp(30px, 3.6vw, 44px); font-weight: 760; letter-spacing: -.05em; line-height: 1; }
  .section-intro p { max-width: 680px; margin: 8px 0 0; color: var(--muted); font-size: 12px; line-height: 1.65; }
  .form-panel { margin-top: 15px; overflow: hidden; border: 1px solid var(--ink); border-radius: 3px 18px 18px 18px; background: var(--surface); box-shadow: 4px 4px 0 var(--line-strong); }
  .form-panel + .form-panel { margin-top: 18px; }
  .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 17px; }
  .form-grid > *, .accent-row > *, .range-row > *, .savebar > * { min-width: 0; }
  .form-grid > * { align-self: start; }
  .form-grid .wide { grid-column: 1 / -1; }
  .field-caption {
    display: block;
    margin-bottom: 7px;
    color: var(--muted);
    font-size: 11.5px;
    font-weight: 680;
  }
  .mode-note, .info-note {
    display: flex;
    gap: 10px;
    margin-top: 12px;
    padding: 12px 14px;
    border: 1px solid var(--blue-line);
    border-left: 3px solid var(--blue);
    border-radius: 2px 10px 10px 10px;
    background: var(--blue-soft);
    color: var(--muted);
    font-size: 11.5px;
    line-height: 1.6;
  }
  .mode-note i, .info-note i { width: 7px; height: 7px; flex: 0 0 auto; margin-top: 6px; border-radius: 50%; background: var(--blue); }
  .accent-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    padding: 9px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--field);
  }
  .accent-copy strong { display: block; font-size: 11.5px; }
  .accent-copy small { display: block; color: var(--dim); font-family: var(--font-mono); font-size: 9.5px; }
  .range-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px 20px;
    padding: 15px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background:
      radial-gradient(circle at 4px 4px, var(--line-strong) 1px, transparent 1.5px) 0 0 / 12px 12px,
      var(--field);
  }
  .range-row { display: grid; grid-template-columns: minmax(0,1fr) auto; align-items: center; gap: 3px 8px; }
  .range-name { color: var(--muted); font-size: 10px; font-weight: 650; line-height: 1.2; }
  .range-value { color: var(--text-soft); font: 550 10px/1.2 var(--font-mono); font-variant-numeric: tabular-nums; line-height: 1.2; text-align: right; }
  .range-row sl-range { grid-column: 1 / -1; width: 100%; min-height: 22px; }
  .github-hero {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 24px;
    border: 1px solid var(--ink);
    border-radius: 3px 18px 18px 18px;
    background: #17130f;
    color: #f7efe2;
    box-shadow: 5px 5px 0 var(--accent);
  }
  .github-icon { display: grid; place-items: center; width: 48px; height: 48px; flex: 0 0 auto; border: 1px solid rgba(247,239,226,.24); border-radius: 50%; background: var(--accent); color: #fff9ed; }
  .github-icon svg { width: 23px; height: 23px; }
  .github-hero h2 { margin: 1px 0 5px; color: #f7efe2; font-size: 18px; }
  .github-hero p { margin: 0; color: rgba(247,239,226,.63); font-size: 12px; line-height: 1.65; }
  .github-hero sl-badge { margin-left: auto; }
  .token-actions { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 16px; }
  .token-switch { margin-top: 14px; }
  .github-alert { margin-top: 14px; }
  .token-help { margin-top: 14px; border: 1px solid var(--line-strong); border-radius: 3px 12px 12px 12px; background: var(--field); }
  .token-help::part(summary) { font-size: 12px; font-weight: 680; }
  .token-help::part(content) { color: var(--muted); font-size: 11.5px; }
  .token-help ol { margin: 4px 0 16px; padding-left: 19px; line-height: 1.8; }
  .admin-upload-job {
    display: grid;
    gap: 8px;
    margin-bottom: 16px;
    padding: 12px 14px 13px;
    border: 1px solid var(--line);
    border-radius: 3px 12px 12px 12px;
    background: var(--field);
  }
  .background-status-row {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
  }
  .background-status-row sl-badge { flex: 0 1 auto; }
  .background-percent {
    margin-left: auto;
    color: var(--text-soft);
    font: 650 10px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
  .admin-upload-job sl-progress-bar {
    --height: 5px;
    --track-color: var(--line);
    --indicator-color: var(--blue);
  }
  .admin-upload-job sl-progress-bar::part(base) { border-radius: 999px; box-shadow: none; }
  .admin-upload-job sl-progress-bar::part(indicator) { border-radius: inherit; background: linear-gradient(90deg, var(--blue), var(--accent)); }
  .admin-upload-job.is-complete sl-progress-bar::part(indicator) { background: var(--success); }
  .admin-upload-job.is-error sl-progress-bar::part(indicator) { background: var(--danger); }
  .background-help { color: var(--dim); font-size: 10px; line-height: 1.5; }
  .admin-upload-job.is-complete .background-help { color: var(--success); }
  .admin-upload-job.is-error .background-help { color: var(--danger); }
  .admin-image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 12px;
  }
  .admin-image-skeleton {
    display: block;
    --border-radius: 12px;
    height: 218px;
  }
  .admin-image-card {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--line-strong);
    border-radius: 4px 14px 14px 14px;
    background: var(--field);
    box-shadow: 2px 2px 0 var(--line);
  }
  .admin-image-thumb {
    position: relative;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    background: #11100e;
  }
  .admin-image-preview {
    position: absolute;
    inset: 8px;
    display: block;
    width: calc(100% - 16px);
    height: calc(100% - 16px);
    min-width: 0;
    min-height: 0;
  }
  .admin-image-preview::part(base) {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
  .admin-image-preview::part(label) {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }
  .admin-image-preview:hover::part(base) { transform: none; box-shadow: none; }
  .admin-image-preview img { display: block; width: 100%; height: 100%; object-fit: contain; transition: opacity 180ms var(--ease); }
  .admin-image-preview:hover img { opacity: .9; }
  .admin-image-thumb sl-badge { position: absolute; top: 8px; left: 8px; }
  .admin-image-body { display: grid; gap: 5px; min-width: 0; padding: 10px 11px 8px; }
  .admin-image-body strong { overflow: hidden; font-size: 12px; font-weight: 720; text-overflow: ellipsis; white-space: nowrap; }
  .admin-image-body small { color: var(--dim); font: 500 9px/1.45 var(--font-mono); overflow-wrap: anywhere; }
  .admin-image-actions { display: flex; gap: 5px; padding: 0 9px 9px; }
  .admin-image-actions sl-button { flex: 1 1 0; }
  .admin-image-actions sl-button::part(base) { width: 100%; min-height: 33px; padding-inline: 7px; font-size: 10px; }
  .admin-image-empty { margin: 8px 0 0; padding: 22px 18px; border: 1px dashed var(--line-strong); border-radius: 3px 12px 12px 12px; color: var(--muted); font-size: 11.5px; line-height: 1.65; text-align: center; }
  .delete-dialog-copy { margin: 0; color: var(--muted); font-size: 12.5px; line-height: 1.7; }
  .image-lightbox-dialog::part(panel) {
    width: min(1080px, 94vw);
    max-width: 1080px;
    background: #0b0a08;
    color: #f7efe2;
  }
  .image-lightbox-dialog::part(header) { background: #0b0a08; color: #f7efe2; }
  .image-lightbox-dialog::part(title) { color: #f7efe2; font-size: 14px; }
  .image-lightbox-dialog::part(close-button) { color: #f7efe2; }
  .image-lightbox-dialog::part(body) { padding: 0 14px 14px; background: #0b0a08; }
  .image-lightbox-frame {
    display: grid;
    place-items: center;
    min-height: 220px;
    overflow: hidden;
    border: 1px solid rgba(247, 239, 226, .18);
    border-radius: 4px 16px 16px 16px;
    background:
      radial-gradient(circle at 6px 6px, rgba(255,255,255,.08) 1px, transparent 1.5px) 0 0 / 18px 18px,
      #070605;
  }
  .image-lightbox-frame img { display: block; width: auto; max-width: 100%; max-height: min(76vh, 900px); object-fit: contain; }
  .savebar {
    --action: #f1e7d6;
    --action-strong: #fff8ec;
    --on-action: #17130f;
    position: relative;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 26px;
    padding: 11px 11px 11px 20px;
    border: 1px solid var(--ink);
    border-radius: 3px 16px 16px 16px;
    background: #17130f;
    color: #f7efe2;
    box-shadow: 5px 5px 0 var(--accent);
  }
  .savebar::before {
    content: "";
    position: absolute;
    top: -1px;
    left: 20px;
    width: 42px;
    height: 2px;
    background: var(--acid);
  }
  .savebar > span { color: rgba(247,239,226,.65); font-size: 11.5px; line-height: 1.45; }
  .savebar sl-button { flex: 0 0 auto; }
  .savebar sl-button::part(base) { min-width: 150px; min-height: 44px; }
  @keyframes sectionIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
`;

export const ADMIN_LOGIN_CSS = `
  .login-page {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr;
    min-height: 100vh;
    overflow: hidden;
    padding: 18px 20px 42px;
    background: var(--canvas);
  }
  .login-page::before {
    content: "";
    position: absolute;
    top: 18%;
    left: max(-160px, calc(50vw - 730px));
    width: clamp(230px, 29vw, 420px);
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--accent);
    opacity: .9;
  }
  .login-page::after {
    content: "";
    position: absolute;
    right: max(-260px, calc(50vw - 760px));
    bottom: -180px;
    width: clamp(360px, 48vw, 660px);
    aspect-ratio: 1;
    border: clamp(30px, 5vw, 70px) solid var(--blue);
    border-radius: 50%;
    opacity: .18;
  }
  .login-topbar {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: min(1120px, 100%);
    margin: 0 auto;
  }
  .login-shell { position: relative; z-index: 1; display: grid; place-items: center; width: min(500px, 100%); margin: 0 auto; padding: 54px 0 32px; }
  .login-card {
    position: relative;
    width: 100%;
    padding: 36px;
    border: 1px solid var(--ink);
    border-radius: 4px 28px 28px 28px;
    background: var(--surface);
    box-shadow: 8px 8px 0 var(--accent);
  }
  .login-card::before {
    content: "SECURE / ENTRY";
    position: absolute;
    top: -25px;
    left: 0;
    color: var(--muted);
    font: 650 9px/1 var(--font-mono);
    letter-spacing: .13em;
  }
  .login-card::after {
    content: "";
    position: absolute;
    top: -8px;
    right: 42px;
    width: 64px;
    height: 12px;
    background: var(--acid);
    transform: rotate(-2deg);
  }
  .login-card h1 { margin: 20px 0 8px; font-size: clamp(34px, 5vw, 43px); line-height: 1.04; letter-spacing: -.055em; }
  .login-card > p { margin-bottom: 27px; color: var(--muted); font-size: 13.5px; line-height: 1.7; }
  .login-actions { display: grid; gap: 12px; margin-top: 18px; }
  .login-actions sl-button::part(base) { width: 100%; min-height: 54px; }
  .login-foot { display: flex; justify-content: space-between; gap: 14px; margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--line-strong); color: var(--dim); font-size: 11px; }
  .login-foot a { text-underline-offset: 3px; }
  @media (max-width: 560px) {
    .login-page { padding-inline: 16px; }
    .login-shell { padding-top: 38px; }
    .login-card { padding: 28px 22px; border-radius: 3px 22px 22px 22px; box-shadow: 5px 5px 0 var(--accent); }
    .login-card::after { right: 26px; width: 48px; height: 9px; }
    .login-card h1 { font-size: 34px; }
    .login-page::before { top: 22%; left: -130px; width: 250px; opacity: .68; }
    .login-page::after { bottom: -230px; right: -230px; border-width: 38px; }
  }
`;

export const ADMIN_DASHBOARD_CSS = `
  ${ADMIN_SHELL_CSS}
  @media (max-width: 1040px) {
    .admin-shell { grid-template-columns: 224px minmax(0, 1fr); }
    .sidebar { padding-inline: 14px; }
    .overview-grid { grid-template-columns: 1fr; }
    .overview-grid > .panel + .panel { border-top: 1px solid var(--line-strong); border-left: 0; }
  }
  @media (max-width: 820px) {
    .admin-shell { display: block; }
    .sidebar {
      position: sticky;
      top: 0;
      z-index: 60;
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 100%;
      height: 60px;
      padding: 9px 16px;
      border-right: 0;
      border-bottom: 1px solid var(--rail-line);
    }
    .sidebar::after { display: none; }
    .sidebar .brand { padding: 0; }
    .sidebar .brand-mark { width: 36px; height: 36px; border-radius: 9px 5px 9px 5px; }
    .side-nav {
      position: fixed;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 70;
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 3px;
      padding: 7px 8px calc(7px + env(safe-area-inset-bottom));
      border-top: 1px solid var(--rail-line);
      background: #17130f;
      box-shadow: 0 -12px 34px rgba(0,0,0,.22);
    }
    .side-nav sl-button { width: 100%; }
    .side-nav sl-button::part(base) {
      flex-direction: column;
      justify-content: center;
      gap: 3px;
      min-height: 51px;
      padding: 5px 2px;
      border-radius: 9px;
      text-align: center;
    }
    .side-nav sl-button::part(label) { justify-content: center; gap: 3px; font-size: 8.5px; line-height: 1.1; white-space: nowrap; }
    .side-nav sl-button::part(prefix) { margin: 0; }
    .side-nav sl-button.is-active::part(base) { background: var(--rail-ink); color: var(--rail-bg); box-shadow: none; }
    .side-nav sl-button.is-active::part(prefix) { color: var(--rail-bg); }
    .side-nav sl-button::part(suffix) { display: none; }
    .side-status { display: none; }
    .admin-topbar { top: 60px; min-height: 72px; padding-inline: 16px; }
    .admin-topbar::after { left: 16px; width: 46px; }
    .admin-content { padding: 24px 16px 105px; }
    .overview-hero { grid-template-columns: 1fr; padding: 24px 20px; border-radius: 3px 20px 20px 20px; box-shadow: 5px 5px 0 var(--accent); }
    .overview-hero h2 { font-size: 39px; }
    .hero-card-preview { display: none; }
    .stats-grid { grid-template-columns: 1fr 1fr; }
    .stat-card { padding: 16px 14px; border-top: 1px solid var(--line); }
    .stat-card:nth-child(-n+2) { border-top: 0; }
    .stat-card:nth-child(odd) { border-left: 0; padding-left: 0; }
    .stat-card:nth-child(2)::before { left: 14px; }
    .stat-card strong { font-size: 20px; }
    .overview-grid { box-shadow: 4px 4px 0 var(--blue); }
    .panel-head, .panel-body { padding-inline: 18px; }
    .section-intro { align-items: flex-start; flex-direction: column; gap: 10px; }
    .section-intro h2 { font-size: 34px; }
    .form-grid, .range-grid { grid-template-columns: 1fr; }
    .github-hero { flex-wrap: wrap; padding: 19px; }
    .github-hero sl-badge { margin-left: 0; }
    .savebar { position: static; flex-direction: column; align-items: stretch; gap: 10px; padding: 13px; border-radius: 3px 13px 13px 13px; }
    .savebar > span { text-align: center; }
    .savebar sl-button { width: 100%; }
    .savebar sl-button::part(base) { width: 100%; }
    .github-icon { width: 43px; height: 43px; }
  }
  @media (max-width: 620px) {
    .sidebar .brand-copy small { display: none; }
    .page-heading p { display: none; }
    .page-heading h1 { font-size: 20px; }
    .top-actions sl-badge { display: none; }
    #logoutButton::part(base) { width: 42px; min-width: 42px; padding-inline: 0; }
    #logoutButton::part(label) { display: none; }
    .overview-hero::before { display: none; }
    .overview-hero h2 { font-size: 35px; }
    .section-intro h2 { font-size: 31px; }
    .stats-grid .stat-card:nth-child(3), .stats-grid .stat-card:nth-child(4) { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .dashboard-section { animation: none; }
  }
`;
