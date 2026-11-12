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

const PREFIX = "tc";

function statBoxes(model, colors) {
  const boxes = [
    { label: "STARS", value: formatNumber(model.stars), note: "TOTAL" },
    { label: "REPOSITORIES", value: formatNumber(model.repositories), note: "PUBLIC" },
    { label: "FOLLOWERS", value: formatNumber(model.followers), note: "NETWORK" },
    { label: "CONTRIBUTIONS", value: formatNumber(model.contributions), note: "PAST YEAR" },
    { label: "LANGUAGES", value: formatNumber(model.languageCount), note: "DETECTED" },
    { label: "RANK", value: escapeXml(model.rank.level), note: `${model.rank.score.toFixed(1)} / 100` },
  ];
  const xs = [52, 330, 608];
  const ys = [456, 544];
  return boxes
    .map((box, index) => {
      const x = xs[index % 3];
      const y = ys[Math.floor(index / 3)];
      const value = fitText(box.value, {
        fontSize: 28,
        minFontSize: 18,
        maxWidth: 220,
        mono: true,
        weight: 600,
      });
      return `
        <g class="rise" style="animation-delay:${(0.1 + index * 0.05).toFixed(2)}s">
          <rect x="${x}" y="${y}" width="260" height="72" rx="8" fill="${colors.panel}" fill-opacity=".32" stroke="${colors.line}" stroke-opacity=".2"/>
          <path d="M${x} ${y + 18}H${x + 260}" stroke="${colors.line}" stroke-opacity=".1"/>
          <text x="${x + 16}" y="${y + 17}" fill="${colors.accent}" class="mono" font-size="8" letter-spacing="1.2">&gt; ${box.label}</text>
          <text x="${x + 16}" y="${y + 49}" fill="${colors.text}" class="mono tabular" font-size="${value.fontSize}" font-weight="600">${escapeXml(value.text)}</text>
          <text x="${x + 244}" y="${y + 49}" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".8" text-anchor="end">${box.note}</text>
        </g>`;
    })
    .join("");
}

function languageConsole(model, colors) {
  const total = model.totalLanguageBytes || 1;
  const shown = model.languages.reduce((sum, language) => sum + language.bytes, 0);
  const rest = Math.max(total - shown, 0);
  return model.languages
    .map((language, index) => {
      const percent = (language.bytes / (shown + rest || 1)) * 100;
      const y = 720 + index * 27;
      const name = fitText(language.name, {
        fontSize: 10,
        minFontSize: 8,
        maxWidth: 148,
        mono: true,
      });
      const width = Math.max(1, (language.bytes / (shown + rest || 1)) * 520);
      return `
        <g class="rise" style="animation-delay:${(0.3 + index * 0.04).toFixed(2)}s">
          <text x="52" y="${y}" fill="${colors.dim}" class="mono" font-size="8">0${index + 1}</text>
          <text x="82" y="${y}" fill="${colors.textSoft}" class="mono" font-size="${name.fontSize}">${escapeXml(name.text)}</text>
          <rect x="240" y="${y - 7}" width="520" height="7" rx="3.5" fill="${colors.track}" fill-opacity=".75"/>
          <rect x="240" y="${y - 7}" width="0" height="7" rx="3.5" fill="${escapeXml(language.color)}">
            <animate attributeName="width" from="0" to="${width.toFixed(1)}" dur=".8s" begin="${(0.34 + index * 0.04).toFixed(2)}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .8 .3 1"/>
          </rect>
          <text x="868" y="${y}" fill="${colors.muted}" class="mono" font-size="8.5" text-anchor="end">${percent.toFixed(1)}%</text>
        </g>`;
    })
    .join("");
}

function repositoryConsole(model, colors) {
  const rows = model.repositoriesTop
    .map((repository, index) => {
      const y = 950 + index * 46;
      const name = fitText(repository.name, {
        fontSize: 13,
        minFontSize: 9,
        maxWidth: 590,
        mono: true,
        weight: 500,
      });
      return `
        <g class="rise" style="animation-delay:${(0.5 + index * 0.06).toFixed(2)}s">
          <text x="52" y="${y}" fill="${colors.dim}" class="mono" font-size="8">${String(index + 1).padStart(2, "0")}</text>
          <text x="82" y="${y}" fill="${colors.textSoft}" class="mono" font-size="${name.fontSize}">${escapeXml(name.text)}</text>
          <text x="868" y="${y}" fill="${colors.accent}" class="mono" font-size="10" text-anchor="end">★ ${formatNumber(repository.stars)}</text>
          <path d="M52 ${y + 14}H868" stroke="${colors.line}" stroke-opacity=".1"/>
        </g>`;
    })
    .join("");
  return rows;
}

