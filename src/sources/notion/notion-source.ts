import { NotionApiError } from "../../common/errors.js";
import type { ActivityRecord } from "../../core/types.js";
import type { ActivitySource, RecordQuery } from "../source.js";
import { NotionClient } from "./client.js";
import { pageToRecord } from "./extract.js";

/** Reads a Notion database and maps each row to a dated activity record. */
export class NotionSource implements ActivitySource {
  constructor(private readonly client: NotionClient) {}

  async fetchRecords(query: RecordQuery): Promise<ActivityRecord[]> {
    const dataSourceId = await this.resolveDataSource(query.databaseId);
    const records: ActivityRecord[] = [];
    for await (const page of this.client.queryAll(dataSourceId, buildQueryBody(query), query.maxRows)) {
      const record = pageToRecord(page, query);
      if (record) records.push(record);
    }
    return records;
  }

  /**
   * Since API 2025-09-03 rows live in data sources. A database link resolves to its
   * first data source; a data source ID is also accepted as-is.
   */
  private async resolveDataSource(id: string): Promise<string> {
    try {
      const database = await this.client.retrieveDatabase(id);
      return database.data_sources?.[0]?.id ?? id;
    } catch (error) {
      if (error instanceof NotionApiError && error.status === 404) return id;
      throw error;
    }
  }
}

/**
 * Server-side narrowing where Notion supports it cheaply: page timestamps.
 * Property-based dates and filters are evaluated locally so every property type works.
 */
export function buildQueryBody(query: RecordQuery): Record<string, unknown> {
  const { dateField, since } = query;
  if (dateField.kind === "property") {
    return { sorts: [{ timestamp: "created_time", direction: "descending" }] };
  }
  const timestamp = dateField.kind;
  // One extra day of margin so time-zone shifts never drop the first visible day.
  const sinceDay = new Date(`${since}T00:00:00Z`);
  sinceDay.setUTCDate(sinceDay.getUTCDate() - 1);
  return {
    filter: { timestamp, [timestamp]: { on_or_after: sinceDay.toISOString().slice(0, 10) } },
    sorts: [{ timestamp, direction: "descending" }],
  };
}
