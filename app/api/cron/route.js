import { NextResponse } from "next/server";
import { generateDay } from "../../../lib/ai";
import { getCached, setCached } from "../../../lib/cache";

export const maxDuration = 300;

/** Daily Vercel Cron: pre-generate the next days (UTC today + 8) so pages load instantly.
 *  Only dates missing from the cache are researched, which keeps free-tier usage low. */
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const done = [], failed = [];
  for (let i = 0; i <= 8; i++) {
    const date = new Date(Date.now() + i * 864e5).toISOString().slice(0, 10);
    if (await getCached(`eureka:v2:${date}`)) continue;
    try { await setCached(`eureka:v2:${date}`, await generateDay(date)); done.push(date); }
    catch (e) { console.error(date, e); failed.push(date); }
  }
  return NextResponse.json({ done, failed });
}