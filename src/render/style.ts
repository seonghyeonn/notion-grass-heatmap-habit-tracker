import type { Theme } from "../../themes/index.js";
import { FONT_STACK } from "./svg.js";
import type { ResolvedThemes } from "./theme.js";

/**
 * Components only use class names; colours live here. That is what lets one SVG
 * follow the viewer's light/dark mode when `theme=auto`.
 */
export function buildStyle({ light, dark }: ResolvedThemes, animate: boolean): string {
  const base = `
text{font-family:${FONT_STACK};}
.t-title{font-size:14px;font-weight:600}
.t-streak{font-size:14px;font-weight:700}
.t-small{font-size:10px}
.t-summary{font-size:11px}
.today{stroke-width:1.5px}
${animate ? ".cell{animation:fade .4s ease-out both}@keyframes fade{from{opacity:0}to{opacity:1}}" : ""}`;
  const darkCss = dark ? `@media (prefers-color-scheme: dark){${colors(dark)}}` : "";
  return `<style>${base}${colors(light)}${darkCss}</style>`;
}

function colors(t: Theme): string {
  return [
    `.bg{fill:${t.bg};stroke:${t.border}}`,
    `.c-title{fill:${t.title}}`,
    `.c-text{fill:${t.text}}`,
    `.c-muted{fill:${t.muted}}`,
    `.l0{fill:${t.empty}}`,
    ...t.levels.map((color, i) => `.l${i + 1}{fill:${color}}`),
    `.today{stroke:${t.ring}}`,
  ].join("");
}
