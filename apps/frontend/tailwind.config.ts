import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["var(--font-manrope)"],
        display: ["var(--font-fraunces)"]
      },
      boxShadow: {
        soft: "0 24px 70px rgba(63, 94, 251, 0.12)"
      },
      backgroundImage: {
        "paper-grid":
          "linear-gradient(rgba(92, 145, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 156, 0.08) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
