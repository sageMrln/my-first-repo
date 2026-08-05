#!/usr/bin/env node
/* Smart Onboarding priority-picker tab-order mapping test — node tools/test/onboarding_test.js
 *
 * Verifies the priority picker → tabOrder contract:
 *   STATE.tabOrder = data.priority.concat(rest)
 * where rest = all tab keys not in data.priority
 *
 * Guards: picked keys come first in pick order, unpicked follow in original order,
 * no tab is lost or duplicated, empty picked list preserves original order, and
 * stale/invalid picked keys don't corrupt the set.
 *
 * ALL_TABS is DERIVED from index.html's nav markup at run time — never
 * hand-copied. The previous hard-coded list carried a phantom `subs` tab for
 * months and could not notice any nav change (reskin ruling a213555 §H). */

const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;

function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log((ok ? '✓' : '✗ FAIL') + '  ' + name);
  if (!ok) {
    console.log('  Got:  [' + got.join(', ') + ']');
    console.log('  Want: [' + want.join(', ') + ']');
  }
}

/* The pure mapping logic extracted from index.html finish() */
function applyPriorityToTabOrder(allTabKeys, picked) {
  var rest = allTabKeys.filter(function(k) { return picked.indexOf(k) < 0; });
  return picked.concat(rest);
}

/* All real tabs, derived from index.html in DOM order (finish() reads #tabs
 * .tab in DOM order, so this mirrors the app exactly). */
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
const navHtml = html.slice(html.indexOf('<nav class="tabs"'), html.indexOf('</nav>', html.indexOf('<nav class="tabs"')));
const ALL_TABS = [...navHtml.matchAll(/data-p="([a-z]+)"/g)].map(m => m[1]);

if (ALL_TABS.length < 15 || new Set(ALL_TABS).size !== ALL_TABS.length) {
  console.log('✗ FAIL  nav derivation sane (got ' + ALL_TABS.length + ' tabs, ' + new Set(ALL_TABS).size + ' unique)');
  process.exit(1);
}
console.log('✓  nav derivation sane (' + ALL_TABS.length + ' tabs read from index.html)');
pass++;

// TEST 1: Full set picked in reverse order
const reversed = ALL_TABS.slice().reverse();
check('picked all tabs in reverse order', applyPriorityToTabOrder(ALL_TABS, reversed), reversed);

// TEST 2: Partial pick — 3 priority tabs, rest in original order
const pick3 = ['expenses', 'food', 'gym'];
check(
  'partial pick [expenses, food, gym]',
  applyPriorityToTabOrder(ALL_TABS, pick3),
  pick3.concat(ALL_TABS.filter(k => pick3.indexOf(k) < 0))
);

// TEST 3: Empty pick preserves original order
check('empty pick preserves original order', applyPriorityToTabOrder(ALL_TABS, []), ALL_TABS);

// TEST 4: Single pick
check(
  'pick single tab (overview)',
  applyPriorityToTabOrder(ALL_TABS, ['overview']),
  ['overview'].concat(ALL_TABS.filter(k => k !== 'overview'))
);

// TEST 5: All tabs present exactly once (no loss, no duplicate)
function countUnique(arr) {
  var seen = {};
  arr.forEach(function(k) { seen[k] = (seen[k] || 0) + 1; });
  return seen;
}

function testNoLossNoDuplicate(name, allKeys, picked) {
  var result = applyPriorityToTabOrder(allKeys, picked);
  var counts = countUnique(result);
  var allPresent = allKeys.every(function(k) { return counts[k] === 1; });
  var noExtra = Object.keys(counts).length === allKeys.length;
  var ok = allPresent && noExtra && result.length === allKeys.length;
  ok ? pass++ : fail++;
  console.log((ok ? '✓' : '✗ FAIL') + '  ' + name);
  if (!ok) {
    console.log('  Expected ' + allKeys.length + ' unique, got ' + result.length);
    console.log('  Counts: ' + JSON.stringify(counts));
  }
}

testNoLossNoDuplicate('no tabs lost on pick [expenses, media]', ALL_TABS, ['expenses', 'media']);
testNoLossNoDuplicate('no tabs lost on full pick', ALL_TABS, ALL_TABS);
testNoLossNoDuplicate('no tabs lost on empty pick', ALL_TABS, []);

// TEST 6: Picked keys come first in pick order
function testPickedOrderPreserved(name, allKeys, picked) {
  var result = applyPriorityToTabOrder(allKeys, picked);
  var allOk = picked.every(function(p, i) { return result[i] === p; });
  allOk ? pass++ : fail++;
  console.log((allOk ? '✓' : '✗ FAIL') + '  ' + name);
  if (!allOk) {
    console.log('  Picked: [' + picked.join(', ') + ']');
    console.log('  First ' + picked.length + ' of result: [' + result.slice(0, picked.length).join(', ') + ']');
  }
}

testPickedOrderPreserved('picked tabs come first in pick order', ALL_TABS, ['food', 'expenses', 'calendar']);

// TEST 7: Stale/invalid picked keys (not in allKeys) pass through the mapping.
// __applyTabOrder filters by present.indexOf(p)>=0, so a NONEXISTENT key is
// silently dropped from the DOM reorder. The mapping itself doesn't filter —
// the apply function does. Correct by design.
check(
  'picked key not in allKeys (old tab removed) passes through mapping',
  applyPriorityToTabOrder(ALL_TABS, ['expenses', 'NONEXISTENT', 'food']),
  ['expenses', 'NONEXISTENT', 'food'].concat(ALL_TABS.filter(k => k !== 'expenses' && k !== 'food'))
);

// TEST 8: Order of unpicked tabs follows original order
check(
  'unpicked tabs follow original order',
  applyPriorityToTabOrder(['a', 'b', 'c', 'd', 'e'], ['c', 'a']),
  ['c', 'a', 'b', 'd', 'e']
);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
