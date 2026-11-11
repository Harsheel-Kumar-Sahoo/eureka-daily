/** Colors come from CSS variables (see globals.css) so light/dark share one set of classes. */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.js", "./components/**/*.js"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", ink: "var(--ink)", muted: "var(--muted)",
        line: "var(--line)", accent: "var(--accent)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
};
