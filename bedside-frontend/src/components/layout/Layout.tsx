import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function Layout() {
  return (
    <div className="page-shell">
      <Sidebar />
      <TopBar />
      <main className="px-4 pb-24 pt-24 md:px-6 lg:pl-[272px] lg:pr-8 lg:pt-28">
        <div className="mx-auto max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
