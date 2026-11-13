import { assertAdmin, readJson } from "@/lib/admin-api";
import {
  getGitHubCredentialStatus,
  saveGitHubToken,
  testGitHubConnection,
} from "@/lib/github-service";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  try {
    const body = await readJson<{ token?: string }>(request);
    const github = saveGitHubToken(body.token || "");
    return Response.json({ ok: true, github });
  } catch (error: any) {
    return Response.json(
      { error: "GITHUB_TOKEN_SAVE_FAILED", message: error?.message || "保存失败。" },
      { status: error?.status || 400 },
    );
  }
}

export async function POST(request: Request) {
  const denied = await assertAdmin(request, true);
  if (denied) return denied;
  try {
    const result = await testGitHubConnection();
    return Response.json({
      ok: true,
      result,
      github: getGitHubCredentialStatus(),
    });
  } catch (error: any) {
    return Response.json(
      { error: "GITHUB_TEST_FAILED", message: error?.message || "连接失败。" },
      { status: error?.status || 502 },
    );
  }
}
