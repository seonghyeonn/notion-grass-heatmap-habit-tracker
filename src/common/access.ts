import { AccessError } from "./errors.js";
import { normalizeNotionId } from "./notion-id.js";
import type { Env } from "./env.js";

/**
 * Which databases this deployment may read, or null for "any database shared with the connection".
 * - ALLOWED_DATABASES=*            → any
 * - ALLOWED_DATABASES set          → those, plus DEFAULT_DATABASE
 * - only DEFAULT_DATABASE set      → just that one
 * - neither set                    → any
 */
export function allowedDatabaseIds(env: Env): string[] | null {
  if (env.allowedDatabases.includes("*")) return null;
  const ids = [...env.allowedDatabases, ...(env.defaults.db ? [env.defaults.db] : [])]
    .map(normalizeNotionId)
    .filter((id): id is string => id !== null);
  return ids.length > 0 ? ids : null;
}

/** How /api/status describes the allow-list. */
export function allowListLabel(env: Env): "off" | "on" | "default database only" {
  if (allowedDatabaseIds(env) === null) return "off";
  return env.allowedDatabases.length === 0 ? "default database only" : "on";
}

export function assertDatabaseAllowed(databaseId: string, env: Env): void {
  const allowed = allowedDatabaseIds(env);
  if (allowed === null || allowed.includes(databaseId)) return;
  throw new AccessError(
    "This database is not enabled on this deployment.",
    "Add its link or ID to ALLOWED_DATABASES (comma-separated), or set ALLOWED_DATABASES=* to allow any.",
  );
}
