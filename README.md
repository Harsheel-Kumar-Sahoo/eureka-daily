# Eureka Daily

What is special about each day in science: 3-5 events per date, each a ~100-word summary.
Next.js (App Router) + Tailwind. AI research via Google Gemini's **free** API.
Every generated day is saved to a **Google Sheet**, so each date is researched only once.

## Setup
1. `npm install`
2. Get a free key at https://aistudio.google.com/apikey
3. `cp .env.example .env.local` and set `GEMINI_API_KEY`
4. (Recommended) Set up the Google Sheet archive, see below
5. `npm run dev` then open http://localhost:3000

## Google Sheet archive
1. Create a Google Sheet. Rename the first tab to `Days`.
2. Put these headers in row 1: `date`, `version`, `generated_at`, `data`.
3. In Google Cloud Console: create a project, enable the **Google Sheets API**, then create a **service account** and download a **JSON key**.
4. Share the sheet with the service account's `client_email` as **Editor**.
5. Put `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY` in `.env.local` (and in Vercel).
6. Row 2 is 2026-01-01 and each day gets its own fixed row. The sheet starts with 1,000 rows (enough until Sept 2028); click "Add 1000 more rows at the bottom" when needed.

If the sheet variables are missing, the app still works and just skips the archive.

## Environment variables
| Name | Purpose |
|---|---|
| `GEMINI_API_KEY` | Required. Stays server-side, never sent to the browser. |
| `GEMINI_MODEL` | Optional. Defaults to `gemini-2.5-flash`. Use any model your AI Studio free tier lists. |
| `GOOGLE_SHEET_ID` | Sheet that stores every generated day. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The service account's `client_email`. |
| `GOOGLE_PRIVATE_KEY` | The service account's `private_key` (keep the `\n` characters). |
| `GOOGLE_SHEET_TAB` | Optional. Tab name, defaults to `Days`. |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Optional. Faster shared cache in front of the sheet. |
| `CRON_SECRET` | Optional. Protects `/api/cron`. |

## Deploy to Vercel
Push to GitHub, import the repo in Vercel, add the env vars, deploy.
`vercel.json` schedules `/api/cron` daily (01:00 UTC) to pre-generate upcoming days.

## How it works
- `app/api/day` asks `lib/dayStore.js` for the date. It checks server memory, then the fast cache, then the Google Sheet. Only if all three miss does it research the date, validate JSON, and enforce 95-105 words per summary, then it saves the result everywhere.
- `lib/sheetStore.js` talks to Google Sheets (one fixed row per date, no extra packages).
- `lib/ai.js` is the only provider-specific file. To switch to another AI, edit `callModel()`.
- Dates already in the sheet can be opened at any time. New research is only allowed for dates from 2 days ago to 10 days ahead.
- To regenerate everything (e.g. after changing the prompt), bump `VERSION` in `lib/dayStore.js`.
- The browser computes "today" in the visitor's timezone and asks for specific `YYYY-MM-DD` dates.

## Free-tier notes
Google changes free limits often (some models cap at ~20 requests/day, and Google Search grounding may need billing on some models). If search is unavailable, the app falls back to the model's own knowledge, and the prompt tells it to omit anything uncertain. Check your limits in AI Studio. The sheet means each date is generated once, ever.