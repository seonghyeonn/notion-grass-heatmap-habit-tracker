# Contributing

Thanks for helping. Small, focused pull requests are easiest to review.

## Setup

```bash
npm install
npm run check     # must pass before a PR
npm run preview   # look at examples/*.svg after visual changes
```

## Where things go

| You want to… | Edit |
|---|---|
| Add a theme | `themes/index.ts`, `scripts/preview.ts`, `docs/themes.md` |
| Add a language | `src/i18n/<code>.ts`, register it in `src/i18n/index.ts` and `Locale` in `src/options/schema.ts` |
| Add an option | `src/options/schema.ts` + `parse.ts`, then use it in `src/render/` or `src/heatmap.ts`; document it in `docs/options.md` |
| Support another data source (CSV, Sheets, GitHub…) | Implement `ActivitySource` in `src/sources/`; the rest of the pipeline is unchanged |
| Change how the card looks | `src/render/components/` (layout numbers live in `src/render/layout.ts`) |

## Rules of thumb

- `src/core/` stays pure: no I/O, no Notion types, no rendering.
- Components read from `RenderModel` only and use CSS classes for colour, so `theme=auto` keeps working.
- Escape any user text with the helpers in `src/render/svg.ts`.
- Every bug fix comes with a test in `tests/`.
- Never log or echo `NOTION_TOKEN`.
