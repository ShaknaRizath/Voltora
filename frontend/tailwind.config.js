/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        // Single accent colour. Swap these values to re-theme the whole app.
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.05)",
        lift: "0 18px 40px -12px rgba(16,24,40,.18)",
        pop: "0 30px 80px -20px rgba(16,24,40,.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        // Mirrored pair: the top row moves down while the bottom row moves up, in sync.
        "float-down": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(10px)" },
        },
        "float-up": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up .6s ease-out both",
        float: "float 6s ease-in-out infinite",
        "float-down": "float-down 7s cubic-bezier(0.37, 0, 0.63, 1) infinite",
        "float-up": "float-up 7s cubic-bezier(0.37, 0, 0.63, 1) infinite",
      },
    },
  },
  plugins: [],
};
