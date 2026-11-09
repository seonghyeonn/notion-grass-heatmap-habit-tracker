# Options

All options are URL query parameters on `/api/heatmap`. Invalid values produce an error card that names the problem.

## Defaults from environment variables

Every option can also be set once for the whole deployment with an environment variable, so the URL can stay short. The name is `DEFAULT_` plus the option in capitals, with two exceptions: `db` → `DEFAULT_DATABASE`, `tz` → `DEFAULT_TIMEZONE`. For example `weeks` → `DEFAULT_WEEKS`, `hide_legend` → `DEFAULT_HIDE_LEGEND`, `cache_seconds` → `DEFAULT_CACHE_SECONDS`.

- A value in the URL always wins over the environment (`&hide_legend=false` turns off `DEFAULT_HIDE_LEGEND=true`).
- `DEFAULT_FILTER` takes several filters separated by `;` (`Status:Done;Tag:!Archive`). Any `filter` in the URL replaces all of them.
- Bad values are reported the same way as bad URL values.
- After changing a variable on Vercel, redeploy for it to take effect.

With `DEFAULT_DATABASE` and `DEFAULT_FORMAT=html` set, the whole Notion embed URL is `https://<app>.vercel.app/api/heatmap`. You can still point the same deployment at another database with `?db=`.

## Data

| Parameter | Default | Description |
|---|---|---|
| `db` | required (or `DEFAULT_DATABASE`) | Database ID (32 hex, with or without dashes) or a full Notion link. `?v=` view IDs in links are ignored. A data source ID also works. |
| `date` | `created_time` | Which day an item belongs to. `created_time`, `last_edited_time`, or the **name** of a Date, Created time, Last edited time, date Formula or date Rollup property. Date-only values are used as written; timestamps are converted with `tz`. |
| `mode` | `presence` | `presence`: any item that day fills the cell with the strongest colour. `count`: number of items. `sum:<property>`: adds a Number (or number Formula/Rollup) property. `checkbox:<property>`: counts items whose checkbox is ticked. `count` and `sum` use four shades relative to the busiest visible day. |
| `filter` | | `<property>:<value>` keeps matching items; `<property>:!<value>` drops them. Repeat to combine (AND). Case-insensitive. Works with title, text, select, status, multi-select (any option), checkbox (`true`/`false`), number, url, email, phone and formula. |
| `tz` | `DEFAULT_TIMEZONE` or `UTC` | IANA time zone used to split days and to decide "today". |

## Layout

| Parameter | Default | Range | Description |
|---|---|---|---|
| `weeks` | `53` | 1–53 | Number of columns. 53 ≈ one year. |
| `week_start` | `sun` | `sun`, `mon` | First row of each column. |
| `cell` | `11` | 6–24 | Cell size in px. |
| `gap` | `3` | 0–8 | Space between cells in px. |
| `radius` | `2` | 0–12 | Corner radius; half the cell size makes circles. |
| `title` | locale default | | Card title. |
| `hide_title` | `false` | | |
| `hide_stats` | `false` | | Streak in the header and the summary line. |
| `hide_legend` | `false` | | Less → More scale. |
| `hide_labels` | `false` | | Month and weekday labels. |
| `hide_border` | `false` | | |

Booleans accept `1`, `true`, `yes`, `on`.

## Colours

| Parameter | Description |
|---|---|
| `theme` | A built-in theme ([list](themes.md)) or `auto` (Notion light/dark following the viewer's system setting). |
| `color` | One hex colour; generates the four activity shades from it. |
| `bg`, `border_color`, `title_color`, `text_color`, `empty_color` | Override single theme colours. Hex without `#` (`191919`, `fff`). |

## Output and caching

| Parameter | Default | Description |
|---|---|---|
| `format` | `svg` | `svg` for `<img>` and Markdown. `html` wraps the SVG in a page that scrolls to the newest week on narrow screens; best for Notion `/embed`. |
| `locale` | `DEFAULT_LOCALE` or `en` | `en`, `ko`. |
| `cache_seconds` | `1800` | CDN cache time, clamped to 300–86400. Errors are never cached. |

## Examples

```
# Memo habit: did I write anything today?
/api/heatmap?db=<id>&tz=Asia/Seoul&locale=ko&title=메모 잔디&theme=auto&format=html

# Reading log: pages per day from a Date property
/api/heatmap?db=<id>&date=날짜&mode=sum:읽은 페이지&theme=notion-dark&locale=ko

# Workouts from a daily journal, Monday weeks, last 6 months
/api/heatmap?db=<id>&date=Date&mode=checkbox:Workout&week_start=mon&weeks=26&theme=ocean

# Finished tasks, excluding one project
/api/heatmap?db=<id>&date=Completed&mode=count&filter=Status:Done&filter=Project:!Personal
```
