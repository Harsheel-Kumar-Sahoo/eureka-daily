import { NextResponse } from "next/server";
import { generateDay } from "../../../lib/ai";
import { getDay, saveDay } from "../../../lib/dayStore";

export const maxDuration = 300;

/** Daily Vercel Cron: pre-generate the next days (UTC today + 8) so pages load instantly.
 *  Only dates missing from the cache AND the Google Sheet are researched, which keeps free-tier usage low. */
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const done = [], skipped = [], failed = [];
  for (let i = 0; i <= 8; i++) {
    const date = new Date(Date.now() + i * 864e5).toISOString().slice(0, 10);
    if (await getDay(date)) { skipped.push(date); continue; }
    try { await saveDay(date, await generateDay(date)); done.push(date); }
    catch (e) { console.error(date, e); failed.push(date); }
  }
  return NextResponse.json({ done, skipped, failed });
}