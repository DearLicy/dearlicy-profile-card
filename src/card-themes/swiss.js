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

const PREFIX = "sw";

function statsRow(model, colors) {
  const entries = [
    ["STARS", formatNumber(model.stars), ""],
    ["RANK", escapeXml(model.rank.level), `${model.rank.score.toFixed(1)} / 100`],
    ["FOLLOWERS", formatNumber(model.followers), ""],
    ["REPOSITORIES", formatNumber(model.repositories), ""],
    ["CONTRIBUTIONS", formatNumber(model.contributions), "1Y"],
  ];
  const xs = [52, 215, 378, 541, 704];
  return entries
    .map(([label, value, note], index) => {
      const x = xs[index];
      const fitted = fitText(value, {
        fontSize: 48,
        minFontSize: 24,
        maxWidth: 138,
        weight: 600,
      });
      return `
        <g class="rise" style="animation-delay:${(0.12 + index * 0.05).toFixed(2)}s">
          <text x="${x}" y="506" fill="${colors.text}" class="sans tabular" font-size="${fitted.fontSize}" font-weight="600" letter-spacing="-1.6">${escapeXml(fitted.text)}</text>
          <text x="${x}" y="530" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.2">${label}</text>
          ${note ? `<text x="${x}" y="548" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".8">${note}</text>` : ""}
        </g>
        ${index > 0 ? `<path d="M${x - 15} 458V552" stroke="${colors.line}" stroke-opacity=".16"/>` : ""}`;
    })
    .join("");
}

function languageDonut(model, colors) {
  const total = model.totalLanguageBytes || 1;
  const shown = model.languages.reduce((sum, language) => sum + language.bytes, 0);
  const rest = Math.max(total - shown, 0);
  let offset = 0;
  const arcs = model.languages
    .map((language, index) => {
      const percent = (language.bytes / (shown + rest || 1)) * 100;
      const dash = Math.max(percent - 0.35, 0);
      const arc = `<circle cx="240" cy="720" r="102" pathLength="100" stroke="${escapeXml(language.color)}" stroke-width="24" stroke-dasharray="0 100" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 240 720)">
        <animate attributeName="stroke-dasharray" from="0 100" to="${dash.toFixed(2)} ${(100 - dash).toFixed(2)}" dur=".9s" begin="${(0.28 + index * 0.06).toFixed(2)}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .8 .3 1"/>
      </circle>`;
      offset += percent;
      return arc;
    })
    .join("");
  const legend = model.languages
    .map((language, index) => {
      const column = index < 3 ? 0 : 1;
      const row = index % 3;
      const x = column === 0 ? 388 : 638;
      const y = 682 + row * 34;
      const percent = (language.bytes / (shown + rest || 1)) * 100;
      const name = fitText(language.name, {
        fontSize: 12,
        minFontSize: 9,
        maxWidth: 165,
        weight: 500,
      });
      return `
        <g class="rise" style="animation-delay:${(0.3 + index * 0.05).toFixed(2)}s">
          <rect x="${x}" y="${y - 11}" width="7" height="7" fill="${escapeXml(language.color)}"/>
          <text x="${x + 15}" y="${y}" fill="${colors.textSoft}" class="sans" font-size="${name.fontSize}" font-weight="500">${escapeXml(name.text)}</text>
          <text x="${x + 220}" y="${y}" fill="${colors.muted}" class="mono" font-size="9" text-anchor="end">${percent.toFixed(1)}%</text>
        </g>`;
    })
    .join("");
  return `
    <circle cx="240" cy="720" r="102" stroke="${colors.track}" stroke-width="24"/>
    <g class="sw-donut">
      ${arcs}
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 240 720" to="360 240 720" dur="60s" repeatCount="indefinite"/>
        <circle cx="240" cy="618" r="2.5" fill="${colors.accent}"/>
      </g>
    </g>
    <text x="240" y="726" fill="${colors.text}" class="sans tabular" font-size="38" font-weight="600" text-anchor="middle">${model.languageCount}</text>
    <text x="240" y="746" fill="${colors.muted}" class="mono" font-size="7.5" letter-spacing="1.1" text-anchor="middle">LANGUAGES</text>
    ${legend}`;
}

