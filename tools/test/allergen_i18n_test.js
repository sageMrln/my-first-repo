/* ===========================================================================
   allergen_i18n_test.js — does the dislike filter work in the six non-English
   languages the app actually ships?
   Owner: Hugo (QA). Council stage A0, ruling
   team/council/2026-08-05-theming-and-singapore.md §4 (row A0) and §5.

   THE CLAIM UNDER TEST
   --------------------
   GUIDE.md and index.html both promise the user that a dislike is never
   suggested. index.html:5270 filters the pool with `mealMatchesText`, and
   index.html:2180 tells the user "We weight toward what you like, never
   suggest a dislike".
   That promise is made in seven languages. The matcher is English-only:
   `normTerm` (index.html:5108) is `replace(/[^a-z0-9 ]+/g,' ')`, which strips
   every non-ASCII letter before anything else runs. So `mælk`, `nødder`,
   `Käse`, `tojás`, `dió` are mangled before they are looked up, and the
   English-shaped ones (`ost`, `sajt`, `hal`, `soja`) survive intact only to be
   Levenshtein-corrected into an UNRELATED English food.

   WHY THAT SECOND CASE IS WORSE THAN A MISS
   -----------------------------------------
   A miss shows the user the allergen. A wrong correction shows them the
   allergen AND hides unrelated meals, so the filter looks like it worked. In a
   health product that is the difference between a broken feature and a
   misleading one. Hence the second assertion group.

   THIS SUITE SHIPS XFAIL, ON PURPOSE — AND IT IS A RATCHET, NOT A TODO
   -------------------------------------------------------------------
   The fix (ruling stage C1: `_fold` in the food path + multilingual aliases in
   FOOD_SYN) is not buildable this cycle — it needs vocabulary that does not
   exist yet. Shipping this suite as a hard RED would either block a release
   that fixes something else, or get switched off. So:
     * it prints the LIVE count every run, and
     * it exits 0 while the count is <= the recorded baseline, but
     * it exits 1 the moment the count goes UP.
   The number can only go down. When it reaches zero, set XFAIL = false below
   and this becomes an ordinary hard guard.

   NUMBERS ARE RE-DERIVED HERE, NOT COPIED. The standing ruling said 39/60, the
   Contrarian said 37/60, the Chairman measured 38/60 — the spread is entirely
   the wordlist, so THE WORDLIST IS PUBLISHED BELOW and the count is whatever
   this file measures against the live engine today.

   USAGE
     node tools/test/allergen_i18n_test.js                 # ./index.html
     node tools/test/allergen_i18n_test.js <path/to.html>  # any snapshot
   =========================================================================== */

'use strict';
const fs = require('fs');
const path = require('path');

var SRC = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
var src;
try { src = fs.readFileSync(SRC, 'utf8'); } catch (e) { console.error('FATAL: cannot read ' + SRC); process.exit(2); }

/* ---- XFAIL RATCHET -------------------------------------------------------
   Baselines measured by Hugo against tip 874d709 / fdb7fc2 (byte-identical
   index.html), 2026-08-05, with the wordlist in TERMS below.
   Lower these when a fix lands. Never raise them.                           */
var XFAIL = true;
var BASELINE = {
  failOpen: 42,      /* terms that hide ZERO meals — the allergen IS suggested  */
  hideFewer: 52,     /* terms that hide FEWER meals than their English twin     */
  wrongCorrect: 7    /* fuzzyCorrect() maps the term to an unrelated food       */
};
/* MY NUMBERS DIFFER FROM THE RULING'S AND THAT IS EXPECTED — it said so itself:
   "the difference is wordlist, so publish yours." Chairman: 38/60 fail-open,
   48/60 hide-fewer. Hugo (this file, tip 874d709, 2026-08-05): 42/60 (70.0%)
   fail-open, 52/60 hide-fewer. Wrong substitutions: 7/7 — reproduced EXACTLY,
   including that `hal` both fails open AND misroutes to `ham`.
   The three converging measurements (37 / 38 / 42) differ only in which words
   a "real user" is assumed to type; every one of them says the same thing —
   the majority of allergen terms in the six shipped languages hide nothing. */

