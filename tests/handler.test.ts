import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readEnv } from "../src/common/env.js";
import { createHeatmapHandler } from "../src/handler.js";
import { PACKAGE } from "../src/meta.js";
import { StaticSource } from "../src/sources/static.js";

const ID = "e4770b9b7c3e4a96b062c3c6f4504e0c";
const now = () => new Date("2026-11-08T12:00:00Z");

function handler(envVars: Record<string, string> = { NOTION_TOKEN: "x" }, calls = { n: 0 }) {
  const source = new StaticSource([{ date: "2026-11-08", value: 1 }]);
  return createHeatmapHandler({
    env: readEnv(envVars),
    now,
    createSource: () => ({
      fetchRecords: (q) => {
        calls.n++;
        return source.fetchRecords();
      },
    }),
  });
}

const get = (h: ReturnType<typeof handler>, query: string) => h(new Request(`https://x.test/api/heatmap?${query}`));

describe("GET /api/heatmap", () => {
  it("returns a cacheable svg", async () => {
    const res = await get(handler(), `db=${ID}&cache_seconds=600`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "image/svg+xml; charset=utf-8");
    assert.match(res.headers.get("cache-control") ?? "", /s-maxage=600/);
    assert.match(await res.text(), /class="cell l4 today"/);
  });

  it("wraps in html for embeds", async () => {
    const res = await get(handler(), `db=${ID}&format=html`);
    assert.equal(res.headers.get("content-type"), "text/html; charset=utf-8");
    assert.match(await res.text(), /<!doctype html>[\s\S]*<svg/);
  });

  it("memoises identical requests within one instance", async () => {
    const calls = { n: 0 };
    const h = handler({ NOTION_TOKEN: "x" }, calls);
    await get(h, `db=${ID}`);
    await get(h, `db=${ID}&theme=ocean`);
    assert.equal(calls.n, 1, "theme does not change the data query");
  });

  it("draws errors as uncached cards with the real status in a header", async () => {
    const res = await get(handler(), "theme=github");
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-error-status"), "400");
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.match(await res.text(), /Missing `db` parameter/);
  });

  it("enforces the allow-list", async () => {
    const h = handler({ NOTION_TOKEN: "x", ALLOWED_DATABASES: "11111111111111111111111111111111" });
    const res = await get(h, `db=${ID}`);
    assert.equal(res.headers.get("x-error-status"), "403");
  });

  it("locks to DEFAULT_DATABASE when no allow-list is set", async () => {
    const other = "11111111111111111111111111111111";
    const locked = handler({ NOTION_TOKEN: "x", DEFAULT_DATABASE: `https://www.notion.so/ws/Memo-${ID}` });
    assert.equal((await get(locked, "")).headers.get("x-error-status"), null, "default database is allowed");
    assert.equal((await get(locked, `db=${other}`)).headers.get("x-error-status"), "403");

    const listed = handler({ NOTION_TOKEN: "x", DEFAULT_DATABASE: ID, ALLOWED_DATABASES: other });
    assert.equal((await get(listed, "")).headers.get("x-error-status"), null, "default is added to the list");
    assert.equal((await get(listed, `db=${other}`)).headers.get("x-error-status"), null);

    const open = handler({ NOTION_TOKEN: "x", DEFAULT_DATABASE: ID, ALLOWED_DATABASES: "*" });
    assert.equal((await get(open, `db=${other}`)).headers.get("x-error-status"), null, "* allows any");
  });

  it("explains a missing token", async () => {
    const h = createHeatmapHandler({ env: readEnv({}), now });
    const res = await get(h, `db=${ID}&locale=ko`);
    assert.equal(res.headers.get("x-error-status"), "500");
    const body = await res.text();
    assert.match(body, /NOTION_TOKEN is not set/);
    assert.match(body, /잔디를 그리지 못했어요/);
  });
});

describe("package metadata", () => {
  it("matches package.json", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    assert.equal(PACKAGE.name, pkg.name);
    assert.equal(PACKAGE.version, pkg.version);
  });
});
