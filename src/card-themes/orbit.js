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
  starField,
} from "../card-kit.js";

const PREFIX = "mo";

function languageRows(model, colors) {
  const total = model.totalLanguageBytes || 1;
  const shown = model.languages.reduce((sum, language) => sum + language.bytes, 0);
  const rest = Math.max(total - shown, 0);
  let cursor = 0;
  const segments = model.languages.map((language) => {
    const width = (language.bytes / (shown + rest || 1)) * 816;
    const segment = `<rect x="${(52 + cursor).toFixed(2)}" y="684" width="${width.toFixed(2)}" height="14" fill="${escapeXml(language.color)}"/>`;
    cursor += width;
    return segment;
  });
  if (rest > 0) {
    segments.push(
      `<rect x="${(52 + cursor).toFixed(2)}" y="684" width="${Math.max(816 - cursor, 0).toFixed(2)}" height="14" fill="${colors.track}"/>`,
    );
  }
  const rows = model.languages.map((language, index) => {
    const column = index < 3 ? 0 : 1;
    const row = index % 3;
    const x = column === 0 ? 52 : 488;
    const y = 746 + row * 39;
    const percent = (language.bytes / (shown + rest || 1)) * 100;
    const name = fitText(language.name, {
      fontSize: 12.5,
      minFontSize: 9.5,
      maxWidth: 252,
    });
    return `
      <g class="rise" style="animation-delay:${(0.34 + index * 0.05).toFixed(2)}s">
        <circle cx="${x + 4}" cy="${y - 4}" r="3.6" fill="${escapeXml(language.color)}"/>
        <text x="${x + 16}" y="${y}" fill="${colors.textSoft}" class="sans" font-size="${name.fontSize}">${escapeXml(name.text)}</text>
        <text x="${x + 368}" y="${y}" fill="${colors.dim}" class="mono" font-size="9.5" text-anchor="end">${percent.toFixed(1)}%</text>
      </g>`;
  });
  return `
    <text x="52" y="648" fill="${colors.muted}" class="mono" font-size="9.5" letter-spacing="1.6">TOP LANGUAGES</text>
    <text x="868" y="648" fill="${colors.dim}" class="mono" font-size="8.5" letter-spacing="1.1" text-anchor="end">${formatBytes(model.totalLanguageBytes).toUpperCase()} / ${model.languageCount} DETECTED</text>
    <clipPath id="${PREFIX}-language-reveal"><rect x="52" y="684" width="0" height="14" rx="7"><animate attributeName="width" from="0" to="816" dur="1.1s" begin=".35s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .8 .3 1"/></rect></clipPath>
    <g clip-path="url(#${PREFIX}-language-reveal)">${segments.join("")}</g>
    <rect x="52.5" y="684.5" width="815" height="13" rx="6.5" stroke="${colors.line}" stroke-opacity=".1"/>
    ${rows.join("")}
    <path class="mo-rule" style="animation-delay:.5s" d="M52 858H868" stroke="${colors.line}" stroke-opacity=".09"/>`;
}

function repositoryRows(model, colors) {
  const maxStars = Math.max(...model.repositoriesTop.map((repo) => repo.stars), 1);
  const cards = model.repositoriesTop
    .map((repository, index) => {
      const x = index % 2 === 0 ? 52 : 472;
      const y = index < 2 ? 922 : 1012;
      const fill = Math.max(4, (repository.stars / maxStars) * 358);
      const name = fitText(repository.name, {
        fontSize: 14.5,
        minFontSize: 10,
        maxWidth: 330,
        weight: 600,
      });
      return `
        <g class="rise" style="animation-delay:${(0.52 + index * 0.08).toFixed(2)}s">
          <rect x="${x}" y="${y}" width="396" height="78" rx="18" fill="${colors.panelFill}" fill-opacity=".04" stroke="${colors.line}" stroke-opacity=".1"/>
          <text x="${x + 18}" y="${y + 30}" fill="${colors.textSoft}" class="sans" font-size="${name.fontSize}" font-weight="600">${escapeXml(name.text)}</text>
          <path d="M${x + 20} ${y + 48}l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8L${x + 20} ${y + 48}Z" fill="${colors.accent}" fill-opacity=".92"/>
          <text x="${x + 35}" y="${y + 59}" fill="${colors.muted}" class="mono" font-size="9">${formatNumber(repository.stars)}</text>
          <rect x="${x + 18}" y="${y + 67}" width="358" height="3" rx="1.5" fill="${colors.line}" fill-opacity=".09"/>
          <rect x="${x + 18}" y="${y + 67}" width="0" height="3" rx="1.5" fill="${colors.accent}" fill-opacity=".58">
            <animate attributeName="width" from="0" to="${fill.toFixed(1)}" dur=".9s" begin="${(0.58 + index * 0.08).toFixed(2)}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .8 .3 1"/>
          </rect>
        </g>`;
    })
    .join("");
  return `
    <text x="52" y="898" fill="${colors.muted}" class="mono" font-size="9.5" letter-spacing="1.6">FEATURED REPOSITORIES</text>
    <text x="868" y="898" fill="${colors.dim}" class="mono" font-size="8.5" letter-spacing="1.1" text-anchor="end">SORTED BY STARS</text>
    ${cards}
    <path class="mo-rule" style="animation-delay:.64s" d="M52 1126H868" stroke="${colors.line}" stroke-opacity=".09"/>`;
}

