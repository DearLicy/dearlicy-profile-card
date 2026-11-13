"use client";

import * as React from "react";
import {
  ArrowDownToLine,
  Check,
  CloudUpload,
  FolderPlus,
  Image as ImageIcon,
  Images,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { adminFetch, errorMessage } from "@/components/admin/admin-fetch";
import {
  AdminPageHeader,
  StatusBadge,
} from "@/components/admin/admin-ui";
import {
  compressWebp,
  uploadWebp,
} from "@/components/studio/compress-image";
import { ImageLightbox } from "@/components/studio/image-lightbox";
import type {
  PublicCategory,
  PublicImage,
  UploadStatus,
} from "@/components/studio/types";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AnimatedTabs,
  AnimatedTabsList,
  AnimatedTabsTrigger,
} from "@/components/ui/animated-tabs";
import { cn, formatBytes } from "@/lib/utils";

export type AdminImage = PublicImage & {
  published: boolean;
  source: "admin" | "guest";
  storageDriver: "local" | "google-drive";
  storageKey: string;
  updatedAt: string;
};

export type AdminImageStats = {
  total: number;
  published: number;
  pending: number;
  bytes: number;
  categories: Record<string, number>;
};

type LibraryResponse = {
  images: AdminImage[];
  categories: PublicCategory[];
  stats: AdminImageStats;
  storageDriver: "local" | "google-drive";
  allowPublicUploads: boolean;
};

function updateCategoryInList(
  categories: PublicCategory[],
  category: PublicCategory,
) {
  return categories.map((entry) =>
    entry.slug === category.slug ? category : entry,
  );
}

