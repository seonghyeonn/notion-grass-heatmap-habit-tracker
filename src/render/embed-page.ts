import { autoPair, themes, type ThemeName } from "../../themes/index.js";

/**
 * Notion's /embed shows URLs in an iframe. Wrapping the SVG in a page lets it
 * scale to fit the block (keeping its aspect ratio) and, once the block is too
 * narrow to stay readable, scroll horizontally to the newest week instead.
 *
 * With a picker, a gear button (visible on hover) lets each viewer switch the
 * theme. The choice is kept in that viewer's browser only, never on the server.
 */
const MIN_SCALE = 0.6;
const MAX_SCALE = 3;
const PADDING = 4;

export interface ThemePicker {
  /** Theme the page was rendered with. */
  current: string;
  labels: { button: string; heading: string; reset: string };
}

export function renderEmbedPage(svg: string, title: string, picker?: ThemePicker): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${escapeHtml(title)}</title>
<style>
html,body{margin:0;height:100%;background:transparent;overflow:hidden}
.wrap{box-sizing:border-box;height:100%;padding:${PADDING}px;overflow:auto}
.gp-stage{position:relative;display:inline-block;vertical-align:top}
.gp-card svg{display:block}
${picker ? PICKER_CSS : ""}
</style></head>
<body><div class="wrap"><div class="gp-stage"><div class="gp-card">${svg}</div>${picker ? pickerHtml(picker) : ""}</div></div>
<script>
const w=document.querySelector(".wrap"),card=document.querySelector(".gp-card");
function fit(){
  const s=card.querySelector("svg");if(!s)return;
  const W=+s.getAttribute("width"),H=+s.getAttribute("height");if(!W||!H)return;
  const k=Math.min(${MAX_SCALE},Math.max(${MIN_SCALE},Math.min((w.clientWidth-${PADDING * 2})/W,(w.clientHeight-${PADDING * 2})/H)));
  s.style.width=W*k+"px";s.style.height=H*k+"px";w.scrollLeft=w.scrollWidth;
}
fit();addEventListener("resize",fit);
${picker ? PICKER_JS : ""}
</script>
</body></html>`;
}

function pickerHtml({ current, labels }: ThemePicker): string {
  const option = (name: string, swatch: string) =>
    `<button type="button" role="menuitemradio" aria-checked="false" data-theme="${escapeHtml(name)}">` +
    `<span class="gp-sw" style="background:${swatch}"></span>${escapeHtml(name)}</button>`;
  const light = themes[autoPair.light];
  const dark = themes[autoPair.dark];
  const options = [
    option("auto", `linear-gradient(135deg,${light.bg} 50%,${dark.bg} 50%)`),
    ...(Object.keys(themes) as ThemeName[]).map((name) => {
      const t = themes[name];
      return option(name, `linear-gradient(135deg,${t.bg} 50%,${t.levels[2]} 50%)`);
    }),
  ].join("");
  return `<div class="gp-picker" data-current="${escapeHtml(current)}">
