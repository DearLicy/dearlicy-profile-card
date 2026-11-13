import {
  CARD_HEIGHT,
  CARD_WIDTH,
  COMMON_STYLE,
  avatarMarkup,
  backgroundLayer,
  escapeXml,
  estimateTextWidth,
  fitText,
  formatBytes,
  formatNumber,
  openSvg,
} from "../card-kit.js";
import {
  WHALE_BADGE_DATA_URI,
  WHALE_COMPANION_DATA_URI,
  WHALE_HERO_DATA_URI,
} from "../theme-assets.js";

const PREFIX = "wh";

function wrapText(
  value,
  {
    fontSize = 13,
    maxWidth = 330,
    maxLines = 3,
    mono = false,
    weight = 400,
    letterSpacing = 0,
  } = {},
) {
  const raw = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!raw) return [];
  const measure = (line) =>
    estimateTextWidth(line, { fontSize, mono, weight, letterSpacing });
  if (measure(raw) <= maxWidth) return [raw];

  const cjk = /[\u3400-\u9fff]/.test(raw);
  const units = cjk ? Array.from(raw) : raw.split(" ");
  const lines = [];
  let current = "";
  for (const unit of units) {
    const candidate = current
      ? cjk
        ? current + unit
        : `${current} ${unit}`
      : unit;
    if (measure(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
      current = "";
    }
    if (measure(unit) <= maxWidth) {
      current = unit;
      continue;
    }
    for (const character of Array.from(unit)) {
      const next = current + character;
      if (measure(next) <= maxWidth || !current) {
        current = next;
      } else {
        lines.push(current);
        current = character;
      }
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;

  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last && measure(`${last}…`) > maxWidth) {
    last = last.slice(0, -1);
  }
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return kept;
}

function sonarBackdrop(colors) {
  return `
    <g opacity=".62">
      <circle cx="688" cy="604" r="318" fill="${colors.accent}" fill-opacity=".018"/>
      <circle cx="688" cy="604" r="318" stroke="${colors.line}" stroke-opacity=".055" stroke-dasharray="1 10"/>
      <circle cx="688" cy="604" r="264" stroke="${colors.line}" stroke-opacity=".045"/>
      <circle cx="688" cy="604" r="204" stroke="${colors.accent}" stroke-opacity=".065" stroke-dasharray="2 12"/>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 688 604" to="360 688 604" dur="52s" repeatCount="indefinite"/>
        <path d="M688 286A318 318 0 0 1 1006 604" stroke="${colors.accent}" stroke-opacity=".24" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="1006" cy="604" r="3" fill="${colors.accent}"/>
        <path d="M688 340A264 264 0 0 0 424 604" stroke="${colors.accent2}" stroke-opacity=".16" stroke-width="1"/>
      </g>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="360 688 604" to="0 688 604" dur="34s" repeatCount="indefinite"/>
        <circle cx="688" cy="400" r="2.2" fill="${colors.accent2}" fill-opacity=".8"/>
        <circle cx="944" cy="680" r="1.8" fill="${colors.accent}"/>
        <path d="M894 478A204 204 0 0 1 826 436" stroke="${colors.text}" stroke-opacity=".18" stroke-dasharray="2 8"/>
      </g>
    </g>`;
}

function contourLines(colors) {
  return `
    <g class="wh-currents" fill="none" stroke="${colors.accent}" stroke-opacity=".08">
      <path d="M418 316C560 288 716 312 928 372"/>
      <path d="M410 388C566 350 736 378 930 448"/>
      <path d="M408 462C574 418 752 450 928 528"/>
      <path d="M406 540C576 494 760 528 926 612"/>
      <path d="M404 620C576 572 762 608 924 696"/>
      <path d="M402 704C574 654 760 692 922 784"/>
      <path d="M402 790C574 738 758 778 920 872"/>
      <path d="M404 878C572 826 754 868 918 962"/>
      <path d="M408 968C570 918 748 962 912 1056"/>
      <path d="M416 1060C570 1014 738 1058 906 1150"/>
    </g>`;
}

function bubbleCluster(colors, x, y, scale = 1, delay = 0) {
  const bubbles = [
    [0, 0, 5.5],
    [13, -22, 3.4],
    [-9, -39, 2.4],
    [18, -52, 1.7],
  ];
  return `
    <g class="wh-bubble" style="animation-delay:${delay}s" transform="translate(${x} ${y}) scale(${scale})">
      ${bubbles
        .map(
          ([bx, by, radius], index) => `
            <circle cx="${bx}" cy="${by}" r="${radius}" fill="${colors.accent}" fill-opacity=".025" stroke="${colors.line}" stroke-opacity="${(0.3 - index * 0.05).toFixed(2)}"/>
            <circle cx="${(bx - radius * 0.3).toFixed(2)}" cy="${(by - radius * 0.34).toFixed(2)}" r="${Math.max(0.65, radius * 0.18).toFixed(2)}" fill="${colors.text}" fill-opacity=".5"/>`,
        )
        .join("")}
    </g>`;
}

function whaleCompanion() {
  if (!WHALE_COMPANION_DATA_URI) return "";
  return `
    <g class="wh-drift">
      <image href="${escapeXml(WHALE_COMPANION_DATA_URI)}" x="44" y="1052" width="136" height="100" preserveAspectRatio="xMidYMid meet"/>
    </g>`;
}

function whaleBadge(colors) {
  if (!WHALE_BADGE_DATA_URI) return "";
  return `
    <g class="wh-sticker">
      <circle cx="824" cy="176" r="64" fill="${colors.background[1]}" fill-opacity=".38"/>
      <circle cx="824" cy="176" r="62" stroke="${colors.accent}" stroke-opacity=".18"/>
      <clipPath id="${PREFIX}-badge-clip">
        <circle cx="824" cy="176" r="54"/>
      </clipPath>
      <image href="${escapeXml(WHALE_BADGE_DATA_URI)}" x="770" y="122" width="108" height="108" preserveAspectRatio="xMidYMid slice" clip-path="url(#${PREFIX}-badge-clip)"/>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 824 176" to="360 824 176" dur="38s" repeatCount="indefinite"/>
        <circle cx="824" cy="112" r="2.6" fill="${colors.accent2}"/>
        <circle cx="888" cy="176" r="1.7" fill="${colors.accent}" fill-opacity=".8"/>
      </g>
      <circle cx="870" cy="225" r="5.5" fill="${colors.panel}" stroke="${colors.accent}" stroke-opacity=".45"/>
      <circle cx="870" cy="225" r="2" fill="${colors.accent}"/>
    </g>`;
}

function rankMedallion(model, colors) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const score = Math.max(0, Math.min(100, model.rank.score));
  const filled = (circumference * score) / 100;
  return `
    <g class="rise" style="animation-delay:.22s">
      <text x="262" y="483" fill="${colors.muted}" class="mono" font-size="8" letter-spacing="1.2">综合评分 / SCORE</text>
      <circle cx="318" cy="540" r="${radius}" stroke="${colors.line}" stroke-opacity=".1" stroke-width="5"/>
      <circle cx="318" cy="540" r="${radius}" stroke="url(#${PREFIX}-rank)" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 ${circumference.toFixed(2)}" transform="rotate(-90 318 540)">
        <animate attributeName="stroke-dasharray" from="0 ${circumference.toFixed(2)}" to="${filled.toFixed(2)} ${circumference.toFixed(2)}" dur="1.5s" begin=".45s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .8 .3 1"/>
      </circle>
      <circle cx="318" cy="540" r="31" fill="${colors.accent}" fill-opacity=".06"/>
      <text x="318" y="549" fill="${colors.text}" class="serif" font-size="27" font-weight="600" text-anchor="middle">${escapeXml(model.rank.level)}</text>
      <text x="318" y="594" fill="${colors.muted}" class="mono tabular" font-size="8" letter-spacing=".4" text-anchor="middle">${score.toFixed(1)} / 100</text>
    </g>`;
}

