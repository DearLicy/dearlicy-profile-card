import { assertAdmin } from "@/lib/admin-api";
import { clearProfileCache } from "@/lib/github-service";

export async function POST(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  clearProfileCache();
  return Response.json({ ok: true });
}
