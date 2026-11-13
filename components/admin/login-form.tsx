"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, LoaderCircle, LockKeyhole } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { adminFetch, errorMessage } from "@/components/admin/admin-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!password) {
      toast.error("请输入管理员密码。");
      return;
    }
    setPending(true);
    try {
      await adminFetch("/admin/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      toast.success("登录成功");
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
      setPassword("");
      inputRef.current?.focus();
    } finally {
      setPending(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={submit}
      className="login-card relative w-full rounded-[28px] border border-border/70 bg-card/88 p-6 shadow-[0_30px_100px_-48px_rgba(15,23,42,.55)] backdrop-blur-xl sm:p-8"
    >
      <div className="mb-7 flex justify-center">
        <div className="grid size-14 place-items-center rounded-2xl border border-primary/10 bg-primary text-primary-foreground shadow-[0_14px_34px_-16px_rgba(0,0,0,.65)]">
          <KeyRound className="size-5" />
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.035em]">
          管理员登录
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          使用部署时设置的管理员密码进入控制台。
        </p>
      </div>
      <div className="mt-7 grid gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/55 p-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground">
            <LockKeyhole className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">密码登录</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              只有站点管理员可以继续
            </p>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="admin-password">管理员密码</Label>
          <Input
            ref={inputRef}
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="输入管理员密码"
            className="h-11 rounded-xl bg-background/75"
          />
        </div>
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="mt-5 h-11 w-full rounded-xl"
      >
        {pending ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
        {pending ? "正在验证" : "进入管理后台"}
        {!pending ? <ArrowRight /> : null}
      </Button>
      <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <LockKeyhole className="size-3.5" />
        凭据仅用于本次身份验证
      </div>
    </motion.form>
  );
}
