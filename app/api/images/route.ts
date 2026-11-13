import {
  createImage,
  imageStats,
  listCategories,
  listImages,
} from "@/lib/images";
import { getSiteConfig } from "@/lib/site";
import { hitRateLimit } from "@/lib/rate-limit";
import { externalOrigin, isSameOrigin, jsonError } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function withUrl(image: ReturnType<typeof listImages>[number], origin: string) {
  return {
    ...image,
    url: `${origin}/images/${image.id}.webp`,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const site = getSiteConfig();
  const images = listImages(false, url.searchParams.get("category") || undefined);
  const origin = externalOrigin(request);
  return Response.json(
    {
      allowPublicUploads: site.allowPublicUploads,
      maxBytes: 1_000_000,
      capacity: 500,
      stats: imageStats(),
      categories: listCategories(true),
      images: images.map((image) => withUrl(image, origin)),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

export async function POST(request: Request) {
  if (!getSiteConfig().allowPublicUploads) {
    return jsonError("管理员暂未开放游客上传。", 403, "PUBLIC_UPLOADS_DISABLED");
  }
  if (!isSameOrigin(request)) {
    return jsonError("请求来源不受信任。", 403, "ORIGIN_REJECTED");
  }
  if (
    String(request.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase() !== "image/webp"
  ) {
    return jsonError("请先由浏览器压缩为 WebP 再上传。", 415, "UNSUPPORTED_IMAGE");
  }
  const limited = hitRateLimit(request, "guest-upload", 8, 60 * 60 * 1000);
  if (limited.limited) {
    return jsonError("上传太频繁，请一小时后再试。", 429, "TOO_MANY_UPLOADS");
  }
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > 1_000_000) {
    return jsonError("图片超过 1 MB 上限。", 413, "IMAGE_TOO_LARGE");
  }
  try {
    const buffer = Buffer.from(await request.arrayBuffer());
    const query = new URL(request.url).searchParams;
    const image = await createImage({
      buffer,
      label: query.get("label") || "",
      category: query.get("category") || "photo",
      source: "guest",
      published: false,
    });
    return Response.json(
      {
        ok: true,
        pending: true,
        image: withUrl(image, externalOrigin(request)),
        message: "已提交审核，管理员发布后其他访客即可使用。",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: any) {
    return jsonError(
      error?.message || "图片上传失败。",
      Number(error?.status) || 400,
      Number(error?.status) === 413 ? "IMAGE_TOO_LARGE" : "IMAGE_REJECTED",
    );
  }
}
