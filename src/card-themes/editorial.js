import {
  CARD_HEIGHT,
  CARD_WIDTH,
  COMMON_STYLE,
  avatarMarkup,
  backgroundLayer,
  escapeXml,
  fitText,
  formatBytes,
  formatNumber,
  openSvg,
} from "../card-kit.js";

const PREFIX = "ed";

function languageIndex(model, colors) {
  const total = model.totalLanguageBytes || 1;
  const shown = model.languages.reduce((sum, language) => sum + language.bytes, 0);
  const rest = Math.max(total - shown, 0);
  let cursor = 0;
  const segments = model.languages.map((language) => {
    const width = (language.bytes / (shown + rest || 1)) * 816;
    const segment = `<rect x="${(52 + cursor).toFixed(2)}" y="636" width="${width.toFixed(2)}" height="10" fill="${escapeXml(language.color)}"/>`;
    cursor += width;
    return segment;
  });
  if (rest > 0) {
    segments.push(
      `<rect x="${(52 + cursor).toFixed(2)}" y="636" width="${Math.max(816 - cursor, 0).toFixed(2)}" height="10" fill="${colors.track}"/>`,
    );
  }
  const rows = model.languages.map((language, index) => {
    const column = index < 3 ? 0 : 1;
    const row = index % 3;
    const x = column === 0 ? 52 : 488;
    const y = 682 + row * 31;
    const percent = (language.bytes / (shown + rest || 1)) * 100;
    const name = fitText(language.name, {
      fontSize: 13,
      minFontSize: 9.5,
      maxWidth: 260,
    });
    return `
      <g class="rise" style="animation-delay:${(0.3 + index * 0.04).toFixed(2)}s">
        <rect x="${x}" y="${y - 11}" width="6" height="6" fill="${escapeXml(language.color)}"/>
        <text x="${x + 15}" y="${y}" fill="${colors.textSoft}" class="sans" font-size="${name.fontSize}">${escapeXml(name.text)}</text>
        <text x="${x + 350}" y="${y}" fill="${colors.dim}" class="mono" font-size="9" text-anchor="end">${percent.toFixed(1)}%</text>
      </g>`;
  });
  return `
    <text x="52" y="610" fill="${colors.muted}" class="mono" font-size="9.5" letter-spacing="1.8">LANGUAGE INDEX</text>
    <text x="868" y="610" fill="${colors.dim}" class="mono" font-size="8.5" letter-spacing="1.1" text-anchor="end">${formatBytes(model.totalLanguageBytes).toUpperCase()} / ${model.languageCount} FOUND</text>
    <clipPath id="${PREFIX}-bar-reveal"><rect x="52" y="636" width="0" height="10"><animate attributeName="width" from="0" to="816" dur="1s" begin=".25s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .8 .3 1"/></rect></clipPath>
    <g clip-path="url(#${PREFIX}-bar-reveal)">${segments.join("")}</g>
    <path class="ed-rule" style="animation-delay:.28s" d="M52 633H868" stroke="${colors.line}" stroke-opacity=".14"/>
    <path class="ed-rule" style="animation-delay:.32s" d="M52 651H868" stroke="${colors.line}" stroke-opacity=".08"/>
    ${rows.join("")}
    <path class="ed-rule" style="animation-delay:.42s" d="M52 764H868" stroke="${colors.line}" stroke-opacity=".16"/>`;
}

function repositoryIndex(model, colors) {
  const maxStars = Math.max(...model.repositoriesTop.map((repo) => repo.stars), 1);
  const rows = model.repositoriesTop
    .map((repository, index) => {
      const y = 862 + index * 60;
      const fill = Math.max(2, (repository.stars / maxStars) * 720);
      const name = fitText(repository.name, {
        fontSize: 20,
        minFontSize: 12,
        maxWidth: 620,
        weight: 500,
      });
      return `
        <g class="rise" style="animation-delay:${(0.48 + index * 0.08).toFixed(2)}s">
          <text x="52" y="${y}" fill="${colors.dim}" class="mono" font-size="9">${String(index + 1).padStart(2, "0")}</text>
          <text x="118" y="${y}" fill="${colors.text}" class="serif" font-size="${name.fontSize}" font-weight="500">${escapeXml(name.text)}</text>
          <text x="868" y="${y}" fill="${colors.textSoft}" class="mono tabular" font-size="12" text-anchor="end">★ ${formatNumber(repository.stars)}</text>
          <path d="M118 ${y + 16}H868" stroke="${colors.line}" stroke-opacity=".12"/>
          <path d="M118 ${y + 16}H${(118 + fill).toFixed(1)}" stroke="${colors.accent}" stroke-opacity=".7" stroke-width="1.5" stroke-dasharray="0 720">
            <animate attributeName="stroke-dasharray" from="0 720" to="${fill.toFixed(1)} 720" dur=".8s" begin="${(0.54 + index * 0.08).toFixed(2)}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .8 .3 1"/>
          </path>
        </g>`;
    })
    .join("");
  return `
    <text x="52" y="800" fill="${colors.muted}" class="mono" font-size="9.5" letter-spacing="1.8">SELECTED REPOSITORIES</text>
    <text x="868" y="800" fill="${colors.dim}" class="mono" font-size="8.5" letter-spacing="1.1" text-anchor="end">BY STARS / PUBLIC</text>
    <path class="ed-rule" style="animation-delay:.46s" d="M52 822H868" stroke="${colors.line}" stroke-opacity=".16"/>
    ${rows}
    <path class="ed-rule" style="animation-delay:.62s" d="M52 1108H868" stroke="${colors.line}" stroke-opacity=".16"/>`;
}

