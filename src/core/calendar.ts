import { addDays, weekday } from "./dates.js";
import type { LevelScale } from "./aggregate.js";
import type { CalendarGrid, Cell, DailySeries, DateKey, WeekStart } from "./types.js";

export interface CalendarOptions {
  today: DateKey;
  weeks: number;
  weekStart: WeekStart;
}

export function firstVisibleDay({ today, weeks, weekStart }: CalendarOptions): DateKey {
  const startIndex = weekStart === "sun" ? 0 : 1;
  const offset = (weekday(today) - startIndex + 7) % 7;
  return addDays(today, -offset - (weeks - 1) * 7);
}

export function buildCalendar(
  series: DailySeries,
  options: CalendarOptions,
  scale: LevelScale,
): CalendarGrid {
  const start = firstVisibleDay(options);
  const weeks: Cell[][] = [];
  for (let w = 0; w < options.weeks; w++) {
    const column: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      const inRange = date <= options.today;
      const value = inRange ? (series.get(date) ?? 0) : 0;
      column.push({ date, value, level: scale(value), inRange });
    }
    weeks.push(column);
  }
  return { weeks, today: options.today, start };
}

/** Restricts a series to the visible window so stats match what is drawn. */
export function visibleSeries(series: DailySeries, start: DateKey, today: DateKey): DailySeries {
  return new Map([...series].filter(([date]) => date >= start && date <= today));
}