function repositoryTable(model, colors) {
  const maxStars = Math.max(...model.repositoriesTop.map((repo) => repo.stars), 1);
  return model.repositoriesTop
    .map((repository, index) => {
      const y = 960 + index * 48;
      const name = fitText(repository.name, {
        fontSize: 15,
        minFontSize: 10,
        maxWidth: 610,
        weight: 600,
      });
      const fill = Math.max(3, (repository.stars / maxStars) * 756);
      return `
        <g class="rise" style="animation-delay:${(0.46 + index * 0.06).toFixed(2)}s">
          <text x="52" y="${y}" fill="${colors.muted}" class="mono" font-size="9">${String(index + 1).padStart(2, "0")}</text>
          <text x="104" y="${y}" fill="${colors.text}" class="sans" font-size="${name.fontSize}" font-weight="600">${escapeXml(name.text)}</text>
          <text x="868" y="${y}" fill="${colors.textSoft}" class="mono tabular" font-size="10" text-anchor="end">★ ${formatNumber(repository.stars)}</text>
          <path d="M104 ${y + 12}H868" stroke="${colors.line}" stroke-opacity=".17"/>
          <path d="M104 ${y + 12}H${(104 + fill).toFixed(1)}" stroke="${colors.accent}" stroke-width="1.5" stroke-dasharray="0 756">
            <animate attributeName="stroke-dasharray" from="0 756" to="${fill.toFixed(1)} 756" dur=".8s" begin="${(0.52 + index * 0.06).toFixed(2)}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .8 .3 1"/>
          </path>
        </g>`;
    })
    .join("");
}

