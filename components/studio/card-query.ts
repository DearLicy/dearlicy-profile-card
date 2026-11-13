import type { CardConfig } from "@/components/studio/types";

export function cardParams(config: CardConfig, refresh = 0) {
  const params = new URLSearchParams();
  params.set("theme", config.theme);
  if (config.accent) params.set("accent", config.accent);
  if (config.backgroundImage) params.set("bgImage", config.backgroundImage);
  params.set("bgTL", config.backgroundCorners.tl.toFixed(2));
  params.set("bgTR", config.backgroundCorners.tr.toFixed(2));
  params.set("bgBL", config.backgroundCorners.bl.toFixed(2));
  params.set("bgBR", config.backgroundCorners.br.toFixed(2));
  if (config.mark) params.set("mark", config.mark);
  if (config.headlineOne) params.set("h1", config.headlineOne);
  if (config.headlineTwo) params.set("h2", config.headlineTwo);
  if (config.intro) params.set("intro", config.intro);
  if (config.badge) params.set("badge", config.badge);
  if (config.footerNote) params.set("note", config.footerNote);
  if (refresh) params.set("v", String(refresh));
  return params;
}

export function cardQuery(config: CardConfig, username: string, refresh = 0) {
  const params = cardParams(config, refresh);
  params.set("username", username);
  return params;
}

export function cardUrl(config: CardConfig, username: string, refresh = 0) {
  return `/api?${cardQuery(config, username, refresh).toString()}`;
}

export function studioPath(config: CardConfig, username: string) {
  return `/c/${encodeURIComponent(username)}?${cardParams(config).toString()}`;
}

export function shareUrl(config: CardConfig, username: string) {
  return `${window.location.origin}${studioPath(config, username)}`;
}

export function embedSnippet(config: CardConfig, username: string) {
  const src = `${window.location.origin}/api?${cardQuery(
    config,
    username,
    0,
  ).toString()}`;
  return `<p align="center">
  <a href="${window.location.origin}${studioPath(config, username)}">
    <img width="100%" src="${src}" alt="${username} 的 GitHub 主页卡片">
  </a>
</p>`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", { notation: "compact" }).format(value);
}
