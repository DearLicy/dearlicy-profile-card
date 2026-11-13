import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    getDb().sqlite.prepare("SELECT 1").get();
    return Response.json({
      ok: true,
      service: "dearlicy-profile-card",
      version: "2.0.0",
      time: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { ok: false, service: "dearlicy-profile-card" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