export function renderSwissTheme(model, config, { backgroundDataUri = "" } = {}) {
  const colors = config.colors;
  const background = backgroundLayer(config, colors, backgroundDataUri, PREFIX, {
    overlayOpacity: 0.16,
  });
  const mark = fitText(model.mark, {
    fontSize: 18,
    minFontSize: 10,
    maxWidth: 430,
    letterSpacing: 1.8,
    weight: 700,
  });
  const brandSubtitle = fitText(model.brandSubtitle, {
    fontSize: 10,
    minFontSize: 8,
    maxWidth: 430,
    letterSpacing: 1.2,
  });
  const headlineOne = fitText(model.headlineOne, {
    fontSize: 68,
    minFontSize: 30,
    maxWidth: 495,
    letterSpacing: -3,
    weight: 700,
  });
  const headlineTwo = fitText(model.headlineTwo, {
    fontSize: 68,
    minFontSize: 30,
    maxWidth: 495,
    letterSpacing: -3,
    weight: 700,
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
  const footerNote = fitText(model.footerNote, {
    fontSize: 8.5,
    minFontSize: 7,
    maxWidth: 330,
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
    fontSize: 18,
    minFontSize: 11,
    maxWidth: 360,
    weight: 600,
  });
  const footerIdentity = fitText(model.footerIdentity, {
    fontSize: 9,
    minFontSize: 7,
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

  return `${openSvg(model)}
  <defs>
    <linearGradient id="${PREFIX}-bg" x1="0" y1="0" x2="920" y2="1360" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.background[0]}"/>
      <stop offset=".5" stop-color="${colors.background[1]}"/>
      <stop offset="1" stop-color="${colors.background[2]}"/>
    </linearGradient>
    <pattern id="${PREFIX}-grid" width="56" height="56" patternUnits="userSpaceOnUse">
      <path d="M56 0H0V56" stroke="${colors.grid}" stroke-opacity=".08"/>
    </pattern>
    <clipPath id="${PREFIX}-card"><rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}"/></clipPath>
    <clipPath id="${PREFIX}-avatar"><rect x="684" y="122" width="164" height="164"/></clipPath>
    <clipPath id="${PREFIX}-avatar-small"><rect x="56" y="58" width="48" height="48"/></clipPath>
    ${background.defs}
  </defs>
  <style>
    ${COMMON_STYLE}
    .sw-donut { transform-box: fill-box; transform-origin: center; }
    .sw-run { animation: swRun 9s linear infinite; }
    .sw-run-2 { animation: swRun 13s linear infinite reverse; animation-delay: -4s; }
    .sw-shift { animation: swShift 7s ease-in-out infinite; }
    .sw-frame { transform-box: fill-box; transform-origin: center; animation: swFrame 26s linear infinite; }
    .sw-rule { transform-box: fill-box; transform-origin: left center; animation: swRule 1s cubic-bezier(.22,1,.36,1) both; }
    @keyframes swRun { from { transform: translateX(0); } to { transform: translateX(780px); } }
    @keyframes swShift { 0%,100% { transform: translate(0,0); } 50% { transform: translate(5px,-4px); } }
    @keyframes swFrame { from { transform: rotate(0); } to { transform: rotate(360deg); } }
    @keyframes swRule { from { opacity: .08; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }
    @media (prefers-reduced-motion: reduce) {
      .sw-run, .sw-run-2, .sw-shift, .sw-frame { animation: none; }
      .sw-rule { animation: none; opacity: 1; transform: none; }
    }
  </style>
  <g clip-path="url(#${PREFIX}-card)">
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-bg)"/>
    ${background.body}
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-grid)"/>
    <path d="M28 0V1360M252 0V1360M476 0V1360M700 0V1360M896 0V1360" stroke="${colors.line}" stroke-opacity=".07"/>
    <path class="sw-rule" style="animation-delay:.08s" d="M0 112H920" stroke="${colors.line}" stroke-opacity=".14"/>
    <path d="M0 396H920M0 574H920M0 852H920M0 1168H920" stroke="${colors.line}" stroke-opacity=".09"/>

    <rect x="56" y="58" width="48" height="48" fill="${colors.accent}"/>
    <rect x="56" y="58" width="10" height="10" fill="${colors.text}"/>
    ${avatarMarkup(model, colors, {
      x: 56,
      y: 58,
      width: 48,
      height: 48,
      clipId: `${PREFIX}-avatar-small`,
      fontSize: 16,
      shape: "rect",
    })}
    <text x="124" y="74" fill="${colors.text}" class="sans" font-size="${mark.fontSize}" font-weight="700" letter-spacing="${(1.8 * (mark.fontSize / 18)).toFixed(2)}">${escapeXml(mark.text)}</text>
    <text x="124" y="94" fill="${colors.muted}" class="sans" font-size="${brandSubtitle.fontSize}" letter-spacing="${(1.2 * (brandSubtitle.fontSize / 10)).toFixed(2)}">${escapeXml(brandSubtitle.text)}</text>
    <text x="868" y="62" fill="${colors.text}" class="mono" font-size="9" letter-spacing="1.2" text-anchor="end">PROFILE / 05</text>
    <g>
      <rect class="live-dot" x="704" y="80" width="5" height="5" fill="${colors.accent}"/>
      <text x="868" y="86" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">LIVE · ${model.syncLabel}</text>
    </g>
    <rect class="sw-run" x="52" y="104" width="18" height="3" fill="${colors.accent}"/>
    <rect class="sw-run-2" x="52" y="110" width="9" height="1.5" fill="${colors.accent}" opacity=".45"/>

    <g class="soft-rise" style="animation-delay:.04s">
      <text x="52" y="190" fill="${colors.text}" class="sans" font-size="${headlineOne.fontSize}" font-weight="700" letter-spacing="${(-3 * (headlineOne.fontSize / 68)).toFixed(2)}">${escapeXml(headlineOne.text)}</text>
    </g>
    <g class="soft-rise" style="animation-delay:.1s">
      <text x="52" y="258" fill="${colors.accent}" class="sans" font-size="${headlineTwo.fontSize}" font-weight="700" letter-spacing="${(-3 * (headlineTwo.fontSize / 68)).toFixed(2)}">${escapeXml(headlineTwo.text)}</text>
    </g>
    <g class="soft-rise" style="animation-delay:.16s">
      <text x="54" y="298" fill="${colors.muted}" class="sans" font-size="${intro.fontSize}">${escapeXml(intro.text)}</text>
    </g>
    <g class="rise" style="animation-delay:.08s">
      <rect x="52" y="316" width="${buildingWidth.toFixed(1)}" height="30" fill="${colors.text}"/>
      <text x="66" y="335" fill="${colors.badgeText}" class="mono" font-size="${building.fontSize}" letter-spacing=".8">${escapeXml(building.text)}</text>
    </g>
    <text x="52" y="370" fill="${colors.dim}" class="mono" font-size="${context.fontSize}" letter-spacing="1.3">${escapeXml(context.text)}</text>

    <g class="sw-frame">
      <rect x="656" y="94" width="228" height="228" fill="none" stroke="${colors.accent}" stroke-opacity=".17" stroke-dasharray="2 9"/>
      <path d="M656 94h24M656 94v24M884 322h-24M884 322v-24" stroke="${colors.accent}" stroke-opacity=".7" stroke-width="2"/>
    </g>
    <g class="sw-shift">
      <rect x="700" y="106" width="164" height="164" fill="${colors.accent}" fill-opacity=".16"/>
      <rect x="684" y="122" width="164" height="164" fill="${colors.panel}" stroke="${colors.text}" stroke-width="1"/>
      ${avatarMarkup(model, colors, {
        x: 684,
        y: 122,
        width: 164,
        height: 164,
        clipId: `${PREFIX}-avatar`,
        fontSize: 40,
        shape: "rect",
      })}
    </g>
    <path d="M684 122h14M684 122v14M848 286h-14M848 286v-14" stroke="${colors.accent}" stroke-width="2"/>
    <text x="766" y="310" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing="1.1" text-anchor="middle">PORTRAIT / LIVE</text>

    <text x="52" y="432" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.4">INDEX / STATS</text>
    <text x="868" y="432" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">SYNCED ${model.syncLabel}</text>
    ${statsRow(model, colors)}
    <path class="sw-rule" style="animation-delay:.34s" d="M52 574H868" stroke="${colors.line}" stroke-opacity=".16"/>

    <text x="52" y="612" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.4">LANGUAGE / DISTRIBUTION</text>
    <text x="868" y="612" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">${formatBytes(model.totalLanguageBytes).toUpperCase()} / ${model.languageCount} FOUND</text>
    ${languageDonut(model, colors)}
    <path class="sw-rule" style="animation-delay:.48s" d="M52 852H868" stroke="${colors.line}" stroke-opacity=".16"/>

    <text x="52" y="890" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.4">REPOSITORY / TABLE</text>
    <text x="868" y="890" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">SORTED BY STARS</text>
    <text x="52" y="924" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing="1">NO.</text>
    <text x="104" y="924" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing="1">REPOSITORY</text>
    <text x="868" y="924" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing="1" text-anchor="end">STARS</text>
    <path d="M52 936H868" stroke="${colors.line}" stroke-opacity=".2"/>
    ${repositoryTable(model, colors)}
    <path class="sw-rule" style="animation-delay:.64s" d="M52 1168H868" stroke="${colors.line}" stroke-opacity=".16"/>

    <text x="52" y="1208" fill="${colors.text}" class="sans" font-size="${profileUrl.fontSize}" font-weight="600">${escapeXml(profileUrl.text)}</text>
    <text x="52" y="1234" fill="${colors.muted}" class="mono" font-size="${footerIdentity.fontSize}" letter-spacing=".5">${escapeXml(footerIdentity.text)}</text>
    <text x="868" y="1208" fill="${colors.muted}" class="mono" font-size="${footerNote.fontSize}" letter-spacing="1.1" text-anchor="end">${escapeXml(footerNote.text)}</text>
    <text x="868" y="1234" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".9" text-anchor="end">DYNAMIC SVG / 5 MIN CACHE</text>
    <text x="52" y="1272" fill="${colors.dim}" class="mono" font-size="${footerTech.fontSize}" letter-spacing="1.2">${escapeXml(footerTech.text)}</text>
    <g>
      <rect class="live-dot" x="52" y="1304" width="5" height="5" fill="${colors.accent}"/>
      <text x="64" y="1310" fill="${colors.muted}" class="mono" font-size="${dataLabel.fontSize}" letter-spacing="1.1">${escapeXml(dataLabel.text)}</text>
      <text x="868" y="1310" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".9" text-anchor="end">UPDATED ${model.syncLabel} CST</text>
    </g>
  </g>
  <rect x=".5" y=".5" width="919" height="1359" stroke="${colors.text}" stroke-opacity=".45"/>
</svg>`;
}
