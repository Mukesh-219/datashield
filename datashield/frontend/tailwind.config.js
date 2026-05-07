/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          950: "#05070d",
          900: "#0b1020",
          800: "#111a33",
          700: "#1b2a52",
          500: "#00e5ff",
          400: "#22d3ee",
          300: "#67e8f9"
        }
      },
      boxShadow: {
        glow: "0 0 30px rgba(34, 211, 238, 0.2)"
      }
    }
  },
  plugins: []
};
