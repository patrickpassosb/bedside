import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { ToastItem, ToastTone } from "@/types";
import { cn, makeId } from "@/lib/utils";

interface ToastContextValue {
  pushToast: (input: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const iconMap: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const toneClasses: Record<ToastTone, string> = {
  success: "border-success/25 bg-success/10 text-success",
  error: "border-danger/25 bg-danger/10 text-danger",
  info: "border-primary/20 bg-primary/10 text-primary",
  warning: "border-warning/25 bg-warning/10 text-warning",
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((input: Omit<ToastItem, "id">) => {
    const id = makeId("toast");
    const next = { ...input, id };
    setToasts((current) => [...current, next]);
    window.setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = iconMap[toast.tone];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto animate-slide-in-right rounded-[1.25rem] border border-line/50 bg-panel/95 p-4 shadow-ambient backdrop-blur"
            >
              <div className="flex items-start gap-3">
                <div className={cn("rounded-full border p-2", toneClasses[toast.tone])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{toast.title}</p>
                  {toast.description ? <p className="mt-1 text-sm text-muted">{toast.description}</p> : null}
                </div>
                <button
                  aria-label="Dismiss notification"
                  className="rounded-full p-1 text-muted transition hover:bg-mist/70 hover:text-ink"
                  onClick={() => dismiss(toast.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastController() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastController must be used within ToastProvider");
  }

  return context;
}
