// Cache for researched days. Uses Upstash Redis (REST) if configured, else a temp file.
// On Vercel the temp file is per-instance and ephemeral, so use Upstash for real persistence.
import fs from "fs/promises";
import os from "os";
import path from "path";

const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const TTL = 60 * 60 * 24 * 10; // keep 10 days
const FILE = path.join(os.tmpdir(), "eureka-daily-cache.json");

export async function getCached(key) {
  try {
    if (URL_ && TOKEN) {
      const r = await fetch(`${URL_}/get/${key}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
      const { result } = await r.json();
      return result ? JSON.parse(result) : null;
    }
    return JSON.parse(await fs.readFile(FILE, "utf8"))[key] ?? null;
  } catch { return null; }
}

export async function setCached(key, value) {
  try {
    if (URL_ && TOKEN) {
      await fetch(`${URL_}/set/${key}?EX=${TTL}`, {
        method: "POST", headers: { Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(value),
      });
      return;
    }
    let all = {};
    try { all = JSON.parse(await fs.readFile(FILE, "utf8")); } catch {}
    all[key] = value;
    await fs.writeFile(FILE, JSON.stringify(all));
  } catch (e) { console.error("cache write failed", e); }
}
