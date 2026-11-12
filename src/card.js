import { AVATAR_DATA_URI } from "./avatar.js";
import {
  DEFAULT_CARD_CONFIG,
  normalizeCardConfig,
  themePalette,
} from "./config.js";

const CARD_WIDTH = 920;
const CARD_HEIGHT = 1360;
const OWNER_LOGIN = "dearlicy";

function escapeXml(value) {
  return String(value)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function number(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function bytes(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} KB`;
  return `${value} B`;
}

function dateTime(date) {
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

function avatarMarkup(data, colors, { x, y, size, clipId, fontSize }) {
  const source =
    data.avatarDataUri ||
    (data.login.toLowerCase() === OWNER_LOGIN ? AVATAR_DATA_URI : null);
  if (source) {
    return `<image href="${escapeXml(source)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`;
  }
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  return `
    <circle cx="${centerX}" cy="${centerY}" r="${size / 2}" fill="${colors.panel}" clip-path="url(#${clipId})"/>
    <text x="${centerX}" y="${centerY + fontSize * 0.34}" fill="${colors.text}" class="sans" font-size="${fontSize}" font-weight="650" letter-spacing="1" text-anchor="middle">${escapeXml(initialsFor(data))}</text>
  `;
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

function backgroundCells(config) {
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

function backgroundLayers(config, colors, backgroundDataUri) {
  if (!backgroundDataUri) return "";
  return `
    <mask id="background-opacity-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}">
      <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="#000000"/>
      <g filter="url(#background-mask-soften)">${backgroundCells(config)}</g>
    </mask>
    <image href="${escapeXml(backgroundDataUri)}" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" preserveAspectRatio="xMidYMid slice" mask="url(#background-opacity-mask)"/>
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="${colors.overlay}" fill-opacity=".12"/>
  `;
}

function starField(colors, count = 14) {
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

function orbitVisual(data, colors) {
  return `
    <g>
      <circle cx="760" cy="190" r="144" stroke="${colors.line}" stroke-opacity=".06"/>
      <circle cx="760" cy="190" r="118" stroke="${colors.line}" stroke-opacity=".09"/>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 760 190" to="360 760 190" dur="34s" repeatCount="indefinite"/>
        <circle cx="760" cy="190" r="132" stroke="${colors.line}" stroke-opacity=".13" stroke-dasharray="1 9"/>
        <circle cx="760" cy="58" r="3.4" fill="${colors.accent}"/>
        <circle cx="877" cy="255" r="2.5" fill="${colors.accent}" fill-opacity=".75"/>
        <circle cx="624" cy="166" r="2.3" fill="${colors.line}" fill-opacity=".3"/>
      </g>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="360 760 190" to="0 760 190" dur="21s" repeatCount="indefinite"/>
        <path d="M760 94A96 96 0 0 1 856 190" stroke="${colors.accent}" stroke-opacity=".84" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="856" cy="190" r="3.2" fill="${colors.accent}"/>
        <path d="M878 178l6 6-6 6" stroke="${colors.accent}" stroke-opacity=".48" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 760 190" to="360 760 190" dur="15s" repeatCount="indefinite"/>
        <circle cx="760" cy="190" r="82" stroke="${colors.accent}" stroke-opacity=".26" stroke-dasharray="2 7"/>
      </g>
      <circle class="breathe" cx="760" cy="190" r="72" stroke="${colors.accent}" stroke-opacity=".2"/>
      <circle cx="760" cy="190" r="62" fill="${colors.panel}" stroke="url(#avatar-ring)" stroke-width="1.6"/>
      ${avatarMarkup(data, colors, {
        x: 698,
        y: 128,
        size: 124,
        clipId: "avatar-large-clip",
        fontSize: 42,
      })}
      <circle cx="760" cy="190" r="61" stroke="${colors.line}" stroke-opacity=".13"/>
    </g>
  `;
}

function frameVisual(data, colors) {
  return `
    <g class="breathe">
      <rect x="662" y="92" width="196" height="196" rx="48" fill="${colors.accent}" fill-opacity=".055" stroke="${colors.accent}" stroke-opacity=".2"/>
    </g>
    <rect x="676" y="106" width="168" height="168" rx="40" fill="${colors.panel}" stroke="${colors.line}" stroke-opacity=".1"/>
    <path d="M690 155v-28h28M802 225v28h-28" stroke="${colors.accent}" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${avatarMarkup(data, colors, {
      x: 688,
      y: 118,
      size: 144,
      clipId: "avatar-frame-clip",
      fontSize: 46,
    })}
    <text x="760" y="318" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1.5" text-anchor="middle">OPEN SOURCE / PUBLIC PROFILE</text>
  `;
}

function terminalVisual(data, colors) {
  return `
    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 760 190" to="360 760 190" dur="42s" repeatCount="indefinite"/>
      <circle cx="760" cy="190" r="120" stroke="${colors.accent}" stroke-opacity=".18" stroke-dasharray="1 11"/>
    </g>
    <circle cx="760" cy="190" r="102" stroke="${colors.line}" stroke-opacity=".09"/>
    <circle cx="760" cy="190" r="88" stroke="${colors.accent}" stroke-opacity=".33" stroke-dasharray="26 7 3 7"/>
    <circle cx="760" cy="190" r="68" fill="${colors.panel}" stroke="${colors.accent}" stroke-opacity=".52"/>
    ${avatarMarkup(data, colors, {
      x: 694,
      y: 124,
      size: 132,
      clipId: "avatar-terminal-clip",
      fontSize: 44,
    })}
    <text x="760" y="296" fill="${colors.accent}" class="mono" font-size="8.5" letter-spacing="1.2" text-anchor="middle">&gt; github/live</text>
  `;
}

function minimalVisual(data, colors) {
  return `
    <circle cx="760" cy="190" r="104" fill="${colors.accent}" fill-opacity=".04"/>
    <circle cx="760" cy="190" r="87" stroke="${colors.line}" stroke-opacity=".1"/>
    <path d="M673 190h-28M875 190h-28M760 53v-25M760 352v-25" stroke="${colors.accent}" stroke-opacity=".48" stroke-linecap="round"/>
    <circle cx="760" cy="190" r="74" fill="${colors.panel}" stroke="${colors.line}" stroke-opacity=".14"/>
    ${avatarMarkup(data, colors, {
      x: 686,
      y: 116,
      size: 148,
      clipId: "avatar-minimal-clip",
      fontSize: 48,
    })}
    <text x="760" y="320" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1.4" text-anchor="middle">PUBLIC PROFILE / LIVE</text>
  `;
}

function profileVisual(data, theme) {
  if (theme.layout === "frame") return frameVisual(data, theme.colors);
  if (theme.layout === "terminal") return terminalVisual(data, theme.colors);
  if (theme.layout === "minimal") return minimalVisual(data, theme.colors);
  return orbitVisual(data, theme.colors);
}

function rankGauge(rank, colors) {
  const radius = 91;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, rank.percentile));
  const score = Math.max(0, Math.min(100, rank.score ?? rank.percentile));
  const filled = (circumference * progress) / 100;
  return `
    <g class="rise" style="animation-delay:.18s">
      <text x="442" y="399" fill="${colors.muted}" class="sans" font-size="9.5" font-weight="600" letter-spacing="1.6" text-anchor="middle">RANK</text>
      <circle cx="442" cy="490" r="${radius}" stroke="${colors.line}" stroke-opacity=".075" stroke-width="7"/>
      <circle cx="442" cy="490" r="${radius}" stroke="url(#gauge)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${filled.toFixed(2)} ${circumference.toFixed(2)}" transform="rotate(-90 442 490)">
        <animate attributeName="stroke-dasharray" from="0 ${circumference.toFixed(2)}" to="${filled.toFixed(2)} ${circumference.toFixed(2)}" dur="1.7s" fill="freeze"/>
      </circle>
      <circle cx="442" cy="490" r="34" fill="${colors.accent}" fill-opacity=".055" stroke="${colors.accent}" stroke-opacity=".16"/>
      <text x="442" y="501" fill="${colors.text}" class="sans" font-size="38" font-weight="600" text-anchor="middle">${escapeXml(rank.level)}</text>
      <text x="442" y="535" fill="${colors.textSoft}" class="mono tabular" font-size="10.5" letter-spacing=".5" text-anchor="middle">${score.toFixed(1)} / 100</text>
      <text x="442" y="601" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".85" text-anchor="middle">RANK PERCENTILE · LOWER IS BETTER</text>
    </g>
  `;
}

function languages(data, colors) {
  const top = data.languages.slice(0, 6);
  const total = data.totalLanguageBytes || 1;
  const shown = top.reduce((sum, language) => sum + language.bytes, 0);
  const rest = Math.max(total - shown, 0);
  const barX = 52;
  const barY = 684;
  const barWidth = 816;
  let cursor = 0;

  const segments = top.map((language) => {
    const width = (language.bytes / (shown + rest || 1)) * barWidth;
    const segment = `<rect x="${barX + cursor}" y="${barY}" width="${width.toFixed(2)}" height="14" fill="${escapeXml(language.color)}"/>`;
    cursor += width;
    return segment;
  });
  if (rest > 0) {
    segments.push(
      `<rect x="${barX + cursor}" y="${barY}" width="${Math.max(barWidth - cursor, 0).toFixed(2)}" height="14" fill="${colors.track}"/>`,
    );
  }

  const rows = top.map((language, index) => {
    const column = index < 3 ? 0 : 1;
    const row = index % 3;
    const x = column === 0 ? 52 : 488;
    const y = 746 + row * 39;
    const percent = (language.bytes / (shown + rest || 1)) * 100;
    return `
      <g class="rise" style="animation-delay:${(0.34 + index * 0.05).toFixed(2)}s">
        <circle cx="${x + 4}" cy="${y - 4}" r="3.6" fill="${escapeXml(language.color)}"/>
        <text x="${x + 16}" y="${y}" fill="${colors.textSoft}" class="sans" font-size="12.5">${escapeXml(language.name)}</text>
        <text x="${x + 368}" y="${y}" fill="${colors.dim}" class="mono" font-size="9.5" text-anchor="end">${percent.toFixed(1)}%</text>
      </g>
    `;
  });

  return `
    <text x="52" y="648" fill="${colors.muted}" class="mono" font-size="9.5" letter-spacing="1.6">TOP LANGUAGES</text>
    <text x="868" y="648" fill="${colors.dim}" class="mono" font-size="8.5" letter-spacing="1.1" text-anchor="end">${bytes(data.totalLanguageBytes).toUpperCase()} / ${data.languages.length} DETECTED</text>
    <g clip-path="url(#language-bar-clip)">
      ${segments.join("")}
    </g>
    <rect x="${barX + 0.5}" y="${barY + 0.5}" width="${barWidth - 1}" height="13" rx="6.5" stroke="${colors.line}" stroke-opacity=".1"/>
    ${rows.join("")}
    <path d="M52 858H868" stroke="${colors.line}" stroke-opacity=".09"/>
  `;
}

function repositories(data, colors) {
  const maxStars = Math.max(
    ...data.topRepositories.map((repository) => repository.stars),
    1,
  );
  const cards = data.topRepositories
    .map((repository, index) => {
      const x = index % 2 === 0 ? 52 : 472;
      const y = index < 2 ? 922 : 1012;
      const fill = Math.max(4, (repository.stars / maxStars) * 358);
      return `
        <g class="rise" style="animation-delay:${(0.52 + index * 0.08).toFixed(2)}s">
          <rect x="${x}" y="${y}" width="396" height="78" rx="18" fill="${colors.panelFill}" fill-opacity=".04" stroke="${colors.line}" stroke-opacity=".1"/>
          <text x="${x + 18}" y="${y + 30}" fill="${colors.textSoft}" class="sans" font-size="14.5" font-weight="600">${escapeXml(repository.name)}</text>
          <path d="M${x + 20} ${y + 48}l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8L${x + 20} ${y + 48}Z" fill="${colors.accent}" fill-opacity=".92"/>
          <text x="${x + 35}" y="${y + 59}" fill="${colors.muted}" class="mono" font-size="9">${number(repository.stars)}</text>
          <rect x="${x + 18}" y="${y + 67}" width="358" height="3" rx="1.5" fill="${colors.line}" fill-opacity=".09"/>
          <rect x="${x + 18}" y="${y + 67}" width="${fill.toFixed(1)}" height="3" rx="1.5" fill="${colors.accent}" fill-opacity=".58"/>
        </g>
      `;
    })
    .join("");

  return `
    <text x="52" y="898" fill="${colors.muted}" class="mono" font-size="9.5" letter-spacing="1.6">FEATURED REPOSITORIES</text>
    <text x="868" y="898" fill="${colors.dim}" class="mono" font-size="8.5" letter-spacing="1.1" text-anchor="end">SORTED BY STARS</text>
    ${cards}
    <path d="M52 1126H868" stroke="${colors.line}" stroke-opacity=".09"/>
  `;
}

function metrics(data, colors) {
  const entries = [
    ["FOLLOWERS", data.followers],
    ["REPOSITORIES", data.repositories],
    ["1Y CONTRIBUTIONS", data.contributions],
    ["LANGUAGES", data.languages.length],
  ];
  return entries
    .map(([label, value], index) => {
      const y = 408 + index * 47;
      return `
        <text x="640" y="${y}" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.1">${label}</text>
        <text x="868" y="${y + 1}" fill="${colors.textSoft}" class="sans tabular" font-size="18" font-weight="600" text-anchor="end">${number(value)}</text>
        ${index < entries.length - 1 ? `<path d="M640 ${y + 21}H868" stroke="${colors.line}" stroke-opacity=".075"/>` : ""}
      `;
    })
    .join("");
}

function backgroundDefinitions(backgroundDataUri) {
  if (!backgroundDataUri) return "";
  return `
    <filter id="background-mask-soften" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
  `;
}

function avatarClipPaths() {
  return `
    <clipPath id="avatar-small-clip">
      <circle cx="78" cy="78" r="24"/>
    </clipPath>
    <clipPath id="avatar-large-clip">
      <circle cx="760" cy="190" r="62"/>
    </clipPath>
    <clipPath id="avatar-frame-clip">
      <rect x="688" y="118" width="144" height="144" rx="34"/>
    </clipPath>
    <clipPath id="avatar-terminal-clip">
      <circle cx="760" cy="190" r="66"/>
    </clipPath>
    <clipPath id="avatar-minimal-clip">
      <circle cx="760" cy="190" r="74"/>
    </clipPath>
  `;
}

export function renderProfileCard(
  data,
  configInput = DEFAULT_CARD_CONFIG,
  { backgroundDataUri = "" } = {},
) {
  const config = normalizeCardConfig(configInput);
  const theme = themePalette(config);
  const colors = theme.colors;
  const syncLabel = dateTime(data.fetchedAt);
  const copy = profileCopy(data, config);
  const buildingWidth = Math.min(
    580,
    Math.max(250, 70 + copy.buildingLabel.length * 5.5),
  );
  const dataLabel =
    data.dataTier === "basic"
      ? "PUBLIC DATA · TOKEN OPTIONAL"
      : "DATA FETCHED FROM THE GITHUB API";
  const starCount =
    theme.layout === "minimal" ? 7 : theme.layout === "frame" ? 0 : 14;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" fill="none" role="img" aria-labelledby="profile-title profile-desc">
  <title id="profile-title">${escapeXml(data.displayName)} / ${escapeXml(data.login)} — GitHub profile</title>
  <desc id="profile-desc">Dynamic GitHub profile for ${escapeXml(data.login)} with ${number(data.stars)} total stars, rank ${escapeXml(data.rank.level)}, ${number(data.repositories)} repositories and top languages.</desc>
  <defs>
    <linearGradient id="card-bg" x1="0" y1="0" x2="920" y2="1360" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.background[0]}"/>
      <stop offset=".52" stop-color="${colors.background[1]}"/>
      <stop offset="1" stop-color="${colors.background[2]}"/>
    </linearGradient>
    <radialGradient id="hero-glow" cx="0" cy="0" r="1" gradientTransform="translate(738 150) rotate(90) scale(330 420)" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.glowA}" stop-opacity="${theme.dark ? ".17" : ".11"}"/>
      <stop offset="1" stop-color="${colors.glowA}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="footer-glow" cx="0" cy="0" r="1" gradientTransform="translate(210 1190) rotate(-18) scale(310 520)" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.glowB}" stop-opacity="${theme.dark ? ".11" : ".08"}"/>
      <stop offset="1" stop-color="${colors.glowB}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="avatar-ring" x1="698" y1="128" x2="822" y2="252" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.text}"/>
      <stop offset=".55" stop-color="${colors.accent}"/>
      <stop offset="1" stop-color="${colors.accent2}"/>
    </linearGradient>
    <linearGradient id="gauge" x1="351" y1="399" x2="533" y2="581" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.text}"/>
      <stop offset=".55" stop-color="${colors.accent}"/>
      <stop offset="1" stop-color="${colors.accent2}"/>
    </linearGradient>
    <linearGradient id="shimmer" x1="0" y1="0" x2="140" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.line}" stop-opacity="0"/>
      <stop offset=".48" stop-color="${colors.line}" stop-opacity=".52"/>
      <stop offset="1" stop-color="${colors.line}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" stroke="${colors.grid}" stroke-opacity=".035"/>
    </pattern>
    <clipPath id="card-clip">
      <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="28"/>
    </clipPath>
    ${avatarClipPaths()}
    <clipPath id="language-bar-clip">
      <rect x="52" y="684" width="816" height="14" rx="7"/>
    </clipPath>
    ${backgroundDefinitions(backgroundDataUri)}
  </defs>
  <style>
    .sans { font-family: "Inter", "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif; }
    .mono { font-family: "SFMono-Regular", Menlo, Consolas, monospace; }
    .tabular { font-variant-numeric: tabular-nums; }
    .rise { animation: rise .58s cubic-bezier(.22,1,.36,1) both; }
    .live-dot { transform-box: fill-box; transform-origin: center; animation: livePulse 2.1s ease-in-out infinite; }
    .twinkle { transform-box: fill-box; transform-origin: center; animation: twinkle 4.8s ease-in-out infinite; }
    .twinkle-1 { animation-delay: 1.1s; }
    .twinkle-2 { animation-delay: 2.3s; }
    .twinkle-3 { animation-delay: 3.2s; }
    .breathe { animation: breathe 7s ease-in-out infinite; }
    @keyframes rise { from { transform: translateY(9px); } to { transform: translateY(0); } }
    @keyframes livePulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .28; transform: scale(.72); } }
    @keyframes twinkle { 0%,100% { opacity: .2; transform: scale(.75); } 50% { opacity: .84; transform: scale(1.18); } }
    @keyframes breathe { 0%,100% { opacity: .72; } 50% { opacity: .24; } }
    @media (prefers-reduced-motion: reduce) {
      .rise { animation: none; opacity: 1; transform: none; }
      .live-dot, .twinkle, .breathe { animation: none; }
    }
  </style>
  <g clip-path="url(#card-clip)">
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#card-bg)"/>
    ${backgroundLayers(config, colors, backgroundDataUri)}
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#hero-glow)"/>
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#footer-glow)"/>
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#grid)"/>
    ${starField(colors, starCount)}
    <g transform="rotate(18 460 660)" opacity="${theme.dark ? ".05" : ".035"}">
      <rect x="-480" y="-180" width="150" height="1760" fill="url(#shimmer)">
        <animate attributeName="x" values="-560;1480" dur="11s" repeatCount="indefinite"/>
      </rect>
    </g>

    <circle cx="78" cy="78" r="25" fill="${colors.panel}" stroke="url(#avatar-ring)" stroke-opacity=".56"/>
    ${avatarMarkup(data, colors, {
      x: 54,
      y: 54,
      size: 48,
      clipId: "avatar-small-clip",
      fontSize: 16,
    })}
    <text x="118" y="70" fill="${colors.text}" class="sans" font-size="13.5" font-weight="700" letter-spacing="2.6">${escapeXml(copy.mark)}</text>
    <text x="118" y="88" fill="${colors.muted}" class="sans" font-size="10.5" font-weight="500" letter-spacing="1.5">${escapeXml(copy.brandSubtitle)}</text>
    <g>
      <circle class="live-dot" cx="780" cy="53" r="3.2" fill="${colors.accent}"/>
      <text x="792" y="57" fill="${colors.muted}" class="mono" font-size="9" letter-spacing="1.4">LIVE PROFILE</text>
    </g>
    <text x="868" y="86" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1.2" text-anchor="end">PUBLIC / LIVE</text>

    <text x="52" y="165" fill="${colors.text}" class="sans" font-size="56" font-weight="600" letter-spacing="-1.8">${escapeXml(copy.headlineOne)}</text>
    <text x="52" y="223" fill="${colors.accent}" class="sans" font-size="56" font-weight="600" letter-spacing="-1.8">${escapeXml(copy.headlineTwo)}</text>
    <text x="54" y="262" fill="${colors.muted}" class="sans" font-size="14.5">${escapeXml(copy.intro)}</text>
    <g class="rise" style="animation-delay:.1s">
      <rect x="52" y="284" width="${buildingWidth.toFixed(1)}" height="28" rx="14" fill="${colors.accent}" fill-opacity=".075" stroke="${colors.accent}" stroke-opacity=".2"/>
      <circle cx="68" cy="298" r="3" fill="${colors.accent}"/>
      <text x="78" y="302" fill="${colors.badgeText}" class="mono" font-size="8.5" letter-spacing=".8">${escapeXml(copy.buildingLabel)}</text>
    </g>
    <text x="52" y="333" fill="${colors.dim}" class="mono" font-size="8.5" letter-spacing="1.4">${escapeXml(copy.contextLine)}</text>
    ${profileVisual(data, theme)}
    <path d="M52 356H868" stroke="${colors.line}" stroke-opacity=".1"/>

    <text x="52" y="386" fill="${colors.muted}" class="mono" font-size="9.5" letter-spacing="1.6">GITHUB / LIVE SNAPSHOT</text>
    <text x="868" y="386" fill="${colors.dim}" class="mono" font-size="8" letter-spacing=".9" text-anchor="end">SYNCED ${syncLabel} CST</text>

    <g class="rise" style="animation-delay:.08s">
      <path d="M59 405l4.2 8.7 9.6 1.4-6.9 6.7 1.6 9.5-8.5-4.5-8.5 4.5 1.6-9.5-6.9-6.7 9.6-1.4L59 405Z" fill="${colors.accent}"/>
      <text x="82" y="422" fill="${colors.muted}" class="sans" font-size="9.5" font-weight="600" letter-spacing="1.4">TOTAL STARS</text>
      <text x="52" y="520" fill="${colors.text}" class="sans tabular" font-size="94" font-weight="600" letter-spacing="-4.2">${number(data.stars)}</text>
      <text x="54" y="544" fill="${colors.dim}" class="mono" font-size="8.2" letter-spacing="1">ACROSS ${number(data.repositories)} REPOSITORIES</text>
    </g>
    ${rankGauge(data.rank, colors)}
    ${metrics(data, colors)}
    <path d="M52 614H868" stroke="${colors.line}" stroke-opacity=".085"/>

    ${languages(data, colors)}
    ${repositories(data, colors)}

    <text x="52" y="1170" fill="${colors.textSoft}" class="sans" font-size="16" font-weight="500">github.com/${escapeXml(data.login)}</text>
    <text x="52" y="1196" fill="${colors.muted}" class="mono" font-size="10" letter-spacing=".4">${escapeXml(copy.footerIdentity)}</text>
    <text x="868" y="1170" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.3" text-anchor="end">${escapeXml(copy.footerNote)}</text>
    <text x="868" y="1196" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">DYNAMIC SVG · 5 MIN CACHE</text>
    <text x="52" y="1234" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1.2">${escapeXml(copy.footerTech)}</text>
    <g>
      <circle class="live-dot" cx="52" cy="1270" r="3" fill="${colors.accent}"/>
      <text x="64" y="1274" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.1">${dataLabel}</text>
      <text x="868" y="1274" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">UPDATED ${syncLabel} CST</text>
    </g>
  </g>
  <rect x=".75" y=".75" width="918.5" height="1358.5" rx="27.5" stroke="${colors.line}" stroke-opacity=".13"/>
