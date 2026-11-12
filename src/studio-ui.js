export const STUDIO_CSS = `
  .app-mesh {
    position: fixed;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
    transition: opacity 240ms var(--ease);
  }
  .mesh-disc,
  .mesh-ring,
  .mesh-bar,
  .mesh-cross {
    position: absolute;
    display: block;
    will-change: transform;
  }
  .mesh-disc {
    top: clamp(130px, 18vh, 220px);
    left: max(-130px, calc(50vw - 880px));
    width: clamp(210px, 26vw, 390px);
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--accent);
    opacity: .92;
    animation: driftDisc 18s var(--ease) infinite alternate;
  }
  .mesh-ring {
    top: 9vh;
    right: max(-240px, calc(50vw - 930px));
    width: clamp(360px, 45vw, 720px);
    aspect-ratio: 1;
    border: clamp(28px, 4vw, 64px) solid var(--blue);
    border-radius: 50%;
    opacity: .16;
    animation: driftRing 24s var(--ease) infinite alternate;
  }
  .mesh-bar {
    right: 7vw;
    bottom: 8vh;
    width: clamp(90px, 11vw, 170px);
    height: clamp(12px, 1.5vw, 20px);
    background: var(--acid);
    transform: rotate(-7deg);
    opacity: .82;
    animation: driftBar 16s var(--ease) infinite alternate;
  }
  .mesh-cross {
    top: 26vh;
    left: 8vw;
    width: 22px;
    height: 22px;
    opacity: .5;
  }
  .mesh-cross::before,
  .mesh-cross::after {
    content: "";
    position: absolute;
    background: var(--ink);
  }
  .mesh-cross::before { top: 10px; left: 0; width: 22px; height: 1px; }
  .mesh-cross::after { top: 0; left: 10px; width: 1px; height: 22px; }
  .topbar {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 80px;
    padding: 13px clamp(20px, 4vw, 58px);
    border-bottom: 1px solid var(--line-strong);
    background: color-mix(in srgb, var(--canvas) 92%, transparent);
    backdrop-filter: blur(18px) saturate(115%);
    -webkit-backdrop-filter: blur(18px) saturate(115%);
  }
  .topbar::after {
    content: "";
    position: absolute;
    left: clamp(20px, 4vw, 58px);
    bottom: -1px;
    width: 72px;
    height: 3px;
    background: var(--accent);
  }
  .topbar-brand { flex: 1 1 auto; }
  .compact-badge { margin-left: 4px; }
  .top-actions { display: flex; align-items: center; justify-content: flex-end; gap: 9px; flex: 0 0 auto; }
  .github-link::part(base) {
    min-height: 42px;
    border-color: var(--action);
    background: var(--action);
    color: var(--on-action);
    box-shadow: 3px 3px 0 var(--blue);
  }
  .github-link::part(label),
  .github-link::part(prefix),
  .github-link::part(suffix) { color: var(--on-action); }
  .github-link::part(suffix) { margin-left: 5px; opacity: .72; }
  .github-link .external-arrow { width: 13px !important; height: 13px !important; }
  .shell {
    width: min(1420px, calc(100% - clamp(32px, 7vw, 104px)));
    margin: 0 auto;
    padding: 0 0 44px;
  }
  .shell[data-view="landing"] {
    position: relative;
    display: grid;
    place-items: center;
    min-height: calc(100vh - 80px);
    min-height: calc(100svh - 80px);
    padding-block: clamp(42px, 8vh, 90px);
  }
  .shell[data-view="landing"] .app-mesh { opacity: 1; }
  .shell[data-view="result"] {
    padding-top: clamp(34px, 5vw, 64px);
  }
  .shell[data-view="result"] .mesh-disc { opacity: .35; transform: scale(.7); }
  .shell[data-view="result"] .mesh-ring { opacity: .08; }
  .shell[data-view="result"] .mesh-bar { opacity: .35; }
  .shell[data-view="result"] .hero { display: none; }
  .hero {
    position: relative;
    display: block;
    width: min(1120px, 100%);
  }
  .hero-main {
    position: relative;
    width: min(980px, 100%);
    padding-left: clamp(20px, 3.5vw, 52px);
    animation: landingIn 560ms var(--ease) both;
  }
  .hero-main::before {
    content: "";
    position: absolute;
    top: .16em;
    bottom: 3.7em;
    left: 0;
    width: clamp(5px, .7vw, 9px);
    background: var(--accent);
  }
  .hero-main::after {
    content: "";
    position: absolute;
    top: -.22em;
    left: clamp(20px, 3.5vw, 52px);
    width: clamp(54px, 7vw, 90px);
    height: clamp(9px, 1.2vw, 15px);
    background: var(--acid);
    transform: rotate(-2deg);
    transform-origin: left center;
  }
  h1 {
    position: relative;
    max-width: 980px;
    margin: 0;
    font-size: clamp(52px, 7.2vw, 102px);
    font-weight: 780;
    letter-spacing: -.075em;
    line-height: .96;
    text-wrap: balance;
  }
  h1 .hero-line { display: block; }
  h1 .hero-line:last-child { margin-top: .06em; }
  h1 em {
    position: relative;
    z-index: 1;
    display: inline-block;
    color: var(--blue);
    font-style: normal;
    letter-spacing: -.085em;
    white-space: nowrap;
  }
  h1 em::after {
    content: "";
    position: absolute;
    right: -.04em;
    bottom: .05em;
    left: -.02em;
    z-index: -1;
    height: .12em;
    background: var(--accent);
    transform: rotate(-1.2deg);
  }
  .search-form {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 12px;
    width: min(790px, 100%);
    margin-top: clamp(32px, 5vh, 52px);
    animation: riseIn 520ms 130ms var(--ease) both;
  }
  .search-form sl-input { width: 100%; }
  .search-form sl-input[size="large"]::part(base) {
    min-height: 64px;
    padding-inline: 21px;
    border: 1.5px solid var(--ink);
    border-radius: 20px 9px 20px 9px;
    background: var(--surface);
    box-shadow: 5px 5px 0 var(--ink);
  }
  .search-form sl-input[size="large"]::part(input) { font-size: 15px; font-weight: 580; }
  .search-form sl-input > [slot="prefix"] { margin-right: 5px; color: var(--blue); }
  .search-form sl-button[size="large"]::part(base) {
    min-height: 64px;
    padding-inline: 27px;
    border: 1.5px solid var(--action);
    border-radius: 999px;
    background: var(--action);
    color: var(--on-action);
    box-shadow: 4px 4px 0 var(--accent);
    font-size: 14px;
    font-weight: 720;
  }
  .search-form sl-button[size="large"]::part(label),
  .search-form sl-button[size="large"]::part(prefix) { color: var(--on-action); }
  .search-form sl-button[size="large"]::part(prefix) svg { transition: transform 200ms var(--ease); }
  .search-form sl-button[size="large"]:hover::part(prefix) svg { transform: translateX(3px); }
  .form-error {
    width: fit-content;
    margin: 13px 0 0;
    padding: 8px 12px;
    border-left: 3px solid var(--danger);
    background: var(--danger-soft);
    color: var(--danger);
    font-size: 12px;
    font-weight: 620;
  }
  .form-error:empty { display: none; }
  .result-view { width: 100%; }
  .result-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 26px;
    margin-bottom: 26px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--line-strong);
    animation: riseIn 420ms var(--ease) both;
  }
  .result-heading { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: 15px; }
  .result-index {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    margin-top: 7px;
    border: 1px solid var(--ink);
    background: var(--acid);
    color: var(--ink);
    font: 700 11px/1 var(--font-mono);
    transform: rotate(-3deg);
  }
  .result-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--accent);
    font: 700 10px/1.2 var(--font-mono);
    letter-spacing: .13em;
    text-transform: uppercase;
  }
  .result-kicker::before {
    content: "";
    width: 18px;
    height: 2px;
    background: var(--accent);
  }
  .result-head h2 {
    margin: 7px 0 0;
    font-size: clamp(32px, 4vw, 54px);
    font-weight: 760;
    letter-spacing: -.055em;
    line-height: 1.02;
    text-wrap: balance;
  }
  .result-head h2 .at { color: var(--blue); font-family: var(--font-editorial); font-weight: 700; }
  .result-head p { max-width: 610px; margin: 9px 0 0; color: var(--muted); font-size: 12.5px; line-height: 1.65; }
  .result-actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
  .result-actions sl-button::part(base) { background: var(--surface); }
  .workspace {
    display: grid;
    grid-template-columns: minmax(0, 1.42fr) minmax(390px, .78fr);
    gap: clamp(22px, 3vw, 38px);
    align-items: start;
    animation: riseIn 480ms 60ms var(--ease) both;
  }
  .preview-column,
  .editor-column { display: grid; min-width: 0; }
  .preview-column { gap: 0; width: 100%; max-width: 840px; margin-inline: auto; }
  .preview-shell {
    position: relative;
    width: 100%;
    padding: 12px;
    border: 1px solid var(--ink);
    border-radius: 24px 10px 24px 10px;
    background: var(--surface-2);
    box-shadow: 7px 7px 0 var(--blue);
  }
  .preview-shell::before {
    content: "";
    position: absolute;
    top: -7px;
    left: 34px;
    z-index: 2;
    width: 56px;
    height: 13px;
    background: var(--accent);
    transform: rotate(-2deg);
  }
  .preview-shell::after {
    content: "+";
    position: absolute;
    right: 17px;
    bottom: 10px;
    color: var(--ink);
    font: 400 16px/1 var(--font-mono);
    opacity: .5;
  }
  .preview-toolbar,
  .preview-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 43px;
    padding: 0 9px;
    color: var(--muted);
  }
  .preview-toolbar {
    font: 650 10px/1.25 var(--font-mono);
    letter-spacing: .09em;
    text-transform: uppercase;
  }
  .preview-toolbar-left { display: inline-flex; align-items: center; gap: 10px; }
  .window-dots { display: inline-flex; gap: 4px; }
  .window-dots i { display: block; width: 7px; height: 7px; border-radius: 1px; background: var(--dim); }
  .window-dots i:first-child { background: var(--accent); }
  .window-dots i:nth-child(2) { background: var(--blue); }
  .window-dots i:nth-child(3) { background: var(--acid); }
  .preview-toolbar .dim { color: var(--dim); font-size: 9px; }
  .preview-viewport {
    position: relative;
    display: grid;
    place-items: center;
    width: min(100%, 598px);
    min-height: 0;
    margin-inline: auto;
    aspect-ratio: 920 / 1360;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 16px 5px 16px 5px;
    background:
      linear-gradient(90deg, transparent 49.85%, rgba(255,255,255,.045) 50%, transparent 50.15%),
      #08090c;
  }
  .preview-viewport::after {
    content: "";
    position: absolute;
    inset: 10px;
    z-index: 4;
    border: 1px solid rgba(255,255,255,.075);
    border-radius: 9px;
    pointer-events: none;
  }
  .preview-viewport img { display: block; width: 100%; height: 100%; object-fit: contain; opacity: 1; }
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
    z-index: 5;
    display: none;
    place-items: center;
    padding: 30px;
    background: #160f12;
    color: #f2d4d7;
    text-align: center;
    font-size: 13px;
  }
  .preview-error.visible { display: grid; }
  .preview-footer {
    min-height: 45px;
    font-size: 10.5px;
    letter-spacing: .01em;
  }
  .sync-state { display: inline-flex; align-items: center; gap: 8px; color: var(--muted); }
  .sync-state i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--success);
    box-shadow: 0 0 0 4px var(--success-soft);
    animation: livePulse 2.4s ease-in-out infinite;
  }
  .metrics-surface {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-top: 1px solid var(--line-strong);
    border-bottom: 1px solid var(--line-strong);
  }
  .metric {
    position: relative;
    min-width: 0;
    padding: 19px 18px 18px;
    border-left: 1px solid var(--line);
  }
  .metric:first-child { border-left: 0; padding-left: 0; }
  .metric::before {
    content: "";
    position: absolute;
    top: 0;
    left: 18px;
    width: 24px;
    height: 2px;
    background: var(--accent);
    opacity: 0;
  }
  .metric:first-child::before { left: 0; opacity: 1; }
  .metric-label {
    display: block;
    margin-bottom: 8px;
    color: var(--muted);
    font: 650 9.5px/1.2 var(--font-mono);
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .metric-value {
    display: block;
    min-height: 38px;
    overflow: hidden;
    color: var(--ink);
    font: 700 29px/1.15 var(--font-editorial);
    letter-spacing: -.04em;
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .metric-value.is-loading { color: transparent; }
  .metric-skeleton {
    position: absolute;
    left: 18px;
    right: 18px;
    bottom: 21px;
    display: none;
  }
  .metric:first-child .metric-skeleton { left: 0; }
  .metric-value.is-loading + .metric-skeleton { display: block; }
  .editor-column { position: relative; }
  .workbench {
    overflow: hidden;
    border: 1px solid var(--ink);
    border-radius: 23px 9px 23px 9px;
    background: var(--surface);
    box-shadow: 5px 5px 0 var(--accent);
  }
  .editor-surface { overflow: hidden; background: var(--surface); }
  .editor-head { padding: 22px 22px 0; }
  .editor-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
  .editor-title-row h2 { margin: 0; font-size: 18px; font-weight: 750; letter-spacing: -.03em; }
  .editor-title-row p { margin: 5px 0 0; color: var(--muted); font-size: 11.5px; line-height: 1.55; }
  .editor-title-row sl-badge { margin-top: 1px; }
  .editor-tabs { margin-top: 19px; }
  .editor-tabs::part(nav) { gap: 4px; padding: 4px; border: 1px solid var(--line-strong); border-radius: 13px; background: var(--surface-2); }
  .editor-tabs::part(tabs) { border-bottom: 0; }
  .editor-tabs::part(body) { padding: 0; }
  .editor-body { padding: 19px 22px 23px; }
  .editor-tabs sl-tab { flex: 1 1 0; min-width: 0; }
  sl-tab::part(base) {
    justify-content: center;
    width: 100%;
    min-height: 37px;
    border-radius: 9px;
    color: var(--muted);
    font-size: 12px;
    font-weight: 690;
  }
  sl-tab[active]::part(base) { background: var(--ink); color: var(--canvas); }
  sl-tab-group::part(active-tab-indicator) { display: none; }
  .group-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 10px;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 720;
  }
  .group-label:not(:first-child) { margin-top: 21px; }
  .group-label small { color: var(--dim); font-family: var(--font-mono); font-size: 9px; font-weight: 500; }
  .theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .theme-grid sl-button.theme-card { width: 100%; }
  .theme-grid sl-button.theme-card:last-child { grid-column: 1 / -1; }
  .theme-grid sl-button.theme-card::part(base) {
    justify-content: flex-start;
    width: 100%;
    min-height: 65px;
    padding: 8px 9px;
    border: 1px solid var(--line);
    border-radius: 12px 5px 12px 5px;
    background: var(--field);
    color: var(--ink);
    box-shadow: none;
  }
  .theme-grid sl-button.theme-card:hover::part(base) {
    transform: translateY(-1px);
    border-color: var(--line-strong);
    box-shadow: 2px 2px 0 var(--line-strong);
  }
  .theme-card::part(label) {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) 18px;
    align-items: center;
    gap: 9px;
    width: 100%;
    padding: 0;
  }
  .theme-card.is-active::part(base) {
    border-color: var(--ink);
    background: color-mix(in srgb, var(--surface) 80%, var(--blue-soft));
    box-shadow: 3px 3px 0 var(--blue);
  }
  .theme-art {
    position: relative;
    display: block;
    width: 48px;
    height: 42px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--swatch-a) 65%, #777);
    border-radius: 7px 2px 7px 2px;
    background: var(--swatch-a);
  }
  .theme-art i { position: absolute; display: block; }
  .theme-art--orbit { background: radial-gradient(circle at 72% 38%, #2b2c34, var(--swatch-a) 60%); }
  .art-ring { top: 7px; right: 6px; width: 29px; height: 29px; border: 1px solid var(--swatch-b); border-radius: 50%; opacity: .72; }
  .art-planet { top: 17px; right: 16px; width: 9px; height: 9px; border-radius: 50%; background: var(--swatch-c); box-shadow: 0 0 9px var(--swatch-b); }
  .art-axis { right: 3px; top: 21px; width: 40px; height: 1px; background: var(--swatch-b); opacity: .5; transform: rotate(-22deg); }
  .art-dot { left: 8px; bottom: 8px; width: 13px; height: 2px; background: var(--swatch-c); }
  .theme-art--editorial { background: var(--swatch-a); }
  .art-rule { top: 0; bottom: 0; left: 12px; width: 2px; background: var(--swatch-b); }
  .art-copy { left: 20px; height: 2px; background: var(--swatch-c); }
  .art-copy-a { top: 11px; width: 25px; height: 4px; }
  .art-copy-b { top: 22px; width: 18px; opacity: .72; }
  .art-copy-c { top: 29px; width: 22px; opacity: .4; }
  .art-stamp { right: 5px; bottom: 5px; width: 10px; height: 10px; border: 1px solid var(--swatch-b); transform: rotate(12deg); }
  .theme-art--terminal { background: var(--swatch-a); }
  .art-terminal-bar { inset: 0 0 auto; height: 10px; border-bottom: 1px solid var(--swatch-b); background: color-mix(in srgb, var(--swatch-a) 80%, #000); }
  .art-scan { left: 0; right: 0; top: 20px; height: 1px; background: var(--swatch-b); opacity: .35; }
  .art-prompt { left: 7px; top: 16px; width: 9px; height: 5px; border-left: 1px solid var(--swatch-b); border-bottom: 1px solid var(--swatch-b); }
  .art-code { left: 20px; height: 2px; background: var(--swatch-b); }
  .art-code-a { top: 17px; width: 26px; }
  .art-code-b { top: 26px; width: 19px; opacity: .55; }
  .theme-art--poster { background: var(--swatch-a); }
  .art-sun { right: 7px; top: 7px; width: 25px; height: 25px; border-radius: 50%; background: var(--swatch-b); opacity: .92; }
  .art-slash { left: -9px; top: 9px; width: 44px; height: 8px; background: var(--swatch-c); transform: rotate(-34deg); }
  .art-marquee { left: 0; right: 0; bottom: 7px; height: 5px; background: var(--swatch-b); opacity: .65; }
  .art-poster-line { left: 7px; bottom: 18px; width: 28px; height: 2px; background: var(--swatch-c); }
  .theme-art--swiss { background: var(--swatch-a); }
  .art-grid {
    inset: 0;
    background:
      linear-gradient(to right, transparent 32.8%, var(--swatch-c) 33%, transparent 33.4%, transparent 65.8%, var(--swatch-c) 66%, transparent 66.4%),
      linear-gradient(to bottom, transparent 48.4%, var(--swatch-c) 48.8%, transparent 49.2%);
    opacity: .35;
  }
  .art-swiss-block { left: 6px; bottom: 6px; width: 14px; height: 14px; background: var(--swatch-b); }
  .art-swiss-rule { right: 5px; top: 8px; width: 22px; height: 2px; background: var(--swatch-c); }
  .art-swiss-number { right: 5px; bottom: 4px; color: var(--swatch-b); font: 700 7px/1 var(--font-mono); }
  .theme-name { display: grid; min-width: 0; gap: 2px; text-align: left; }
  .theme-name strong { overflow: hidden; font-size: 11.5px; font-weight: 720; text-overflow: ellipsis; white-space: nowrap; }
  .theme-name small { overflow: hidden; color: var(--dim); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
  .theme-check {
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border: 1px solid var(--line-strong);
    border-radius: 50%;
    opacity: 0;
    color: var(--canvas);
    background: var(--ink);
    transform: scale(.78);
    transition: opacity 160ms var(--ease), transform 180ms var(--ease);
  }
  .theme-check svg { width: 11px; height: 11px; }
  .theme-card.is-active .theme-check { opacity: 1; transform: none; }
  .field-stack { display: grid; gap: 15px; }
  .accent-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 11px;
    padding: 9px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--field);
  }
  .accent-copy { min-width: 0; }
  .accent-copy strong { display: block; font-size: 11.5px; font-weight: 690; }
  .accent-copy small { display: block; overflow: hidden; color: var(--dim); font-family: var(--font-mono); font-size: 9.5px; text-overflow: ellipsis; white-space: nowrap; }
  .accent-row sl-button::part(base) { min-height: 35px; padding-inline: 12px; font-size: 11px; }
  .background-job {
    display: grid;
    gap: 8px;
    margin-top: 10px;
    padding: 11px 12px 12px;
    border: 1px solid var(--line);
    border-radius: 4px 12px 12px 12px;
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
  .background-job sl-progress-bar {
    --height: 5px;
    --track-color: var(--line);
    --indicator-color: var(--blue);
  }
  .background-job sl-progress-bar::part(base) { border-radius: 999px; box-shadow: none; }
  .background-job sl-progress-bar::part(indicator) {
    border-radius: inherit;
    background: linear-gradient(90deg, var(--blue), var(--accent));
  }
  .background-job.is-complete sl-progress-bar::part(indicator) {
    background: var(--success);
  }
  .background-job.is-error sl-progress-bar::part(indicator) {
    background: var(--danger);
  }
  .background-help {
    min-width: 0;
    color: var(--dim);
    font-size: 10px;
    line-height: 1.5;
  }
  .background-job.is-complete .background-help { color: var(--success); }
  .background-job.is-error .background-help { color: var(--danger); }
  .corner-map {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px 18px;
    padding: 15px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background:
      radial-gradient(circle at 4px 4px, var(--line-strong) 1px, transparent 1.5px) 0 0 / 12px 12px,
      var(--field);
  }
  .range-row { display: grid; grid-template-columns: minmax(0,1fr) auto; align-items: center; gap: 3px 8px; }
  .range-name { color: var(--muted); font-size: 10px; font-weight: 650; line-height: 1.2; }
  .range-value { color: var(--text-soft); font: 550 10px/1.2 var(--font-mono); font-variant-numeric: tabular-nums; line-height: 1.2; text-align: right; }
  .range-row sl-range { grid-column: 1 / -1; width: 100%; min-height: 22px; }
  .reset-row { display: flex; justify-content: flex-end; margin-top: 12px; }
  .reset-row sl-button::part(base) { min-height: 36px; font-size: 11px; }
  .embed-surface {
    border-top: 1px solid var(--ink);
    background: var(--surface-2);
  }
  .embed-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 22px 0; }
  .embed-head h2 { margin: 0; font-size: 14px; font-weight: 740; letter-spacing: -.02em; }
  .embed-body { padding: 12px 22px 21px; }
  .embed-code {
    max-height: 158px;
    overflow: auto;
    margin: 0 0 11px;
    padding: 14px;
    border: 1px solid #050505;
    border-top: 3px solid var(--accent);
    border-radius: 4px 10px 10px 10px;
    background: #11100e;
    color: #cfc6b7;
    font: 9.5px/1.7 var(--font-mono);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .embed-body sl-button::part(base) { width: 100%; min-height: 45px; }
  .api-strip {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 16px;
    margin-top: clamp(30px, 5vw, 54px);
    padding: 20px 22px;
    border: 1px solid var(--ink);
    border-radius: 4px 18px 18px 18px;
    background: var(--blue);
    color: #fff9ed;
    box-shadow: 5px 5px 0 var(--ink);
  }
  .api-strip .api-icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border: 1px solid rgba(255,255,255,.45);
    border-radius: 50%;
    background: var(--accent);
    color: #fff9ed;
    font: 760 9.5px/1 var(--font-mono);
    transform: rotate(-5deg);
  }
  .api-strip strong { display: block; color: #fff9ed; font-size: 12px; }
  .api-strip code { display: block; overflow: hidden; margin-top: 4px; color: rgba(255,249,237,.7); font-size: 9.5px; text-overflow: ellipsis; white-space: nowrap; }
  .api-strip sl-button::part(base) { border-color: rgba(255,255,255,.4); background: #fff9ed; color: #17130f; }
  .api-strip sl-button::part(label) { color: #17130f; }
  .page-footer {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    margin-top: 30px;
    padding-top: 18px;
    border-top: 1px solid var(--line-strong);
    color: var(--dim);
    font-size: 10.5px;
  }
  .page-footer span:last-child { text-align: right; }
  @keyframes landingIn {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes riseIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes livePulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(.72); opacity: .52; }
  }
  @keyframes driftDisc { from { transform: translate3d(0, 0, 0) rotate(-4deg); } to { transform: translate3d(18px, 24px, 0) rotate(5deg); } }
  @keyframes driftRing { from { transform: translate3d(0, 0, 0) rotate(0deg); } to { transform: translate3d(-16px, 20px, 0) rotate(8deg); } }
  @keyframes driftBar { from { transform: rotate(-7deg) translateX(0); } to { transform: rotate(-4deg) translateX(-14px); } }
  @media (min-width: 1060px) and (min-height: 980px) {
    .editor-column { position: sticky; top: 103px; }
  }
  @media (hover: hover) {
    .search-form sl-button[size="large"]:hover::part(base) { transform: translateY(-2px); box-shadow: 5px 6px 0 var(--accent); }
  }
  @media (max-width: 1120px) {
    .workspace { grid-template-columns: minmax(0, 1.25fr) minmax(360px, .8fr); gap: 22px; }
    .theme-card::part(label) { grid-template-columns: 48px minmax(0, 1fr) 16px; gap: 8px; }
    .theme-art { width: 48px; height: 42px; }
  }
  @media (max-width: 940px) {
    .workspace { grid-template-columns: 1fr; }
    .preview-column { max-width: 720px; }
    .editor-column { width: min(720px, 100%); margin-inline: auto; }
    .theme-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .theme-grid sl-button.theme-card:last-child { grid-column: auto; }
    .theme-card::part(label) { grid-template-columns: 48px minmax(0, 1fr); }
    .theme-check { display: none; }
  }
  @media (max-width: 680px) {
    .topbar { min-height: 68px; padding-inline: 16px; }
    .topbar::after { left: 16px; width: 46px; }
    .brand-copy span, .compact-badge, .github-label { display: none; }
    .brand-mark { width: 38px; height: 38px; border-radius: 11px 6px 11px 6px; box-shadow: 2px 2px 0 var(--ink); }
    .brand-glyph { font-size: 18px; }
    .github-link::part(base) { width: 42px; min-width: 42px; padding: 0; }
    .github-link::part(suffix) { display: none; }
    .mesh-disc { top: 130px; left: -96px; width: 210px; opacity: .74; }
    .mesh-ring { top: 12vh; right: -180px; width: 340px; border-width: 28px; }
    .mesh-bar { right: 20px; bottom: 7vh; width: 80px; height: 10px; }
    .mesh-cross { display: none; }
    .shell { width: calc(100% - 32px); padding-bottom: 30px; }
    .shell[data-view="landing"] {
      place-items: center start;
      min-height: calc(100vh - 68px);
      min-height: calc(100svh - 68px);
      padding-block: 32px;
    }
    .hero { width: 100%; }
    .hero-main { padding-left: 18px; }
    .hero-main::before { bottom: 4.8em; width: 5px; }
    .hero-main::after { left: 18px; width: 48px; height: 8px; }
    h1 { font-size: clamp(36px, 10.6vw, 52px); line-height: 1.03; letter-spacing: -.064em; }
    h1 .hero-line { display: inline; }
    h1 .hero-line:last-child { margin-top: 0; }
    h1 em { white-space: normal; }
    .search-form { grid-template-columns: 1fr; gap: 10px; margin-top: 32px; }
    .search-form sl-input[size="large"]::part(base) { min-height: 56px; padding-inline: 17px; border-radius: 17px 8px 17px 8px; box-shadow: 4px 4px 0 var(--ink); }
    .search-form sl-button[size="large"]::part(base) { width: 100%; min-height: 54px; box-shadow: 3px 3px 0 var(--accent); }
    .shell[data-view="result"] { padding-top: 28px; }
    .result-head { align-items: flex-start; flex-direction: column; gap: 16px; margin-bottom: 18px; padding-bottom: 16px; }
    .result-heading { gap: 11px; }
    .result-index { width: 32px; height: 32px; margin-top: 3px; font-size: 9px; }
    .result-head h2 { font-size: 34px; }
    .result-head p { font-size: 11.5px; }
    .result-actions { display: grid; grid-template-columns: 1fr 1fr; width: 100%; gap: 8px; }
    .result-actions sl-button::part(base) { width: 100%; }
    .workspace { gap: 18px; }
    .preview-shell { padding: 8px; border-radius: 18px 7px 18px 7px; box-shadow: 4px 4px 0 var(--blue); }
    .preview-shell::before { left: 24px; width: 42px; height: 9px; }
    .preview-toolbar { min-height: 36px; padding-inline: 4px; }
    .preview-toolbar .dim { display: none; }
    .preview-viewport { width: 100%; border-radius: 12px 4px 12px 4px; }
    .preview-viewport::after { inset: 6px; }
    .preview-skeleton { padding: 22px; }
    .preview-footer { min-height: 40px; padding-inline: 4px; }
    .metrics-surface { grid-template-columns: 1fr 1fr; }
    .metric { padding: 16px 14px; border-top: 1px solid var(--line); }
    .metric:nth-child(-n+2) { border-top: 0; }
    .metric:nth-child(odd) { border-left: 0; padding-left: 0; }
    .metric:first-child::before { left: 0; }
    .metric:nth-child(2)::before { left: 14px; }
    .metric-value { font-size: 25px; }
    .metric-skeleton { left: 14px; right: 14px; bottom: 18px; }
    .workbench { border-radius: 18px 7px 18px 7px; box-shadow: 4px 4px 0 var(--accent); }
    .editor-head { padding: 18px 16px 0; }
    .editor-body { padding: 16px 16px 19px; }
    .embed-head { padding: 15px 16px 0; }
    .embed-body { padding: 11px 16px 18px; }
    .theme-grid { grid-template-columns: 1fr 1fr; }
    .theme-grid sl-button.theme-card:last-child { grid-column: 1 / -1; }
    .theme-card::part(label) { grid-template-columns: 50px minmax(0, 1fr) 17px; }
    .theme-check { display: grid; }
    .theme-art { width: 50px; height: 42px; }
    .corner-map { grid-template-columns: 1fr; }
    .accent-row { grid-template-columns: auto minmax(0, 1fr); }
    .accent-row sl-button { grid-column: 2; justify-self: start; }
    .api-strip { grid-template-columns: auto minmax(0, 1fr); padding: 16px; }
    .api-strip sl-button { grid-column: 2; justify-self: start; }
    .page-footer { flex-direction: column; align-items: flex-start; gap: 5px; }
    .page-footer span:last-child { text-align: left; }
  }
  @media (max-width: 460px) {
    .theme-grid { grid-template-columns: 1fr; }
    .theme-grid sl-button.theme-card:last-child { grid-column: auto; }
    .theme-card::part(label) { grid-template-columns: 48px minmax(0, 1fr) 18px; }
    .theme-art { width: 48px; height: 42px; }
    .result-actions { grid-template-columns: 1fr; }
  }
`;
