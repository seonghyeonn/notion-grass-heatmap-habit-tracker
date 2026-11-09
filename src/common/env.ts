export interface Env {
  notionToken: string | undefined;
  allowedDatabases: string[];
  defaultTimeZone: string;
  defaultLocale: string;
  defaultTheme: string;
  maxRows: number;
}

type RawEnv = Record<string, string | undefined>;

export function readEnv(raw: RawEnv = process.env): Env {
  const list = (value: string | undefined) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const maxRows = Number.parseInt(raw.MAX_ROWS ?? "", 10);
  return {
    notionToken: raw.NOTION_TOKEN?.trim() || undefined,
    allowedDatabases: list(raw.ALLOWED_DATABASES),
    defaultTimeZone: raw.DEFAULT_TIMEZONE?.trim() || "UTC",
    defaultLocale: raw.DEFAULT_LOCALE?.trim() || "en",
    defaultTheme: raw.DEFAULT_THEME?.trim() || "github",
    maxRows: Number.isFinite(maxRows) && maxRows > 0 ? maxRows : 5000,
  };
}
