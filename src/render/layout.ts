import type { HeatmapOptions } from "../options/schema.js";

/** Every coordinate the components need, computed once from the options. */
export interface Layout {
  width: number;
  height: number;
  pad: number;
  step: number;
  cell: number;
  radius: number;
  header: { show: boolean; y: number };
  monthLabels: { show: boolean; y: number };
  dayLabels: { show: boolean; width: number };
  grid: { x: number; y: number; width: number; height: number };
  footer: { show: boolean; y: number };
}

const PAD = 16;
const HEADER_H = 30;
const MONTH_H = 16;
const DAY_LABEL_W = 28;
const FOOTER_H = 28;
const MIN_WIDTH = 280;

type LayoutInput = Pick<
  HeatmapOptions,
  "weeks" | "cellSize" | "gap" | "radius" | "hideTitle" | "hideStats" | "hideLegend" | "hideLabels"
>;

export function computeLayout(o: LayoutInput): Layout {
  const step = o.cellSize + o.gap;
  const showHeader = !o.hideTitle || !o.hideStats;
  const showLabels = !o.hideLabels;
  const showFooter = !o.hideStats || !o.hideLegend;

  const headerH = showHeader ? HEADER_H : 0;
  const monthH = showLabels ? MONTH_H : 0;
  const dayW = showLabels ? DAY_LABEL_W : 0;
  const gridW = o.weeks * step - o.gap;
  const gridH = 7 * step - o.gap;

  const width = Math.max(MIN_WIDTH, PAD * 2 + dayW + gridW);
  const gridY = PAD + headerH + monthH;
  const height = gridY + gridH + (showFooter ? FOOTER_H : 0) + PAD;

  return {
    width,
    height,
    pad: PAD,
    step,
    cell: o.cellSize,
    radius: Math.min(o.radius, Math.floor(o.cellSize / 2)),
    header: { show: showHeader, y: PAD + 16 },
    monthLabels: { show: showLabels, y: PAD + headerH + 10 },
    dayLabels: { show: showLabels, width: dayW },
    grid: { x: PAD + dayW, y: gridY, width: gridW, height: gridH },
    footer: { show: showFooter, y: gridY + gridH + 22 },
  };
}
