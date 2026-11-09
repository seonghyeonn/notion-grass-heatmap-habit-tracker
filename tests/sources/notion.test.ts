import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NotionApiError, OptionError } from "../../src/common/errors.js";
import { NotionClient } from "../../src/sources/notion/client.js";
import { pageToRecord } from "../../src/sources/notion/extract.js";
import { buildQueryBody, NotionSource } from "../../src/sources/notion/notion-source.js";
import type { RecordQuery } from "../../src/sources/source.js";
import { page, prop } from "../fixtures/notion.js";

const base = { dateField: { kind: "created_time" as const }, mode: { kind: "presence" as const }, filters: [], timeZone: "Asia/Seoul" };

describe("pageToRecord", () => {
  it("uses created time in the requested zone", () => {
    assert.deepEqual(pageToRecord(page({ created_time: "2026-11-08T16:00:00.000Z" }), base), { date: "2026-11-09", value: 1 });
  });

  it("reads date, created-time and formula properties", () => {
    const p = page({ props: { Done: prop.date("2026-10-01"), F: prop.formulaDate("2026-10-02T23:30:00.000Z") } });
    assert.equal(pageToRecord(p, { ...base, dateField: { kind: "property", name: "Done" } })?.date, "2026-10-01");
    assert.equal(pageToRecord(p, { ...base, dateField: { kind: "property", name: "F" } })?.date, "2026-10-03");
  });

  it("skips empty dates, trashed pages and zero values", () => {
    const empty = page({ props: { Done: prop.date(null) } });
    assert.equal(pageToRecord(empty, { ...base, dateField: { kind: "property", name: "Done" } }), null);
    assert.equal(pageToRecord(page({ in_trash: true }), base), null);
    const unchecked = page({ props: { Gym: prop.checkbox(false) } });
    assert.equal(pageToRecord(unchecked, { ...base, mode: { kind: "checkbox", property: "Gym" } }), null);
  });

  it("sums numbers and counts checkboxes", () => {
    const p = page({ props: { Pages: prop.number(42), Gym: prop.checkbox(true), Mins: prop.formulaNumber(30) } });
    assert.equal(pageToRecord(p, { ...base, mode: { kind: "sum", property: "Pages" } })?.value, 42);
    assert.equal(pageToRecord(p, { ...base, mode: { kind: "sum", property: "Mins" } })?.value, 30);
    assert.equal(pageToRecord(p, { ...base, mode: { kind: "checkbox", property: "Gym" } })?.value, 1);
  });

  it("applies filters across property types", () => {
    const p = page({ props: { Status: prop.status("✅ 완독"), Tags: prop.multi("tech", "robot"), Kind: prop.select("Book") } });
    const run = (property: string, value: string, negate = false) =>
      pageToRecord(p, { ...base, filters: [{ property, value, negate }] }) !== null;
    assert.ok(run("Status", "✅ 완독"));
    assert.ok(run("Tags", "Robot"), "case-insensitive");
    assert.ok(!run("Kind", "Movie"));
    assert.ok(run("Kind", "Movie", true));
  });

  it("names the problem when a property is missing or mistyped", () => {
    const p = page({ props: { Pages: prop.text("x") } });
    assert.throws(() => pageToRecord(p, { ...base, mode: { kind: "sum", property: "Nope" } }), /not found/);
    assert.throws(() => pageToRecord(p, { ...base, mode: { kind: "sum", property: "Pages" } }), OptionError);
    assert.throws(() => pageToRecord(p, { ...base, dateField: { kind: "property", name: "Pages" } }), /not a date/);
  });
});

describe("NotionClient / NotionSource", () => {
  const query: RecordQuery = { ...base, databaseId: "db-1", since: "2026-01-04", maxRows: 1000 };

  function fakeFetch(routes: Array<(url: string, init?: RequestInit) => Response | undefined>) {
    const calls: { url: string; body?: unknown }[] = [];
    const impl = (async (url: string | URL, init?: RequestInit) => {
      calls.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : undefined });
      for (const route of routes) {
        const res = route(String(url), init);
        if (res) return res;
      }
      return Response.json({ object: "error", code: "object_not_found", message: "nope" }, { status: 404 });
    }) as typeof fetch;
    return { impl, calls };
  }

  it("resolves the data source and follows pagination", async () => {
    const { impl, calls } = fakeFetch([
      (url) => (url.endsWith("/databases/db-1") ? Response.json({ object: "database", id: "db-1", data_sources: [{ id: "ds-1" }] }) : undefined),
      (url, init) => {
        if (!url.endsWith("/data_sources/ds-1/query")) return undefined;
        const cursor = JSON.parse(String(init?.body)).start_cursor;
        return cursor
          ? Response.json({ results: [page({ created_time: "2026-11-01T00:00:00Z" })], has_more: false, next_cursor: null })
          : Response.json({ results: [page()], has_more: true, next_cursor: "c2" });
      },
    ]);
    const source = new NotionSource(new NotionClient("secret", { fetchImpl: impl }));
    const records = await source.fetchRecords(query);
    assert.deepEqual(records.map((r) => r.date), ["2026-11-08", "2026-11-01"]);
    assert.equal(calls.length, 3);
  });

  it("accepts a data source id directly", async () => {
    const { impl } = fakeFetch([
      (url) => (url.endsWith("/data_sources/db-1/query") ? Response.json({ results: [page()], has_more: false, next_cursor: null }) : undefined),
    ]);
    const records = await new NotionSource(new NotionClient("s", { fetchImpl: impl })).fetchRecords(query);
    assert.equal(records.length, 1);
  });

  it("retries rate limits, then surfaces errors with hints", async () => {
    let hits = 0;
    const { impl } = fakeFetch([
      () => {
        hits++;
        return hits === 1
          ? new Response("{}", { status: 429, headers: { "retry-after": "0" } })
          : Response.json({ object: "error", code: "unauthorized", message: "bad token" }, { status: 401 });
      },
    ]);
    const client = new NotionClient("s", { fetchImpl: impl, sleep: async () => {} });
    await assert.rejects(client.me(), (e: unknown) => e instanceof NotionApiError && e.status === 401 && /NOTION_TOKEN/.test(e.hint ?? ""));
    assert.equal(hits, 2);
  });

  it("narrows by timestamp only when the date is a page timestamp", () => {
    const body = buildQueryBody(query) as { filter: { timestamp: string; created_time: { on_or_after: string } } };
    assert.equal(body.filter.timestamp, "created_time");
    assert.equal(body.filter.created_time.on_or_after, "2026-01-03");
    assert.equal("filter" in buildQueryBody({ ...query, dateField: { kind: "property", name: "D" } }), false);
  });
});