<button type="button" class="gp-gear" aria-label="${escapeHtml(labels.button)}" title="${escapeHtml(labels.button)}" aria-haspopup="menu" aria-expanded="false">${GEAR_ICON}</button>
<div class="gp-menu" role="menu" aria-label="${escapeHtml(labels.heading)}" hidden>
<div class="gp-heading">${escapeHtml(labels.heading)}</div>
<div class="gp-grid">${options}</div>
<button type="button" class="gp-reset" role="menuitemradio" aria-checked="false" data-theme="">${escapeHtml(labels.reset)}</button>
</div></div>`;
}

const GEAR_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

const PICKER_CSS = `
:root{--gp-bg:#ffffff;--gp-fg:#37352f;--gp-line:#0000001f;--gp-hover:#0000000f}
@media (prefers-color-scheme:dark){:root{--gp-bg:#252525;--gp-fg:#ffffffcf;--gp-line:#ffffff1f;--gp-hover:#ffffff14}}
.gp-gear{position:absolute;top:4px;right:4px;width:24px;height:24px;padding:0;display:grid;place-items:center;border-radius:50%;border:1px solid var(--gp-line);background:var(--gp-bg);color:var(--gp-fg);cursor:pointer;opacity:0;transition:opacity .15s}
body:hover .gp-gear,.gp-gear:focus-visible,.gp-open .gp-gear{opacity:1}
@media (hover:none){.gp-gear{opacity:.7}}
.gp-menu{position:fixed;z-index:1;box-sizing:border-box;min-width:220px;overflow:auto;padding:6px;border-radius:10px;border:1px solid var(--gp-line);background:var(--gp-bg);color:var(--gp-fg);box-shadow:0 6px 24px #0000003d;font:12px/1.2 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.gp-menu[hidden]{display:none}
.gp-heading{font-size:11px;font-weight:600;opacity:.6;margin:2px 6px 6px}
.gp-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px}
.gp-menu button{display:flex;align-items:center;gap:8px;width:100%;padding:6px;border:0;border-radius:6px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;white-space:nowrap}
.gp-menu button:hover,.gp-menu button:focus-visible{background:var(--gp-hover);outline:none}
.gp-menu button[aria-checked=true]{background:var(--gp-hover);font-weight:600}
.gp-sw{flex:none;width:14px;height:14px;border-radius:4px;border:1px solid var(--gp-line)}
.gp-reset{margin-top:4px;justify-content:center}`;

/** Runs after fit() is defined. Swaps only the SVG, so the page and its layout stay put. */
const PICKER_JS = `
(()=>{
const p=document.querySelector(".gp-picker"),gear=p.querySelector(".gp-gear"),menu=p.querySelector(".gp-menu");
const current=p.dataset.current,original=card.innerHTML;
const q=new URLSearchParams(location.search);q.delete("theme");q.sort();
const KEY="grass-theme:"+location.pathname+"?"+q;
const load=()=>{try{return localStorage.getItem(KEY)}catch{return null}};
const save=v=>{try{v?localStorage.setItem(KEY,v):localStorage.removeItem(KEY)}catch{}};
const mark=v=>menu.querySelectorAll("[data-theme]").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.theme===v)));
let seq=0;
async function show(name){
  const n=++seq;
  if(!name||name===current){card.innerHTML=original}
  else{
    const u=new URL(location.href);u.searchParams.set("theme",name);u.searchParams.set("format","svg");
    try{const r=await fetch(u);const t=await r.text();if(n!==seq||!r.ok||r.headers.get("x-error-status"))return;card.innerHTML=t}catch{return}
  }
  fit();
}
function toggle(open){
  menu.hidden=!open;p.classList.toggle("gp-open",open);gear.setAttribute("aria-expanded",String(open));
  if(!open)return;
  const r=gear.getBoundingClientRect(),top=Math.min(r.bottom+4,Math.max(4,innerHeight-menu.offsetHeight-4));
  menu.style.top=top+"px";menu.style.right=Math.max(4,innerWidth-r.right)+"px";menu.style.maxHeight=(innerHeight-top-4)+"px";
  (menu.querySelector("[aria-checked=true]")||menu.querySelector("button")).focus();
}
gear.addEventListener("click",e=>{e.stopPropagation();toggle(menu.hidden)});
menu.addEventListener("click",e=>{
  const b=e.target.closest("[data-theme]");if(!b)return;
  const name=b.dataset.theme;save(name);mark(name);show(name);toggle(false);gear.focus();
});
document.addEventListener("click",e=>{if(!menu.hidden&&!p.contains(e.target))toggle(false)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!menu.hidden){toggle(false);gear.focus()}});
const saved=load();mark(saved||"");
if(saved&&saved!==current){w.style.visibility="hidden";show(saved).finally(()=>{w.style.visibility=""})}
})();`;

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
