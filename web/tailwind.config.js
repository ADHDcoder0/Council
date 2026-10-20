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
        canvas: "var(--bg-canvas)",
        "surface-1": "var(--bg-surface-1)",
        "surface-2": "var(--bg-surface-2)",
        "surface-3": "var(--bg-surface-3)",
        "surface-hover": "var(--bg-surface-hover)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        "accent-success": "var(--accent-success)",
        "accent-success-bg": "var(--accent-success-bg)",
        "accent-warning": "var(--accent-warning)",
        "accent-warning-bg": "var(--accent-warning-bg)",
        "accent-danger": "var(--accent-danger)",
        "accent-danger-bg": "var(--accent-danger-bg)",
        "btn-primary": {
          bg: "var(--btn-primary-bg)",
          text: "var(--btn-primary-text)",
          hover: "var(--btn-primary-hover)",
        },
        "btn-secondary": {
          bg: "var(--btn-secondary-bg)",
          hover: "var(--btn-secondary-hover)",
        },
        "border-subtle": "var(--border-subtle)",
        "border-strong": "var(--border-strong)",
        member: {
          skeptic: "var(--member-skeptic)",
          builder: "var(--member-builder)",
          visionary: "var(--member-visionary)",
          chair: "var(--member-chair)",
          user: "var(--member-user)",
        },
      },
      borderRadius: {
        pill: "var(--radius-pill)",
        btn: "var(--radius-btn)",
        panel: "var(--radius-panel)",
        composer: "var(--radius-composer)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
