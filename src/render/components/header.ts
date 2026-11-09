import { el, escapeXml, text } from "../svg.js";
import type { RenderModel } from "../model.js";

/** Title on the left, 🔥 current streak on the right. */
export function header({ layout, options, stats, messages, title }: RenderModel): string {
  if (!layout.header.show) return "";
  const parts: string[] = [];
  const y = layout.header.y;

  if (!options.hideTitle) {
    parts.push(text({ x: layout.pad, y, class: "t-title c-title" }, title));
  }

  if (!options.hideStats) {
    const streak = messages.streak(stats.currentStreak);
    parts.push(
      el(
        "text",
        { x: layout.width - layout.pad, y, "text-anchor": "end", class: "t-title c-muted" },
        `<tspan class="t-streak c-text">🔥 ${escapeXml(streak.value)}</tspan>${streak.joiner}${escapeXml(streak.label)}`,
      ),
    );
  }
  return parts.join("");
}
