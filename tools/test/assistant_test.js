#!/usr/bin/env node
/* Assistant MRLN Q&A router test —  node tools/test/assistant_test.js
 *
 * Verifies the question-vs-command router: real questions get an answer from the
 * knowledge base (in any of the 7 languages), and edit commands are NOT hijacked —
 * they return null so the command parser handles them. Add a case when a question
 * form is missed or a command is wrongly captured. Extracts the live engine from
 * index.html (no copy drift). */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
const a = src.indexOf('var MRLN_HELP ='), b = src.indexOf('var aiProposal = null;');
if (a < 0 || b < 0) { console.error('could not locate Assistant MRLN engine'); process.exit(2); }
const sandbox = `function t(s){return s;} ${src.slice(a, b)}; module.exports={answerQuestion};`;
const m = { exports: {} };
new Function('module', 'exports', sandbox)(m, m.exports);
const Q = m.exports.answerQuestion;

let pass = 0, fail = 0;
function check(input, wantAnswer) {
  const r = Q(input);
  const ok = wantAnswer ? !!r : !r;
  ok ? pass++ : fail++;
  console.log((ok ? '✓' : '✗ FAIL') + '  [' + (wantAnswer ? 'answer ' : 'command') + '] «' + input + '»');
}
// questions → must answer
['how does savings work?', 'what is cash flow?', 'how do I back up my data?',
 'what can you do?', 'does my data get uploaded?', 'how do I install the app?',
 'explain the gym plan', 'what is the food log?', 'how do loan payments work?',
 'hvordan virker opsparing?'].forEach(q => check(q, true));
// commands → must NOT be hijacked (null → parser handles)
['income is now 2600', 'add Netflix 99/mo', 'save 2000 per month',
 'loan payment 4500', 'add Kort 50', 'cancel Spotify'].forEach(c => check(c, false));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
