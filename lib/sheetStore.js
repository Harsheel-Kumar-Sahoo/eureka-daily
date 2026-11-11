// Google Sheets storage for researched days (no extra npm packages needed).
//
// Layout: ONE ROW PER DATE, at a fixed row number worked out from the date itself.
//   Row 1 = headers, row 2 = 2026-01-01, row 3 = 2026-01-02, ...
// That means a lookup or a save touches exactly one row, and the same date can never
// end up in two rows, even if two visitors trigger it at the same moment.
//
// Columns: A date | B version | C generated_at | D data (JSON)
import crypto from "crypto";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/^"|"$/g, "").replace(/\\n/g, "\n");
const TAB = process.env.GOOGLE_SHEET_TAB || "Days";
const EPOCH = Date.UTC(2026, 0, 1); // the date that lives in row 2
const MAX_CELL = 49000; // Google Sheets allows 50,000 characters per cell

export const sheetEnabled = () => Boolean(SHEET_ID && EMAIL && KEY);

/** Row number for a YYYY-MM-DD date, or null if it is before the sheet's first date. */
export function rowFor(date) {
  const n = Math.round((Date.parse(`${date}T00:00:00Z`) - EPOCH) / 864e5);
  return Number.isFinite(n) && n >= 0 ? n + 2 : null;
}

// ---- Auth: sign a JWT with the service account key and swap it for an access token ----
let token = null;
let tokenExp = 0;
const b64u = (s) => Buffer.from(s).toString("base64url");

async function getToken() {
  if (token && Date.now() < tokenExp - 60_000) return token;

  const now = Math.floor(Date.now() / 1000);
  const header = b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64u(
    JSON.stringify({
      iss: EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signature = crypto.createSign("RSA-SHA256").update(`${header}.${claim}`).sign(KEY, "base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${signature}`,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Google auth ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  token = json.access_token;
  tokenExp = Date.now() + (json.expires_in || 3600) * 1000;
  return token;
}

async function api(path, init = {}) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Sheets ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

/** Returns the saved day, or null if this date is not in the sheet (or is an older version). */
export async function getFromSheet(date, version) {
  const row = rowFor(date);
  if (!row) return null;
  const range = encodeURIComponent(`${TAB}!A${row}:D${row}`);
  const { values } = await api(`/values/${range}`);
  const [savedDate, savedVersion, , json] = values?.[0] || [];
  if (savedDate !== date || savedVersion !== version || !json) return null;
  return JSON.parse(json);
}

/** Saves (or overwrites) the row for this date. */
export async function saveToSheet(date, version, data) {
  const row = rowFor(date);
  if (!row) return;
  const json = JSON.stringify(data);
  if (json.length > MAX_CELL) throw new Error(`Day ${date} is too large for one cell (${json.length} chars)`);
  const range = encodeURIComponent(`${TAB}!A${row}:D${row}`);
  await api(`/values/${range}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: [[date, version, new Date().toISOString(), json]] }),
  });
}