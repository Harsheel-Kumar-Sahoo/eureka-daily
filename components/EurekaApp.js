"use client";
import { useEffect, useState, useCallback } from "react";
import Logo from "./Logo";
import { Icon, CATEGORY_META } from "./Icons";

const pad = (n) => String(n).padStart(2, "0");
/** YYYY-MM-DD in the visitor's LOCAL timezone (not UTC). */
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

/** The 7-day strip, computed on the client so "today" follows the visitor's timezone. */
function buildDays() {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    return {
      iso: toISO(d),
      top: i === 0 ? "Today" : d.toLocaleDateString("en-GB", { weekday: "short" }),
      num: d.getDate(),
      month: d.toLocaleDateString("en-GB", { month: "short" }),
    };
  });
}

/** Small tricolor badge used for the Indian science section. */
function Tricolor() {
  return (
    <span className="relative inline-flex h-5 w-5 flex-col overflow-hidden rounded-full ring-1 ring-black/10 dark:ring-white/20" aria-hidden="true">
      <i className="flex-1 bg-[#FF9933]" />
      <i className="flex-1 bg-white" />
      <i className="flex-1 bg-[#138808]" />
      <i className="absolute left-1/2 top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#000080]" />
    </span>
  );
}

function SectionHeader({ icon, title, subtitle, count }) {
  return (
    <div className="mb-4 mt-12 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft text-accent">{icon}</span>
        <div>
          <h2 className="text-[15px] font-semibold leading-tight tracking-tight">{title}</h2>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      {count > 0 && (
        <span className="rounded-full border border-line px-2.5 py-1 text-xs tabular-nums text-muted">
          {count} {count === 1 ? "event" : "events"}
        </span>
      )}
    </div>
  );
}

function EventCard({ ev, i }) {
  const meta = CATEGORY_META[ev.category] || CATEGORY_META.Physics;
  return (
    <article
      className="fade-up rounded-2xl border border-line bg-card p-5 transition-shadow duration-200 hover:shadow-[0_10px_30px_-14px_rgba(15,17,23,0.25)] sm:p-6"
      style={{ animationDelay: `${i * 60}ms` }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ "--h": meta.hue }}>
          <Icon name={meta.icon} size={14} />
          {ev.category}
        </span>
        <span className="rounded-full border border-line px-2.5 py-1 text-xs tabular-nums text-muted">{ev.year}</span>
      </div>
      <h3 className="mt-4 font-serif text-[1.4rem] font-medium leading-snug tracking-tight">{ev.title}</h3>
      <p className="mt-2.5 text-[15px] leading-[1.75] text-body">{ev.summary}</p>
    </article>
  );
}

function SkeletonCards() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Researching this date">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-line bg-card p-6">
          <div className="flex justify-between"><div className="skeleton h-6 w-24 !rounded-full" /><div className="skeleton h-6 w-14 !rounded-full" /></div>
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

  const date = active ? fromISO(active) : null;
  const heading = date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "long" }) : "";
  const weekday = date ? date.toLocaleDateString("en-GB", { weekday: "long" }) : "";
  const ready = state.status === "ready";
  const world = ready ? state.data.events || [] : [];
  const india = ready ? state.data.india || [] : [];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky header */}
      <header className="glass sticky top-0 z-20 border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-[720px] items-center justify-between px-5">
          <a href="/" className="flex items-center gap-2.5" aria-label="Eureka Daily home">
            <Logo size={30} />
            <span className="text-[17px] font-semibold tracking-tight">Eureka <span className="text-muted font-medium">Daily</span></span>
          </a>
          <button onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-ink hover:bg-soft">
            <Icon name={dark ? "sun" : "moon"} size={17} />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] flex-1 px-5 pb-20">
        {/* Day picker */}
        <nav aria-label="Choose a day" className="-mx-5 overflow-x-auto px-5 pt-6 pb-1">
          <ul className="flex w-max gap-2">
            {days.map((d) => {
              const on = d.iso === active;
              return (
                <li key={d.iso}>
                  <button onClick={() => setActive(d.iso)} aria-current={on ? "date" : undefined}
                    className={`flex w-[62px] flex-col items-center rounded-2xl border py-2.5 transition-all ${
                      on ? "border-transparent bg-accent text-white shadow-md"
                         : "border-line bg-card text-muted hover:text-ink hover:border-accent"}`}>
                    <span className={`text-[11px] font-medium uppercase tracking-wide ${on ? "text-white/80" : ""}`}>{d.top}</span>
                    <span className={`mt-0.5 text-xl font-semibold tabular-nums ${on ? "text-white" : "text-ink"}`}>{d.num}</span>
                    <span className={`text-[11px] ${on ? "text-white/80" : ""}`}>{d.month}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Selected date */}
        <section className="pt-10 pb-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-accent">
            <Icon name="calendar" size={14} /> {weekday || "\u00A0"}
          </p>
          <h1 className="mt-2 font-serif text-5xl font-normal tracking-tight sm:text-6xl">{heading || "\u00A0"}</h1>
          <p className="mt-3 min-h-[1.75rem] text-[17px] leading-snug text-muted">{ready ? state.data.intro : ""}</p>
        </section>

        {state.status === "loading" && (
          <>
            <SectionHeader icon={<Icon name="globe" size={18} />} title="Around the world" subtitle="Researching this date…" />
            <SkeletonCards />
          </>
        )}

        {state.status === "error" && (
          <div className="mt-10 rounded-2xl border border-line bg-card p-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-accent"><Icon name="alert" size={20} /></span>
              <div className="min-w-0">
                <p className="font-medium">We couldn’t gather this day’s science just yet.</p>
                <p className="mt-1 text-sm text-muted">The research step hit a snag. Try again in a moment.</p>
                {state.detail && <p className="mt-3 break-words text-xs text-muted">Details: {state.detail}</p>}
                <button onClick={() => load(active)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90">
                  <Icon name="refresh" size={15} /> Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {ready && (
          <>
            <SectionHeader icon={<Icon name="globe" size={18} />} title="Around the world"
              subtitle="Science on this day, globally" count={world.length} />
            <div className="space-y-3">{world.map((ev, i) => <EventCard key={`w${i}`} ev={ev} i={i} />)}</div>

            <SectionHeader icon={<Tricolor />} title="Indian science"
              subtitle="Discoveries, scientists and missions from India" count={india.length} />
            {india.length > 0 ? (
              <div className="space-y-3">{india.map((ev, i) => <EventCard key={`i${i}`} ev={ev} i={i} />)}</div>
            ) : (
              <div className="rounded-2xl border border-dashed border-line px-6 py-8 text-center text-sm text-muted">
                No verified Indian science events found for this day.
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-line py-6 text-center text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          Built with <Icon name="heart" size={14} className="fill-current text-rose-500" /> by{" "}
          <a href="https://harsheel.vercel.app" target="_blank" rel="noopener noreferrer"
            className="underline-offset-4 hover:text-accent hover:underline">Harsheel</a>
        </span>
      </footer>
    </div>
  );
}