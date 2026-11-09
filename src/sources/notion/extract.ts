import { toDateKey } from "../../core/dates.js";
import { OptionError } from "../../common/errors.js";
import type { ActivityRecord, DateKey } from "../../core/types.js";
import type { DateField, FilterRule, ValueMode } from "../../options/schema.js";
import type { NotionPage, NotionProperty } from "./types.js";

/** Turns one Notion page into a dated value, or null when it should be ignored. */
export function pageToRecord(
  page: NotionPage,
  spec: { dateField: DateField; mode: ValueMode; filters: FilterRule[]; timeZone: string },
): ActivityRecord | null {
  if (page.in_trash || page.archived) return null;
  if (!spec.filters.every((rule) => matchesFilter(page, rule))) return null;

  const date = dateOf(page, spec.dateField, spec.timeZone);
  if (!date) return null;

  const value = valueOf(page, spec.mode);
  return value > 0 ? { date, value } : null;
}

export function dateOf(page: NotionPage, field: DateField, timeZone: string): DateKey | null {
  if (field.kind === "created_time") return toDateKey(page.created_time, timeZone);
  if (field.kind === "last_edited_time") return toDateKey(page.last_edited_time, timeZone);

  const prop = property(page, field.name);
  const raw = dateString(prop);
  if (raw === undefined) {
    throw new OptionError(
      `Property "${field.name}" is a ${prop.type}, not a date.`,
      "Use a Date, Created time, Last edited time or date Formula property.",
    );
  }
  return raw ? toDateKey(raw, timeZone) : null;
}

export function valueOf(page: NotionPage, mode: ValueMode): number {
  switch (mode.kind) {
    case "presence":
    case "count":
      return 1;
    case "checkbox": {
      const prop = property(page, mode.property);
      const checked = prop.type === "checkbox" ? prop.checkbox : formulaValue(prop);
      if (typeof checked !== "boolean") {
        throw new OptionError(`Property "${mode.property}" is a ${prop.type}, not a checkbox.`);
      }
      return checked ? 1 : 0;
    }
    case "sum": {
      const prop = property(page, mode.property);
      const number = numberOf(prop);
      if (number === undefined) {
        throw new OptionError(`Property "${mode.property}" is a ${prop.type}, not a number.`);
      }
      return Math.max(0, number ?? 0);
    }
  }
}

export function matchesFilter(page: NotionPage, rule: FilterRule): boolean {
  const wanted = normalise(rule.value);
  const hit = comparableValues(property(page, rule.property)).some((v) => normalise(v) === wanted);
  return rule.negate ? !hit : hit;
}

function property(page: NotionPage, name: string): NotionProperty {
  const prop = page.properties[name];
  if (!prop) {
    const known = Object.keys(page.properties).join(", ");
    throw new OptionError(`Property "${name}" was not found.`, `Available: ${known}`);
  }
  return prop;
}

/** undefined = wrong type, null = right type but empty. */
function dateString(prop: NotionProperty): string | null | undefined {
  switch (prop.type) {
    case "date":
      return (prop.date as { start?: string } | null)?.start ?? null;
    case "created_time":
      return (prop.created_time as string | null) ?? null;
    case "last_edited_time":
      return (prop.last_edited_time as string | null) ?? null;
    case "formula": {
      const f = prop.formula as { type: string; date?: { start?: string } | null };
      return f.type === "date" ? (f.date?.start ?? null) : undefined;
    }
    case "rollup": {
      const r = prop.rollup as { type: string; date?: { start?: string } | null };
      return r.type === "date" ? (r.date?.start ?? null) : undefined;
    }
    default:
      return undefined;
  }
}

/** undefined = wrong type, null = right type but empty. */
function numberOf(prop: NotionProperty): number | null | undefined {
  if (prop.type === "number") return (prop.number as number | null) ?? null;
  if (prop.type === "formula" || prop.type === "rollup") {
    const inner = (prop.type === "formula" ? prop.formula : prop.rollup) as { type: string; number?: number | null };
    return inner.type === "number" ? (inner.number ?? null) : undefined;
  }
  return undefined;
}

function formulaValue(prop: NotionProperty): unknown {
  if (prop.type !== "formula") return undefined;
  const f = prop.formula as Record<string, unknown> & { type: string };
  return f[f.type];
}

/** Every string a filter value could reasonably be compared with. */
function comparableValues(prop: NotionProperty): string[] {
  const plain = (rich: unknown) =>
    ((rich as { plain_text?: string }[] | undefined) ?? []).map((t) => t.plain_text ?? "").join("");
  switch (prop.type) {
    case "title":
      return [plain(prop.title)];
    case "rich_text":
      return [plain(prop.rich_text)];
    case "select":
    case "status":
      return [(prop[prop.type] as { name?: string } | null)?.name ?? ""];
    case "multi_select":
      return ((prop.multi_select as { name: string }[] | undefined) ?? []).map((o) => o.name);
    case "checkbox":
      return [String(prop.checkbox)];
    case "number":
      return [String(prop.number ?? "")];
    case "url":
    case "email":
    case "phone_number":
      return [String(prop[prop.type] ?? "")];
    case "formula":
      return [String(formulaValue(prop) ?? "")];
    default:
      return [];
  }
}

function normalise(value: string): string {
  return value.trim().toLowerCase();
}
