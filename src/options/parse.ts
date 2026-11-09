import { isValidTimeZone } from "../core/dates.js";
import { isHexColor, toHex } from "../common/color.js";
import { OptionError } from "../common/errors.js";
import { normalizeNotionId } from "../common/notion-id.js";
import type { Env } from "../common/env.js";
import { isThemeName } from "../../themes/index.js";
import {
  COLOR_PARAMS,
  LIMITS,
  type DateField,
  type FilterRule,
  type HeatmapOptions,
  type Locale,
  type ValueMode,
} from "./schema.js";

const TRUE = new Set(["1", "true", "yes", "on"]);

export function parseOptions(params: URLSearchParams, env: Env): HeatmapOptions {
  const read = (name: string) => params.get(name)?.trim() || undefined;

  const rawDb = read("db") ?? read("database");
  if (!rawDb) throw new OptionError("Missing `db` parameter.", "Pass a Notion database ID or URL as ?db=");
  const databaseId = normalizeNotionId(rawDb);
  if (!databaseId) throw new OptionError("`db` is not a valid Notion ID.", "Copy the database link and paste it as ?db=");

  const timeZone = read("tz") ?? env.defaultTimeZone;
  if (!isValidTimeZone(timeZone)) throw new OptionError(`Unknown time zone "${timeZone}".`, "Use an IANA name such as Asia/Seoul.");

  const themeName = read("theme") ?? env.defaultTheme;
  if (themeName !== "auto" && !isThemeName(themeName)) {
    throw new OptionError(`Unknown theme "${themeName}".`, "See docs/themes.md for the list.");
  }

  const format = read("format") ?? "svg";
  if (format !== "svg" && format !== "html") throw new OptionError("`format` must be svg or html.");

  const weekStart = read("week_start") ?? "sun";
  if (weekStart !== "sun" && weekStart !== "mon") throw new OptionError("`week_start` must be sun or mon.");

  return {
    databaseId,
    dateField: parseDateField(read("date")),
    mode: parseMode(read("mode")),
    filters: params.getAll("filter").map(parseFilter),
    weeks: int(params, "weeks", LIMITS.weeks),
    weekStart,
    timeZone,
    locale: parseLocale(read("locale") ?? env.defaultLocale),
    theme: themeName,
    colors: parseColors(params),
    title: read("title"),
    hideTitle: flag(params, "hide_title"),
    hideStats: flag(params, "hide_stats"),
    hideLegend: flag(params, "hide_legend"),
    hideLabels: flag(params, "hide_labels"),
    hideBorder: flag(params, "hide_border"),
    cellSize: int(params, "cell", LIMITS.cellSize),
    gap: int(params, "gap", LIMITS.gap),
    radius: int(params, "radius", LIMITS.radius),
    format,
    cacheSeconds: int(params, "cache_seconds", LIMITS.cacheSeconds, { clamp: true }),
  };
}

function parseDateField(value: string | undefined): DateField {
  if (!value || value === "created_time") return { kind: "created_time" };
  if (value === "last_edited_time") return { kind: "last_edited_time" };
  return { kind: "property", name: value };
}

/** presence | count | sum:<number property> | checkbox:<checkbox property> */
function parseMode(value: string | undefined): ValueMode {
  if (!value || value === "presence") return { kind: "presence" };
  if (value === "count") return { kind: "count" };
  const [kind, ...rest] = value.split(":");
  const property = rest.join(":").trim();
  if ((kind === "sum" || kind === "checkbox") && property) return { kind, property };
  throw new OptionError(`Unknown mode "${value}".`, "Use presence, count, sum:<property> or checkbox:<property>.");
}

/** "<property>:<value>" matches, "<property>:!<value>" excludes. */
function parseFilter(raw: string): FilterRule {
  const index = raw.indexOf(":");
  if (index <= 0) throw new OptionError(`Invalid filter "${raw}".`, "Use filter=<property>:<value>.");
  const property = raw.slice(0, index).trim();
  let value = raw.slice(index + 1).trim();
  const negate = value.startsWith("!");
  if (negate) value = value.slice(1).trim();
  return { property, value, negate };
}

function parseLocale(value: string): Locale {
  if (value === "en" || value === "ko") return value;
  throw new OptionError(`Unsupported locale "${value}".`, "Use en or ko.");
}

function parseColors(params: URLSearchParams): HeatmapOptions["colors"] {
  const colors: HeatmapOptions["colors"] = {};
  const color = (name: string) => {
    const value = params.get(name)?.trim();
    if (!value) return undefined;
    if (!isHexColor(value)) throw new OptionError(`\`${name}\` must be a hex colour like 2ea043.`);
    return toHex(value);
  };
  for (const [param, key] of Object.entries(COLOR_PARAMS)) {
    const value = color(param);
    if (value) colors[key] = value;
  }
  const accent = color("color");
  if (accent) colors.accent = accent;
  return colors;
}

function flag(params: URLSearchParams, name: string): boolean {
  return TRUE.has((params.get(name) ?? "").toLowerCase());
}

function int(
  params: URLSearchParams,
  name: string,
  limits: { min: number; max: number; default: number },
  { clamp = false } = {},
): number {
  const raw = params.get(name);
  if (raw === null || raw.trim() === "") return limits.default;
  const value = Number(raw);
  if (!Number.isInteger(value)) throw new OptionError(`\`${name}\` must be a whole number.`);
  if (clamp) return Math.min(limits.max, Math.max(limits.min, value));
  if (value < limits.min || value > limits.max) {
    throw new OptionError(`\`${name}\` must be between ${limits.min} and ${limits.max}.`);
  }
  return value;
}
