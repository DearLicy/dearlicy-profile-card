import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[linear-gradient(100deg,var(--muted)_20%,color-mix(in_oklch,var(--muted),white_8%)_40%,var(--muted)_60%)] bg-[length:220%_100%]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