</svg>`;
}

export function renderErrorCard(
  {
    title = "Live data is taking a moment.",
    message = "The dynamic card will return automatically after the next refresh.",
    detail = "Upstream data is temporarily unavailable.",
  } = {},
  configInput = DEFAULT_CARD_CONFIG,
) {
  const theme = themePalette(normalizeCardConfig(configInput));
  const colors = theme.colors;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="300" viewBox="0 0 920 300" fill="none" role="img" aria-labelledby="error-title">
  <title id="error-title">${escapeXml(title)}</title>
  <defs>
    <linearGradient id="error-bg" x1="0" y1="0" x2="920" y2="300" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.background[0]}"/>
      <stop offset="1" stop-color="${colors.background[1]}"/>
    </linearGradient>
    <pattern id="error-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" stroke="${colors.grid}" stroke-opacity=".035"/>
    </pattern>
  </defs>
  <rect width="920" height="300" rx="28" fill="url(#error-bg)"/>
  <rect width="920" height="300" rx="28" fill="url(#error-grid)"/>
  <circle cx="76" cy="80" r="4" fill="${colors.accent}"/>
  <text x="92" y="85" fill="${colors.muted}" class="mono" font-family="Menlo, monospace" font-size="9" letter-spacing="1.5">LIVE PROFILE</text>
  <text x="52" y="156" fill="${colors.text}" font-family="Inter, sans-serif" font-size="42" font-weight="600">${escapeXml(title).slice(0, 64)}</text>
  <text x="52" y="194" fill="${colors.muted}" font-family="Inter, sans-serif" font-size="15">${escapeXml(message).slice(0, 120)}</text>
  <text x="52" y="232" fill="${colors.dim}" font-family="Menlo, monospace" font-size="9">${escapeXml(detail).slice(0, 120)}</text>
  <rect x=".75" y=".75" width="918.5" height="298.5" rx="27.5" stroke="${colors.line}" stroke-opacity=".13"/>
</svg>`;
}
