import { assertDatabaseAllowed } from "./common/access.js";
import { TtlCache } from "./common/cache.js";
import { readEnv, type Env } from "./common/env.js";
import { AppError, ConfigError } from "./common/errors.js";
import { respond } from "./common/http.js";
import type { ActivityRecord } from "./core/types.js";
import { buildHeatmapSvg } from "./heatmap.js";
import { messagesFor } from "./i18n/index.js";
import { parseOptions } from "./options/parse.js";
import type { Locale } from "./options/schema.js";
import { renderEmbedPage } from "./render/embed-page.js";
import { renderErrorCard } from "./render/error-card.js";
import { NotionClient } from "./sources/notion/client.js";
import { NotionSource } from "./sources/notion/notion-source.js";
import type { ActivitySource } from "./sources/source.js";

export interface HandlerDeps {
  env: Env;
  createSource: (env: Env) => ActivitySource;
  now: () => Date;
}

const defaultDeps = (): HandlerDeps => ({
  env: readEnv(),
  createSource: (env) => {
    if (!env.notionToken) throw new ConfigError("NOTION_TOKEN is not set.", "Add it in your Vercel project settings.");
    return new NotionSource(new NotionClient(env.notionToken));
  },
  now: () => new Date(),
});

/** HTTP adapter around buildHeatmapSvg. Uses the Web Request/Response API. */
export function createHeatmapHandler(overrides: Partial<HandlerDeps> = {}) {
  const deps = { ...defaultDeps(), ...overrides };
  const cache = new TtlCache<ActivityRecord[]>();

  return async function handle(request: Request): Promise<Response> {
    const params = new URL(request.url).searchParams;
    try {
      const options = parseOptions(params, deps.env);
      assertDatabaseAllowed(options.databaseId, deps.env);

      const svg = await buildHeatmapSvg(options, {
        source: deps.createSource(deps.env),
        now: deps.now(),
        maxRows: deps.env.maxRows,
        memo: (key, load) => cache.getOrCreate(key, options.cacheSeconds * 1000, load),
      });

      return options.format === "html"
        ? respond(
            "html",
            renderEmbedPage(svg, options.title ?? "Heatmap", {
              current: options.theme,
              labels: messagesFor(options.locale).themePicker,
            }),
            { cacheSeconds: options.cacheSeconds },
          )
        : respond("svg", svg, { cacheSeconds: options.cacheSeconds });
    } catch (error) {
      if (!(error instanceof AppError)) console.error(error);
      const locale = (params.get("locale")?.trim() || deps.env.defaultLocale) as Locale;
      const card = renderErrorCard(error, messagesFor(locale === "ko" ? "ko" : "en"));
      // 200 so the card still renders inside <img> and Notion embeds; the real status is in a header.
      const status = error instanceof AppError ? error.status : 500;
      const headers = { "X-Error-Status": String(status) };
      // Same lookup as the options parser (URL first, then DEFAULT_FORMAT), which may be what failed.
      const format = params.get("format")?.trim() || deps.env.defaults.format;
      return format === "html"
        ? respond("html", renderEmbedPage(card, "Error"), { headers })
        : respond("svg", card, { headers });
    }
  };
}
