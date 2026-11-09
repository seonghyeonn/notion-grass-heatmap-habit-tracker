const CONTENT_TYPES = {
  svg: "image/svg+xml; charset=utf-8",
  html: "text/html; charset=utf-8",
  json: "application/json; charset=utf-8",
} as const;

export type BodyKind = keyof typeof CONTENT_TYPES;

/** How long a viewer's browser may reuse a response without asking again. */
const BROWSER_SECONDS = 60;

/**
 * Browsers keep a response for a minute, so a new deployment shows up almost at once.
 * The CDN keeps it for `seconds` (and serves it stale while refreshing), which is what
 * actually saves Notion requests. Vercel reads Vercel-CDN-Cache-Control; other CDNs
 * read CDN-Cache-Control or s-maxage. Vercel also clears its CDN cache on every deploy.
 */
export function cacheHeaders(seconds: number): Record<string, string> {
  const cdn = `max-age=${seconds}, stale-while-revalidate=86400`;
  return {
    "Cache-Control": `public, max-age=${Math.min(BROWSER_SECONDS, seconds)}, s-maxage=${seconds}`,
    "CDN-Cache-Control": cdn,
    "Vercel-CDN-Cache-Control": cdn,
  };
}

export function respond(
  kind: BodyKind,
  body: string,
  { cacheSeconds, status = 200, headers = {} }: { cacheSeconds?: number; status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": CONTENT_TYPES[kind],
      ...(cacheSeconds ? cacheHeaders(cacheSeconds) : { "Cache-Control": "no-store" }),
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}