function statBand(model, colors) {
  const entries = [
    ["TOTAL STARS", formatNumber(model.stars), ""],
    ["RANK", escapeXml(model.rank.level), `${model.rank.score.toFixed(1)} / 100`],
    ["FOLLOWERS", formatNumber(model.followers), ""],
    ["REPOSITORIES", formatNumber(model.repositories), ""],
    ["CONTRIBUTIONS", formatNumber(model.contributions), "PAST YEAR"],
  ];
  const positions = [52, 215, 378, 541, 704];
  return entries
    .map(([label, value, note], index) => {
      const x = positions[index];
      const valueText = fitText(value, {
        fontSize: 44,
        minFontSize: 24,
        maxWidth: 138,
        weight: 600,
      });
      return `
        <g class="rise" style="animation-delay:${(0.12 + index * 0.06).toFixed(2)}s">
          <text x="${x}" y="514" fill="${colors.text}" class="sans tabular" font-size="${valueText.fontSize}" font-weight="600" letter-spacing="-1.2">${escapeXml(valueText.text)}</text>
          <text x="${x}" y="538" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.1">${label}</text>
          ${note ? `<text x="${x}" y="556" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".8">${note}</text>` : ""}
        </g>
        ${index > 0 ? `<path d="M${x - 15} 466V552" stroke="${colors.line}" stroke-opacity=".11"/>` : ""}`;
    })
    .join("");
}

