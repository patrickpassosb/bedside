import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useData } from "@/lib/data";
import { formatClock } from "@/lib/utils";

const titles: Array<{ matcher: RegExp; label: string }> = [
  { matcher: /^\/dashboard/, label: "Overview" },
  { matcher: /^\/activity/, label: "Activity Feed" },
  { matcher: /^\/escalations/, label: "Escalations" },
  { matcher: /^\/patients\//, label: "Patient Detail" },
  { matcher: /^\/admin/, label: "Administrative Portal" },
];

export function TopBar() {
  const { pathname } = useLocation();
  const { hospital, usingMockData, error } = useData();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const title = useMemo(
    () => titles.find((entry) => entry.matcher.test(pathname))?.label ?? "Bedside Platform",
    [pathname],
  );

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/20 bg-[rgba(255,255,255,0.54)] backdrop-blur-2xl dark:bg-[rgba(8,14,26,0.7)] lg:left-[240px]">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
        <div className="space-y-2">
          <p className="section-kicker">Bedside Platform</p>
          <h2 className="font-heading text-[2rem] font-semibold tracking-[-0.05em] text-ink">{title}</h2>
          <div className="flex flex-wrap gap-2 text-[0.68rem] uppercase tracking-[0.2em]">
            {usingMockData ? (
              <span className="rounded-full border border-primary/15 bg-primary-soft/90 px-3 py-1 text-primary">
                Mock data
              </span>
            ) : null}
            {error ? (
              <span className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-warning">
                Live fallback
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-5">
          <div className="hidden rounded-full border border-line/50 bg-panel/70 px-4 py-2 text-xs uppercase tracking-[0.24em] text-muted md:block">
            {hospital?.name ?? "Hospital Isaac Newton"}
          </div>
          <div className="rounded-full border border-line/50 bg-panel/70 px-4 py-2 font-mono text-sm tracking-[0.3em] text-ink">
            {formatClock(now, hospital?.timezone ?? "America/Sao_Paulo")}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
