import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      aria-label="Toggle theme"
      className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-line/50 bg-panel/70 text-primary transition hover:-translate-y-0.5 hover:bg-panel"
      onClick={toggleTheme}
      type="button"
    >
      <span className="relative h-5 w-5 overflow-hidden">
        <SunMedium
          className={`absolute inset-0 h-5 w-5 transition duration-200 ${theme === "light" ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        />
        <MoonStar
          className={`absolute inset-0 h-5 w-5 transition duration-200 ${theme === "dark" ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"}`}
        />
      </span>
    </button>
  );
}
