#!/usr/bin/env node
/* Tab reorder ripple test —  node tools/test/reorder_test.js
 *
 * Verifies __tabReorder: moving a tab to a new position slots it there and ripples
 * the rest (old #2 → #3 …), no-ops when unchanged, clamps out-of-range, and leaves
 * hidden tabs in place. Extracts the live pure function from index.html (no drift). */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
const a = src.indexOf('function __tabReorder(');
if (a < 0) { console.error('could not locate __tabReorder'); process.exit(2); }
// grab just the function body up to its closing brace
const end = src.indexOf('\n  }', a) + 4;
eval(src.slice(a, end));

let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log((ok ? '✓' : '✗ FAIL') + '  ' + name + ' → ' + got.join(','));
}
const A = ['a', 'b', 'c', 'd', 'e'];
check('move e(5) → 2 ripples', __tabReorder(A, A, 'e', 2), ['a', 'e', 'b', 'c', 'd']);
check('move a(1) → 3', __tabReorder(A, A, 'a', 3), ['b', 'c', 'a', 'd', 'e']);
check('move c(3) → 1', __tabReorder(A, A, 'c', 1), ['c', 'a', 'b', 'd', 'e']);
check('move b → same (2) no-op', __tabReorder(A, A, 'b', 2), ['a', 'b', 'c', 'd', 'e']);
check('clamp pos > n', __tabReorder(A, A, 'a', 99), ['b', 'c', 'd', 'e', 'a']);
check('clamp pos < 1', __tabReorder(A, A, 'e', 0), ['e', 'a', 'b', 'c', 'd']);
// hidden tab "x" rides along: full order has x, visible doesn't
const full = ['a', 'b', 'x', 'c', 'd'], vis = ['a', 'b', 'c', 'd'];
check('hidden tab stays put', __tabReorder(full, vis, 'd', 1), ['d', 'a', 'b', 'x', 'c']);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
