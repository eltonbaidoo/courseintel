import type { Config } from "tailwindcss";

/** Exclusive palettes — all UI colors derive from these scales. */
const palettes = {
  "shadow-grey": {
    50: "#f3f2f1",
    100: "#e7e5e4",
    200: "#cfcac9",
    300: "#b7b0ae",
    400: "#9f9693",
    500: "#877c78",
    600: "#6c6360",
    700: "#514a48",
    800: "#363130",
    900: "#1b1918",
    950: "#131111",
  },
  espresso: {
    50: "#f7efed",
    100: "#efe0dc",
    200: "#dfc0b9",
    300: "#d0a195",
    400: "#c08272",
    500: "#b0624f",
    600: "#8d4f3f",
    700: "#6a3b2f",
    800: "#462720",
    900: "#231410",
    950: "#190e0b",
  },
  "burnt-peach": {
    50: "#f8f0ec",
    100: "#f2e0d9",
    200: "#e5c1b3",
    300: "#d8a28d",
    400: "#cb8367",
    500: "#be6441",
    600: "#985034",
    700: "#723c27",
    800: "#4c281a",
    900: "#26140d",
    950: "#1b0e09",
  },
  "powder-blush": {
    50: "#ffe8e5",
    100: "#ffd1cc",
    200: "#ffa399",
    300: "#ff7566",
    400: "#ff4733",
    500: "#ff1a00",
    600: "#cc1400",
    700: "#990f00",
    800: "#660a00",
    900: "#330500",
    950: "#240400",
  },
  "almond-cream": {
    50: "#f9f2ec",
    100: "#f3e6d8",
    200: "#e6cdb2",
    300: "#dab48b",
    400: "#cd9b65",
    500: "#c1823e",
    600: "#9a6832",
    700: "#744e25",
    800: "#4d3419",
    900: "#271a0c",
    950: "#1b1209",
  },
} as const;

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ...palettes,
        /** Semantic aliases (same hex as scales above) */
        primary: palettes["burnt-peach"],
        secondary: palettes.espresso,
        surface: {
          dark: palettes["shadow-grey"],
          light: palettes["almond-cream"],
        },
        accent: {
          blush: palettes["powder-blush"],
          peach: palettes["burnt-peach"],
          cream: palettes["almond-cream"],
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-roboto)", "sans-serif"],
        /** Playfair Display — editorial headings on marketing */
        serifDisplay: ["var(--font-playfair)", "Georgia", "serif"],
        condensed: ["var(--font-roboto-condensed)", "sans-serif"],
        slab: ["var(--font-roboto-slab)", "serif"],
        mono: ["var(--font-inter)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        "glow-primary":
          "0 0 24px -4px rgb(190 100 65 / 0.35)",
        "glow-powder":
          "0 0 24px -4px rgb(190 100 65 / 0.28)",
        "glow-sage":
          "0 0 24px -4px rgb(193 130 62 / 0.28)",
        "glow-yale":
          "0 0 24px -4px rgb(141 79 63 / 0.3)",
        card: "0 1px 3px 0 rgb(27 25 24 / 0.06), 0 4px 12px -2px rgb(27 25 24 / 0.06)",
        "card-hover":
          "0 4px 6px -1px rgb(27 25 24 / 0.08), 0 12px 24px -4px rgb(27 25 24 / 0.08)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-up-lg": "fadeUpLg 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
        "fade-in-slow": "fadeIn 0.8s ease forwards",
        "slide-in": "slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 3s infinite",
        shimmer: "shimmer 2s linear infinite",
        gradient: "gradientShift 8s ease infinite",
        "spin-slow": "spin 12s linear infinite",
        "agent-run": "agentRun 1.4s ease-in-out infinite",
        "count-up": "countUp 0.4s ease-out forwards",
        typewriter: "typewriter 2s steps(30) forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeUpLg: {
          "0%": { opacity: "0", transform: "translateY(32px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(40px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.15", transform: "scale(1)" },
          "50%": { opacity: "0.3", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        agentRun: {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.85)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        typewriter: {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
