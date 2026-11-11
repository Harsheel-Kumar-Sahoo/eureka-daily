// AI layer. Swap providers by editing callModel() only; everything else is provider-agnostic.
// Default: Google Gemini (free key from AI Studio) with Google Search grounding.
const PREFERRED = process.env.GEMINI_MODEL || "gemini-2.5-flash";
// If the preferred model fails, these are tried in order.
const MODELS = [...new Set([PREFERRED, "gemini-2.5-flash", "gemini-2.5-flash-lite"])];

export const CATEGORIES = ["Physics", "Biology", "Chemistry", "Space", "Medicine", "Earth", "Tech"];

const wc = (s) => (String(s).trim().match(/\S+/g) || []).length;
const okWords = (s) => wc(s) >= 95 && wc(s) <= 105;
const nearWords = (s) => wc(s) >= 90 && wc(s) <= 110; // last-resort tolerance

/**
 * One model call. For each model it tries Google Search grounding first, then
 * no search (free tiers may not include grounding). Errors include the real
 * reason so the API route can report it.
 */
async function callModel(prompt, { search = true } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set (check .env.local and restart the dev server)");

  let lastErr = new Error("No model responded");
  for (const model of MODELS) {
    for (const useSearch of search ? [true, false] : [false]) {
      const body = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 },
      };
      if (useSearch) body.tools = [{ google_search: {} }];

      let res;
      try {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify(body),
          }
        );
      } catch (e) {
        lastErr = new Error(`Network error calling Gemini: ${e.message}`);
        continue;
      }

      if (res.ok) {
        const json = await res.json();
        const text = (json.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
        if (text.trim()) return text;
        lastErr = new Error(`${model}: empty reply`);
        continue;
      }

      const detail = (await res.text()).slice(0, 220);
      lastErr = new Error(`Gemini ${res.status} on ${model}${useSearch ? " (+search)" : ""}: ${detail}`);
      // A bad key will never work on any model, so stop immediately.
      if (res.status === 401 || (res.status === 400 && /api key/i.test(detail))) throw lastErr;
    }
  }
  throw lastErr;
}

/** Pull the first JSON object out of a reply, tolerating code fences and extra text. */
function parseJSON(text) {
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a < 0 || b < 0) throw new Error("Model reply had no JSON");
  try {
    return JSON.parse(text.slice(a, b + 1));
  } catch {
    throw new Error("Model reply was not valid JSON");
  }
}

const RULES = `Rules:
- Only science-related events (discoveries, births/deaths of scientists, launches, experiments, official observances). No politics or war unless directly science-related.
- Never invent facts. If unsure about an event, omit it. Prefer reliable sources: NASA, Nature, Britannica, UN/UNESCO, universities, museums.
- Each summary is EXACTLY 100 words (acceptable 95-105), neutral, written for curious general readers, and covers: what happened, who was involved, why it matters, and why the day is remembered or celebrated (if applicable).
- Category must be one of: ${CATEGORIES.join(", ")}.
- "year" is a year like "1895", or "Observance" for official days.`;

function buildPrompt(date, label) {
  return `Research the date ${label} (${date}) and find 3 to 5 notable science events tied to that calendar day.
${RULES}
Reply with ONLY strict JSON, no markdown:
{"date":"${date}","intro":"one short sentence on why this day is special in science","events":[{"year":"...","title":"short title","category":"...","summary":"..."}]}`;
}

/** Ask the model to rewrite summaries whose word count is off. */
async function fixSummaries(events) {
  const bad = events.map((e, i) => ({ i, e })).filter(({ e }) => !okWords(e.summary));
  if (!bad.length) return events;

  const payload = bad.map(({ i, e }) => ({ i, title: e.title, summary: e.summary, words: wc(e.summary) }));
  const text = await callModel(
    `Rewrite each summary to EXACTLY 100 words (95-105 allowed). Keep every fact; add no new facts. ` +
      `Reply ONLY with JSON: {"fixed":[{"i":0,"summary":"..."}]}\n${JSON.stringify(payload)}`,
    { search: false }
  );
  const { fixed = [] } = parseJSON(text);
  const out = events.map((e) => ({ ...e }));
  for (const f of fixed) {
    if (out[f.i] && typeof f.summary === "string" && wc(f.summary) > 0) out[f.i].summary = f.summary.trim();
  }
  return out;
}

export async function generateDay(date) {
  const label = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", timeZone: "UTC",
  });
  const data = parseJSON(await callModel(buildPrompt(date, label)));

  // 1) Validate shape
  let events = (data.events || []).filter(
    (e) => e && e.year && e.title && typeof e.summary === "string" && CATEGORIES.includes(e.category)
  );

  // 2) Validate word counts, with up to 3 rewrite passes (models are bad at counting)
  for (let pass = 0; pass < 3 && events.some((e) => !okWords(e.summary)); pass++) {
    try { events = await fixSummaries(events); } catch (e) { console.error("rewrite failed", e.message); break; }
  }

  let good = events.filter((e) => okWords(e.summary));
  // Last resort: if too few are exact, accept 90-110 words rather than failing the whole day.
  if (good.length < 3) good = events.filter((e) => nearWords(e.summary));
  good = good.slice(0, 5);

  if (good.length < 3) throw new Error(`Only ${good.length} usable events after validation`);
  return { date, intro: String(data.intro || "").trim(), events: good };
}