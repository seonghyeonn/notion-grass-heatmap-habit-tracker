import type { ActivityRecord, DateKey } from "../core/types.js";
import type { DateField, FilterRule, ValueMode } from "../options/schema.js";

export interface RecordQuery {
  databaseId: string;
  dateField: DateField;
  mode: ValueMode;
  filters: FilterRule[];
  timeZone: string;
  /** Oldest day that can appear on the calendar; sources may skip older items. */
  since: DateKey;
  maxRows: number;
}

/**
 * A place activity comes from. Notion is the first adapter; others
 * (CSV, Google Sheets, GitHub…) only need to implement this one method.
 */
export interface ActivitySource {
  fetchRecords(query: RecordQuery): Promise<ActivityRecord[]>;
}
