#!/usr/bin/env node
/* Source-literal i18n scanner —  node tools/i18n/scan_source.js
 *
 * High-precision scan for English UI string literals in the JS app region that
 * flow to the DOM (innerHTML/textContent/insertAdjacentHTML/return-of-html/template
 * concat) but are NOT wrapped in t()/tf() and are NOT already a dict key.
 *
 * Why this exists: rendering the app with one sample dataset only surfaces the
 * branches that dataset triggers — conditional copy (e.g. a mission that needs
 * loan>0, a tax label only the US path emits) stays invisible and ships in English.
 * This reads the SOURCE instead, so every branch is covered regardless of data.
 * Review the candidates, wrap real UI strings in t()/tf(), then run sync.js. */
const fs=require('fs');
const path=require('path');
const src=fs.readFileSync(path.resolve(__dirname,'../../index.html'),'utf8');
const lines=src.split('\n');
const autoEnd = src.indexOf('/* <<< AUTO-MERGED FULL UI TRANSLATIONS <<< */');
const autoEndLine = src.slice(0,autoEnd).split('\n').length;

// build dict key set (so we can mark "already a known UI key")
const di=src.indexOf('AUTO-MERGED FULL UI TRANSLATIONS (generated) >>> */');
const seg=src.slice(di, src.indexOf('<<< AUTO-MERGED', di));
let dictKeys=new Set();
try{ const extra=JSON.parse(seg.slice(seg.indexOf('})(')+3, seg.lastIndexOf(');')).trim());
  for(const L in extra) for(const k in extra[L]) dictKeys.add(k);
}catch(e){}
// base I18N keys too
const baseSeg=src.slice(src.indexOf('var I18N = {'), di);
(baseSeg.match(/"((?:\\.|[^"\\])*)"\s*:/g)||[]).forEach(m=>{try{dictKeys.add(JSON.parse(m.slice(0,-1)));}catch(e){}});
const norm=s=>s.replace(/\d[\d.,:]*/g,'#');

const LIT=/(['"`])((?:\\.|(?!\1).){4,}?)\1/g;
function wordy(s){
  const words=s.match(/[A-Za-z]{2,}/g)||[];
  if(words.length<2) return false;
  if(!/\s/.test(s.trim())) return false;
  if(/https?:|<\/?[a-z]+[ />]|rgba?\(|^[a-z-]+:\s|px\b|em\b|#[0-9a-f]{3,6}/i.test(s)) return false;
  return true;
}
const out=[];
for(let i=autoEndLine;i<lines.length;i++){
  const line=lines[i], ln=i+1;
  if(/^\s*\/\//.test(line)) continue;
  if(/console\.(log|warn|error)|data-i18n-skip|throw new|new Error/.test(line)) continue;
  // must be a DOM-output / user-facing context on this line
  if(!/innerHTML|textContent|insertAdjacent|\.html|outerHTML|return\s+['"`]|\+=|placeholder|title=|alert\(|\.push\(|add\(|tf?\(|\.title\b|setAttribute\(['"]title|label:|name:|detail:|msg|text:/.test(line)) continue;
  let m; LIT.lastIndex=0;
  while((m=LIT.exec(line))){
    const body=m[2];
    if(!wordy(body)) continue;
    const before=line.slice(Math.max(0,m.index-6), m.index);
    if(/\bt\(\s*$/.test(before)||/\btf\(\s*$/.test(before)) continue;   // wrapped
    if(dictKeys.has(body)||dictKeys.has(norm(body))) continue;          // already a known key
    if(/getAttribute|querySelector|addEventListener|classList|dataset|\.id=|className|style\.|JSON\.|localStorage|\bvar\b.*=.*['"]#/.test(line)) continue;
    // looks like a css selector / html attr value?
    if(/^[.#]?[a-z]+[ -][a-z]+$/.test(body) && body.split(' ').length<=3 && !/[A-Z.,!?]/.test(body)) {
      // could be className like "btn ghost" — skip if no sentence punctuation/caps
      if(!/[A-Z]/.test(body)) continue;
    }
    out.push({ln, body: body.length>90?body.slice(0,90)+'…':body, ctx: line.trim().slice(0,120)});
  }
}
const seen=new Set(), uniq=[];
for(const o of out){ if(seen.has(o.body))continue; seen.add(o.body); uniq.push(o);}
console.log('JS-region unwrapped UI candidates:', uniq.length,'\n');
uniq.forEach(o=>console.log(o.ln+'  '+JSON.stringify(o.body)+'\n     '+o.ctx+'\n'));
