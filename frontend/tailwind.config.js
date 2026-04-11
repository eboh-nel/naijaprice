/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fff8ed",
          100: "#ffefd3",
          200: "#ffd9a5",
          300: "#ffbc6d",
          400: "#ff9332",
          500: "#ff720a",
          600: "#f05500",
          700: "#c73e01",
          800: "#9e3208",
          900: "#7f2c0a",
        },
        surface: "#0f0f0f",
        panel:   "#1a1a1a",
        border:  "#2a2a2a",
        muted:   "#6b6b6b",
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'DM Mono'", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
        lg: "12px",
        xl: "18px",
      },
    },
  },
  plugins: [],
};
