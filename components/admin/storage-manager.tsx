"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudUpload,
  ExternalLink,
  FolderSync,
  Link2,
  LoaderCircle,
  PlugZap,
  Save,
  ShieldCheck,
  Trash2,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";

import { adminFetch, errorMessage } from "@/components/admin/admin-fetch";
import {
  AdminPageHeader,
  SettingsSection,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { CopyButton } from "@/components/shared/copy-button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBytes, relativeTime } from "@/lib/utils";

type DriveSettings = {
  clientId: string;
  folderId: string;
  accountEmail: string;
  connectedAt: string;
  status: string;
  message: string;
  updatedAt: string;
  hasClientSecret: boolean;
  hasRefreshToken: boolean;
};

export function StorageManager({
  initialDrive,
  initialStorageDriver,
  localImageIds,
  imageBytes,
  callbackUrl,
  embedded = false,
  onPendingChange,
}: {
  initialDrive: DriveSettings;
  initialStorageDriver: "local" | "google-drive";
  localImageIds: string[];
  imageBytes: number;
  callbackUrl: string;
  embedded?: boolean;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [drive, setDrive] = React.useState(initialDrive);
  const [storageDriver, setStorageDriver] = React.useState(initialStorageDriver);
  const [clientId, setClientId] = React.useState(initialDrive.clientId);
  const [clientSecret, setClientSecret] = React.useState("");
  const [folderId, setFolderId] = React.useState(initialDrive.folderId);
  const [pending, setPending] = React.useState("");
  const [removeOpen, setRemoveOpen] = React.useState(false);

  const connected = drive.status === "connected" && drive.hasRefreshToken;
  const configured = Boolean(drive.clientId && drive.hasClientSecret);

  React.useEffect(() => {
    onPendingChange?.(pending === "config");
  }, [onPendingChange, pending]);

  React.useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("google");
    if (!status) return;
    if (status === "connected") toast.success("Google Drive 授权成功");
    else if (status === "failed") toast.error("Google Drive 授权失败，请重新尝试");
    else if (status === "config-required")
      toast.error("请先保存 Google 客户端 ID 和密钥");
    window.history.replaceState(
      {},
      "",
      embedded ? "/admin/settings?tab=google" : "/admin/storage",
    );
  }, [embedded]);

  async function saveConfig() {
    setPending("config");
    try {
      const result = await adminFetch<{ drive: DriveSettings }>(
        "/admin/api/google/config",
        {
          method: "PUT",
          body: JSON.stringify({
            clientId,
            clientSecret: clientSecret || undefined,
            folderId,
          }),
        },
      );
      setDrive(result.drive);
      setClientSecret("");
      toast.success("Google 授权信息已保存");
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
        drive: DriveSettings;
        accountEmail: string;
        folderId: string;
        latencyMs: number;
      }>("/admin/api/google/test", { method: "POST" });
      setDrive(result.drive);
      setFolderId(result.folderId || result.drive.folderId);
      toast.success(
        `Drive 连接正常 · ${result.accountEmail || result.drive.accountEmail} · ${result.latencyMs} ms`,
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function disconnect() {
    setPending("disconnect");
    try {
      const result = await adminFetch<{ drive: DriveSettings }>(
        "/admin/api/google/disconnect",
        { method: "POST" },
      );
      setDrive(result.drive);
      toast.success("已暂停新的云端上传，现有授权仍保留");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function removeCredentials() {
    setPending("remove");
    try {
      const result = await adminFetch<{ drive: DriveSettings }>(
        "/admin/api/google/credentials",
        { method: "DELETE" },
      );
      setDrive(result.drive);
      setClientId("");
      setClientSecret("");
      setFolderId("");
      setRemoveOpen(false);
      toast.success("Google 授权已移除");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function saveDriver() {
    setPending("driver");
    try {
      await adminFetch("/admin/api/settings", {
        method: "PUT",
        body: JSON.stringify({ storageDriver }),
      });
      toast.success("新图片的保存位置已更新");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function migrateAll() {
    if (!localImageIds.length) {
      toast.error("本站没有需要搬到云端的图片。");
      return;
    }
    setPending("migrate");
    try {
      const result = await adminFetch<{ migrated: number; failed: number }>(
        "/admin/api/images/migrate",
        {
          method: "POST",
          body: JSON.stringify({ ids: localImageIds }),
        },
      );
      toast.success(
        `已迁移 ${result.migrated} 张${result.failed ? `，${result.failed} 张失败` : ""}`,
      );
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  return (
    <>
      {!embedded ? (
        <AdminPageHeader
          eyebrow="云端空间"
          title="把图片放进你的 Google Drive"
          description="连接后，新图片可以直接保存到自己的云盘，减少服务器空间占用。授权只用于这个图片库。"
          action={
            connected ? (
              <Button
                variant="outline"
                onClick={() => void testConnection()}
                disabled={pending === "test"}
              >
                <PlugZap className={pending === "test" ? "animate-pulse" : ""} />
                测试连接
              </Button>
            ) : (
              <Button asChild disabled={!configured}>
                <a href="/admin/oauth/google/start">
                  <Link2 />
                  连接我的 Google Drive
                </a>
              </Button>
            )
          }
          badge={
            <StatusBadge
              ok={connected}
              label={connected ? "已连接" : configured ? "等你授权" : "还没配置"}
            />
          }
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
        <div className="grid content-start gap-6">
          <SettingsSection
            title="1. 创建 Google 授权"
            description="去 Google Cloud 新建一个 OAuth Web 客户端，再把下面这个地址加入它的允许回调列表。"
            action={<Badge variant="outline">需要 Google 账号</Badge>}
          >
            <form
              id="google-drive-form"
              onSubmit={(event) => {
                event.preventDefault();
                void saveConfig();
              }}
              className="grid gap-4"
            >
              <div className="grid gap-2">
                <Label>允许回调地址</Label>
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/25 p-3">
                  <code className="min-w-0 flex-1 truncate font-mono text-[11px]">
                    {callbackUrl}
                  </code>
                  <CopyButton value={callbackUrl} className="shrink-0" />
                </div>
                <Button variant="link" asChild className="h-auto w-fit px-0 text-xs">
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                  >
                    打开 Google Cloud 设置页
                    <ExternalLink />
                  </a>
                </Button>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="drive-client-id">客户端 ID</Label>
                <Input
                  id="drive-client-id"
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                  placeholder="…apps.googleusercontent.com"
                  className="h-10 font-mono text-xs"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="drive-client-secret">客户端密钥</Label>
                <Input
                  id="drive-client-secret"
                  type="password"
                  value={clientSecret}
                  onChange={(event) => setClientSecret(event.target.value)}
                  placeholder={
                    drive.hasClientSecret
                      ? "已保存；留空保持现有密钥"
                      : "输入 OAuth 客户端密钥"
                  }
                  className="h-10 font-mono text-xs"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="drive-folder">目标文件夹 ID 或链接</Label>
                <Input
                  id="drive-folder"
                  value={folderId}
                  onChange={(event) => setFolderId(event.target.value)}
                  placeholder="留空会在你的云盘里新建图片文件夹"
                  className="h-10 font-mono text-xs"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {configured ? (
                  <Button variant="outline" asChild>
                    <a href="/admin/oauth/google/start">
                      <Link2 />
                      {drive.hasRefreshToken ? "重新连接" : "连接 Google Drive"}
                    </a>
                  </Button>
                ) : null}
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                授权信息会加密保存。连接后只会管理这个图片库里的文件，不会读取 Gmail、联系人或云盘中的其他内容。
              </p>
            </form>
          </SettingsSection>

          {!embedded ? (
            <SettingsSection
              title="2. 新图片保存到哪里"
              description="只影响以后上传的图片；已有图片仍会留在原来的位置。"
              action={<FolderSync className="size-4 text-muted-foreground" />}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="grid flex-1 gap-2">
                  <Label>新图片保存到</Label>
                  <Select
                    value={storageDriver}
                    onValueChange={(value) =>
                      setStorageDriver(value as "local" | "google-drive")
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
                </div>
                <Button
                  onClick={() => void saveDriver()}
                  disabled={pending === "driver"}
                >
                  {pending === "driver" ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Save />
                  )}
                  保存驱动
                </Button>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-border p-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-xs leading-5 text-muted-foreground">
                  迁移时只有上传成功才会切换；如果失败，原图仍会保留在本站。
                </p>
              </div>
            </SettingsSection>
          ) : null}
        </div>

        <div className="grid content-start gap-6">
          <SettingsSection
            title="当前连接"
            description="这里显示最近一次检查或授权后的状态。"
            action={
              <Badge variant={connected ? "success" : "warning"}>
                {connected ? "连接正常" : "尚未连接"}
              </Badge>
            }
          >
            <div className="grid gap-0 overflow-hidden rounded-2xl border border-border text-sm">
              {[
                ["Google 账号", drive.accountEmail || "尚未连接"],
                ["云端文件夹", drive.folderId || "连接后自动创建"],
                ["最近检查", drive.updatedAt ? relativeTime(drive.updatedAt) : "—"],
                ["当前状态", drive.message || "尚未连接"],
                ["本站图片", `${localImageIds.length} 张 · ${formatBytes(imageBytes)}`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="ml-auto max-w-[62%] truncate text-right font-medium">
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              {connected ? (
                <Button variant="outline" onClick={() => void testConnection()} disabled={pending === "test"}>
                  <PlugZap />
                  检查连接和文件夹
                </Button>
              ) : null}
              {connected ? (
                <Button variant="outline" onClick={() => void migrateAll()} disabled={pending === "migrate"}>
                  {pending === "migrate" ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <CloudUpload />
                  )}
                  把本站图片迁到云端
                </Button>
              ) : null}
              {drive.hasRefreshToken ? (
                <Button variant="ghost" onClick={() => void disconnect()} disabled={pending === "disconnect"}>
                  <Unplug />
                  暂停新的云端上传
                </Button>
              ) : null}
              {drive.clientId || drive.hasRefreshToken ? (
                <Button variant="ghost" className="text-destructive" onClick={() => setRemoveOpen(true)}>
                  <Trash2 />
                  移除 Google 授权
                </Button>
              ) : null}
            </div>
          </SettingsSection>

          <SettingsSection
            title="关于你的数据"
            description="访客不需要登录 GitHub，也不需要拥有 Google 账号。"
          >
            <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
              <p className="flex gap-2">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-foreground" />
                GitHub 数据来自公开主页；你可以选择配置只读 Token 获得更完整的数据。
              </p>
              <p className="flex gap-2">
                <Cloud className="mt-1 size-4 shrink-0 text-foreground" />
                Google 授权只用于图片库，不会读取 Gmail 或联系人。
              </p>
              <p className="flex gap-2">
                <AlertTriangle className="mt-1 size-4 shrink-0 text-foreground" />
                暂停上传不会影响已有图片；如果移除 Google 授权，存放在云端的图片会暂时无法读取。
              </p>
            </div>
          </SettingsSection>
        </div>
      </div>

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>移除 Google 授权？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后，存放在 Google Drive 的图片会暂时无法读取；本站图片不会受影响。建议先确认云盘文件仍可访问。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void removeCredentials()}
            >
              移除授权
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