/* ---- extract the live engine (same pattern as sound_test / media_test) ---- */
function slice(startMark, endMark) {
  var a = src.indexOf(startMark);
  var b = src.indexOf(endMark, a);
  if (a < 0 || b < 0) { console.error('FATAL: engine markers not found (' + startMark + ' .. ' + endMark + ')'); process.exit(2); }
  return src.slice(a, b);
}
var engineSrc = slice('var MEAL_DB=[', 'function updateMealBadge');
var engine;
try {
  engine = new Function(engineSrc + '\n return {MEAL_DB:MEAL_DB, FOOD_SYN:FOOD_SYN, FOOD_VOCAB:FOOD_VOCAB, ' +
    'normTerm:normTerm, fuzzyCorrect:fuzzyCorrect, expandTerm:expandTerm, ' +
    'mealMatchesText:mealMatchesText, termMatchWord:termMatchWord};')();
} catch (e) {
  console.error('FATAL: could not evaluate the extracted meal engine — ' + e.message);
  process.exit(2);
}
var MEALS = engine.MEAL_DB;
if (!Array.isArray(MEALS) || MEALS.length < 50) { console.error('FATAL: MEAL_DB extracted but looks wrong (' + (MEALS && MEALS.length) + ' meals)'); process.exit(2); }

/* smoke test — a harness that measures nothing always reports 0 failures */
var smoke = MEALS.filter(function (m) { return engine.mealMatchesText(m, 'pork'); }).length;
if (smoke < 1) { console.error('FATAL: harness is vacuous — English "pork" hid ' + smoke + ' meals'); process.exit(2); }

/* ---- THE WORDLIST — published, so a different count can be traced to it ----
   11 everyday allergen/dislike concepts a real user types into the Dislikes
   box, in English plus the six non-English languages the app ships
   (es, da, de, sv, nb, hu — `ms` is not selectable). 60 non-English terms.
   Chosen for realism, not for making the number look bad: `nb egg` and the
   three `soja` spellings are deliberately included even though they are
   English-shaped and will pass — that is what an honest grid looks like. */
var LANGS = ['es', 'da', 'de', 'sv', 'nb', 'hu'];
var TERMS = [
  { en: 'cheese',  es: 'queso',   da: 'ost',       de: 'käse',             sv: 'ost',    nb: 'ost',        hu: 'sajt' },
  { en: 'milk',    es: 'leche',   da: 'mælk',      de: 'milch',            sv: 'mjölk',  nb: 'melk',       hu: 'tej' },
  { en: 'egg',     es: 'huevo',   da: 'æg',        de: 'ei',               sv: 'ägg',    nb: 'egg',        hu: 'tojás' },
  { en: 'fish',    es: 'pescado', da: 'fisk',      de: 'fisch',            sv: 'fisk',   nb: 'fisk',       hu: 'hal' },
  { en: 'nuts',    es: 'nueces',  da: 'nødder',    de: 'nüsse',            sv: 'nötter', nb: 'nøtter',     hu: 'dió' },
  { en: 'pork',    es: 'cerdo',   da: 'svinekød',  de: 'schweinefleisch',  sv: 'fläsk',  nb: 'svinekjøtt', hu: 'sertés' },
  { en: 'chicken', es: 'pollo',   da: 'kylling',   de: 'hähnchen',         sv: 'kyckling', nb: 'kylling',  hu: 'csirke' },
  { en: 'shrimp',  es: 'gambas',  da: 'rejer',     de: 'garnelen',         sv: 'räkor',  nb: 'reker',      hu: 'garnéla' },
  { en: 'wheat',   es: 'trigo',   da: 'hvede',     de: 'weizen',           sv: 'vete',   nb: 'hvete',      hu: 'búza' },
  { en: 'soy',     es: 'soja',    da: 'soja',      de: 'soja',             sv: 'soja',   nb: 'soya',       hu: 'szója' }
];

/* ---- the seven wrong-food substitutions the ruling names (§4 row A0) ------ */
var WRONG = [
  ['ost',  'oat',  'da/sv cheese → oat'],
  ['sajt', 'salt', 'hu cheese → salt'],
  ['tej',  'tea',  'hu milk → tea'],
  ['sopp', 'soup', 'nb mushroom → soup'],
  ['soja', 'soba', 'es/da/de/sv soy → soba noodles'],
  ['dió',  'dip',  'hu nuts → dip'],
  ['hal',  'ham',  'hu fish → ham']
];

function hides(term) { return MEALS.filter(function (m) { return engine.mealMatchesText(m, term); }).length; }

/* =========================================================================== */
console.log('allergen_i18n_test — ' + path.basename(SRC));
console.log('  live engine: ' + MEALS.length + ' meals, ' + engine.FOOD_VOCAB.length + '-word vocabulary; ' +
            'smoke: English "pork" hides ' + smoke + '\n');

