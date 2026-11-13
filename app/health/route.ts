import { GET as healthGET } from "@/app/api/health/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return healthGET();
}
