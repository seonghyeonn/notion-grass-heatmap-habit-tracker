# Deploy

## Vercel (recommended)

1. Fork this repository.
2. Import it at [vercel.com/new](https://vercel.com/new). No framework preset is needed; `api/index.ts` is picked up automatically.
3. Environment variables:

| Name | Required | Description |
|---|---|---|
| `NOTION_TOKEN` | yes | Internal integration secret (`ntn_…`). Read content permission is enough. |
| `ALLOWED_DATABASES` | recommended | Comma-separated database IDs or links this deployment may read. Empty = any database shared with the integration. |
| `DEFAULT_TIMEZONE` | no | e.g. `Asia/Seoul`. Used when a request has no `tz`. |
| `DEFAULT_LOCALE` | no | `en` or `ko`. |
| `DEFAULT_THEME` | no | Any theme name or `auto`. |
| `DEFAULT_DATABASE`, `DEFAULT_FORMAT`, `DEFAULT_WEEKS`, … | no | A default for any URL option. See [options.md](options.md#defaults-from-environment-variables). |
| `MAX_ROWS` | no | Upper bound of rows read per request (default 5000). |

4. Deploy, then open `/api/status`. You should see `"ok": true` and your integration name.

### How it runs

- `vercel.json` rewrites `/` and `/api/*` to the single function in `api/index.ts`, which routes by path (`/api/heatmap`, `/api/status`). This follows Vercel's guidance for projects without a framework: one function that can be reused across routes.
- Responses carry `Cache-Control: s-maxage=<cache_seconds>, stale-while-revalidate=86400`, so the CDN serves most views without touching Notion.
- Within one warm instance, identical data queries are memoised for `cache_seconds`, so several embeds of one database with different themes cost one Notion query.

## Notion side

- The database must be shared with the integration (`•••` → *Connections*). Otherwise you will see `notion_object_not_found`.
- Notion API version `2025-09-03` is used. A database link resolves to its first data source. For databases with several data sources, pass the data source ID as `db`.
- Rows are read newest first. When the date is `created_time` or `last_edited_time`, only the visible window is requested from Notion. For property dates every row is read up to `MAX_ROWS`.

## Embedding in Notion

`/embed` → paste `https://<app>.vercel.app/api/heatmap?db=…&format=html`.

- `format=html` scales to the block and scrolls to the latest week on phones.
- `theme=auto` follows the **viewer's operating system** colour scheme, not Notion's own theme switch. If you always use Notion in dark mode, choose `theme=notion-dark` explicitly.
- Updates appear after `cache_seconds` (default 30 minutes). Lower it for faster refresh at the cost of more Notion requests.

## Troubleshooting

| Card says | Fix |
|---|---|
| `NOTION_TOKEN is not set` | Add the variable and redeploy. |
| `notion_unauthorized` | Token is wrong or was regenerated. |
| `notion_object_not_found` | Share the database with the integration. |
| `This database is not enabled on this deployment` | Add it to `ALLOWED_DATABASES`. |
| `Property "X" was not found` | Property names are case- and space-sensitive; the card lists the available ones. |
| `notion_rate_limited` | Raise `cache_seconds`; Notion allows about three requests per second per integration. |
