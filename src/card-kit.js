import { AVATAR_DATA_URI } from "./avatar.js";

export const CARD_WIDTH = 920;
export const CARD_HEIGHT = 1360;
export const OWNER_LOGIN = "dearlicy";

const WIDE_CHARACTER =
  /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe10-\ufe19\ufe30-\ufe6f\uff00-\uff60\uffe0-\uffe6]/u;

export function escapeXml(value) {
  return String(value)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

export function formatBytes(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} KB`;
  return `${value} B`;
}

export function formatDateTime(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day} ${value.hour}:${value.minute}`;
}

function initialsFor(data) {
  const source = (data.displayName || data.login || "GH").trim();
  const words = source.split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1
      ? words[0][0] + words[words.length - 1][0]
      : source.slice(0, 2);
  return initials.toUpperCase();
}

export function avatarMarkup(
  data,
  colors,
  {
    x,
    y,
    width,
    height = width,
    clipId,
    fontSize,
    shape = "circle",
    rx = 0,
  },
) {
  const source =
    data.avatarDataUri ||
    (data.login.toLowerCase() === OWNER_LOGIN ? AVATAR_DATA_URI : null);
  if (source) {
    return `<image href="${escapeXml(source)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`;
  }
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const fallback =
    shape === "rect"
      ? `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" fill="${colors.panel}" clip-path="url(#${clipId})"/>`
      : `<circle cx="${centerX}" cy="${centerY}" r="${Math.min(width, height) / 2}" fill="${colors.panel}" clip-path="url(#${clipId})"/>`;
  return `
    ${fallback}
    <text x="${centerX}" y="${centerY + fontSize * 0.34}" fill="${colors.text}" class="sans" font-size="${fontSize}" font-weight="650" letter-spacing="1" text-anchor="middle">${escapeXml(initialsFor(data))}</text>
  `;
}

