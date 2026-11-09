import type { Env } from "../common/env.js";
import { AppError } from "../common/errors.js";
import { respond } from "../common/http.js";
import { PACKAGE } from "../meta.js";
import { NotionClient } from "../sources/notion/client.js";

/** GET /api/status → is the deployment configured and can it reach Notion? Never echoes secrets. */
export function createStatusHandler(env: Env, fetchImpl: typeof fetch = fetch) {
  return async function status(): Promise<Response> {
    const body: Record<string, unknown> = {
      name: PACKAGE.name,
      version: PACKAGE.version,
      tokenConfigured: Boolean(env.notionToken),
      allowList: env.allowedDatabases.length > 0 ? "on" : "off",
      usage: "/api/heatmap?db=<notion database id or url>",
    };

    let reachable = false;
    if (env.notionToken) {
      try {
        const me = await new NotionClient(env.notionToken, { fetchImpl }).me();
        reachable = true;
        body.notion = { reachable, integration: me.name ?? null };
      } catch (error) {
        body.notion = { reachable, error: error instanceof AppError ? error.code : "unknown" };
      }
    }

    return respond("json", JSON.stringify({ ok: reachable, ...body }, null, 2), { status: reachable ? 200 : 503 });
  };
}
