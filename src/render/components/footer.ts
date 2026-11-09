import { el, estimateWidth, text } from "../svg.js";
import type { RenderModel } from "../model.js";

/** Summary on the left, Less ▢▢▢▢▢ More legend on the right. */
export function footer({ layout, options, stats, messages }: RenderModel): string {
  if (!layout.footer.show) return "";
  const y = layout.footer.y;
  const parts: string[] = [];

  if (!options.hideStats) {
    parts.push(text({ x: layout.pad, y, class: "t-summary c-muted" }, messages.summary(stats, options.weeks)));
  }

  if (!options.hideLegend) {
    const size = 10;
    const gap = 3;
    const right = layout.width - layout.pad;
    const moreX = right;
    const swatchesEnd = moreX - 5 - estimateWidth(messages.more, 10);
    const swatchesStart = swatchesEnd - (5 * size + 4 * gap);
    parts.push(text({ x: swatchesStart - 5, y, "text-anchor": "end", class: "t-small c-muted" }, messages.less));
    for (let level = 0; level <= 4; level++) {
      parts.push(
        el("rect", {
          x: swatchesStart + level * (size + gap),
          y: y - size + 1,
          width: size,
          height: size,
          rx: Math.min(layout.radius, 3),
          class: `l${level}`,
        }),
      );
    }
    parts.push(text({ x: moreX, y, "text-anchor": "end", class: "t-small c-muted" }, messages.more));
  }
  return parts.join("");
}
