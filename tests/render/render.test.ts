import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { presenceScale } from "../../src/core/aggregate.js";
import { buildCalendar } from "../../src/core/calendar.js";
import { computeStreaks } from "../../src/core/streak.js";
import { readEnv } from "../../src/common/env.js";
import { OptionError } from "../../src/common/errors.js";
import { messagesFor } from "../../src/i18n/index.js";
import { parseOptions } from "../../src/options/parse.js";
import { renderErrorCard } from "../../src/render/error-card.js";
import { renderHeatmapCard } from "../../src/render/heatmap-card.js";
import { themes } from "../../themes/index.js";

const TODAY = "2026-11-08";
const series = new Map([
  [TODAY, 1],
  ["2026-11-07", 1],
]);

function render(query: string) {
  const options = parseOptions(new URLSearchParams(`db=e4770b9b7c3e4a96b062c3c6f4504e0c&${query}`), readEnv({}));
  const grid = buildCalendar(series, { today: TODAY, weeks: options.weeks, weekStart: options.weekStart }, presenceScale);
  return renderHeatmapCard({ grid, stats: computeStreaks(series, TODAY), options, messages: messagesFor(options.locale) });
}

describe("heatmap card", () => {
  it("is a well-formed svg with every visible day", () => {
    const svg = render("");
    assert.match(svg, /^<svg [^>]*viewBox="0 0 \d+ \d+"/);
    assert.ok(svg.endsWith("</svg>"));
    // 52 full weeks + today (sunday) = 365 cells
    assert.equal(svg.match(/class="cell /g)?.length, 365);
    assert.equal(svg.match(/class="cell l4/g)?.length, 2);
    assert.match(svg, /class="cell l4 today"/);
  });

  it("shows streak, summary and legend", () => {
    const svg = render("");
    assert.match(svg, /🔥 2<\/tspan> day streak/);
    assert.match(svg, /2 active days in the last year · longest 2 days/);
    assert.match(svg, />Less</);
  });

  it("localises to Korean", () => {
    const svg = render("locale=ko&title=메모 잔디");
    assert.match(svg, /메모 잔디/);
    assert.match(svg, /🔥 2<\/tspan>일 연속/);
    assert.match(svg, /2026년 11월 8일 \(일\) · 기록 있음/);
    assert.match(svg, />월</);
  });

  it("escapes user text", () => {
    assert.match(render("title=<script>&"), /&lt;script&gt;/);
    assert.doesNotMatch(render("title=<script>"), /<script>/);
  });

  it("hides parts on request", () => {
    const svg = render("hide_title=1&hide_stats=1&hide_legend=1&hide_labels=1");
    assert.doesNotMatch(svg, /class="t-title|class="t-summary|>Less<|>Mon</);
  });

  it("colours through classes so theme=auto can switch", () => {
    assert.match(render("theme=github"), new RegExp(`\\.l4\\{fill:${themes.github.levels[3]}\\}`));
    const auto = render("theme=auto");
    assert.match(auto, /@media \(prefers-color-scheme: dark\)/);
    assert.match(render("color=ff0000"), /\.l4\{fill:#ff0000\}/);
  });
});

describe("error card", () => {
  it("shows message and hint", () => {
    const svg = renderErrorCard(new OptionError("Missing `db` parameter.", "Pass ?db="), messagesFor("en"));
    assert.match(svg, /Missing `db` parameter\./);
    assert.match(svg, /Pass \?db=/);
    assert.match(svg, /invalid_option/);
  });
});
