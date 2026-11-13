import "server-only";

import { safeEqual, signValue } from "@/lib/crypto";
import { GOOGLE_STATE_COOKIE } from "@/lib/constants";

export type OAuthCookieState = {
  state: string;
  verifier: string;
  createdAt: number;
};

export function encodeOAuthState(value: OAuthCookieState) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${signValue(payload)}`;
}

export function decodeOAuthState(value?: string | null) {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, signValue(payload))) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as OAuthCookieState;
    if (Date.now() - parsed.createdAt > 10 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string) {
  for (const item of String(request.headers.get("cookie") || "").split(";")) {
    const [key, ...rest] = item.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export { GOOGLE_STATE_COOKIE };
