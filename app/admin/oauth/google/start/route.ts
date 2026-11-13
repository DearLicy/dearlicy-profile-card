import { createHash, randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/auth";
import { GOOGLE_STATE_COOKIE } from "@/lib/constants";
import {
  driveOAuthUrl,
  getDriveSettings,
} from "@/lib/google-drive";
import { encodeOAuthState, type OAuthCookieState } from "@/lib/oauth-state";
import { externalOrigin } from "@/lib/request";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  const settings = getDriveSettings(true);
  if (!settings.clientId || !settings.clientSecret) {
    return NextResponse.redirect(
      new URL("/admin/settings?tab=google&google=config-required", request.url),
    );
  }
  const state = randomBytes(24).toString("hex");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256")
    .update(verifier)
    .digest("base64url");
  const redirectUri = `${externalOrigin(request)}/admin/oauth/google/callback`;
  const cookieState: OAuthCookieState = {
    state,
    verifier,
    createdAt: Date.now(),
  };
  const response = NextResponse.redirect(
    driveOAuthUrl({
      clientId: settings.clientId,
      redirectUri,
      state,
      codeChallenge: challenge,
    }),
  );
  response.cookies.set(GOOGLE_STATE_COOKIE, encodeOAuthState(cookieState), {
    httpOnly: true,
    sameSite: "lax",
    secure:
      request.headers.get("x-forwarded-proto") === "https" ||
      new URL(request.url).protocol === "https:",
    path: "/admin/oauth/google",
    maxAge: 10 * 60,
  });
  return response;
}
