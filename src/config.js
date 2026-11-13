export const CARD_THEMES = {
  midnight: {
    label: "Ink Orbit",
    labelZh: "墨轨",
    note: "Dark ink · orbital index",
    noteZh: "墨黑 · 轨道索引",
    layout: "orbit",
    dark: true,
    swatches: ["#0C0B0A", "#E8442A", "#F4EFE5"],
    colors: {
      background: ["#090807", "#12100E", "#0B0A08"],
      glowA: "#E8442A",
      glowB: "#2D5BA8",
      text: "#F4EFE5",
      textSoft: "#E2DACD",
      muted: "#A79E91",
      dim: "#756C60",
      accent: "#E8442A",
      accent2: "#2D5BA8",
      line: "#FFFFFF",
      panel: "#1B1916",
      panelFill: "#FFFFFF",
      track: "#3C3833",
      badgeText: "#F0A596",
      overlay: "#070605",
      grid: "#FFFFFF",
    },
  },
  ivory: {
    label: "Editorial",
    labelZh: "校样",
    note: "Paper · editorial spread",
    noteZh: "纸感 · 杂志校样",
    layout: "editorial",
    dark: false,
    swatches: ["#F4EFE4", "#A51C30", "#171512"],
    colors: {
      background: ["#F7F2E8", "#ECE3D4", "#F5EFE4"],
      glowA: "#A51C30",
      glowB: "#17498D",
      text: "#171512",
      textSoft: "#332E27",
      muted: "#746B5F",
      dim: "#9A8F81",
      accent: "#A51C30",
      accent2: "#17498D",
      line: "#171512",
      panel: "#FFFBF2",
      panelFill: "#171512",
      track: "#D9CFC0",
      badgeText: "#8E1A2A",
      overlay: "#F2EBDD",
      grid: "#171512",
    },
  },
  ocean: {
    label: "Blueprint",
    labelZh: "蓝图",
    note: "Navy · live terminal",
    noteZh: "深蓝 · 终端制图",
    layout: "terminal",
    dark: true,
    swatches: ["#07121B", "#5D86FF", "#ECF4FF"],
    colors: {
      background: ["#06111A", "#0A1D2B", "#071522"],
      glowA: "#5D86FF",
      glowB: "#D6E44B",
      text: "#F0F5FF",
      textSoft: "#D7E3F5",
      muted: "#91A5BE",
      dim: "#63768C",
      accent: "#5D86FF",
      accent2: "#D6E44B",
      line: "#E5EEFF",
      panel: "#10283A",
      panelFill: "#E5EEFF",
      track: "#1E3548",
      badgeText: "#AFC2FF",
      overlay: "#040D17",
      grid: "#E5EEFF",
    },
  },
  ember: {
    label: "Poster",
    labelZh: "海报",
    note: "Oxide red · poster press",
    noteZh: "砖红 · 海报印刷",
    layout: "poster",
    dark: true,
    swatches: ["#190D0B", "#B83228", "#F5EBDD"],
    colors: {
      background: ["#170C0A", "#28130F", "#120806"],
      glowA: "#B83228",
      glowB: "#76866C",
      text: "#F5EBDD",
      textSoft: "#E7D6C2",
      muted: "#B29C86",
      dim: "#806C5D",
      accent: "#B83228",
      accent2: "#76866C",
      line: "#F5EBDD",
      panel: "#2A1A15",
      panelFill: "#F5EBDD",
      track: "#48332B",
      badgeText: "#E9B0A4",
      overlay: "#120806",
      grid: "#F5EBDD",
    },
  },
  graphite: {
    label: "Swiss",
    labelZh: "瑞士",
    note: "Proof paper · Swiss grid",
    noteZh: "浅灰 · 网格校样",
    layout: "swiss",
    dark: false,
    swatches: ["#F0EFEA", "#D6422E", "#17498D"],
    colors: {
      background: ["#F3F1EB", "#EBE8E0", "#F7F5F0"],
      glowA: "#D6422E",
      glowB: "#17498D",
      text: "#151513",
      textSoft: "#2C2B27",
      muted: "#68655E",
      dim: "#8E8A81",
      accent: "#D6422E",
      accent2: "#17498D",
      line: "#151513",
      panel: "#FFFDF7",
      panelFill: "#151513",
      track: "#D8D3C9",
      badgeText: "#FFFDF7",
      overlay: "#F0EDE6",
      grid: "#151513",
    },
  },
};

