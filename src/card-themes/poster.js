import {
  CARD_HEIGHT,
  CARD_WIDTH,
  COMMON_STYLE,
  avatarMarkup,
  backgroundLayer,
  estimateTextWidth,
  escapeXml,
  fitText,
  formatBytes,
  formatNumber,
  openSvg,
} from "../card-kit.js";

const PREFIX = "em";

function posterStats(model, colors) {
  const entries = [
    ["REPOSITORIES", formatNumber(model.repositories)],
    ["FOLLOWERS", formatNumber(model.followers)],
    ["CONTRIBUTIONS", formatNumber(model.contributions)],
    ["LANGUAGES", formatNumber(model.languageCount)],
  ];
  return entries
    .map(([label, value], index) => {
      const x = 52 + index * 203;
      return `
        <g class="rise" style="animation-delay:${(0.12 + index * 0.05).toFixed(2)}s">
          <text x="${x}" y="646" fill="${colors.muted}" class="mono" font-size="8" letter-spacing="1.1">${label}</text>
          <text x="${x}" y="682" fill="${colors.text}" class="sans tabular" font-size="31" font-weight="600" letter-spacing="-1">${value}</text>
          ${index > 0 ? `<path d="M${x - 15} 620V690" stroke="${colors.line}" stroke-opacity=".1"/>` : ""}
        </g>`;
    })
    .join("");
}

function languageColumns(model, colors) {
  const total = model.totalLanguageBytes || 1;
  const shown = model.languages.reduce((sum, language) => sum + language.bytes, 0);
  const rest = Math.max(total - shown, 0);
  const baseY = 868;
  const maxHeight = 104;
  return model.languages
    .map((language, index) => {
      const percent = (language.bytes / (shown + rest || 1)) * 100;
      const height = Math.max(14, Math.min(maxHeight, (percent / 100) * maxHeight + 18));
      const x = 80 + index * 130;
      const name = fitText(language.name, {
        fontSize: 9,
        minFontSize: 7,
        maxWidth: 110,
        weight: 600,
      });
      return `
        <g class="rise" style="animation-delay:${(0.3 + index * 0.06).toFixed(2)}s">
          <rect x="${x}" y="${baseY}" width="54" height="0" fill="${escapeXml(language.color)}" fill-opacity=".84">
            <animate attributeName="height" from="0" to="${height}" dur=".9s" begin="${(0.34 + index * 0.06).toFixed(2)}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .8 .3 1"/>
            <animate attributeName="y" from="${baseY}" to="${baseY - height}" dur=".9s" begin="${(0.34 + index * 0.06).toFixed(2)}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .8 .3 1"/>
          </rect>
          <rect x="${x}" y="${baseY}" width="54" height="3" fill="${colors.accent}">
            <animate attributeName="y" from="${baseY}" to="${baseY - height}" dur=".9s" begin="${(0.34 + index * 0.06).toFixed(2)}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .8 .3 1"/>
          </rect>
          <text x="${x + 27}" y="${baseY - height - 9}" fill="${colors.textSoft}" class="mono" font-size="8" text-anchor="middle">${percent.toFixed(0)}%</text>
          <text x="${x + 27}" y="${baseY + 18}" fill="${colors.muted}" class="sans" font-size="${name.fontSize}" font-weight="600" text-anchor="middle">${escapeXml(name.text)}</text>
        </g>`;
    })
    .join("");
}

function posterRepositories(model, colors) {
  return model.repositoriesTop
    .map((repository, index) => {
      const y = 992 + index * 44;
      const name = fitText(repository.name, {
        fontSize: 15,
        minFontSize: 10,
        maxWidth: 580,
        weight: 600,
      });
      return `
        <g class="rise" style="animation-delay:${(0.5 + index * 0.06).toFixed(2)}s">
          <text x="52" y="${y}" fill="${colors.accent}" class="mono" font-size="9" letter-spacing=".8">0${index + 1}</text>
          <text x="94" y="${y}" fill="${colors.textSoft}" class="sans" font-size="${name.fontSize}" font-weight="600">${escapeXml(name.text)}</text>
          <text x="868" y="${y}" fill="${colors.muted}" class="mono" font-size="10" text-anchor="end">★ ${formatNumber(repository.stars)}</text>
          <rect x="94" y="${y + 10}" width="774" height="2" fill="${colors.line}" fill-opacity=".08"/>
          <rect x="94" y="${y + 10}" width="0" height="2" fill="${colors.accent}" fill-opacity=".7">
            <animate attributeName="width" from="0" to="${Math.max(4, (repository.stars / (Math.max(...model.repositoriesTop.map((repo) => repo.stars), 1))) * 774).toFixed(1)}" dur=".8s" begin="${(0.56 + index * 0.06).toFixed(2)}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .8 .3 1"/>
          </rect>
        </g>`;
    })
    .join("");
}

