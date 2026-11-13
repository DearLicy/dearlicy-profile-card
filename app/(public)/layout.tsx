import { PublicShell } from "@/components/shared/public-shell";
import { publicSiteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = publicSiteConfig();
  return <PublicShell repoUrl={site.repoUrl}>{children}</PublicShell>;
}
