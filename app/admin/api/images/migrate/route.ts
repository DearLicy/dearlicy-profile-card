import { assertAdmin, readJson } from "@/lib/admin-api";
import { migrateImageToDrive } from "@/lib/images";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  try {
    const body = await readJson<{ ids?: string[] }>(request);
    const ids = Array.isArray(body.ids) ? body.ids.slice(0, 100) : [];
    let migrated = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        const image = await migrateImageToDrive(String(id));
        if (image?.storageDriver === "google-drive") migrated += 1;
      } catch {
        failed += 1;
      }
    }
    return Response.json({ ok: true, migrated, failed });
  } catch (error: any) {
    return Response.json(
      {
        error: "IMAGE_MIGRATION_FAILED",
        message: error?.message || "批量迁移失败。",
      },
      { status: error?.status || 502 },
    );
  }
}
