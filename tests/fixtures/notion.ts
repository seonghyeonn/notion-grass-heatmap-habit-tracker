import type { NotionPage, NotionProperty } from "../../src/sources/notion/types.js";

const title = (text: string): NotionProperty => ({ type: "title", title: [{ plain_text: text }] });

/** Builds a page with sensible defaults; override only what a test cares about. */
export function page(overrides: Partial<NotionPage> & { props?: Record<string, NotionProperty> } = {}): NotionPage {
  const { props, ...rest } = overrides;
  return {
    object: "page",
    id: "00000000-0000-0000-0000-000000000000",
    created_time: "2026-11-08T13:16:45.000Z",
    last_edited_time: "2026-11-08T13:16:45.000Z",
    properties: { Name: title("memo"), ...props },
    ...rest,
  };
}

export const prop = {
  title,
  date: (start: string | null): NotionProperty => ({ type: "date", date: start ? { start } : null }),
  number: (n: number | null): NotionProperty => ({ type: "number", number: n }),
  checkbox: (v: boolean): NotionProperty => ({ type: "checkbox", checkbox: v }),
  select: (name: string | null): NotionProperty => ({ type: "select", select: name ? { name } : null }),
  status: (name: string): NotionProperty => ({ type: "status", status: { name } }),
  multi: (...names: string[]): NotionProperty => ({ type: "multi_select", multi_select: names.map((name) => ({ name })) }),
  formulaDate: (start: string): NotionProperty => ({ type: "formula", formula: { type: "date", date: { start } } }),
  formulaNumber: (n: number): NotionProperty => ({ type: "formula", formula: { type: "number", number: n } }),
  text: (s: string): NotionProperty => ({ type: "rich_text", rich_text: [{ plain_text: s }] }),
};
