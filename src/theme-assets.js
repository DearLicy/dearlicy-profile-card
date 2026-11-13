import { readFileSync } from "node:fs";
import { join } from "node:path";

const cache = new Map();

function loadThemeAsset(file) {
  if (cache.has(file)) return cache.get(file);
  const candidates = [
    join(process.cwd(), "public", "theme-assets", file),
    join(process.cwd(), "theme-assets", file),
  ];
  let dataUri = "";
  for (const candidate of candidates) {
    try {
      const bytes = readFileSync(/* turbopackIgnore: true */ candidate);
      if (bytes.byteLength) {
        dataUri = `data:image/webp;base64,${bytes.toString("base64")}`;
        break;
      }
    } catch {
      // The vector fallback keeps the card renderable in trimmed deployments.
    }
  }
  cache.set(file, dataUri);
  return dataUri;
}

export const WHALE_HERO_DATA_URI = loadThemeAsset("whale-hero.webp");
export const WHALE_BADGE_DATA_URI = loadThemeAsset("whale-badge.webp");
export const WHALE_COMPANION_DATA_URI = loadThemeAsset("whale-companion.webp");
