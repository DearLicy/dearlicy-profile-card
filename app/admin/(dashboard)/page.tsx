import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Cloud,
  FolderGit2,
  Github,
  Image as ImageIcon,
  Palette,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { SettingsSection } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getGitHubCredentialStatus } from "@/lib/github-service";
import { getDriveSettings } from "@/lib/google-drive";
import { imageStats, listCategories } from "@/lib/images";
import { listProfiles } from "@/lib/profiles";
import { getSiteConfig } from "@/lib/site";
import { formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function AdminOverviewPage() {
  const site = getSiteConfig();
  const profiles = listProfiles();
  const github = getGitHubCredentialStatus();
  const drive = getDriveSettings();
  const stats = imageStats();
  const categories = listCategories(true);
  const driveConnected = drive.status === "connected" && drive.hasRefreshToken;
  const setup = [
    {
      title: "GitHub 数据",
      detail: github.hasToken
        ? "已连接只读 Token，数据读取更完整"
        : "正在使用公开数据，也可以正常生成",
      done: github.hasToken,
      href: "/admin/settings?tab=github",
    },
    {
      title: "默认主页",
      detail: `@${site.defaultUsername}`,
      done: Boolean(site.defaultUsername),
      href: "/admin/github",
    },
    {
      title: "媒体库",
      detail: stats.published
        ? `${stats.published} 张图片可供访客选择`
        : "还没有公开图片，访客会看到主题背景",
      done: stats.published > 0,
      href: "/admin/images",
    },
    {
      title: "Google Drive",
      detail: driveConnected
        ? drive.accountEmail || "图片会保存到你的云盘"
        : "可选，启用后减少服务器空间占用",
      done: driveConnected,
      href: "/admin/settings?tab=google",
    },
  ];
  const summary = [
    {
      label: "主页数量",
      value: String(profiles.length),
      icon: FolderGit2,
      tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      label: "媒体图片",
      value: String(stats.total),
      icon: ImageIcon,
      tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    {
      label: "公开可访问",
      value: site.mode === "public" ? "所有人" : `${profiles.length} 个主页`,
      icon: Users,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "存储占用",
      value: formatBytes(stats.bytes),
      icon: Cloud,
      tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="pb-2">
      <section className="grid gap-8 border-b border-border/70 py-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-8">
        <div className="flex min-w-0 flex-col justify-center">
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="outline" className="rounded-full">
              <span className="mr-0.5 size-1.5 rounded-full bg-emerald-500" />
              运行正常
            </Badge>
            <span className="text-xs text-muted-foreground">管理控制台</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
            工作台
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            监控访客看到的内容，继续完成尚未配置的服务，也可以随时打开前台检查最终效果。
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/" target="_blank">
                打开前台
                <ArrowUpRight />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/settings">
                继续配置
                <Settings />
              </Link>
            </Button>
          </div>
        </div>

        <Card className="bg-card/75 shadow-none">
          <CardContent className="grid gap-5 p-5 pt-2 sm:p-6 sm:pt-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">站点概览</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  当前运行状态与服务连接
                </p>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-muted">
                <ShieldCheck className="size-4" />
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {summary.map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className="min-w-0">
                  <div
                    className={`mb-2 grid size-8 place-items-center rounded-lg ${tone}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
              <span className="text-muted-foreground">默认卡片</span>
              <Link
                href={`/c/${site.defaultUsername}`}
                target="_blank"
                className="inline-flex items-center gap-1 font-medium transition-opacity hover:opacity-65"
              >
                @{site.defaultUsername}
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(330px,.85fr)]">
        <div className="grid content-start gap-6">
          <SettingsSection
            title="需要确认"
            description="这些项目会影响访客看到的内容。"
            action={
              <Badge variant="outline">
                {setup.filter((item) => !item.done).length} 项待处理
              </Badge>
            }
          >
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background/30">
              {setup.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 transition-opacity duration-200 hover:opacity-65"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-muted-foreground">
                    {item.done ? <Check className="size-3.5" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {item.detail}
                    </span>
                  </span>
                  <Badge variant={item.done ? "secondary" : "outline"}>
                    {item.done ? "已就绪" : "待设置"}
                  </Badge>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="常用入口" description="直接进入最常用的管理页面。">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/admin/github">
                  <Github />
                  管理主页与数据
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/admin/images">
                  <ImageIcon />
                  整理媒体库
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/admin/appearance">
                  <Palette />
                  调整默认样式
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/admin/settings">
                  <Settings />
                  编辑站点设置
                </Link>
              </Button>
            </div>
          </SettingsSection>
        </div>

        <div className="grid content-start gap-6">
          <SettingsSection title="运行信息" description="当前实例与内容概况。">
            <div className="grid gap-0 overflow-hidden rounded-xl border border-border bg-background/30 text-sm">
              {[
                [
                  "访问范围",
                  site.mode === "public" ? "所有人可用" : "仅限允许的主页",
                ],
                ["GitHub 数据", github.mode === "token" ? "完整数据" : "公开数据"],
                ["访客投稿", site.allowPublicUploads ? "开放，需审核" : "未开放"],
                ["图片存储", driveConnected ? "Google Drive" : "本站存储"],
                ["媒体分类", categories.map((item) => item.label).join(" / ")],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="max-w-[62%] truncate text-right font-medium">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection
            title="默认卡片"
            description={`@${site.defaultUsername} · 新访客打开时看到的样式`}
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/appearance">调整</Link>
              </Button>
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api?username=${encodeURIComponent(site.defaultUsername)}`}
              alt={`${site.defaultUsername} 默认卡片预览`}
              className="mx-auto block w-full max-w-[340px] rounded-xl border border-border"
            />
          </SettingsSection>
        </div>
      </section>
    </div>
  );
}