/* ---- GROUP 1 — the 60-term grid ------------------------------------------ */
console.log('[1] DISLIKE GRID — ' + (TERMS.length * LANGS.length) + ' non-English terms vs their English twin');
console.log('    concept        en          ' + LANGS.map(function (l) { return (l + '        ').slice(0, 9); }).join(''));
var failOpen = [], hideFewer = [];
TERMS.forEach(function (row) {
  var base = hides(row.en);
  var cells = [];
  LANGS.forEach(function (l) {
    var n = hides(row[l]);
    if (n === 0) failOpen.push(row.en + '/' + l + ' "' + row[l] + '"');
    if (n < base) hideFewer.push(row.en + '/' + l + ' "' + row[l] + '" ' + n + ' vs en ' + base);
    cells.push(((n === 0 ? '·0' : String(n)) + '        ').slice(0, 9));
  });
  console.log('    ' + (row.en + '            ').slice(0, 14) + (String(base) + '           ').slice(0, 12) + cells.join(''));
});
console.log('\n    FAIL-OPEN (hides ZERO meals — the allergen IS suggested): ' +
            failOpen.length + '/' + (TERMS.length * LANGS.length) +
            '  (' + Math.round(failOpen.length / (TERMS.length * LANGS.length) * 1000) / 10 + '%)');
failOpen.forEach(function (f) { console.log('      ✗ ' + f); });
console.log('    HIDES FEWER THAN ENGLISH: ' + hideFewer.length + '/' + (TERMS.length * LANGS.length));

/* ---- GROUP 2 — wrong-food substitutions ---------------------------------- */
console.log('\n[2] WRONG-FOOD SUBSTITUTIONS — strictly worse than a miss');
console.log('    (the real allergen is not excluded AND unrelated meals are)');
var wrong = [];
WRONG.forEach(function (w) {
  var term = engine.normTerm(w[0]);
  var got = engine.fuzzyCorrect(term, true);
  var expanded = engine.expandTerm(w[0]);
  var mapped = (got === w[1]) || expanded.indexOf(w[1]) >= 0;
  if (mapped) { wrong.push(w); console.log('      ✗ "' + w[0] + '" → "' + w[1] + '"   ' + w[2] +
      '   [normTerm→"' + term + '", fuzzyCorrect→' + JSON.stringify(got) + ', hides ' + hides(w[0]) + ' meals]'); }
  else console.log('      ✓ "' + w[0] + '" does NOT map to "' + w[1] + '"   (fuzzyCorrect→' + JSON.stringify(got) + ')');
});
console.log('    WRONG SUBSTITUTIONS LIVE: ' + wrong.length + '/' + WRONG.length);

/* ---- verdict — the ratchet ------------------------------------------------ */
var live = { failOpen: failOpen.length, hideFewer: hideFewer.length, wrongCorrect: wrong.length };
console.log('\n' + '-'.repeat(72));
console.log('LIVE:     fail-open ' + live.failOpen + '  ·  hides-fewer ' + live.hideFewer + '  ·  wrong-substitutions ' + live.wrongCorrect);
console.log('BASELINE: fail-open ' + BASELINE.failOpen + '  ·  hides-fewer ' + BASELINE.hideFewer + '  ·  wrong-substitutions ' + BASELINE.wrongCorrect);

var worse = Object.keys(BASELINE).filter(function (k) { return live[k] > BASELINE[k]; });
var better = Object.keys(BASELINE).filter(function (k) { return live[k] < BASELINE[k]; });

if (worse.length) {
  console.log('\nRED — REGRESSION. These got WORSE than the recorded baseline: ' + worse.join(', '));
  console.log('The ratchet only turns one way. Fix it or explain it; do not raise the baseline.');
  process.exit(1);
}
if (better.length) {
  console.log('\nIMPROVED on: ' + better.join(', ') + ' — lower BASELINE in this file to lock the gain in.');
}
if (live.failOpen === 0 && live.wrongCorrect === 0) {
  console.log('\nGREEN — the filter works in all six languages. Set XFAIL = false; this is now a hard guard.');
  process.exit(0);
}
if (XFAIL) {
  console.log('\nXFAIL — known broken, count held at or below baseline, gate NOT blocked (ruling §4 row A0).');
  console.log('The real fix is stage C1: `_fold` in the food path + multilingual FOOD_SYN aliases.');
  process.exit(0);
}
console.log('\nRED — XFAIL is off and the defect is still live.');
process.exit(1);
