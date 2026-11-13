import { NextResponse } from "next/server";

import {
  authenticatePassword,
  setSessionCookie,
} from "@/lib/auth";
import { clearRateLimit, hitRateLimit } from "@/lib/rate-limit";
import { isSameOrigin, jsonError } from "@/lib/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("请求来源不受信任。", 403, "ORIGIN_REJECTED");
  }
  const limited = hitRateLimit(request, "admin-login", 5, 15 * 60 * 1000);
  if (limited.limited) {
    return jsonError("尝试次数过多，请 15 分钟后再试。", 429, "TOO_MANY_ATTEMPTS");
  }
  try {
    const body = await request.json().catch(() => ({}));
    if (!authenticatePassword(String(body.password || ""))) {
      return jsonError("管理员密码不正确。", 401, "INVALID_PASSWORD");
    }
    clearRateLimit(request, "admin-login");
    return setSessionCookie(NextResponse.json({ ok: true }), request);
  } catch {
    return jsonError("登录失败。", 400);
  }
}
