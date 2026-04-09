import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  eyebrow: string;
  accent?: "default" | "danger" | "success";
}

export function MetricCard({ title, value, icon, eyebrow, accent = "default" }: MetricCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        accent === "danger" && "border-danger/20 bg-danger/5",
        accent === "success" && "border-success/20 bg-success/5",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(var(--primary-strong),1),rgba(var(--primary),1))]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-kicker">{title}</p>
          <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-ink">{value}</p>
        </div>
        <div className="rounded-[1.2rem] bg-primary-soft p-3 text-primary">{icon}</div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-muted">
        <ArrowUpRight className="h-4 w-4 text-primary" />
        <span>{eyebrow}</span>
      </div>
    </Card>
  );
}
