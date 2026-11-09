import { allowListLabel } from "../common/access.js";
import { DEFAULT_ENV_NAMES, type Env } from "../common/env.js";
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
      allowList: allowListLabel(env),
      usage: env.defaults.db
        ? "/api/heatmap (uses DEFAULT_DATABASE; add ?db=<notion database id or url> for another database)"
        : "/api/heatmap?db=<notion database id or url>, or set DEFAULT_DATABASE to use just /api/heatmap",
      // Names only: values such as the database link stay private.
      defaults: Object.keys(env.defaults).map((param) => DEFAULT_ENV_NAMES[param]),
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
