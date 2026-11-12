export const CARD_THEMES = {
  midnight: {
    label: "Midnight",
    note: "Dark · orbital",
    layout: "orbit",
    dark: true,
    swatches: ["#0B0C10", "#CBB9FF", "#F7F3ED"],
    colors: {
      background: ["#090A0D", "#111218", "#0C0D12"],
      glowA: "#B9A7FF",
      glowB: "#6A5ACD",
      text: "#F7F3ED",
      textSoft: "#E5E0EB",
      muted: "#96929F",
      dim: "#6D6A77",
      accent: "#CBB9FF",
      accent2: "#8A70E7",
      line: "#FFFFFF",
      panel: "#17171E",
      panelFill: "#FFFFFF",
      track: "#393844",
      badgeText: "#BDB1D8",
      overlay: "#08090D",
      grid: "#FFFFFF",
    },
  },
  ivory: {
    label: "Ivory",
    note: "Light · editorial",
    layout: "frame",
    dark: false,
    swatches: ["#F3EEE5", "#6650D8", "#1A1720"],
    colors: {
      background: ["#F8F4EC", "#EFE8DD", "#F5F0E8"],
      glowA: "#8A74E8",
      glowB: "#D8C9A8",
      text: "#1A1720",
      textSoft: "#302B36",
      muted: "#756E7A",
      dim: "#9A929E",
      accent: "#6650D8",
      accent2: "#9B8AF0",
      line: "#211C29",
      panel: "#FFFDF8",
      panelFill: "#211C29",
      track: "#DDD5C8",
      badgeText: "#5F4DC8",
      overlay: "#F4EDE2",
      grid: "#211C29",
    },
  },
  ocean: {
    label: "Ocean",
    note: "Deep teal · terminal",
    layout: "terminal",
    dark: true,
    swatches: ["#071116", "#65D6C4", "#ECF9F7"],
    colors: {
      background: ["#050D11", "#081820", "#06121A"],
      glowA: "#58D5C2",
      glowB: "#206A85",
      text: "#F0FBF8",
      textSoft: "#D7F4EF",
      muted: "#85A7A4",
      dim: "#587775",
      accent: "#65D6C4",
      accent2: "#2C9DB4",
      line: "#DFFFFA",
      panel: "#0C1A20",
      panelFill: "#DFFFFA",
      track: "#1C3439",
      badgeText: "#8CE7D9",
      overlay: "#041015",
      grid: "#DFFFFA",
    },
  },
  ember: {
    label: "Ember",
    note: "Warm dark · framed",
    layout: "frame",
    dark: true,
    swatches: ["#130D0C", "#FFB07C", "#FFF4EE"],
    colors: {
      background: ["#0D0908", "#17100E", "#120C0B"],
      glowA: "#F29A69",
      glowB: "#9E4C36",
      text: "#FFF5EF",
      textSoft: "#F1DED5",
      muted: "#AA9188",
      dim: "#78645D",
      accent: "#FFB07C",
      accent2: "#D76B4F",
      line: "#FFF5EF",
      panel: "#1D1513",
      panelFill: "#FFF5EF",
      track: "#3B2A25",
      badgeText: "#F6C2A1",
      overlay: "#100A09",
      grid: "#FFF5EF",
    },
  },
  graphite: {
    label: "Graphite",
    note: "Neutral · minimal",
    layout: "minimal",
    dark: true,
    swatches: ["#151618", "#E7E2D8", "#F6F5F2"],
    colors: {
      background: ["#111214", "#191A1D", "#141517"],
      glowA: "#D4CEC3",
      glowB: "#5A5B60",
      text: "#F6F5F2",
      textSoft: "#E6E2DB",
      muted: "#AAA6A0",
      dim: "#74716C",
      accent: "#E7E2D8",
      accent2: "#A49D91",
      line: "#F6F5F2",
      panel: "#202124",
      panelFill: "#F6F5F2",
      track: "#37383B",
      badgeText: "#D8D2C8",
      overlay: "#101113",
      grid: "#F6F5F2",
    },
  },
};

export const DEFAULT_CARD_CONFIG = Object.freeze({
  theme: "midnight",
  accent: "",
  backgroundUrl: "",
  backgroundCorners: {
    tl: 0.5,
    tr: 0.24,
    br: 0.38,
    bl: 0.16,
  },
  avatarUrl: "",
  mark: "",
  headlineOne: "",
  headlineTwo: "",
  intro: "",
  badge: "",
  footerNote: "",
});

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const ASSET_URL_KEYS = new Set(["backgroundUrl", "avatarUrl"]);

function text(value, maxLength) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maxLength);
}

function httpsUrl(value) {
  const candidate = text(value, 2048);
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function opacity(value, fallback) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(1, parsed));
}

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
    backgroundUrl: httpsUrl(merged.backgroundUrl),
    backgroundCorners: {
      tl: opacity(merged.backgroundCorners.tl, DEFAULT_CARD_CONFIG.backgroundCorners.tl),
      tr: opacity(merged.backgroundCorners.tr, DEFAULT_CARD_CONFIG.backgroundCorners.tr),
      br: opacity(merged.backgroundCorners.br, DEFAULT_CARD_CONFIG.backgroundCorners.br),
      bl: opacity(merged.backgroundCorners.bl, DEFAULT_CARD_CONFIG.backgroundCorners.bl),
    },
    avatarUrl: httpsUrl(merged.avatarUrl),
    mark: text(merged.mark, 24).toUpperCase(),
    headlineOne: text(merged.headlineOne, 42),
    headlineTwo: text(merged.headlineTwo, 48),
    intro: text(merged.intro, 120),
    badge: text(merged.badge, 64),
    footerNote: text(merged.footerNote, 64),
  };
}

export function configFromSearchParams(searchParams, defaults = DEFAULT_CARD_CONFIG) {
  const current = normalizeCardConfig(defaults);
  const input = {
    theme: searchParams.get("theme") || current.theme,
    accent: searchParams.get("accent") || current.accent,
    backgroundUrl: searchParams.get("bg") || current.backgroundUrl,
    avatarUrl: searchParams.get("photo") || current.avatarUrl,
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

export function isAssetUrlKey(key) {
  return ASSET_URL_KEYS.has(key);
}
