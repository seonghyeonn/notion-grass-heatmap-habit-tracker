const CONTENT_TYPES = {
  svg: "image/svg+xml; charset=utf-8",
  html: "text/html; charset=utf-8",
  json: "application/json; charset=utf-8",
} as const;

export type BodyKind = keyof typeof CONTENT_TYPES;

export function cacheControl(seconds: number): string {
  return `public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=86400`;
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
      "Cache-Control": cacheSeconds ? cacheControl(cacheSeconds) : "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}
