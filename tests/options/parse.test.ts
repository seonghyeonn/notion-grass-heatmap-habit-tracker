import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readEnv } from "../../src/common/env.js";
import { OptionError } from "../../src/common/errors.js";
import { normalizeNotionId } from "../../src/common/notion-id.js";
import { parseOptions } from "../../src/options/parse.js";

const env = readEnv({});
const ID = "e4770b9b7c3e4a96b062c3c6f4504e0c";
const DASHED = "e4770b9b-7c3e-4a96-b062-c3c6f4504e0c";
const parse = (query: string) => parseOptions(new URLSearchParams(query), env);

describe("notion ids", () => {
  it("accepts raw, dashed and URL forms", () => {
    assert.equal(normalizeNotionId(ID), DASHED);
    assert.equal(normalizeNotionId(DASHED), DASHED);
    assert.equal(normalizeNotionId(`https://www.notion.so/ws/Memo-${ID}?v=0123456789abcdef0123456789abcdef`), DASHED);
    assert.equal(normalizeNotionId("hello"), null);
  });
});

describe("parseOptions", () => {
  it("fills defaults", () => {
    const o = parse(`db=${ID}`);
    assert.equal(o.databaseId, DASHED);
    assert.deepEqual(o.dateField, { kind: "created_time" });
    assert.deepEqual(o.mode, { kind: "presence" });
    assert.equal(o.weeks, 53);
    assert.equal(o.weekStart, "sun");
    assert.equal(o.timeZone, "UTC");
    assert.equal(o.theme, "github");
    assert.equal(o.format, "svg");
    assert.equal(o.cacheSeconds, 1800);
  });

  it("reads every documented option", () => {
    const o = parse(
      `db=${ID}&date=완독일&mode=sum:읽은 페이지&filter=상태:완독&filter=분야:!소설&weeks=26&week_start=mon` +
        "&tz=Asia/Seoul&locale=ko&theme=notion-dark&color=2f7cc0&bg=000&title=독서&hide_stats=true" +
        "&hide_legend=1&hide_labels=yes&hide_border=on&cell=14&gap=2&radius=4&format=html&cache_seconds=60",
    );
    assert.deepEqual(o.dateField, { kind: "property", name: "완독일" });
    assert.deepEqual(o.mode, { kind: "sum", property: "읽은 페이지" });
    assert.deepEqual(o.filters, [
      { property: "상태", value: "완독", negate: false },
      { property: "분야", value: "소설", negate: true },
    ]);
    assert.equal(o.weeks, 26);
    assert.equal(o.weekStart, "mon");
    assert.equal(o.locale, "ko");
    assert.equal(o.colors.accent, "#2f7cc0");
    assert.equal(o.colors.bg, "#000000");
    assert.equal(o.title, "독서");
    assert.ok(o.hideStats && o.hideLegend && o.hideLabels && o.hideBorder && !o.hideTitle);
    assert.equal(o.cacheSeconds, 300, "clamped to the minimum");
  });

  it("explains bad input", () => {
    const cases = [
      "",
      "db=nope",
      `db=${ID}&tz=Mars/Base`,
      `db=${ID}&theme=rainbow`,
      `db=${ID}&mode=avg:x`,
      `db=${ID}&weeks=99`,
      `db=${ID}&cell=abc`,
      `db=${ID}&color=red`,
      `db=${ID}&filter=nocolon`,
      `db=${ID}&locale=fr`,
    ];
    for (const query of cases) assert.throws(() => parse(query), OptionError, query);
  });

  it("uses environment defaults", () => {
    const custom = readEnv({ DEFAULT_TIMEZONE: "Asia/Seoul", DEFAULT_LOCALE: "ko", DEFAULT_THEME: "ocean" });
    const o = parseOptions(new URLSearchParams(`db=${ID}`), custom);
    assert.equal(o.timeZone, "Asia/Seoul");
    assert.equal(o.locale, "ko");
    assert.equal(o.theme, "ocean");
  });

  it("takes every option from DEFAULT_* variables, so the URL can be empty", () => {
    const custom = readEnv({
      DEFAULT_DATABASE: `https://www.notion.so/ws/Memo-${ID}`,
      DEFAULT_WEEKS: "26",
      DEFAULT_TITLE: "메모 기록",
      DEFAULT_FORMAT: "html",
      DEFAULT_MODE: "checkbox:운동",
      DEFAULT_FILTER: "상태:완료; 분야:!소설",
      DEFAULT_HIDE_LEGEND: "true",
      DEFAULT_CELL: "14",
      DEFAULT_BG: "191919",
    });
    const o = parseOptions(new URLSearchParams(""), custom);
    assert.equal(o.databaseId, DASHED);
    assert.equal(o.weeks, 26);
    assert.equal(o.title, "메모 기록");
    assert.equal(o.format, "html");
    assert.deepEqual(o.mode, { kind: "checkbox", property: "운동" });
    assert.deepEqual(o.filters, [
      { property: "상태", value: "완료", negate: false },
      { property: "분야", value: "소설", negate: true },
    ]);
    assert.ok(o.hideLegend);
    assert.equal(o.cellSize, 14);
    assert.equal(o.colors.bg, "#191919");
  });

  it("lets the URL override environment defaults", () => {
    const custom = readEnv({ DEFAULT_DATABASE: ID, DEFAULT_WEEKS: "26", DEFAULT_HIDE_LEGEND: "true", DEFAULT_FILTER: "상태:완료" });
    const other = "0123456789abcdef0123456789abcdef";
    const o = parseOptions(new URLSearchParams(`db=${other}&weeks=13&hide_legend=false&filter=분야:독서`), custom);
    assert.equal(o.databaseId, normalizeNotionId(other));
    assert.equal(o.weeks, 13);
    assert.equal(o.hideLegend, false);
    assert.deepEqual(o.filters, [{ property: "분야", value: "독서", negate: false }]);
  });

  it("rejects bad environment defaults like bad URL values", () => {
    assert.throws(() => parseOptions(new URLSearchParams(`db=${ID}`), readEnv({ DEFAULT_WEEKS: "99" })), OptionError);
  });
});
