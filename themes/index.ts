export interface Theme {
  bg: string;
  border: string;
  title: string;
  text: string;
  muted: string;
  empty: string;
  /** Level 1 → 4, faint to strong. */
  levels: [string, string, string, string];
  ring: string;
}

/**
 * Built-in themes. `auto` is resolved by the embed page into a light/dark pair.
 * To add a theme, append an entry and its preview row in themes/README.md.
 */
export const themes = {
  github: {
    bg: "#ffffff", border: "#d0d7de", title: "#1f2328", text: "#1f2328", muted: "#59636e",
    empty: "#eff2f5", levels: ["#aceebb", "#4ac26b", "#2da44e", "#116329"], ring: "#1f2328",
  },
  "github-dark": {
    bg: "#0d1117", border: "#30363d", title: "#e6edf3", text: "#e6edf3", muted: "#9198a1",
    empty: "#151b23", levels: ["#033a16", "#196c2e", "#2ea043", "#56d364"], ring: "#e6edf3",
  },
  "notion-light": {
    bg: "#ffffff", border: "#e9e9e7", title: "#37352f", text: "#37352f", muted: "#787774",
    empty: "#f1f1ef", levels: ["#cfe4f5", "#8cbbe3", "#4a90cc", "#2b6cb0"], ring: "#37352f",
  },
  "notion-dark": {
    bg: "#191919", border: "#2f2f2f", title: "#ffffffcf", text: "#ffffffcf", muted: "#9b9b9b",
    empty: "#252525", levels: ["#1d3a57", "#235a8a", "#2f7cc0", "#529cca"], ring: "#ffffffcf",
  },
  ocean: {
    bg: "#0b1622", border: "#1c2b3a", title: "#e0f2fe", text: "#e0f2fe", muted: "#7dd3fc",
    empty: "#13212f", levels: ["#0c4a6e", "#0369a1", "#0ea5e9", "#7dd3fc"], ring: "#e0f2fe",
  },
  sunset: {
    bg: "#1a1210", border: "#3a2620", title: "#fff1e6", text: "#fff1e6", muted: "#f4a582",
    empty: "#2a1d19", levels: ["#7c2d12", "#c2410c", "#f97316", "#fdba74"], ring: "#fff1e6",
  },
  lavender: {
    bg: "#ffffff", border: "#e9e3f7", title: "#3b2f63", text: "#3b2f63", muted: "#7a6fa3",
    empty: "#f3effb", levels: ["#ddd3f5", "#b8a4ea", "#8b6fd6", "#5b3fb0"], ring: "#3b2f63",
  },
  mono: {
    bg: "#ffffff", border: "#e5e5e5", title: "#111111", text: "#111111", muted: "#737373",
    empty: "#f0f0f0", levels: ["#d4d4d4", "#a3a3a3", "#525252", "#171717"], ring: "#111111",
  },
  transparent: {
    bg: "#00000000", border: "#00000000", title: "#808080", text: "#808080", muted: "#808080",
    empty: "#80808033", levels: ["#2ea04366", "#2ea04399", "#2ea043cc", "#2ea043"], ring: "#808080",
  },
} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof themes;

/** Pairs used when `theme=auto` follows the viewer's light/dark mode. */
export const autoPair = { light: "notion-light", dark: "notion-dark" } as const satisfies Record<
  "light" | "dark",
  ThemeName
>;

export function isThemeName(name: string): name is ThemeName {
  return Object.hasOwn(themes, name);
}
