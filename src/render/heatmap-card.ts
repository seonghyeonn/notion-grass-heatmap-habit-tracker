import type { CalendarGrid, StreakStats } from "../core/types.js";
import type { Messages } from "../i18n/index.js";
import type { HeatmapOptions } from "../options/schema.js";
import { cells } from "./components/cells.js";
import { footer } from "./components/footer.js";
import { header } from "./components/header.js";
import { dayLabels, monthLabels } from "./components/labels.js";
import { computeLayout } from "./layout.js";
import type { RenderModel } from "./model.js";
import { buildStyle } from "./style.js";
import { el, escapeXml } from "./svg.js";
import { resolveThemes } from "./theme.js";

export interface CardInput {
  grid: CalendarGrid;
  stats: StreakStats;
  options: HeatmapOptions;
  messages: Messages;
}

/** Composes the components into one self-contained SVG document. */
export function renderHeatmapCard({ grid, stats, options, messages }: CardInput): string {
  const layout = computeLayout(options);
  const title = options.title ?? messages.defaultTitle;
  const model: RenderModel = { grid, stats, options, messages, layout, title };
  const style = buildStyle(resolveThemes(options.theme, options.colors), true);

  const background = el("rect", {
    x: 0.5,
    y: 0.5,
    width: layout.width - 1,
    height: layout.height - 1,
    rx: 8,
    class: "bg",
    "stroke-opacity": options.hideBorder ? 0 : 1,
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="${escapeXml(title)}">`,
    `<title>${escapeXml(title)}</title>`,
    style,
    background,
    header(model),
    monthLabels(model),
    dayLabels(model),
    cells(model),
    footer(model),
    "</svg>",
  ].join("");
}
