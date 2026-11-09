/**
 * Notion's /embed shows URLs in an iframe. Wrapping the SVG in a page lets it
 * scale to fit the block (keeping its aspect ratio) and, once the block is too
 * narrow to stay readable, scroll horizontally to the newest week instead.
 */
const MIN_SCALE = 0.6;
const MAX_SCALE = 3;
const PADDING = 4;

export function renderEmbedPage(svg: string, title: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${title.replace(/</g, "&lt;")}</title>
<style>
html,body{margin:0;height:100%;background:transparent;overflow:hidden}
.wrap{box-sizing:border-box;height:100%;padding:${PADDING}px;overflow:auto}
.wrap svg{display:block}
</style></head>
<body><div class="wrap">${svg}</div>
<script>
const w=document.querySelector(".wrap"),s=w.querySelector("svg");
const W=+s.getAttribute("width")||s.getBoundingClientRect().width,H=+s.getAttribute("height")||s.getBoundingClientRect().height;
function fit(){
  const k=Math.min(${MAX_SCALE},Math.max(${MIN_SCALE},Math.min((w.clientWidth-${PADDING * 2})/W,(w.clientHeight-${PADDING * 2})/H)));
  s.style.width=W*k+"px";s.style.height=H*k+"px";w.scrollLeft=w.scrollWidth;
}
fit();addEventListener("resize",fit);
</script>
</body></html>`;
}
