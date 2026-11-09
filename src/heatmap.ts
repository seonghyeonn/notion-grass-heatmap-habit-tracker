import { presenceScale, relativeScale, toSeries } from "./core/aggregate.js";
import { buildCalendar, firstVisibleDay, visibleSeries } from "./core/calendar.js";
import { instantToKey } from "./core/dates.js";
import { computeStreaks } from "./core/streak.js";
import type { ActivityRecord } from "./core/types.js";
import { messagesFor } from "./i18n/index.js";
import type { HeatmapOptions } from "./options/schema.js";
import { renderHeatmapCard } from "./render/heatmap-card.js";
import type { ActivitySource } from "./sources/source.js";

export interface HeatmapDeps {
  source: ActivitySource;
  now: Date;
  maxRows: number;
  /** Optional memo around the source call (see common/cache.ts). */
  memo?: (key: string, load: () => Promise<ActivityRecord[]>) => Promise<ActivityRecord[]>;
}

/** The whole pipeline: source → series → calendar → stats → SVG. No HTTP here. */
export async function buildHeatmapSvg(options: HeatmapOptions, deps: HeatmapDeps): Promise<string> {
  const today = instantToKey(deps.now, options.timeZone);
  const start = firstVisibleDay({ today, weeks: options.weeks, weekStart: options.weekStart });

  const query = {
    databaseId: options.databaseId,
    dateField: options.dateField,
    mode: options.mode,
    filters: options.filters,
    timeZone: options.timeZone,
    since: start,
    maxRows: deps.maxRows,
  };
  const load = () => deps.source.fetchRecords(query);
  const records = deps.memo ? await deps.memo(JSON.stringify(query), load) : await load();

  const series = visibleSeries(toSeries(records), start, today);
  const max = Math.max(0, ...series.values());
  const scale = options.mode.kind === "presence" ? presenceScale : relativeScale(max);

  return renderHeatmapCard({
    grid: buildCalendar(series, { today, weeks: options.weeks, weekStart: options.weekStart }, scale),
    stats: computeStreaks(series, today),
    options,
    messages: messagesFor(options.locale),
  });
}
