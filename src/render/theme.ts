import { rampFrom } from "../common/color.js";
import type { HeatmapOptions } from "../options/schema.js";
import { autoPair, themes, type Theme, type ThemeName } from "../../themes/index.js";

export interface ResolvedThemes {
  light: Theme;
  /** Present only for `theme=auto`; the SVG then switches with the viewer's colour scheme. */
  dark?: Theme;
}

export function resolveThemes(name: ThemeName | "auto", colors: HeatmapOptions["colors"]): ResolvedThemes {
  if (name === "auto") {
    return {
      light: applyOverrides(themes[autoPair.light], colors),
      dark: applyOverrides(themes[autoPair.dark], colors),
    };
  }
  return { light: applyOverrides(themes[name], colors) };
}

function applyOverrides(base: Theme, { accent, ...colors }: HeatmapOptions["colors"]): Theme {
  const theme: Theme = { ...base, ...colors };
  if (accent) theme.levels = rampFrom(accent, theme.empty);
  return theme;
}
