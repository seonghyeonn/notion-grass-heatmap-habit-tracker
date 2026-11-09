/**
 * Notion's /embed shows URLs in an iframe. Wrapping the SVG in a page lets it
 * scale to the block width and scroll to the newest week on narrow screens.
 */
export function renderEmbedPage(svg: string, title: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title.replace(/</g, "&lt;")}</title>
<style>
html,body{margin:0;background:transparent}
.wrap{overflow-x:auto;padding:4px}
.wrap svg{display:block;max-width:none;height:auto}
</style></head>
<body><div class="wrap">${svg}</div>
<script>const w=document.querySelector(".wrap");w.scrollLeft=w.scrollWidth;</script>
</body></html>`;
}
