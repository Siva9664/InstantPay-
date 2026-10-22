/**
 * lib/storage.ts
 * Simple JSON-file persistence for payout history.
 * No database required — perfect for hackathon MVP.
 */

import fs from "fs";
import path from "path";
import { Payout } from "@/types";

const FILE = path.join(process.cwd(), "data", "history.json");

function ensureFile(): void {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]", "utf-8");
}

/** Read all payout records, sorted newest-first. */
export function getHistory(): Payout[] {
  try {
    ensureFile();
    const raw = fs.readFileSync(FILE, "utf-8");
    const arr = JSON.parse(raw) as Payout[];
    return Array.isArray(arr)
      ? arr.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      : [];
  } catch (err) {
    console.error("[storage.ts] getHistory error:", err);
    return [];
  }
}

/** Append a payout record (newest first). */
export function addPayout(p: Payout): void {
  try {
    ensureFile();
    const current = getHistory();
    fs.writeFileSync(FILE, JSON.stringify([p, ...current], null, 2), "utf-8");
  } catch (err) {
    console.error("[storage.ts] addPayout error:", err);
    throw new Error("Failed to persist payout record");
  }
}

/** Aggregate stats across all successful payouts. */
export function getStats() {
  const history = getHistory();
  const successful = history.filter((p) => p.status === "SUCCESS");
  return {
    totalPayouts: history.length,
    successCount: successful.length,
    totalAmount: successful.reduce((s, p) => s + p.amount, 0),
  };
}
