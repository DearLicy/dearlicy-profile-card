"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Code2,
  Download,
  ExternalLink,
  Image as ImageIcon,
  LoaderCircle,
  Palette,
  RefreshCw,
  Search,
  Share2,
  SlidersHorizontal,
  Type,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { BackgroundPicker } from "@/components/studio/background-picker";
import { AnimatedNumber } from "@/components/shared/animated-number";
import {
  cardUrl,
  embedSnippet,
  shareUrl,
  studioPath,
} from "@/components/studio/card-query";
import type {
  CardConfig,
  PublicImage,
  SitePayload,
  SummaryPayload,
  ThemeOption,
} from "@/components/studio/types";
import { useIsMobile } from "@/components/shared/use-media-query";
import {
  AnimatedTabs,
  AnimatedTabsContent,
  AnimatedTabsList,
  AnimatedTabsTrigger,
  AnimatedTabsViews,
} from "@/components/ui/animated-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CORNER_LABELS = {
  tl: "左上",
  tr: "右上",
  bl: "左下",
  br: "右下",
} as const;

function ThemeTile({
  theme,
  active,
  onSelect,
  wide = false,
}: {
  theme: ThemeOption;
  active: boolean;
  onSelect: () => void;
  wide?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "h-auto w-full justify-start rounded-xl p-3 text-left shadow-none",
        wide && "sm:col-span-2",
        active && "border-foreground bg-muted/55",
      )}
    >
      <span
        className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg"
        style={{ background: theme.swatches[0] }}
      >
        {theme.layout === "tidal" ? (
          <>
            <span
              className="absolute -right-2 -top-2 size-9 rounded-full border"
              style={{ borderColor: theme.swatches[1], opacity: 0.38 }}
            />
            <span
              className="absolute inset-x-1 top-4 h-px -rotate-[18deg]"
              style={{ background: theme.swatches[1], opacity: 0.4 }}
            />
            <Image
              src="/theme-assets/whale-badge.webp"
              alt=""
              aria-hidden
              width={420}
              height={489}
              className="absolute -bottom-1 left-1/2 h-10 w-auto -translate-x-1/2 object-contain"
            />
          </>
        ) : (
          <>
            <span
              className="absolute inset-x-2 top-2 h-1 rounded-full opacity-85"
              style={{ background: theme.swatches[1] }}
            />
            <span
              className="absolute left-2 top-5 h-5 w-1 rounded-full opacity-60"
              style={{ background: theme.swatches[2] }}
            />
            <span
              className="absolute bottom-2 right-2 size-2.5 rounded-full border"
              style={{ borderColor: theme.swatches[2] }}
            />
          </>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {theme.labelZh}
          {active ? <Check className="size-3.5" /> : null}
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">
          {theme.noteZh}
        </span>
      </span>
    </Button>
  );
}

function CornerMap({
  corners,
  setCorners,
}: {
  corners: CardConfig["backgroundCorners"];
  setCorners: (key: keyof CardConfig["backgroundCorners"], value: number) => void;
}) {
  return (
    <div className="grid gap-4 rounded-xl border border-border p-4">
      <div className="grid grid-cols-2 gap-3">
        {(["tl", "tr", "bl", "br"] as const).map((key) => (
          <div key={key} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between text-[11px]">
              <span className="font-medium text-muted-foreground">
                {CORNER_LABELS[key]}
              </span>
              <span className="font-mono">{Math.round(corners[key] * 100)}%</span>
            </div>
            <Slider
              value={[Math.round(corners[key] * 100)]}
              onValueChange={([value]) => setCorners(key, value / 100)}
              min={0}
              max={100}
              step={1}
              aria-label={`${CORNER_LABELS[key]}透明度`}
            />
          </div>
        ))}
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        顺序固定为左上、右上、左下、右下
      </p>
    </div>
  );
}

