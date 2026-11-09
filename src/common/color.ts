const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function isHexColor(value: string): boolean {
  return HEX.test(value);
}

/** Normalises to `#rrggbb` (or `#rrggbbaa`). */
export function toHex(value: string): string {
  const body = value.replace(/^#/, "").toLowerCase();
  const full = body.length === 3 ? [...body].map((c) => c + c).join("") : body;
  return `#${full}`;
}

function channels(hex: string): [number, number, number] {
  const body = toHex(hex).slice(1, 7);
  return [0, 2, 4].map((i) => Number.parseInt(body.slice(i, i + 2), 16)) as [number, number, number];
}

/** Linear blend: weight 1 returns `color`, weight 0 returns `base`. */
export function mix(color: string, base: string, weight: number): string {
  const a = channels(color);
  const b = channels(base);
  const out = a.map((c, i) => Math.round(c * weight + b[i]! * (1 - weight)));
  return `#${out.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** Four intensities of one accent, from faint to full. */
export function rampFrom(accent: string, background: string): [string, string, string, string] {
  return [0.3, 0.5, 0.75, 1].map((w) => mix(accent, background, w)) as [string, string, string, string];
}
