#!/usr/bin/env node
/* Tier 0 streak engine test —  node tools/test/streak_test.js
 *
 * Verifies the daily-streak logic: counts once per day, +1 on a consecutive day,
 * resets to 1 after a gap. Extracts the live __sDay/__bumpStreak from index.html. */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
const a = src.indexOf('function __sDay('), b = src.indexOf('function renderStreak(');
if (a < 0 || b < 0) { console.error('could not locate streak engine'); process.exit(2); }
const sb = `${src.slice(a, b)}; var STATE={}; function renderStreak(){};
  __bumpStreak(); var c1=STATE.streak.count;
  __bumpStreak(); var c2=STATE.streak.count;
  STATE.streak.last=__sDay(new Date(Date.now()-86400000)); __bumpStreak(); var c3=STATE.streak.count;
  STATE.streak.last=__sDay(new Date(Date.now()-3*86400000)); __bumpStreak(); var c4=STATE.streak.count;
  module.exports={c1,c2,c3,c4};`;
const m = { exports: {} };
new Function('module', 'exports', sb)(m, m.exports);
const r = m.exports;
let pass = 0, fail = 0;
function check(name, got, want) { const ok = got === want; ok ? pass++ : fail++; console.log((ok ? '✓' : '✗ FAIL') + '  ' + name + ' (got ' + got + ', want ' + want + ')'); }
check('first day = 1', r.c1, 1);
check('same day not double-counted = 1', r.c2, 1);
check('consecutive day +1 = 2', r.c3, 2);
check('gap resets to 1', r.c4, 1);
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
