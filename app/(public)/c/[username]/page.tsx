import { StudioApp } from "@/components/studio/studio-app";
import type { CardConfig, SitePayload } from "@/components/studio/types";
import { publicSiteConfig } from "@/lib/site";
import { configFromSearchParams } from "@/src/config.js";
import { normalizeGitHubLogin } from "@/src/github.js";

export const dynamic = "force-dynamic";

export default async function CardStudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ username }, search] = await Promise.all([params, searchParams]);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (typeof value === "string") query.set(key, value);
  }
  const site = publicSiteConfig() as SitePayload;
  let login = username;
  try {
    login = normalizeGitHubLogin(username);
  } catch {}
  const config = configFromSearchParams(query, site.card) as CardConfig;
  return (
    <StudioApp
      site={site}
      mode="result"
      initialUsername={login}
      initialConfig={config}
    />
  );
}
