import { assertAdmin, readJson } from "@/lib/admin-api";
import {
  getDriveSettings,
  saveDriveClient,
} from "@/lib/google-drive";

export async function PUT(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  try {
    const body = await readJson<any>(request);
    const drive = saveDriveClient(body);
    return Response.json({ ok: true, drive });
  } catch (error: any) {
    return Response.json(
      { error: "GOOGLE_CONFIG_FAILED", message: error?.message || "保存失败。" },
      { status: error?.status || 400 },
    );
  }
}

export async function GET(request: Request) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  return Response.json({ drive: getDriveSettings() });
}
