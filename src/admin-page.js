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
    --on-accent: #17141c;
    --danger: #f08b8b;
    --success: #79d7b0;
    --shadow: 0 30px 90px rgba(0,0,0,.48);
    --ease: cubic-bezier(.22,1,.36,1);
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
    --on-accent: #fff;
    --shadow: 0 30px 90px rgba(52,42,75,.14);
  }
  * { box-sizing: border-box; }
  html { min-height: 100%; background: var(--canvas); color-scheme: dark; }
  html[data-theme="light"] { color-scheme: light; }
  body {
    min-height: 100vh;
    margin: 0;
    background:
      radial-gradient(circle at 10% 0%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 34%),
      radial-gradient(circle at 90% 6%, rgba(255,255,255,.035), transparent 25%),
      var(--canvas);
    color: var(--ink);
    font: 15px/1.55 "Inter", "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  a { color: inherit; }
  button, input, textarea, select { font: inherit; }
  button { -webkit-tap-highlight-color: transparent; }
  .mono { font-family: "SFMono-Regular", Menlo, Consolas, monospace; }
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 76px;
    padding: 14px max(20px, calc((100vw - 1180px)/2));
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--canvas) 86%, transparent);
    backdrop-filter: blur(18px);
  }
  .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .brand-mark {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    border-radius: 15px;
    background: var(--accent);
    color: var(--on-accent);
    font: 800 11px/1 "SFMono-Regular", Menlo, monospace;
    letter-spacing: .08em;
  }
  .brand strong { display: block; font-size: 14px; line-height: 1.25; }
  .brand small { display: block; color: var(--muted); font-size: 11px; }
  .top-actions { display: flex; align-items: center; gap: 8px; }
  .icon-button, .ghost-button {
    display: inline-grid;
    place-items: center;
    min-width: 42px;
    height: 42px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    color: var(--muted);
    cursor: pointer;
    text-decoration: none;
    transition: transform 160ms var(--ease), background 180ms, color 180ms;
  }
  .ghost-button { display: inline-flex; padding: 0 16px; font-size: 12px; font-weight: 650; }
  .icon-button:hover, .ghost-button:hover { color: var(--ink); background: var(--surface-2); }
  .icon-button:active, .ghost-button:active { transform: scale(.96); }
  .icon-button svg { width: 18px; height: 18px; }
  .sun { display: none; }
  html[data-theme="light"] .sun { display: block; }
  html[data-theme="light"] .moon { display: none; }
  .shell { width: min(1180px, calc(100% - 40px)); margin: 0 auto; padding: 48px 0 80px; }
  .eyebrow { color: var(--muted); font: 600 10px/1 "SFMono-Regular", Menlo, monospace; letter-spacing: .16em; }
  h1 { margin: 14px 0 0; font-size: clamp(34px, 5vw, 54px); font-weight: 650; line-height: 1.02; letter-spacing: -.05em; }
  .hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; margin-bottom: 34px; }
  .hero p { max-width: 610px; margin: 16px 0 0; color: var(--muted); font-size: 14px; }
  .hero-status { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
  .status-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
    padding: 0 13px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    color: var(--muted);
    font: 600 10px/1 "SFMono-Regular", Menlo, monospace;
    letter-spacing: .08em;
    white-space: nowrap;
  }
  .status-chip i { width: 6px; height: 6px; border-radius: 50%; background: var(--dim); }
  .status-chip.is-ok i { background: var(--success); box-shadow: 0 0 0 4px color-mix(in srgb, var(--success) 12%, transparent); }
  .status-chip.is-warn i { background: #e8bd75; }
  .layout { display: grid; gap: 20px; }
  .panel {
    border: 1px solid var(--line);
    border-radius: 26px;
    background: var(--surface);
    box-shadow: 0 18px 50px rgba(0,0,0,.08);
  }
  .panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 24px 24px 0;
  }
  .panel-head h2 { margin: 0; font-size: 18px; font-weight: 650; letter-spacing: -.02em; }
  .panel-head p { margin: 5px 0 0; color: var(--muted); font-size: 12px; }
  .panel-number { color: var(--dim); font: 600 10px/1 "SFMono-Regular", Menlo, monospace; letter-spacing: .1em; }
  .panel-body { padding: 22px 24px 26px; }
  .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
  .form-grid .wide { grid-column: 1 / -1; }
  .field { display: grid; gap: 7px; min-width: 0; }
  .field > span, .field-label { color: var(--muted); font-size: 12px; font-weight: 600; }
  .field small { color: var(--dim); font-size: 11px; line-height: 1.45; }
  .control {
    width: 100%;
    height: 46px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    outline: none;
    background: var(--field);
    color: var(--ink);
    transition: border-color 180ms, box-shadow 180ms;
  }
  textarea.control { height: auto; min-height: 92px; padding: 12px 14px; resize: vertical; }
  .control:focus { border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
  .control::placeholder { color: var(--dim); }
  select.control {
    appearance: none;
    background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%);
    background-position: calc(100% - 18px) 20px, calc(100% - 13px) 20px;
    background-size: 5px 5px;
    background-repeat: no-repeat;
  }
  .segmented { display: inline-flex; width: 100%; padding: 4px; border: 1px solid var(--line); border-radius: 14px; background: var(--field); }
  .segmented label { flex: 1; cursor: pointer; }
  .segmented input { position: absolute; opacity: 0; pointer-events: none; }
  .segmented span {
    display: grid;
    place-items: center;
    min-height: 38px;
    border-radius: 10px;
    color: var(--muted);
    font-size: 12px;
    font-weight: 620;
    transition: background 180ms, color 180ms, box-shadow 180ms;
  }
  .segmented input:checked + span { background: var(--surface); color: var(--ink); box-shadow: 0 4px 14px rgba(0,0,0,.12); }
  .mode-note {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    border: 1px solid var(--accent-soft);
    border-radius: 14px;
    background: var(--accent-soft);
    color: var(--muted);
    font-size: 11.5px;
  }
  .mode-note i { width: 7px; height: 7px; flex: 0 0 auto; margin-top: 5px; border-radius: 50%; background: var(--accent); }
  .swatch { display: flex; gap: 7px; align-items: center; }
  .swatch i { width: 12px; height: 12px; border-radius: 50%; background: var(--accent); }
  input[type="color"].control { padding: 5px 8px; cursor: pointer; }
  .sliders { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 20px; }
  .slider-row { display: grid; grid-template-columns: 54px minmax(0, 1fr) 40px; align-items: center; gap: 10px; }
  .slider-row label { color: var(--muted); font-size: 11px; }
  .slider-row output { color: var(--ink); font: 10px/1 "SFMono-Regular", Menlo, monospace; text-align: right; }
  input[type="range"] { width: 100%; accent-color: var(--accent); }
  .inline-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 0 20px;
    border: 1px solid transparent;
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font-size: 12.5px;
    font-weight: 680;
    text-decoration: none;
    cursor: pointer;
    transition: transform 160ms var(--ease), background 180ms, border-color 180ms, opacity 180ms;
  }
  .button:hover { transform: translateY(-1px); }
  .button:active { transform: scale(.98); }
  .button:disabled { cursor: wait; opacity: .6; transform: none; }
  .button-primary { background: var(--accent); color: var(--on-accent); }
  .button-primary:hover { background: var(--accent-strong); }
  .button-secondary { border-color: var(--line-strong); background: var(--surface-2); }
  .button-danger { border-color: color-mix(in srgb, var(--danger) 35%, transparent); color: var(--danger); }
  .button-small { min-height: 36px; padding: 0 14px; font-size: 11px; }
  .secret-state {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--field);
    color: var(--muted);
    font-size: 12px;
  }
  .secret-state strong { color: var(--ink); font-weight: 600; }
  .savebar {
    position: sticky;
    bottom: 18px;
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
  .savebar .button { min-width: 148px; }
  .toast {
    position: fixed;
    left: 50%;
    top: 18px;
    z-index: 100;
    max-width: min(440px, calc(100vw - 32px));
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
  .login-shell { display: grid; place-items: center; width: min(520px, calc(100% - 32px)); min-height: calc(100vh - 40px); margin: 0 auto; padding: 44px 0; }
  .login-card { width: 100%; padding: 34px; border: 1px solid var(--line); border-radius: 30px; background: var(--surface); box-shadow: var(--shadow); }
  .login-mark { display: grid; place-items: center; width: 62px; height: 62px; margin-bottom: 26px; border-radius: 21px; background: var(--accent); color: var(--on-accent); font: 800 13px/1 "SFMono-Regular", Menlo, monospace; letter-spacing: .1em; }
  .login-card h1 { margin: 0; font-size: 32px; }
  .login-card > p { margin: 10px 0 26px; color: var(--muted); font-size: 13.5px; }
  .login-card .field { margin-bottom: 16px; }
  .login-card .button { width: 100%; min-height: 52px; margin-top: 4px; }
  .form-error { min-height: 18px; margin: 8px 0 0; color: var(--danger); font-size: 12px; }
  .login-foot { display: flex; justify-content: space-between; gap: 14px; margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--dim); font-size: 10px; }
  @media (max-width: 760px) {
    .topbar { padding-inline: 16px; }
    .brand small { display: none; }
    .shell { width: calc(100% - 32px); padding-top: 32px; }
    .hero { display: block; }
    .hero-status { justify-content: flex-start; margin-top: 20px; }
    .form-grid, .sliders { grid-template-columns: 1fr; }
    .panel-head, .panel-body { padding-inline: 18px; }
    .savebar { bottom: 10px; padding-left: 12px; }
    .login-card { padding: 26px 22px; border-radius: 26px; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
  }
`;

function themeBootScript() {
  return `<script>
    try {
      document.documentElement.dataset.theme =
        localStorage.getItem("profile-card-admin-theme") || "dark";
    } catch {}
  </script>`;
}

function themeToggleButton() {
  return `<button class="icon-button" id="themeButton" type="button" aria-label="切换管理后台主题">
    <svg class="moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 15.2A8.4 8.4 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
    <svg class="sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
  </button>`;
}

export function renderAdminLoginPage({ origin }) {
  return `<!doctype html>
<html lang="zh-CN" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow">
  <title>管理员登录 · Profile Card Studio</title>
  ${themeBootScript()}
  <style>${BASE_STYLE}</style>
</head>
<body>
  <main class="login-shell">
    <section class="login-card">
      <div class="login-mark">PC</div>
      <div class="eyebrow">PRIVATE CONTROL ROOM</div>
      <h1>进入管理后台</h1>
      <p>管理默认用户、公开 API 模式、卡片主题和 GitHub 数据授权。这里只接受管理员密钥。</p>
      <form id="loginForm">
        <label class="field">
          <span>管理员密钥</span>
          <input class="control" id="secretInput" name="secret" type="password" autocomplete="current-password" placeholder="输入 ADMIN_SECRET" required autofocus>
        </label>
        <button class="button button-primary" id="loginButton" type="submit"><span>验证并进入</span></button>
        <p class="form-error" id="formError" role="alert"></p>
      </form>
      <div class="login-foot">
        <a href="/">← 返回 Studio</a>
        <span class="mono">${escapeHtml(new URL(origin).host)}</span>
      </div>
    </section>
  </main>
  <div class="toast" id="toast" role="status" aria-live="polite"><span id="toastText"></span></div>
  <script>
    const form = document.getElementById("loginForm");
    const input = document.getElementById("secretInput");
    const button = document.getElementById("loginButton");
    const label = button.querySelector("span");
    const error = document.getElementById("formError");
    document.getElementById("themeButton")?.addEventListener("click", () => {});

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";
      button.disabled = true;
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
      } catch (cause) {
        error.textContent = cause instanceof Error ? cause.message : "登录失败。";
        input.select();
      } finally {
        button.disabled = false;
        label.textContent = "验证并进入";
      }
    });
  </script>
