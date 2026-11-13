"use client";

import * as React from "react";
import { Check, Cloud, Github, LoaderCircle, Settings2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-ui";
import { GitHubConnection } from "@/components/admin/github-connection";
import type { GitHubStatus } from "@/components/admin/github-manager";
import { SettingsManager } from "@/components/admin/settings-manager";
import { StorageManager } from "@/components/admin/storage-manager";
import {
  AnimatedTabs,
  AnimatedTabsContent,
  AnimatedTabsList,
  AnimatedTabsTrigger,
  AnimatedTabsViews,
} from "@/components/ui/animated-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DriveSettings = React.ComponentProps<typeof StorageManager>["initialDrive"];
type SiteForm = React.ComponentProps<typeof SettingsManager>["initial"];

export function SettingsWorkspace({
  initialSite,
  initialGithub,
  initialDrive,
  initialStorageDriver,
  localImageIds,
  imageBytes,
  callbackUrl,
  origin,
  initialTab,
}: {
  initialSite: SiteForm;
  initialGithub: GitHubStatus;
  initialDrive: DriveSettings;
  initialStorageDriver: "local" | "google-drive";
  localImageIds: string[];
  imageBytes: number;
  callbackUrl: string;
  origin: string;
  initialTab: string;
}) {
  const safeTab = ["site", "github", "google"].includes(initialTab)
    ? initialTab
    : "site";
  const [tab, setTab] = React.useState(safeTab);
  const [sitePending, setSitePending] = React.useState(false);
  const [githubPending, setGithubPending] = React.useState(false);
  const [googlePending, setGooglePending] = React.useState(false);
  const driveConnected = Boolean(
    initialDrive.hasRefreshToken && initialDrive.status === "connected",
  );

  function changeTab(value: string) {
    setTab(value);
    const url = new URL(window.location.href);
    if (value === "site") url.searchParams.delete("tab");
    else url.searchParams.set("tab", value);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }

  return (
    <>
      <AdminPageHeader
        title="设置"
        description="站点、GitHub 与 Google Drive 的配置都在这里。"
        badge={<Badge variant="outline">管理员</Badge>}
        action={
          tab === "site" ? (
            <Button type="submit" form="site-settings-form" disabled={sitePending}>
              {sitePending ? <LoaderCircle className="animate-spin" /> : <Check />}
              保存设置
            </Button>
          ) : tab === "github" ? (
            <Button
              type="submit"
              form="github-connection-form"
              disabled={githubPending}
            >
              {githubPending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Check />
              )}
              保存连接
            </Button>
          ) : (
            <Button
              type="submit"
              form="google-drive-form"
              disabled={googlePending}
            >
              {googlePending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Check />
              )}
              保存授权
            </Button>
          )
        }
      />
      <AnimatedTabs value={tab} onValueChange={changeTab}>
        <AnimatedTabsList className="grid w-full max-w-lg grid-cols-3">
          <AnimatedTabsTrigger value="site">
            <Settings2 />
            站点
          </AnimatedTabsTrigger>
          <AnimatedTabsTrigger value="github">
            <Github />
            GitHub
          </AnimatedTabsTrigger>
          <AnimatedTabsTrigger value="google">
            <Cloud />
            Google Drive
          </AnimatedTabsTrigger>
        </AnimatedTabsList>
        <AnimatedTabsViews>
          <AnimatedTabsContent value="site" className="mt-2">
            <SettingsManager
              embedded
              initial={initialSite}
              driveConnected={driveConnected}
              origin={origin}
              onPendingChange={setSitePending}
            />
          </AnimatedTabsContent>
          <AnimatedTabsContent value="github" className="mt-2">
            <GitHubConnection
              initial={initialGithub}
              onPendingChange={setGithubPending}
            />
          </AnimatedTabsContent>
          <AnimatedTabsContent value="google" className="mt-2">
            <StorageManager
              embedded
              initialDrive={initialDrive}
              initialStorageDriver={initialStorageDriver}
              localImageIds={localImageIds}
              imageBytes={imageBytes}
              callbackUrl={callbackUrl}
              onPendingChange={setGooglePending}
            />
          </AnimatedTabsContent>
        </AnimatedTabsViews>
      </AnimatedTabs>
    </>
  );
}
