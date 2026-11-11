import { NextResponse } from "next/server";
import { generateDay } from "../../../lib/ai";
import { getDay, saveDay } from "../../../lib/dayStore";

export const maxDuration = 60;
const inflight = new Map(); // de-duplicates simultaneous requests for the same date

export async function GET(req) {
  const date = new URL(req.url).searchParams.get("date") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date)))
    return NextResponse.json({ error: "Use ?date=YYYY-MM-DD" }, { status: 400 });

  const diff = (Date.parse(date) - Date.now()) / 864e5;
  if (diff > 10) return NextResponse.json({ error: "Date out of range" }, { status: 400 });

  // 1) Already saved (memory, fast cache or Google Sheet)? Show it straight away.
  const hit = await getDay(date);
  if (hit) return NextResponse.json(hit);

  // 2) Not saved. Only generate dates near "now" so strangers can't burn your AI quota.
  //    Older dates are served from the archive only.
  if (diff < -2) return NextResponse.json({ error: "No saved data for this date" }, { status: 404 });

  try {
    if (!inflight.has(date)) inflight.set(date, generateDay(date).finally(() => inflight.delete(date)));
    const data = await inflight.get(date);
    await saveDay(date, data); // saves to memory, fast cache and the Google Sheet
    return NextResponse.json(data);
  } catch (e) {
    // The real reason shows in your terminal and in the response, so you can see what went wrong.
    console.error("[/api/day]", e.message);
    return NextResponse.json({ error: "Research failed", detail: e.message }, { status: 502 });
  }
}