import { ImageManager } from "@/components/admin/image-manager";
import { getDriveSettings } from "@/lib/google-drive";
import {
  imageStats,
  listCategories,
  listImages,
} from "@/lib/images";
import { getSiteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function AdminImagesPage() {
  const site = getSiteConfig();
  const drive = getDriveSettings();
  const images = listImages(true).map((image) => ({
    ...image,
    url: `/images/${image.id}.webp`,
  }));
  return (
    <ImageManager
      initialImages={images}
      initialCategories={listCategories(true)}
      initialStats={imageStats()}
      initialStorageDriver={site.storageDriver}
      initialAllowPublicUploads={site.allowPublicUploads}
      driveConnected={drive.status === "connected" && drive.hasRefreshToken}
    />
  );
}
