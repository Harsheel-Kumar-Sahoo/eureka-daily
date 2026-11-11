// One place that decides where a researched day comes from and where it is saved.
//   Read order : this server's memory -> fast cache (Upstash / temp file) -> Google Sheet
//   Write order: memory + fast cache + Google Sheet (the permanent archive)
// A Google Sheets problem is logged and skipped; it never breaks the site.
import { getCached, setCached } from "./cache";
import { sheetEnabled, getFromSheet, saveToSheet } from "./sheetStore";

// Bump this when you change the prompt or output shape: old saved rows are then ignored and regenerated.
export const VERSION = "v2";
const key = (date) => `eureka:${VERSION}:${date}`;

const memory = new Map();
const MEMORY_MAX = 60;
function remember(date, data) {
  if (memory.size >= MEMORY_MAX) memory.delete(memory.keys().next().value);
  memory.set(date, data);
}

export async function getDay(date) {
  if (memory.has(date)) return memory.get(date);

  let hit = await getCached(key(date));

  if (!hit && sheetEnabled()) {
    try {
      hit = await getFromSheet(date, VERSION);
      if (hit) await setCached(key(date), hit); // warm the fast cache for the next visitor
    } catch (e) {
      console.error("[sheet read failed]", e.message);
    }
  }

  if (hit) remember(date, hit);
  return hit || null;
}

export async function saveDay(date, data) {
  remember(date, data);
  await setCached(key(date), data);
  if (sheetEnabled()) {
    try {
      await saveToSheet(date, VERSION, data);
    } catch (e) {
      console.error("[sheet write failed]", e.message);
    }
  }
}