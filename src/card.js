import {
  createCardModel,
  escapeXml,
  fitText,
} from "./card-kit.js";
import { renderCardTheme } from "./card-themes/index.js";
import {
  DEFAULT_CARD_CONFIG,
  normalizeCardConfig,
  themePalette,
} from "./config.js";

function cleanSvg(svg) {
  return svg.replace(/[ \t]+$/gm, "");
}

export function renderProfileCard(
  data,
  configInput = DEFAULT_CARD_CONFIG,
  { backgroundDataUri = "" } = {},
) {
  const config = normalizeCardConfig(configInput);
  const theme = themePalette(config);
  const model = createCardModel(data, config);
  return cleanSvg(
    renderCardTheme(theme.layout, model, config, theme, {
      backgroundDataUri,
    }),
  );
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
  const errorTitle = fitText(title, {
    fontSize: 42,
    minFontSize: 22,
    maxWidth: 800,
    weight: 600,
  });
  const errorMessage = fitText(message, {
    fontSize: 15,
    minFontSize: 10,
    maxWidth: 800,
  });
  const errorDetail = fitText(detail, {
    fontSize: 9,
    minFontSize: 7,
    maxWidth: 800,
    mono: true,
    letterSpacing: 0.2,
  });
  return cleanSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="920" height="300" viewBox="0 0 920 300" fill="none" role="img" aria-labelledby="error-title">
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
  <text x="52" y="156" fill="${colors.text}" font-family="Inter, sans-serif" font-size="${errorTitle.fontSize}" font-weight="600">${escapeXml(errorTitle.text)}</text>
  <text x="52" y="194" fill="${colors.muted}" font-family="Inter, sans-serif" font-size="${errorMessage.fontSize}">${escapeXml(errorMessage.text)}</text>
  <text x="52" y="232" fill="${colors.dim}" font-family="Menlo, monospace" font-size="${errorDetail.fontSize}">${escapeXml(errorDetail.text)}</text>
  <rect x=".75" y=".75" width="918.5" height="298.5" rx="27.5" stroke="${colors.line}" stroke-opacity=".13"/>
</svg>`);
}
