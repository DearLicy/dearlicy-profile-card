import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";

import {
  SESSION_COOKIE,
  SESSION_SECONDS,
} from "@/lib/constants";
import { isValidAdminPassword, safeEqual, signValue } from "@/lib/crypto";

function secureCookie(requestUrl: string, forwardedProto?: string | null) {
  const protocol = forwardedProto?.split(",")[0]?.trim();
  return protocol === "https" || new URL(requestUrl).protocol === "https:";
}

export function createSessionToken() {
  const expiresAt = Date.now() + SESSION_SECONDS * 1000;
  const nonce = randomBytes(12).toString("base64url");
  const payload = `${expiresAt}.${nonce}`;
  return `${payload}.${signValue(payload)}`;
}

export function verifySessionToken(value?: string | null) {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  if (!safeEqual(parts[2], signValue(payload))) return false;
  const expiresAt = Number(parts[0]);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function sessionCookieOptions(
  requestUrl: string,
  forwardedProto?: string | null,
  maxAge = SESSION_SECONDS,
) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: secureCookie(requestUrl, forwardedProto),
    path: "/",
    maxAge,
  };
}

export function authenticatePassword(password: string) {
  return isValidAdminPassword(password);
}

export async function isAdmin() {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export function setSessionCookie(response: NextResponse, request: Request) {
  response.cookies.set(
    SESSION_COOKIE,
    createSessionToken(),
    sessionCookieOptions(
      request.url,
      request.headers.get("x-forwarded-proto"),
    ),
  );
  return response;
}

export function clearSessionCookie(response: NextResponse, request: Request) {
  response.cookies.set(
    SESSION_COOKIE,
    "",
    sessionCookieOptions(
      request.url,
      request.headers.get("x-forwarded-proto"),
      0,
    ),
  );
  return response;
}