function metrics(model, colors) {
  const entries = [
    ["FOLLOWERS", model.followers],
    ["REPOSITORIES", model.repositories],
    ["1Y CONTRIBUTIONS", model.contributions],
    ["LANGUAGES", model.languageCount],
  ];
  return entries
    .map(([label, value], index) => {
      const y = 408 + index * 47;
      return `
        <g class="rise" style="animation-delay:${(0.22 + index * 0.055).toFixed(2)}s">
          <text x="640" y="${y}" fill="${colors.muted}" class="mono" font-size="8.5" letter-spacing="1.1">${label}</text>
          <text x="868" y="${y + 1}" fill="${colors.textSoft}" class="sans tabular" font-size="18" font-weight="600" text-anchor="end">${formatNumber(value)}</text>
          ${index < entries.length - 1 ? `<path d="M640 ${y + 21}H868" stroke="${colors.line}" stroke-opacity=".075"/>` : ""}
        </g>`;
    })
    .join("");
}

function rankGauge(model, colors) {
  const radius = 91;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, model.rank.percentile));
  const filled = (circumference * progress) / 100;
  return `
    <g class="rise" style="animation-delay:.18s">
      <text x="442" y="399" fill="${colors.muted}" class="sans" font-size="9.5" font-weight="600" letter-spacing="1.6" text-anchor="middle">RANK</text>
      <circle cx="442" cy="490" r="${radius}" stroke="${colors.line}" stroke-opacity=".075" stroke-width="7"/>
      <circle cx="442" cy="490" r="${radius}" stroke="url(#${PREFIX}-gauge)" stroke-width="7" stroke-linecap="round" stroke-dasharray="0 ${circumference.toFixed(2)}" transform="rotate(-90 442 490)">
        <animate attributeName="stroke-dasharray" from="0 ${circumference.toFixed(2)}" to="${filled.toFixed(2)} ${circumference.toFixed(2)}" dur="1.7s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .8 .3 1"/>
      </circle>
      <circle cx="442" cy="490" r="34" fill="${colors.accent}" fill-opacity=".055" stroke="${colors.accent}" stroke-opacity=".16"/>
      <text x="442" y="501" fill="${colors.text}" class="sans" font-size="38" font-weight="600" text-anchor="middle">${escapeXml(model.rank.level)}</text>
      <text x="442" y="535" fill="${colors.textSoft}" class="mono tabular" font-size="10.5" letter-spacing=".5" text-anchor="middle">${model.rank.score.toFixed(1)} / 100</text>
      <text x="442" y="601" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing=".85" text-anchor="middle">RANK PERCENTILE · LOWER IS BETTER</text>
    </g>`;
}