</body>
</html>`;
}

export function renderAdminDashboardPage({ origin, oauthMessage = "" }) {
  return `<!doctype html>
<html lang="zh-CN" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow">
  <title>实例管理 · Profile Card Studio</title>
  ${themeBootScript()}
  <style>${BASE_STYLE}</style>
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark">PC</div>
      <div>
        <strong>Profile Card Admin</strong>
        <small>Instance control · private by design</small>
      </div>
    </div>
    <div class="top-actions">
      <a class="ghost-button" href="/" target="_blank" rel="noreferrer">打开 Studio ↗</a>
      ${themeToggleButton()}
      <button class="icon-button" id="logoutButton" type="button" aria-label="退出管理后台">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3M14 8l4 4-4 4M18 12H9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  </header>

  <main class="shell">
    <section class="hero">
      <div>
        <div class="eyebrow">SINGLE-INSTANCE CONTROL</div>
        <h1>让这张卡片，按你的规则运行。</h1>
        <p>公开 API 与自用模式共用同一套卡片引擎。敏感凭据只会加密保存在服务器数据卷里，不会返回浏览器。</p>
      </div>
      <div class="hero-status">
        <span class="status-chip" id="modeChip"><i></i><span>读取配置</span></span>
        <span class="status-chip" id="tokenChip"><i></i><span>检查数据授权</span></span>
        <span class="status-chip" id="storageChip"><i></i><span>检查持久化</span></span>
      </div>
    </section>

    <form class="layout" id="configForm">
      <section class="panel">
        <div class="panel-head">
          <div><h2>实例与访问</h2><p>决定谁可以使用 API，以及 Studio 默认展示哪个主页。</p></div>
          <span class="panel-number">01 / INSTANCE</span>
        </div>
        <div class="panel-body form-grid">
          <div class="field wide">
            <span>API 模式</span>
            <div class="segmented">
              <label><input type="radio" name="mode" value="public"><span>公开 API</span></label>
              <label><input type="radio" name="mode" value="private"><span>自用模式</span></label>
            </div>
            <div class="mode-note"><i></i><span>公开模式允许任意公开 GitHub 用户；自用模式只放行下方允许列表中的用户。</span></div>
          </div>
          <label class="field">
            <span>默认 GitHub 用户</span>
            <input class="control" id="defaultUsername" name="defaultUsername" placeholder="DearLicy" autocomplete="off" spellcheck="false">
          </label>
          <label class="field">
            <span>允许列表</span>
            <input class="control" id="allowedUsers" name="allowedUsers" placeholder="DearLicy, octocat" autocomplete="off" spellcheck="false">
            <small>逗号或空格分隔；自用模式生效，最多 50 个。</small>
          </label>
          <label class="field wide">
            <span>开源仓库地址</span>
            <input class="control" id="repoUrl" name="repoUrl" type="url" placeholder="https://github.com/DearLicy/dearlicy-profile-card">
            <small>Studio 右上角的 GitHub 图标和“部署自己的卡片”按钮会指向这里。</small>
          </label>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div><h2>默认卡片风格</h2><p>这些值会作为所有新请求的起点，用户仍可通过 URL 参数覆盖。</p></div>
          <span class="panel-number">02 / APPEARANCE</span>
        </div>
        <div class="panel-body form-grid">
          <label class="field">
            <span>主题与布局</span>
            <select class="control" id="theme" name="theme">
              <option value="midnight">Midnight · 轨道</option>
              <option value="ivory">Ivory · 画框</option>
              <option value="ocean">Ocean · 终端</option>
              <option value="ember">Ember · 暖框</option>
              <option value="graphite">Graphite · 极简</option>
            </select>
          </label>
          <label class="field">
            <span>强调色</span>
            <input class="control" id="accent" name="accent" type="color" value="#CBB9FF">
            <small>留空或使用主题默认色时更协调。</small>
          </label>
          <label class="field">
            <span>左上角标识</span>
            <input class="control" id="mark" name="mark" maxlength="24" placeholder="例如 DEARLICY">
          </label>
          <label class="field">
            <span>状态徽标</span>
            <input class="control" id="badge" name="badge" maxlength="64" placeholder="例如 CURRENTLY BUILDING · TOOLING">
          </label>
          <label class="field">
            <span>标题第一行</span>
            <input class="control" id="headlineOne" name="headlineOne" maxlength="42" placeholder="留空使用用户默认文案">
          </label>
          <label class="field">
            <span>标题第二行</span>
            <input class="control" id="headlineTwo" name="headlineTwo" maxlength="48" placeholder="留空使用用户默认文案">
          </label>
          <label class="field wide">
            <span>简介</span>
            <textarea class="control" id="intro" name="intro" maxlength="120" placeholder="留空使用用户默认文案"></textarea>
          </label>
          <label class="field">
            <span>页脚备注</span>
            <input class="control" id="footerNote" name="footerNote" maxlength="64" placeholder="BUILD WITH CARE.">
          </label>
          <label class="field">
            <span>自定义头像 URL</span>
            <input class="control" id="avatarUrl" name="avatarUrl" type="url" placeholder="https://…（留空使用 GitHub 头像）">
          </label>
          <label class="field wide">
            <span>背景图片 URL</span>
            <input class="control" id="backgroundUrl" name="backgroundUrl" type="url" placeholder="https://…（HTTPS 图片，直接嵌入 SVG）">
          </label>
          <div class="field wide">
            <span>背景四角透明度</span>
            <div class="sliders">
              <div class="slider-row"><label for="bgTL">左上</label><input id="bgTL" type="range" min="0" max="100" step="1"><output id="bgTLValue"></output></div>
              <div class="slider-row"><label for="bgTR">右上</label><input id="bgTR" type="range" min="0" max="100" step="1"><output id="bgTRValue"></output></div>
              <div class="slider-row"><label for="bgBR">右下</label><input id="bgBR" type="range" min="0" max="100" step="1"><output id="bgBRValue"></output></div>
              <div class="slider-row"><label for="bgBL">左下</label><input id="bgBL" type="range" min="0" max="100" step="1"><output id="bgBLValue"></output></div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div><h2>GitHub 数据授权</h2><p>匿名 REST 每小时只有 60 次请求；配置 Token 或 OAuth 后使用 GraphQL 并提高限额。</p></div>
          <span class="panel-number">03 / DATA</span>
        </div>
        <div class="panel-body form-grid">
          <div class="field wide">
            <span>当前数据源</span>
            <div class="secret-state"><span id="tokenState">正在读取…</span><a class="button button-secondary button-small" id="oauthConnect" href="/admin/oauth/github">连接 GitHub OAuth</a></div>
          </div>
          <label class="field">
            <span>只读 Personal Access Token</span>
            <input class="control" id="githubToken" type="password" autocomplete="new-password" placeholder="留空则保持现有 Token">
            <small>支持 fine-grained token 或 GitHub App token，不需要任何私库权限。</small>
          </label>
          <div class="field">
            <span>Token 操作</span>
            <div class="inline-actions">
              <label><input type="radio" name="githubTokenAction" value="keep" checked> 保持</label>
              <label><input type="radio" name="githubTokenAction" value="clear"> 清除</label>
            </div>
            <small>填写上方输入框后保存会自动替换现有 Token。</small>
          </div>
          <label class="field">
            <span>GitHub OAuth Client ID</span>
            <input class="control" id="oauthClientId" name="oauthClientId" placeholder="Iv1.…" autocomplete="off">
          </label>
          <label class="field">
            <span>GitHub OAuth Client Secret</span>
            <input class="control" id="oauthClientSecret" type="password" autocomplete="new-password" placeholder="留空则保持现有 Secret">
            <small>回调地址：${escapeHtml(origin)}/admin/oauth/github/callback</small>
          </label>
          <div class="field wide">
            <span>OAuth 状态</span>
            <div class="secret-state"><span id="oauthState">正在读取…</span><label><input id="clearOAuthToken" type="checkbox"> 断开 OAuth Token</label></div>
          </div>
        </div>
      </section>

      <div class="savebar">
        <span id="saveNote">修改后点击保存，所有接口会立即使用新配置。</span>
        <button class="button button-primary" id="saveButton" type="submit"><span>保存配置</span></button>
      </div>
    </form>
  </main>
  <div class="toast" id="toast" role="status" aria-live="polite"><span id="toastText"></span></div>

  <script>
    const origin = ${json(origin)};
    const oauthMessage = ${json(oauthMessage)};
    const state = { config: null, dirty: false };
    const elements = {
      form: document.getElementById("configForm"),
      modeChip: document.getElementById("modeChip"),
      tokenChip: document.getElementById("tokenChip"),
      storageChip: document.getElementById("storageChip"),
      tokenState: document.getElementById("tokenState"),
      oauthState: document.getElementById("oauthState"),
      oauthConnect: document.getElementById("oauthConnect"),
      saveButton: document.getElementById("saveButton"),
      saveNote: document.getElementById("saveNote"),
      toast: document.getElementById("toast"),
      toastText: document.getElementById("toastText"),
      clearOAuthToken: document.getElementById("clearOAuthToken"),
    };
    let toastTimer;

    function toast(message) {
      clearTimeout(toastTimer);
      elements.toastText.textContent = message;
      elements.toast.classList.add("visible");
      toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 2300);
    }
    function icon(chip, stateName, text) {
      chip.className = "status-chip " + stateName;
      chip.querySelector("span").textContent = text;
    }
    function setField(id, value) {
      const node = document.getElementById(id);
      if (node) node.value = value ?? "";
    }
    function setSlider(key, value) {
      const input = document.getElementById("bg" + key.toUpperCase());
      const output = document.getElementById("bg" + key.toUpperCase() + "Value");
      const percent = Math.round(Number(value) * 100);
      input.value = String(percent);
      output.textContent = percent + "%";
    }
    function readSlider(key) {
      return Number(document.getElementById("bg" + key.toUpperCase()).value) / 100;
    }
    function cardConfig() {
      const accent = document.getElementById("accent").value;
      return {
        theme: document.getElementById("theme").value,
        accent: accent.toUpperCase() === "#CBB9FF" ? "" : accent,
        mark: document.getElementById("mark").value,
        badge: document.getElementById("badge").value,
        headlineOne: document.getElementById("headlineOne").value,
        headlineTwo: document.getElementById("headlineTwo").value,
        intro: document.getElementById("intro").value,
        footerNote: document.getElementById("footerNote").value,
        avatarUrl: document.getElementById("avatarUrl").value,
        backgroundUrl: document.getElementById("backgroundUrl").value,
        backgroundCorners: {
          tl: readSlider("tl"), tr: readSlider("tr"), br: readSlider("br"), bl: readSlider("bl")
        }
      };
    }
    function hydrate(payload) {
      state.config = payload.site;
      const site = payload.site;
      const card = site.card;
      const modeInput = document.querySelector('input[name="mode"][value="' + site.mode + '"]');
      if (modeInput) modeInput.checked = true;
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
      setField("oauthClientId", site.oauthClientId);
      setSlider("tl", card.backgroundCorners.tl);
      setSlider("tr", card.backgroundCorners.tr);
      setSlider("br", card.backgroundCorners.br);
      setSlider("bl", card.backgroundCorners.bl);
      icon(elements.modeChip, "is-ok", site.mode === "public" ? "PUBLIC API" : "PRIVATE MODE");
      icon(elements.tokenChip, payload.github.configured ? "is-ok" : "is-warn", payload.github.configured ? "GITHUB TOKEN READY" : "ANONYMOUS REST");
      icon(elements.storageChip, payload.admin.store?.persisted ? "is-ok" : "is-warn", payload.admin.store?.persisted ? "CONFIG PERSISTED" : "USING DEFAULTS");
      elements.tokenState.textContent = payload.github.configured
        ? "已配置 · 数据源：" + payload.github.source
        : "未配置 Token · 当前使用匿名公开 REST（60 次/小时）";
      const oauthReady = payload.admin.oauthClientConfigured;
      elements.oauthState.textContent = payload.github.oauthConnected
        ? "已连接 OAuth" + (site.oauthLogin ? " · @" + site.oauthLogin : "")
        : oauthReady ? "OAuth 应用已配置，尚未连接" : "尚未配置 OAuth 应用";
      elements.oauthConnect.style.display = oauthReady ? "" : "none";
      elements.clearOAuthToken.disabled = !payload.github.oauthConnected;
      state.dirty = false;
      elements.saveNote.textContent = site.updatedAt
        ? "上次保存：" + new Date(site.updatedAt).toLocaleString("zh-CN")
        : "当前使用默认配置，保存后写入持久化数据卷。";
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
      const token = document.getElementById("githubToken").value.trim();
      const oauthSecret = document.getElementById("oauthClientSecret").value.trim();
      return {
        mode: document.querySelector('input[name="mode"]:checked')?.value || "public",
        defaultUsername: document.getElementById("defaultUsername").value,
        allowedUsers: document.getElementById("allowedUsers").value,
        repoUrl: document.getElementById("repoUrl").value,
        oauthClientId: document.getElementById("oauthClientId").value,
        card: cardConfig(),
        githubTokenAction: token ? "set" : document.querySelector('input[name="githubTokenAction"]:checked')?.value || "keep",
        githubToken: token,
        oauthClientSecretAction: oauthSecret ? "set" : "keep",
        oauthClientSecret: oauthSecret,
        clearOAuthToken: elements.clearOAuthToken.checked
      };
    }
    async function save() {
      elements.saveButton.disabled = true;
      elements.saveButton.querySelector("span").textContent = "正在保存…";
      try {
        const response = await fetch("/admin/api/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(serialize())
        });
        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          location.replace("/admin/login");
          return;
        }
        if (!response.ok) throw new Error(payload.message || "保存失败。");
        document.getElementById("githubToken").value = "";
        document.getElementById("oauthClientSecret").value = "";
        elements.clearOAuthToken.checked = false;
        hydrate(payload);
        toast("配置已保存，卡片接口已更新");
      } catch (error) {
        toast(error instanceof Error ? error.message : "保存失败。");
      } finally {
        elements.saveButton.disabled = false;
        elements.saveButton.querySelector("span").textContent = "保存配置";
      }
    }

    document.querySelectorAll('input[type="range"]').forEach((input) => {
      input.addEventListener("input", () => {
        document.getElementById(input.id + "Value").textContent = input.value + "%";
      });
    });
    document.getElementById("themeButton")?.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("profile-card-admin-theme", next); } catch {}
    });
    document.getElementById("logoutButton").addEventListener("click", async () => {
      await fetch("/admin/api/logout", { method: "POST" }).catch(() => {});
      location.replace("/admin/login");
    });
    elements.form.addEventListener("submit", (event) => { event.preventDefault(); save(); });
    elements.form.addEventListener("input", () => {
      state.dirty = true;
      elements.saveNote.textContent = "有未保存的修改";
    });
    if (oauthMessage === "connected") {
      setTimeout(() => toast("GitHub OAuth 已连接，数据额度已更新"), 200);
    }
    load();
  </script>
</body>
</html>`;
}
