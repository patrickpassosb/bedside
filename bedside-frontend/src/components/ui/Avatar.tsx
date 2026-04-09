import type { HTMLAttributes } from "react";
import { cn, getAvatarPalette, getInitials } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  seed?: string;
  size?: AvatarSize;
  live?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
};

export function Avatar({ name, seed, size = "md", live = false, className, ...props }: AvatarProps) {
  const palette = getAvatarPalette(seed ?? name);
  return (
    <div className="relative inline-flex">
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-[1.15rem] border font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
          sizeClasses[size],
          className,
        )}
        style={palette}
        {...props}
      >
        {getInitials(name)}
      </div>
      {live ? (
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-panel bg-success shadow-[0_0_0_4px_rgba(46,136,95,0.16)] animate-pulseRing" />
      ) : null}
    </div>
  );
}
