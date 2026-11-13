"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Maximize2,
  Minimize2,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PublicImage } from "@/components/studio/types";
import { cn } from "@/lib/utils";

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

function ToolbarButton({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 rounded-full text-white/85 hover:text-white disabled:opacity-30"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function ImageLightbox({
  images,
  open,
  index,
  onIndexChange,
  onClose,
  onUse,
  admin = false,
  adminActions,
}: {
  images: PublicImage[];
  open: boolean;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onUse?: (image: PublicImage) => void;
  admin?: boolean;
  adminActions?: (image: PublicImage) => React.ReactNode;
}) {
  const [zoom, setZoom] = React.useState(1);
  const [rotate, setRotate] = React.useState(0);
  const [thumbsOpen, setThumbsOpen] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const thumbsRef = React.useRef<HTMLDivElement>(null);

  const activeIndex = Math.min(Math.max(index, 0), Math.max(0, images.length - 1));
  const image = images[activeIndex] ?? images[0] ?? null;
  const visible = open && Boolean(image);

  React.useEffect(() => {
    // Reset the viewport controls whenever the active slide changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoom(1);
    setRotate(0);
  }, [activeIndex]);

  React.useEffect(() => {
    function onFullscreenChange() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  React.useEffect(() => {
    if (!visible || !thumbsOpen) return;
    const current = thumbsRef.current?.querySelector<HTMLElement>(
      `[data-image-index="${activeIndex}"]`,
    );
    current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex, thumbsOpen, visible]);

  function move(delta: number) {
    const next = Math.min(images.length - 1, Math.max(0, activeIndex + delta));
    if (next !== activeIndex) onIndexChange(next);
  }

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    void containerRef.current.requestFullscreen().catch(() => undefined);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "+" || event.key === "=") {
      setZoom((value) => Math.min(ZOOM_MAX, value + ZOOM_STEP));
    } else if (event.key === "-" || event.key === "_") {
      setZoom((value) => Math.max(ZOOM_MIN, value - ZOOM_STEP));
    } else if (event.key === "0") {
      setZoom(1);
      setRotate(0);
    } else if (event.key.toLowerCase() === "r") {
      setRotate((value) => (value + 90) % 360);
    } else if (event.key.toLowerCase() === "f") {
      toggleFullscreen();
    } else if (event.key.toLowerCase() === "t") {
      setThumbsOpen((value) => !value);
    }
  }

  return (
    <DialogPrimitive.Root
      open={visible}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/25 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-300 data-[state=closed]:duration-200" />
        <DialogPrimitive.Content
          ref={containerRef}
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-[101] flex h-dvh max-h-none flex-col overflow-hidden border-0 bg-zinc-950/95 text-white shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-300 data-[state=closed]:duration-200"
        >
          <DialogPrimitive.Title className="sr-only">
            {image ? `查看图片：${image.label}` : "查看图片"}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            使用左右方向键切换图片，按 Escape 关闭。
          </DialogPrimitive.Description>

          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-16 shrink-0 items-center gap-3 px-3 sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[11px] tabular-nums text-white/50">
                  {activeIndex + 1} / {images.length}
                </span>
                <span className="truncate text-sm font-medium text-white/90">
                  {image?.label || "图片预览"}
                </span>
              </div>
              {image ? (
                <p className="mt-0.5 text-[10px] text-white/35">
                  {image.width} × {image.height}
                  {image.categoryLabel ? ` · ${image.categoryLabel}` : ""}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-0.5">
              <div className="hidden items-center gap-0.5 sm:flex">
                <ToolbarButton
                  label="缩小"
                  onClick={() =>
                    setZoom((value) => Math.max(ZOOM_MIN, value - ZOOM_STEP))
                  }
                  disabled={zoom <= ZOOM_MIN}
                >
                  <ZoomOut />
                </ToolbarButton>
                <span className="w-10 text-center font-mono text-[10px] tabular-nums text-white/45">
                  {Math.round(zoom * 100)}%
                </span>
                <ToolbarButton
                  label="放大"
                  onClick={() =>
                    setZoom((value) => Math.min(ZOOM_MAX, value + ZOOM_STEP))
                  }
                  disabled={zoom >= ZOOM_MAX}
                >
                  <ZoomIn />
                </ToolbarButton>
                <ToolbarButton
                  label="旋转"
                  onClick={() => setRotate((value) => (value + 90) % 360)}
                >
                  <RotateCw />
                </ToolbarButton>
                <ToolbarButton
                  label={fullscreen ? "退出全屏" : "全屏"}
                  onClick={toggleFullscreen}
                >
                  {fullscreen ? <Minimize2 /> : <Maximize2 />}
                </ToolbarButton>
              </div>
              {image ? (
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-full text-white/85 hover:text-white"
                >
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    aria-label="下载原图"
                  >
                    <Download />
                  </a>
                </Button>
              ) : null}
              <ToolbarButton label="关闭" onClick={onClose}>
                <X />
              </ToolbarButton>
            </div>
          </motion.header>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
            onClick={onClose}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 z-20 size-12 rounded-full bg-white/10 text-white hover:text-white disabled:opacity-25 sm:left-4"
              disabled={activeIndex <= 0}
              onClick={(event) => {
                event.stopPropagation();
                move(-1);
              }}
              aria-label="上一张"
            >
              <ChevronLeft className="size-6" />
            </Button>

            <AnimatePresence mode="popLayout" initial={false}>
              {image ? (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="flex max-h-full max-w-full items-center justify-center p-4 sm:px-20"
                  onClick={(event) => event.stopPropagation()}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.label}
                    draggable={false}
                    className="block select-none object-contain"
                    style={{
                      maxHeight: zoom <= 1 ? "82dvh" : "none",
                      maxWidth: zoom <= 1 ? "88vw" : "none",
                      transform: `scale(${zoom}) rotate(${rotate}deg)`,
                      transition:
                        "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 z-20 size-12 rounded-full bg-white/10 text-white hover:text-white disabled:opacity-25 sm:right-4"
              disabled={activeIndex >= images.length - 1}
              onClick={(event) => {
                event.stopPropagation();
                move(1);
              }}
              aria-label="下一张"
            >
              <ChevronRight className="size-6" />
            </Button>
          </div>

          <motion.footer
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 bg-black/20"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={cn(
                "flex flex-col gap-3 px-3 py-3 sm:px-5",
                admin
                  ? "sm:items-center"
                  : "sm:flex-row sm:items-center sm:justify-between",
              )}
            >
              {!admin ? (
                <p className="min-w-0 flex-1 truncate text-xs text-white/40">
                  图片将以完整比例加入背景，四角透明度仍可调整。
                </p>
              ) : (
                <div className="min-w-0 flex-1 text-xs text-white/40">
                  完整预览与图片管理
                </div>
              )}
              <div
                className={cn(
                  "flex flex-wrap items-center gap-2",
                  !admin && "shrink-0",
                )}
              >
                {admin && adminActions && image ? adminActions(image) : null}
                {!admin && onUse && image ? (
                  <Button
                    size="sm"
                    className="bg-white text-black hover:opacity-80"
                    onClick={() => onUse(image)}
                  >
                    使用此图片
                  </Button>
                ) : null}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="h-8 w-full rounded-none text-[11px] text-white/50 hover:bg-white/5 hover:text-white/80"
              onClick={() => setThumbsOpen((value) => !value)}
            >
              {thumbsOpen ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronUp className="size-3.5" />
              )}
              {thumbsOpen
                ? "收起缩略图"
                : `共 ${images.length} 张 · 展开缩略图`}
            </Button>

            <div
              className={cn(
                "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out",
                thumbsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="min-h-0">
                <div
                  ref={thumbsRef}
                  className="flex gap-1.5 overflow-x-auto px-3 pb-3"
                >
                  {images.map((entry, entryIndex) => (
                    <Button
                      key={entry.id}
                      type="button"
                      variant="ghost"
                      data-image-index={entryIndex}
                      className={cn(
                        "h-16 w-[88px] shrink-0 overflow-hidden rounded-md border-2 p-0 hover:opacity-100",
                        entryIndex === activeIndex
                          ? "border-white opacity-100"
                          : "border-transparent opacity-50",
                      )}
                      onClick={() => onIndexChange(entryIndex)}
                      aria-label={`查看第 ${entryIndex + 1} 张图片`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.url}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
