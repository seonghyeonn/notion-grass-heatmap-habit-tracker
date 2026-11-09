import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createApp } from "../src/app.js";
import { readEnv } from "../src/common/env.js";
import { createStatusHandler } from "../src/routes/status.js";
import { StaticSource } from "../src/sources/static.js";

const app = createApp({
  env: readEnv({ NOTION_TOKEN: "x" }),
  now: () => new Date("2026-11-08T12:00:00Z"),
  createSource: () => new StaticSource([]),
});
const call = (path: string, method = "GET") => app(new Request(`https://x.test${path}`, { method }));

describe("routing", () => {
  it("serves the heatmap on /api/heatmap and /heatmap", async () => {
    for (const path of ["/api/heatmap", "/heatmap/"]) {
      const res = await call(`${path}?db=e4770b9b7c3e4a96b062c3c6f4504e0c`);
      assert.equal(res.headers.get("content-type"), "image/svg+xml; charset=utf-8", path);
    }
  });

  it("rejects other methods and unknown paths", async () => {
    assert.equal((await call("/api/heatmap", "POST")).status, 405);
    assert.equal((await call("/api/nope")).status, 404);
  });
});

describe("status", () => {
  it("reports a working token without leaking it", async () => {
    const fake = (async () => Response.json({ object: "user", name: "grass-bot" })) as typeof fetch;
    const res = await createStatusHandler(readEnv({ NOTION_TOKEN: "ntn_secret" }), fake)();
    const text = await res.text();
    assert.equal(res.status, 200);
    assert.match(text, /"integration": "grass-bot"/);
    assert.doesNotMatch(text, /ntn_secret/);
  });

  it("explains usage from the defaults without echoing their values", async () => {
    const fake = (async () => Response.json({ object: "user", name: "grass-bot" })) as typeof fetch;
    const link = "https://www.notion.so/ws/Memo-e4770b9b7c3e4a96b062c3c6f4504e0c";
    const withDb = await (await createStatusHandler(readEnv({ NOTION_TOKEN: "x", DEFAULT_DATABASE: link, DEFAULT_WEEKS: "26" }), fake)()).json();
    assert.match(withDb.usage, /^\/api\/heatmap \(uses DEFAULT_DATABASE/);
    assert.deepEqual(withDb.defaults, ["DEFAULT_DATABASE", "DEFAULT_WEEKS"]);
    assert.doesNotMatch(JSON.stringify(withDb), /e4770b9b/);

    const withoutDb = await (await createStatusHandler(readEnv({ NOTION_TOKEN: "x" }), fake)()).json();
    assert.match(withoutDb.usage, /\?db=.*DEFAULT_DATABASE/);
    assert.deepEqual(withoutDb.defaults, []);
  });

  it("describes how the allow-list is set", async () => {
    const fake = (async () => Response.json({ object: "user" })) as typeof fetch;
    const label = async (vars: Record<string, string>) =>
      (await (await createStatusHandler(readEnv({ NOTION_TOKEN: "x", ...vars }), fake)()).json()).allowList;
    const id = "e4770b9b7c3e4a96b062c3c6f4504e0c";
    assert.equal(await label({}), "off");
    assert.equal(await label({ DEFAULT_DATABASE: id }), "default database only");
    assert.equal(await label({ ALLOWED_DATABASES: id }), "on");
    assert.equal(await label({ DEFAULT_DATABASE: id, ALLOWED_DATABASES: "*" }), "off");
  });

  it("is unhealthy without a token", async () => {
    const res = await createStatusHandler(readEnv({}))();
    assert.equal(res.status, 503);
    assert.match(await res.text(), /"tokenConfigured": false/);
  });
});
