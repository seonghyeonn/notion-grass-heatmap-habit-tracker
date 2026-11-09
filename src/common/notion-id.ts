const DASHED = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const COMPACT = /[0-9a-f]{32}/gi;

/**
 * Accepts a raw ID, a dashed UUID or a full Notion URL and returns a dashed UUID.
 * Query strings are ignored because `?v=` holds a view ID, not the database ID.
 */
export function normalizeNotionId(input: string): string | null {
  const path = input.trim().split(/[?#]/)[0] ?? "";
  const dashed = path.match(DASHED);
  if (dashed?.length) return dashed[dashed.length - 1]!.toLowerCase();

  const compact = path.replace(/-/g, "").match(COMPACT);
  const hex = compact?.[compact.length - 1]?.toLowerCase();
  if (!hex) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
