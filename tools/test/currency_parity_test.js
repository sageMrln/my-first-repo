#!/usr/bin/env node
/* Currency parity — the tax engine and the currency picker must never diverge again.
 *
 *   node tools/test/currency_parity_test.js
 *
 * WHY THIS EXISTS. The tax engine mapped SG->SGD and KR->KRW, rendered S$ and won, and was
 * covered by 6 committed assertions — while neither currency existed in CURRENCIES, in
 * FX_RATES, in the #curSel picker, or in curOpts(). So `defCountry('SGD')` was a branch
 * that could never fire: a Singaporean user silently defaulted to DENMARK and read every
 * figure in Danish kroner, with only the tax panel showing S$.
 *
 * Nothing caught it because the currency list is hardcoded FOUR TIMES independently, and no
 * test related any of them to TAX_CCY. This suite relates them. It is a class fix, not an
 * instance fix: adding a 14th country to the tax engine without its currency now turns the
 * gate RED instead of shipping a user into the wrong country.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

let pass = 0, fail = 0;
function ok(m) { pass++; console.log('  ✓ ' + m); }
function bad(m) { fail++; console.log('  ✗ ' + m); }
function check(c, m) { c ? ok(m) : bad(m); }

/* ---- extract the four independent hardcodings + the tax map, from the LIVE file ---- */
function block(startMark, endMark, label) {
  const a = src.indexOf(startMark);
  if (a < 0) { bad('could not locate ' + label + ' in index.html'); return ''; }
  const b = src.indexOf(endMark, a);
  return src.slice(a, b < 0 ? a + 4000 : b);
}

const curBlock = block('var CURRENCIES', '};', 'CURRENCIES');
const fxBlock = block('perUSD:{', '}', 'FX_RATES.perUSD');
const selBlock = block('id="curSel"', '</select>', '#curSel');
const optBlock = block('function curOpts', '.map', 'curOpts()');
const taxBlock = block('TAX_CCY', '};', 'TAX_CCY');

const codes = s => [...new Set((s.match(/\b[A-Z]{3}\b/g) || []))].sort();

const CURRENCIES = codes(curBlock);
const FX = codes(fxBlock);
const SEL = codes(selBlock);
const OPTS = codes(optBlock);
/* TAX_CCY values are the currencies the tax engine can emit */
const TAX = [...new Set((taxBlock.match(/:\s*'([A-Z]{3})'/g) || []).map(m => m.replace(/[^A-Z]/g, '')))].sort();

console.log('\n[1] every currency the TAX ENGINE can emit must be selectable');
console.log('  tax engine emits : ' + TAX.join(' '));
console.log('  CURRENCIES table : ' + CURRENCIES.join(' '));
TAX.forEach(c => {
  check(CURRENCIES.indexOf(c) >= 0, c + ' is in CURRENCIES');
  check(FX.indexOf(c) >= 0, c + ' has an FX rate (without one, convertAllMoney silently no-ops at 1:1)');
  check(SEL.indexOf(c) >= 0, c + ' is offered in the #curSel picker');
  check(OPTS.indexOf(c) >= 0, c + ' is offered by curOpts()');
});

console.log('\n[2] the four independent hardcodings of the currency list must agree');
/* Each of these is a separate literal in the file. They drifted once; they will drift
   again unless something relates them. */
const sets = { CURRENCIES: CURRENCIES, 'FX_RATES.perUSD': FX, '#curSel': SEL, 'curOpts()': OPTS };
const names = Object.keys(sets);
names.forEach(n => {
  const missing = CURRENCIES.filter(c => sets[n].indexOf(c) < 0);
  const extra = sets[n].filter(c => CURRENCIES.indexOf(c) < 0);
  check(!missing.length && !extra.length,
    n + ' matches CURRENCIES (' + sets[n].length + ')' +
    (missing.length ? ' — MISSING ' + missing.join(',') : '') +
    (extra.length ? ' — EXTRA ' + extra.join(',') : ''));
});

console.log('\n[3] every currency needs a symbol and a locale, or money() renders wrong');
CURRENCIES.forEach(c => {
  const re = new RegExp(c + ":\\s*\\{[^}]*sym:\\s*'[^']+'[^}]*loc:\\s*'[a-z]{2}-[A-Z]{2}'");
  check(re.test(curBlock), c + ' declares both sym and a well-formed loc');
});

console.log('\n[4] FX rates must be positive finite numbers');
/* A zero or NaN rate would silently zero out every stored figure on a currency switch —
   convertAllMoney() rewrites real user data, so this is a data-integrity assertion. */
const rates = [...fxBlock.matchAll(/([A-Z]{3}):\s*([0-9.]+)/g)];
check(rates.length === CURRENCIES.length, 'one rate per currency (' + rates.length + '/' + CURRENCIES.length + ')');
rates.forEach(([, c, v]) => {
  const n = parseFloat(v);
  check(isFinite(n) && n > 0, c + ' rate is a positive finite number (' + v + ')');
});
check(/USD:\s*1\b/.test(fxBlock), 'USD is the pivot at exactly 1');

console.log('\n' + (fail ? '✗ currency parity: ' + fail + ' failure(s), ' + pass + ' passed'
  : '✓ currency parity: all ' + pass + ' assertions passed'));
process.exit(fail ? 1 : 0);
