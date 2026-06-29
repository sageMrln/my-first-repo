#!/usr/bin/env node
/* Assistant MRLN — silly + misspelled question battery.   node tools/test/assistant_silly_test.js
 *
 * Real people type fast, misspell, and ask daft things ("can i afford a 20 kr gum?").
 * This suite extracts the LIVE engine from index.html (no copy drift), mocks the runtime
 * globals answerData() needs (MODEL / leftOver / GRAND / STATE / __sys …) with a realistic
 * profile (≈3,686 kr/month leftover, matching Osefe's screenshot), then asserts each daft or
 * mistyped question routes to the RIGHT intent — never the "I'm unable to answer" dead end,
 * and never a wrong number.
 *
 * Add a case whenever a real question gets misread. A FAIL here = a confused user. */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
const a = src.indexOf('var MRLN_HELP ='), b = src.indexOf('var aiProposal = null;');
if (a < 0 || b < 0) { console.error('could not locate Assistant MRLN engine'); process.exit(2); }

// ---- realistic mocked profile (Aarhus, kr) so answerData() computes real answers ----
const prelude = `
  function t(s){ return s; }
  function tf(s, v){ return String(s).replace(/\\{(\\w+)\\}/g, function(_,k){ return (v&&v[k]!=null)?v[k]:'{'+k+'}'; }); }
  function fmtN(n){ return Math.round(n).toLocaleString('en-US'); }
  function curInfo(){ return { sym:'kr' }; }
  var __sys = { token:function(){ return 1; }, isArmed:function(){return true;}, isTripped:function(){return false;} };
  var MODEL = {
    income: { low:14000, avg:18000, high:22000 },
    savingsMatch: 2000,
    groups: [
      { name:'Housing', items:[{amount:7000}] },
      { name:'Food',    items:[{amount:3200}] },
      { name:'Transport',items:[{amount:1400}] },
      { name:'Fun',     items:[{amount:1714}] }
    ]
  };
  function groupTotal(g){ return (g.items||[]).reduce(function(s,i){ return s+(+i.amount||0); },0); }
  var GRAND = MODEL.groups.reduce(function(s,g){ return s+groupTotal(g); }, 0); // 13,314
  function leftOver(){ return 3686; }                                          // matches the screenshot
  var STATE = { body:{ weight:82 }, savingsBoxes:[ { name:'Holiday', balance:6000, target:20000 }, { name:'Buffer', balance:4000, target:0 } ] };
  function sbList(){ return STATE.savingsBoxes; }
`;
const sandbox = `${prelude}\n${src.slice(a, b)}\n; module.exports = { answerQuestion, answerData, _amtFrom };`;
const m = { exports: {} };
new Function('module', 'exports', sandbox)(m, m.exports);
const Q = m.exports.answerQuestion;

let pass = 0, fail = 0;
const fails = [];
// assert: the answer for `input` CONTAINS every fragment in want[] (case-insensitive),
// and does NOT contain any fragment in nope[]. want=[] just means "answered something real".
function ask(input, want, nope) {
  const r = (Q(input) || '');
  const low = r.toLowerCase();
  const dead = /unable to answer|look it up on your browser/i.test(r);
  let ok = !dead;
  (want || []).forEach(w => { if (low.indexOf(String(w).toLowerCase()) < 0) ok = false; });
  (nope || []).forEach(w => { if (low.indexOf(String(w).toLowerCase()) >= 0) ok = false; });
  ok ? pass++ : (fail++, fails.push({ input, want, nope, got: r }));
  console.log((ok ? '✓' : '✗ FAIL') + '  «' + input + '»' + (ok ? '' : '\n        got: ' + JSON.stringify(r)));
}

