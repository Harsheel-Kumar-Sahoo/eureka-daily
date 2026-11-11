/** Colors come from CSS variables (see globals.css) so light/dark share one set of classes. */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.js", "./components/**/*.js"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", card: "var(--card)", ink: "var(--ink)", body: "var(--body)",
        muted: "var(--muted)", line: "var(--line)", accent: "var(--accent)", soft: "var(--accent-soft)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
};