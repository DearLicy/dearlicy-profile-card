import { assertAdmin, readJson } from "@/lib/admin-api";
import { updateSiteSettings, getSiteConfig } from "@/lib/site";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  try {
    const body = await readJson<any>(request);
    updateSiteSettings(body);
    return Response.json({ ok: true, site: getSiteConfig() });
  } catch (error: any) {
    return Response.json(
      { error: "SAVE_FAILED", message: error?.message || "保存失败。" },
      { status: error?.status || 500 },
    );
  }
}
