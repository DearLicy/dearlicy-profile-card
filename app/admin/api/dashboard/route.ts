import { assertAdmin } from "@/lib/admin-api";
import { getGitHubCredentialStatus, getGitHubToken } from "@/lib/github-service";
import {
  getDriveSettings,
} from "@/lib/google-drive";
import {
  imageStats,
  listCategories,
  listImages,
} from "@/lib/images";
import { listProfiles } from "@/lib/profiles";
import { getSiteConfig } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  return Response.json({
    site: getSiteConfig(),
    profiles: listProfiles(),
    github: getGitHubCredentialStatus(),
    drive: getDriveSettings(),
    images: listImages(true),
    categories: listCategories(true),
    stats: imageStats(),
    hasGitHubToken: Boolean(getGitHubToken()),
  });
}
