import { redirect } from "next/navigation";

import { StudioApp } from "@/components/studio/studio-app";
import type { CardConfig, SitePayload } from "@/components/studio/types";
import { publicSiteConfig } from "@/lib/site";
import { configFromSearchParams } from "@/src/config.js";
import { normalizeGitHubLogin } from "@/src/github.js";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }
  const site = publicSiteConfig() as SitePayload;
  const rawUsername =
    (typeof params.username === "string" && params.username) ||
    (typeof params.user === "string" && params.user) ||
    (typeof params.url === "string" && params.url) ||
    "";
  if (rawUsername || params.studio === "1") {
    let login = site.defaultUsername;
    try {
      login = normalizeGitHubLogin(rawUsername || site.defaultUsername);
    } catch {}
    for (const key of ["username", "user", "url", "studio"]) query.delete(key);
    redirect(`/c/${encodeURIComponent(login)}?${query.toString()}`);
  }
  const config = configFromSearchParams(query, site.card) as CardConfig;
  return (
    <StudioApp
      site={site}
      mode="landing"
      initialUsername=""
      initialConfig={config}
    />
  );
}
