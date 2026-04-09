import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.26),rgba(255,255,255,0))] bg-[length:220%_100%] [animation-duration:1.6s]",
        className,
      )}
      style={{ backgroundColor: "rgba(var(--mist),0.8)" }}
      {...props}
    />
  );
}