export function ImageManager({
  initialImages,
  initialCategories,
  initialStats,
  initialStorageDriver,
  initialAllowPublicUploads,
  driveConnected,
}: {
  initialImages: AdminImage[];
  initialCategories: PublicCategory[];
  initialStats: AdminImageStats;
  initialStorageDriver: "local" | "google-drive";
  initialAllowPublicUploads: boolean;
  driveConnected: boolean;
}) {
  const [images, setImages] = React.useState(initialImages);
  const [categories, setCategories] =
    React.useState<PublicCategory[]>(initialCategories);
  const [stats, setStats] = React.useState(initialStats);
  const [storageDriver, setStorageDriver] = React.useState(
    initialStorageDriver,
  );
  const [allowPublicUploads, setAllowPublicUploads] = React.useState(
    initialAllowPublicUploads,
  );
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [pending, setPending] = React.useState("");
  const [selectMode, setSelectMode] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [categoryOpen, setCategoryOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminImage | null>(
    null,
  );
  const [newCategory, setNewCategory] = React.useState("");
  const [categoryLabels, setCategoryLabels] = React.useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      initialCategories.map((category) => [category.slug, category.label]),
    ),
  );

  const visible = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return images.filter((image) => {
      const categoryMatch = filter === "all" || image.category === filter;
      const searchMatch =
        !needle ||
        image.label.toLowerCase().includes(needle) ||
        image.categoryLabel.toLowerCase().includes(needle) ||
        image.source.toLowerCase().includes(needle);
      return categoryMatch && searchMatch;
    });
  }, [filter, images, search]);

  async function load() {
    setPending("reload");
    try {
      const payload = await adminFetch<LibraryResponse>("/admin/api/images");
      setImages(payload.images);
      setCategories(payload.categories);
      setStats(payload.stats);
      setStorageDriver(payload.storageDriver);
      setAllowPublicUploads(payload.allowPublicUploads);
      setCategoryLabels(
        Object.fromEntries(
          payload.categories.map((category) => [category.slug, category.label]),
        ),
      );
      toast.success("图片列表已更新");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  function applyImage(next: AdminImage) {
    setImages((current) =>
      current.map((image) => (image.id === next.id ? next : image)),
    );
  }

  async function patchImage(
    image: AdminImage,
    patch: { published?: boolean; category?: string; label?: string },
  ) {
    setPending(`image:${image.id}`);
    try {
      const result = await adminFetch<{ image: AdminImage }>(
        `/admin/api/images/${image.id}`,
        { method: "PATCH", body: JSON.stringify(patch) },
      );
      applyImage(result.image);
      setStats((current) => {
        const wasPublished = image.published;
        const nowPublished =
          patch.published === undefined ? current.published : patch.published;
        return {
          ...current,
          published:
            current.published -
            Number(wasPublished) +
            Number(Boolean(nowPublished)),
          pending:
            current.pending -
            Number(!wasPublished) +
            Number(!Boolean(nowPublished)),
        };
      });
      toast.success(
        patch.category
          ? "图片分类已更新"
          : patch.published
            ? "这张图片现在对访客可见"
            : "这张图片已对访客隐藏",
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function deleteImage(image: AdminImage) {
    setPending(`delete:${image.id}`);
    try {
      await adminFetch(`/admin/api/images/${image.id}`, { method: "DELETE" });
      setImages((current) => current.filter((entry) => entry.id !== image.id));
      setStats((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
        published: Math.max(0, current.published - Number(image.published)),
        pending: Math.max(0, current.pending - Number(!image.published)),
        bytes: Math.max(0, current.bytes - image.bytes),
      }));
      setDeleteTarget(null);
      setLightboxOpen(false);
      toast.success("图片已删除");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function migrateImage(image: AdminImage) {
    setPending(`migrate:${image.id}`);
    try {
      const result = await adminFetch<{ image: AdminImage }>(
        `/admin/api/images/${image.id}/migrate`,
        { method: "POST" },
      );
      applyImage(result.image);
      toast.success("图片已迁移到 Google Drive");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function bulkAction(action: "publish" | "unpublish" | "category" | "migrate", category?: string) {
    if (!selected.size) {
      toast.error("先选择要处理的图片。");
      return;
    }
    setPending(`bulk:${action}`);
    const targets = images.filter((image) => selected.has(image.id));
    try {
      if (action === "migrate") {
        const result = await adminFetch<{ migrated: number; failed: number }>(
          "/admin/api/images/migrate",
          {
            method: "POST",
            body: JSON.stringify({ ids: targets.map((image) => image.id) }),
          },
        );
        await load();
        toast.success(
          `已迁移 ${result.migrated} 张${result.failed ? `，${result.failed} 张失败` : ""}`,
        );
      } else {
        await Promise.all(
          targets.map(async (image) => {
            const result = await adminFetch<{ image: AdminImage }>(
              `/admin/api/images/${image.id}`,
              {
                method: "PATCH",
                body: JSON.stringify(
                  action === "category"
                    ? { category }
                    : { published: action === "publish" },
                ),
              },
            );
            applyImage(result.image);
          }),
        );
        setStats((current) => ({
          ...current,
          published: images.filter(
            (image) =>
              selected.has(image.id) ? action === "publish" : image.published,
          ).length,
          pending: images.filter(
            (image) =>
              selected.has(image.id) ? action !== "publish" : !image.published,
          ).length,
        }));
        toast.success(
          action === "publish"
            ? "所选图片现在对访客可见"
            : action === "unpublish"
              ? "所选图片已对访客隐藏"
              : "所选图片分类已更新",
        );
      }
      setSelected(new Set());
      setSelectMode(false);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function saveCategory(category: PublicCategory, label: string) {
    if (!label.trim() || label.trim() === category.label) return;
    setPending(`category:${category.slug}`);
    try {
      const result = await adminFetch<{ category: PublicCategory }>(
        "/admin/api/categories",
        {
          method: "PATCH",
          body: JSON.stringify({ slug: category.slug, label }),
        },
      );
      setCategories((current) =>
        updateCategoryInList(current, result.category),
      );
      setCategoryLabels((current) => ({
        ...current,
        [category.slug]: result.category.label,
      }));
      toast.success("分类名称已更新");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function addCategory() {
    if (!newCategory.trim()) {
      toast.error("请输入分类名称。");
      return;
    }
    setPending("category:add");
    try {
      const result = await adminFetch<{ category: PublicCategory }>(
        "/admin/api/categories",
        {
          method: "POST",
          body: JSON.stringify({ label: newCategory }),
        },
      );
      setCategories((current) => [...current, result.category]);
      setCategoryLabels((current) => ({
        ...current,
        [result.category.slug]: result.category.label,
      }));
      setNewCategory("");
      toast.success("新分类已添加");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  async function removeCategory(category: PublicCategory) {
    setPending(`category-delete:${category.slug}`);
    try {
      await adminFetch(
        `/admin/api/categories?slug=${encodeURIComponent(category.slug)}`,
        { method: "DELETE" },
      );
      setCategories((current) =>
        current.filter((entry) => entry.slug !== category.slug),
      );
      toast.success("分类已删除");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending("");
    }
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <AdminPageHeader
        title="媒体库"
        description="管理访客可选的背景图片。图片保持完整比例，访客投稿会先等待审核。"
        action={
          <>
            <Button variant="outline" onClick={() => void load()} disabled={pending === "reload"}>
              <RefreshCw className={pending === "reload" ? "animate-spin" : ""} />
              刷新
            </Button>
            <Button onClick={() => setUploadOpen(true)}>
              <Upload />
              上传图片
            </Button>
          </>
        }
        badge={
          <StatusBadge
            ok={storageDriver === "local" || driveConnected}
            label={
              storageDriver === "google-drive"
                ? driveConnected
                  ? "存放在云端"
                  : "云端未连接"
                : "存放在本站"
            }
          />
        }
      />

      <section className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/70 p-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索图片、分类或投稿来源"
            className="h-10 rounded-xl pl-10"
          />
        </div>
        <AnimatedTabs value={filter} onValueChange={setFilter} className="gap-0">
          <AnimatedTabsList className="h-9 max-w-full overflow-x-auto">
            <AnimatedTabsTrigger value="all">全部</AnimatedTabsTrigger>
            {categories.map((category) => (
              <AnimatedTabsTrigger key={category.slug} value={category.slug}>
                {category.label}
                <span className="text-[10px] text-muted-foreground">
                  {stats.categories?.[category.slug] || 0}
                </span>
              </AnimatedTabsTrigger>
            ))}
          </AnimatedTabsList>
        </AnimatedTabs>
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant={allowPublicUploads ? "success" : "outline"}
            className="hidden sm:inline-flex"
          >
            访客投稿{allowPublicUploads ? "已开启" : "未开启"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setCategoryOpen(true)}>
            <FolderPlus />
            分类
          </Button>
          <Button
            variant={selectMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setSelectMode((value) => !value);
              setSelected(new Set());
            }}
          >
            <Check />
            {selectMode ? "退出批处理" : "批量管理"}
          </Button>
        </div>
      </section>

      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border px-4 py-3 text-xs text-muted-foreground">
        <span>
          共 <strong className="font-medium text-foreground">{stats.total}</strong> 张
        </span>
        <span>访客可选 {stats.published}</span>
        <span>待审核 {stats.pending}</span>
        <span>占用 {formatBytes(stats.bytes)}</span>
      </div>

      {selectMode ? (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-[76px] z-30 mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background/90 p-3 shadow-lg backdrop-blur"
        >
          <Badge variant="secondary">{selected.size} 张已选</Badge>
          <Button
            size="sm"
            onClick={() => void bulkAction("publish")}
            disabled={!selected.size || pending.startsWith("bulk")}
          >
            公开
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void bulkAction("unpublish")}
            disabled={!selected.size || pending.startsWith("bulk")}
          >
            隐藏
          </Button>
          <Select
            onValueChange={(value) => void bulkAction("category", value)}
            disabled={!selected.size || pending.startsWith("bulk")}
          >
            <SelectTrigger className="h-9 w-40 text-xs">
              <SelectValue placeholder="设为分类" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.slug} value={category.slug}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void bulkAction("migrate")}
            disabled={
              !selected.size ||
              pending.startsWith("bulk") ||
              !driveConnected ||
              storageDriver !== "local"
            }
          >
            <CloudUpload />
            迁到云端
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setSelected(new Set())}
          >
            清除选择
          </Button>
        </motion.div>
      ) : null}

      {visible.length ? (
        <div className="columns-2 gap-3 sm:columns-3 xl:columns-4">
          {visible.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 12) * 0.025 }}
              className="relative mb-3 break-inside-avoid"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "group block h-auto w-full overflow-hidden rounded-xl border bg-muted/20 p-0 text-left shadow-none hover:opacity-80",
                  selected.has(image.id)
                    ? "border-foreground ring-2 ring-foreground/20"
                    : "border-border",
                )}
                onClick={() => {
                  if (selectMode) toggleSelected(image.id);
                  else {
                    setLightboxIndex(
                      visible.findIndex((entry) => entry.id === image.id),
                    );
                    setLightboxOpen(true);
                  }
                }}
                aria-label={
                  selectMode
                    ? `选择图片 ${image.label}`
                    : `预览图片 ${image.label}`
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.label}
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full"
                />
              </Button>
              {selectMode ? (
                <span
                  className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/90 shadow"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Checkbox
                    checked={selected.has(image.id)}
                    onCheckedChange={() => toggleSelected(image.id)}
                    aria-label={`选择 ${image.label}`}
                  />
                </span>
              ) : null}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-border text-center">
          <div className="max-w-sm px-6">
            <Images className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="font-medium">
              {images.length ? "没有匹配的图片" : "这里还没有图片"}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {images.length
                ? "换一个搜索词或分类筛选。"
                : "上传第一张背景图片，访客就能完整预览并选择。"}
            </p>
            {!images.length ? (
              <Button className="mt-5" onClick={() => setUploadOpen(true)}>
                <Upload />
                上传图片
              </Button>
            ) : null}
          </div>
        </div>
      )}

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        categories={categories}
        onUploaded={(image) => {
          setImages((current) => [image, ...current]);
          setStats((current) => ({
            ...current,
            total: current.total + 1,
            published: current.published + Number(image.published),
            pending: current.pending + Number(!image.published),
            bytes: current.bytes + image.bytes,
            categories: {
              ...current.categories,
              [image.category]:
                (current.categories?.[image.category] || 0) + 1,
            },
          }));
        }}
      />

      <CategoryDialog
        open={categoryOpen}
        onOpenChange={setCategoryOpen}
        categories={categories}
        labels={categoryLabels}
        setLabels={setCategoryLabels}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        pending={pending}
        onSave={saveCategory}
        onAdd={addCategory}
        onRemove={removeCategory}
      />

      <ImageLightbox
        images={visible.map((image) => ({ ...image, url: image.url }))}
        open={lightboxOpen}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxOpen(false)}
        admin
        adminActions={(baseImage) => {
          const image = images.find((entry) => entry.id === baseImage.id);
          if (!image) return null;
          return (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
              <Badge
                variant="outline"
                className="border-white/20 bg-background text-foreground"
              >
                {image.source === "guest" ? "访客投稿" : "管理员上传"}
              </Badge>
              <Badge
                variant="outline"
                className="border-white/20 bg-background text-foreground"
              >
                {image.storageDriver === "google-drive"
                  ? "Google Drive"
                  : "本站存储"}
              </Badge>
              <Select
                value={image.category}
                onValueChange={(value) =>
                  void patchImage(image, { category: value })
                }
              >
                <SelectTrigger className="h-9 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  {categories.map((category) => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="bg-white text-black hover:opacity-80"
                onClick={() =>
                  void patchImage(image, { published: !image.published })
                }
                disabled={pending === `image:${image.id}`}
              >
                {pending === `image:${image.id}` ? (
                  <LoaderCircle className="animate-spin" />
                ) : image.published ? (
                  <ArrowDownToLine />
                ) : (
                  <Check />
                )}
                {image.published ? "隐藏" : "公开"}
              </Button>
              {image.storageDriver === "local" && driveConnected ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-background text-foreground"
                  onClick={() => void migrateImage(image)}
                  disabled={pending === `migrate:${image.id}`}
                >
                  <CloudUpload
                    className={
                      pending === `migrate:${image.id}` ? "animate-pulse" : ""
                    }
                  />
                  迁到云端
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                className="bg-background text-foreground"
                onClick={() => {
                  setDeleteTarget(image);
                  setLightboxOpen(false);
                }}
              >
                <Trash2 />
                删除
              </Button>
            </div>
          );
        }}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除「{deleteTarget?.label}」</AlertDialogTitle>
            <AlertDialogDescription>
              图片会被永久删除。已经使用这张图的卡片会改回主题背景，删除后无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) void deleteImage(deleteTarget);
              }}
            >
              {pending === `delete:${deleteTarget?.id}` ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Trash2 />
              )}
              删除图片
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function UploadDialog({
  open,
  onOpenChange,
  categories,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: PublicCategory[];
  onUploaded: (image: AdminImage) => void;
}) {
  const [category, setCategory] = React.useState(categories[0]?.slug || "photo");
  const [label, setLabel] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<UploadStatus>({
    active: false,
    percent: 0,
    label: "等待选择图片",
    detail: "原图只会在你的浏览器里处理，上传的是压缩后的版本。",
    variant: "working",
  });
  const fileRef = React.useRef<HTMLInputElement>(null);

  const activeCategory = categories.some((entry) => entry.slug === category)
    ? category
    : categories[0]?.slug || "photo";

  async function start() {
    if (!file) {
      toast.error("先选择一张图片。");
      return;
    }
    try {
      setStatus({
        active: true,
        percent: 2,
        label: "正在读取图片",
        detail: "原图不会离开浏览器。",
        variant: "working",
      });
      const compressed = await compressWebp(file, (percent, nextLabel) =>
        setStatus((current) => ({ ...current, percent, label: nextLabel })),
      );
      setStatus((current) => ({
        ...current,
        percent: 86,
        label: "正在保存图片",
        detail: `${formatBytes(compressed.blob.size)} · ${compressed.width} × ${compressed.height}`,
      }));
      const payload = await uploadWebp(
        "/admin/api/images",
        compressed.blob,
        activeCategory,
        label || file.name.replace(/\.[^.]+$/, ""),
        (percent) => setStatus((current) => ({ ...current, percent })),
      );
      setStatus({
        active: true,
        percent: 100,
        label: "上传完成",
        detail: "图片已保存，访客现在可以选择它作为背景。",
        variant: "success",
      });
      onUploaded(payload.image);
      setFile(null);
      setLabel("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success("图片已上传");
    } catch (error) {
      setStatus({
        active: true,
        percent: 0,
        label: "上传失败",
        detail: errorMessage(error),
        variant: "error",
      });
      toast.error(errorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>上传图片</DialogTitle>
          <DialogDescription>
            你上传的图片会直接公开。原图不会上传，我们会先把它压缩到合适大小。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            className="grid h-auto min-h-40 w-full place-items-center whitespace-normal rounded-2xl border-dashed bg-muted/25 p-6 text-center font-normal"
          >
            <span>
              <ImageIcon className="mx-auto mb-2 size-7 text-muted-foreground" />
              <span className="block text-sm font-medium">
                {file ? file.name : "选择一张图片"}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                支持 PNG、JPEG、WebP、GIF 或 AVIF，原图最大 32 MB
              </span>
            </span>
          </Button>
          <Input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setStatus((current) => ({ ...current, active: false }));
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="upload-label">图片名称</Label>
              <Input
                id="upload-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="留空使用文件名"
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <Label>分类</Label>
              <Select value={activeCategory} onValueChange={setCategory}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((entry) => (
                    <SelectItem key={entry.slug} value={entry.slug}>
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {status.active ? (
            <div className="grid gap-2 rounded-2xl border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span
                  className={cn(
                    "font-medium",
                    status.variant === "error" && "text-destructive",
                    status.variant === "success" &&
                      "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {status.label}
                </span>
                <span className="font-mono text-muted-foreground">
                  {status.percent}%
                </span>
              </div>
              <Progress value={status.percent} />
              <p className="text-xs leading-5 text-muted-foreground">
                {status.detail}
              </p>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button onClick={() => void start()} disabled={!file}>
            {status.active && status.percent < 100 ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Upload />
            )}
            上传这张图片
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryDialog({
  open,
  onOpenChange,
  categories,
  labels,
  setLabels,
  newCategory,
  setNewCategory,
  pending,
  onSave,
  onAdd,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: PublicCategory[];
  labels: Record<string, string>;
  setLabels: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  newCategory: string;
  setNewCategory: (value: string) => void;
  pending: string;
  onSave: (category: PublicCategory, label: string) => void;
  onAdd: () => void;
  onRemove: (category: PublicCategory) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>分类管理</DialogTitle>
          <DialogDescription>
            “写真”和“动漫”会一直保留。自定义分类里还有图片时，请先把图片移到别的分类。
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {categories.map((category) => (
            <div
              key={category.slug}
              className="flex items-center gap-2 bg-background/55 p-2.5"
            >
              <Input
                value={labels[category.slug] ?? category.label}
                onChange={(event) =>
                  setLabels((current) => ({
                    ...current,
                    [category.slug]: event.target.value,
                  }))
                }
                className="h-9 flex-1 rounded-xl"
                aria-label={`${category.label} 分类名称`}
              />
              <Badge variant="outline" className="hidden sm:inline-flex">
                {category.count || 0} 张
              </Badge>
              <Button
                size="icon"
                variant="outline"
                className="size-9 rounded-xl"
                onClick={() =>
                  onSave(category, labels[category.slug] ?? category.label)
                }
                disabled={pending === `category:${category.slug}`}
                aria-label={`保存 ${category.label}`}
              >
                {pending === `category:${category.slug}` ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Pencil />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-9 rounded-xl text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(category)}
                disabled={
                  category.builtIn ||
                  Boolean(category.count) ||
                  pending === `category-delete:${category.slug}`
                }
                aria-label={`删除 ${category.label}`}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onAdd();
            }}
            placeholder="新分类名称"
            className="h-10 rounded-xl"
          />
          <Button
            onClick={onAdd}
            disabled={pending === "category:add"}
            className="rounded-xl"
          >
            {pending === "category:add" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Plus />
            )}
            添加
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X />
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
