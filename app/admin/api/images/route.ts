import { assertAdmin } from "@/lib/admin-api";
import {
  createImage,
  imageStats,
  listCategories,
  listImages,
} from "@/lib/images";
import { getSiteConfig } from "@/lib/site";
import { externalOrigin, isSameOrigin, jsonError } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const url = new URL(request.url);
  const origin = externalOrigin(request);
  const images = listImages(true, url.searchParams.get("category") || undefined);
  return Response.json({
    allowPublicUploads: getSiteConfig().allowPublicUploads,
    storageDriver: getSiteConfig().storageDriver,
    categories: listCategories(true),
    stats: imageStats(),
    images: images.map((image) => ({
      ...image,
      url: `${origin}/images/${image.id}.webp`,
    })),
  });
}

export async function POST(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  if (!isSameOrigin(request)) return jsonError("请求来源不受信任。", 403);
  if (
    String(request.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase() !== "image/webp"
  ) {
    return jsonError("请先由浏览器压缩为 WebP 再上传。", 415, "UNSUPPORTED_IMAGE");
  }
  try {
    const buffer = Buffer.from(await request.arrayBuffer());
    const url = new URL(request.url);
    const origin = externalOrigin(request);
    const image = await createImage({
      buffer,
      label: url.searchParams.get("label") || "",
      category: url.searchParams.get("category") || "photo",
      source: "admin",
      published: true,
    });
    return Response.json(
      {
        ok: true,
        image: { ...image, url: `${origin}/images/${image.id}.webp` },
      },
      { status: 201 },
    );
  } catch (error: any) {
    return jsonError(
      error?.message || "图片上传失败。",
      Number(error?.status) || 400,
      "IMAGE_REJECTED",
    );
  }
}
