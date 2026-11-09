/** The small subset of the Notion API shapes this project reads. */

export interface NotionPage {
  object: "page";
  id: string;
  created_time: string;
  last_edited_time: string;
  in_trash?: boolean;
  archived?: boolean;
  properties: Record<string, NotionProperty>;
}

export type NotionProperty = { type: string; [key: string]: unknown };

export interface QueryResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface DatabaseResponse {
  object: "database";
  id: string;
  data_sources?: { id: string; name?: string }[];
}

export interface NotionErrorBody {
  object: "error";
  status: number;
  code: string;
  message: string;
}
