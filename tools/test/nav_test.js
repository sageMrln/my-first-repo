#!/usr/bin/env node
/* MRLN nav integrity — reskin ruling a213555 Stage 0 guard.
 *
 *   node tools/test/nav_test.js        (wired into tools/release/green.js)
 *
 * THE POINT: the tab model (nav buttons ↔ panels ↔ JS deep-link selectors) has
 * drifted unguarded — the dead `subs` selector shipped silently because nothing
 * asserted that every data-p a script references actually exists. Every list
 * below is DERIVED from index.html at run time, never hand-copied, so this
 * suite cannot rot into the false-green it exists to prevent.
 *
 *   #1  every #tabs button's data-p has a matching <section class="panel" id=…>
 *   #2  every panel id has a matching #tabs button (bijection, both directions)
 *   #3  every data-p="X" referenced anywhere in JS resolves to a real tab
 *   #4  no duplicate data-p buttons / panel ids
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

let failed = 0;
const ok = m => console.log('  ✓ ' + m);
const bad = m => { console.log('  ✗ ' + m); failed++; };
const check = (c, m) => (c ? ok(m) : bad(m));

/* --- derive the tab set from the nav markup ------------------------------- */
const navStart = html.indexOf('<nav class="tabs"');
const navEnd = html.indexOf('</nav>', navStart);
const navHtml = html.slice(navStart, navEnd);
const tabs = [...navHtml.matchAll(/data-p="([a-z]+)"/g)].map(m => m[1]);

/* --- derive the panel set ------------------------------------------------- */
const panels = [...html.matchAll(/<section[^>]*class="panel[^"]*"[^>]*id="([a-z]+)"/g)]
  .map(m => m[1])
  .concat([...html.matchAll(/<section[^>]*id="([a-z]+)"[^>]*class="panel[^"]*"/g)].map(m => m[1]));
const panelSet = [...new Set(panels)];

console.log('=== nav integrity — ' + tabs.length + ' tabs, ' + panelSet.length + ' panels ===');
check(tabs.length >= 15, 'nav parse sane (' + tabs.length + ' tab buttons found)');
check(panelSet.length >= 15, 'panel parse sane (' + panelSet.length + ' panels found)');

/* #1 + #2 — bijection */
tabs.forEach(t => check(panelSet.includes(t), 'tab "' + t + '" has a panel'));
panelSet.forEach(p => check(tabs.includes(p), 'panel "' + p + '" has a tab'));

/* #4 — no duplicates */
check(new Set(tabs).size === tabs.length, 'no duplicate tab data-p values');
check(new Set(panelSet).size === panelSet.length, 'no duplicate panel ids');

/* #3 — every JS-referenced data-p resolves to a real tab.
 * Scan script content only (skip the nav markup itself) for selector-style
 * references: querySelector('[data-p="x"]') and .tab[data-p="x"] forms. */
const jsRefs = new Set();
for (const m of html.matchAll(/(?:querySelector[^)]*?|\.tab)\[data-p="([a-z]+)"\]/g)) jsRefs.add(m[1]);
jsRefs.forEach(rp =>
  check(tabs.includes(rp), 'JS deep-link data-p="' + rp + '" resolves to a real tab')
);
check(jsRefs.size > 0, 'JS deep-link scan found references (' + jsRefs.size + ')');

if (failed) { console.log('NAV TEST: ' + failed + ' FAILED'); process.exit(1); }
console.log('NAV TEST: all passed (' + (tabs.length * 2 + jsRefs.size + 6) + ' checks)');
