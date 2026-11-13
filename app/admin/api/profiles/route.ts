import { assertAdmin, readJson } from "@/lib/admin-api";
import {
  addProfile,
  removeProfile,
  updateProfile,
} from "@/lib/profiles";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  try {
    const body = await readJson<{ username?: string }>(request);
    const profile = addProfile(body.username || "");
    return Response.json({ ok: true, profile }, { status: 201 });
  } catch (error: any) {
    return Response.json(
      { error: "PROFILE_ADD_FAILED", message: error?.message || "添加失败。" },
      { status: error?.status || 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  try {
    const body = await readJson<any>(request);
    const profile = updateProfile(String(body.id || ""), {
      isAllowed: body.isAllowed,
      isDefault: body.isDefault,
    });
    if (!profile) {
      return Response.json(
        { error: "PROFILE_NOT_FOUND", message: "主页不存在。" },
        { status: 404 },
      );
    }
    return Response.json({ ok: true, profile });
  } catch (error: any) {
    return Response.json(
      { error: "PROFILE_UPDATE_FAILED", message: error?.message || "更新失败。" },
      { status: error?.status || 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  try {
    const id = new URL(request.url).searchParams.get("id") || "";
    const removed = removeProfile(id);
    if (!removed) {
      return Response.json(
        { error: "PROFILE_NOT_FOUND", message: "主页不存在。" },
        { status: 404 },
      );
    }
    return Response.json({ ok: true });
  } catch (error: any) {
    return Response.json(
      { error: "PROFILE_DELETE_FAILED", message: error?.message || "删除失败。" },
      { status: error?.status || 400 },
    );
  }
}
