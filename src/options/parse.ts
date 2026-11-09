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

/** Reads one option: the URL wins, then the deployment's DEFAULT_* variable. */
type Read = (name: string) => string | undefined;

export function parseOptions(params: URLSearchParams, env: Env): HeatmapOptions {
  const read: Read = (name) => params.get(name)?.trim() || env.defaults[name];

  const rawDb = params.get("db")?.trim() || params.get("database")?.trim() || env.defaults.db;
  if (!rawDb) {
    throw new OptionError("Missing `db` parameter.", "Pass a Notion database ID or URL as ?db=, or set DEFAULT_DATABASE.");
  }
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
    filters: parseFilters(params, env),
    weeks: int(read, "weeks", LIMITS.weeks),
    weekStart,
    timeZone,
    locale: parseLocale(read("locale") ?? env.defaultLocale),
    theme: themeName,
    colors: parseColors(read),
    title: read("title"),
    hideTitle: flag(read, "hide_title"),
    hideStats: flag(read, "hide_stats"),
    hideLegend: flag(read, "hide_legend"),
    hideLabels: flag(read, "hide_labels"),
    hideBorder: flag(read, "hide_border"),
    cellSize: int(read, "cell", LIMITS.cellSize),
    gap: int(read, "gap", LIMITS.gap),
    radius: int(read, "radius", LIMITS.radius),
    format,
    cacheSeconds: int(read, "cache_seconds", LIMITS.cacheSeconds, { clamp: true }),
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

/** URL filters replace the default ones; DEFAULT_FILTER separates several with `;`. */
function parseFilters(params: URLSearchParams, env: Env): FilterRule[] {
  const fromUrl = params.getAll("filter").map((raw) => raw.trim()).filter(Boolean);
  const raws = fromUrl.length > 0 ? fromUrl : (env.defaults.filter ?? "").split(";").map((raw) => raw.trim()).filter(Boolean);
  return raws.map(parseFilter);
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

function parseColors(read: Read): HeatmapOptions["colors"] {
  const colors: HeatmapOptions["colors"] = {};
  const color = (name: string) => {
    const value = read(name);
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

function flag(read: Read, name: string): boolean {
  return TRUE.has((read(name) ?? "").toLowerCase());
}

function int(
  read: Read,
  name: string,
  limits: { min: number; max: number; default: number },
  { clamp = false } = {},
): number {
  const raw = read(name);
  if (raw === undefined) return limits.default;
  const value = Number(raw);
  if (!Number.isInteger(value)) throw new OptionError(`\`${name}\` must be a whole number.`);
  if (clamp) return Math.min(limits.max, Math.max(limits.min, value));
  if (value < limits.min || value > limits.max) {
    throw new OptionError(`\`${name}\` must be between ${limits.min} and ${limits.max}.`);
  }
  return value;
}
