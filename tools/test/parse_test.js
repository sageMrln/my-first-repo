#!/usr/bin/env node
/* Shared regression harness for the multilingual Quick-Update parser.
 *
 *   node tools/test/parse_test.js
 *
 * Why this is committed (release retro, adopted by Kaito): this run we had FOUR
 * overlapping parser suites living in scratchpads — Mikoto's 91-case, Hugo's 22-case
 * differential, Akashi's re-derived cases, Kaito's 25-case. One shared, repo-committed
 * suite means everyone runs the SAME cases, and a regression caught once stays caught.
 * Add a case here whenever a parser bug is found; never delete a guard case.
 *
 * It extracts the live parseClause() straight out of index.html (no copy drift) and
 * runs it against the cases below in a DKK/Aarhus context. Exit 1 on any failure.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

// pull the parser region (from _num through just before parseInstructions) and run it
const a = src.indexOf('function _num(s){');
const b = src.indexOf('function parseInstructions(');
if (a < 0 || b < 0) { console.error('could not locate parser region in index.html'); process.exit(2); }
const harness = `
  var STATE={prefs:{currency:'DKK'}}, CURRENCIES={DKK:{sym:'kr',loc:'da-DK'}};
  function curInfo(){return CURRENCIES.DKK;}
  function fmtN(n){return Math.round(n).toLocaleString('da-DK');}
  var MODEL={groups:[{name:'Subscriptions',items:[{name:'Netflix'}]},{name:'Groceries',items:[]}]};
  function findItemByName(q){return null;}
  ${src.slice(a, b)}
  module.exports={parseClause:parseClause};
`;
const m = { exports: {} };
new Function('module', 'exports', harness)(m, m.exports);
const parseClause = m.exports.parseClause;

let pass = 0, fail = 0;
function check(input, wantOp) {
  const r = parseClause(input);
  const got = r ? r.op : '(null)';
  const ok = got === wantOp;
  ok ? pass++ : fail++;
  console.log((ok ? '✓' : '✗ FAIL') + '  [' + String(wantOp).padEnd(15) + '] got ' + String(got).padEnd(15) + '  «' + input + '»');
}

// --- merchant/bank names must NOT become money/profile ops (Akashi's FP set + bank guards) ---
check('add Netto 2000/mo', 'addItem');
check('Spar membership 99/mo', 'addItem');
check('add Spare parts 300/mo', 'addItem');
check('add Kort 50', 'addItem');
check('Alter Ego sub 120', 'addItem');
check('Sparekassen 500 om måneden', 'addItem');   // da savings BANK
check('Sparkasse 500 monatlich', 'addItem');       // de bank
// --- real commands must still work ---
check('my income is 30000', 'setIncome');
check('loan payment 4500', 'setLoanPayment');
check('save 2000 per month', 'setSavingsMatch');
check('add Netflix 99', 'addItem');
check('I am 35', 'setProfile');
check('min alder er 41', 'setProfile');            // da age + copula
check('jeg tjener 28000', 'setIncome');            // da earn phrase
check('opsparing match 1500', 'setSavingsMatch');  // explicit savings+transfer
check('spar 2000 hver måned', 'setSavingsMatch');  // da save adjacency
check('jeg sparer 250 om måneden', 'setSavingsMatch'); // da inflected save
check('jag sparar 300 per månad', 'setSavingsMatch');  // sv inflected save
check('sparen 400 monatlich', 'setSavingsMatch');      // de inflected save
check('tilføj Spotify 99/md', 'addItem');          // da add-verb
check('lægg til Disney 79', 'addItem');            // da/nb add-verb variant

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
