"use client";

import * as React from "react";
import { Check, LoaderCircle, Paintbrush, RotateCcw, SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";

import { adminFetch, errorMessage } from "@/components/admin/admin-fetch";
import {
  AdminPageHeader,
  SettingsSection,
} from "@/components/admin/admin-ui";
import { cardUrl } from "@/components/studio/card-query";
import type {
  CardConfig,
  ThemeOption,
} from "@/components/studio/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const LABELS = {
  tl: "左上角",
  tr: "右上角",
  bl: "左下角",
  br: "右下角",
} as const;

function defaultConfig(card: CardConfig) {
  return {
    ...card,
    accent: "",
    backgroundImage: "",
    backgroundCorners: {
      tl: 0.5,
      tr: 0.24,
      br: 0.38,
      bl: 0.16,
    },
    mark: "",
    headlineOne: "",
    headlineTwo: "",
    intro: "",
    badge: "",
    footerNote: "",
  };
}

export function AppearanceManager({
  defaultUsername,
  initialCard,
  themes,
}: {
  defaultUsername: string;
  initialCard: CardConfig;
  themes: Record<string, ThemeOption>;
}) {
  const [card, setCard] = React.useState(initialCard);
  const [previewCard, setPreviewCard] = React.useState(initialCard);
  const [pending, setPending] = React.useState(false);
  const [accentOpen, setAccentOpen] = React.useState(false);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setPreviewCard(card), 360);
    return () => window.clearTimeout(timer);
  }, [card]);

  function update<K extends keyof CardConfig>(key: K, value: CardConfig[K]) {
    setCard((current) => ({ ...current, [key]: value }));
  }

  function setCorner(key: keyof CardConfig["backgroundCorners"], value: number) {
    setCard((current) => ({
      ...current,
      backgroundCorners: {
        ...current.backgroundCorners,
        [key]: value,
      },
    }));
  }

  async function save() {
    setPending(true);
    try {
      await adminFetch("/admin/api/settings", {
        method: "PUT",
        body: JSON.stringify({ card }),
      });
      setPreviewCard(card);
      toast.success("默认外观已保存");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  const previewUrl = cardUrl(previewCard, defaultUsername, 1);

  return (
    <>
      <AdminPageHeader
        eyebrow="默认样式"
        title="访客先看到的样子"
        description="这是大家第一次打开时看到的卡片。他们仍然可以自己换主题、文案和背景。"
        action={
          <>
            <Button
              variant="outline"
              onClick={() => setCard(defaultConfig(card))}
            >
              <RotateCcw />
              恢复默认内容
            </Button>
            <Button onClick={() => void save()} disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : <Check />}
              保存这套样式
            </Button>
          </>
        }
        badge={<Badge variant="outline">实时预览</Badge>}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid gap-6">
          <SettingsSection
            title="选择版式"
            description="五套主题的构图、节奏和信息层级都不一样，不只是换颜色。"
            action={
              <Badge variant="secondary">
                {themes[card.theme]?.labelZh || card.theme}
              </Badge>
            }
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(themes).map(([name, theme]) => {
                const active = card.theme === name;
                return (
                  <Button
                    key={name}
                    type="button"
                    variant="outline"
                    onClick={() => update("theme", name)}
                    className={cn(
                      "group h-auto justify-start rounded-2xl p-3 text-left shadow-none",
                      active && "border-foreground/55 bg-muted/55",
                    )}
                  >
                    <span
                      className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl"
                      style={{ background: theme.swatches[0] }}
                    >
                      <span
                        className="absolute inset-x-2 top-2 h-1.5 rounded-full opacity-85"
                        style={{ background: theme.swatches[1] }}
                      />
                      <span
                        className="absolute left-2 top-5 h-6 w-1.5 rounded-full opacity-65"
                        style={{ background: theme.swatches[2] }}
                      />
                      <span
                        className="absolute bottom-2 right-2 size-3.5 rounded-full border"
                        style={{ borderColor: theme.swatches[2] }}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        {theme.labelZh}
                        {active ? <Check className="size-3.5" /> : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">
                        {theme.noteZh}
                      </span>
                      <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
                        {theme.layout}
                      </span>
                    </span>
                  </Button>
                );
              })}
            </div>
            <div className="mt-5 rounded-2xl border border-border bg-muted/25 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="size-10 shrink-0 rounded-full border-4 border-background shadow ring-1 ring-border"
                  style={{
                    background:
                      card.accent ||
                      themes[card.theme]?.swatches?.[1] ||
                      "#E8442A",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">强调色</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {card.accent || "跟随主题"}
                  </p>
                </div>
                <Popover open={accentOpen} onOpenChange={setAccentOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Paintbrush />
                      选颜色
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto">
                    <HexColorPicker
                      color={
                        card.accent ||
                        themes[card.theme]?.swatches?.[1] ||
                        "#E8442A"
                      }
                      onChange={(value) => update("accent", value.toUpperCase())}
                    />
                    <div className="mt-3 grid gap-2">
                      <Input
                        value={card.accent}
                        onChange={(event) => update("accent", event.target.value)}
                        placeholder="#E8442A 或留空"
                        className="h-9 rounded-xl font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => update("accent", "")}
                      >
                        跟随主题
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title="背景可见度"
            description="四个角可以分别变淡或加深，顺序固定为左上、右上、左下、右下。"
            action={<SlidersHorizontal className="size-4 text-muted-foreground" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {(["tl", "tr", "bl", "br"] as const).map((key) => (
                <div
                  key={key}
                  className={cn(
                    "rounded-2xl border border-border bg-muted/25 p-3",
                    key === "tl" && "rounded-tl-3xl",
                    key === "tr" && "rounded-tr-3xl",
                    key === "bl" && "rounded-bl-3xl",
                    key === "br" && "rounded-br-3xl",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">
                      {LABELS[key]}
                    </span>
                    <span className="font-mono">
                      {Math.round(card.backgroundCorners[key] * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[Math.round(card.backgroundCorners[key] * 100)]}
                    onValueChange={([value]) => setCorner(key, value / 100)}
                    min={0}
                    max={100}
                    step={1}
                    aria-label={`${LABELS[key]}透明度`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[10px] text-muted-foreground">
              <span>左上 → 右上</span>
              <span>左下 → 右下</span>
            </div>
          </SettingsSection>

          <SettingsSection
            title="先写一段默认文案"
            description="留空时会使用主题自带的文案。访客也可以通过分享链接保留自己的内容。"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["mark", "左上角标识", "留空时显示 GitHub 用户名"],
                ["headlineOne", "第一行标题", "例如：你好，我是"],
                ["headlineTwo", "第二行标题", "例如：一名产品工程师"],
                ["badge", "状态徽标", "例如：正在做一件有趣的事"],
              ].map(([key, label, placeholder]) => (
                <div key={key} className="grid gap-2">
                  <Label htmlFor={`default-${key}`}>{label}</Label>
                  <Input
                    id={`default-${key}`}
                    value={String(card[key as keyof CardConfig] ?? "")}
                    onChange={(event) =>
                      update(key as keyof CardConfig, event.target.value as never)
                    }
                    placeholder={placeholder}
                    className="h-10"
                  />
                </div>
              ))}
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="default-intro">简介</Label>
                <Textarea
                  id="default-intro"
                  value={card.intro}
                  onChange={(event) => update("intro", event.target.value)}
                  placeholder="用一句话介绍你正在做的事"
                  className="min-h-24 rounded-xl"
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="default-note">页脚备注</Label>
                <Input
                  id="default-note"
                  value={card.footerNote}
                  onChange={(event) => update("footerNote", event.target.value)}
                  placeholder="例如：保持好奇。"
                  className="h-10"
                />
              </div>
            </div>
          </SettingsSection>
        </div>

        <Card className="sticky top-24 overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>实时预览</CardTitle>
                <CardDescription className="mt-1">
                  @{defaultUsername} · 当前默认样式
                </CardDescription>
              </div>
              <Badge variant="outline">SVG</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <motion.div
              key={previewUrl}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.28 }}
              className="relative mx-auto aspect-[920/1360] w-full max-w-[340px] overflow-hidden rounded-2xl border border-border bg-[#08080a]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={`${defaultUsername} 默认卡片预览`}
                className="block size-full object-contain"
              />
            </motion.div>
            <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
              保存后，新访客打开时就会看到这套样式。
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
