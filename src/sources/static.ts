import type { ActivityRecord } from "../core/types.js";
import type { ActivitySource } from "./source.js";

/** In-memory source for previews, demos and tests. */
export class StaticSource implements ActivitySource {
  constructor(private readonly records: ActivityRecord[]) {}

  async fetchRecords(): Promise<ActivityRecord[]> {
    return this.records;
  }
}
