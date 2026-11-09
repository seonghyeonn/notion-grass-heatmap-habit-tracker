/**
 * Renders example cards from synthetic data, without Notion.
 *   npm run preview            → examples/*.svg
 * Handy when designing themes or checking a layout change.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { addDays } from "../src/core/dates.js";
import type { ActivityRecord } from "../src/core/types.js";
import { readEnv } from "../src/common/env.js";
import { buildHeatmapSvg } from "../src/heatmap.js";
import { parseOptions } from "../src/options/parse.js";
import { StaticSource } from "../src/sources/static.js";

const NOW = new Date("2026-11-08T12:00:00Z");
const TODAY = "2026-11-08";

/** Deterministic "habit" pattern: busier on weekdays, with a few long streaks. */
function sampleRecords(seed = 7): ActivityRecord[] {
  let state = seed;
  const random = () => ((state = (state * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31);
  const records: ActivityRecord[] = [];
  for (let i = 0; i < 371; i++) {
    const date = addDays(TODAY, -i);
    const inStreak = i < 12 || (i > 60 && i < 85);
    const chance = inStreak ? 0.97 : 0.45;
    if (random() < chance) records.push({ date, value: 1 + Math.floor(random() * 5) });
  }
  return records;
}

const examples: Record<string, string> = {
  "github": "theme=github&title=Memo",
  "github-dark-count": "theme=github-dark&mode=count&title=Pages read",
  "notion-dark-ko": "theme=notion-dark&locale=ko&title=메모 잔디",
  "notion-light-ko": "theme=notion-light&locale=ko&title=독서 기록&mode=count",
  "ocean": "theme=ocean&mode=count&title=Workouts&week_start=mon",
  "sunset": "theme=sunset&mode=count&radius=6&cell=12&title=Writing",
  "lavender": "theme=lavender&title=Meditation",
  "mono-compact": "theme=mono&weeks=20&hide_legend=1&title=Last 20 weeks",
  "custom-color": "theme=notion-dark&color=f2a33a&mode=count&title=Custom accent",
  "auto": "theme=auto&title=Follows light/dark mode",
};

const env = readEnv({});
const source = new StaticSource(sampleRecords());
mkdirSync("examples", { recursive: true });

for (const [name, query] of Object.entries(examples)) {
  const options = parseOptions(new URLSearchParams(`db=${"0".repeat(32)}&${query}`), env);
  const svg = await buildHeatmapSvg(options, { source, now: NOW, maxRows: 5000 });
  writeFileSync(`examples/${name}.svg`, svg);
  console.log(`examples/${name}.svg`);
}
