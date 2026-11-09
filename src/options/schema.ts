import type { WeekStart } from "../core/types.js";
import type { Theme, ThemeName } from "../../themes/index.js";

/** Which day an item belongs to. */
export type DateField =
  | { kind: "created_time" }
  | { kind: "last_edited_time" }
  | { kind: "property"; name: string };

/** How each item contributes to its day. */
export type ValueMode =
  | { kind: "presence" } // did anything happen that day? (habit check)
  | { kind: "count" } // how many items that day
  | { kind: "sum"; property: string } // add a number property
  | { kind: "checkbox"; property: string }; // count items whose checkbox is ticked

export interface FilterRule {
  property: string;
  value: string;
  negate: boolean;
}

export type Locale = "en" | "ko";
export type OutputFormat = "svg" | "html";

export interface HeatmapOptions {
  databaseId: string;
  dateField: DateField;
  mode: ValueMode;
  filters: FilterRule[];
  weeks: number;
  weekStart: WeekStart;
  timeZone: string;
  locale: Locale;
  theme: ThemeName | "auto";
  colors: Partial<Theme> & { accent?: string };
  title: string | undefined;
  hideTitle: boolean;
  hideStats: boolean;
  hideLegend: boolean;
  hideLabels: boolean;
  hideBorder: boolean;
  cellSize: number;
  gap: number;
  radius: number;
  format: OutputFormat;
  cacheSeconds: number;
}

/** Numeric bounds shared by the parser and the docs. */
export const LIMITS = {
  weeks: { min: 1, max: 53, default: 53 },
  cellSize: { min: 6, max: 24, default: 11 },
  gap: { min: 0, max: 8, default: 3 },
  radius: { min: 0, max: 12, default: 2 },
  cacheSeconds: { min: 300, max: 86_400, default: 1_800 },
} as const;

/** URL parameter → theme colour key, for per-colour overrides. */
export const COLOR_PARAMS = {
  bg: "bg",
  border_color: "border",
  title_color: "title",
  text_color: "text",
  empty_color: "empty",
} as const satisfies Record<string, keyof Theme>;
