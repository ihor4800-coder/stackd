import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050711",
        deep: "#0B1020",
        surface: "#11172A",
        line: "rgba(149,163,195,0.14)",
        blue: "#4285FF",
        cyan: "#68E9FF",
        cobalt: "#2443DA",
        violet: "#8A78FF",
        snow: "#F6F8FF",
        mute: "#95A3C3",
        warn: "#FFB547",
        bad: "#FF6B7A",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(246,248,255,0.05) inset, 0 24px 60px -30px rgba(0,0,0,0.8)",
        lift: "0 12px 40px -12px rgba(66,133,255,0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
