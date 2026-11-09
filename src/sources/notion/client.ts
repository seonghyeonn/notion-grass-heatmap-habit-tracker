import { NotionApiError } from "../../common/errors.js";
import type { DatabaseResponse, NotionErrorBody, NotionPage, QueryResponse } from "./types.js";

export const NOTION_API = "https://api.notion.com/v1";
/** 2025-09-03 introduced data sources; databases can hold several of them. */
export const NOTION_VERSION = "2025-09-03";

type FetchLike = typeof fetch;

export interface ClientOptions {
  fetchImpl?: FetchLike;
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
}

/** Thin HTTP wrapper: auth headers, pagination and polite retries. Nothing else. */
export class NotionClient {
  private readonly fetchImpl: FetchLike;
  private readonly maxRetries: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(
    private readonly token: string,
    { fetchImpl = fetch, maxRetries = 2, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }: ClientOptions = {},
  ) {
    this.fetchImpl = fetchImpl;
    this.maxRetries = maxRetries;
    this.sleep = sleep;
  }

  retrieveDatabase(databaseId: string): Promise<DatabaseResponse> {
    return this.request<DatabaseResponse>("GET", `/databases/${databaseId}`);
  }

  me(): Promise<{ object: string; name?: string }> {
    return this.request("GET", "/users/me");
  }

  /** Yields every row of a data source, newest first, until `maxRows`. */
  async *queryAll(dataSourceId: string, body: Record<string, unknown>, maxRows: number): AsyncGenerator<NotionPage> {
    let cursor: string | undefined;
    let yielded = 0;
    do {
      const page = await this.request<QueryResponse>("POST", `/data_sources/${dataSourceId}/query`, {
        ...body,
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      });
      for (const row of page.results) {
        if (yielded++ >= maxRows) return;
        yield row;
      }
      cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined;
    } while (cursor);
  }

  private async request<T>(method: "GET" | "POST", path: string, body?: unknown, attempt = 0): Promise<T> {
    const response = await this.fetchImpl(`${NOTION_API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    if (response.ok) return (await response.json()) as T;

    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt < this.maxRetries) {
      const retryAfter = Number(response.headers.get("retry-after"));
      await this.sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt);
      return this.request<T>(method, path, body, attempt + 1);
    }

    const error = (await response.json().catch(() => ({}))) as Partial<NotionErrorBody>;
    throw new NotionApiError(response.status, error.code ?? "http_error", error.message ?? response.statusText);
  }
}
