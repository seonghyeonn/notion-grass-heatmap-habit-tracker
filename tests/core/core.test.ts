import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { presenceScale, relativeScale, toSeries } from "../../src/core/aggregate.js";
import { buildCalendar, firstVisibleDay, visibleSeries } from "../../src/core/calendar.js";
import { addDays, instantToKey, toDateKey, weekday } from "../../src/core/dates.js";
import { computeStreaks } from "../../src/core/streak.js";

const TODAY = "2026-11-08"; // a Sunday

describe("dates", () => {
  it("moves late-UTC timestamps to the next local day", () => {
    assert.equal(toDateKey("2026-11-08T16:30:00.000Z", "Asia/Seoul"), "2026-11-09");
    assert.equal(toDateKey("2026-11-08T13:16:45.000Z", "Asia/Seoul"), "2026-11-08");
    assert.equal(toDateKey("2026-11-08T03:00:00.000Z", "America/Los_Angeles"), "2026-11-07");
  });

  it("keeps date-only values as written", () => {
    assert.equal(toDateKey("2026-01-31", "Pacific/Kiritimati"), "2026-01-31");
  });

  it("rejects garbage", () => {
    assert.equal(toDateKey("not a date", "UTC"), null);
  });

  it("does arithmetic across month and DST boundaries", () => {
    assert.equal(addDays("2026-03-28", 2), "2026-03-30");
    assert.equal(addDays("2026-01-01", -1), "2025-12-31");
    assert.equal(weekday(TODAY), 0);
    assert.equal(instantToKey(new Date("2026-11-08T15:00:00Z"), "Asia/Seoul"), "2026-11-09");
  });
});

describe("aggregate", () => {
  it("sums values per day and drops zeros", () => {
    const series = toSeries([
      { date: TODAY, value: 1 },
      { date: TODAY, value: 2 },
      { date: "2026-11-07", value: 0 },
    ]);
    assert.deepEqual([...series], [[TODAY, 3]]);
  });

  it("presence is binary, relative has four buckets", () => {
    assert.equal(presenceScale(0), 0);
    assert.equal(presenceScale(9), 4);
    const scale = relativeScale(8);
    assert.deepEqual([0, 1, 2, 4, 6, 8, 99].map(scale), [0, 1, 1, 2, 3, 4, 4]);
    assert.equal(relativeScale(0)(5), 0);
  });
});

describe("calendar", () => {
  it("ends on today in the last column (sunday start)", () => {
    const grid = buildCalendar(new Map(), { today: TODAY, weeks: 53, weekStart: "sun" }, presenceScale);
    assert.equal(grid.weeks.length, 53);
    assert.ok(grid.weeks.every((col) => col.length === 7));
    assert.equal(grid.weeks.at(-1)![0]!.date, TODAY);
    assert.equal(grid.weeks.at(-1)![1]!.inRange, false);
    assert.equal(weekday(grid.start), 0);
  });

  it("supports monday start", () => {
    const start = firstVisibleDay({ today: TODAY, weeks: 2, weekStart: "mon" });
    assert.equal(weekday(start), 1);
    const grid = buildCalendar(new Map(), { today: TODAY, weeks: 2, weekStart: "mon" }, presenceScale);
    assert.equal(grid.weeks.at(-1)![6]!.date, TODAY);
  });

  it("assigns levels and hides future values", () => {
    const series = new Map([[TODAY, 2]]);
    const grid = buildCalendar(series, { today: TODAY, weeks: 1, weekStart: "sun" }, presenceScale);
    assert.equal(grid.weeks[0]![0]!.level, 4);
  });

  it("clips the series to the visible window", () => {
    const series = new Map([
      ["2020-01-01", 1],
      [TODAY, 1],
    ]);
    assert.deepEqual([...visibleSeries(series, "2026-01-01", TODAY).keys()], [TODAY]);
  });
});

describe("streaks", () => {
  const days = (...offsets: number[]) => new Map(offsets.map((o) => [addDays(TODAY, -o), 1]));

  it("counts current, longest and active days", () => {
    const stats = computeStreaks(days(0, 1, 2, 10, 11, 12, 13), TODAY);
    assert.deepEqual(stats, { activeDays: 7, total: 7, currentStreak: 3, longestStreak: 4 });
  });

  it("keeps the streak alive until today ends", () => {
    assert.equal(computeStreaks(days(1, 2), TODAY).currentStreak, 2);
    assert.equal(computeStreaks(days(2, 3), TODAY).currentStreak, 0);
  });

  it("handles an empty series", () => {
    assert.deepEqual(computeStreaks(new Map(), TODAY), { activeDays: 0, total: 0, currentStreak: 0, longestStreak: 0 });
  });
});
