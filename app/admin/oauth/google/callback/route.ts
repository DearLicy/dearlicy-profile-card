import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/auth";
import { GOOGLE_STATE_COOKIE } from "@/lib/constants";
import {
  ensureDriveFolder,
  exchangeDriveCode,
  getDriveAccount,
  getDriveSettings,
  setDriveConnection,
} from "@/lib/google-drive";
import {
  decodeOAuthState,
  readCookie,
} from "@/lib/oauth-state";
import { externalOrigin } from "@/lib/request";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fail = () => {
    const response = NextResponse.redirect(
      new URL("/admin/settings?tab=google&google=failed", request.url),
    );
    response.cookies.set(GOOGLE_STATE_COOKIE, "", {
      path: "/admin/oauth/google",
      maxAge: 0,
    });
    return response;
  };
  if (!(await isAdmin())) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  const state = url.searchParams.get("state") || "";
  const cookieState = decodeOAuthState(
    readCookie(request, GOOGLE_STATE_COOKIE),
  );
  if (!cookieState || state !== cookieState.state || url.searchParams.get("error")) {
    return fail();
  }
  const code = url.searchParams.get("code");
  if (!code) return fail();
  try {
    const settings = getDriveSettings(true);
    const redirectUri = `${externalOrigin(request)}/admin/oauth/google/callback`;
    const token = await exchangeDriveCode({
      code,
      clientId: settings.clientId,
      clientSecret: settings.clientSecret,
      redirectUri,
      codeVerifier: cookieState.verifier,
    });
    const account = await getDriveAccount(token.accessToken);
    const folderId = await ensureDriveFolder(
      token.accessToken,
      settings.folderId,
    );
    setDriveConnection({
      refreshToken: token.refreshToken,
      folderId,
      accountEmail: account.emailAddress || account.displayName || "",
    });
    const response = NextResponse.redirect(
      new URL("/admin/settings?tab=google&google=connected", request.url),
    );
    response.cookies.set(GOOGLE_STATE_COOKIE, "", {
      path: "/admin/oauth/google",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("Google Drive OAuth failed", error);
    return fail();
  }
}
