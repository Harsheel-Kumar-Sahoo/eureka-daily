# Eureka Daily

What is special about each day in science: 3-5 events per date, each a ~100-word summary.
Next.js (App Router) + Tailwind. AI research via Google Gemini's **free** API.

## Setup
1. `npm install`
2. Get a free key at https://aistudio.google.com/apikey
3. `cp .env.example .env.local` and set `GEMINI_API_KEY`
4. `npm run dev` then open http://localhost:3000

## Environment variables
| Name | Purpose |
|---|---|
| `GEMINI_API_KEY` | Required. Stays server-side, never sent to the browser. |
| `GEMINI_MODEL` | Optional. Defaults to `gemini-2.5-flash`. Use any model your AI Studio free tier lists. |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Optional. Persistent shared cache (add Upstash Redis from the Vercel Marketplace). Without it, a temp file is used. |
| `CRON_SECRET` | Optional. Protects `/api/cron`. |

## Deploy to Vercel
Push to GitHub, import the repo in Vercel, add the env vars, deploy.
`vercel.json` schedules `/api/cron` daily (01:00 UTC) to pre-generate upcoming days.

## How it works
- `app/api/day` checks the cache, else researches the date, validates JSON, and enforces 95-105 words per summary (asking the model to rewrite any that miss).
- `lib/ai.js` is the only provider-specific file. To switch to another AI, edit `callModel()`.
- The browser computes "today" in the visitor's timezone and asks for specific `YYYY-MM-DD` dates.

## Free-tier notes
Google changes free limits often (some models cap at ~20 requests/day, and Google Search grounding may need billing on some models). If search is unavailable, the app falls back to the model's own knowledge, and the prompt tells it to omit anything uncertain. Check your limits in AI Studio. Caching means each date is generated once.
