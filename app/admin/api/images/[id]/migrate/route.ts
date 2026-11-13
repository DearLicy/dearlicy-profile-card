import { assertAdmin } from "@/lib/admin-api";
import { migrateImageToDrive } from "@/lib/images";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  const { id } = await params;
  try {
    const image = await migrateImageToDrive(id);
    if (!image) {
      return Response.json(
        { error: "IMAGE_NOT_FOUND", message: "图片不存在。" },
        { status: 404 },
      );
    }
    return Response.json({ ok: true, image });
  } catch (error: any) {
    return Response.json(
      { error: "IMAGE_MIGRATION_FAILED", message: error?.message || "迁移失败。" },
      { status: error?.status || 502 },
    );
  }
}
