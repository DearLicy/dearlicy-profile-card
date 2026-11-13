import { assertAdmin, readJson } from "@/lib/admin-api";
import {
  addCategory,
  listCategories,
  removeCategory,
  updateCategory,
} from "@/lib/images";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  return Response.json({ categories: listCategories(true) });
}

export async function POST(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  try {
    const body = await readJson<{ label?: string }>(request);
    const category = addCategory(body.label || "");
    return Response.json({ ok: true, category }, { status: 201 });
  } catch (error: any) {
    return Response.json(
      { error: "CATEGORY_ADD_FAILED", message: error?.message || "添加失败。" },
      { status: error?.status || 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  try {
    const body = await readJson<{ slug?: string; label?: string }>(request);
    const category = updateCategory(body.slug || "", body.label || "");
    if (!category) {
      return Response.json(
        { error: "CATEGORY_NOT_FOUND", message: "分类不存在。" },
        { status: 404 },
      );
    }
    return Response.json({ ok: true, category });
  } catch (error: any) {
    return Response.json(
      { error: "CATEGORY_UPDATE_FAILED", message: error?.message || "更新失败。" },
      { status: error?.status || 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  try {
    const slug = new URL(request.url).searchParams.get("slug") || "";
    if (!removeCategory(slug)) {
      return Response.json(
        { error: "CATEGORY_NOT_FOUND", message: "分类不存在。" },
        { status: 404 },
      );
    }
    return Response.json({ ok: true });
  } catch (error: any) {
    return Response.json(
      { error: "CATEGORY_DELETE_FAILED", message: error?.message || "删除失败。" },
      { status: error?.status || 409 },
    );
  }
}
