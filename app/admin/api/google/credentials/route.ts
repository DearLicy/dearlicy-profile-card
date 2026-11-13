import { assertAdmin } from "@/lib/admin-api";
import { clearDriveCredentials, getDriveSettings } from "@/lib/google-drive";

export async function DELETE(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  clearDriveCredentials();
  return Response.json({ ok: true, drive: getDriveSettings() });
}
