import { GitHubManager } from "@/components/admin/github-manager";
import { getGitHubCredentialStatus } from "@/lib/github-service";
import { listProfiles } from "@/lib/profiles";
import { getSiteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function AdminGitHubPage() {
  const site = getSiteConfig();
  return (
    <GitHubManager
      initialProfiles={listProfiles()}
      initialGitHub={getGitHubCredentialStatus()}
      siteMode={site.mode}
      profilesOnly
    />
  );
}
