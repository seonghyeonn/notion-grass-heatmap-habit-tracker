/** Minimal SVG helpers so components stay readable and always escaped. */

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Attrs = Record<string, string | number | undefined>;

export function attrs(values: Attrs): string {
  return Object.entries(values)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}="${escapeXml(String(v))}"`)
    .join(" ");
}

export function el(tag: string, values: Attrs, children = ""): string {
  return children ? `<${tag} ${attrs(values)}>${children}</${tag}>` : `<${tag} ${attrs(values)}/>`;
}

export function text(values: Attrs, content: string): string {
  return el("text", values, escapeXml(content));
}

/** Rough text width for layout without a font engine (CJK glyphs are about twice as wide). */
export function estimateWidth(value: string, fontSize: number): number {
  let units = 0;
  for (const ch of value) units += /[ᄀ-ᇿ　-鿿가-힯]/.test(ch) ? 1 : 0.58;
  return Math.ceil(units * fontSize);
}

export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', Helvetica, Arial, sans-serif";
