/** Calendar day in `YYYY-MM-DD` form, already resolved to the viewer's time zone. */
export type DateKey = string;

/** One unit of activity extracted from a data source (e.g. one Notion page). */
export interface ActivityRecord {
  date: DateKey;
  value: number;
}

/** Summed activity per day. */
export type DailySeries = Map<DateKey, number>;

export type Level = 0 | 1 | 2 | 3 | 4;

export interface Cell {
  date: DateKey;
  value: number;
  level: Level;
  /** False for days after "today" in the last (partial) week. */
  inRange: boolean;
}

export interface CalendarGrid {
  /** Columns of 7 cells, oldest week first. */
  weeks: Cell[][];
  today: DateKey;
  start: DateKey;
}

export interface StreakStats {
  activeDays: number;
  total: number;
  currentStreak: number;
  longestStreak: number;
}

export type WeekStart = "sun" | "mon";
