import type { Config } from "tailwindcss";

const config: Config = {
  // Class-based dark mode so we can toggle it from JS
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand ───────────────────────────────
        primary: {
          DEFAULT: "#059669",
          hover:   "#047857",
          light:   "#10B981",
          soft:    "#D1FAE5",
        },
        accent: {
          DEFAULT: "#10B981",
          glow:    "#6EE7B7",
        },
        // ── Light Mode Semantics ─────────────────
        surface: {
          bg:     "#F8FAFC",
          card:   "#FFFFFF",
          input:  "#F1F5F9",
          border: "#E2E8F0",
        },
        // ── Dark Mode Semantics ──────────────────
        dark: {
          bg:     "#0B0F19",
          card:   "#1E293B",
          input:  "#0F172A",
          border: "#334155",
        },
        // ── Text ────────────────────────────────
        ink: {
          primary:   "#0F172A",
          secondary: "#64748B",
          muted:     "#94A3B8",
        },
        snow: {
          primary:   "#F1F5F9",
          secondary: "#94A3B8",
          muted:     "#64748B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card:       "0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06)",
        "card-dark":"0 1px 3px rgba(0,0,0,.3),  0 4px 24px rgba(0,0,0,.3)",
        green:      "0 4px 20px rgba(5,150,105,.25)",
        "green-lg": "0 8px 32px rgba(5,150,105,.35)",
        glow:       "0 0 0 3px rgba(5,150,105,.18)",
      },
      animation: {
        "slide-up":    "slideUp 0.28s ease-out",
        "fade-in":     "fadeIn 0.4s ease-out",
        "bounce-dots": "bounceDots 1.2s ease-in-out infinite",
        "spin-slow":   "spin 1s linear infinite",
        pulse:         "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        slideUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        bounceDots: {
          "0%,80%,100%": { transform: "translateY(0)", opacity: "0.4" },
          "40%":          { transform: "translateY(-4px)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
