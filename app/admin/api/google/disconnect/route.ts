import { assertAdmin } from "@/lib/admin-api";
import { disconnectDrive, getDriveSettings } from "@/lib/google-drive";

export async function POST(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  disconnectDrive();
  return Response.json({ ok: true, drive: getDriveSettings() });
}