function InspectorPanel({
  config,
  setConfig,
  themes,
  onChooseBackground,
  onClearBackground,
}: {
  config: CardConfig;
  setConfig: React.Dispatch<React.SetStateAction<CardConfig>>;
  themes: Record<string, ThemeOption>;
  onChooseBackground: () => void;
  onClearBackground: () => void;
}) {
  const currentTheme =
    themes[config.theme] || themes.midnight || Object.values(themes)[0];

  function update<K extends keyof CardConfig>(key: K, value: CardConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>设计你的卡片</CardTitle>
        <CardDescription>
          换主题、改文案或挑一张媒体库图片，预览会立刻更新。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatedTabs defaultValue="appearance">
          <AnimatedTabsList className="grid w-full grid-cols-3">
            <AnimatedTabsTrigger value="appearance">
              <Palette />
              外观
            </AnimatedTabsTrigger>
            <AnimatedTabsTrigger value="copy">
              <Type />
              文案
            </AnimatedTabsTrigger>
            <AnimatedTabsTrigger value="background">
              <ImageIcon />
              媒体库
            </AnimatedTabsTrigger>
          </AnimatedTabsList>

          <AnimatedTabsViews>
          <AnimatedTabsContent value="appearance" className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                主题与构图
              </span>
              <Badge variant="outline">{currentTheme?.labelZh || config.theme}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(themes).map(([name, theme]) => (
                <ThemeTile
                  key={name}
                  theme={theme}
                  active={config.theme === name}
                  onSelect={() => update("theme", name)}
                  wide={theme.layout === "tidal"}
                />
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-border p-3">
              <div className="flex items-center gap-3">
                <span
                  className="size-9 shrink-0 rounded-full border border-border"
                  style={{
                    background:
                      config.accent || currentTheme?.swatches?.[1] || "#111111",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <Label htmlFor="accent-color" className="text-xs">
                    强调色
                  </Label>
                  <Input
                    id="accent-color"
                    value={config.accent}
                    maxLength={7}
                    placeholder="留空跟随主题"
                    onChange={(event) =>
                      update("accent", event.target.value.toUpperCase())
                    }
                    className="mt-1.5 h-9 font-mono text-xs"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-end"
                  onClick={() => update("accent", "")}
                >
                  跟随主题
                </Button>
              </div>
            </div>
          </AnimatedTabsContent>

          <AnimatedTabsContent value="copy" className="mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="studio-mark">左上角标识</Label>
                <Input
                  id="studio-mark"
                  value={config.mark}
                  maxLength={24}
                  placeholder="留空时显示 GitHub 用户名"
                  onChange={(event) => update("mark", event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="studio-h1">第一行标题</Label>
                <Input
                  id="studio-h1"
                  value={config.headlineOne}
                  maxLength={42}
                  placeholder="例如：你好，我是"
                  onChange={(event) => update("headlineOne", event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="studio-h2">第二行标题</Label>
                <Input
                  id="studio-h2"
                  value={config.headlineTwo}
                  maxLength={48}
                  placeholder="例如：一名独立开发者"
                  onChange={(event) => update("headlineTwo", event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="studio-intro">简介</Label>
                <Textarea
                  id="studio-intro"
                  value={config.intro}
                  maxLength={120}
                  placeholder="用一句话介绍你正在做的事"
                  onChange={(event) => update("intro", event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="studio-badge">状态徽标</Label>
                <Input
                  id="studio-badge"
                  value={config.badge}
                  maxLength={64}
                  placeholder="例如：正在打造一件有趣的产品"
                  onChange={(event) => update("badge", event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="studio-note">页脚备注</Label>
                <Input
                  id="studio-note"
                  value={config.footerNote}
                  maxLength={64}
                  placeholder="例如：保持好奇。"
                  onChange={(event) => update("footerNote", event.target.value)}
                />
              </div>
            </div>
          </AnimatedTabsContent>

          <AnimatedTabsContent value="background" className="mt-4">
            <div className="grid gap-4">
              <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                {config.backgroundImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/images/${config.backgroundImage}.webp`}
                    alt="当前选择的背景图片"
                    className="block max-h-64 w-full object-contain"
                  />
                ) : (
                  <div className="grid min-h-32 place-items-center p-6 text-center">
                    <ImageIcon className="mb-2 size-6 text-muted-foreground" />
                    <span className="text-sm font-medium">尚未选择背景图片</span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      媒体库会保持图片的完整比例。
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={onChooseBackground}>
                  <ImageIcon />
                  {config.backgroundImage ? "更换图片" : "打开媒体库"}
                </Button>
                {config.backgroundImage ? (
                  <Button variant="outline" onClick={onClearBackground}>
                    <X />
                    清除
                  </Button>
                ) : null}
              </div>
              <CornerMap
                corners={config.backgroundCorners}
                setCorners={(key, value) =>
                  setConfig((current) => ({
                    ...current,
                    backgroundCorners: {
                      ...current.backgroundCorners,
                      [key]: value,
                    },
                  }))
                }
              />
            </div>
          </AnimatedTabsContent>
          </AnimatedTabsViews>
        </AnimatedTabs>
      </CardContent>
    </Card>
  );
}

function EmbedPanel({
  open,
  onOpenChange,
  config,
  username,
  code,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CardConfig;
  username: string;
  code: string;
}) {
  const mobile = useIsMobile();

  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error("复制失败，请手动选择文本。");
    }
  }

  const content = (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void copy(code, "README 代码已复制")}>
          <Code2 />
          复制嵌入代码
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            void copy(shareUrl(config, username), "分享链接已复制")
          }
        >
          <Share2 />
          分享此设计
        </Button>
      </div>
      <Textarea
        value={code}
        readOnly
        className="min-h-52 font-mono text-xs leading-5"
        aria-label="README 嵌入代码"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-muted-foreground">
          把这段 HTML 放进 GitHub 个人主页 README，卡片会保持更新。
        </p>
        <Button variant="outline" size="sm" asChild>
          <a href={cardUrl(config, username, 0)} target="_blank">
            打开 SVG
            <ExternalLink />
          </a>
        </Button>
      </div>
    </>
  );

  if (mobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} snapPoints={[0.58, 1]}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>分享与嵌入</DrawerTitle>
            <DrawerDescription>
              复制 README 代码，或分享当前设计。
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-4 overflow-y-auto pb-4">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>分享与嵌入</DialogTitle>
          <DialogDescription>
            复制 README 代码，或分享当前设计。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">{content}</div>
      </DialogContent>
    </Dialog>
  );
}

export function StudioApp({
  site,
  mode,
  initialUsername,
  initialConfig,
}: {
  site: SitePayload;
  mode: "landing" | "result";
  initialUsername: string;
  initialConfig: CardConfig;
}) {
  const router = useRouter();
  const mobile = useIsMobile();
  const [username, setUsername] = React.useState(initialUsername);
  const [input, setInput] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [summary, setSummary] = React.useState<SummaryPayload | null>(null);
  const [config, setConfig] = React.useState<CardConfig>(initialConfig);
  const [previewKey, setPreviewKey] = React.useState(0);
  const [previewLoading, setPreviewLoading] = React.useState(mode === "result");
  const [loadError, setLoadError] = React.useState("");
  const [backgroundOpen, setBackgroundOpen] = React.useState(false);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [embedOpen, setEmbedOpen] = React.useState(false);
  const [embedCode, setEmbedCode] = React.useState("");
  const [changeOpen, setChangeOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [nextUsername, setNextUsername] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const loadedOnce = React.useRef(false);

  const result = mode === "result";
  const preview = cardUrl(config, username, previewKey);

  const generate = React.useCallback(
    async (
      value: string,
      { force = false, navigate = true }: { force?: boolean; navigate?: boolean } = {},
    ) => {
      const candidate = value.trim();
      if (!candidate) {
        toast.error("先输入 GitHub 用户名或主页链接。");
        inputRef.current?.focus();
        return false;
      }
      setGenerating(true);
      setPreviewLoading(true);
      setLoadError("");
      try {
        const response = await fetch(
          `/api/summary?username=${encodeURIComponent(candidate)}${force ? "&refresh=1" : ""}`,
          { cache: "no-store" },
        );
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "生成失败。");
        setSummary(payload);
        setUsername(payload.login);
        setInput(payload.login);
        setPreviewKey(Date.now());
        if (navigate) {
          router.push(studioPath(config, payload.login));
        }
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "生成失败。";
        setLoadError(message);
        setPreviewLoading(false);
        toast.error(message);
        return false;
      } finally {
        setGenerating(false);
      }
    },
    [config, router],
  );

  React.useEffect(() => {
    if (!result || loadedOnce.current) return;
    loadedOnce.current = true;
    void generate(initialUsername, { navigate: false });
  }, [generate, initialUsername, result]);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, [contenteditable=true]")) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!mobile) setCommandOpen(true);
      }
      if (!result && event.key.toLowerCase() === "g") inputRef.current?.focus();
      if (result && event.key.toLowerCase() === "b") setBackgroundOpen(true);
      if (result && mobile && event.key.toLowerCase() === "e") setEditorOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobile, result]);

  function openEmbed() {
    setEmbedCode(embedSnippet(config, username));
    setEmbedOpen(true);
  }

  function applyBackground(image: PublicImage) {
    setConfig((current) => ({ ...current, backgroundImage: image.id }));
    toast.success(`已使用「${image.label}」作为背景`);
  }

  function clearBackground() {
    setConfig((current) => ({ ...current, backgroundImage: "" }));
    toast.success("已移除背景图片");
  }

  async function downloadSvg() {
    try {
      const response = await fetch(preview);
      if (!response.ok) throw new Error("SVG 下载失败。");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${username}-profile-card.svg`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("SVG 已下载");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "SVG 下载失败。");
    }
  }

  function openBackground() {
    if (mobile) setEditorOpen(false);
    setBackgroundOpen(true);
  }

  const inspector = (
    <InspectorPanel
      config={config}
      setConfig={setConfig}
      themes={site.themes}
      onChooseBackground={openBackground}
      onClearBackground={clearBackground}
    />
  );

  return (
    <div className="app-canvas min-h-[calc(100svh-4rem-1px)]">
      <main>
        {!result ? (
          <section className="relative mx-auto flex min-h-[calc(100svh-4rem-1px)] w-full max-w-4xl flex-col items-center justify-center px-5 py-16 text-center">
            <div
              className="pointer-events-none absolute inset-x-[8%] top-1/2 -z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur"
            >
              <span className="size-1.5 rounded-full bg-foreground" />
              一张会呼吸的 GitHub 名片
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl text-balance text-[clamp(2.15rem,4.2vw,3.4rem)] font-semibold leading-[1.08] tracking-[-0.05em]"
            >
              把 GitHub，
              <br />
              变成你的主页名片。
            </motion.h1>
            <motion.form
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.16,
                duration: 0.58,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-9 grid w-full max-w-xl gap-2 rounded-2xl border border-border/80 bg-background/75 p-2 shadow-[0_18px_70px_-42px_rgba(0,0,0,.45)] backdrop-blur-md sm:grid-cols-[minmax(0,1fr)_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                void generate(input);
              }}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={site.defaultUsername || "GitHub 用户名或主页链接"}
                  aria-label="GitHub 用户名或主页链接"
                  autoFocus
                  className="h-11 rounded-xl border-transparent bg-transparent pl-10 shadow-none focus-visible:border-ring"
                />
              </div>
              <Button
                type="submit"
                disabled={generating}
                className="h-11 rounded-xl px-5"
              >
                {generating ? <LoaderCircle className="animate-spin" /> : null}
                {generating ? "正在生成" : "生成卡片"}
                {!generating ? <ArrowRight /> : null}
              </Button>
            </motion.form>
          </section>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mx-auto w-full max-w-[1400px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-7"
          >
            <div className="mb-5 flex flex-wrap items-end gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight">
                  @{username}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  调整外观与文案，然后复制到你的 GitHub 主页。
                </p>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setChangeOpen(true)}>
                  <Search />
                  <span className="hidden sm:inline">换一个</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void generate(username, { force: true, navigate: false })}
                  disabled={generating}
                >
                  <RefreshCw className={generating ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">刷新数据</span>
                </Button>
                <Button onClick={openEmbed}>
                  <Code2 />
                  放到 README
                </Button>
              </div>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_430px]">
              <div className="min-w-0">
                <div className="mx-auto w-full max-w-[820px]">
                  <Card className="overflow-hidden">
                    <CardContent className="p-3 sm:p-4">
                      <div className="relative mx-auto aspect-[920/1360] w-full max-w-[660px] overflow-hidden rounded-lg bg-neutral-950">
                        {previewLoading ? (
                          <div className="absolute inset-0 grid gap-5 p-6">
                            <Skeleton className="h-10 w-2/3 rounded-md bg-white/10" />
                            <Skeleton className="mt-10 h-36 w-full bg-white/10" />
                            <Skeleton className="mt-auto h-40 w-full bg-white/10" />
                          </div>
                        ) : null}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          key={preview}
                          src={preview}
                          alt={`${username} 的 GitHub 主页卡片`}
                          className={cn(
                            "block size-full object-contain transition-opacity duration-300",
                            previewLoading ? "opacity-0" : "opacity-100",
                          )}
                          onLoad={() => setPreviewLoading(false)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {loadError ? (
                    <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                      {loadError}
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
                    {[
                      ["总星标", summary?.stars ?? 0],
                      ["社区评分", summary?.rank ?? "—"],
                      ["公开项目", summary?.repositories ?? 0],
                      ["关注者", summary?.followers ?? 0],
                    ].map(([label, value], index) => (
                      <motion.div
                        key={String(label)}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.045, duration: 0.24 }}
                        className="bg-background px-4 py-4"
                      >
                        <div className="text-[10px] font-medium text-muted-foreground">
                          {label}
                        </div>
                        <div className="mt-1 text-xl font-semibold tracking-tight">
                          {typeof value === "number" ? (
                            <AnimatedNumber value={value} />
                          ) : (
                            value
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden lg:sticky lg:top-24 lg:block">{inspector}</div>
            </div>
          </motion.div>
        )}
      </main>

      {result ? (
        <div className="fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom))] z-30 grid grid-cols-3 gap-1 rounded-xl border border-border bg-background/95 p-1.5 shadow-lg lg:hidden">
          <Button variant="ghost" onClick={() => setEditorOpen(true)}>
            <SlidersHorizontal />
            调整
          </Button>
          <Button variant="ghost" onClick={openBackground}>
            <ImageIcon />
            媒体库
          </Button>
          <Button variant="ghost" onClick={openEmbed}>
            <Share2 />
            分享
          </Button>
        </div>
      ) : null}

      <BackgroundPicker
        open={backgroundOpen}
        onOpenChange={setBackgroundOpen}
        selectedId={config.backgroundImage}
        onApply={applyBackground}
        allowPublicUpload={site.allowPublicUploads}
      />

      <EmbedPanel
        open={embedOpen}
        onOpenChange={setEmbedOpen}
        config={config}
        username={username}
        code={embedCode}
      />

      {mobile ? (
        <Drawer open={editorOpen} onOpenChange={setEditorOpen} snapPoints={[0.56, 1]}>
          <DrawerContent className="h-[94vh]">
            <DrawerHeader>
              <DrawerTitle>调整卡片</DrawerTitle>
              <DrawerDescription>
                向上拖动可铺满屏幕，下拉或点击遮罩关闭。
              </DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="-mr-2 flex-1 pr-2">{inspector}</ScrollArea>
          </DrawerContent>
        </Drawer>
      ) : null}

      {mobile ? (
        <Drawer open={changeOpen} onOpenChange={setChangeOpen} snapPoints={[0.48, 1]}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>换一个 GitHub 主页</DrawerTitle>
              <DrawerDescription>
                支持用户名、@用户名或完整 github.com 主页链接。
              </DrawerDescription>
            </DrawerHeader>
            <Input
              value={nextUsername}
              onChange={(event) => setNextUsername(event.target.value)}
              placeholder={site.defaultUsername || "DearLicy"}
              className="h-11"
            />
            <Button
              className="mt-3 w-full"
              disabled={generating}
              onClick={async () => {
                const ok = await generate(nextUsername);
                if (ok) {
                  setChangeOpen(false);
                  setNextUsername("");
                }
              }}
            >
              生成卡片
              <ArrowRight />
            </Button>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={changeOpen} onOpenChange={setChangeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>换一个 GitHub 主页</DialogTitle>
              <DialogDescription>
                输入用户名、@用户名或完整 github.com 主页链接。
              </DialogDescription>
            </DialogHeader>
            <Input
              value={nextUsername}
              onChange={(event) => setNextUsername(event.target.value)}
              placeholder={site.defaultUsername || "DearLicy"}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void generate(nextUsername).then((ok) => {
                    if (ok) {
                      setChangeOpen(false);
                      setNextUsername("");
                    }
                  });
                }
              }}
            />
            <div className="flex justify-between gap-2">
              <Button variant="ghost" onClick={() => router.push("/")}>
                返回首页
              </Button>
              <Button
                disabled={generating}
                onClick={async () => {
                  const ok = await generate(nextUsername);
                  if (ok) {
                    setChangeOpen(false);
                    setNextUsername("");
                  }
                }}
              >
                生成卡片
                <ArrowRight />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="搜索操作…" />
        <CommandList>
          <CommandEmpty>没有匹配的操作。</CommandEmpty>
          <CommandGroup heading="卡片">
            <CommandItem
              onSelect={() => {
                setCommandOpen(false);
                setBackgroundOpen(true);
              }}
            >
              <ImageIcon />
              打开媒体库
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setCommandOpen(false);
                openEmbed();
              }}
            >
              <Code2 />
              复制 README 嵌入代码
            </CommandItem>
            <CommandItem onSelect={() => void downloadSvg()}>
              <Download />
              下载 SVG
            </CommandItem>
            <CommandItem
              onSelect={() =>
                void generate(username, { force: true, navigate: false })
              }
            >
              <RefreshCw />
              刷新 GitHub 数据
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
