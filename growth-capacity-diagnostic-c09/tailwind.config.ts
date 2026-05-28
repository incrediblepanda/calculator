import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Kwikly Navy — anchored to #00355F at navy-800
        navy: {
          50:  "hsl(207, 60%, 97%)",
          100: "hsl(207, 65%, 92%)",
          200: "hsl(207, 70%, 82%)",
          300: "hsl(207, 75%, 68%)",
          400: "hsl(207, 80%, 52%)",
          500: "hsl(207, 90%, 38%)",
          600: "hsl(207, 100%, 28%)",
          700: "hsl(207, 100%, 22%)",
          800: "hsl(207, 100%, 19%)",  // #00355F
          900: "hsl(207, 100%, 12%)",
          950: "hsl(207, 100%, 8%)",
        },
        // Kwikly Coral — anchored to #e84a67 at coral-500
        coral: {
          50:  "hsl(349, 100%, 97%)",
          100: "hsl(349, 100%, 93%)",
          200: "hsl(349, 90%, 85%)",
          300: "hsl(349, 85%, 74%)",
          400: "hsl(349, 77%, 67%)",
          500: "hsl(349, 77%, 60%)",  // #e84a67
          600: "hsl(349, 71%, 52%)",
          700: "hsl(349, 68%, 43%)",
          800: "hsl(349, 63%, 34%)",
          900: "hsl(349, 58%, 24%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.07)",
        "card-lg": "0 4px 8px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.10)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
