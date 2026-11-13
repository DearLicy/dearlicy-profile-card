import { renderOrbitTheme } from "./orbit.js";
import { renderSwissTheme } from "./swiss.js";
import { renderWhaleTheme } from "./whale.js";

const RENDERERS = {
  orbit: renderOrbitTheme,
  swiss: renderSwissTheme,
  tidal: renderWhaleTheme,
};

export function renderCardTheme(layout, model, config, theme, options = {}) {
  const renderer = RENDERERS[layout] || renderOrbitTheme;
  return renderer(model, { ...config, colors: theme.colors }, options);
}
