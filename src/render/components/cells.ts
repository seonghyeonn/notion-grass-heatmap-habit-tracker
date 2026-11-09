import { parseKey } from "../../core/dates.js";
import { el, escapeXml } from "../svg.js";
import type { RenderModel } from "../model.js";

export function cells({ layout, grid, messages, options }: RenderModel): string {
  const out: string[] = [];
  grid.weeks.forEach((column, w) => {
    column.forEach((cell, d) => {
      if (!cell.inRange) return;
      const date = parseKey(cell.date);
      const label = `${messages.formatDate(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        date.getUTCDay(),
      )} · ${messages.cellValue(cell.value, options.mode)}`;
      const isToday = cell.date === grid.today;
      out.push(
        el(
          "rect",
          {
            x: layout.grid.x + w * layout.step,
            y: layout.grid.y + d * layout.step,
            width: layout.cell,
            height: layout.cell,
            rx: layout.radius,
            class: `cell l${cell.level}${isToday ? " today" : ""}`,
            "data-date": cell.date,
            "data-value": cell.value,
          },
          `<title>${escapeXml(label)}</title>`,
        ),
      );
    });
  });
  return out.join("");
}
