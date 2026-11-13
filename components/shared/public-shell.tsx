"use client";

import * as React from "react";
import Link from "next/link";
import { Github } from "lucide-react";

import { AnimatedRoute } from "@/components/shared/animated-route";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PublicShell({
  children,
  repoUrl,
}: {
  children: React.ReactNode;
  repoUrl: string;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3 px-5 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 transition-opacity duration-200 hover:opacity-65"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              卡
            </span>
            <span className="truncate text-sm font-semibold">主页卡片</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="在 GitHub 上查看这个项目"
                  >
                    <Github />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>在 GitHub 上查看</TooltipContent>
            </Tooltip>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <AnimatedRoute>{children}</AnimatedRoute>
    </div>
  );
}