function terminalPort(model, colors) {
  return `
    <g>
      <rect x="636" y="100" width="236" height="244" rx="12" fill="${colors.panel}" fill-opacity=".62" stroke="${colors.accent}" stroke-opacity=".28"/>
      <path d="M636 126H872" stroke="${colors.line}" stroke-opacity=".18"/>
      <circle cx="652" cy="114" r="2.5" fill="${colors.accent}" fill-opacity=".8"/>
      <text x="664" y="117" fill="${colors.muted}" class="mono" font-size="7.5" letter-spacing="1.1">PORT / 01</text>
      <text x="856" y="117" fill="${colors.dim}" class="mono" font-size="7" text-anchor="end">LIVE</text>
      <clipPath id="${PREFIX}-port-clip"><rect x="636" y="126" width="236" height="218" rx="10"/></clipPath>
      <g clip-path="url(#${PREFIX}-port-clip)">
        <path d="M636 145H872M636 169H872M636 193H872M636 217H872M636 241H872M636 265H872M636 289H872M636 313H872" stroke="${colors.line}" stroke-opacity=".08"/>
        <path d="M660 126V344M684 126V344M708 126V344M732 126V344M756 126V344M780 126V344M804 126V344M828 126V344M852 126V344" stroke="${colors.line}" stroke-opacity=".06"/>
        <g class="tc-rain mono" fill="${colors.accent}" fill-opacity=".04" font-size="6.5" letter-spacing="1.7">
          <text x="640" y="140">0101 1010 0110 1101 0011</text>
          <text x="640" y="224">1010 0110 1101 0011 1001</text>
          <text x="640" y="308">0110 1101 0011 1001 0101</text>
        </g>
        <g class="tc-port-float">
          <clipPath id="${PREFIX}-avatar"><circle cx="754" cy="214" r="50"/></clipPath>
          <circle cx="754" cy="214" r="55" stroke="${colors.accent}" stroke-opacity=".25" stroke-dasharray="2 5"/>
          ${avatarMarkup(model, colors, {
            x: 704,
            y: 164,
            width: 100,
            height: 100,
            clipId: `${PREFIX}-avatar`,
            fontSize: 34,
          })}
          <circle cx="754" cy="214" r="51" stroke="${colors.accent}" stroke-opacity=".55"/>
          <circle class="tc-ping" cx="754" cy="214" r="58" stroke="${colors.accent}" stroke-opacity=".34"/>
        </g>
        <g>
          <circle cx="754" cy="214" r="78" stroke="${colors.line}" stroke-opacity=".1"/>
          <g>
            <animateTransform attributeName="transform" type="rotate" from="0 754 214" to="360 754 214" dur="18s" repeatCount="indefinite"/>
            <circle cx="754" cy="136" r="2.8" fill="${colors.accent}"/>
            <circle cx="832" cy="214" r="1.8" fill="${colors.accent}" fill-opacity=".7"/>
          </g>
        </g>
        <rect x="636" y="126" width="236" height="22" fill="url(#${PREFIX}-scan)">
          <animate attributeName="y" from="126" to="344" dur="4.5s" repeatCount="indefinite"/>
        </rect>
      </g>
      <path d="M656 334h16M664 326v16M832 334h16M840 326v16" stroke="${colors.accent}" stroke-opacity=".55" stroke-width="1.1"/>
      <text x="754" y="366" fill="${colors.muted}" class="mono" font-size="7.5" letter-spacing="1.1" text-anchor="middle">[ TERMINAL PORT ]</text>
      <g>
        <rect x="690" y="380" width="8" height="14" fill="${colors.accent}" opacity=".38"><animate attributeName="height" values="6;16;9;18;6" dur="1.8s" repeatCount="indefinite"/></rect>
        <rect x="704" y="374" width="8" height="20" fill="${colors.accent}" opacity=".55"><animate attributeName="height" values="14;5;18;8;14" dur="1.4s" repeatCount="indefinite"/></rect>
        <rect x="718" y="382" width="8" height="12" fill="${colors.accent}" opacity=".4"><animate attributeName="height" values="8;16;6;14;8" dur="1.7s" repeatCount="indefinite"/></rect>
        <rect x="732" y="376" width="8" height="18" fill="${colors.accent}" opacity=".6"><animate attributeName="height" values="18;6;12;4;18" dur="1.3s" repeatCount="indefinite"/></rect>
        <rect x="746" y="386" width="8" height="8" fill="${colors.accent}" opacity=".3"><animate attributeName="height" values="4;12;6;16;4" dur="2s" repeatCount="indefinite"/></rect>
      </g>
    </g>`;
}

