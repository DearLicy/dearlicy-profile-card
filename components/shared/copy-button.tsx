"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CopyButton({
  value,
  label = "复制",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("已复制到剪贴板");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("浏览器拒绝写入剪贴板。");
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={className}
          onClick={() => void copy()}
        >
          {copied ? <Check /> : <Copy />}
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "已复制" : "复制到剪贴板"}</TooltipContent>
    </Tooltip>
  );
}
