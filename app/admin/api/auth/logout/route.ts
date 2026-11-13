import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  return clearSessionCookie(NextResponse.json({ ok: true }), request);
}