function metrics(model, colors) {
  const entries = [
    ["关注者", "FOLLOWERS", formatNumber(model.followers)],
    ["仓库", "REPOSITORIES", formatNumber(model.repositories)],
    ["近一年贡献", "CONTRIBUTIONS", formatNumber(model.contributions)],
    ["语言", "LANGUAGES", formatNumber(model.languageCount)],
  ];
  return entries
    .map(([label, micro, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = column === 0 ? 52 : 214;
      const y = 626 + row * 44;
      return `
        <g class="rise" style="animation-delay:${(0.26 + index * 0.045).toFixed(2)}s">
          <text x="${x}" y="${y}" fill="${colors.dim}" class="sans" font-size="9.5">${label}</text>
          <text x="${x + 144}" y="${y}" fill="${colors.textSoft}" class="mono tabular" font-size="10" text-anchor="end">${value}</text>
          <text x="${x}" y="${y + 13}" fill="${colors.dim}" class="mono" font-size="6.4" letter-spacing=".8">${micro}</text>
          <path d="M${x} ${y + 20}H${x + 144}" stroke="${colors.line}" stroke-opacity=".08"/>
        </g>`;
    })
    .join("");
}

function languageTide(model, colors) {
  const total = model.totalLanguageBytes || 1;
  const shown = model.languages.reduce((sum, language) => sum + language.bytes, 0);
  const rest = Math.max(total - shown, 0);
  const width = 306;
  let cursor = 0;
  const segments = model.languages.map((language) => {
    const segmentWidth = (language.bytes / (shown + rest || 1)) * width;
    const segment = `<rect x="${(52 + cursor).toFixed(2)}" y="716" width="${segmentWidth.toFixed(2)}" height="12" fill="${escapeXml(language.color)}"/>`;
    cursor += segmentWidth;
    return segment;
  });
  if (rest > 0) {
    segments.push(
      `<rect x="${(52 + cursor).toFixed(2)}" y="716" width="${Math.max(width - cursor, 0).toFixed(2)}" height="12" fill="${colors.track}"/>`,
    );
  }
  const legend = model.languages.map((language, index) => {
    const column = index < 3 ? 0 : 1;
    const row = index % 3;
    const x = column === 0 ? 52 : 210;
    const y = 760 + row * 26;
    const percent = (language.bytes / (shown + rest || 1)) * 100;
    const name = fitText(language.name, {
      fontSize: 10.5,
      minFontSize: 8,
      maxWidth: 108,
      weight: 500,
    });
    return `
      <g class="rise" style="animation-delay:${(0.38 + index * 0.04).toFixed(2)}s">
        <circle cx="${x + 3}" cy="${y - 3.5}" r="3" fill="${escapeXml(language.color)}"/>
        <text x="${x + 13}" y="${y}" fill="${colors.textSoft}" class="sans" font-size="${name.fontSize}" font-weight="500">${escapeXml(name.text)}</text>
        <text x="${x + 146}" y="${y}" fill="${colors.dim}" class="mono tabular" font-size="8" text-anchor="end">${percent.toFixed(1)}%</text>
      </g>`;
  });
  return `
    <text x="52" y="700" fill="${colors.muted}" class="mono" font-size="8" letter-spacing="1.5">语言潮汐 / LANGUAGE TIDE</text>
    <text x="358" y="700" fill="${colors.dim}" class="mono" font-size="7" letter-spacing=".8" text-anchor="end">${formatBytes(model.totalLanguageBytes).toUpperCase()}</text>
    <clipPath id="${PREFIX}-tide-reveal"><rect x="52" y="716" width="0" height="12" rx="6"><animate attributeName="width" from="0" to="${width}" dur="1.1s" begin=".42s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .8 .3 1"/></rect></clipPath>
    <g clip-path="url(#${PREFIX}-tide-reveal)">${segments.join("")}</g>
    <rect x="52.5" y="716.5" width="${width - 1}" height="11" rx="5.5" stroke="${colors.line}" stroke-opacity=".12"/>
    ${legend.join("")}`;
}

function diveLog(model, colors) {
  const rows = model.repositoriesTop
    .map((repository, index) => {
      const y = 892 + index * 43;
      const name = fitText(repository.name, {
        fontSize: 12.5,
        minFontSize: 9,
        maxWidth: 210,
        weight: 500,
      });
      return `
        <g class="rise" style="animation-delay:${(0.48 + index * 0.055).toFixed(2)}s">
          <text x="52" y="${y}" fill="${colors.dim}" class="mono" font-size="7.5">${String(index + 1).padStart(2, "0")}</text>
          <circle cx="78" cy="${y - 3.5}" r="2.2" fill="${colors.accent}" fill-opacity="${(0.9 - index * 0.12).toFixed(2)}"/>
          <text x="92" y="${y}" fill="${colors.textSoft}" class="sans" font-size="${name.fontSize}" font-weight="500">${escapeXml(name.text)}</text>
          <text x="358" y="${y}" fill="${colors.muted}" class="mono tabular" font-size="9" text-anchor="end">★ ${formatNumber(repository.stars)}</text>
          <path d="M52 ${y + 13}H358" stroke="${colors.line}" stroke-opacity=".07"/>
        </g>`;
    })
    .join("");
  return `
    <text x="52" y="866" fill="${colors.muted}" class="mono" font-size="8" letter-spacing="1.5">归档项目 / DIVE LOG</text>
    <text x="358" y="866" fill="${colors.dim}" class="mono" font-size="7" letter-spacing=".8" text-anchor="end">按星标排序</text>
    ${rows}`;
}

function characterLayer(colors) {
  if (!WHALE_HERO_DATA_URI) {
    return `
      <g opacity=".5">
        <circle cx="688" cy="620" r="210" fill="${colors.panel}" stroke="${colors.line}" stroke-opacity=".12"/>
        <text x="688" y="610" fill="${colors.textSoft}" class="serif" font-size="42" text-anchor="middle">潮汐档案</text>
        <text x="688" y="646" fill="${colors.muted}" class="mono" font-size="8" letter-spacing="1.4" text-anchor="middle">TIDAL ARCHIVE</text>
      </g>`;
  }
  return `
    <g class="wh-float">
      <image href="${escapeXml(WHALE_HERO_DATA_URI)}" x="368" y="238" width="620" height="872" preserveAspectRatio="xMidYMid meet" filter="url(#${PREFIX}-character-shadow)"/>
    </g>
    <g class="wh-pearl">
      <circle cx="655" cy="674" r="2.2" fill="${colors.text}" fill-opacity=".9"/>
      <circle cx="667" cy="660" r="1.4" fill="${colors.accent}"/>
      <circle cx="641" cy="656" r="1.1" fill="${colors.accent2}"/>
    </g>`;
}

function profileFooter(model, colors) {
  const profileUrl = fitText(`github.com/${model.login}`, {
    fontSize: 13,
    minFontSize: 9,
    maxWidth: 250,
    weight: 500,
  });
  const footerIdentity = fitText(model.footerIdentity, {
    fontSize: 8.5,
    minFontSize: 7,
    maxWidth: 240,
    mono: true,
    letterSpacing: 0.4,
  });
  const footerNote = fitText(model.footerNote, {
    fontSize: 8,
    minFontSize: 6.5,
    maxWidth: 300,
    mono: true,
    letterSpacing: 1,
  });
  const dataLabel = fitText(model.dataLabel, {
    fontSize: 7.5,
    minFontSize: 6.5,
    maxWidth: 420,
    mono: true,
    letterSpacing: 0.7,
  });
  return `
    <path class="wh-rule" style="animation-delay:.58s" d="M52 1176H868" stroke="${colors.line}" stroke-opacity=".1"/>
    <text x="52" y="1212" fill="${colors.text}" class="sans" font-size="${profileUrl.fontSize}" font-weight="500">${escapeXml(profileUrl.text)}</text>
    <text x="52" y="1232" fill="${colors.dim}" class="mono" font-size="${footerIdentity.fontSize}" letter-spacing=".4">${escapeXml(footerIdentity.text)}</text>
    <text x="868" y="1212" fill="${colors.muted}" class="mono" font-size="${footerNote.fontSize}" letter-spacing="1" text-anchor="end">${escapeXml(footerNote.text)}</text>
    <text x="868" y="1232" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".8" text-anchor="end">SYNCED ${model.syncLabel} CST</text>
    <g>
      <circle class="live-dot" cx="52" cy="1274" r="2.8" fill="${colors.accent}"/>
      <text x="63" y="1277" fill="${colors.muted}" class="mono" font-size="${dataLabel.fontSize}" letter-spacing=".7">${escapeXml(dataLabel.text)}</text>
      <text x="868" y="1277" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".8" text-anchor="end">TIDAL ARCHIVE · DYNAMIC SVG</text>
    </g>`;
}

export function renderWhaleTheme(model, config, { backgroundDataUri = "" } = {}) {
  const colors = config.colors;
  const background = backgroundLayer(config, colors, backgroundDataUri, PREFIX, {
    overlayOpacity: 0.26,
  });
  const mark = fitText(model.mark, {
    fontSize: 15,
    minFontSize: 10,
    maxWidth: 430,
    letterSpacing: 1.4,
    weight: 700,
  });
  const brandSubtitle = fitText(model.brandSubtitle, {
    fontSize: 9,
    minFontSize: 7.5,
    maxWidth: 430,
    letterSpacing: 1.1,
    weight: 500,
  });
  const headlineOne = fitText(model.headlineOne, {
    fontSize: 42,
    minFontSize: 24,
    maxWidth: 320,
    letterSpacing: -1.4,
    weight: 600,
  });
  const headlineTwo = fitText(model.headlineTwo, {
    fontSize: 42,
    minFontSize: 24,
    maxWidth: 320,
    letterSpacing: -1.4,
    weight: 600,
  });
  const intro = wrapText(model.intro, {
    fontSize: 12.5,
    maxWidth: 314,
    maxLines: 3,
    weight: 400,
  });
  const building = fitText(model.buildingLabel, {
    fontSize: 7.5,
    minFontSize: 7,
    maxWidth: 284,
    mono: true,
    letterSpacing: 0.7,
  });
  const buildingWidth = Math.min(318, Math.max(210, building.width + 34));
  const stars = fitText(formatNumber(model.stars), {
    fontSize: 60,
    minFontSize: 30,
    maxWidth: 190,
    letterSpacing: -3.2,
    weight: 600,
  });
  const homeNote = wrapText("把每一次下潜，都写进档案。", {
    fontSize: 12,
    maxWidth: 260,
    maxLines: 2,
  });
  const footerTech = fitText(model.footerTech, {
    fontSize: 7,
    minFontSize: 6,
    maxWidth: 310,
    mono: true,
    letterSpacing: 0.9,
  });

  return `${openSvg(model)}
  <defs>
    <linearGradient id="${PREFIX}-bg" x1="60" y1="0" x2="860" y2="1360" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.background[0]}"/>
      <stop offset=".52" stop-color="${colors.background[1]}"/>
      <stop offset="1" stop-color="${colors.background[2]}"/>
    </linearGradient>
    <radialGradient id="${PREFIX}-deep-glow" cx="0" cy="0" r="1" gradientTransform="translate(690 420) rotate(90) scale(470 520)" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.glowA}" stop-opacity=".2"/>
      <stop offset=".6" stop-color="${colors.glowA}" stop-opacity=".055"/>
      <stop offset="1" stop-color="${colors.glowA}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${PREFIX}-surface" cx="0" cy="0" r="1" gradientTransform="translate(810 -40) rotate(90) scale(500 760)" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.text}" stop-opacity=".18"/>
      <stop offset="1" stop-color="${colors.text}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${PREFIX}-warm" cx="0" cy="0" r="1" gradientTransform="translate(120 1050) rotate(-18) scale(260 330)" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.accent2}" stop-opacity=".12"/>
      <stop offset="1" stop-color="${colors.accent2}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${PREFIX}-avatar-ring" x1="54" y1="52" x2="112" y2="112" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.text}"/>
      <stop offset=".52" stop-color="${colors.accent}"/>
      <stop offset="1" stop-color="${colors.accent2}"/>
    </linearGradient>
    <linearGradient id="${PREFIX}-rank" x1="278" y1="500" x2="358" y2="580" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.text}"/>
      <stop offset=".55" stop-color="${colors.accent}"/>
      <stop offset="1" stop-color="${colors.accent2}"/>
    </linearGradient>
    <linearGradient id="${PREFIX}-scrim" x1="0" y1="0" x2="720" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.overlay}" stop-opacity=".82"/>
      <stop offset=".46" stop-color="${colors.overlay}" stop-opacity=".48"/>
      <stop offset="1" stop-color="${colors.overlay}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${PREFIX}-tail" x1="640" y1="1080" x2="900" y2="1280" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.accent}" stop-opacity=".3"/>
      <stop offset="1" stop-color="${colors.accent2}" stop-opacity=".05"/>
    </linearGradient>
    <pattern id="${PREFIX}-grid" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="1.2" cy="1.2" r=".9" fill="${colors.grid}" fill-opacity=".08"/>
    </pattern>
    <filter id="${PREFIX}-blur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="34"/>
    </filter>
    <filter id="${PREFIX}-character-shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#020B12" flood-opacity=".4"/>
    </filter>
    <clipPath id="${PREFIX}-card"><rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="28"/></clipPath>
    ${background.defs}
  </defs>
  <style>
    ${COMMON_STYLE}
    .wh-float { transform-box: fill-box; transform-origin: center; animation: whFloat 9s ease-in-out infinite; }
    .wh-sticker { transform-box: fill-box; transform-origin: center; animation: whSticker 7.5s ease-in-out infinite; }
    .wh-drift { transform-box: fill-box; transform-origin: center; animation: whDrift 11s ease-in-out infinite; }
    .wh-bubble { animation: whBubble 7s ease-in-out infinite; }
    .wh-pearl { transform-box: fill-box; transform-origin: center; animation: whPearl 3.8s ease-in-out infinite; }
    .wh-halo { transform-box: fill-box; transform-origin: center; animation: whHalo 5.2s ease-out infinite; }
    .wh-halo-2 { animation-delay: 2.6s; }
    .wh-rule { transform-box: fill-box; transform-origin: left center; animation: whRule 1.1s cubic-bezier(.22,1,.36,1) both; }
    .wh-currents path { stroke-dasharray: .5 9; animation: whCurrent 18s linear infinite; }
    @keyframes whFloat { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-7px) rotate(.25deg); } }
    @keyframes whSticker { 0%,100% { transform: translateY(0) rotate(-1.2deg); } 50% { transform: translateY(-4px) rotate(1.2deg); } }
    @keyframes whDrift { 0%,100% { transform: translate(0,0) rotate(-1deg); } 50% { transform: translate(7px,-8px) rotate(1deg); } }
    @keyframes whBubble { 0% { opacity: 0; transform: translateY(16px) scale(.86); } 18% { opacity: .72; } 76% { opacity: .28; } 100% { opacity: 0; transform: translateY(-30px) scale(1.04); } }
    @keyframes whPearl { 0%,100% { opacity: .55; transform: scale(.86); } 50% { opacity: 1; transform: scale(1.12); } }
    @keyframes whHalo { 0% { opacity: 0; transform: scale(.92); } 24% { opacity: .4; } 100% { opacity: 0; transform: scale(1.7); } }
    @keyframes whRule { from { opacity: .08; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }
    @keyframes whCurrent { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -58; } }
    @media (prefers-reduced-motion: reduce) {
      .wh-float, .wh-sticker, .wh-drift, .wh-bubble, .wh-pearl, .wh-halo { animation: none; }
      .wh-rule { animation: none; opacity: 1; transform: none; }
      .wh-currents path { animation: none; }
    }
  </style>
  <g clip-path="url(#${PREFIX}-card)">
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-bg)"/>
    ${background.body}
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-deep-glow)"/>
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-surface)"/>
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-warm)"/>
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-grid)"/>
    ${backgroundDataUri ? `<rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-scrim)"/>` : ""}
    <g filter="url(#${PREFIX}-blur)" opacity=".62">
      <ellipse cx="760" cy="430" rx="300" ry="330" fill="${colors.glowA}" fill-opacity=".12">
        <animateTransform attributeName="transform" type="translate" values="0 0; -34 22; 0 0" dur="21s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="150" cy="1110" rx="260" ry="220" fill="${colors.accent2}" fill-opacity=".07">
        <animateTransform attributeName="transform" type="translate" values="0 0; 24 -18; 0 0" dur="26s" repeatCount="indefinite"/>
      </ellipse>
    </g>
    ${sonarBackdrop(colors)}
    ${contourLines(colors)}
    <path d="M640 1280C730 1150 826 1110 942 1180C868 1192 808 1244 774 1330C722 1282 682 1268 640 1280Z" fill="url(#${PREFIX}-tail)" opacity=".5">
      <animateTransform attributeName="transform" type="rotate" values="-2 790 1210; 2 790 1210; -2 790 1210" dur="10s" repeatCount="indefinite"/>
    </path>
    <path d="M560 1160C654 1104 748 1100 834 1148C768 1156 720 1188 690 1240C646 1204 604 1192 560 1160Z" stroke="${colors.line}" stroke-opacity=".09" fill="none"/>
    <path d="M394 132H394V1164" stroke="${colors.line}" stroke-opacity=".08"/>

    <g opacity=".56">
      <path d="M872 304V1052" stroke="${colors.line}" stroke-opacity=".12"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7]
        .map((index) => {
          const y = 332 + index * 100;
          return `<path d="M866 ${y}h12" stroke="${colors.line}" stroke-opacity=".2"/><text x="884" y="${y + 3}" fill="${colors.dim}" class="mono" font-size="6.5">${index * 20}m</text>`;
        })
        .join("")}
    </g>
    ${characterLayer(colors)}
    ${whaleBadge(colors)}
    ${bubbleCluster(colors, 448, 790, 0.9, 0)}
    ${bubbleCluster(colors, 850, 510, 0.7, 1.8)}
    ${bubbleCluster(colors, 760, 1010, 0.8, 3.2)}

    <g>
      <circle class="wh-halo" cx="84" cy="84" r="38" stroke="${colors.accent}" stroke-opacity=".2"/>
      <circle class="wh-halo wh-halo-2" cx="84" cy="84" r="38" stroke="${colors.accent}" stroke-opacity=".14"/>
      <circle cx="84" cy="84" r="32" fill="${colors.panel}" stroke="url(#${PREFIX}-avatar-ring)" stroke-width="1.4"/>
      <clipPath id="${PREFIX}-avatar-clip"><circle cx="84" cy="84" r="30"/></clipPath>
      ${avatarMarkup(model, colors, {
        x: 54,
        y: 54,
        width: 60,
        height: 60,
        clipId: `${PREFIX}-avatar-clip`,
        fontSize: 19,
      })}
      <circle cx="84" cy="84" r="30" stroke="${colors.text}" stroke-opacity=".18"/>
      <circle cx="107" cy="105" r="4.2" fill="${colors.accent}" stroke="${colors.background[1]}" stroke-width="1.4"/>
    </g>
    <text x="130" y="76" fill="${colors.text}" class="sans" font-size="${mark.fontSize}" font-weight="700" letter-spacing="${(1.4 * (mark.fontSize / 15)).toFixed(2)}">${escapeXml(mark.text)}</text>
    <text x="130" y="94" fill="${colors.muted}" class="sans" font-size="${brandSubtitle.fontSize}" font-weight="500" letter-spacing="${(1.1 * (brandSubtitle.fontSize / 9)).toFixed(2)}">${escapeXml(brandSubtitle.text)}</text>

    <g>
      <rect x="650" y="52" width="218" height="30" rx="15" fill="${colors.panel}" fill-opacity=".28" stroke="${colors.line}" stroke-opacity=".1"/>
      <circle class="live-dot" cx="668" cy="67" r="3" fill="${colors.accent}"/>
      <text x="680" y="71" fill="${colors.muted}" class="mono" font-size="7.5" letter-spacing="1.1">LIVE · 潜航中</text>
      <path d="M776 67h10l3 3 3-3h12l3 3 3-3h13" stroke="${colors.accent}" stroke-opacity=".55" stroke-width="1"/>
    </g>

    <text x="52" y="174" fill="${colors.accent}" class="mono" font-size="8.5" letter-spacing="2.1">潮汐档案 / TIDAL ARCHIVE</text>
    <path d="M52 186H120" stroke="${colors.accent}" stroke-opacity=".5"/>
    <text x="52" y="232" fill="${colors.text}" class="serif" font-size="${headlineOne.fontSize}" font-weight="600" letter-spacing="${(-1.4 * (headlineOne.fontSize / 42)).toFixed(2)}">${escapeXml(headlineOne.text)}</text>
    <text x="52" y="282" fill="${colors.accent}" class="serif" font-size="${headlineTwo.fontSize}" font-weight="600" letter-spacing="${(-1.4 * (headlineTwo.fontSize / 42)).toFixed(2)}">${escapeXml(headlineTwo.text)}</text>
    ${intro
      .map(
        (line, index) =>
          `<text x="54" y="${324 + index * 21}" fill="${colors.textSoft}" class="sans" font-size="12.5">${escapeXml(line)}</text>`,
      )
      .join("")}
    <g class="rise" style="animation-delay:.18s">
      <rect x="52" y="390" width="${buildingWidth.toFixed(1)}" height="27" rx="13.5" fill="${colors.accent}" fill-opacity=".07" stroke="${colors.accent}" stroke-opacity=".22"/>
      <circle cx="67" cy="403.5" r="2.7" fill="${colors.accent}"/>
      <text x="77" y="407" fill="${colors.badgeText}" class="mono" font-size="${building.fontSize}" letter-spacing=".7">${escapeXml(building.text)}</text>
    </g>
    <text x="52" y="448" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing="1.3">声呐在线 · 公开数据 · 实时快照</text>

    <g class="rise" style="animation-delay:.2s">
      <path d="M59 481l3.7 7.7 8.5 1.2-6.1 5.9 1.4 8.4-7.5-4-7.5 4 1.4-8.4-6.1-5.9 8.5-1.2L59 481Z" fill="${colors.accent2}"/>
      <text x="81" y="486" fill="${colors.muted}" class="mono" font-size="8" letter-spacing="1.1">TOTAL STARS / 星标总数</text>
      <text x="52" y="552" fill="${colors.text}" class="sans tabular" font-size="${stars.fontSize}" font-weight="600" letter-spacing="${(-3.2 * (stars.fontSize / 60)).toFixed(2)}">${escapeXml(stars.text)}</text>
      <text x="54" y="572" fill="${colors.dim}" class="mono" font-size="7" letter-spacing=".9">ACROSS ${formatNumber(model.repositories)} REPOSITORIES</text>
    </g>
    ${rankMedallion(model, colors)}
    <path class="wh-rule" style="animation-delay:.24s" d="M52 600H358" stroke="${colors.line}" stroke-opacity=".09"/>
    ${metrics(model, colors)}
    <path class="wh-rule" style="animation-delay:.34s" d="M52 704H358" stroke="${colors.line}" stroke-opacity=".09"/>
    ${languageTide(model, colors)}
    <path class="wh-rule" style="animation-delay:.46s" d="M52 844H358" stroke="${colors.line}" stroke-opacity=".09"/>
    ${diveLog(model, colors)}
    ${whaleCompanion()}
    <text x="196" y="1084" fill="${colors.textSoft}" class="serif" font-size="12.5">${escapeXml(homeNote[0] || "")}</text>
    ${homeNote[1] ? `<text x="196" y="1104" fill="${colors.textSoft}" class="serif" font-size="12.5">${escapeXml(homeNote[1])}</text>` : ""}
    <text x="196" y="1124" fill="${colors.dim}" class="mono" font-size="7" letter-spacing=".9">${escapeXml(footerTech.text)}</text>
    ${profileFooter(model, colors)}

  </g>
  <rect x=".75" y=".75" width="918.5" height="1358.5" rx="27.5" stroke="${colors.line}" stroke-opacity=".14"/>
</svg>`;
}
