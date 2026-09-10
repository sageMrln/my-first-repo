#!/usr/bin/env node
/* Differential on _priceFrom: extract the LIVE function (plus its two regex deps) from
   index.html and compare the shipped behaviour against the committed intent. A price the
   assistant invents is a purchase it green-lights on a number that does not exist. */
const fs = require('fs');
const s = fs.readFileSync(require('path').resolve(__dirname,'../..','index.html'), 'utf8');
function slice(startMark, endMark) {
  const a = s.indexOf(startMark); if (a < 0) throw new Error('missing ' + startMark);
  const b = s.indexOf(endMark, a); if (b < 0) throw new Error('missing ' + endMark);
  return s.slice(a, b + endMark.length);
}
const src = slice('var _CCY_RE =', 'return isFinite(best) ? best : NaN;\n  }');
const _priceFrom = new Function(src + '; return _priceFrom;')();

// [question, expected]  — NaN means "the assistant must ASK, not answer"
const CASES = [
  // model numbers that must NEVER become a price (the defect)
  ['can I afford a PS5?', NaN],
  ['can I afford an iPhone 17?', NaN],
  ['can I afford an iPhone 17 this year?', NaN],          // Akashi: non-terminal
  ['can I afford a switch 2 right now?', NaN],
  ['can i afford an rtx 5090 for my pc?', NaN],
  ['can I afford a playstation 5 this month?', NaN],
  ['can I afford an xbox series 9 today?', NaN],
  ['how long to save for a switch 2 this year?', NaN],
  ['can i afford airpods 4 before christmas?', NaN],
  // real prices that must still ANSWER
  ['can I afford 4000 kr?', 4000],
  ['can I afford 4000?', 4000],
  ['kan jeg have råd til 4000 kr?', 4000],
  ['can I afford a 2k tv?', 2000],
  ['how long to save 50000?', 50000],
  ['how long 2 save 5k?', 5000],
  ['can I afford $50?', 50],
  ['can i afford a new couch for 4000 kr?', 4000],
  ['how long to save 50000 kr?', 50000],
  ['can I afford 250 euro?', 250],
];
let pass = 0, fail = 0;
CASES.forEach(([q, want]) => {
  const got = _priceFrom(q);
  const okv = (Number.isNaN(want) && Number.isNaN(got)) || got === want;
  if (okv) { pass++; }
  else { fail++; console.log('  ✗ ' + JSON.stringify(q) + '  want ' + want + '  got ' + got); }
});
console.log('\n_priceFrom differential: ' + pass + ' passed / ' + fail + ' failed');
process.exit(fail ? 1 : 0);
