"use client";
import { useEffect, useState, useCallback } from "react";

const pad = (n) => String(n).padStart(2, "0");
/** YYYY-MM-DD in the visitor's LOCAL timezone (not UTC). */
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

/** The 7-day strip, computed on the client so "today" follows the visitor's timezone. */
function buildDays() {
  const labels = ["Today", "Tomorrow", "Day after"];
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const sub = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
    return { iso: toISO(d), label: labels[i] || sub };
  });
}

function Skeleton() {
  return (
    <div className="divide-y divide-line border-t border-line" aria-busy="true" aria-label="Researching this date">
      {[0, 1, 2].map((i) => (
        <div key={i} className="py-7 space-y-3">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-5 w-2/3" />
          {[100, 96, 92, 58].map((w) => <div key={w} className="skeleton h-3" style={{ width: `${w}%` }} />)}
        </div>
      ))}
    </div>
  );
}

export default function EurekaApp() {
  const [days, setDays] = useState([]);
  const [active, setActive] = useState(null);
  const [state, setState] = useState({ status: "loading", data: null, detail: "" });
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const d = buildDays();
    setDays(d);
    setActive(d[0].iso);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const load = useCallback(async (iso) => {
    setState({ status: "loading", data: null, detail: "" });
    try {
      const res = await fetch(`/api/day?date=${iso}`);
      const json = await res.json();
      if (!res.ok) { setState({ status: "error", data: null, detail: json.detail || json.error || "" }); return; }
      setState({ status: "ready", data: json, detail: "" });
    } catch (e) {
      setState({ status: "error", data: null, detail: "Could not reach the server." });
    }
  }, []);

  useEffect(() => { if (active) load(active); }, [active, load]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  };

  const heading = active
    ? fromISO(active).toLocaleDateString("en-GB", { day: "numeric", month: "long" })
    : "";

  return (
    <div className="min-h-screen flex flex-col">
      <main className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-16">
        {/* Header: wordmark + theme toggle */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2 text-xl font-medium tracking-tight">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
            </svg>
            Eureka Daily
          </div>
          <button onClick={toggleTheme} aria-label="Toggle dark mode"
            className="font-sans text-xs text-muted hover:text-ink transition-colors">
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </header>

        {/* Date strip: underlined tabs, scrolls sideways on small screens */}
        <nav aria-label="Choose a day" className="-mx-5 px-5 overflow-x-auto border-b border-line">
          <ul className="flex gap-6 w-max">
            {days.map((d) => {
              const on = d.iso === active;
              return (
                <li key={d.iso}>
                  <button onClick={() => setActive(d.iso)} aria-current={on ? "date" : undefined}
                    className={`font-sans text-[13px] py-3 -mb-px border-b-2 whitespace-nowrap transition-colors ${
                      on ? "border-accent text-ink font-medium" : "border-transparent text-muted hover:text-ink"}`}>
                    {d.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Selected date */}
        <section className="pt-12 pb-9">
          <h1 className="text-5xl sm:text-6xl font-normal tracking-tight">{heading || "\u00A0"}</h1>
          <p className="mt-3 text-lg text-muted leading-snug min-h-[1.75rem]">
            {state.status === "ready" ? state.data.intro : ""}
          </p>
        </section>

        {state.status === "loading" && <Skeleton />}

        {state.status === "error" && (
          <div className="border-t border-line pt-8">
            <p className="text-lg">We couldn’t gather this day’s science just yet.</p>
            <p className="text-muted mt-1">The research step hit a snag. Try again in a moment.</p>
            {state.detail && (
              <p className="font-sans text-xs text-muted mt-3 break-words">Details: {state.detail}</p>
            )}
            <button onClick={() => load(active)}
              className="mt-5 font-sans text-sm text-accent hover:underline underline-offset-4">
              Try again
            </button>
          </div>
        )}

        {state.status === "ready" && (
          <div className="divide-y divide-line border-t border-line">
            {state.data.events.map((ev, i) => (
              <article key={i} className="py-7">
                <div className="flex items-center justify-between font-sans text-xs">
                  <span className="text-muted">{ev.year}</span>
                  <span className="text-accent">{ev.category}</span>
                </div>
                <h2 className="mt-2.5 text-2xl leading-snug font-medium">{ev.title}</h2>
                <p className="mt-2.5 text-[1.075rem] leading-[1.7]">{ev.summary}</p>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-line py-6 text-center text-sm text-muted">
        Built with love ❤️ by{" "}
        <a href="https://harsheel.vercel.app" target="_blank" rel="noopener noreferrer"
          className="hover:text-accent hover:underline underline-offset-4">Harsheel</a>
      </footer>
    </div>
  );
}