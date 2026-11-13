"use client";

import * as React from "react";
import {
  CheckCircle2,
  DatabaseZap,
  KeyRound,
  LoaderCircle,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  UserRoundCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { adminFetch, errorMessage } from "@/components/admin/admin-fetch";
import {
  AdminPageHeader,
  SettingsSection,
  StatusBadge,
} from "@/components/admin/admin-ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type AdminProfile = {
  id: string;
  login: string;
  profileUrl: string;
  isDefault: boolean;
  isAllowed: boolean;
  createdAt: string;
};

export type GitHubStatus = {
  hasToken: boolean;
  mode: "token" | "anonymous";
  status: string;
  message: string;
  lastTestedAt: string;
};

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

export function GitHubManager({
  initialProfiles,
  initialGitHub,
  siteMode,
  profilesOnly = false,
}: {
  initialProfiles: AdminProfile[];
  initialGitHub: GitHubStatus;
  siteMode: "public" | "private";
  profilesOnly?: boolean;
}) {
  const [profiles, setProfiles] = React.useState(initialProfiles);
  const [github, setGithub] = React.useState(initialGitHub);
  const [username, setUsername] = React.useState("");
  const [token, setToken] = React.useState("");
  const [pending, setPending] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<AdminProfile | null>(
    null,
  );

  async function addProfile() {
    if (!username.trim()) {
      toast.error("先输入 GitHub 用户名或主页链接。");
      return;
    }
    setPending("add");
    try {
      const result = await adminFetch<{ profile: AdminProfile }>(
        "/admin/api/profiles",
        {
          method: "POST",
          body: JSON.stringify({ username }),
        },
      );
      setProfiles((current) => {
        if (current.some((profile) => profile.id === result.profile.id)) {
          return current;
        }
        return [...current, result.profile];
      });
      setUsername("");
      toast.success(`已添加 @${result.profile.login}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function patchProfile(
    profile: AdminProfile,
    patch: { isAllowed?: boolean; isDefault?: boolean },
  ) {
    setPending(`profile:${profile.id}`);
    try {
      await adminFetch("/admin/api/profiles", {
        method: "PATCH",
        body: JSON.stringify({ id: profile.id, ...patch }),
      });
      setProfiles((current) =>
        current.map((entry) => {
          if (patch.isDefault && entry.id === profile.id) {
            return { ...entry, isDefault: true, isAllowed: true };
          }
          if (patch.isDefault) return { ...entry, isDefault: false };
          if (entry.id === profile.id) return { ...entry, ...patch };
          return entry;
        }),
      );
      toast.success(
        patch.isDefault
          ? `默认主页已切换为 @${profile.login}`
          : patch.isAllowed
            ? `@${profile.login} 现在可以访问`
            : `已暂停 @${profile.login} 的访问`,
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function removeProfile() {
    if (!deleteTarget) return;
    const profile = deleteTarget;
    setPending(`delete:${profile.id}`);
    try {
      await adminFetch(`/admin/api/profiles?id=${encodeURIComponent(profile.id)}`, {
        method: "DELETE",
      });
      setProfiles((current) => current.filter((entry) => entry.id !== profile.id));
      toast.success(`已删除 @${profile.login}`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

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
      toast.success(
        token ? "GitHub 连接已更新" : "已改用 GitHub 公开数据",
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function testToken() {
    setPending("test");
    try {
      const result = await adminFetch<{ github: GitHubStatus; result: { remaining: number | null } }>(
        "/admin/api/github",
        { method: "POST" },
      );
      setGithub(result.github);
      toast.success(
        result.result.remaining === null
          ? "GitHub 连接正常"
          : `GitHub 连接正常，本次还能读取 ${result.result.remaining} 次`,
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
    <>
      <AdminPageHeader
        eyebrow="主页数据"
        title="主页与数据"
        description="选择默认展示的主页，并决定是否连接 GitHub 以获得更完整、更稳定的数据。"
        badge={
          <Badge variant={siteMode === "private" ? "warning" : "success"}>
            {siteMode === "private" ? "仅限受邀" : "对外开放"}
          </Badge>
        }
      />

      <div
        className={
          profilesOnly
            ? "grid gap-6"
            : "grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]"
        }
      >
        <SettingsSection
          title="主页列表"
          description={
            siteMode === "private"
              ? "只有开启“可访问”的主页，访客才能生成卡片。"
              : "访客可以生成任意 GitHub 主页。这里添加的主页可设为默认展示。"
          }
          action={
            <Badge variant="outline">{profiles.length} 个主页</Badge>
          }
        >
          <div className="mb-5 flex flex-col gap-2 sm:flex-row">
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void addProfile();
              }}
              placeholder="GitHub 用户名或主页链接"
              className="h-10 flex-1"
            />
            <Button
              onClick={() => void addProfile()}
              disabled={pending === "add"}
              className="rounded-2xl"
            >
              {pending === "add" ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Plus />
              )}
              保存主页
            </Button>
          </div>
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {profiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.035 }}
                className="flex flex-col gap-3 bg-background/55 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold",
                      profile.isDefault
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {profile.login.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={profile.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm font-semibold hover:underline"
                      >
                        @{profile.login}
                      </a>
                      {profile.isDefault ? (
                        <Badge variant="success">默认主页</Badge>
                      ) : null}
                      {!profile.isAllowed ? (
                        <Badge variant="warning">未开放</Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {profile.profileUrl}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={profile.isDefault ? "secondary" : "outline"}
                        size="sm"
                        disabled={
                          profile.isDefault ||
                          pending === `profile:${profile.id}`
                        }
                        onClick={() =>
                          void patchProfile(profile, { isDefault: true })
                        }
                      >
                        <Star className={profile.isDefault ? "fill-current" : ""} />
                        {profile.isDefault ? "默认" : "设为默认"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      访客没有指定用户名时，会展示这个主页
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex h-8 items-center gap-2 rounded-lg border border-border px-2.5">
                    <span className="text-xs text-muted-foreground">可访问</span>
                    <Switch
                      checked={profile.isAllowed}
                      disabled={profile.isDefault}
                      onCheckedChange={(checked) =>
                        void patchProfile(profile, { isAllowed: checked })
                      }
                      aria-label={`允许 ${profile.login}`}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                    disabled={profile.isDefault}
                    onClick={() => setDeleteTarget(profile)}
                    aria-label={`删除 ${profile.login}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </SettingsSection>

        {!profilesOnly ? (
          <div className="grid content-start gap-6">
          <SettingsSection
            title="GitHub 连接"
            description="可选。连接后会读取更完整的数据，也更少遇到 GitHub 的读取限制。"
            action={
              <StatusBadge
                ok={github.mode === "token"}
                label={github.mode === "token" ? "连接增强" : "公开数据"}
              />
            }
          >
            <div className="grid gap-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
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
              <div className="grid gap-2">
                <Label htmlFor="github-token">只读访问 Token（可选）</Label>
                <Input
                  id="github-token"
                  type="password"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder={
                    github.hasToken
                      ? "留空并保存会改回公开数据"
                      : "github_pat_…"
                  }
                  className="h-10 font-mono text-xs"
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  只授予读取公开主页和仓库的权限。保存后，旧 Token 会立即失效。
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => void saveToken()}
                  disabled={pending === "token"}
                  className="rounded-xl"
                >
                  {pending === "token" ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <KeyRound />
                  )}
                  保存更改
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void testToken()}
                  disabled={pending === "test"}
                  className="rounded-xl"
                >
                  <RefreshCw
                    className={pending === "test" ? "animate-spin" : ""}
                  />
                  检查连接
                </Button>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title="数据更新"
            description="GitHub 数据会保留 5 分钟；读取失败时，会继续展示最近一次成功获取的内容。"
          >
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/25 p-3">
                <span className="flex items-center gap-2 text-sm">
                  <DatabaseZap className="size-4 text-muted-foreground" />
                  最近一次成功数据
                </span>
                <Badge variant="outline">自动更新</Badge>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl"
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
            description="访客只看到最终卡片，不需要登录 GitHub，也不会接触你的连接凭据。"
          >
            <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
              <p className="flex gap-2">
                <UserRoundCheck className="mt-1 size-4 shrink-0 text-foreground" />
                GitHub Token 只用于读取公开主页和仓库数据。
              </p>
              <p className="flex gap-2">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-foreground" />
                修改管理员密码后，已保存的 GitHub 和 Google Drive 授权需要重新配置。
              </p>
            </div>
          </SettingsSection>
          </div>
        ) : null}
      </div>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除 @{deleteTarget?.login}</AlertDialogTitle>
            <AlertDialogDescription>
              这个主页会从列表中移除，已生成的卡片不会消失。默认主页需要先切换。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void removeProfile()}
            >
              移除主页
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
