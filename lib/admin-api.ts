import "server-only";

import { isAdmin } from "@/lib/auth";
import { jsonError, isSameOrigin } from "@/lib/request";

export async function assertAdmin(request: Request, mutate = false) {
  if (!(await isAdmin())) {
    return jsonError("管理员会话已失效，请重新登录。", 401, "UNAUTHORIZED");
  }
  if (mutate && !isSameOrigin(request)) {
    return jsonError("请求来源不受信任。", 403, "ORIGIN_REJECTED");
  }
  return null;
}

export async function readJson<T>(request: Request): Promise<T> {
  const text = await request.text();
  if (text.length > 64 * 1024) {
    throw Object.assign(new Error("请求体过大。"), { status: 413 });
  }
  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    throw Object.assign(new Error("请求格式不是有效 JSON。"), { status: 400 });
  }
}