/**
 * @typedef {object} CardConfig
 * @property {string} theme
 * @property {string} accent
 * @property {string} backgroundImage
 * @property {{ tl: number, tr: number, bl: number, br: number }} backgroundCorners
 * @property {string} mark
 * @property {string} headlineOne
 * @property {string} headlineTwo
 * @property {string} intro
 * @property {string} badge
 * @property {string} footerNote
 */

/** @type {Readonly<CardConfig>} */
export const DEFAULT_CARD_CONFIG = Object.freeze({
  theme: "midnight",
  accent: "",
  backgroundImage: "",
  backgroundCorners: {
    tl: 0.5,
    tr: 0.24,
    br: 0.38,
    bl: 0.16,
  },
  mark: "",
  headlineOne: "",
  headlineTwo: "",
  intro: "",
  badge: "",
  footerNote: "",
});

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const IMAGE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(value, maxLength) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maxLength);
}

function opacity(value, fallback) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(1, parsed));
}

function imageId(value) {
  const candidate = String(value ?? "").trim();
  return IMAGE_ID.test(candidate) ? candidate.toLowerCase() : "";
}

/**
 * @param {Partial<CardConfig>} [input]
 * @param {Partial<CardConfig>} [defaults]
 * @returns {CardConfig}
 */
export function normalizeCardConfig(input = {}, defaults = DEFAULT_CARD_CONFIG) {
  const merged = {
    ...DEFAULT_CARD_CONFIG,
    ...defaults,
    ...input,
    backgroundCorners: {
      ...DEFAULT_CARD_CONFIG.backgroundCorners,
      ...(defaults.backgroundCorners || {}),
      ...(input.backgroundCorners || {}),
    },
  };
  const theme = CARD_THEMES[merged.theme]
    ? merged.theme
    : defaults.theme in CARD_THEMES
      ? defaults.theme
      : DEFAULT_CARD_CONFIG.theme;
  const accent = text(merged.accent, 7);

  return {
    theme,
    accent: HEX_COLOR.test(accent) ? accent.toUpperCase() : "",
    backgroundImage: imageId(merged.backgroundImage),
    backgroundCorners: {
      tl: opacity(merged.backgroundCorners.tl, DEFAULT_CARD_CONFIG.backgroundCorners.tl),
      tr: opacity(merged.backgroundCorners.tr, DEFAULT_CARD_CONFIG.backgroundCorners.tr),
      br: opacity(merged.backgroundCorners.br, DEFAULT_CARD_CONFIG.backgroundCorners.br),
      bl: opacity(merged.backgroundCorners.bl, DEFAULT_CARD_CONFIG.backgroundCorners.bl),
    },
    mark: text(merged.mark, 24).toUpperCase(),
    headlineOne: text(merged.headlineOne, 42),
    headlineTwo: text(merged.headlineTwo, 48),
    intro: text(merged.intro, 120),
    badge: text(merged.badge, 64),
    footerNote: text(merged.footerNote, 64),
  };
}

/**
 * @param {URLSearchParams} searchParams
 * @param {Partial<CardConfig>} [defaults]
 * @returns {CardConfig}
 */
export function configFromSearchParams(searchParams, defaults = DEFAULT_CARD_CONFIG) {
  const current = normalizeCardConfig(defaults);
  const input = {
    theme: searchParams.get("theme") || current.theme,
    accent: searchParams.get("accent") || current.accent,
    backgroundImage: searchParams.get("bgImage") || current.backgroundImage,
    mark: searchParams.get("mark") || current.mark,
    headlineOne: searchParams.get("h1") || current.headlineOne,
    headlineTwo: searchParams.get("h2") || current.headlineTwo,
    intro: searchParams.get("intro") || current.intro,
    badge: searchParams.get("badge") || current.badge,
    footerNote: searchParams.get("note") || current.footerNote,
    backgroundCorners: {
      tl: searchParams.get("bgTL") || current.backgroundCorners.tl,
      tr: searchParams.get("bgTR") || current.backgroundCorners.tr,
      br: searchParams.get("bgBR") || current.backgroundCorners.br,
      bl: searchParams.get("bgBL") || current.backgroundCorners.bl,
    },
  };
  return normalizeCardConfig(input, current);
}

export function themePalette(config) {
  const base = CARD_THEMES[config.theme] || CARD_THEMES.midnight;
  const accent = config.accent || base.colors.accent;
  return {
    ...base,
    colors: {
      ...base.colors,
      accent,
    },
  };
}

export function publicCardConfig(config) {
  return normalizeCardConfig(config);
}