function orbitVisual(model, colors) {
  return `
    <g>
      <circle cx="760" cy="190" r="158" fill="${colors.accent}" fill-opacity=".025"/>
      <circle cx="760" cy="190" r="148" stroke="${colors.line}" stroke-opacity=".055"/>
      <circle cx="760" cy="190" r="121" stroke="${colors.line}" stroke-opacity=".09"/>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 760 190" to="360 760 190" dur="34s" repeatCount="indefinite"/>
        <circle cx="760" cy="190" r="136" stroke="${colors.line}" stroke-opacity=".15" stroke-dasharray="1 9"/>
        <circle cx="760" cy="54" r="3.6" fill="${colors.accent}"/>
        <circle cx="883" cy="257" r="2.5" fill="${colors.accent}" fill-opacity=".75"/>
        <circle cx="621" cy="163" r="2.3" fill="${colors.line}" fill-opacity=".3"/>
      </g>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 760 190" to="360 760 190" dur="27s" repeatCount="indefinite"/>
        <circle cx="760" cy="42" r="2.2" fill="${colors.accent}" fill-opacity=".8"/>
        <path d="M760 42A148 148 0 0 1 908 190" stroke="${colors.accent}" stroke-opacity=".2" stroke-dasharray="2 10"/>
      </g>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="360 760 190" to="0 760 190" dur="21s" repeatCount="indefinite"/>
        <path d="M760 90A100 100 0 0 1 860 190" stroke="${colors.accent}" stroke-opacity=".84" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="860" cy="190" r="3.2" fill="${colors.accent}"/>
        <path d="M884 176l7 7-7 7" stroke="${colors.accent}" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 760 190" to="360 760 190" dur="15s" repeatCount="indefinite"/>
        <circle cx="760" cy="190" r="82" stroke="${colors.accent}" stroke-opacity=".26" stroke-dasharray="2 7"/>
      </g>
      <g opacity=".8">
        <circle r="2.2" fill="${colors.accent}">
          <animateMotion path="M646 116C676 82 724 84 744 126" dur="9s" repeatCount="indefinite"/>
        </circle>
        <circle r="1.6" fill="${colors.text}">
          <animateMotion path="M880 236C838 278 804 260 788 222" dur="12s" begin="-4s" repeatCount="indefinite"/>
        </circle>
      </g>
      <circle class="breathe" cx="760" cy="190" r="72" stroke="${colors.accent}" stroke-opacity=".2"/>
      <circle class="mo-halo" cx="760" cy="190" r="68" stroke="${colors.accent}" stroke-opacity=".18"/>
      <circle class="mo-halo mo-halo-2" cx="760" cy="190" r="68" stroke="${colors.accent}" stroke-opacity=".12"/>
      <g class="mo-float">
        <circle cx="760" cy="190" r="62" fill="${colors.panel}" stroke="url(#${PREFIX}-avatar-ring)" stroke-width="1.6"/>
        <clipPath id="${PREFIX}-avatar-clip"><circle cx="760" cy="190" r="61"/></clipPath>
        ${avatarMarkup(model, colors, {
          x: 699,
          y: 129,
          width: 122,
          height: 122,
          clipId: `${PREFIX}-avatar-clip`,
          fontSize: 42,
        })}
      </g>
      <circle cx="760" cy="190" r="61" stroke="${colors.line}" stroke-opacity=".13"/>
      <g class="mo-tick" transform="translate(626 278)">
        <circle cx="4" cy="4" r="2.2" fill="${colors.accent}"/>
        <text x="13" y="7" fill="${colors.dim}" class="mono" font-size="6.8" letter-spacing="1">PUBLIC SIGNAL</text>
      </g>
      <text x="760" y="326" fill="${colors.dim}" class="mono" font-size="7.5" letter-spacing="1.4" text-anchor="middle">ORBITAL PROFILE / LIVE</text>
    </g>`;
}

