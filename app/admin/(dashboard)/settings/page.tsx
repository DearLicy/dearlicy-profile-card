import { headers } from "next/headers";

import { SettingsWorkspace } from "@/components/admin/settings-workspace";
import { getGitHubCredentialStatus } from "@/lib/github-service";
import { getDriveSettings } from "@/lib/google-drive";
import { listImages } from "@/lib/images";
import { getSiteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [site, params, headerList] = await Promise.all([
    Promise.resolve(getSiteConfig()),
    searchParams,
    headers(),
  ]);
  const drive = getDriveSettings();
  const localImages = listImages(true).filter(
    (image) => image.storageDriver === "local",
  );
  const host =
    headerList.get("x-forwarded-host") ||
    headerList.get("host") ||
    "profile.galgame.vip";
  const proto = headerList.get("x-forwarded-proto") || "http";
  const tab = typeof params.tab === "string" ? params.tab : "site";
  return (
    <SettingsWorkspace
      initialSite={{
        mode: site.mode,
        allowPublicUploads: site.allowPublicUploads,
        defaultUsername: site.defaultUsername,
        repoUrl: site.repoUrl,
        storageDriver: site.storageDriver,
      }}
      initialGithub={getGitHubCredentialStatus()}
      initialDrive={drive}
      initialStorageDriver={site.storageDriver}
      localImageIds={localImages.map((image) => image.id)}
      imageBytes={localImages.reduce((sum, image) => sum + image.bytes, 0)}
      callbackUrl={`${proto}://${host}/admin/oauth/google/callback`}
      origin={`${proto}://${host}`}
      initialTab={tab}
    />
  );
}
