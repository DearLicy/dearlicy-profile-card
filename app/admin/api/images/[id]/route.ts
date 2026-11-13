import { assertAdmin, readJson } from "@/lib/admin-api";
import { deleteImage, updateImage } from "@/lib/images";
import { externalOrigin } from "@/lib/request";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = await readJson<any>(request);
    const image = updateImage(id, {
      label: body.label,
      category: body.category,
      published: body.published,
    });
    if (!image) {
      return Response.json(
        { error: "IMAGE_NOT_FOUND", message: "图片不存在。" },
        { status: 404 },
      );
    }
    return Response.json({
      ok: true,
      image: {
        ...image,
        url: `${externalOrigin(request)}/images/${image.id}.webp`,
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: "IMAGE_UPDATE_FAILED", message: error?.message || "更新失败。" },
      { status: error?.status || 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  const { id } = await params;
  try {
    const removed = await deleteImage(id);
    if (!removed) {
      return Response.json(
        { error: "IMAGE_NOT_FOUND", message: "图片不存在。" },
        { status: 404 },
      );
    }
    return Response.json({ ok: true });
  } catch (error: any) {
    return Response.json(
      { error: "IMAGE_DELETE_FAILED", message: error?.message || "删除失败。" },
      { status: error?.status || 502 },
    );
  }
}
