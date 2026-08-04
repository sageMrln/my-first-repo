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

// --- HUNGARIAN income lexicon (found by Mikoto running the app's OWN quoted examples
//     through the real parser in a browser; both halves were live in a shipped build) ---
// (a) the words the Hungarian UI itself uses for Income were missing, so a user setting
//     their income silently created a monthly EXPENSE named after the word they typed.
check('a bevételem 25000', 'setIncome');           // hu "my income" — the Income tab's own word
check('bevétel 25000', 'setIncome');
check('a jövedelmem 25000', 'setIncome');          // hu possessive DROPS the stem vowel:
check('a jövedelem 25000', 'setIncome');           //   jövedelem -> jövedelm+em, so the
check('a fizetésem 25000', 'setIncome');           //   dictionary form alone never matched
check('a bérem 25000', 'setIncome');
// (b) the mirror bug, and the worse one: _has() matches with a LEADING boundary only (by
//     design, so Germanic inflections like "lønnen"->"lønn" still hit). In an agglutinative
//     language that makes a short stem a prefix of unrelated words — "bérleti díj" is RENT,
//     and it was setting the user's INCOME, corrupting the whole finance model from one typo
//     of a sentence. Never delete these.
check('bérleti díj 5000', 'addItem');              // hu rent — expense, NOT income
check('bérlés 5000', 'addItem');                   // hu rental
check('bérlet 450', 'addItem');                    // hu season ticket / pass
check('fizetési határidő 500', 'addItem');         // hu payment deadline
check('bevásárlás 2000', 'addItem');               // hu groceries — must not hit "bevétel"

// --- THE PREFIX-COLLISION CLASS, all languages (swept after Hugo found jövedelemadó).
//     _has() matches with a LEADING boundary only. Danish, German, Swedish, Norwegian and
//     Hungarian all COMPOUND where English uses two words, so an income stem swallows the
//     compound and an EXPENSE silently overwrites the user's INCOME — which corrupts
//     leftover, tier, affordability and every savings projection at once. All of these
//     were live on the shipped v39 build, in six of seven languages INCLUDING English. ---
check('income tax 3000', 'addItem');               // en — the flagship language was not exempt
check('lohnsteuer 3000', 'addItem');               // de wage tax
check('einkommensteuer 3000', 'addItem');          // de income tax
check('lønskat 3000', 'addItem');                  // da wage tax
check('inkomstskatt 3000', 'addItem');             // sv income tax
check('löneskatt 3000', 'addItem');                // sv wage tax
check('inntektsskatt 3000', 'addItem');            // nb income tax
check('jövedelemadó 3000', 'addItem');             // hu income tax
check('bérautó 4000', 'addItem');                  // hu rental car — a rental IS an expense
check('bérgarázs 900', 'addItem');                 // hu rental garage
check('Lønstrup 500', 'addItem');                  // da TOWN name — a merchant, like Netto/Spar

// A PAYSLIP IS NOT A TAX. I blocked these three in the sweep above and Mikoto caught it:
// blocking does not fix the error, it FLIPS ITS SIGN. `lønseddel 25000` became a 25 000/mo
// EXPENSE — catastrophic, and the exact failure I added `kereset` to prevent. Someone
// typing a payslip amount means their salary, so income is the better reading and a wrong
// income is far cheaper than an invented recurring bill. Only TAX words stay blocked,
// because "this money went OUT" is unambiguous there. Never re-add these to the denylist.
check('lønseddel 25000', 'setIncome');             // da payslip
check('lønkonto 25000', 'setIncome');              // da salary account
check('gehaltsabrechnung 25000', 'setIncome');     // de payslip
check('lohnabrechnung 25000', 'setIncome');        // de payslip, the OTHER everyday spelling
check('lønnsslipp 25000', 'setIncome');            // nb payslip — `lønn(?!sslipp)` was DEAD
check('lönebesked 25000', 'setIncome');            //   code: `løn` matches the prefix first
check('lönespecifikation 25000', 'setIncome');     //   from earlier in the alternation, so da
                                                   //   and nb answered oppositely for one word
check('kereset 28000', 'setIncome');               // hu earnings — was MISSING, minted a bogus expense
// the income phrasings these lookaheads must never break, in every language
check('my income after tax is 25000', 'setIncome');// "after tax" is its own entry — the delicate one
check('a fizetési szintem 25000', 'setIncome');    // hu pay level — I regressed this with fizetés(?!i);
check('fizetési sávom 25000', 'setIncome');        //   Akashi caught it, the lookahead was reverted
check('min lønn er 25000', 'setIncome');           // nb
check('mein lohn ist 25000', 'setIncome');         // de
check('min lön är 25000', 'setIncome');            // sv
check('mis ingresos son 25000', 'setIncome');      // es

// --- LEX.age was matched with a TRAILING boundary only — a SUFFIX match, unlike every
//     other lexicon group. Any Spanish word ending in "edad" became the user's age. ---
check('propiedad 41', 'addItem');                  // es property
check('sociedad 45', 'addItem');                   // es society
check('my age is 41', 'setProfile');               // and the age command still works
check('min alder er 41', 'setProfile');            // da

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
