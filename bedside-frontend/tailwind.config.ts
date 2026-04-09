import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        page: "rgb(var(--page) / <alpha-value>)",
        paper: "rgb(var(--paper) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        mist: "rgb(var(--mist) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        "primary-strong": "rgb(var(--primary-strong) / <alpha-value>)",
        "primary-soft": "rgb(var(--primary-soft) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        rose: "rgb(var(--rose) / <alpha-value>)",
        amber: "rgb(var(--amber) / <alpha-value>)",
      },
      fontFamily: {
        heading: ["Newsreader", "serif"],
        sans: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        ambient: "0 28px 80px rgba(15, 23, 42, 0.08)",
        soft: "0 12px 30px rgba(15, 23, 42, 0.08)",
        glow: "0 0 0 1px rgba(13, 127, 163, 0.12), 0 18px 40px rgba(13, 127, 163, 0.12)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -6px, 0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translate3d(24px, 0, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "slide-in-down": {
          "0%": { opacity: "0", transform: "translate3d(0, -18px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(13, 127, 163, 0.32)" },
          "70%": { boxShadow: "0 0 0 12px rgba(13, 127, 163, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(13, 127, 163, 0)" },
        },
      },
      animation: {
        drift: "drift 6s ease-in-out infinite",
        "slide-in-right": "slide-in-right 240ms ease both",
        "slide-in-down": "slide-in-down 240ms ease both",
        pulseRing: "pulseRing 2.2s ease-out infinite",
      },
      borderRadius: {
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
