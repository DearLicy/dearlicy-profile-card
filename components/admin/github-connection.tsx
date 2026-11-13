"use client";

import * as React from "react";
import {
  CheckCircle2,
  DatabaseZap,
  LoaderCircle,
  RefreshCw,
  UserRoundCheck,
} from "lucide-react";
import { toast } from "sonner";

import { adminFetch, errorMessage } from "@/components/admin/admin-fetch";
import {
  SettingsSection,
  StatusBadge,
} from "@/components/admin/admin-ui";
import type { GitHubStatus } from "@/components/admin/github-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function relativeDate(value: string) {
  if (!value) return "尚未测试";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "尚未测试";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function GitHubConnection({
  initial,
  onPendingChange,
}: {
  initial: GitHubStatus;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [github, setGithub] = React.useState(initial);
  const [token, setToken] = React.useState("");
  const [pending, setPending] = React.useState("");

  React.useEffect(() => {
    onPendingChange?.(pending === "token");
  }, [onPendingChange, pending]);

  async function saveToken() {
    setPending("token");
    try {
      const result = await adminFetch<{ github: GitHubStatus }>(
        "/admin/api/github",
        {
          method: "PUT",
          body: JSON.stringify({ token }),
        },
      );
      setGithub(result.github);
      setToken("");
      toast.success(token ? "GitHub 连接已更新" : "已改用公开数据");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function testConnection() {
    setPending("test");
    try {
      const result = await adminFetch<{
        github: GitHubStatus;
        result: { remaining: number | null };
      }>("/admin/api/github", { method: "POST" });
      setGithub(result.github);
      toast.success(
        result.result.remaining === null
          ? "GitHub 连接正常"
          : `连接正常，本次还能读取 ${result.result.remaining} 次`,
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function clearCache() {
    setPending("cache");
    try {
      await adminFetch("/admin/api/cache", { method: "POST" });
      toast.success("下次生成会重新读取 GitHub");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
      <SettingsSection
        title="GitHub 连接"
        description="公开数据可以直接使用；只读 Token 会带来更完整的数据和更高读取额度。"
        action={
          <StatusBadge
            ok={github.mode === "token"}
            label={github.mode === "token" ? "已连接" : "公开数据"}
          />
        }
      >
        <div className="grid gap-4">
          <div className="rounded-xl border border-border p-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {github.message || "正在使用 GitHub 公开数据"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  上次检查：{relativeDate(github.lastTestedAt)}
                </p>
              </div>
            </div>
          </div>
          <form
            id="github-connection-form"
            onSubmit={(event) => {
              event.preventDefault();
              void saveToken();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="github-token">只读访问 Token（可选）</Label>
              <Input
                id="github-token"
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder={
                  github.hasToken
                    ? "已保存；留空保存会改回公开数据"
                    : "github_pat_…"
                }
                className="h-10 font-mono text-xs"
              />
              <p className="text-xs leading-5 text-muted-foreground">
                只授予读取公开主页和仓库的权限。保存新 Token 后，旧 Token
                会立即失效。
              </p>
            </div>
          </form>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void testConnection()}
              disabled={pending === "test"}
            >
              <RefreshCw className={pending === "test" ? "animate-spin" : ""} />
              检查连接
            </Button>
          </div>
        </div>
      </SettingsSection>

      <div className="grid content-start gap-6">
        <SettingsSection
          title="数据缓存"
          description="GitHub 数据会短暂缓存；读取失败时会继续展示最近一次成功内容。"
        >
          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="flex items-center gap-2 text-sm">
                <DatabaseZap className="size-4 text-muted-foreground" />
                自动缓存
              </span>
              <Badge variant="outline">已开启</Badge>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void clearCache()}
              disabled={pending === "cache"}
            >
              {pending === "cache" ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <DatabaseZap />
              )}
              立即重新读取
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection
          title="访客看到什么"
          description="访客只看到最终卡片，不需要登录，也不会接触连接凭据。"
        >
          <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
            <p className="flex gap-2">
              <UserRoundCheck className="mt-1 size-4 shrink-0 text-foreground" />
              Token 只用于读取公开主页和仓库数据。
            </p>
            <p className="flex gap-2">
              <CheckCircle2 className="mt-1 size-4 shrink-0 text-foreground" />
              访客永远无法读取 Token 或管理员设置。
            </p>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
