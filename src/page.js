import { CARD_THEMES, DEFAULT_CARD_CONFIG } from "./config.js";
import {
  BRAND_MARK,
  PRINT_THEME_CSS,
  THEME_TOGGLE,
} from "./design-system.js";
import { STUDIO_CSS } from "./studio-ui.js";
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

function themeArtwork(theme) {
  return {
    orbit:
      '<i class="art-ring"></i><i class="art-planet"></i><i class="art-axis"></i><i class="art-dot"></i>',
    editorial:
      '<i class="art-rule"></i><i class="art-copy art-copy-a"></i><i class="art-copy art-copy-b"></i><i class="art-copy art-copy-c"></i><i class="art-stamp"></i>',
    terminal:
      '<i class="art-terminal-bar"></i><i class="art-scan"></i><i class="art-prompt"></i><i class="art-code art-code-a"></i><i class="art-code art-code-b"></i>',
    poster:
      '<i class="art-sun"></i><i class="art-slash"></i><i class="art-marquee"></i><i class="art-poster-line"></i>',
    swiss:
      '<i class="art-grid"></i><i class="art-swiss-block"></i><i class="art-swiss-rule"></i><i class="art-swiss-number">05</i>',
  }[theme.layout] || "";
}

function themeCards(activeTheme) {
  return Object.entries(CARD_THEMES)
    .map(([key, theme]) => {
      const [a, b, c] = theme.swatches;
      const shortNote = String(theme.noteZh || theme.note).split("·").pop().trim();
      return `<sl-button class="theme-card${key === activeTheme ? " is-active" : ""}" data-theme-key="${key}" aria-pressed="${key === activeTheme ? "true" : "false"}">
        <span class="theme-art theme-art--${theme.layout}" style="--swatch-a:${a};--swatch-b:${b};--swatch-c:${c}">${themeArtwork(theme)}</span>
        <span class="theme-name"><strong>${escapeHtml(theme.labelZh || theme.label)}</strong><small>${escapeHtml(shortNote)}</small></span>
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
  <meta name="theme-color" content="#11100e">
  <meta name="description" content="把任意 GitHub 主页变成一张实时更新、可定制的动态 SVG 卡片。">
  <title>主页卡片 · 一张会呼吸的 GitHub 名片</title>
  ${FAVICON_LINK}
  ${themeBootScript("profile-card-theme")}
  ${COMPONENT_THEME_LINKS}
  ${SHOELACE_IMPORT_MAP}
  <style>${PRINT_THEME_CSS}${STUDIO_CSS}</style>
</head>
<body>
  <div class="app-mesh" aria-hidden="true">
    <i class="mesh-disc"></i>
    <i class="mesh-ring"></i>
    <i class="mesh-bar"></i>
    <i class="mesh-cross"></i>
  </div>

  <header class="topbar">
    <div class="brand topbar-brand">
      ${BRAND_MARK}
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
        <span slot="suffix" class="external-arrow">${ICONS.external}</span>
      </sl-button>
      ${THEME_TOGGLE}
    </div>
  </header>

  <main class="shell" id="appShell" data-view="landing">
    <section class="hero" id="landingView">
      <div class="hero-main">
        <h1>
          <span class="hero-line">让 GitHub 主页，</span>
          <span class="hero-line">变成一张<em>会呼吸的名片</em>。</span>
        </h1>
        <form class="search-form" id="searchForm" novalidate>
          <sl-input id="usernameInput" size="large" pill clearable label="GitHub 用户名或主页链接" value="${safeUsername}" placeholder="例如 DearLicy 或 github.com/DearLicy">
            <span slot="prefix">${ICONS.search}</span>
          </sl-input>
          <sl-button id="generateButton" type="submit" variant="primary" size="large">
            <span slot="prefix">${ICONS.arrow}</span>
            <span>生成我的卡片</span>
          </sl-button>
        </form>
        <p class="form-error" id="formError" role="alert"></p>
      </div>
    </section>

    <section class="result-view" id="resultView" hidden>
      <header class="result-head">
        <div class="result-heading">
          <span class="result-index" aria-hidden="true">01</span>
          <div>
            <span class="result-kicker">Generated proof</span>
            <h2 id="resultHeadline"><span class="at">@</span><span id="resultUsername">${safeUsername}</span> 的主页卡片</h2>
            <p>实时读取 GitHub 公开数据，调整外观、文案与背景后可直接嵌入 README。</p>
          </div>
        </div>
        <div class="result-actions">
          <sl-button id="changeUserButton">
            <span slot="prefix">${ICONS.search}</span>
            <span>换一个主页</span>
          </sl-button>
          <sl-button id="resultRefreshButton">
            <span slot="prefix">${ICONS.refresh}</span>
            <span>刷新数据</span>
          </sl-button>
        </div>
      </header>

      <section class="workspace" aria-label="卡片预览与编辑器">
        <div class="preview-column">
          <article class="preview-shell" aria-labelledby="previewTitle">
            <div class="preview-toolbar">
              <span class="preview-toolbar-left">
                <span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                <span id="previewTitle">Live proof</span>
              </span>
              <span class="dim">SVG · 920 × 1360</span>
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
            </div>
          </article>

          <div class="metrics-surface" aria-label="实时指标">
            <div class="metric"><span class="metric-label">Stars</span><strong class="metric-value is-loading" id="starValue"></strong><span class="metric-skeleton"><sl-skeleton></sl-skeleton></span></div>
            <div class="metric"><span class="metric-label">Rank / Score</span><strong class="metric-value is-loading" id="rankValue"></strong><span class="metric-skeleton"><sl-skeleton></sl-skeleton></span></div>
            <div class="metric"><span class="metric-label">Languages</span><strong class="metric-value is-loading" id="languageValue"></strong><span class="metric-skeleton"><sl-skeleton></sl-skeleton></span></div>
            <div class="metric"><span class="metric-label">Synced</span><strong class="metric-value is-loading" id="timeValue"></strong><span class="metric-skeleton"><sl-skeleton></sl-skeleton></span></div>
          </div>
        </div>

        <aside class="editor-column">
          <div class="workbench">
            <section class="editor-surface" aria-labelledby="editorTitle">
              <div class="editor-head">
                <div class="editor-title-row">
                  <div><h2 id="editorTitle">设计你的卡片</h2><p>修改会立即写入预览与 README 代码。</p></div>
                  <sl-badge pill id="configBadge">${escapeHtml(CARD_THEMES[initialTheme].labelZh)}主题</sl-badge>
                </div>
                <sl-tab-group class="editor-tabs" id="editorTabs">
                  <sl-tab slot="nav" panel="style" active>外观</sl-tab>
                  <sl-tab slot="nav" panel="copy">文案</sl-tab>
                  <sl-tab slot="nav" panel="canvas">背景</sl-tab>
                  <sl-tab-panel name="style">
                    <div class="editor-body">
                      <div class="group-label"><span>主题与头像构图</span><small>5 LAYOUTS</small></div>
                      <div class="theme-grid" id="themeGrid">${themeCards(initialTheme)}</div>
                      <div class="group-label"><span>强调色</span><small>THEME / CUSTOM</small></div>
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
                      <div class="background-job" id="backgroundJob">
                        <div class="background-status-row">
                          <sl-badge id="backgroundStatus" pill>等待背景图片</sl-badge>
                          <span class="background-percent" id="backgroundPercent">0%</span>
                        </div>
                        <sl-progress-bar id="backgroundProgress" value="0" label="背景图片处理进度"></sl-progress-bar>
                        <small class="background-help" id="backgroundHelp">浏览器抓取、压缩为 ≤18 KB WebP 并写入卡片链接，不上传服务器。</small>
                      </div>
                      <div class="group-label"><span>四角透明度</span><small>IMAGE MASK</small></div>
                      <div class="corner-map">
                        <div class="range-row"><span class="range-name" id="bgTLName">左上</span><span class="range-value" id="bgTLValue"></span><sl-range id="bgTL" aria-labelledby="bgTLName" min="0" max="100" step="1"></sl-range></div>
                        <div class="range-row"><span class="range-name" id="bgTRName">右上</span><span class="range-value" id="bgTRValue"></span><sl-range id="bgTR" aria-labelledby="bgTRName" min="0" max="100" step="1"></sl-range></div>
                        <div class="range-row"><span class="range-name" id="bgBLName">左下</span><span class="range-value" id="bgBLValue"></span><sl-range id="bgBL" aria-labelledby="bgBLName" min="0" max="100" step="1"></sl-range></div>
                        <div class="range-row"><span class="range-name" id="bgBRName">右下</span><span class="range-value" id="bgBRValue"></span><sl-range id="bgBR" aria-labelledby="bgBRName" min="0" max="100" step="1"></sl-range></div>
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
                <sl-button id="copyButton" variant="primary">
                  <span slot="prefix">${ICONS.copy}</span>
                  <span>复制嵌入代码</span>
                </sl-button>
              </div>
            </section>
          </div>
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
    </section>
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
      backgroundTimer: null,
      backgroundController: null,
      backgroundToken: 0,
      backgroundData: initialConfig.backgroundData || "",
      backgroundSource: initialConfig.backgroundUrl || "",
    };
    const elements = {
      appShell: document.getElementById("appShell"),
      landingView: document.getElementById("landingView"),
      resultView: document.getElementById("resultView"),
      resultHeadline: document.getElementById("resultHeadline"),
      resultUsername: document.getElementById("resultUsername"),
      searchForm: document.getElementById("searchForm"),
      input: document.getElementById("usernameInput"),
      formError: document.getElementById("formError"),
      generate: document.getElementById("generateButton"),
      changeUser: document.getElementById("changeUserButton"),
      refresh: document.getElementById("resultRefreshButton"),
      preview: document.getElementById("cardPreview"),
      viewport: document.getElementById("previewViewport"),
      previewError: document.getElementById("previewError"),
      sync: document.getElementById("syncLabel"),
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
      backgroundJob: document.getElementById("backgroundJob"),
      backgroundStatus: document.getElementById("backgroundStatus"),
      backgroundProgress: document.getElementById("backgroundProgress"),
      backgroundPercent: document.getElementById("backgroundPercent"),
      backgroundHelp: document.getElementById("backgroundHelp"),
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
    const corners = ["tl", "tr", "bl", "br"];
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
    function showLanding({ focus = false, select = false } = {}) {
      if (state.controller) state.controller.abort();
      state.requestId += 1;
      state.controller = null;
      state.loading = false;
      state.summary = null;
      elements.generate.disabled = false;
      elements.generate.loading = false;
      elements.refresh.disabled = false;
      elements.refresh.loading = false;
      elements.appShell.dataset.view = "landing";
      elements.resultView.hidden = true;
      elements.landingView.hidden = false;
      elements.preview.removeAttribute("src");
      elements.viewport.classList.remove("is-loading", "is-ready", "is-error");
      elements.previewError.classList.remove("visible");
      setMetricSkeleton(false);
      setError("");
      if (focus) {
        requestAnimationFrame(() => {
          elements.input.focus();
          if (select) elements.input.select?.();
        });
      }
    }
    function showResult(username) {
      elements.resultUsername.textContent = username;
      elements.landingView.hidden = true;
      elements.resultView.hidden = false;
      elements.appShell.dataset.view = "result";
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        backgroundData: state.config.backgroundData || "",
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
          bl: Number(state.config.backgroundCorners.bl),
          br: Number(state.config.backgroundCorners.br),
        },
      };
    }
    function configQuery({ includeBackgroundSource = true } = {}) {
      const config = cleanConfig();
      const query = new URLSearchParams();
      query.set("theme", config.theme);
      if (config.accent) query.set("accent", config.accent);
      if (config.avatarUrl) query.set("photo", config.avatarUrl);
      if (config.backgroundUrl && includeBackgroundSource) query.set("bg", config.backgroundUrl);
      if (config.backgroundData) query.set("bgData", config.backgroundData);
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
      let url = origin + "/api?" + configQuery({ includeBackgroundSource: false }) + "&username=" + encodeURIComponent(username);
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
      document.documentElement.style.setProperty("--card-accent", accent);
      document.documentElement.style.setProperty("--card-accent-strong", theme.colors.accent2 || accent);
      const rgb = hexToRgb(accent);
      if (rgb) {
        document.documentElement.style.setProperty("--card-accent-soft", "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.11)");
        document.documentElement.style.setProperty("--card-accent-line", "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.28)");
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
    function setBackgroundStatus(label, variant = "neutral", percent = 0, help = "") {
      const value = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
      elements.backgroundStatus.textContent = label;
      elements.backgroundStatus.variant = variant;
      elements.backgroundProgress.value = value;
      elements.backgroundPercent.textContent = value + "%";
      elements.backgroundJob.classList.toggle("is-complete", value === 100 && variant === "success");
      elements.backgroundJob.classList.toggle("is-error", variant === "danger");
      if (help) elements.backgroundHelp.textContent = help;
    }
    function canvasBlob(canvas, type, quality) {
      return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    }
    async function decodeImage(blob) {
      if (typeof createImageBitmap === "function") {
        const bitmap = await createImageBitmap(blob);
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          release() { bitmap.close?.(); },
        };
      }
      const objectUrl = URL.createObjectURL(blob);
      const image = new Image();
      image.decoding = "async";
      image.src = objectUrl;
      try {
        await image.decode();
        return {
          source: image,
          width: image.naturalWidth,
          height: image.naturalHeight,
          release() { URL.revokeObjectURL(objectUrl); },
        };
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        throw error;
      }
    }
    async function blobToBase64Url(blob) {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = "";
      const chunkSize = 0x8000;
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + chunkSize));
      }
      return btoa(binary)
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/=+$/, "");
    }
    async function compressBackground(blob, onProgress = () => {}) {
      if (!String(blob.type || "").startsWith("image/")) {
        throw new Error("链接返回的不是图片。");
      }
      const decoded = await decodeImage(blob);
      try {
        const candidateWidths = [720, 600, 480, 380, 300, 240, 180];
        const qualities = [0.78, 0.62, 0.48, 0.36, 0.28];
        const targetRatio = 920 / 1360;
        const sourceRatio = decoded.width / decoded.height;
        const sourceWidth = sourceRatio > targetRatio ? decoded.height * targetRatio : decoded.width;
        const sourceHeight = sourceRatio > targetRatio ? decoded.height : decoded.width / targetRatio;
        const sourceX = Math.max(0, (decoded.width - sourceWidth) / 2);
        const sourceY = Math.max(0, (decoded.height - sourceHeight) / 2);
        let lastSize = 0;
        let step = 0;
        const totalSteps = candidateWidths.length * qualities.length;
        for (const width of candidateWidths) {
          const height = Math.round(width / targetRatio);
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) throw new Error("浏览器无法创建图片画布。");
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          context.drawImage(decoded.source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
          for (const quality of qualities) {
            step += 1;
            onProgress(50 + Math.round((step / totalSteps) * 38), "正在压缩 WebP " + width + "×" + height + " · Q" + Math.round(quality * 100));
            const compressed = await canvasBlob(canvas, "image/webp", quality);
            lastSize = compressed?.size || 0;
            if (compressed?.type !== "image/webp") {
              throw new Error("当前浏览器不支持 WebP 压缩。");
            }
            if (compressed.size <= 18_000) {
              return { blob: compressed, width, height };
            }
          }
        }
        throw new Error("为保证 GitHub 链接可用，压缩后仍超过 18 KB（最后为 " + Math.max(1, Math.round(lastSize / 1024)) + " KB）。");
      } finally {
        decoded.release();
      }
    }
    function clearBackgroundData(message, variant = "danger") {
      state.config.backgroundData = "";
      state.backgroundData = "";
      setBackgroundStatus(message, variant, 0, "未写入卡片链接，服务器未保存图片。");
      refreshOutputs();
      schedulePreview();
    }
    async function processBackground(url) {
      const token = ++state.backgroundToken;
      clearTimeout(state.backgroundTimer);
      state.backgroundTimer = null;
      if (state.backgroundController) state.backgroundController.abort();
      state.backgroundController = null;
      const normalized = String(url || "").trim();
      if (!normalized) {
        state.config.backgroundData = "";
        state.backgroundData = "";
        state.backgroundSource = "";
        setBackgroundStatus("等待背景图片", "neutral", 0, "粘贴公开 HTTPS 图片链接后自动开始。");
        refreshOutputs();
        schedulePreview();
        return;
      }
      if (normalized === state.backgroundSource && state.backgroundData) {
        state.config.backgroundData = state.backgroundData;
        setBackgroundStatus("已完成", "success", 100, "压缩后的图片已经写入卡片链接。");
        refreshOutputs();
        schedulePreview();
        return;
      }
      let parsed;
      try {
        parsed = new URL(normalized);
      } catch {
        setBackgroundStatus("链接格式错误", "danger", 0, "请输入完整的 HTTPS 图片链接。");
        return;
      }
      if (parsed.protocol !== "https:") {
        setBackgroundStatus("协议不受支持", "danger", 0, "背景图片必须使用 HTTPS。");
        return;
      }
      state.config.backgroundData = "";
      state.backgroundData = "";
      state.backgroundSource = normalized;
      setBackgroundStatus("读取原图", "neutral", 8, "正在从图片源直接下载，不经过本站服务器。");
      const controller = new AbortController();
      state.backgroundController = controller;
      const startedAt = Date.now();
      const waitTimer = setInterval(() => {
        if (token !== state.backgroundToken) return;
        const seconds = Math.floor((Date.now() - startedAt) / 1000);
        setBackgroundStatus("等待图片源", "neutral", 8 + Math.min(3, Math.floor(seconds / 10)), "图片服务器还没有响应 · 已等待 " + seconds + " 秒");
      }, 2_000);
      const timeoutTimer = setTimeout(() => controller.abort(), 45_000);
      try {
        const response = await fetch(parsed.href, {
          mode: "cors",
          credentials: "omit",
          referrerPolicy: "no-referrer",
          cache: "force-cache",
          signal: controller.signal,
        });
        clearInterval(waitTimer);
        if (!response.ok) throw new Error("图片服务器返回 " + response.status);
        const declared = Number(response.headers.get("Content-Length") || 0);
        if (declared > 32_000_000) throw new Error("原图超过浏览器处理上限。");
        if (!String(response.headers.get("Content-Type") || "").startsWith("image/")) {
          throw new Error("该链接不是图片资源。");
        }
        let source;
        if (response.body?.getReader) {
          const reader = response.body.getReader();
          const chunks = [];
          let received = 0;
          let lastPercent = -1;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.byteLength;
            const percent = declared
              ? 12 + Math.floor((received / declared) * 30)
              : Math.min(40, 12 + chunks.length * 4);
            if (percent !== lastPercent) {
              lastPercent = percent;
              setBackgroundStatus(
                "下载原图",
                "neutral",
                percent,
                "已读取 " + Math.max(1, Math.round(received / 1024)) + " KB" + (declared ? " / " + Math.round(declared / 1024) + " KB" : ""),
              );
            }
          }
          source = new Blob(chunks, { type: response.headers.get("Content-Type") || "application/octet-stream" });
        } else {
          source = await response.blob();
        }
        if (source.size > 32_000_000) throw new Error("原图超过浏览器处理上限。");
        if (token !== state.backgroundToken) return;
        setBackgroundStatus("解码图片", "neutral", 46, "浏览器正在读取尺寸与像素数据。");
        const compressed = await compressBackground(source, (percent, label) => {
          if (token === state.backgroundToken) {
            setBackgroundStatus(label, "neutral", percent, "自动降低尺寸与质量，避免 GitHub 截断长链接。");
          }
        });
        if (token !== state.backgroundToken) return;
        setBackgroundStatus("写入卡片链接", "neutral", 92, "生成 URL-safe WebP 数据，不上传服务器。");
        const encoded = await blobToBase64Url(compressed.blob);
        if (token !== state.backgroundToken) return;
        state.config.backgroundData = encoded;
        state.backgroundData = encoded;
        state.backgroundSource = normalized;
        setBackgroundStatus("已完成", "success", 100, "已内嵌 " + compressed.width + "×" + compressed.height + " WebP · " + Math.max(1, Math.round(compressed.blob.size / 1024)) + " KB · 服务器未保存");
        showToast("背景图片已在浏览器压缩并内嵌");
        refreshOutputs();
        schedulePreview();
      } catch (error) {
        if (token !== state.backgroundToken) return;
        if (controller.signal.aborted) {
          clearBackgroundData("图片读取超时", "danger");
          showToast("图片源 45 秒内没有响应，请换一个链接或稍后重试");
          return;
        }
        const reason = error instanceof Error ? error.message : "浏览器无法读取图片";
        const crossOrigin = error instanceof TypeError || /fetch|network|cors/i.test(reason);
        clearBackgroundData(crossOrigin ? "该图片禁止跨域读取，请换图源" : "背景处理失败", "danger");
        showToast(reason);
      } finally {
        clearInterval(waitTimer);
        clearTimeout(timeoutTimer);
        if (state.backgroundController === controller) state.backgroundController = null;
      }
    }
    function scheduleBackground(url, delay = 650) {
      state.backgroundToken += 1;
      clearTimeout(state.backgroundTimer);
      state.backgroundSource = String(url || "").trim();
      state.backgroundData = "";
      state.config.backgroundData = "";
      if (!state.backgroundSource) {
        setBackgroundStatus("等待背景图片", "neutral", 0, "粘贴公开 HTTPS 图片链接后自动开始。");
        return;
      }
      setBackgroundStatus("准备处理", "neutral", 0, "将在浏览器中读取、压缩并写入链接。");
      state.backgroundTimer = setTimeout(() => processBackground(state.backgroundSource), delay);
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
      state.backgroundData = state.config.backgroundData || "";
      state.backgroundSource = state.config.backgroundUrl || "";
      if (state.backgroundData) {
        setBackgroundStatus("已载入背景", "success", 100, "背景数据已包含在当前卡片链接中。");
      } else if (state.backgroundSource) {
        setBackgroundStatus("等待处理", "neutral", 0, "生成卡片时将在浏览器中处理背景图片。");
      } else {
        setBackgroundStatus("等待背景图片", "neutral", 0, "粘贴公开 HTTPS 图片链接后自动开始。");
      }
    }
    function refreshOutputs() {
      const url = cardEndpoint(state.username, { cacheBust: true });
      elements.openSvg.setAttribute("href", cardEndpoint(state.username));
      elements.endpoint.textContent = origin + "/api?" + configQuery({ includeBackgroundSource: false }) + "&username=" + encodeURIComponent(state.username);
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
    async function loadSummary({ refresh = false, setCard = false, enterResult = false, username = state.username } = {}) {
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
        if (setCard || refresh) {
          const url = refreshOutputs();
          if (enterResult) showResult(canonicalUsername);
          beginSkeleton();
          elements.preview.src = url;
        }
      } catch (error) {
        if (controller.signal.aborted || requestId !== state.requestId) return;
        const message = error instanceof Error ? error.message : "同步失败，请稍后重试。";
        elements.sync.textContent = message;
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
      setMetricSkeleton(true);
      elements.sync.textContent = "正在获取 GitHub 数据…";
      if (state.config.backgroundUrl && !state.config.backgroundData) {
        scheduleBackground(state.config.backgroundUrl, 0);
      }
      loadSummary({ username, setCard: true, enterResult: true });
    }
    function isEditing() {
      const tag = document.activeElement?.tagName || "";
      return ["SL-INPUT", "SL-TEXTAREA", "SL-SELECT", "SL-COLOR-PICKER"].includes(tag);
    }

    elements.preview.addEventListener("load", markPreviewReady);
    elements.preview.addEventListener("error", markPreviewError);
    elements.searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitSearch();
    });
    elements.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        submitSearch();
      }
    });
    elements.refresh.addEventListener("click", () => loadSummary({ refresh: true, setCard: true }));
    elements.changeUser.addEventListener("click", () => {
      elements.input.value = state.username || initialUsername;
      showLanding({ focus: true, select: true });
    });
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
    [elements.avatarUrl, elements.mark, elements.badge, elements.headlineOne, elements.headlineTwo, elements.intro, elements.footerNote].forEach((input) => {
      input.addEventListener("sl-input", () => {
        readControls();
        refreshOutputs();
        schedulePreview();
      });
    });
    elements.backgroundUrl.addEventListener("sl-input", () => {
      const source = elements.backgroundUrl.value.trim();
      state.config.backgroundUrl = source;
      state.config.backgroundData = "";
      state.backgroundData = "";
      refreshOutputs();
      schedulePreview();
      scheduleBackground(source);
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
      const inResult = elements.appShell.dataset.view === "result";
      if (inResult && event.key.toLowerCase() === "r") elements.refresh.click();
      if (inResult && event.key.toLowerCase() === "c") elements.copy.click();
      if (event.key.toLowerCase() === "t") elements.themeButton.click();
      if (!inResult && event.key === "/") {
        event.preventDefault();
        elements.input.focus();
      }
    });

    hydrateControls();
    refreshOutputs();
    showLanding();
  </script>
</body>
</html>`;
}
