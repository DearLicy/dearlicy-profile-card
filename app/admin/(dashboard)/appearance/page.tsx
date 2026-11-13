import { AppearanceManager } from "@/components/admin/appearance-manager";
import { getSiteConfig, themeCatalog } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function AdminAppearancePage() {
  const site = getSiteConfig();
  return (
    <AppearanceManager
      defaultUsername={site.defaultUsername}
      initialCard={site.card}
      themes={themeCatalog()}
    />
  );
}
