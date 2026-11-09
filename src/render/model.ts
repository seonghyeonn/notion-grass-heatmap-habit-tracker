import type { Messages } from "../i18n/index.js";
import type { CalendarGrid, StreakStats } from "../core/types.js";
import type { HeatmapOptions } from "../options/schema.js";
import type { Layout } from "./layout.js";

/** Everything a component may read. Components never fetch or compute data themselves. */
export interface RenderModel {
  grid: CalendarGrid;
  stats: StreakStats;
  options: HeatmapOptions;
  messages: Messages;
  layout: Layout;
  title: string;
}
