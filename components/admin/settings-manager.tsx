"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  Cloud,
  Database,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Server,
} from "lucide-react";
import { toast } from "sonner";

import { adminFetch, errorMessage } from "@/components/admin/admin-fetch";
import {
  AdminPageHeader,
  SettingsSection,
} from "@/components/admin/admin-ui";
import { CopyButton } from "@/components/shared/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type SiteForm = {
  mode: "public" | "private";
  allowPublicUploads: boolean;
  defaultUsername: string;
  repoUrl: string;
  storageDriver: "local" | "google-drive";
};

export function SettingsManager({
  initial,
  driveConnected,
  origin,
  embedded = false,
  onPendingChange,
}: {
  initial: SiteForm;
  driveConnected: boolean;
  origin: string;
  embedded?: boolean;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [form, setForm] = React.useState(initial);
  const [pending, setPending] = React.useState(false);
  const publicExample = `${origin}/${form.defaultUsername || "DearLicy"}`;

  React.useEffect(() => {
    onPendingChange?.(pending);
  }, [onPendingChange, pending]);

  async function save() {
    setPending(true);
    try {
      const result = await adminFetch<{ site: SiteForm }>("/admin/api/settings", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setForm({
        mode: result.site.mode,
        allowPublicUploads: result.site.allowPublicUploads,
        defaultUsername: result.site.defaultUsername,
        repoUrl: result.site.repoUrl,
        storageDriver: result.site.storageDriver,
      });
      toast.success("设置已保存");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  const fields = (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <div className="grid content-start gap-6">
          <SettingsSection
            title="访问范围"
            description="开放给所有人，或者只允许你列出的主页。"
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>谁能生成卡片</Label>
                <Select
                  value={form.mode}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      mode: value as "public" | "private",
                    }))
                  }
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      所有人 · 任意 GitHub 主页
                    </SelectItem>
                    <SelectItem value="private">
                      仅限受邀 · 只允许我添加的主页
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs leading-5 text-muted-foreground">
                  选择“仅限受邀”后，请在“主页与数据”里打开对应主页的可访问开关。
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Globe2 className="size-4" />
                    允许访客投稿图片
                  </div>
                  <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                    访客上传后会先等待审核；你自己上传的图片会直接公开。
                  </p>
                </div>
                <Switch
                  checked={form.allowPublicUploads}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      allowPublicUploads: checked,
                    }))
                  }
                  aria-label="允许访客投稿图片"
                />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title="默认主页与入口"
            description="访客没有指定主页时展示的内容，以及右上角仓库入口。"
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="default-username">默认展示的主页</Label>
                <Input
                  id="default-username"
                  value={form.defaultUsername}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      defaultUsername: event.target.value,
                    }))
                  }
                  placeholder="DearLicy"
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repo-url">开源仓库链接</Label>
                <Input
                  id="repo-url"
                  value={form.repoUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      repoUrl: event.target.value,
                    }))
                  }
                  placeholder="https://github.com/DearLicy/dearlicy-profile-card"
                  className="h-10"
                />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title="图片默认保存位置"
            description="只影响以后上传的图片，已有图片仍会留在原位置。"
          >
            <div className="grid gap-3">
              <Select
                value={form.storageDriver}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    storageDriver: value as "local" | "google-drive",
                  }))
                }
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">本站存储</SelectItem>
                  <SelectItem value="google-drive">Google Drive</SelectItem>
                </SelectContent>
              </Select>
              {form.storageDriver === "google-drive" && !driveConnected ? (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p className="text-xs leading-5">
                    Google Drive 还没有连接。先完成连接，再切换新的保存位置。
                  </p>
                </div>
              ) : null}
              <Button variant="outline" asChild className="w-fit">
                <Link href="/admin/settings?tab=google">
                  <Cloud />
                  管理 Google Drive
                </Link>
              </Button>
            </div>
          </SettingsSection>

        </div>

        <div className="grid content-start gap-6">
          <SettingsSection
            title="站点信息"
            description="公开地址和运行位置。"
          >
            <div className="grid gap-0 overflow-hidden rounded-xl border border-border text-sm">
              {[
                { icon: Server, label: "运行方式", value: "Docker" },
                {
                  icon: Database,
                  label: "数据库",
                  value: "/data/profile-card.sqlite",
                },
                { icon: Cloud, label: "图片目录", value: "/data/images" },
                {
                  icon: LockKeyhole,
                  label: "凭据保护",
                  value: "加密保存",
                },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{label}</span>
                  <span className="ml-auto max-w-[55%] truncate text-right font-medium">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection
            title="公开地址"
            description="访客打开的页面地址。反向代理与 HTTPS 由你在服务器上配置。"
          >
            <div className="flex items-center gap-2 rounded-xl border border-border p-3">
              <code className="min-w-0 flex-1 truncate font-mono text-xs">
                {publicExample}
              </code>
              <CopyButton value={publicExample} className="shrink-0" />
            </div>
          </SettingsSection>

          <SettingsSection
            title="安全说明"
            description="凭据只对管理员可见。"
          >
            <div className="flex items-start gap-2 rounded-xl border border-border p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-5 text-muted-foreground">
                修改管理员密码后，GitHub Token 与 Google Drive 授权需要重新配置；
                已经公开的卡片不会受影响。
              </p>
            </div>
          </SettingsSection>
        </div>
      </div>
  );

  return (
    <>
      {!embedded ? (
        <AdminPageHeader
          title="站点设置"
          description="决定访问范围、默认内容和图片的保存方式。"
          action={
            <Button type="submit" form="site-settings-form" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : <Check />}
              保存设置
            </Button>
          }
          badge={
            <Badge variant="outline">
              {form.mode === "public" ? "对外开放" : "仅限受邀"}
            </Badge>
          }
        />
      ) : null}
      <form
        id="site-settings-form"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        {fields}
      </form>
    </>
  );
}
