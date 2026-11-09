import { AccessError } from "./errors.js";
import { normalizeNotionId } from "./notion-id.js";
import type { Env } from "./env.js";

/** An empty allow-list means "any database shared with the integration". */
export function assertDatabaseAllowed(databaseId: string, env: Env): void {
  if (env.allowedDatabases.length === 0) return;
  const allowed = env.allowedDatabases.map(normalizeNotionId);
  if (!allowed.includes(databaseId)) {
    throw new AccessError(
      "This database is not enabled on this deployment.",
      "Add its ID to ALLOWED_DATABASES.",
    );
  }
}
