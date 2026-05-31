import type { Config } from "tailwindcss";

const config: Config = {
  // ─── Content Sources ──────────────────────────────────────────────────────
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  // ─── Dark Mode Strategy ───────────────────────────────────────────────────
  // 'class' lets you toggle dark mode by adding/removing the `dark` class
  // on the <html> element — perfect for a CRM with user preferences.
  darkMode: "class",

  theme: {
    extend: {
      // ─── Custom Color Palette ──────────────────────────────────────────
      colors: {
        brand: {
          blue: "var(--color-brand-blue)",
        },
        "brand-blue": "var(--color-brand-blue)",
        "app-bg": "#F9FAFB",
        "sidebar-border": "#E5E7EB",

        /**
         * PRIMARY — Deep Navy (#111928)
         * Used for: main backgrounds, sidebars, top navigation,
         *           card surfaces in dark mode, primary text on light mode.
         * Generates utility classes: bg-primary, text-primary, border-primary,
         *                            ring-primary, etc.
         * Full shade scale so designers can use primary-50 … primary-950.
         */
        primary: {
          DEFAULT: "#111928",
          50:  "#e8eaf0",
          100: "#d0d4e1",
          200: "#a2a9c3",
          300: "#737fa5",
          400: "#455488",
          500: "#2e3d6b",
          600: "#1e2d56",
          700: "#162040",
          800: "#111928", // ← brand anchor
          900: "#0b1020",
          950: "#050810",
        },

        /**
         * ACCENT — Electric Blue (#1A56DB)
         * Used for: CTAs, links, active nav items, badges, focus rings,
         *           progress indicators, interactive highlights.
         */
        accent: {
          DEFAULT: "var(--color-accent)",
          50:  "#eef3fd",
          100: "#dde8fb",
          200: "#bad0f7",
          300: "#88adf1",
          400: "#5585e9",
          500: "#2f64e0",
          600: "#1A56DB", // ← brand anchor
          700: "#1443b3",
          800: "#103490",
          900: "#0c2570",
          950: "#071549",
        },

        /**
         * SUCCESS — Secondary Green (#0E9F6E)
         * Used for: success toasts, positive KPI deltas, "deal won" badges,
         *           online presence indicators, growth metrics.
         */
        success: {
          DEFAULT: "#0E9F6E",
          50:  "#e6faf4",
          100: "#ccf5e8",
          200: "#99ebd1",
          300: "#66e0ba",
          400: "#33d6a3",
          500: "#0E9F6E", // ← brand anchor
          600: "#0b8a5e",
          700: "#08744e",
          800: "#065f3f",
          900: "#04492f",
          950: "#02311f",
        },

        /**
         * NEUTRAL — Slate-tinted grays for surfaces, borders, and text.
         * These complement the deep navy primary.
         */
        neutral: {
          50:  "#f8f9fb",
          100: "#f0f2f6",
          200: "#e1e5ed",
          300: "#c8cfe0",
          400: "#9aa3bb",
          500: "#6b7694",
          600: "#4e5872",
          700: "#363e55",
          800: "#222838",
          900: "#161c28",
          950: "#0d1119",
        },

        /**
         * DANGER — For destructive actions, error states, overdue tasks.
         */
        danger: {
          DEFAULT: "#E02424",
          50:  "#fef2f2",
          100: "#fde8e8",
          200: "#fbd5d5",
          300: "#f8b4b4",
          400: "#f98080",
          500: "#f05252",
          600: "#E02424",
          700: "#c81e1e",
          800: "#9b1c1c",
          900: "#771d1d",
          950: "#450a0a",
        },

        /**
         * WARNING — Pending deals, follow-up reminders, medium-priority flags.
         */
        warning: {
          DEFAULT: "#D97706",
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#D97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
      },

      // ─── Typography ────────────────────────────────────────────────────
      fontFamily: {
        // Display: used for headings, KPI numbers, page titles
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        // Body: used for paragraphs, labels, table content
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        // Mono: used for IDs, code, technical strings
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },

      // ─── Spacing & Sizing ──────────────────────────────────────────────
      spacing: {
        // Sidebar widths
        "sidebar-collapsed": "4.5rem",  // 72px
        "sidebar-expanded":  "16rem",   // 256px
        // Top navbar height — useful for sticky offset calculations
        "navbar-h": "3.75rem",          // 60px
        "sidebar-w": "260px",
        "topbar-h": "64px",
      },

      // ─── Box Shadows ───────────────────────────────────────────────────
      boxShadow: {
        "card-shadow": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        // Subtle card lift — for data cards in dark mode
        "card-dark":  "0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)",
        // Accent glow — for focused inputs, active CTA buttons
        "glow-accent": "0 0 0 3px rgba(26,86,219,0.35)",
        // Success glow — for positive KPI cards
        "glow-success": "0 0 0 3px rgba(14,159,110,0.30)",
        // Popover / dropdown
        "popover": "0 10px 38px -10px rgba(0,0,0,0.35), 0 10px 20px -15px rgba(0,0,0,0.2)",
      },

      // ─── Border Radius ─────────────────────────────────────────────────
      borderRadius: {
        base: "8px",
        "3xl": "12px",
        "2xl": "10px",
        xl: "8px",
        lg: "6px",
        md: "4px",
        sm: "3px",
        "4xl": "1.5rem",
      },

      // ─── Keyframe Animations ───────────────────────────────────────────
      keyframes: {
        "slide-in-left": {
          "0%":   { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)",     opacity: "1" },
        },
        "fade-in-up": {
          "0%":   { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)",   opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.5" },
        },
      },
      animation: {
        "slide-in-left": "slide-in-left 0.25s ease-out",
        "fade-in-up":    "fade-in-up 0.3s ease-out",
        shimmer:         "shimmer 2s infinite",
      },

      // ─── Transitions ───────────────────────────────────────────────────
      transitionTimingFunction: {
        "smooth-out": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },

  plugins: [
    // Uncomment when you install these packages:
    // require("@tailwindcss/forms"),        // nicer default form styles
    // require("@tailwindcss/typography"),   // `prose` classes for rich text
    // require("@tailwindcss/line-clamp"),   // line clamping utilities
  ],
};

export default config;
