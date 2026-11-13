import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LoginForm } from "@/components/admin/login-form";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="login-stage relative grid min-h-screen place-items-center overflow-hidden px-5 py-16">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <div className="relative w-full max-w-[460px]">
        <span className="login-spark login-spark-one" aria-hidden="true" />
        <span className="login-spark login-spark-two" aria-hidden="true" />
        <span className="login-spark login-spark-three" aria-hidden="true" />
        <div className="mb-7 flex items-center justify-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            卡
          </span>
          <span className="text-sm font-semibold">主页卡片</span>
        </div>
        <LoginForm />
        <Link
          href="/"
          className="mx-auto mt-6 flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-opacity duration-200 hover:opacity-65"
        >
          <ArrowLeft className="size-3.5" />
          返回主页
        </Link>
      </div>
    </main>
  );
}
