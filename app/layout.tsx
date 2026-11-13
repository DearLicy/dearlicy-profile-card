import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { Providers } from "@/components/providers";
import { SiteBackdrop } from "@/components/shared/site-backdrop";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "主页卡片 · 一张会呼吸的 GitHub 名片",
    template: "%s · 主页卡片",
  },
  description:
    "输入 GitHub 用户名或主页链接，生成实时更新、可定制的动画 SVG 名片。",
  metadataBase: new URL("https://profile.galgame.vip"),
  openGraph: {
    title: "主页卡片",
    description: "把 GitHub 主页变成一张会呼吸的动态名片。",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#101011" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={geist.variable}>
        <SiteBackdrop />
        <div className="app-surface">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
