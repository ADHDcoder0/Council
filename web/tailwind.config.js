/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        skeptic: {
          light: "#fca5a5",
          DEFAULT: "#ef4444",
          dark: "#991b1b",
        },
        builder: {
          light: "#86efac",
          DEFAULT: "#22c55e",
          dark: "#166534",
        },
        visionary: {
          light: "#67e8f9",
          DEFAULT: "#06b6d4",
          dark: "#155e75",
        },
        chair: {
          light: "#fde047",
          DEFAULT: "#eab308",
          dark: "#854d0e",
        },
      },
    },
  },
  plugins: [],
};
