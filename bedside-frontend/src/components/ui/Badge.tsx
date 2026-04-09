import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "outline"
  | "muted";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeClasses: Record<BadgeVariant, string> = {
  default: "bg-mist text-ink",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/14 text-warning",
  danger: "bg-danger/12 text-danger",
  outline: "border border-line bg-transparent text-muted",
  muted: "bg-paper text-muted",
};

export function Badge({
  children,
  className,
  variant = "default",
  ...props
}: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em]",
        badgeClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
