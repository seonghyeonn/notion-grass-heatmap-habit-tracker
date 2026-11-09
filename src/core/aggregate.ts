import type { ActivityRecord, DailySeries, Level } from "./types.js";

export function toSeries(records: Iterable<ActivityRecord>): DailySeries {
  const series: DailySeries = new Map();
  for (const { date, value } of records) {
    if (value === 0) continue;
    series.set(date, (series.get(date) ?? 0) + value);
  }
  return series;
}

export type LevelScale = (value: number) => Level;

/** Binary scale: any activity is the strongest color, like a habit check. */
export const presenceScale: LevelScale = (value) => (value > 0 ? 4 : 0);

/** Four buckets relative to the busiest visible day, like GitHub's graph. */
export function relativeScale(maxValue: number): LevelScale {
  if (maxValue <= 0) return () => 0;
  return (value) => {
    if (value <= 0) return 0;
    return Math.min(4, Math.max(1, Math.ceil((value / maxValue) * 4))) as Level;
  };
}