console.log('— AFFORDABILITY (silly items + misspells) —');
ask('Can i afford a 20 kr gum?', ['yes', '20 kr'], ['20,000']);      // the screenshot bug: kr must not become ×1000
ask('can i afford a 5 kr sticker?', ['yes', '5 kr'], ['5,000']);
ask('can i afford a 250 kr pizza?', ['yes', '250']);
ask('can I afford a 50000 kr holiday?', ['no', '50,000']);
ask('can i aford a 100 kr book?', ['yes', '100']);                  // aford → afford
ask('can i affrod a 4000 kr couch?', ['4,000']);                    // affrod → afford
ask('cn i afford a 2k tv?', ['2,000']);                             // 2k = 2000, cn → can
ask('am i able to afford a 300 kr jacket?', ['300']);
ask('do i have enough for a 80 kr lunch?', ['80'], ['80,000']);
ask('is a 12 kr coffee affordable?', ['12'], ['12,000']);
ask('can i afford a 20kr gum?', ['20 kr'], ['20,000']);             // no-space unit: 20kr → 20, not 20,000 and not 2
ask('can i afford a 199kr shirt?', ['199'], ['19,900']);           // no-space unit: 199kr → 199, not 19

console.log('\n— SPENDING / WHERE MONEY GOES (misspells) —');
ask('where duz my money go?', ['biggest', 'housing']);              // duz → does
ask('where does my muny go?', ['biggest']);                         // muny → money
ask('how much do i spend on fud?', ['food']);                       // fud → food, category hit
ask('how much do i spnd each month?', ['total monthly spending']);  // spnd → spend
ask('whats my biggest expence?', ['biggest']);                      // expence → expense
ask('what costs me the most?', ['biggest']);

console.log('\n— LEFTOVER / KEEP (misspells) —');
ask('how much do i hav left?', ['keep', '3,686']);                  // hav → have
ask('wat do i keep each month?', ['keep', '3,686']);                // wat → what
ask('how much munny is left over?', ['keep']);                      // munny → money
ask('whats my surpluss?', ['keep']);                               // surpluss → surplus

console.log('\n— INCOME (misspells) —');
ask('how much do i ern?', ['income', '18,000']);                    // ern → earn
ask('wats my salry?', ['income']);                                 // salry → salary
ask('how much do i make a month?', ['income']);
ask('whats my incom?', ['income']);                                // incom → income

console.log('\n— SAVINGS (misspells + boxes) —');
ask('how much hav i saved?', ['hold', '10,000']);                  // total across boxes 6000+4000
ask('hows my holiday box?', ['holiday', '6,000']);
ask('how much in my savins?', ['hold']);                           // savins → savings
ask('how long to save 50000?', ['50,000', 'month']);
ask('how long 2 save 5k?', ['5,000']);

console.log('\n— WEIGHT (silly + misspells) —');
ask('how much do i way?', ['82']);                                 // way → weigh
ask('how heavy am i?', ['82']);
ask('whats my wieght?', ['82']);                                   // wieght → weight
ask('how fat am i?', ['82']);                                      // cheeky → weight

console.log('\n— FOOD feature (misspells route to Food Log help) —');
ask('how do i log my fud?', ['food log']);                         // fud → food
ask('hows the calorie thing work?', ['food log', 'calorie']);
ask('what is the food log?', ['food log']);

console.log('\n— COMMANDS must STILL NOT be hijacked (return null → parser) —');
function cmd(input){ const r = Q(input); const ok = (r === null); ok ? pass++ : (fail++, fails.push({input, got:r})); console.log((ok?'✓':'✗ FAIL')+'  [command] «'+input+'»'+(ok?'':'\n        got: '+JSON.stringify(r))); }
cmd('income is now 2600');
cmd('add Gym 29/mo to Other');
cmd('save 2000 per month');
cmd('cancel Netflix');
cmd('note 2026-07-15 Mum birthday');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) { console.log('\n=== FAILURES ==='); fails.forEach(f => console.log('  «' + f.input + '»  want=' + JSON.stringify(f.want||'null') + '  got=' + JSON.stringify(f.got))); }
process.exit(fail ? 1 : 0);