export function renderTerminalTheme(model, config, { backgroundDataUri = "" } = {}) {
  const colors = config.colors;
  const background = backgroundLayer(config, colors, backgroundDataUri, PREFIX, {
    overlayOpacity: 0.24,
  });
  const prompt = fitText(`${model.login.toLowerCase()}@github:~$ profile --live`, {
    fontSize: 10,
    minFontSize: 8,
    maxWidth: 500,
    mono: true,
    letterSpacing: 0.4,
  });
  const mark = fitText(model.mark, {
    fontSize: 19,
    minFontSize: 11,
    maxWidth: 470,
    mono: true,
    letterSpacing: 1.5,
    weight: 600,
  });
  const brandSubtitle = fitText(model.brandSubtitle, {
    fontSize: 9,
    minFontSize: 7,
    maxWidth: 500,
    mono: true,
    letterSpacing: 0.8,
  });
  const headlineOne = fitText(model.headlineOne, {
    fontSize: 38,
    minFontSize: 22,
    maxWidth: 500,
    mono: true,
    letterSpacing: -1.2,
    weight: 500,
  });
  const headlineTwo = fitText(model.headlineTwo, {
    fontSize: 38,
    minFontSize: 22,
    maxWidth: 500,
    mono: true,
    letterSpacing: -1.2,
    weight: 500,
  });
  const intro = fitText(model.intro, {
    fontSize: 12.5,
    minFontSize: 9,
    maxWidth: 500,
    mono: true,
  });
  const building = fitText(model.buildingLabel, {
    fontSize: 8.5,
    minFontSize: 7,
    maxWidth: 480,
    mono: true,
    letterSpacing: 0.7,
  });
  const buildingWidth = Math.min(540, Math.max(250, building.width + 38));
  const context = fitText(model.contextLine, {
    fontSize: 8.5,
    minFontSize: 7,
    maxWidth: 480,
    mono: true,
    letterSpacing: 1.2,
  });
  const footerNote = fitText(model.footerNote, {
    fontSize: 8.5,
    minFontSize: 7,
    maxWidth: 330,
    mono: true,
    letterSpacing: 0.8,
  });
  const footerTech = fitText(model.footerTech, {
    fontSize: 8,
    minFontSize: 6.5,
    maxWidth: 800,
    mono: true,
    letterSpacing: 1.1,
  });
  const profileUrl = fitText(`github.com/${model.login}`, {
    fontSize: 16,
    minFontSize: 10,
    maxWidth: 310,
    mono: true,
    weight: 500,
  });
  const footerIdentity = fitText(model.footerIdentity, {
    fontSize: 9,
    minFontSize: 7,
    maxWidth: 300,
    mono: true,
    letterSpacing: 0.5,
  });
  const dataLabel = fitText(model.dataLabel, {
    fontSize: 8,
    minFontSize: 6.5,
    maxWidth: 420,
    mono: true,
    letterSpacing: 1,
  });

  return `${openSvg(model)}
  <defs>
    <linearGradient id="${PREFIX}-bg" x1="0" y1="0" x2="920" y2="1360" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.background[0]}"/>
      <stop offset=".54" stop-color="${colors.background[1]}"/>
      <stop offset="1" stop-color="${colors.background[2]}"/>
    </linearGradient>
    <linearGradient id="${PREFIX}-scan" x1="0" y1="0" x2="0" y2="22" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.accent}" stop-opacity="0"/>
      <stop offset=".6" stop-color="${colors.accent}" stop-opacity=".18"/>
      <stop offset="1" stop-color="${colors.accent}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${PREFIX}-glow" cx="0" cy="0" r="1" gradientTransform="translate(750 220) rotate(90) scale(330 330)" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.accent}" stop-opacity=".13"/>
      <stop offset="1" stop-color="${colors.accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="${PREFIX}-scanlines" width="6" height="6" patternUnits="userSpaceOnUse">
      <path d="M0 0H6" stroke="${colors.line}" stroke-opacity=".04"/>
    </pattern>
    <pattern id="${PREFIX}-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" stroke="${colors.accent}" stroke-opacity=".035"/>
    </pattern>
    <clipPath id="${PREFIX}-card"><rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="28"/></clipPath>
    ${background.defs}
  </defs>
  <style>
    ${COMMON_STYLE}
    .tc-port-float { transform-box: fill-box; transform-origin: center; animation: tcPortFloat 7s ease-in-out infinite; }
    .tc-blink { animation: tcBlink 1.1s steps(1) infinite; }
    .tc-rule { transform-box: fill-box; transform-origin: left center; animation: tcRule 1s cubic-bezier(.22,1,.36,1) both; }
    .tc-ping { transform-box: fill-box; transform-origin: center; animation: tcPing 4s ease-out infinite; }
    .tc-rain { animation: tcRain 9s linear infinite; }
    @keyframes tcPortFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
    @keyframes tcBlink { 0%,48% { opacity: 1; } 49%,100% { opacity: 0; } }
    @keyframes tcRule { from { opacity: .08; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }
    @keyframes tcPing { 0% { opacity: .4; transform: scale(.9); } 55%,100% { opacity: 0; transform: scale(1.65); } }
    @keyframes tcRain { from { transform: translateY(-120px); } to { transform: translateY(120px); } }
    @media (prefers-reduced-motion: reduce) {
      .tc-port-float, .tc-blink, .tc-ping, .tc-rain { animation: none; }
      .tc-rule { animation: none; opacity: 1; transform: none; }
    }
  </style>
  <g clip-path="url(#${PREFIX}-card)">
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-bg)"/>
    ${background.body}
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-glow)"/>
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-grid)"/>
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-scanlines)"/>
    <rect x="0" y="-70" width="${CARD_WIDTH}" height="70" fill="url(#${PREFIX}-scan)" opacity=".45">
      <animate attributeName="y" values="-70;1360" dur="10s" repeatCount="indefinite"/>
    </rect>

    <rect x="32" y="32" width="856" height="56" rx="13" fill="${colors.panel}" fill-opacity=".72" stroke="${colors.line}" stroke-opacity=".2"/>
    <circle cx="54" cy="60" r="4" fill="${colors.accent}" fill-opacity=".9"/>
    <circle cx="69" cy="60" r="4" fill="${colors.line}" fill-opacity=".24"/>
    <circle cx="84" cy="60" r="4" fill="${colors.line}" fill-opacity=".14"/>
    <text x="120" y="64" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.1">~/github/${escapeXml(model.login.toLowerCase())}/profile.svg</text>
    <g>
      <circle class="live-dot" cx="624" cy="60" r="2.8" fill="${colors.accent}"/>
      <text x="636" y="64" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1">SESSION 01 / LIVE</text>
    </g>
    <text x="856" y="64" fill="${colors.dim}" class="mono" font-size="7.5" text-anchor="end">UTF-8</text>

    <g class="soft-rise" style="animation-delay:.02s">
      <text x="52" y="130" fill="${colors.accent}" class="mono" font-size="${prompt.fontSize}" letter-spacing=".4">${escapeXml(prompt.text)}</text>
      <rect class="tc-blink" x="${(52 + prompt.width + 8).toFixed(1)}" y="120" width="7" height="13" fill="${colors.accent}"/>
    </g>
    <text x="52" y="166" fill="${colors.text}" class="mono" font-size="${mark.fontSize}" font-weight="600" letter-spacing="${(1.5 * (mark.fontSize / 19)).toFixed(2)}">${escapeXml(mark.text)}</text>
    <text x="52" y="187" fill="${colors.muted}" class="mono" font-size="${brandSubtitle.fontSize}" letter-spacing=".8">${escapeXml(brandSubtitle.text)}</text>

    <g class="soft-rise" style="animation-delay:.06s">
      <text x="52" y="240" fill="${colors.textSoft}" class="mono" font-size="${headlineOne.fontSize}" font-weight="500" letter-spacing="${(-1.2 * (headlineOne.fontSize / 38)).toFixed(2)}">${escapeXml(headlineOne.text)}</text>
    </g>
    <g class="soft-rise" style="animation-delay:.12s">
      <text x="52" y="292" fill="${colors.accent}" class="mono" font-size="${headlineTwo.fontSize}" font-weight="500" letter-spacing="${(-1.2 * (headlineTwo.fontSize / 38)).toFixed(2)}">${escapeXml(headlineTwo.text)}</text>
    </g>
    <g class="soft-rise" style="animation-delay:.18s">
      <text x="52" y="326" fill="${colors.muted}" class="mono" font-size="${intro.fontSize}">${escapeXml(intro.text)}</text>
    </g>
    <g class="rise" style="animation-delay:.08s">
      <rect x="52" y="346" width="${buildingWidth.toFixed(1)}" height="26" rx="5" fill="${colors.accent}" fill-opacity=".08" stroke="${colors.accent}" stroke-opacity=".3"/>
      <text x="64" y="363" fill="${colors.accent}" class="mono" font-size="${building.fontSize}" letter-spacing=".7">&gt; ${escapeXml(building.text)}</text>
    </g>
    <text x="52" y="394" fill="${colors.dim}" class="mono" font-size="${context.fontSize}" letter-spacing="1.1">${escapeXml(context.text)}</text>
    ${terminalPort(model, colors)}
    <path class="tc-rule" style="animation-delay:.24s" d="M52 410H868" stroke="${colors.line}" stroke-opacity=".15"/>

    <text x="52" y="440" fill="${colors.accent}" class="mono" font-size="9" letter-spacing="1.1">$ stats --snapshot</text>
    <text x="868" y="440" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".8" text-anchor="end">REST / LIVE</text>
    ${statBoxes(model, colors)}
    <path class="tc-rule" style="animation-delay:.38s" d="M52 648H868" stroke="${colors.line}" stroke-opacity=".14"/>

    <text x="52" y="682" fill="${colors.accent}" class="mono" font-size="9" letter-spacing="1.1">$ languages --top 6</text>
    <text x="868" y="682" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".8" text-anchor="end">${formatBytes(model.totalLanguageBytes).toUpperCase()} / ${model.languageCount} FOUND</text>
    ${languageConsole(model, colors)}
    <path class="tc-rule" style="animation-delay:.5s" d="M52 880H868" stroke="${colors.line}" stroke-opacity=".14"/>

    <text x="52" y="916" fill="${colors.accent}" class="mono" font-size="9" letter-spacing="1.1">$ repos --sort=stars</text>
    <text x="868" y="916" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".8" text-anchor="end">TOP 04 / PUBLIC</text>
    ${repositoryConsole(model, colors)}
    <path class="tc-rule" style="animation-delay:.62s" d="M52 1132H868" stroke="${colors.line}" stroke-opacity=".14"/>

    <text x="52" y="1164" fill="${colors.muted}" class="mono" font-size="9" letter-spacing=".4">${escapeXml(model.login.toLowerCase())}@github:~$ echo "BUILD WITH CARE."</text>
    <rect class="tc-blink" x="410" y="1154" width="7" height="12" fill="${colors.accent}"/>
    <text x="52" y="1200" fill="${colors.textSoft}" class="mono" font-size="${profileUrl.fontSize}" font-weight="500">${escapeXml(profileUrl.text)}</text>
    <text x="52" y="1224" fill="${colors.muted}" class="mono" font-size="${footerIdentity.fontSize}" letter-spacing=".5">${escapeXml(footerIdentity.text)}</text>
    <text x="868" y="1164" fill="${colors.muted}" class="mono" font-size="${footerNote.fontSize}" letter-spacing=".8" text-anchor="end">${escapeXml(footerNote.text)}</text>
    <text x="868" y="1200" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".8" text-anchor="end">DYNAMIC SVG / 5 MIN CACHE</text>
    <text x="52" y="1260" fill="${colors.dim}" class="mono" font-size="${footerTech.fontSize}" letter-spacing="1.1">${escapeXml(footerTech.text)}</text>
    <g>
      <circle class="live-dot" cx="52" cy="1298" r="2.8" fill="${colors.accent}"/>
      <text x="64" y="1302" fill="${colors.muted}" class="mono" font-size="${dataLabel.fontSize}" letter-spacing="1">${escapeXml(dataLabel.text)}</text>
      <text x="868" y="1302" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".8" text-anchor="end">UPDATED ${model.syncLabel} CST</text>
    </g>
  </g>
  <rect x=".75" y=".75" width="918.5" height="1358.5" rx="27.5" stroke="${colors.line}" stroke-opacity=".14"/>
</svg>`;
}
