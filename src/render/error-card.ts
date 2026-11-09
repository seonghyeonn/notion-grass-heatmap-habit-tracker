import { AppError } from "../common/errors.js";
import type { Messages } from "../i18n/index.js";
import { FONT_STACK, escapeXml } from "./svg.js";

/**
 * Errors are drawn as a card too, so a broken embed explains itself
 * instead of showing a blank box inside Notion.
 */
export function renderErrorCard(error: unknown, messages: Messages): string {
  const app = error instanceof AppError ? error : undefined;
  const message = app?.message ?? "Unexpected error.";
  const hint = app?.hint ?? "";
  const code = app?.code ?? "internal";
  const width = 460;
  const height = hint ? 104 : 84;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(messages.errorTitle)}">`,
    `<style>text{font-family:${FONT_STACK}}</style>`,
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="8" fill="#fffbfa" stroke="#f4c7c3"/>`,
    `<text x="20" y="32" font-size="14" font-weight="600" fill="#b42318">⚠ ${escapeXml(messages.errorTitle)}</text>`,
    `<text x="20" y="56" font-size="12" fill="#3d1f1c">${escapeXml(message)}</text>`,
    hint ? `<text x="20" y="78" font-size="11" fill="#7a4a45">${escapeXml(hint)}</text>` : "",
    `<text x="${width - 16}" y="${height - 12}" font-size="9" fill="#b38b86" text-anchor="end">${escapeXml(code)}</text>`,
    "</svg>",
  ].join("");
}