export function renderEditorialTheme(model, config, { backgroundDataUri = "" } = {}) {
  const colors = config.colors;
  const background = backgroundLayer(config, colors, backgroundDataUri, PREFIX, {
    overlayOpacity: 0.14,
  });
  const mark = fitText(model.mark, {
    fontSize: 15,
    minFontSize: 10,
    maxWidth: 430,
    letterSpacing: 2.4,
    weight: 700,
  });
  const brandSubtitle = fitText(model.brandSubtitle, {
    fontSize: 10,
    minFontSize: 8,
    maxWidth: 430,
    letterSpacing: 1.3,
  });
  const headlineOne = fitText(model.headlineOne, {
    fontSize: 58,
    minFontSize: 28,
    maxWidth: 495,
    letterSpacing: -1.6,
    weight: 500,
  });
  const headlineTwo = fitText(model.headlineTwo, {
    fontSize: 58,
    minFontSize: 28,
    maxWidth: 495,
    letterSpacing: -1.6,
    weight: 500,
  });
  const intro = fitText(model.intro, {
    fontSize: 14.5,
    minFontSize: 10.5,
    maxWidth: 500,
  });
  const building = fitText(model.buildingLabel, {
    fontSize: 8.5,
    minFontSize: 8,
    maxWidth: 480,
    mono: true,
    letterSpacing: 0.8,
  });
  const buildingWidth = Math.min(540, Math.max(230, building.width + 40));
  const context = fitText(model.contextLine, {
    fontSize: 8.5,
    minFontSize: 7,
    maxWidth: 480,
    mono: true,
    letterSpacing: 1.4,
  });
  const footerNote = fitText(model.footerNote, {
    fontSize: 9,
    minFontSize: 7,
    maxWidth: 310,
    mono: true,
    letterSpacing: 0.7,
  });
  const footerTech = fitText(model.footerTech, {
    fontSize: 8.5,
    minFontSize: 7,
    maxWidth: 800,
    mono: true,
    letterSpacing: 1.4,
  });
  const profileUrl = fitText(`github.com/${model.login}`, {
    fontSize: 24,
    minFontSize: 14,
    maxWidth: 460,
    weight: 500,
  });
  const footerIdentity = fitText(model.footerIdentity, {
    fontSize: 10.5,
    minFontSize: 8,
    maxWidth: 350,
    mono: true,
    letterSpacing: 0.6,
  });
  const dataLabel = fitText(model.dataLabel, {
    fontSize: 9,
    minFontSize: 7,
    maxWidth: 420,
    mono: true,
    letterSpacing: 1.1,
  });

  return `${openSvg(model)}
  <defs>
    <linearGradient id="${PREFIX}-bg" x1="0" y1="0" x2="920" y2="1360" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.background[0]}"/>
      <stop offset=".52" stop-color="${colors.background[1]}"/>
      <stop offset="1" stop-color="${colors.background[2]}"/>
    </linearGradient>
    <radialGradient id="${PREFIX}-wash" cx="0" cy="0" r="1" gradientTransform="translate(750 120) rotate(90) scale(280 360)" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.accent}" stop-opacity=".1"/>
      <stop offset="1" stop-color="${colors.accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="${PREFIX}-grid" width="56" height="56" patternUnits="userSpaceOnUse">
      <path d="M56 0H0V56" stroke="${colors.grid}" stroke-opacity=".035"/>
    </pattern>
    <clipPath id="${PREFIX}-card"><rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="28"/></clipPath>
    <clipPath id="${PREFIX}-portrait"><rect x="666" y="126" width="186" height="236" rx="4"/></clipPath>
    <clipPath id="${PREFIX}-avatar-small"><circle cx="80" cy="82" r="24"/></clipPath>
    ${background.defs}
  </defs>
  <style>
    ${COMMON_STYLE}
    .ed-float { transform-box: fill-box; transform-origin: center; animation: edFloat 8s ease-in-out infinite; }
    .ed-pulse { transform-box: fill-box; transform-origin: center; animation: edPulse 3.4s ease-in-out infinite; }
    .ed-shadow { animation: edShadow 8s ease-in-out infinite; }
    .ed-shine { animation: edShine 7.5s ease-in-out infinite; }
    .ed-rule { transform-box: fill-box; transform-origin: left center; animation: edRule 1.1s cubic-bezier(.22,1,.36,1) both; }
    @keyframes edFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
    @keyframes edPulse { 0%,100% { opacity: .35; transform: scale(.96); } 50% { opacity: .9; transform: scale(1.04); } }
    @keyframes edShadow { 0%,100% { transform: translate(8px, 10px); opacity: .13; } 50% { transform: translate(13px, 15px); opacity: .2; } }
    @keyframes edShine { 0%,18% { transform: translateX(0); opacity: 0; } 32% { opacity: .16; } 58%,100% { transform: translateX(240px); opacity: 0; } }
    @keyframes edRule { from { opacity: .1; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }
    @media (prefers-reduced-motion: reduce) {
      .ed-float, .ed-pulse, .ed-shadow, .ed-shine { animation: none; }
      .ed-rule { animation: none; opacity: 1; transform: none; }
    }
  </style>
  <g clip-path="url(#${PREFIX}-card)">
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-bg)"/>
    ${background.body}
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-wash)"/>
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-grid)"/>
    <ellipse class="ed-pulse" cx="744" cy="868" rx="250" ry="170" fill="${colors.accent}" fill-opacity=".035"/>

    <circle cx="80" cy="82" r="25" fill="${colors.panel}" stroke="${colors.line}" stroke-opacity=".2"/>
    ${avatarMarkup(model, colors, {
      x: 56,
      y: 58,
      width: 48,
      height: 48,
      clipId: `${PREFIX}-avatar-small`,
      fontSize: 16,
    })}
    <text x="126" y="68" fill="${colors.text}" class="sans" font-size="${mark.fontSize}" font-weight="700" letter-spacing="${(2.4 * (mark.fontSize / 15)).toFixed(2)}">${escapeXml(mark.text)}</text>
    <text x="126" y="88" fill="${colors.muted}" class="sans" font-size="${brandSubtitle.fontSize}" letter-spacing="${(1.3 * (brandSubtitle.fontSize / 10)).toFixed(2)}">${escapeXml(brandSubtitle.text)}</text>
    <text x="868" y="58" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.2" text-anchor="end">ISSUE 01 / PROFILE</text>
    <g>
      <circle class="live-dot" cx="733" cy="78" r="2.8" fill="${colors.accent}"/>
      <text x="868" y="82" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">LIVE · ${model.syncLabel} CST</text>
    </g>
    <path class="ed-rule" style="animation-delay:.1s" d="M52 116H868" stroke="${colors.line}" stroke-opacity=".2"/>

    <text x="52" y="154" fill="${colors.accent}" class="mono" font-size="8.5" letter-spacing="1.6">PROFILE / EDITORIAL 01</text>
    <rect class="ed-rule" style="animation-delay:.18s" x="52" y="163" width="118" height="2" fill="${colors.accent}"/>
    <g class="soft-rise" style="animation-delay:.04s">
      <text x="52" y="206" fill="${colors.text}" class="serif" font-size="${headlineOne.fontSize}" font-weight="500" letter-spacing="${(-1.6 * (headlineOne.fontSize / 58)).toFixed(2)}">${escapeXml(headlineOne.text)}</text>
    </g>
    <g class="soft-rise" style="animation-delay:.1s">
      <text x="52" y="276" fill="${colors.accent}" class="serif" font-size="${headlineTwo.fontSize}" font-weight="500" letter-spacing="${(-1.6 * (headlineTwo.fontSize / 58)).toFixed(2)}">${escapeXml(headlineTwo.text)}</text>
    </g>
    <g class="soft-rise" style="animation-delay:.16s">
      <text x="54" y="314" fill="${colors.muted}" class="sans" font-size="${intro.fontSize}">${escapeXml(intro.text)}</text>
    </g>
    <g class="rise" style="animation-delay:.1s">
      <rect x="52" y="332" width="${buildingWidth.toFixed(1)}" height="28" rx="2" fill="${colors.accent}" fill-opacity=".09" stroke="${colors.accent}" stroke-opacity=".28"/>
      <rect x="52" y="332" width="4" height="28" fill="${colors.accent}"/>
      <text x="70" y="350" fill="${colors.badgeText}" class="mono" font-size="${building.fontSize}" letter-spacing=".8">${escapeXml(building.text)}</text>
    </g>
    <text x="52" y="388" fill="${colors.dim}" class="mono" font-size="${context.fontSize}" letter-spacing="1.4">${escapeXml(context.text)}</text>

    <g class="ed-float">
      <rect class="ed-shadow" x="682" y="108" width="186" height="236" rx="4" fill="${colors.accent}"/>
      <rect x="666" y="126" width="186" height="236" rx="4" fill="${colors.panel}" stroke="${colors.line}" stroke-opacity=".25"/>
      ${avatarMarkup(model, colors, {
        x: 666,
        y: 126,
        width: 186,
        height: 236,
        clipId: `${PREFIX}-portrait`,
        fontSize: 46,
        shape: "rect",
        rx: 4,
      })}
      <rect class="ed-shine" x="626" y="126" width="32" height="236" fill="${colors.panel}" clip-path="url(#${PREFIX}-portrait)"/>
    </g>
    <path d="M666 126h18M684 108v18M852 126h-18M834 108v18" stroke="${colors.accent}" stroke-width="1.2" stroke-linecap="round"/>
    <text x="759" y="388" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing="1.2" text-anchor="middle">PORTRAIT / LIVE</text>
    <path class="ed-rule" style="animation-delay:.24s" d="M52 410H868" stroke="${colors.line}" stroke-opacity=".2"/>

    <text x="52" y="440" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.4">PROFILE INDEX</text>
    <text x="868" y="440" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">SYNCED ${model.syncLabel}</text>
    ${statBand(model, colors)}
    <path class="ed-rule" style="animation-delay:.34s" d="M52 574H868" stroke="${colors.line}" stroke-opacity=".16"/>
    ${languageIndex(model, colors)}
    ${repositoryIndex(model, colors)}

    <text x="52" y="1150" fill="${colors.text}" class="serif" font-size="${profileUrl.fontSize}" font-weight="500">${escapeXml(profileUrl.text)}</text>
    <text x="52" y="1180" fill="${colors.muted}" class="mono" font-size="${footerIdentity.fontSize}" letter-spacing=".6">${escapeXml(footerIdentity.text)}</text>
    <text x="868" y="1150" fill="${colors.muted}" class="mono" font-size="${footerNote.fontSize}" letter-spacing=".7" text-anchor="end">${escapeXml(footerNote.text)}</text>
    <text x="868" y="1176" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">DYNAMIC SVG / 5 MIN CACHE</text>
    <path class="ed-rule" style="animation-delay:.68s" d="M52 1212H868" stroke="${colors.line}" stroke-opacity=".2"/>
    <text x="52" y="1246" fill="${colors.dim}" class="mono" font-size="${footerTech.fontSize}" letter-spacing="1.4">${escapeXml(footerTech.text)}</text>
    <g>
      <circle class="live-dot" cx="52" cy="1288" r="2.8" fill="${colors.accent}"/>
      <text x="64" y="1292" fill="${colors.muted}" class="mono" font-size="${dataLabel.fontSize}" letter-spacing="1.1">${escapeXml(dataLabel.text)}</text>
      <text x="868" y="1292" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">UPDATED ${model.syncLabel} CST</text>
    </g>
  </g>
  <rect x=".75" y=".75" width="918.5" height="1358.5" rx="27.5" stroke="${colors.line}" stroke-opacity=".16"/>
</svg>`;
}
