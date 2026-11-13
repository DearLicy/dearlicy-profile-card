"use client";

import * as React from "react";
import { Images, Upload } from "lucide-react";
import { toast } from "sonner";

import { ImageLightbox } from "@/components/studio/image-lightbox";
import {
  compressWebp,
  uploadWebp,
} from "@/components/studio/compress-image";
import type {
  PublicCategory,
  PublicImage,
  UploadStatus,
} from "@/components/studio/types";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AnimatedTabs,
  AnimatedTabsList,
  AnimatedTabsTrigger,
} from "@/components/ui/animated-tabs";
import { useIsMobile } from "@/components/shared/use-media-query";
import { cn, formatBytes } from "@/lib/utils";

type LibraryPayload = {
  images: PublicImage[];
  categories: PublicCategory[];
  allowPublicUploads: boolean;
};

export function BackgroundPicker({
  open,
  onOpenChange,
  selectedId,
  onApply,
  allowPublicUpload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedId: string;
  onApply: (image: PublicImage) => void;
  allowPublicUpload: boolean;
}) {
  const mobile = useIsMobile();
  const [library, setLibrary] = React.useState<LibraryPayload>({
    images: [],
    categories: [],
    allowPublicUploads: false,
  });
  const [filter, setFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [uploadCategory, setUploadCategory] = React.useState("photo");
  const [uploadStatus, setUploadStatus] = React.useState<UploadStatus>({
    active: false,
    percent: 0,
    label: "准备上传",
    detail: "浏览器会先压缩到 1 MB 以内。",
    variant: "working",
  });
  const [drawerSnap, setDrawerSnap] = React.useState<number | string | null>(0.56);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/images", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "图片库读取失败。");
      setLibrary({
        images: payload.images || [],
        categories: payload.categories || [],
        allowPublicUploads: Boolean(payload.allowPublicUploads),
      });
      if (payload.categories?.[0]?.slug) {
        setUploadCategory(payload.categories[0].slug);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "图片库读取失败。");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [open, load]);

  const visible =
    filter === "all"
      ? library.images
      : library.images.filter((image) => image.category === filter);

  async function handleFile(file?: File | null) {
    if (!file) {
      fileRef.current!.value = "";
      return;
    }
    try {
      setUploadStatus({
        active: true,
        percent: 0,
        label: "正在处理图片",
        detail: "压缩在浏览器里完成，原图不会上传。",
        variant: "working",
      });
      const compressed = await compressWebp(file, (percent, label) =>
        setUploadStatus((current) => ({
          ...current,
          percent,
          label,
        })),
      );
      setUploadStatus((current) => ({
        ...current,
        percent: 86,
        label: "正在提交审核",
        detail: `${formatBytes(compressed.blob.size)} WebP`,
      }));
      const payload = await uploadWebp(
        "/api/images",
        compressed.blob,
        uploadCategory,
        file.name.replace(/\.[^.]+$/, ""),
        (percent) =>
          setUploadStatus((current) => ({ ...current, percent })),
      );
      setUploadStatus({
        active: true,
        percent: 100,
        label: "已提交审核",
        detail: payload.message || "管理员确认后，这张图片就会出现在背景库里。",
        variant: "success",
      });
      toast.success("图片已提交审核");
      await load();
    } catch (error) {
      setUploadStatus({
        active: true,
        percent: 0,
        label: "上传失败",
        detail: error instanceof Error ? error.message : "图片上传失败。",
        variant: "error",
      });
      toast.error(error instanceof Error ? error.message : "图片上传失败。");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const content = (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <AnimatedTabs value={filter} onValueChange={setFilter} className="min-w-0 gap-0">
          <AnimatedTabsList className="h-9 max-w-full overflow-x-auto">
            <AnimatedTabsTrigger value="all">全部</AnimatedTabsTrigger>
            {library.categories.map((category) => (
              <AnimatedTabsTrigger key={category.slug} value={category.slug}>
                {category.label}
              </AnimatedTabsTrigger>
            ))}
          </AnimatedTabsList>
        </AnimatedTabs>
        <span className="ml-auto text-xs text-muted-foreground">
          {visible.length} 张可选图片
        </span>
      </div>

      {allowPublicUpload && library.allowPublicUploads ? (
        <div className="rounded-2xl border border-border bg-muted/35 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <Upload />
              上传图片
            </Button>
            <Select value={uploadCategory} onValueChange={setUploadCategory}>
              <SelectTrigger className="h-10 w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {library.categories.map((category) => (
                  <SelectItem key={category.slug} value={category.slug}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              访客投稿会先进入审核
            </span>
          </div>
          <Input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          {uploadStatus.active ? (
            <div className="mt-3 grid gap-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span
                  className={cn(
                    "font-medium",
                    uploadStatus.variant === "error" && "text-destructive",
                    uploadStatus.variant === "success" &&
                      "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {uploadStatus.label}
                </span>
                <span className="font-mono text-muted-foreground">
                  {uploadStatus.percent}%
                </span>
              </div>
              <Progress value={uploadStatus.percent} />
              <p className="text-xs text-muted-foreground">
                {uploadStatus.detail}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <ScrollArea className="-mr-2 flex-1 pr-2">
        {loading ? (
          <div className="columns-2 gap-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="mb-3 aspect-[3/4] w-full" />
            ))}
          </div>
        ) : visible.length ? (
          <div className="columns-2 gap-3">
            {visible.map((image) => (
              <Button
                key={image.id}
                type="button"
                variant="ghost"
                onClick={() => {
                  setLightboxIndex(
                    visible.findIndex((item) => item.id === image.id),
                  );
                  setLightboxOpen(true);
                }}
                className={cn(
                  "mb-3 block h-auto w-full break-inside-avoid overflow-hidden rounded-xl border bg-muted/20 p-0 text-left shadow-none hover:opacity-80",
                  selectedId === image.id
                    ? "border-foreground ring-2 ring-foreground/20"
                    : "border-border",
                )}
                aria-label={`预览图片 ${image.label}`}
              >
                <span className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.label}
                    loading="lazy"
                    decoding="async"
                    className="block h-auto w-full"
                  />
                </span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-border text-center">
            <div className="max-w-xs px-6 py-10">
              <Images className="mx-auto mb-3 size-7 text-muted-foreground" />
              <p className="font-medium">这里还没有可选的图片</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                换一个分类看看，或者先上传一张你喜欢的背景。
              </p>
            </div>
          </div>
        )}
      </ScrollArea>

      <ImageLightbox
        images={visible}
        open={lightboxOpen}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onUse={(image) => {
          onApply(image);
          setLightboxOpen(false);
          onOpenChange(false);
        }}
      />
    </div>
  );

  if (mobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={[0.56, 1]}
        activeSnapPoint={drawerSnap}
        setActiveSnapPoint={setDrawerSnap}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>媒体库</DrawerTitle>
            <DrawerDescription>
              完整浏览图片，点开后可以直接选用。
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>媒体库</SheetTitle>
          <SheetDescription>
            图片保持完整比例。点开后在灯箱底部确认是否使用。
          </SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
