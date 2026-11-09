import { parseKey } from "../../core/dates.js";
import { text } from "../svg.js";
import type { RenderModel } from "../model.js";

/** Month names above the first column of each month, skipping crowded ones. */
export function monthLabels({ layout, grid, messages }: RenderModel): string {
  if (!layout.monthLabels.show) return "";
  const labels: string[] = [];
  let lastMonth = -1;
  let lastColumn = -Infinity;

  grid.weeks.forEach((column, index) => {
    const month = parseKey(column[0]!.date).getUTCMonth();
    if (month === lastMonth) return;
    lastMonth = month;
    // Need ~3 columns of room so labels never overlap.
    if (index - lastColumn < 3 || index > grid.weeks.length - 2) return;
    lastColumn = index;
    const x = layout.grid.x + index * layout.step;
    labels.push(text({ x, y: layout.monthLabels.y, class: "t-small c-muted" }, messages.months[month]!));
  });
  return labels.join("");
}

/** Mon / Wed / Fri on the left, like GitHub. */
export function dayLabels({ layout, grid, messages }: RenderModel): string {
  if (!layout.dayLabels.show) return "";
  const firstColumn = grid.weeks[0]!;
  return firstColumn
    .map((cell, row) => {
      const weekday = parseKey(cell.date).getUTCDay();
      if (![1, 3, 5].includes(weekday)) return "";
      const y = layout.grid.y + row * layout.step + layout.cell - 1;
      return text({ x: layout.pad, y, class: "t-small c-muted" }, messages.weekdays[weekday]!);
    })
    .join("");
}
