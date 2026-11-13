import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
  badge,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {eyebrow}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            {title}
          </h1>
          {badge}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </div>
  );
}

export function SettingsSection({
  title,
  description,
  children,
  action,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden", className)}>
      <CardHeader className="flex-row items-start justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? (
            <CardDescription className="mt-1">{description}</CardDescription>
          ) : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className="pb-6">{children}</CardContent>
    </Card>
  );
}

export function StatusBadge({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <Badge variant={ok ? "success" : "warning"} className="gap-1.5">
      <span
        className={cn(
          "size-1.5 rounded-full",
          ok ? "bg-emerald-500" : "bg-amber-500",
        )}
      />
      {label}
    </Badge>
  );
}
