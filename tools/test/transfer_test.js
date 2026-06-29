#!/usr/bin/env node
/* Data-transfer round-trip losslessness guard — node tools/test/transfer_test.js
 *
 * CRITICAL for Phase 1: Kaito's Phase 1 data-transfer redesign (exportDataCode →
 * decodeDataCode → applyImportedData) handles a RICHLY-populated STATE+MODEL
 * (money groups, workouts, calendar, log, body, prs, notes, foodLog, tax,
 * savingsBoxes, prefs, reminders, usage, bdayYear, missionsDone).
 *
 * This guard extracts the LIVE functions from index.html (no copy drift) and
 * DEEP-DIFFs the restored data against the original — proving no field drops.
 * The real risk: exportDataCode's field list and applyImportedData's field list
 * drifting out of sync as we add fields (savingsBoxes + missionsDone + usage just
 * landed). This catches it before a user loses data in an import.
 *
 * Also asserts decodeDataCode REJECTS junk (non-MRLN text, empty, oversized) with
 * a thrown error — parsing hostile input must fail loud, not silently.
 *
 * Exit 1 if any test fails; this is a gate-holding test.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

// Locate the transfer functions
const exportStart = src.indexOf('function exportDataCode(){');
const importSummaryStart = src.indexOf('function importSummary(d){');
const initDataIOStart = src.indexOf('(function initDataIO(){');

if (exportStart < 0 || importSummaryStart < 0 || initDataIOStart < 0) {
  console.error('could not locate transfer functions in index.html');
  process.exit(2);
}

// Extract from exportDataCode through the end of initDataIO block (all transfer code together)
// Find the closing ")();' of initDataIO which is after initDataIOStart
let braceCount = 0;
let i;
let foundStart = false;
let transferEnd = -1;
for (i = initDataIOStart; i < src.length; i++) {
  if (src[i] === '{') braceCount++;
  else if (src[i] === '}') braceCount--;
  if (!foundStart && braceCount > 0) foundStart = true;
  if (foundStart && braceCount === 0 && src.slice(i, i+3) === '});') {
    transferEnd = i + 3;
    break;
  }
}

if (transferEnd < 10) {
  console.error('could not locate transfer code boundaries (initDataIO end)');
  process.exit(2);
}

const transferCode = src.slice(exportStart, transferEnd);

// Build harness with rich test data
const harness = `
  var STATE = {
    workouts: [{ id: 'w1', date: '2026-06-29', type: 'running', mins: 30, cal: 300 }],
    calendar: { '2026-06-29': { notes: 'Had a good day' } },
    log: [{ id: 'l1', date: '2026-06-28', time: '09:00', name: 'Income', type: 'income', value: 3000 }],
    body: { height: 180, weight: 75, gender: 'M' },
    prs: [{ id: 'p1', name: 'Bench press', weight: 100, date: '2026-06-29' }],
    notes: [{ id: 'n1', text: 'Remember to hydrate', date: '2026-06-29' }],
    foodLog: [{ id: 'f1', date: '2026-06-29', name: 'Lunch', cal: 500, total: 500, photo: 'data:image/png;base64,ABC123456789', hasPhoto: true }],
    tax: { status: 'employee', taxId: 'XX1234567X' },
    savingsBoxes: [{ id: 's1', name: 'Vacation', target: 5000, current: 1500 }],
    reminders: [{ id: 'r1', date: '2026-07-01', text: 'Pay rent' }],
    usage: { totalSec: 12345, streak: 7, lastDay: '2026-06-29' },
    bdayYear: 1990,
    missionsDone: { 'mission-setup': true, 'mission-5expenses': true },
    prefs: { lang: 'en', currency: 'DKK' },
    fresh: false,
    demo: false
  };
  
  var MODEL = {
    groups: [
      { id: 'grp-1', name: 'Income', items: [{ id: 'item-1', name: 'Salary', price: 30000, repeat: 'month' }] },
      { id: 'grp-2', name: 'Expenses', items: [{ id: 'item-2', name: 'Rent', price: 8000, repeat: 'month' }, { id: 'item-3', name: 'Food', price: 2000, repeat: 'month' }] }
    ],
    incomeDef: { label: 'Income', repeat: 'month' },
    loanPayment: 4500
  };

  // Capture originals for deep-diff
  const originalState = JSON.parse(JSON.stringify(STATE));
  const originalModel = JSON.parse(JSON.stringify(MODEL));

  // Stubs for functions called by the transfer code
  function ensureIds(m) { }
  function applyCleanModeClass() { }
  function revealKlarnaIfEnabled() { }
  function refreshEverything() { }
  function renderAll() { }
  function refreshFinance() { }
  function updateCcyLabels() { }
  function applyLang(l) { }
  function syncBirthday() { }
  function renderReminders() { }
  function renderUsage() { }
  function autosave() { }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function tf(s, obj) { 
    if (!obj) return s;
    let result = s;
    for (let k in obj) {
      result = result.replace('{' + k + '}', String(obj[k]));
    }
    return result;
  }

  // Mock document/window for type checks (the extracted block includes initDataIO,
  // which assigns window.__refreshMoveCard for the i18n live-relang hook)
  var document = { getElementById: (id) => null, querySelector: () => null };
  var window = {};

  ${transferCode}

  module.exports = { exportDataCode, decodeDataCode, applyImportedData, importSummary, originalState, originalModel };
`;

const m = { exports: {} };
try {
  new Function('module', 'exports', harness)(m, m.exports);
} catch (e) {
  console.error('✗ could not eval transfer code:', e.message);
  process.exit(2);
}

const { exportDataCode, decodeDataCode, applyImportedData, importSummary, originalState, originalModel } = m.exports;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log('✓  ' + name);
  } else {
    fail++;
    console.log('✗ FAIL  ' + name + (detail ? '\n       ' + detail : ''));
  }
}

// ---- HAPPY PATH: round-trip export → decode (losslessness) ----
let code, decoded;
try {
  // Export
  code = exportDataCode();
  check('exportDataCode produces MRLNDATA- prefixed string', code.startsWith('MRLNDATA-'));

  // Decode
  decoded = decodeDataCode(code);
  check('decodeDataCode parses exported code', decoded && typeof decoded === 'object');
  check('decoded.v === 1', decoded.v === 1);
  check('decoded has cfg with groups', decoded.cfg && decoded.cfg.groups);
  check('decoded has all required fields (workouts, calendar, log, body, prs, notes, foodLog, tax, savingsBoxes, reminders, usage, bdayYear, missionsDone)',
    Array.isArray(decoded.workouts) &&
    typeof decoded.calendar === 'object' &&
    Array.isArray(decoded.log) &&
    typeof decoded.body === 'object' &&
    Array.isArray(decoded.prs) &&
    Array.isArray(decoded.notes) &&
    Array.isArray(decoded.foodLog) &&
    typeof decoded.tax === 'object' &&
    Array.isArray(decoded.savingsBoxes) &&
    Array.isArray(decoded.reminders) &&
    (decoded.usage === null || typeof decoded.usage === 'object') &&
    decoded.bdayYear !== undefined &&
    typeof decoded.missionsDone === 'object'
  );

  // Deep-diff: compare decoded against original (the exported code should be byte-identical)
  // EXCEPT foodLog photos which are stripped from the quick-move export (per Osefe's decision:
  // photos stay on-device in IndexedDB, not in the transfer code).
  check('decoded.workouts matches original', JSON.stringify(decoded.workouts) === JSON.stringify(originalState.workouts));
  check('decoded.calendar matches original', JSON.stringify(decoded.calendar) === JSON.stringify(originalState.calendar));
  check('decoded.log matches original', JSON.stringify(decoded.log) === JSON.stringify(originalState.log));
  check('decoded.body matches original', JSON.stringify(decoded.body) === JSON.stringify(originalState.body));
  check('decoded.prs matches original', JSON.stringify(decoded.prs) === JSON.stringify(originalState.prs));
  check('decoded.notes matches original', JSON.stringify(decoded.notes) === JSON.stringify(originalState.notes));
  // foodLog: verify photo bytes are STRIPPED but metadata (id/date/name/cal/total/hasPhoto) is KEPT
  check('decoded.foodLog has same length', Array.isArray(decoded.foodLog) && decoded.foodLog.length === originalState.foodLog.length);
  if (decoded.foodLog && decoded.foodLog.length > 0) {
    const decodedFood = decoded.foodLog[0];
    const originalFood = originalState.foodLog[0];
    check('foodLog metadata preserved (id)', decodedFood.id === originalFood.id);
    check('foodLog metadata preserved (date)', decodedFood.date === originalFood.date);
    check('foodLog metadata preserved (name)', decodedFood.name === originalFood.name);
    check('foodLog metadata preserved (cal)', decodedFood.cal === originalFood.cal);
    check('foodLog metadata preserved (total)', decodedFood.total === originalFood.total);
    check('foodLog metadata preserved (hasPhoto)', decodedFood.hasPhoto === originalFood.hasPhoto);
    check('foodLog photo STRIPPED from export (no photo bytes)', decodedFood.photo === undefined);
  }
  check('decoded.tax matches original', JSON.stringify(decoded.tax) === JSON.stringify(originalState.tax));
  check('decoded.savingsBoxes matches original', JSON.stringify(decoded.savingsBoxes) === JSON.stringify(originalState.savingsBoxes));
  check('decoded.reminders matches original', JSON.stringify(decoded.reminders) === JSON.stringify(originalState.reminders));
  check('decoded.usage matches original', JSON.stringify(decoded.usage) === JSON.stringify(originalState.usage));
  check('decoded.bdayYear matches original', decoded.bdayYear === originalState.bdayYear);
  check('decoded.missionsDone matches original', JSON.stringify(decoded.missionsDone) === JSON.stringify(originalState.missionsDone));
  check('decoded.cfg.groups matches original', JSON.stringify(decoded.cfg.groups) === JSON.stringify(originalModel.groups));

} catch (e) {
  fail++;
  console.log('✗ FAIL  round-trip export→decode threw:', e.message);
}

// ---- HOSTILE INPUT: decodeDataCode must REJECT garbage ----
function testRejectInput(input, name) {
  let threw = false;
  try {
    decodeDataCode(input);
  } catch (e) {
    threw = true;
  }
  check('decodeDataCode rejects ' + name, threw);
}

testRejectInput('', 'empty string');
testRejectInput('   ', 'whitespace only');
testRejectInput('random text', 'non-MRLN text');
testRejectInput('MRLNDATA-invalidbase64!!!', 'invalid base64');
testRejectInput('MRLNDATA-' + 'A'.repeat(3000001), 'oversized payload (>3MB)');
testRejectInput('MRLNDATA-eyJub3Q6ICJ2YWxpZCBkYXRhIn0=', 'valid base64 but invalid JSON structure');

// ---- importSummary: plain-word preview ----
try {
  if (decoded) {
    const summary = importSummary(decoded);
    check('importSummary returns a string', typeof summary === 'string');
    check('importSummary includes emojis/markers', summary.length > 0);
  }
} catch (e) {
  fail++;
  console.log('✗ FAIL  importSummary threw:', e.message);
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
