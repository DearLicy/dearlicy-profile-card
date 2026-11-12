import { CARD_THEMES, DEFAULT_CARD_CONFIG } from "./config.js";
import {
  BRAND_MARK,
  PRINT_THEME_CSS,
  THEME_TOGGLE,
} from "./design-system.js";
import { STUDIO_CSS } from "./studio-ui.js";
import { IMAGE_CLIENT_SCRIPT } from "./image-client.js";
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
  allowPublicUploads = false,
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
      <sl-button class="github-link" href="${safeRepoUrl}" target="_blank" rel="noreferrer" aria-label="打开 GitHub 仓库">
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
                      <div class="group-label library-title"><span>图片库背景</span><small>单张最大 1 MB</small></div>
                      <div class="selected-image-frame" id="selectedImageFrame">
                        <img id="selectedImagePreview" alt="" hidden>
                        <div class="selected-image-empty" id="selectedImageEmpty">
                          <span class="selected-image-icon">${ICONS.image}</span>
                          <span>尚未选择图片库背景</span>
                        </div>
                      </div>
                      <div class="library-selection-actions">
                        <sl-button id="openImageDrawer" variant="primary">
                          <span slot="prefix">${ICONS.image}</span>
                          <span>选择或上传图片</span>
                        </sl-button>
                        <sl-button id="clearLibraryImage" hidden>移除背景</sl-button>
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

  <sl-drawer id="imageDrawer" label="选择图片库背景" placement="end" class="image-drawer">
    <div class="image-drawer-head">
      <div><strong>公开图片库</strong><small id="librarySummary">正在读取图片库…</small></div>
    </div>
    <div class="library-toolbar">
      <div class="library-copy"><strong>选择背景</strong><small>点选图片后立即应用。</small></div>
      <sl-button id="uploadImageButton" size="small" ${allowPublicUploads ? "" : "hidden"}>
        <span slot="prefix">${ICONS.upload}</span>
        <span>上传图片</span>
      </sl-button>
    </div>
    <div class="background-job image-upload-job" id="imageUploadJob" hidden>
      <div class="background-status-row">
        <sl-badge id="imageUploadStatus" pill>准备上传</sl-badge>
        <span class="background-percent" id="imageUploadPercent">0%</span>
      </div>
      <sl-progress-bar id="imageUploadProgress" value="0" label="图片上传处理进度"></sl-progress-bar>
      <small class="background-help" id="imageUploadHelp">浏览器会先压缩到 1 MB 以内。</small>
    </div>
    <div class="image-library" id="imageLibrary" aria-live="polite">
      <sl-skeleton effect="sheen" class="library-skeleton"></sl-skeleton>
      <sl-skeleton effect="sheen" class="library-skeleton"></sl-skeleton>
      <sl-skeleton effect="sheen" class="library-skeleton"></sl-skeleton>
    </div>
    <p class="library-empty" id="imageLibraryEmpty" hidden>图片库暂时没有管理员公开的图片。</p>
  </sl-drawer>

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

    const initialUsername = ${json(defaultUsername)};
    const origin = ${json(baseOrigin)};
    const repoUrl = ${json(repoUrl)};
    const initialAllowPublicUploads = ${json(Boolean(allowPublicUploads))};
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
      library: [],
      libraryLoaded: false,
      libraryError: "",
      libraryAllowPublic: Boolean(initialAllowPublicUploads),
      uploadingImage: false,
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
      mark: document.getElementById("markInput"),
      badge: document.getElementById("badgeInput"),
      headlineOne: document.getElementById("headlineOne"),
      headlineTwo: document.getElementById("headlineTwo"),
      intro: document.getElementById("introInput"),
      footerNote: document.getElementById("footerNote"),
      imageDrawer: document.getElementById("imageDrawer"),
      openImageDrawer: document.getElementById("openImageDrawer"),
      imageLibrary: document.getElementById("imageLibrary"),
      imageLibraryEmpty: document.getElementById("imageLibraryEmpty"),
      librarySummary: document.getElementById("librarySummary"),
      selectedImageFrame: document.getElementById("selectedImageFrame"),
      selectedImagePreview: document.getElementById("selectedImagePreview"),
      selectedImageEmpty: document.getElementById("selectedImageEmpty"),
      uploadImageButton: document.getElementById("uploadImageButton"),
      clearLibraryImage: document.getElementById("clearLibraryImage"),
      imageUploadJob: document.getElementById("imageUploadJob"),
      imageUploadStatus: document.getElementById("imageUploadStatus"),
      imageUploadProgress: document.getElementById("imageUploadProgress"),
      imageUploadPercent: document.getElementById("imageUploadPercent"),
      imageUploadHelp: document.getElementById("imageUploadHelp"),
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
        backgroundImage: state.config.backgroundImage || "",
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
    function configQuery() {
      const config = cleanConfig();
      const query = new URLSearchParams();
      query.set("theme", config.theme);
      if (config.accent) query.set("accent", config.accent);
      if (config.backgroundImage) query.set("bgImage", config.backgroundImage);
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
    function setImageUploadStatus(label, variant, value, help) {
      elements.imageUploadStatus.textContent = label;
      elements.imageUploadStatus.variant = variant;
      elements.imageUploadProgress.value = value;
      elements.imageUploadPercent.textContent = value + "%";
      elements.imageUploadJob.classList.toggle("is-complete", value === 100 && variant === "success");
      elements.imageUploadJob.classList.toggle("is-error", variant === "danger");
      if (help) elements.imageUploadHelp.textContent = help;
    }
    function syncLibrarySelection() {
      const active = state.config.backgroundImage || "";
      const image = state.library.find((entry) => entry.id === active);
      elements.imageLibrary.querySelectorAll(".library-card").forEach((button) => {
        const selected = button.dataset.imageId === active;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", selected ? "true" : "false");
      });
      if (image) {
        elements.selectedImagePreview.src = image.url;
        elements.selectedImagePreview.alt = image.label;
        elements.selectedImagePreview.hidden = false;
        elements.selectedImageEmpty.hidden = true;
        elements.selectedImageFrame.classList.add("has-image");
      } else {
        elements.selectedImagePreview.removeAttribute("src");
        elements.selectedImagePreview.hidden = true;
        elements.selectedImageEmpty.hidden = false;
        elements.selectedImageFrame.classList.remove("has-image");
      }
      elements.clearLibraryImage.hidden = !active;
    }
    function renderImageLibrary() {
      elements.imageLibrary.replaceChildren();
      const images = state.library;
      for (const image of images) {
        const button = document.createElement("sl-button");
        button.className = "library-card";
        button.dataset.imageId = image.id;
        button.title = image.label;
        button.setAttribute("aria-label", "使用图片 " + image.label);
        const preview = document.createElement("img");
        preview.src = image.url;
        preview.alt = image.label;
        preview.loading = "lazy";
        preview.decoding = "async";
        button.append(preview);
        elements.imageLibrary.append(button);
      }
      state.libraryLoaded = true;
      elements.imageLibraryEmpty.hidden = images.length > 0 || !state.libraryLoaded;
      if (state.libraryError) {
        elements.imageLibraryEmpty.hidden = false;
        elements.imageLibraryEmpty.textContent = state.libraryError;
      } else if (!images.length && state.libraryLoaded) {
        elements.imageLibraryEmpty.hidden = false;
        elements.imageLibraryEmpty.textContent = state.libraryAllowPublic
          ? "还没有公开图片。你可以上传一张，管理员审核后会出现在这里。"
          : "图片库暂时没有管理员公开的图片。";
      }
      elements.uploadImageButton.hidden = !state.libraryAllowPublic;
      elements.librarySummary.textContent = images.length
        ? images.length + " 张已公开图片" + (state.libraryAllowPublic ? " · 游客已开放上传审核" : " · 仅管理员可上传")
        : state.libraryAllowPublic
          ? "暂无公开图片 · 游客可上传等待审核"
          : "暂无公开图片 · 管理员暂未开放上传";
      syncLibrarySelection();
    }
    async function loadImageLibrary() {
      try {
        const response = await fetch("/api/images", { cache: "no-store" });
        if (!response.ok) throw new Error("图片库读取失败。");
        const payload = await response.json();
        state.library = Array.isArray(payload.images) ? payload.images : [];
        state.libraryAllowPublic = Boolean(payload.allowPublicUploads);
        state.libraryError = "";
        renderImageLibrary();
      } catch {
        state.library = [];
        state.libraryError = "图片库暂时不可用，请稍后刷新。";
        renderImageLibrary();
      }
    }
    async function uploadLibraryBackground() {
      if (state.uploadingImage) return;
      if (!state.libraryAllowPublic) {
        showToast("管理员暂未开放游客上传");
        return;
      }
      const file = await chooseImageFile();
      if (!file) return;
      state.uploadingImage = true;
      elements.imageUploadJob.hidden = false;
      elements.uploadImageButton.disabled = true;
      elements.uploadImageButton.loading = true;
      setImageUploadStatus("读取图片", "neutral", 0, "正在由浏览器读取并压缩，图片不会以原图上传。");
      try {
        const compressed = await compressLibraryImage(file, {
          maxBytes: 980000,
          onProgress: (value, label) => setImageUploadStatus(label, "neutral", value, "自动压缩到 1 MB 以内，再进行上传。"),
        });
        setImageUploadStatus("上传压缩图", "neutral", 88, formatImageBytes(compressed.blob.size) + " WebP · 正在提交到实例图片库。");
        const payload = await uploadLibraryImage(compressed.blob, { label: imageFileLabel(file) });
        setImageUploadStatus("已提交审核", "success", 100, payload.message || "管理员发布后其他访客即可使用。");
        showToast(payload.message || "图片已提交审核");
        await loadImageLibrary();
      } catch (error) {
        setImageUploadStatus("上传失败", "danger", 0, error instanceof Error ? error.message : "图片上传失败。");
        showToast(error instanceof Error ? error.message : "图片上传失败");
      } finally {
        state.uploadingImage = false;
        elements.uploadImageButton.disabled = false;
        elements.uploadImageButton.loading = false;
      }
    }
    function useLibraryImage(image) {
      state.config.backgroundImage = image.id;
      syncLibrarySelection();
      refreshOutputs();
      schedulePreview();
      elements.imageDrawer.hide();
      showToast("已选择图片库背景");
    }
    function clearLibraryImage() {
      state.config.backgroundImage = "";
      syncLibrarySelection();
      refreshOutputs();
      schedulePreview();
      showToast("已移除图片库背景");
    }
    function hydrateControls() {
      const theme = themes[state.config.theme] || themes.midnight;
      elements.accent.value = state.config.accent || theme.colors.accent;
      elements.accentValue.textContent = state.config.accent || "跟随主题";
      elements.mark.value = state.config.mark || "";
      elements.badge.value = state.config.badge || "";
      elements.headlineOne.value = state.config.headlineOne || "";
      elements.headlineTwo.value = state.config.headlineTwo || "";
      elements.intro.value = state.config.intro || "";
      elements.footerNote.value = state.config.footerNote || "";
      corners.forEach((key) => setSlider(key, state.config.backgroundCorners[key]));
      syncThemeCards();
      applyAccent(state.config.theme, state.config.accent);
      syncLibrarySelection();
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
      next.mark = elements.mark.value;
      next.badge = elements.badge.value;
      next.headlineOne = elements.headlineOne.value;
      next.headlineTwo = elements.headlineTwo.value;
      next.intro = elements.intro.value;
      next.footerNote = elements.footerNote.value;
      next.backgroundImage = state.config.backgroundImage || "";
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
    [elements.mark, elements.badge, elements.headlineOne, elements.headlineTwo, elements.intro, elements.footerNote].forEach((input) => {
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
    elements.uploadImageButton.addEventListener("click", uploadLibraryBackground);
    elements.clearLibraryImage.addEventListener("click", clearLibraryImage);
    elements.openImageDrawer.addEventListener("click", () => {
      elements.imageDrawer.show();
      loadImageLibrary();
    });
    elements.imageLibrary.addEventListener("click", (event) => {
      const card = event
        .composedPath()
        .find((node) => node?.classList?.contains("library-card"));
      if (!card) return;
      const image = state.library.find((entry) => entry.id === card.dataset.imageId);
      if (image) useLibraryImage(image);
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
    loadImageLibrary();
    showLanding();
  </script>
</body>
</html>`;
}
