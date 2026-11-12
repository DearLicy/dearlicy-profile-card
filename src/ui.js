export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function json(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export const ICONS = {
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
  moon:
    '<svg class="moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 15.2A8.4 8.4 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  sun:
    '<svg class="sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  dashboard:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.7"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.7"/></svg>',
  palette:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3a9 9 0 0 0 0 18h1.2a1.8 1.8 0 0 0 1.2-3.1 1.8 1.8 0 0 1 1.2-3.1H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z" stroke="currentColor" stroke-width="1.7"/><circle cx="7.8" cy="10" r="1" fill="currentColor"/><circle cx="10.2" cy="6.8" r="1" fill="currentColor"/><circle cx="14.1" cy="7.1" r="1" fill="currentColor"/></svg>',
  key:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="8.5" cy="15.5" r="4.5" stroke="currentColor" stroke-width="1.7"/><path d="m12 12 8-8M16 8l2 2M18 6l2 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  settings:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7.4 7.4 0 0 0-2.1-1.2L14 3h-4l-.4 2.7a7.4 7.4 0 0 0-2.1 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7.4 7.4 0 0 0 2.1 1.2L10 21h4l.4-2.7a7.4 7.4 0 0 0 2.1-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  logout:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3M14 8l4 4-4 4M18 12H9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

export const COMPONENT_THEME_LINKS = `
  <link id="slThemeLight" rel="stylesheet" href="/vendor/shoelace/themes/light.css">
  <link id="slThemeDark" rel="stylesheet" href="/vendor/shoelace/themes/dark.css">`;

export const FAVICON_LINK = `
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='20' fill='%23d6422e'/%3E%3Crect x='17' y='18' width='30' height='28' rx='7' fill='none' stroke='%231a1714' stroke-width='4'/%3E%3Cpath d='M24 27h16M24 34h11' stroke='%231a1714' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E">`;

export const SHOELACE_IMPORT_MAP = `
  <script type="importmap">
    {
      "imports": {
        "@ctrl/tinycolor": "/vendor/@ctrl/tinycolor/dist/module/public_api.js",
        "@floating-ui/core": "/vendor/@floating-ui/core/dist/floating-ui.core.mjs",
        "@floating-ui/dom": "/vendor/@floating-ui/dom/dist/floating-ui.dom.mjs",
        "@floating-ui/utils": "/vendor/@floating-ui/utils/dist/floating-ui.utils.mjs",
        "@floating-ui/utils/dom": "/vendor/@floating-ui/utils/dist/floating-ui.utils.dom.mjs",
        "@lit-labs/ssr-dom-shim": "/vendor/@lit-labs/ssr-dom-shim/index.js",
        "@lit/reactive-element": "/vendor/@lit/reactive-element/reactive-element.js",
        "@lit/reactive-element/": "/vendor/@lit/reactive-element/",
        "@shoelace-style/localize": "/vendor/@shoelace-style/localize/dist/index.js",
        "composed-offset-position": "/vendor/composed-offset-position/dist/composed-offset-position.browser.min.mjs",
        "lit": "/vendor/lit/index.js",
        "lit/": "/vendor/lit/",
        "lit-element": "/vendor/lit-element/index.js",
        "lit-element/": "/vendor/lit-element/",
        "lit-html": "/vendor/lit-html/lit-html.js",
        "lit-html/": "/vendor/lit-html/"
      }
    }
  </script>`;

export const SHOELACE_IMPORTS = `
  import "/vendor/shoelace/components/alert/alert.js";
  import "/vendor/shoelace/components/badge/badge.js";
  import "/vendor/shoelace/components/button/button.js";
  import "/vendor/shoelace/components/color-picker/color-picker.js";
  import "/vendor/shoelace/components/details/details.js";
  import "/vendor/shoelace/components/input/input.js";
  import "/vendor/shoelace/components/option/option.js";
  import "/vendor/shoelace/components/progress-bar/progress-bar.js";
  import "/vendor/shoelace/components/radio-button/radio-button.js";
  import "/vendor/shoelace/components/radio-group/radio-group.js";
  import "/vendor/shoelace/components/range/range.js";
  import "/vendor/shoelace/components/select/select.js";
  import "/vendor/shoelace/components/skeleton/skeleton.js";
  import "/vendor/shoelace/components/switch/switch.js";
  import "/vendor/shoelace/components/tab/tab.js";
  import "/vendor/shoelace/components/tab-group/tab-group.js";
  import "/vendor/shoelace/components/tab-panel/tab-panel.js";
  import "/vendor/shoelace/components/textarea/textarea.js";
  import zhCN from "/vendor/shoelace/translations/zh-cn.js";
  void zhCN;`;

export function themeBootScript(storageKey) {
  return `<script>
    (() => {
      try {
        const queryTheme = new URLSearchParams(location.search).get("theme");
        const theme =
          queryTheme === "light" || queryTheme === "dark"
            ? queryTheme
            : localStorage.getItem(${json(storageKey)}) || "dark";
        document.documentElement.dataset.theme = theme;
        document.documentElement.classList.toggle("sl-theme-dark", theme === "dark");
        document.documentElement.classList.toggle("sl-theme-light", theme === "light");
      } catch {
        document.documentElement.dataset.theme = "dark";
        document.documentElement.classList.add("sl-theme-dark");
        document.documentElement.classList.remove("sl-theme-light");
      }
    })();
  </script>`;
}
