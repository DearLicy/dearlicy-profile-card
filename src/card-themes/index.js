import { renderEditorialTheme } from "./editorial.js";
import { renderOrbitTheme } from "./orbit.js";
import { renderPosterTheme } from "./poster.js";
import { renderSwissTheme } from "./swiss.js";
import { renderTerminalTheme } from "./terminal.js";

const RENDERERS = {
  orbit: renderOrbitTheme,
  editorial: renderEditorialTheme,
  terminal: renderTerminalTheme,
  poster: renderPosterTheme,
  swiss: renderSwissTheme,
};

export function renderCardTheme(layout, model, config, theme, options = {}) {
  const renderer = RENDERERS[layout] || renderOrbitTheme;
  return renderer(model, { ...config, colors: theme.colors }, options);
}
