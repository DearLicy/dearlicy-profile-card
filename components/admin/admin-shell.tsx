"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Command,
  Github,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";

import { AnimatedRoute } from "@/components/shared/animated-route";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "工作台", icon: LayoutDashboard },
  { href: "/admin/github", label: "主页与数据", icon: Github },
  { href: "/admin/images", label: "媒体库", icon: Image },
  { href: "/admin/appearance", label: "默认样式", icon: Palette },
  { href: "/admin/settings", label: "设置", icon: Settings },
];

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-1">
      {NAV.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "h-10 w-full justify-start overflow-hidden px-3",
                  collapsed && "justify-center px-0",
                )}
                onClick={onNavigate}
              >
                <Link href={item.href}>
                  <item.icon className="size-4 shrink-0" />
                  <span
                    className={cn(
                      "min-w-0 overflow-hidden whitespace-nowrap text-sm transition-[max-width,opacity] duration-200 ease-out",
                      collapsed
                        ? "max-w-0 opacity-0"
                        : "max-w-52 opacity-100 delay-150",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </Button>
            </TooltipTrigger>
            {collapsed ? (
              <TooltipContent side="right">{item.label}</TooltipContent>
            ) : null}
          </Tooltip>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex h-12 items-center gap-2.5 overflow-hidden",
        collapsed ? "justify-center px-0" : "px-2",
      )}
    >
      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
        卡
      </div>
      <div
        className={cn(
          "min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200",
          collapsed
            ? "max-w-0 opacity-0"
            : "max-w-44 opacity-100 delay-150",
        )}
      >
        <div className="truncate text-sm font-semibold">主页卡片</div>
        <div className="text-[11px] text-muted-foreground">内容管理</div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileNav, setMobileNav] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "\\") {
        event.preventDefault();
        setCollapsed((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function logout() {
    await fetch("/admin/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-background/75 p-3 backdrop-blur-xl transition-[width] duration-300 ease-out md:flex",
            collapsed ? "w-[68px]" : "w-[240px]",
          )}
        >
          <Brand collapsed={collapsed} />
          <div className="mt-4 flex-1">
            <NavLinks collapsed={collapsed} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex min-h-16 items-center gap-2 border-b border-border bg-background/75 px-4 backdrop-blur-xl md:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="打开管理导航"
            >
              <Menu />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
            <div className="hidden items-center gap-2 text-sm md:flex">
              <span className="font-medium">内容管理</span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCommandOpen(true)}
                    aria-label="打开命令面板"
                  >
                    <Command />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>命令面板 · ⌘K</TooltipContent>
              </Tooltip>
              <ThemeToggle />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void logout()}
                    aria-label="退出登录"
                  >
                    <LogOut />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>退出登录</TooltipContent>
              </Tooltip>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1420px] px-4 py-6 md:px-6 lg:py-8">
            <AnimatedRoute>{children}</AnimatedRoute>
          </main>
        </div>
      </div>

      <Drawer open={mobileNav} onOpenChange={setMobileNav} snapPoints={[0.58, 1]}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>管理菜单</DrawerTitle>
            <DrawerDescription>
              上滑可展开全部菜单，下拉或点击遮罩关闭。
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto pb-5">
            <NavLinks collapsed={false} onNavigate={() => setMobileNav(false)} />
          </div>
        </DrawerContent>
      </Drawer>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="搜索页面…" />
        <CommandList>
          <CommandEmpty>没有匹配页面。</CommandEmpty>
          <CommandGroup heading="页面">
            {NAV.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  setCommandOpen(false);
                  router.push(item.href);
                }}
              >
                <item.icon />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
