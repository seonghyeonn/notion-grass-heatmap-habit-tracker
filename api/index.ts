import { createApp } from "../src/app.js";

/**
 * The only Vercel Function. vercel.json rewrites every /api/* path here.
 *   GET /api/heatmap?db=...   → heatmap (svg or html)
 *   GET /api/status           → configuration check
 */
export default { fetch: createApp() };
