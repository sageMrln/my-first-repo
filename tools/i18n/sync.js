#!/usr/bin/env node
/* i18n drift detector — run after ANY edit that adds or changes UI text.
 *
 *   node tools/i18n/sync.js
 *
 * It scans ../../index.html for:
 *   1. every  t('...') / t("...")  literal key, and
 *   2. every  WHATS_NEW  item,
 * then compares them against the live translation dictionary (the base I18N
 * object plus the AUTO-MERGED block) and prints/writes every string that is
 * NOT yet translated. Hand the resulting need_translate.json to the translation
 * step (one pass per language) and merge the results back into the AUTO-MERGED
 * block. If this prints "MISSING: 0", the UI is fully translatable.
 *
 * The supported languages are: es, da, de, sv, nb, hu  (en is the source).
 */
const fs = require('fs');
const path = require('path');
const HTML = path.resolve(__dirname, '../../index.html');
const OUT = path.resolve(__dirname, 'need_translate.json');
const LANGS = ['es', 'da', 'de', 'sv', 'nb', 'hu'];
const src = fs.readFileSync(HTML, 'utf8');

// 1) t('...') / t("...") literal keys
const keys = new Set();
const re = /\b(?:t|tf)\(\s*('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")\s*[),]/g;
let m;
while ((m = re.exec(src))) {
  const q = m[1][0];
  let body = m[1].slice(1, -1)
    .replace(new RegExp('\\\\' + q, 'g'), q)
    .replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  if (/[A-Za-zÀ-ÿ]/.test(body)) keys.add(body);
}
// 2) WHATS_NEW items (release-note popup)
const wn = src.match(/var WHATS_NEW\s*=\s*\{[\s\S]*?items:\s*\[([\s\S]*?)\]/);
if (wn) {
  const items = wn[1].match(/(['"])(?:\\.|(?!\1).)*\1/g) || [];
  items.forEach(lit => {
    const q = lit[0];
    const body = lit.slice(1, -1).replace(new RegExp('\\\\' + q, 'g'), q).replace(/\\\\/g, '\\');
    if (/[A-Za-zÀ-ÿ]/.test(body)) keys.add(body);
  });
}

// live dictionary: the AUTO-MERGED block (pure JSON) + base-section keys
const dict = {};
LANGS.forEach(L => (dict[L] = {}));
const s = src.indexOf('AUTO-MERGED FULL UI TRANSLATIONS (generated) >>> */');
if (s >= 0) {
  const seg = src.slice(s, src.indexOf('<<< AUTO-MERGED', s));
  const open = seg.indexOf('})(') + 3, close = seg.lastIndexOf(');');
  try {
    const extra = JSON.parse(seg.slice(open, close).trim());
    for (const L in extra) Object.assign(dict[L], extra[L]);
  } catch (e) { console.error('could not parse AUTO-MERGED block:', e.message); }
}
// a key is fully covered only when EVERY language has it — a key present in just
// one language (an old partial batch) still shows English to everyone else, which
// is exactly the "stuck in English on her phone" class of bug. Check per-language.
const langsMissing = k => LANGS.filter(L => !Object.prototype.hasOwnProperty.call(dict[L], k));
const have = k => langsMissing(k).length === 0;

const missing = [...keys].filter(k => !have(k));
fs.writeFileSync(OUT, JSON.stringify(missing, null, 1));
console.log('translatable keys in source :', keys.size);
console.log('fully translated (all langs):', keys.size - missing.length);
console.log('MISSING                     :', missing.length, missing.length ? '(written to ' + path.relative(process.cwd(), OUT) + ')' : '✓ fully translated');
missing.slice(0, 80).forEach(x => console.log('  - ' + JSON.stringify(x.length > 80 ? x.slice(0, 80) + '…' : x) + '  ✗ ' + langsMissing(x).join(',')));
process.exit(missing.length ? 1 : 0);
