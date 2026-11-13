import "server-only";

import { getDb } from "@/lib/db";
import { requestIp } from "@/lib/request";

export function hitRateLimit(
  request: Request,
  bucket: string,
  limit: number,
  windowMs: number,
) {
  const key = `${bucket}:${requestIp(request)}`;
  const now = Date.now();
  const db = getDb().sqlite;
  const row = db
    .prepare("SELECT count, reset_at FROM rate_limits WHERE key = ?")
    .get(key) as { count: number; reset_at: number } | undefined;
  if (!row || row.reset_at <= now) {
    db.prepare(
      `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at`,
    ).run(key, now + windowMs);
    return { limited: false, remaining: limit - 1 };
  }
  const count = row.count + 1;
  db.prepare("UPDATE rate_limits SET count = ? WHERE key = ?").run(count, key);
  return { limited: count > limit, remaining: Math.max(0, limit - count) };
}

export function clearRateLimit(request: Request, bucket: string) {
  getDb()
    .sqlite.prepare("DELETE FROM rate_limits WHERE key = ?")
    .run(`${bucket}:${requestIp(request)}`);
}
