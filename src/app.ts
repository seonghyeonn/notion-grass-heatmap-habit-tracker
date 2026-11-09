import { readEnv } from "./common/env.js";
import { respond } from "./common/http.js";
import { createHeatmapHandler, type HandlerDeps } from "./handler.js";
import { createStatusHandler } from "./routes/status.js";

/**
 * One fetch handler for every route, as Vercel recommends for projects without a
 * framework: a single function that Fluid compute can reuse across routes.
 */
export function createApp(overrides: Partial<HandlerDeps> = {}) {
  const env = overrides.env ?? readEnv();
  const heatmap = createHeatmapHandler({ ...overrides, env });
  const status = createStatusHandler(env);

  return async function fetch(request: Request): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return respond("json", JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
    switch (path) {
      case "/api/heatmap":
      case "/heatmap":
        return heatmap(request);
      case "/":
      case "/api":
      case "/api/status":
        return status();
      default:
        return respond("json", JSON.stringify({ error: "not_found", path }), { status: 404 });
    }
  };
}
