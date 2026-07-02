#!/usr/bin/env node
/* Import-sanitize guard — node tools/test/import_sanitize_test.js
 *
 * Locks in Akashi's stored-XSS fix (47df421). applyImportedData() ingests UNTRUSTED data
 * (MRLNDATA transfer codes, master-file hud-state); ~30 render sinks interpolate object .id
 * and calendar keys RAW into data-* attributes, and PR/food numeric fields render raw into
 * text. A crafted import with id = '"><img src=x onerror=...>' was a stored XSS that could
 * read the access key. _sanitizeIngested() neutralizes at the ingest chokepoint:
 *   - every structural .id coerced to [\w-] (safe in every HTML context, no-op for uid() values)
 *   - PR wt/reps/dist/secs and foodLog total.* forced to Numbers
 *   - calendar keys that aren't YYYY-MM-DD dropped entirely (they render raw as data-date)
 * This suite extracts the LIVE functions from index.html (no copy drift) and proves hostile
 * payloads are neutralized while legitimate data passes through UNCHANGED. A FAIL here means
 * an imported code could once again smuggle markup into the page. */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

function extractFn(name){
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('cannot find function ' + name);
  let depth = 0, i = src.indexOf('{', start);
  for (let j = i; j < src.length; j++){
    if (src[j] === '{') depth++;
    else if (src[j] === '}'){ depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error('unbalanced ' + name);
}

const SID = extractFn('_sid');
const INUM = extractFn('_inum');
const SAN = extractFn('_sanitizeIngested');

let pass = 0, fail = 0;
function check(name, cond, detail){ cond ? (pass++, console.log('✓  ' + name)) : (fail++, console.log('✗ FAIL  ' + name + (detail ? '\n        ' + detail : ''))); }

const HOSTILE = '"><img src=x onerror=alert(1)>';
const run = new Function('STATE', 'MODEL', SID + '\n' + INUM + '\n' + SAN + '\n_sanitizeIngested();');

// ---------- hostile import: every structural field neutralized ----------
const STATE = {
  workouts: [{ id: HOSTILE, ex: 'Bench' }],
  notes: [{ id: HOSTILE, title: 'Legit <b>note</b> title' }],
  media: [{ id: HOSTILE, title: 'Dune' }],
  reminders: [{ id: HOSTILE }],
  savingsBoxes: [{ id: HOSTILE }],
  prs: [{ id: HOSTILE, wt: '<script>1</script>', reps: 'x', dist: '5.5', secs: 90 }],
  foodLog: [{ id: HOSTILE, total: { kcal: '<img src=x>', p: '12', c: 30, f: null } }],
  calendar: {
    '2026-07-02': [{ id: HOSTILE, label: 'ok' }],
    ['"><svg onload=x>']: [{ id: 'evil' }]
  }
};
const MODEL = { groups: [{ id: HOSTILE, items: [{ id: HOSTILE, name: 'Rent' }] }] };
run(STATE, MODEL);

const clean = s => !/[<>"'&=\s]/.test(s);
check('workout id neutralized to [\\w-]', clean(STATE.workouts[0].id), STATE.workouts[0].id);
check('note id neutralized', clean(STATE.notes[0].id));
check('media id neutralized', clean(STATE.media[0].id));
check('reminder id neutralized', clean(STATE.reminders[0].id));
check('savings box id neutralized', clean(STATE.savingsBoxes[0].id));
check('PR id neutralized', clean(STATE.prs[0].id));
check('food id neutralized', clean(STATE.foodLog[0].id));
check('group id neutralized', clean(MODEL.groups[0].id));
check('group ITEM id neutralized', clean(MODEL.groups[0].items[0].id));
check('calendar event id neutralized', clean(STATE.calendar['2026-07-02'][0].id));
check('non-date calendar key DROPPED (renders raw as data-date)',
  Object.keys(STATE.calendar).length === 1 && !!STATE.calendar['2026-07-02'],
  Object.keys(STATE.calendar).join(' | '));

// raw-rendered numerics forced to Numbers
check('PR wt with markup -> 0', STATE.prs[0].wt === 0, String(STATE.prs[0].wt));
check('PR reps non-numeric -> 0', STATE.prs[0].reps === 0);
check('PR dist numeric string -> 5.5', STATE.prs[0].dist === 5.5);
check('PR secs number passes through', STATE.prs[0].secs === 90);
check('food kcal with markup -> 0', STATE.foodLog[0].total.kcal === 0);
check('food protein numeric string -> 12', STATE.foodLog[0].total.p === 12);

// content strings deliberately untouched (they are esc()'d at render; sanitizing would mangle them)
check('content strings untouched (note title keeps markup for esc-at-render)',
  STATE.notes[0].title === 'Legit <b>note</b> title', STATE.notes[0].title);

// ---------- legit import: sanitize is a NO-OP (ids/values preserved exactly) ----------
const LEGIT = {
  workouts: [{ id: 'w-m1x2y3_abc9', ex: 'Squat' }],
  media: [{ id: 'aB3_z-9' }], notes: [], reminders: [], savingsBoxes: [],
  prs: [{ id: 'pr1', wt: 82.5, reps: 5, dist: 0, secs: 0 }],
  foodLog: [{ id: 'f1', total: { kcal: 640, p: 42, c: 55, f: 21 } }],
  calendar: { '2026-01-15': [{ id: 'ev-1' }] }
};
const LM = { groups: [{ id: 'g1', items: [{ id: 'i1', name: 'Rent' }] }] };
run(LEGIT, LM);
check('legit workout id unchanged', LEGIT.workouts[0].id === 'w-m1x2y3_abc9', LEGIT.workouts[0].id);
check('legit media id unchanged', LEGIT.media[0].id === 'aB3_z-9');
check('legit PR wt unchanged (82.5)', LEGIT.prs[0].wt === 82.5);
check('legit food kcal unchanged (640)', LEGIT.foodLog[0].total.kcal === 640);
check('legit calendar key kept', !!LEGIT.calendar['2026-01-15']);
check('legit group/item ids unchanged', LM.groups[0].id === 'g1' && LM.groups[0].items[0].id === 'i1');

// missing/odd shapes must not crash (defensive)
run({ workouts: null, prs: [null, 'str'], foodLog: [{}], calendar: null }, null);
check('odd shapes (null arrays, primitive rows, no MODEL) do not crash', true);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
