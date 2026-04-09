import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("flex min-h-[18rem] flex-col items-center justify-center gap-4 text-center", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-primary-soft text-primary">{icon}</div>
      <div className="space-y-2">
        <h3 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-ink">{title}</h3>
        <p className="mx-auto max-w-md text-sm leading-6 text-muted">{description}</p>
      </div>
      {action}
    </Card>
  );
}
