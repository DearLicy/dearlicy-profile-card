import { assertAdmin } from "@/lib/admin-api";
import { getDriveSettings, testDriveConnection } from "@/lib/google-drive";

export async function POST(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  const started = Date.now();
  try {
    const result = await testDriveConnection();
    return Response.json({
      ok: true,
      latencyMs: Date.now() - started,
      drive: getDriveSettings(),
      ...result,
    });
  } catch (error: any) {
    return Response.json(
      { error: "GOOGLE_TEST_FAILED", message: error?.message || "连接失败。" },
      { status: error?.status || 502 },
    );
  }
}
