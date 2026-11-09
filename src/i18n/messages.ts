import type { StreakStats } from "../core/types.js";
import type { ValueMode } from "../options/schema.js";

export interface Messages {
  defaultTitle: string;
  /** Jan … Dec */
  months: string[];
  /** Sun … Sat */
  weekdays: string[];
  less: string;
  more: string;
  /** `joiner` sits between number and label: "6 day streak" vs "6일 연속". */
  streak: (days: number) => { value: string; label: string; joiner: string };
  summary: (stats: StreakStats, weeks: number) => string;
  cellValue: (value: number, mode: ValueMode) => string;
  formatDate: (year: number, month: number, day: number, weekday: number) => string;
  errorTitle: string;
  /** Theme picker in the Notion embed page. */
  themePicker: { button: string; heading: string; reset: string };
}
