import { cardResponse } from "@/lib/card-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return cardResponse(request);
}

export async function HEAD(request: Request) {
  return cardResponse(request);
}