function glyphWidth(character, mono) {
  if (WIDE_CHARACTER.test(character)) return 1;
  const codePoint = character.codePointAt(0) || 0;
  if (codePoint >= 0x1f000) return 1.15;
  if (mono) return /\s/.test(character) ? 0.6 : 0.62;
  if (/\s/.test(character)) return 0.28;
  if (/[iljtfrI.,:;'!|`]/.test(character)) return 0.31;
  if (character === "W") return 1.02;
  if (character === "M") return 0.86;
  if (/[mw@%&#]/.test(character)) return 0.9;
  if (/[A-Z]/.test(character)) return 0.68;
  if (/[a-z]/.test(character)) return 0.54;
  if (/[0-9]/.test(character)) return 0.58;
  return 0.48;
}

export function estimateTextWidth(
  value,
  { fontSize = 14, mono = false, letterSpacing = 0, weight = 400 } = {},
) {
  const characters = Array.from(String(value ?? ""));
  if (!characters.length) return 0;
  const glyphUnits = characters.reduce(
    (total, character) => total + glyphWidth(character, mono),
    0,
  );
  return (
    glyphUnits * fontSize +
    Math.max(0, characters.length - 1) * letterSpacing +
    (weight >= 600 ? characters.length * 0.18 : 0)
  );
}

export function fitText(
  value,
  {
    fontSize = 14,
    minFontSize = 9,
    maxWidth = Infinity,
    mono = false,
    letterSpacing = 0,
    weight = 400,
  } = {},
) {
  const raw = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!raw) return { text: "", fontSize, width: 0 };
  const measure = (candidate, size) =>
    estimateTextWidth(candidate, { fontSize: size, mono, letterSpacing, weight });
  let size = fontSize;
  while (size > minFontSize && measure(raw, size) > maxWidth) {
    size = Math.max(minFontSize, Number((size - 0.5).toFixed(1)));
  }
  const width = measure(raw, size);
  if (width <= maxWidth) return { text: raw, fontSize: size, width };

  const characters = Array.from(raw);
  let low = 1;
  let high = characters.length - 1;
  let text = "…";
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = `${characters.slice(0, middle).join("").trimEnd()}…`;
    if (measure(candidate, size) <= maxWidth) {
      text = candidate;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return { text, fontSize: size, width: measure(text, size) };
}

function profileCopy(data, config) {
  const isOwner = data.login.toLowerCase() === OWNER_LOGIN;
  const topRepository = data.topRepositories[0]?.name;
  const displayName = (data.displayName || data.login).slice(0, 34);
  const brandSubtitle =
    displayName.toLowerCase() === data.login.toLowerCase()
      ? "GITHUB CREATOR · PUBLIC PROFILE"
      : `${displayName} · GITHUB CREATOR`;
  const project = (topRepository || data.login).slice(0, 28);
  const technologies = data.languages
    .slice(0, 8)
    .map((language) => language.name.toUpperCase())
    .join(" · ");
  const footerTech =
    technologies.length > 96
      ? `${technologies.slice(0, 93).trimEnd()} · …`
      : technologies;

  return {
    mark: config.mark || data.login.toUpperCase(),
    brandSubtitle,
    headlineOne:
      config.headlineOne ||
      (isOwner ? "Thoughtful tools" : "Open source,"),
    headlineTwo:
      config.headlineTwo ||
      (isOwner ? "for the AI-native era." : "built in public."),
    intro:
      config.intro ||
      (isOwner
        ? "独立开发者 · 把复杂的 AI 能力，做成清晰、可靠、每天都会用的产品。"
        : "公开仓库 · 语言构成 · 年度贡献，一张卡片实时呈现。"),
    buildingLabel: (
      config.badge ||
      `${isOwner ? "CURRENTLY BUILDING" : "TOP PROJECT"} · ${project}`
    ).toUpperCase(),
    contextLine: isOwner
      ? "AI TOOLING   ·   DESKTOP EXPERIENCES   ·   WEB INFRASTRUCTURE"
      : "PUBLIC REPOSITORIES   ·   LANGUAGE MIX   ·   LIVE ACTIVITY",
    footerIdentity: isOwner ? "x.com/DearLicy" : "GITHUB API / PUBLIC DATA",
    footerNote: config.footerNote || "BUILD WITH CARE.",
    footerTech: footerTech || "OPEN SOURCE · PUBLIC BY DEFAULT · LIVE PROFILE",
  };
}

export function createCardModel(data, config) {
  const copy = profileCopy(data, config);
  return {
    ...copy,
    login: data.login,
    displayName: data.displayName || data.login,
    avatarDataUri: data.avatarDataUri,
    stars: Number(data.stars) || 0,
    repositories: Number(data.repositories) || 0,
    followers: Number(data.followers) || 0,
    contributions: Number(data.contributions) || 0,
    languageCount: data.languages.length,
    languages: data.languages.slice(0, 6),
    totalLanguageBytes: Number(data.totalLanguageBytes) || 1,
    repositoriesTop: data.topRepositories.slice(0, 4),
    rank: {
      level: data.rank.level,
      score: Number(data.rank.score) || 0,
      percentile: Number(data.rank.percentile) || 0,
    },
    syncLabel: formatDateTime(data.fetchedAt),
    dataLabel:
      data.dataTier === "basic"
        ? "PUBLIC DATA · TOKEN OPTIONAL"
        : "DATA FETCHED FROM THE GITHUB API",
  };
}

export function openSvg(model) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" fill="none" role="img" aria-labelledby="profile-title profile-desc">
  <title id="profile-title">${escapeXml(model.displayName)} / ${escapeXml(model.login)} — GitHub profile</title>
  <desc id="profile-desc">Dynamic GitHub profile for ${escapeXml(model.login)} with ${formatNumber(model.stars)} total stars, rank ${escapeXml(model.rank.level)}, ${formatNumber(model.repositories)} repositories and top languages.</desc>`;
}

export const COMMON_STYLE = `
  .sans { font-family: "Inter", "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif; }
  .serif { font-family: "Iowan Old Style", "Palatino Linotype", Georgia, "Songti SC", serif; }
  .mono { font-family: "SFMono-Regular", Menlo, Consolas, monospace; }
  .tabular { font-variant-numeric: tabular-nums; }
  .rise { animation: rise .62s cubic-bezier(.22,1,.36,1) both; }
  .soft-rise { animation: softRise .9s cubic-bezier(.22,1,.36,1) both; }
  .live-dot { transform-box: fill-box; transform-origin: center; animation: livePulse 2.1s ease-in-out infinite; }
  .twinkle { transform-box: fill-box; transform-origin: center; animation: twinkle 4.8s ease-in-out infinite; }
  .twinkle-1 { animation-delay: 1.1s; }
  .twinkle-2 { animation-delay: 2.3s; }
  .twinkle-3 { animation-delay: 3.2s; }
  .breathe { animation: breathe 7s ease-in-out infinite; }
  @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes softRise { from { opacity: 0; transform: translateY(14px); filter: blur(3px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
  @keyframes livePulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .3; transform: scale(.72); } }
  @keyframes twinkle { 0%,100% { opacity: .2; transform: scale(.72); } 50% { opacity: .9; transform: scale(1.2); } }
  @keyframes breathe { 0%,100% { opacity: .72; } 50% { opacity: .24; } }
  @media (prefers-reduced-motion: reduce) {
    .rise { animation: none; opacity: 1; transform: none; }
    .soft-rise { animation: none; opacity: 1; transform: none; filter: none; }
    .live-dot, .twinkle, .breathe { animation: none; }
  }
`;

export function backgroundCells(config) {
  const columns = 14;
  const rows = 20;
  const cellWidth = CARD_WIDTH / columns;
  const cellHeight = CARD_HEIGHT / rows;
  const { tl, tr, br, bl } = config.backgroundCorners;
  const cells = [];
  for (let row = 0; row < rows; row += 1) {
    const v = row / (rows - 1);
    for (let column = 0; column < columns; column += 1) {
      const u = column / (columns - 1);
      const opacity =
        tl * (1 - u) * (1 - v) +
        tr * u * (1 - v) +
        bl * (1 - u) * v +
        br * u * v;
      cells.push(
        `<rect x="${(column * cellWidth).toFixed(2)}" y="${(row * cellHeight).toFixed(2)}" width="${(cellWidth + 1).toFixed(2)}" height="${(cellHeight + 1).toFixed(2)}" fill="#FFFFFF" fill-opacity="${opacity.toFixed(4)}"/>`,
      );
    }
  }
  return cells.join("");
}

export function backgroundLayer(
  config,
  colors,
  backgroundDataUri,
  prefix,
  { overlayOpacity = 0.12 } = {},
) {
  if (!backgroundDataUri) return { defs: "", body: "" };
  return {
    defs: `
      <filter id="${prefix}-bg-soften" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="26"/>
      </filter>`,
    body: `
      <mask id="${prefix}-bg-opacity" maskUnits="userSpaceOnUse" x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}">
        <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="#000000"/>
        <g filter="url(#${prefix}-bg-soften)">${backgroundCells(config)}</g>
      </mask>
      <image href="${escapeXml(backgroundDataUri)}" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" preserveAspectRatio="xMidYMid slice" mask="url(#${prefix}-bg-opacity)"/>
      <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="${colors.overlay}" fill-opacity="${overlayOpacity}"/>`,
  };
}

export function starField(colors, count = 14) {
  const points = [
    [402, 50, 1.1, 0.1],
    [548, 34, 0.8, 0.7],
    [690, 64, 1.4, 1.2],
    [902, 264, 0.9, 0.4],
    [640, 318, 0.7, 1.6],
    [58, 323, 0.9, 0.9],
    [222, 44, 0.7, 2.1],
    [842, 744, 0.8, 0.2],
    [72, 660, 1.1, 1.4],
    [858, 914, 0.7, 0.8],
    [68, 1120, 0.8, 1.9],
    [820, 1234, 1.1, 0.5],
    [382, 1232, 0.7, 1.1],
    [491, 96, 0.6, 2.4],
  ].slice(0, count);
  return points
    .map(
      ([cx, cy, radius, delay], index) => `
        <circle class="twinkle twinkle-${index % 4}" cx="${cx}" cy="${cy}" r="${radius}" fill="${colors.accent}" fill-opacity=".58" style="animation-delay:${delay}s"/>`,
    )
    .join("");
}