function posterPortrait(model, colors) {
  return `
    <g>
      <circle class="em-sun" cx="784" cy="228" r="156" fill="${colors.accent}" fill-opacity=".06"/>
      <circle cx="784" cy="228" r="136" stroke="${colors.accent}" stroke-opacity=".2" stroke-dasharray="3 9"/>
      <circle cx="784" cy="228" r="124" stroke="${colors.line}" stroke-opacity=".13"/>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 784 228" to="360 784 228" dur="28s" repeatCount="indefinite"/>
        <circle cx="784" cy="92" r="3.2" fill="${colors.accent}"/>
        <circle cx="920" cy="228" r="2.2" fill="${colors.accent}" fill-opacity=".75"/>
        <circle cx="648" cy="228" r="1.8" fill="${colors.text}" fill-opacity=".45"/>
        <path d="M784 104A124 124 0 0 1 908 228" stroke="${colors.accent}" stroke-opacity=".6" stroke-width="1.2"/>
      </g>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="360 784 228" to="0 784 228" dur="17s" repeatCount="indefinite"/>
        <path d="M784 112A116 116 0 0 0 668 228" stroke="${colors.accent2}" stroke-opacity=".52" stroke-width="1" stroke-linecap="round"/>
        <circle cx="668" cy="228" r="2.7" fill="${colors.accent2}"/>
      </g>
      <clipPath id="${PREFIX}-avatar"><circle cx="784" cy="228" r="104"/></clipPath>
      <g class="em-float">
        <circle cx="784" cy="228" r="110" fill="${colors.panel}" stroke="url(#${PREFIX}-avatar-ring)" stroke-width="2"/>
        ${avatarMarkup(model, colors, {
          x: 680,
          y: 124,
          width: 208,
          height: 208,
          clipId: `${PREFIX}-avatar`,
          fontSize: 52,
        })}
        <rect class="em-shine" x="650" y="112" width="30" height="232" fill="${colors.text}" clip-path="url(#${PREFIX}-avatar)"/>
        <circle cx="784" cy="228" r="104" stroke="${colors.line}" stroke-opacity=".16"/>
      </g>
      <g opacity=".8">
        <circle r="2.1" fill="${colors.accent}">
          <animateMotion path="M650 106C682 76 732 82 752 120" dur="8s" repeatCount="indefinite"/>
        </circle>
        <circle r="1.5" fill="${colors.text}">
          <animateMotion path="M896 322C854 342 818 334 796 300" dur="11s" begin="-3s" repeatCount="indefinite"/>
        </circle>
      </g>
      <text x="784" y="356" fill="${colors.muted}" class="mono" font-size="7.5" letter-spacing="1.2" text-anchor="middle">PORTRAIT / LIVE</text>
    </g>`;
}

