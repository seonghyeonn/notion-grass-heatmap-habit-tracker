import { addDays, diffDays } from "./dates.js";
import type { DailySeries, DateKey, StreakStats } from "./types.js";

export function computeStreaks(series: DailySeries, today: DateKey): StreakStats {
  const days = [...series.keys()].filter((d) => (series.get(d) ?? 0) > 0).sort();

  let longest = 0;
  let run = 0;
  let previous: DateKey | undefined;
  for (const day of days) {
    run = previous !== undefined && diffDays(day, previous) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }

  // A streak survives until the end of today, so an empty today still counts yesterday's run.
  let cursor = series.has(today) ? today : addDays(today, -1);
  let current = 0;
  while ((series.get(cursor) ?? 0) > 0) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let total = 0;
  for (const value of series.values()) total += value;

  return { activeDays: days.length, total, currentStreak: current, longestStreak: longest };
}
