export interface Env {
  notionToken: string | undefined;
  allowedDatabases: string[];
  /** URL parameter → default value from the environment (only the ones that are set). */
  defaults: Record<string, string>;
  defaultTimeZone: string;
  defaultLocale: string;
  defaultTheme: string;
  maxRows: number;
}

type RawEnv = Record<string, string | undefined>;

/** Every URL parameter that can also be set once for the whole deployment. */
const PARAMS = [
  "db", "date", "mode", "filter", "weeks", "week_start", "tz", "locale", "theme",
  "color", "bg", "border_color", "title_color", "text_color", "empty_color", "title",
  "hide_title", "hide_stats", "hide_legend", "hide_labels", "hide_border",
  "cell", "gap", "radius", "format", "cache_seconds",
] as const;

const RENAMED: Record<string, string> = { db: "DEFAULT_DATABASE", tz: "DEFAULT_TIMEZONE" };

/** URL parameter → environment variable, e.g. weeks → DEFAULT_WEEKS. */
export const DEFAULT_ENV_NAMES: Record<string, string> = Object.fromEntries(
  PARAMS.map((param) => [param, RENAMED[param] ?? `DEFAULT_${param.toUpperCase()}`]),
);

export function readEnv(raw: RawEnv = process.env): Env {
  const list = (value: string | undefined) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const defaults: Record<string, string> = {};
  for (const [param, name] of Object.entries(DEFAULT_ENV_NAMES)) {
    const value = raw[name]?.trim();
    if (value) defaults[param] = value;
  }

  const maxRows = Number.parseInt(raw.MAX_ROWS ?? "", 10);
  return {
    notionToken: raw.NOTION_TOKEN?.trim() || undefined,
    allowedDatabases: list(raw.ALLOWED_DATABASES),
    defaults,
    defaultTimeZone: defaults.tz ?? "UTC",
    defaultLocale: defaults.locale ?? "en",
    defaultTheme: defaults.theme ?? "github",
    maxRows: Number.isFinite(maxRows) && maxRows > 0 ? maxRows : 5000,
  };
}