export function renderOrbitTheme(model, config, { backgroundDataUri = "" } = {}) {
  const colors = config.colors;
  const background = backgroundLayer(config, colors, backgroundDataUri, PREFIX, {
    overlayOpacity: 0.2,
  });
  const mark = fitText(model.mark, {
    fontSize: 13.5,
    minFontSize: 10,
    maxWidth: 430,
    letterSpacing: 2.6,
    weight: 700,
  });
  const brandSubtitle = fitText(model.brandSubtitle, {
    fontSize: 10.5,
    minFontSize: 8,
    maxWidth: 430,
    letterSpacing: 1.5,
    weight: 500,
  });
  const headlineOne = fitText(model.headlineOne, {
    fontSize: 56,
    minFontSize: 30,
    maxWidth: 500,
    letterSpacing: -1.8,
    weight: 600,
  });
  const headlineTwo = fitText(model.headlineTwo, {
    fontSize: 56,
    minFontSize: 30,
    maxWidth: 500,
    letterSpacing: -1.8,
    weight: 600,
  });
  const intro = fitText(model.intro, {
    fontSize: 14.5,
    minFontSize: 10.5,
    maxWidth: 500,
  });
  const building = fitText(model.buildingLabel, {
    fontSize: 8.5,
    minFontSize: 8,
    maxWidth: 500,
    mono: true,
    letterSpacing: 0.8,
  });
  const buildingWidth = Math.min(560, Math.max(250, building.width + 42));
  const context = fitText(model.contextLine, {
    fontSize: 8.5,
    minFontSize: 7,
    maxWidth: 480,
    mono: true,
    letterSpacing: 1.4,
  });
  const stars = fitText(formatNumber(model.stars), {
    fontSize: 94,
    minFontSize: 38,
    maxWidth: 260,
    letterSpacing: -4.2,
    weight: 600,
  });
  const starCaption = fitText(`ACROSS ${formatNumber(model.repositories)} REPOSITORIES`, {
    fontSize: 8.2,
    minFontSize: 7,
    maxWidth: 280,
    mono: true,
    letterSpacing: 1,
  });
  const footerNote = fitText(model.footerNote, {
    fontSize: 8.5,
    minFontSize: 7,
    maxWidth: 360,
    mono: true,
    letterSpacing: 1.3,
  });
  const footerTech = fitText(model.footerTech, {
    fontSize: 8,
    minFontSize: 6.5,
    maxWidth: 800,
    mono: true,
    letterSpacing: 1.2,
  });
  const profileUrl = fitText(`github.com/${model.login}`, {
    fontSize: 16,
    minFontSize: 11,
    maxWidth: 300,
    weight: 500,
  });
  const footerIdentity = fitText(model.footerIdentity, {
    fontSize: 10,
    minFontSize: 8,
    maxWidth: 300,
    mono: true,
    letterSpacing: 0.4,
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
      <stop offset=".52" stop-color="${colors.background[1]}"/>
      <stop offset="1" stop-color="${colors.background[2]}"/>
    </linearGradient>
    <radialGradient id="${PREFIX}-hero-glow" cx="0" cy="0" r="1" gradientTransform="translate(738 150) rotate(90) scale(330 420)" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.glowA}" stop-opacity=".18"/>
      <stop offset="1" stop-color="${colors.glowA}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${PREFIX}-footer-glow" cx="0" cy="0" r="1" gradientTransform="translate(210 1190) rotate(-18) scale(310 520)" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.glowB}" stop-opacity=".12"/>
      <stop offset="1" stop-color="${colors.glowB}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${PREFIX}-avatar-ring" x1="698" y1="128" x2="822" y2="252" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.text}"/>
      <stop offset=".55" stop-color="${colors.accent}"/>
      <stop offset="1" stop-color="${colors.accent2}"/>
    </linearGradient>
    <linearGradient id="${PREFIX}-gauge" x1="351" y1="399" x2="533" y2="581" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.text}"/>
      <stop offset=".55" stop-color="${colors.accent}"/>
      <stop offset="1" stop-color="${colors.accent2}"/>
    </linearGradient>
    <linearGradient id="${PREFIX}-comet" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors.accent}" stop-opacity="0"/>
      <stop offset=".55" stop-color="${colors.accent}" stop-opacity=".65"/>
      <stop offset="1" stop-color="${colors.accent}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="${PREFIX}-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" stroke="${colors.grid}" stroke-opacity=".035"/>
    </pattern>
    <filter id="${PREFIX}-aurora" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="50"/>
    </filter>
    <clipPath id="${PREFIX}-card"><rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="28"/></clipPath>
    ${background.defs}
  </defs>
  <style>
    ${COMMON_STYLE}
    .mo-float { transform-box: fill-box; transform-origin: center; animation: moFloat 8s ease-in-out infinite; }
    .mo-halo { transform-box: fill-box; transform-origin: center; animation: moHalo 4.8s ease-out infinite; }
    .mo-halo-2 { animation-delay: 2.4s; }
    .mo-tick { animation: moTick 4s ease-in-out infinite; }
    .mo-rule { transform-box: fill-box; transform-origin: left center; animation: moRule 1.1s cubic-bezier(.22,1,.36,1) both; }
    @keyframes moFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    @keyframes moHalo { 0% { opacity: 0; transform: scale(.92); } 25% { opacity: .34; } 100% { opacity: 0; transform: scale(1.7); } }
    @keyframes moTick { 0%,100% { opacity: .42; transform: translate(0,0); } 50% { opacity: .92; transform: translate(3px,-2px); } }
    @keyframes moRule { from { opacity: .08; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }
    @media (prefers-reduced-motion: reduce) {
      .mo-float, .mo-halo, .mo-tick { animation: none; }
      .mo-rule { animation: none; opacity: 1; transform: none; }
    }
  </style>
  <g clip-path="url(#${PREFIX}-card)">
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-bg)"/>
    ${background.body}
    <g filter="url(#${PREFIX}-aurora)" opacity=".8">
      <ellipse cx="200" cy="180" rx="240" ry="180" fill="${colors.accent}" fill-opacity=".075">
        <animateTransform attributeName="transform" type="translate" values="0 0; 40 24; 0 0" dur="18s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="820" cy="960" rx="260" ry="190" fill="${colors.accent2}" fill-opacity=".06">
        <animateTransform attributeName="transform" type="translate" values="0 0; -24 -18; 0 0" dur="23s" repeatCount="indefinite"/>
      </ellipse>
    </g>
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-hero-glow)"/>
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-footer-glow)"/>
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${PREFIX}-grid)"/>
    ${starField(colors, 14)}
    <g opacity=".5">
      <rect x="-220" y="28" width="160" height="1.5" fill="url(#${PREFIX}-comet)">
        <animateTransform attributeName="transform" type="translate" values="0 0; 1240 210" dur="12s" repeatCount="indefinite"/>
      </rect>
    </g>
    <g transform="rotate(18 460 660)" opacity=".05">
      <rect x="-480" y="-180" width="150" height="1760" fill="${colors.line}">
        <animate attributeName="x" values="-560;1480" dur="11s" repeatCount="indefinite"/>
      </rect>
    </g>

    <circle cx="78" cy="78" r="25" fill="${colors.panel}" stroke="url(#${PREFIX}-avatar-ring)" stroke-opacity=".56"/>
    <clipPath id="${PREFIX}-avatar-small"><circle cx="78" cy="78" r="24"/></clipPath>
    ${avatarMarkup(model, colors, {
      x: 54,
      y: 54,
      width: 48,
      height: 48,
      clipId: `${PREFIX}-avatar-small`,
      fontSize: 16,
    })}
    <text x="118" y="70" fill="${colors.text}" class="sans" font-size="${mark.fontSize}" font-weight="700" letter-spacing="${(2.6 * (mark.fontSize / 13.5)).toFixed(2)}">${escapeXml(mark.text)}</text>
    <text x="118" y="88" fill="${colors.muted}" class="sans" font-size="${brandSubtitle.fontSize}" font-weight="500" letter-spacing="${(1.5 * (brandSubtitle.fontSize / 10.5)).toFixed(2)}">${escapeXml(brandSubtitle.text)}</text>
    <g>
      <circle class="live-dot" cx="780" cy="53" r="3.2" fill="${colors.accent}"/>
      <text x="792" y="57" fill="${colors.muted}" class="mono" font-size="9" letter-spacing="1.4">LIVE PROFILE</text>
    </g>
    <text x="868" y="86" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1.2" text-anchor="end">PUBLIC / LIVE</text>

    <g class="soft-rise" style="animation-delay:.05s">
      <text x="52" y="165" fill="${colors.text}" class="sans" font-size="${headlineOne.fontSize}" font-weight="600" letter-spacing="${(-1.8 * (headlineOne.fontSize / 56)).toFixed(2)}">${escapeXml(headlineOne.text)}</text>
    </g>
    <g class="soft-rise" style="animation-delay:.11s">
      <text x="52" y="229" fill="${colors.accent}" class="sans" font-size="${headlineTwo.fontSize}" font-weight="600" letter-spacing="${(-1.8 * (headlineTwo.fontSize / 56)).toFixed(2)}">${escapeXml(headlineTwo.text)}</text>
    </g>
    <g class="soft-rise" style="animation-delay:.17s">
      <text x="54" y="268" fill="${colors.muted}" class="sans" font-size="${intro.fontSize}">${escapeXml(intro.text)}</text>
    </g>
    <g class="rise" style="animation-delay:.1s">
      <rect x="52" y="292" width="${buildingWidth.toFixed(1)}" height="28" rx="14" fill="${colors.accent}" fill-opacity=".075" stroke="${colors.accent}" stroke-opacity=".2"/>
      <circle cx="68" cy="306" r="3" fill="${colors.accent}"/>
      <text x="78" y="310" fill="${colors.badgeText}" class="mono" font-size="${building.fontSize}" letter-spacing=".8">${escapeXml(building.text)}</text>
    </g>
    <text x="52" y="342" fill="${colors.dim}" class="mono" font-size="${context.fontSize}" letter-spacing="1.4">${escapeXml(context.text)}</text>
    ${orbitVisual(model, colors)}
    <path class="mo-rule" style="animation-delay:.24s" d="M52 362H868" stroke="${colors.line}" stroke-opacity=".1"/>
    <g opacity=".3">
      <rect x="-140" y="370" width="140" height="1" fill="url(#${PREFIX}-comet)">
        <animateTransform attributeName="transform" type="translate" values="0 0; 1100 0" dur="8.5s" repeatCount="indefinite"/>
      </rect>
    </g>

    <text x="52" y="386" fill="${colors.muted}" class="mono" font-size="9.5" letter-spacing="1.6">GITHUB / LIVE SNAPSHOT</text>
    <text x="868" y="386" fill="${colors.dim}" class="mono" font-size="8" letter-spacing=".9" text-anchor="end">SYNCED ${model.syncLabel} CST</text>
    <g class="rise" style="animation-delay:.08s">
      <path d="M59 405l4.2 8.7 9.6 1.4-6.9 6.7 1.6 9.5-8.5-4.5-8.5 4.5 1.6-9.5-6.9-6.7 9.6-1.4L59 405Z" fill="${colors.accent}"/>
      <text x="82" y="422" fill="${colors.muted}" class="sans" font-size="9.5" font-weight="600" letter-spacing="1.4">TOTAL STARS</text>
      <text x="52" y="526" fill="${colors.text}" class="sans tabular" font-size="${stars.fontSize}" font-weight="600" letter-spacing="${(-4.2 * (stars.fontSize / 94)).toFixed(2)}">${escapeXml(stars.text)}</text>
      <text x="54" y="560" fill="${colors.dim}" class="mono" font-size="${starCaption.fontSize}" letter-spacing="1">${escapeXml(starCaption.text)}</text>
    </g>
    ${rankGauge(model, colors)}
    ${metrics(model, colors)}
    <path class="mo-rule" style="animation-delay:.38s" d="M52 614H868" stroke="${colors.line}" stroke-opacity=".085"/>
    ${languageRows(model, colors)}
    ${repositoryRows(model, colors)}

    <text x="52" y="1170" fill="${colors.textSoft}" class="sans" font-size="${profileUrl.fontSize}" font-weight="500">${escapeXml(profileUrl.text)}</text>
    <text x="52" y="1196" fill="${colors.muted}" class="mono" font-size="${footerIdentity.fontSize}" letter-spacing=".4">${escapeXml(footerIdentity.text)}</text>
    <text x="868" y="1170" fill="${colors.muted}" class="mono" font-size="${footerNote.fontSize}" letter-spacing="1.3" text-anchor="end">${escapeXml(footerNote.text)}</text>
    <text x="868" y="1196" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">DYNAMIC SVG · 5 MIN CACHE</text>
    <text x="52" y="1234" fill="${colors.dim}" class="mono" font-size="${footerTech.fontSize}" letter-spacing="1.2">${escapeXml(footerTech.text)}</text>
    <g>
      <circle class="live-dot" cx="52" cy="1270" r="3" fill="${colors.accent}"/>
      <text x="64" y="1274" fill="${colors.muted}" class="mono" font-size="${dataLabel.fontSize}" letter-spacing="1.1">${escapeXml(dataLabel.text)}</text>
      <text x="868" y="1274" fill="${colors.dim}" class="mono" font-size="8" letter-spacing="1" text-anchor="end">UPDATED ${model.syncLabel} CST</text>
    </g>
  </g>
  <rect x=".75" y=".75" width="918.5" height="1358.5" rx="27.5" stroke="${colors.line}" stroke-opacity=".13"/>
</svg>`;
}