export function renderPosterTheme(model, config, { backgroundDataUri = "" } = {}) {
  const colors = config.colors;
  const background = backgroundLayer(config, colors, backgroundDataUri, PREFIX, {
    overlayOpacity: 0.26,
  });
  const mark = fitText(model.mark, {
    fontSize: 14,
    minFontSize: 10,
    maxWidth: 430,
    letterSpacing: 2.4,
    weight: 700,
  });
  const brandSubtitle = fitText(model.brandSubtitle, {
    fontSize: 10,
    minFontSize: 8,
    maxWidth: 430,
    letterSpacing: 1.2,
  });
  const headlineOne = fitText(model.headlineOne, {
    fontSize: 64,
    minFontSize: 30,
    maxWidth: 495,
    letterSpacing: -2.2,
    weight: 650,
  });
  const headlineTwo = fitText(model.headlineTwo, {
    fontSize: 64,
    minFontSize: 30,
    maxWidth: 495,
    letterSpacing: -2.2,
    weight: 650,
  });
  const intro = fitText(model.intro, {
    fontSize: 14.5,
    minFontSize: 10.5,
    maxWidth: 500,
  });
  const building = fitText(model.buildingLabel, {
    fontSize: 8.5,
    minFontSize: 7.5,
    maxWidth: 500,
    mono: true,
    letterSpacing: 0.8,
  });
  const buildingWidth = Math.min(560, Math.max(250, building.width + 40));
  const context = fitText(model.contextLine, {
    fontSize: 8.5,
    minFontSize: 7,
    maxWidth: 480,
    mono: true,
    letterSpacing: 1.3,
  });
  const stars = fitText(formatNumber(model.stars), {
    fontSize: 108,
    minFontSize: 42,
    maxWidth: 270,
    letterSpacing: -5,
    weight: 600,
  });
  const starCaption = fitText(`ACROSS ${formatNumber(model.repositories)} REPOSITORIES`, {
    fontSize: 8,
    minFontSize: 7,
    maxWidth: 280,
    mono: true,
    letterSpacing: 1,
  });
  const footerNote = fitText(model.footerNote, {
    fontSize: 8.5,
    minFontSize: 7,
    maxWidth: 340,
    mono: true,
    letterSpacing: 1.1,
  });
  const footerTech = fitText(model.footerTech, {
    fontSize: 8,
    minFontSize: 6.5,
    maxWidth: 800,
    mono: true,
    letterSpacing: 1.2,
  });
  const profileUrl = fitText(`github.com/${model.login}`, {
    fontSize: 17,
    minFontSize: 11,
    maxWidth: 330,
    weight: 500,
  });
  const footerIdentity = fitText(model.footerIdentity, {
    fontSize: 10,
    minFontSize: 8,
    maxWidth: 320,
    mono: true,
    letterSpacing: 0.5,
  });
  const dataLabel = fitText(model.dataLabel, {
    fontSize: 8.5,
    minFontSize: 7,
    maxWidth: 420,
    mono: true,
    letterSpacing: 1.1,
  });
  const tickerLabel = "BUILD WITH CARE. · LIVE GITHUB PROFILE · DYNAMIC SVG · ";
  const tickerWidth = estimateTextWidth(tickerLabel, {
    fontSize: 9,
    mono: true,
    letterSpacing: 1.3,
  });

  return `${openSvg(model)}
  <defs>
    <linearGradient id="${PREFIX}-bg" x1="0" y1="0" x2="920" y2="1360" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.background[0]}"/>
      <stop offset=".54" stop-color="${colors.background[1]}"/>
      <stop offset="1" stop-color="${colors.background[2]}"/>
    </linearGradient>
    <radialGradient id="${PREFIX}-glow" cx="0" cy="0" r="1" gradientTransform="translate(760 230) rotate(90) scale(340 340)" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.accent}" stop-opacity=".18"/>
      <stop offset="1" stop-color="${colors.accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${PREFIX}-avatar-ring" x1="652" y1="88" x2="888" y2="324" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.text}"/>
      <stop offset=".45" stop-color="${colors.accent}"/>
      <stop offset="1" stop-color="${colors.accent2}"/>
    </linearGradient>
    <pattern id="${PREFIX}-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" stroke="${colors.grid}" stroke-opacity=".04"/>
    </pattern>
    <clipPath id="${PREFIX}-card"><rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="28"/></clipPath>
    <clipPath id="${PREFIX}-ticker"><rect x="32" y="1168" width="856" height="40" rx="20"/></clipPath>
    ${background.defs}
  </defs>
  <style>
    ${COMMON_STYLE}
    .em-float { transform-box: fill-box; transform-origin: center; animation: emFloat 8s ease-in-out infinite; }
    .em-ember { animation: emEmber 7s ease-in-out infinite; }
    .em-sun { transform-box: fill-box; transform-origin: center; animation: emSun 7s ease-in-out infinite; }
    .em-shine { animation: emShine 7s ease-in-out infinite; }
    .em-rule { transform-box: fill-box; transform-origin: left center; animation: emRule 1.1s cubic-bezier(.22,1,.36,1) both; }
    @keyframes emFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    @keyframes emEmber { 0%,100% { opacity: .08; transform: translateY(0) scale(.8); } 50% { opacity: .7; transform: translateY(-22px) scale(1.2); } }
    @keyframes emSun { 0%,100% { opacity: .62; transform: scale(.97); } 50% { opacity: 1; transform: scale(1.03); } }
    @keyframes emShine { 0%,24% { opacity: 0; transform: translateX(-30px); } 42% { opacity: .18; } 74%,100% { opacity: 0; transform: translateX(248px); } }
    @keyframes emRule { from { opacity: .1; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }
    @media (prefers-reduced-motion: reduce) {
      .em-float, .em-ember, .em-sun, .em-shine { animation: none; }
      .em-rule { animation: none; opacity: 1; transform: none; }
    }
  </style>
  <g clip-path="url(#${PREFIX}-card)">
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-bg)"/>
    ${background.body}
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-glow)"/>
    <path d="M-80 1180L760 360L920 500L80 1340Z" fill="${colors.accent}" fill-opacity=".045"/>
    <path d="M620 -80L920 220L920 430L430 -80Z" fill="${colors.accent2}" fill-opacity=".06"/>
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-grid)"/>
    <g opacity=".6">
      <rect x="-260" y="60" width="190" height="2" fill="${colors.accent}" fill-opacity=".5">
        <animateTransform attributeName="transform" type="translate" values="0 0; 1300 300" dur="13s" repeatCount="indefinite"/>
      </rect>
    </g>
    <circle class="em-ember" cx="110" cy="1010" r="2.3" fill="${colors.accent}" style="animation-delay:.2s"/>
    <circle class="em-ember" cx="820" cy="740" r="1.8" fill="${colors.accent}" style="animation-delay:1.3s"/>
    <circle class="em-ember" cx="670" cy="1180" r="2.5" fill="${colors.accent}" style="animation-delay:2.1s"/>
    <circle class="em-ember" cx="260" cy="420" r="1.5" fill="${colors.accent}" style="animation-delay:2.8s"/>
    <circle class="em-ember" cx="870" cy="1040" r="1.7" fill="${colors.accent}" style="animation-delay:4.1s"/>

    <circle cx="80" cy="82" r="25" fill="${colors.panel}" stroke="url(#${PREFIX}-avatar-ring)" stroke-opacity=".55"/>
    <clipPath id="${PREFIX}-avatar-small"><circle cx="80" cy="82" r="24"/></clipPath>
    ${avatarMarkup(model, colors, {
      x: 56,
      y: 58,
      width: 48,
      height: 48,
      clipId: `${PREFIX}-avatar-small`,
      fontSize: 16,
    })}
    <text x="126" y="68" fill="${colors.text}" class="sans" font-size="${mark.fontSize}" font-weight="700" letter-spacing="${(2.4 * (mark.fontSize / 14)).toFixed(2)}">${escapeXml(mark.text)}</text>
    <text x="126" y="88" fill="${colors.muted}" class="sans" font-size="${brandSubtitle.fontSize}" letter-spacing="${(1.2 * (brandSubtitle.fontSize / 10)).toFixed(2)}">${escapeXml(brandSubtitle.text)}</text>
    <text x="868" y="62" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.2" text-anchor="end">POSTER / 01</text>
    <g>
      <circle class="live-dot" cx="728" cy="82" r="3" fill="${colors.accent}"/>
      <text x="868" y="86" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">LIVE · ${model.syncLabel}</text>
    </g>

    <g class="soft-rise" style="animation-delay:.04s">
      <text x="52" y="196" fill="${colors.text}" class="sans" font-size="${headlineOne.fontSize}" font-weight="650" letter-spacing="${(-2.2 * (headlineOne.fontSize / 64)).toFixed(2)}">${escapeXml(headlineOne.text)}</text>
    </g>
    <g class="soft-rise" style="animation-delay:.1s">
      <text x="52" y="264" fill="${colors.accent}" class="sans" font-size="${headlineTwo.fontSize}" font-weight="650" letter-spacing="${(-2.2 * (headlineTwo.fontSize / 64)).toFixed(2)}">${escapeXml(headlineTwo.text)}</text>
    </g>
    <g class="soft-rise" style="animation-delay:.16s">
      <text x="54" y="304" fill="${colors.muted}" class="sans" font-size="${intro.fontSize}">${escapeXml(intro.text)}</text>
    </g>
    <g class="rise" style="animation-delay:.08s">
      <rect x="52" y="322" width="${buildingWidth.toFixed(1)}" height="30" rx="3" fill="${colors.accent}" fill-opacity=".12" stroke="${colors.accent}" stroke-opacity=".35"/>
      <rect x="52" y="322" width="5" height="30" fill="${colors.accent}"/>
      <text x="70" y="341" fill="${colors.badgeText}" class="mono" font-size="${building.fontSize}" letter-spacing=".8">${escapeXml(building.text)}</text>
    </g>
    <text x="52" y="376" fill="${colors.dim}" class="mono" font-size="${context.fontSize}" letter-spacing="1.3">${escapeXml(context.text)}</text>
    ${posterPortrait(model, colors)}
    <path class="em-rule" style="animation-delay:.26s" d="M52 408H868" stroke="${colors.line}" stroke-opacity=".14"/>

    <text x="52" y="440" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.5">SIGNAL / TOTAL STARS</text>
    <text x="52" y="566" fill="${colors.text}" class="sans tabular" font-size="${stars.fontSize}" font-weight="600" letter-spacing="${(-5 * (stars.fontSize / 108)).toFixed(2)}">${escapeXml(stars.text)}</text>
    <text x="54" y="592" fill="${colors.dim}" class="mono" font-size="${starCaption.fontSize}" letter-spacing="1">${escapeXml(starCaption.text)}</text>
    <g class="rise" style="animation-delay:.16s">
      <circle cx="420" cy="506" r="76" fill="${colors.accent}" fill-opacity=".07" stroke="${colors.accent}" stroke-opacity=".26"/>
      <circle cx="420" cy="506" r="61" stroke="${colors.accent}" stroke-opacity=".18" stroke-dasharray="2 6"/>
      <text x="420" y="516" fill="${colors.text}" class="sans" font-size="42" font-weight="600" text-anchor="middle">${escapeXml(model.rank.level)}</text>
      <text x="420" y="542" fill="${colors.textSoft}" class="mono" font-size="9" text-anchor="middle">${model.rank.score.toFixed(1)} / 100</text>
    </g>
    ${posterStats(model, colors)}
    <path class="em-rule" style="animation-delay:.4s" d="M52 712H868" stroke="${colors.line}" stroke-opacity=".13"/>

    <text x="52" y="748" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.5">LANGUAGE SIGNAL</text>
    <text x="868" y="748" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">${formatBytes(model.totalLanguageBytes).toUpperCase()} / ${model.languageCount} DETECTED</text>
    <path d="M80 780H850M80 820H850M80 860H850M80 868H850" stroke="${colors.line}" stroke-opacity=".08"/>
    ${languageColumns(model, colors)}

    <text x="52" y="944" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.5">SELECTED REPOSITORIES</text>
    <text x="868" y="944" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">SORTED BY STARS</text>
    ${posterRepositories(model, colors)}
    <path class="em-rule" style="animation-delay:.62s" d="M52 1160H868" stroke="${colors.line}" stroke-opacity=".13"/>

    <g clip-path="url(#${PREFIX}-ticker)">
      <rect x="32" y="1168" width="856" height="40" rx="20" fill="${colors.accent}" fill-opacity=".14"/>
      <g>
        <animateTransform attributeName="transform" type="translate" from="0 0" to="-${tickerWidth.toFixed(1)} 0" dur="18s" repeatCount="indefinite"/>
        <text x="52" y="1194" fill="${colors.accent}" class="mono" font-size="9" letter-spacing="1.3">${escapeXml(tickerLabel)}</text>
        <text x="${(52 + tickerWidth).toFixed(1)}" y="1194" fill="${colors.accent}" class="mono" font-size="9" letter-spacing="1.3">${escapeXml(tickerLabel)}</text>
      </g>
    </g>
    <text x="52" y="1248" fill="${colors.textSoft}" class="sans" font-size="${profileUrl.fontSize}" font-weight="500">${escapeXml(profileUrl.text)}</text>
    <text x="52" y="1274" fill="${colors.muted}" class="mono" font-size="${footerIdentity.fontSize}" letter-spacing=".5">${escapeXml(footerIdentity.text)}</text>
    <text x="868" y="1248" fill="${colors.muted}" class="mono" font-size="${footerNote.fontSize}" letter-spacing="1.1" text-anchor="end">${escapeXml(footerNote.text)}</text>
    <text x="868" y="1274" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".9" text-anchor="end">DYNAMIC SVG / 5 MIN CACHE</text>
    <text x="52" y="1310" fill="${colors.dim}" class="mono" font-size="${footerTech.fontSize}" letter-spacing="1.2">${escapeXml(footerTech.text)}</text>
    <g>
      <circle class="live-dot" cx="52" cy="1332" r="2.8" fill="${colors.accent}"/>
      <text x="64" y="1336" fill="${colors.muted}" class="mono" font-size="${dataLabel.fontSize}" letter-spacing="1.1">${escapeXml(dataLabel.text)}</text>
      <text x="868" y="1336" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".9" text-anchor="end">UPDATED ${model.syncLabel} CST</text>
    </g>
  </g>
  <rect x=".75" y=".75" width="918.5" height="1358.5" rx="27.5" stroke="${colors.line}" stroke-opacity=".14"/>
</svg>`;
}
