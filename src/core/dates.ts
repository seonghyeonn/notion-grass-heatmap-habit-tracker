import type { DateKey } from "./types.js";

const DAY_MS = 86_400_000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Keys are handled as UTC midnights so arithmetic never drifts with DST. */
export function parseKey(key: DateKey): Date {
  return new Date(`${key}T00:00:00Z`);
}

export function formatKey(date: Date): DateKey {
  return date.toISOString().slice(0, 10);
}

export function addDays(key: DateKey, days: number): DateKey {
  return formatKey(new Date(parseKey(key).getTime() + days * DAY_MS));
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(key: DateKey): number {
  return parseKey(key).getUTCDay();
}

export function diffDays(later: DateKey, earlier: DateKey): number {
  return Math.round((parseKey(later).getTime() - parseKey(earlier).getTime()) / DAY_MS);
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The calendar day of an instant as seen in `timeZone`. */
export function instantToKey(instant: Date, timeZone: string): DateKey {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/**
 * Converts a Notion date string to a day key.
 * Date-only values ("2026-11-08") are kept as written; timestamps are shifted to `timeZone`.
 */
export function toDateKey(value: string, timeZone: string): DateKey | null {
  if (DATE_ONLY.test(value)) return value;
  const instant = new Date(value);
  return Number.isNaN(instant.getTime()) ? null : instantToKey(instant, timeZone);
}
