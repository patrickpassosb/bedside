import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type CardTone = "default" | "mist" | "glass" | "danger";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
}

const toneClasses: Record<CardTone, string> = {
  default: "paper-panel",
  mist: "mist-panel border border-line/50 bg-mist/55",
  glass: "glass-panel",
  danger: "rounded-3xl border border-danger/20 bg-danger/5 shadow-soft",
};

export function Card({ children, className, tone = "default", ...props }: PropsWithChildren<CardProps>) {
  return (
    <div className={cn("p-5 md:p-6", toneClasses[tone], className)} {...props}>
      {children}
    </div>
  );
}
