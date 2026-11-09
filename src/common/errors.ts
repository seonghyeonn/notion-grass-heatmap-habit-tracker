/** Base error carrying an HTTP status and a stable code shown on the error card. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly hint?: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class OptionError extends AppError {
  constructor(message: string, hint?: string) {
    super(message, 400, "invalid_option", hint);
  }
}

export class AccessError extends AppError {
  constructor(message: string, hint?: string) {
    super(message, 403, "forbidden", hint);
  }
}

export class ConfigError extends AppError {
  constructor(message: string, hint?: string) {
    super(message, 500, "config", hint);
  }
}

export class NotionApiError extends AppError {
  constructor(status: number, notionCode: string, message: string) {
    super(message, status, `notion_${notionCode}`, NotionApiError.hintFor(status));
  }

  private static hintFor(status: number): string | undefined {
    if (status === 401) return "Check NOTION_TOKEN on your deployment.";
    if (status === 404) return "Share the database with your integration (••• → Connections).";
    if (status === 429) return "Notion rate limit reached. Try again shortly.";
    return undefined;
  }
}
