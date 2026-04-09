import { Activity, AlertTriangle, LayoutDashboard, UserPlus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { useData } from "@/lib/data";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/activity", label: "Activity Feed", icon: Activity },
  { to: "/escalations", label: "Escalations", icon: AlertTriangle },
  { to: "/admin", label: "Add Patient", icon: UserPlus },
];

export function Sidebar() {
  const { hospital, escalations } = useData();
  const pendingCount = escalations.filter((entry) => entry.status === "pending").length;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-white/15 bg-[rgba(255,255,255,0.45)] px-6 py-7 backdrop-blur-2xl lg:flex dark:bg-[rgba(10,16,30,0.65)]">
        <div className="mb-10">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(var(--primary-strong),1),rgba(var(--primary),1))] text-white shadow-glow">
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-white/80" />
              <span className="text-lg font-semibold">B</span>
            </div>
            <div>
              <h1 className="font-heading text-[2rem] font-semibold leading-none tracking-[-0.05em] text-ink">Bedside</h1>
              <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-primary/75">Active Pulse</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center justify-between rounded-[1.2rem] px-4 py-3 text-sm font-medium text-muted transition duration-150 hover:bg-panel/80 hover:text-ink",
                    isActive && "bg-panel/90 text-primary shadow-soft",
                  )
                }
                to={item.to}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.to === "/escalations" && pendingCount > 0 ? <Badge variant="danger">{pendingCount}</Badge> : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="rounded-[1.5rem] border border-line/50 bg-panel/75 p-4">
          <p className="section-kicker">Logged In</p>
          <p className="mt-3 text-sm font-medium text-ink">{hospital?.name ?? "Hospital Isaac Newton"}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">Bedside v0.1</p>
        </div>
      </aside>

      <nav className="fixed bottom-3 left-1/2 z-50 flex w-[min(28rem,calc(100vw-1.5rem))] -translate-x-1/2 items-center justify-between rounded-[1.6rem] border border-line/50 bg-panel/92 px-3 py-2 shadow-ambient backdrop-blur lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-1 flex-col items-center gap-1 rounded-[1rem] px-2 py-2 text-[0.68rem] font-medium text-muted transition",
                  isActive && "bg-primary-soft text-primary",
                )
              }
              to={item.to}
            >
              <Icon className="h-4 w-4" />
              {item.label.split(" ")[0]}
              {item.to === "/escalations" && pendingCount > 0 ? (
                <span className="absolute right-2 top-1.5 h-2.5 w-2.5 rounded-full bg-danger" />
              ) : null}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
