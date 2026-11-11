import { NextResponse } from "next/server";
import { generateDay } from "../../../lib/ai";
import { getCached, setCached } from "../../../lib/cache";

export const maxDuration = 60;
const inflight = new Map(); // de-duplicates simultaneous requests for the same date

export async function GET(req) {
  const date = new URL(req.url).searchParams.get("date") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date)))
    return NextResponse.json({ error: "Use ?date=YYYY-MM-DD" }, { status: 400 });

  // Only allow dates near "now" so strangers can't burn your quota
  const diff = (Date.parse(date) - Date.now()) / 864e5;
  if (diff < -2 || diff > 10) return NextResponse.json({ error: "Date out of range" }, { status: 400 });

  const key = `eureka:${date}`;
  const hit = await getCached(key);
  if (hit) return NextResponse.json(hit);

  try {
    if (!inflight.has(key)) inflight.set(key, generateDay(date).finally(() => inflight.delete(key)));
    const data = await inflight.get(key);
    await setCached(key, data);
    return NextResponse.json(data);
  } catch (e) {
    // The real reason shows in your terminal and in the response, so you can see what went wrong.
    console.error("[/api/day]", e.message);
    return NextResponse.json({ error: "Research failed", detail: e.message }, { status: 502 });
  }
} 