import { ADMIN_DASHBOARD_CSS, ADMIN_LOGIN_CSS } from "./admin-ui.js";
import { CARD_THEMES } from "./config.js";
import { IMAGE_CLIENT_SCRIPT } from "./image-client.js";
import {
  BRAND_MARK,
  PRINT_THEME_CSS,
  THEME_TOGGLE,
} from "./design-system.js";
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

function themeAccent(themeKey) {
  return String(
    CARD_THEMES[themeKey]?.colors?.accent ||
      CARD_THEMES.midnight.colors.accent,
  ).toUpperCase();
}

export function renderAdminLoginPage({ origin }) {
  return `<!doctype html>
<html lang="zh-CN" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow">
  <meta name="color-scheme" content="dark light">
  <meta name="theme-color" content="#11100e">
  <title>管理员登录 · 主页卡片</title>
  ${FAVICON_LINK}
  ${themeBootScript("profile-card-admin-theme")}
  ${COMPONENT_THEME_LINKS}
  ${SHOELACE_IMPORT_MAP}
  <style>${PRINT_THEME_CSS}${ADMIN_LOGIN_CSS}</style>
</head>
<body>
  <main class="login-page">
    <div class="login-topbar">
      <div class="brand">
        ${BRAND_MARK}
        <div class="brand-copy"><strong>主页卡片</strong><span>实例管理</span></div>
      </div>
      ${THEME_TOGGLE}
    </div>
    <div class="login-shell">
      <section class="login-card">
        <sl-badge pill>仅管理员</sl-badge>
        <h1>进入实例管理</h1>
        <p>在这里设置访问模式、默认卡片样式和 GitHub 数据连接。登录凭据只保存在服务器端。</p>
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
      document.documentElement.classList.toggle("sl-theme-dark", !light);
      document.documentElement.classList.toggle("sl-theme-light", light);
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", light ? "#f1eadc" : "#11100e");
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
      if (event.key === "Enter" && !event.isComposing) login();
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
  <meta name="theme-color" content="#11100e">
  <title>实例管理 · 主页卡片</title>
  ${FAVICON_LINK}
  ${themeBootScript("profile-card-admin-theme")}
  ${COMPONENT_THEME_LINKS}
  ${SHOELACE_IMPORT_MAP}
  <style>${PRINT_THEME_CSS}${ADMIN_DASHBOARD_CSS}</style>
</head>
<body>
  <div class="admin-shell">
    <aside class="sidebar admin-rail">
      <div class="brand">
        ${BRAND_MARK}
        <div class="brand-copy"><strong>主页卡片</strong><span>实例管理</span></div>
      </div>
      <nav class="side-nav" aria-label="管理导航">
        <sl-button class="nav-item is-active" data-section="overview"><span slot="prefix">${ICONS.dashboard}</span><span>运行总览</span></sl-button>
        <sl-button class="nav-item" data-section="access"><span slot="prefix">${ICONS.key}</span><span>访问与实例</span></sl-button>
        <sl-button class="nav-item" data-section="appearance"><span slot="prefix">${ICONS.palette}</span><span>卡片外观</span></sl-button>
        <sl-button class="nav-item" data-section="images"><span slot="prefix">${ICONS.image}</span><span>图片库</span></sl-button>
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
          ${THEME_TOGGLE}
          <sl-button id="logoutButton" aria-label="退出管理后台"><span slot="prefix">${ICONS.logout}</span><span>退出</span></sl-button>
        </div>
      </header>

      <main class="admin-content">
        <div id="formArea">
          <section class="dashboard-section is-active" data-section="overview">
            <div class="overview-hero">
              <div>
                <sl-badge id="healthBadge" pill>正在检查</sl-badge>
                <h2>你的卡片服务，<br><span class="overview-accent">已经准备就绪。</span></h2>
                <p id="overviewDescription">正在读取实例配置与数据连接状态。保存后，前台和 API 会立即使用新设置。</p>
                <div class="hero-actions">
                  <sl-button id="openPreviewButton" variant="primary"><span slot="prefix">${ICONS.external}</span><span>打开主页卡片</span></sl-button>
                  <sl-button id="refreshDashboardButton"><span slot="prefix">${ICONS.refresh}</span><span>刷新状态</span></sl-button>
                </div>
              </div>
              <div class="hero-card-preview">
                <span>默认 GitHub 主页</span>
                <strong id="heroUsername">@DearLicy</strong>
                <small id="heroCardTheme">${escapeHtml(CARD_THEMES.midnight.labelZh)}主题 · ${escapeHtml(CARD_THEMES.midnight.noteZh)}</small>
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
                  <div class="mode-note"><i></i><span id="modeHelp">公开模式允许任何公开 GitHub 主页生成卡片。</span></div>
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
            <div class="section-intro"><div><h2>卡片外观</h2><p>设置新请求的默认主题、文案和图片库背景。用户仍可通过前台继续调整。</p></div><sl-badge pill>默认样式</sl-badge></div>
            <section class="panel form-panel">
              <div class="panel-head"><div><h3>主题与强调色</h3><p>这些值会成为前台编辑器的初始状态。</p></div></div>
              <div class="panel-body form-grid">
                <sl-select id="theme" label="主题与构图" value="midnight">${themeOptions("midnight")}</sl-select>
                <div>
                  <span class="field-caption">强调色</span>
                  <div class="accent-row">
                    <sl-color-picker id="accent" label="默认强调色" format="hex" value="${themeAccent("midnight")}" size="small"></sl-color-picker>
                    <div class="accent-copy"><strong>默认强调色</strong><small id="accentDefaultNote">与主题默认色一致时保存为空值</small></div>
                  </div>
                </div>
                ${field({ id: "mark", label: "左上角标识", maxlength: 24, placeholder: "留空自动使用 GitHub 用户名" })}
                ${field({ id: "badge", label: "状态徽标", maxlength: 64, placeholder: "例如：正在开发 · ZIBLL_CHILD" })}
                ${field({ id: "headlineOne", label: "标题第一行", maxlength: 42, placeholder: "留空使用默认文案", wide: true })}
                ${field({ id: "headlineTwo", label: "标题第二行", maxlength: 48, placeholder: "留空使用默认文案", wide: true })}
                ${field({ id: "intro", label: "简介", maxlength: 120, placeholder: "留空使用默认文案", textarea: true, wide: true })}
                ${field({ id: "footerNote", label: "页脚备注", maxlength: 64, placeholder: "例如：保持好奇，持续交付。" })}
                <div class="wide">
                  <sl-select id="backgroundImage" label="默认图片库背景" placeholder="不使用图片库背景" help-text="只列出已公开图片；用户仍可在前台重新选择。" clearable>
                    <sl-option value="">不使用图片库背景</sl-option>
                  </sl-select>
                </div>
                <div class="wide">
                  <span class="field-caption">背景四角透明度</span>
                  <div class="range-grid">
                    <div class="range-row"><span class="range-name" id="bgTLName">左上</span><span class="range-value" id="bgTLValue"></span><sl-range id="bgTL" aria-labelledby="bgTLName" min="0" max="100" step="1"></sl-range></div>
                    <div class="range-row"><span class="range-name" id="bgTRName">右上</span><span class="range-value" id="bgTRValue"></span><sl-range id="bgTR" aria-labelledby="bgTRName" min="0" max="100" step="1"></sl-range></div>
                    <div class="range-row"><span class="range-name" id="bgBLName">左下</span><span class="range-value" id="bgBLValue"></span><sl-range id="bgBL" aria-labelledby="bgBLName" min="0" max="100" step="1"></sl-range></div>
                    <div class="range-row"><span class="range-name" id="bgBRName">右下</span><span class="range-value" id="bgBRValue"></span><sl-range id="bgBR" aria-labelledby="bgBRName" min="0" max="100" step="1"></sl-range></div>
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
                <sl-switch id="clearToken" class="token-switch">移除已加密保存的令牌</sl-switch>
                <sl-alert id="githubTestAlert" class="github-alert" hidden></sl-alert>
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

          <section class="dashboard-section" data-section="images">
            <div class="section-intro"><div><h2>图片库</h2><p>统一管理实例里的背景图片。所有图片都由浏览器先压缩为 WebP，服务端只保存不超过 1 MB 的压缩结果。</p></div><sl-badge id="imageCountBadge" pill>读取中</sl-badge></div>
            <div class="stats-grid image-stats">
              <article class="stat-card"><span>图片总数</span><strong id="imageStatTotal">—</strong><small>最多 500 张</small></article>
              <article class="stat-card"><span>已公开</span><strong id="imageStatPublished">—</strong><small>游客可在前台选择</small></article>
              <article class="stat-card"><span>待审核</span><strong id="imageStatPending">—</strong><small>游客上传后默认不公开</small></article>
              <article class="stat-card"><span>占用空间</span><strong id="imageStatBytes">—</strong><small>不含元数据与索引</small></article>
            </div>
            <section class="panel form-panel">
              <div class="panel-head"><div><h3>游客上传</h3><p>关闭后只有管理员能上传；已公开的图片仍可被游客选择。</p></div><sl-switch id="allowPublicUploads">允许非管理员上传</sl-switch></div>
              <div class="panel-body">
                <div class="info-note"><i></i><span>游客上传会先进入待审核状态，不会直接出现在公开图片库。开启或关闭后请点击底部“保存配置”生效。</span></div>
              </div>
            </section>
            <section class="panel form-panel">
              <div class="panel-head"><div><h3>图片管理</h3><p>管理员上传后直接公开；可以随时下线或删除。</p></div><sl-button id="adminUploadImage" variant="primary" size="small"><span slot="prefix">${ICONS.upload}</span><span>上传图片</span></sl-button></div>
              <div class="panel-body">
                <div class="background-job admin-upload-job" id="adminUploadJob" hidden>
                  <div class="background-status-row">
                    <sl-badge id="adminUploadStatus" pill>准备上传</sl-badge>
                    <span class="background-percent" id="adminUploadPercent">0%</span>
                  </div>
                  <sl-progress-bar id="adminUploadProgress" value="0" label="管理员图片上传进度"></sl-progress-bar>
                  <small class="background-help" id="adminUploadHelp">浏览器会先压缩到 1 MB 以内。</small>
                </div>
                <div class="admin-image-grid" id="adminImageGrid" aria-live="polite">
                  <sl-skeleton class="admin-image-skeleton"></sl-skeleton>
                  <sl-skeleton class="admin-image-skeleton"></sl-skeleton>
                  <sl-skeleton class="admin-image-skeleton"></sl-skeleton>
                </div>
                <p class="admin-image-empty" id="adminImageEmpty" hidden>图片库还是空的。上传第一张背景图片，或等待游客提交。</p>
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
  <sl-dialog id="imageLightboxDialog" label="图片预览" class="image-lightbox-dialog">
    <div class="image-lightbox-frame"><img id="imageLightboxImage" alt=""></div>
  </sl-dialog>
  <sl-dialog id="imageDeleteDialog" label="删除这张图片？">
    <p class="delete-dialog-copy" id="imageDeleteCopy">删除后，已选择该背景的卡片将不再显示图片，且无法恢复。</p>
    <sl-button slot="footer" id="cancelImageDelete">取消</sl-button>
    <sl-button slot="footer" id="confirmImageDelete" variant="danger">确认删除</sl-button>
  </sl-dialog>
  <div class="toast" id="toast" role="status" aria-live="polite"><span id="toastText"></span></div>

  <script type="module">
    ${SHOELACE_IMPORTS}
    ${IMAGE_CLIENT_SCRIPT}

    function syncComponentTheme() {
      const light = document.documentElement.dataset.theme === "light";
      document.documentElement.classList.toggle("sl-theme-dark", !light);
      document.documentElement.classList.toggle("sl-theme-light", light);
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", light ? "#f1eadc" : "#11100e");
    }
    syncComponentTheme();

    const origin = ${json(origin)};
    const themes = ${json(Object.fromEntries(Object.entries(CARD_THEMES).map(([key, theme]) => [key, {
      label: theme.labelZh || theme.label,
      note: theme.noteZh || theme.note,
      accent: theme.colors.accent,
    }])))};
    const state = { config: null, dirty: false, images: [], imageStats: null, pendingDelete: null, uploading: false };
    const titles = {
      overview: ["运行总览", "查看实例状态、数据连接与最近配置。"],
      access: ["访问与实例", "控制公开范围、默认用户和项目链接。"],
      appearance: ["卡片外观", "设置所有新请求的默认卡片样式。"],
      images: ["图片库", "上传、审核、公开或删除背景图片。"],
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
      backgroundImage: document.getElementById("backgroundImage"),
      allowPublicUploads: document.getElementById("allowPublicUploads"),
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
      imageCountBadge: document.getElementById("imageCountBadge"),
      imageStatTotal: document.getElementById("imageStatTotal"),
      imageStatPublished: document.getElementById("imageStatPublished"),
      imageStatPending: document.getElementById("imageStatPending"),
      imageStatBytes: document.getElementById("imageStatBytes"),
      adminImageGrid: document.getElementById("adminImageGrid"),
      adminImageEmpty: document.getElementById("adminImageEmpty"),
      adminUploadImage: document.getElementById("adminUploadImage"),
      adminUploadJob: document.getElementById("adminUploadJob"),
      adminUploadStatus: document.getElementById("adminUploadStatus"),
      adminUploadProgress: document.getElementById("adminUploadProgress"),
      adminUploadPercent: document.getElementById("adminUploadPercent"),
      adminUploadHelp: document.getElementById("adminUploadHelp"),
      imageDeleteDialog: document.getElementById("imageDeleteDialog"),
      imageDeleteCopy: document.getElementById("imageDeleteCopy"),
      cancelImageDelete: document.getElementById("cancelImageDelete"),
      confirmImageDelete: document.getElementById("confirmImageDelete"),
      imageLightboxDialog: document.getElementById("imageLightboxDialog"),
      imageLightboxImage: document.getElementById("imageLightboxImage"),
    };
    const corners = ["tl", "tr", "bl", "br"];
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
    function imageDate(value) {
      if (!value) return "未知时间";
      try { return new Date(value).toLocaleString("zh-CN"); } catch { return "未知时间"; }
    }
    function setAdminUploadStatus(label, variant, value, help) {
      elements.adminUploadStatus.textContent = label;
      elements.adminUploadStatus.variant = variant;
      elements.adminUploadProgress.value = value;
      elements.adminUploadPercent.textContent = value + "%";
      elements.adminUploadJob.classList.toggle("is-complete", value === 100 && variant === "success");
      elements.adminUploadJob.classList.toggle("is-error", variant === "danger");
      if (help) elements.adminUploadHelp.textContent = help;
    }
    function refreshDefaultImageOptions() {
      const selected = elements.backgroundImage.value || state.config?.card?.backgroundImage || "";
      elements.backgroundImage.replaceChildren();
      const none = document.createElement("sl-option");
      none.value = "";
      none.textContent = "不使用图片库背景";
      elements.backgroundImage.append(none);
      const published = state.images.filter((image) => image.published);
      for (const image of published) {
        const option = document.createElement("sl-option");
        option.value = image.id;
        option.textContent = image.label + " · " + image.width + "×" + image.height;
        elements.backgroundImage.append(option);
      }
      elements.backgroundImage.value = published.some((image) => image.id === selected) ? selected : "";
    }
    function renderAdminImages() {
      elements.adminImageGrid.replaceChildren();
      const images = state.images;
      const stats = state.imageStats || { total: images.length, published: 0, pending: 0, bytes: 0 };
      elements.imageStatTotal.textContent = String(stats.total);
      elements.imageStatPublished.textContent = String(stats.published);
      elements.imageStatPending.textContent = String(stats.pending);
      elements.imageStatBytes.textContent = formatImageBytes(stats.bytes);
      elements.imageCountBadge.textContent = stats.total
        ? stats.published + " 张已公开 · " + stats.pending + " 张待审核"
        : "等待第一张图片";
      elements.imageCountBadge.variant = stats.pending ? "warning" : "neutral";
      elements.adminImageEmpty.hidden = images.length > 0;
      for (const image of images) {
        const card = document.createElement("article");
        card.className = "admin-image-card";
        const thumb = document.createElement("div");
        thumb.className = "admin-image-thumb";
        const previewButton = document.createElement("sl-button");
        previewButton.className = "admin-image-preview";
        previewButton.dataset.imageId = image.id;
        previewButton.setAttribute("aria-label", "预览 " + image.label);
        const preview = document.createElement("img");
        preview.src = image.url;
        preview.alt = image.label;
        preview.loading = "lazy";
        preview.decoding = "async";
        previewButton.append(preview);
        const badge = document.createElement("sl-badge");
        badge.setAttribute("pill", "");
        badge.setAttribute("variant", image.published ? "success" : "warning");
        badge.textContent = image.published ? "已公开" : "待审核";
        thumb.append(previewButton, badge);
        const body = document.createElement("div");
        body.className = "admin-image-body";
        const title = document.createElement("strong");
        title.textContent = image.label;
        const meta = document.createElement("small");
        meta.textContent = image.width + "×" + image.height + " · " + formatImageBytes(image.bytes) + " · " + (image.source === "admin" ? "管理员" : "游客") + " · " + imageDate(image.createdAt);
        body.append(title, meta);
        const actions = document.createElement("div");
        actions.className = "admin-image-actions";
        const toggle = document.createElement("sl-button");
        toggle.size = "small";
        toggle.textContent = image.published ? "下线" : "公开";
        toggle.addEventListener("click", () => toggleImage(image, toggle));
        const remove = document.createElement("sl-button");
        remove.size = "small";
        remove.setAttribute("variant", "danger");
        remove.textContent = "删除";
        remove.addEventListener("click", () => askDeleteImage(image));
        actions.append(toggle, remove);
        card.append(thumb, body, actions);
        elements.adminImageGrid.append(card);
      }
      refreshDefaultImageOptions();
    }
    function showImageLightbox(image) {
      elements.imageLightboxImage.src = image.url;
      elements.imageLightboxImage.alt = image.label;
      elements.imageLightboxDialog.setAttribute("label", image.label);
      elements.imageLightboxDialog.show();
    }
    async function loadImages() {
      try {
        const response = await fetch("/admin/api/images", { cache: "no-store" });
        if (response.status === 401) {
          location.replace("/admin/login");
          return;
        }
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || "图片库读取失败。");
        state.images = Array.isArray(payload.images) ? payload.images : [];
        state.imageStats = payload.stats || null;
        renderAdminImages();
      } catch (error) {
        toast(error instanceof Error ? error.message : "图片库读取失败。");
      }
    }
    async function toggleImage(image, button) {
      button.disabled = true;
      button.loading = true;
      try {
        const response = await fetch("/admin/api/images/" + image.id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: !image.published }),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          location.replace("/admin/login");
          return;
        }
        if (!response.ok) throw new Error(payload.message || "更新图片状态失败。");
        toast(image.published ? "图片已下线" : "图片已公开，游客现在可以选择");
        await loadImages();
      } catch (error) {
        toast(error instanceof Error ? error.message : "更新图片状态失败。");
        button.disabled = false;
        button.loading = false;
      }
    }
    function askDeleteImage(image) {
      state.pendingDelete = image;
      elements.imageDeleteCopy.textContent = "删除“" + image.label + "”后，已选择该背景的卡片将不再显示图片，且无法恢复。";
      elements.imageDeleteDialog.show();
    }
    async function deletePendingImage() {
      const image = state.pendingDelete;
      if (!image) return;
      elements.confirmImageDelete.disabled = true;
      elements.confirmImageDelete.loading = true;
      try {
        const response = await fetch("/admin/api/images/" + image.id, { method: "DELETE" });
        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          location.replace("/admin/login");
          return;
        }
        if (!response.ok) throw new Error(payload.message || "删除图片失败。");
        elements.imageDeleteDialog.hide();
        state.pendingDelete = null;
        toast("图片已删除");
        await loadImages();
      } catch (error) {
        toast(error instanceof Error ? error.message : "删除图片失败。");
      } finally {
        elements.confirmImageDelete.disabled = false;
        elements.confirmImageDelete.loading = false;
      }
    }
    async function uploadAdminImage() {
      if (state.uploading) return;
      const file = await chooseImageFile();
      if (!file) return;
      state.uploading = true;
      elements.adminUploadJob.hidden = false;
      elements.adminUploadImage.disabled = true;
      elements.adminUploadImage.loading = true;
      setAdminUploadStatus("读取图片", "neutral", 0, "正在由浏览器压缩，原图不会上传。");
      try {
        const compressed = await compressLibraryImage(file, {
          maxBytes: 980000,
          onProgress: (value, label) => setAdminUploadStatus(label, "neutral", value, "自动压缩到 1 MB 以内，再进行上传。"),
        });
        setAdminUploadStatus("上传压缩图", "neutral", 88, formatImageBytes(compressed.blob.size) + " WebP · 上传后立即公开。");
        await uploadLibraryImage(compressed.blob, { label: imageFileLabel(file), admin: true });
        setAdminUploadStatus("上传完成", "success", 100, "图片已加入图片库并公开给游客选择。");
        toast("图片已上传并公开");
        await loadImages();
      } catch (error) {
        setAdminUploadStatus("上传失败", "danger", 0, error instanceof Error ? error.message : "图片上传失败。");
        toast(error instanceof Error ? error.message : "图片上传失败。");
      } finally {
        state.uploading = false;
        elements.adminUploadImage.disabled = false;
        elements.adminUploadImage.loading = false;
      }
    }
    function activateSection(name) {
      document.querySelectorAll(".nav-item").forEach((button) => {
        const active = button.dataset.section === name;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-current", active ? "page" : "false");
      });
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
      const defaultAccent = String(themes[elements.theme.value]?.accent || "").toUpperCase();
      const backgroundImage = elements.backgroundImage.value || (state.images.length ? "" : state.config?.card?.backgroundImage || "");
      return {
        theme: elements.theme.value,
        accent: accent === defaultAccent ? "" : accent,
        mark: elements.mark.value,
        badge: elements.badge.value,
        headlineOne: elements.headlineOne.value,
        headlineTwo: elements.headlineTwo.value,
        intro: elements.intro.value,
        footerNote: elements.footerNote.value,
        backgroundImage,
        backgroundCorners: { tl: readSlider("tl"), tr: readSlider("tr"), bl: readSlider("bl"), br: readSlider("br") },
      };
    }
    function hydrate(payload) {
      state.config = payload.site;
      const site = payload.site;
      const card = site.card;
      const theme = themes[card.theme] || themes.midnight;
      elements.modeGroup.value = site.mode;
      setField("defaultUsername", site.defaultUsername);
      setField("allowedUsers", site.allowedUsers.join(", "));
      setField("repoUrl", site.repoUrl);
      setField("theme", card.theme);
      setField("accent", card.accent || theme.accent);
      document.getElementById("accentDefaultNote").textContent =
        "当前主题默认 " + theme.accent.toUpperCase();
      setField("mark", card.mark);
      setField("badge", card.badge);
      setField("headlineOne", card.headlineOne);
      setField("headlineTwo", card.headlineTwo);
      setField("intro", card.intro);
      setField("footerNote", card.footerNote);
      setField("backgroundImage", card.backgroundImage);
      elements.allowPublicUploads.checked = Boolean(site.allowPublicUploads);
      setField("siteOrigin", origin);
      setField("adminOrigin", origin + "/admin");
      corners.forEach((key) => setSlider(key, card.backgroundCorners[key]));

      const dataLabel = payload.github.configured ? "已连接" : "匿名模式";
      const source = sourceLabel(payload.github.source);
      const persisted = Boolean(payload.admin.store?.persisted);
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
        await loadImages();
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
        allowPublicUploads: Boolean(elements.allowPublicUploads.checked),
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
    elements.adminUploadImage.addEventListener("click", uploadAdminImage);
    elements.cancelImageDelete.addEventListener("click", () => {
      state.pendingDelete = null;
      elements.imageDeleteDialog.hide();
    });
    elements.confirmImageDelete.addEventListener("click", deletePendingImage);
    elements.adminImageGrid.addEventListener("click", (event) => {
      const preview = event
        .composedPath()
        .find((node) => node?.classList?.contains("admin-image-preview"));
      if (!preview) return;
      const image = state.images.find((entry) => entry.id === preview.dataset.imageId);
      if (image) showImageLightbox(image);
    });
    elements.imageDeleteDialog.addEventListener("sl-after-hide", () => {
      if (!elements.confirmImageDelete.loading) state.pendingDelete = null;
    });
    elements.saveButton.addEventListener("click", save);
    elements.formArea.addEventListener("sl-input", markDirty);
    elements.formArea.addEventListener("sl-change", (event) => {
      markDirty();
      if (event.target === elements.theme) {
        const theme = themes[elements.theme.value] || themes.midnight;
        setField("accent", theme.accent);
        document.getElementById("accentDefaultNote").textContent =
          "当前主题默认 " + theme.accent.toUpperCase();
      }
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
