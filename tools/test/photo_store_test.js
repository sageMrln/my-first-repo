#!/usr/bin/env node
/* Food-photo IndexedDB storage — logic guard.   node tools/test/photo_store_test.js
 *
 * Photos moved off the ~5MB localStorage ceiling into IndexedDB (one photo ≈ a year of text).
 * The browser bits (IndexedDB persistence, canvas re-encode) can't run in node, but the
 * SECURITY-CRITICAL logic can and MUST be guarded deterministically here — this is exactly the
 * zero-loss / fail-closed behaviour Akashi gated on (R2/R3/R4/R6/R7). We extract the LIVE
 * functions from index.html (no copy drift), mock MEDIA as an in-memory store + STATE/autosave,
 * and assert:
 *   - _saveReplacer drops a photo from localStorage ONLY once hasPhoto confirms it's in IDB
 *   - initFoodMedia migrates legacy inline photos → IDB, then strips (R3), idempotently
 *   - a FAILED MEDIA.put never strands a photo — inline copy is kept (R3/R4 zero-loss)
 *   - hydrate pulls bytes back into memory; a lost IDB entry clears the stale flag
 *   - exportDataCode EXCLUDES photo bytes from the quick move but keeps food metadata
 *
 * A FAIL here = a user could lose a meal photo, or photos could bloat the quick move. */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

// ---- extract a top-level `function NAME(){…}` by brace-balancing ----
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
// extractObjectLiteral for exportDataCode's foodLogLite line — we just pull exportDataCode whole.
const SAVE_REPLACER = extractFn('_saveReplacer');
const INIT_FOOD_MEDIA = extractFn('initFoodMedia');
const EXPORT_DATA = extractFn('exportDataCode');

let pass = 0, fail = 0;
function check(name, cond, detail){ cond ? (pass++, console.log('✓  ' + name)) : (fail++, console.log('✗ FAIL  ' + name + (detail ? '\n        ' + detail : ''))); }

// ---------- in-memory MEDIA mock (mirrors the real IndexedDB helper's contract) ----------
function makeMedia(opts){
  opts = opts || {};
  const map = new Map(Object.entries(opts.seed || {}));
  return {
    _map: map,
    supported: () => opts.supported !== false,
    put: (id, url) => opts.failPut ? Promise.reject(new Error('QuotaExceededError')) : (map.set(id, url), Promise.resolve()),
    get: (id) => Promise.resolve(map.has(id) ? map.get(id) : null),
    del: (id) => (map.delete(id), Promise.resolve()),
    all: () => { const o = {}; map.forEach((v,k)=>o[k]=v); return Promise.resolve(o); }
  };
}

// ---------- run initFoodMedia in a sandbox with mocked globals, return final STATE + localStorage ----------
function runMigration(foodLog, mediaOpts){
  let STATE = { foodLog: foodLog };
  const MEDIA = makeMedia(mediaOpts || {});
  let savedJSON = null;
  const sandbox = {
    STATE, MEDIA, TEMPLATE_MODE: false,
    renderFoodLog: function(){},
    Promise: Promise,
    // autosave mirrors the real one: serialize STATE through _saveReplacer (the strip rule)
    autosave: function(){ savedJSON = JSON.stringify(STATE, sandbox._saveReplacer); }
  };
  const code = `${SAVE_REPLACER}\n sandbox._saveReplacer=_saveReplacer;\n ${INIT_FOOD_MEDIA}\n return initFoodMedia();`;
  const fn = new Function('STATE','MEDIA','TEMPLATE_MODE','renderFoodLog','autosave','sandbox', code);
  fn(sandbox.STATE, sandbox.MEDIA, sandbox.TEMPLATE_MODE, sandbox.renderFoodLog, sandbox.autosave, sandbox);
  return new Promise(res => setTimeout(() => res({ STATE, MEDIA, saved: savedJSON ? JSON.parse(savedJSON) : null }), 30));
}

(async function(){
  // ---- _saveReplacer in isolation ----
  const rep = new Function(SAVE_REPLACER + '\n return _saveReplacer;')();
  check('_saveReplacer KEEPS photo when hasPhoto is false (not yet in IDB)',
    rep.call({ hasPhoto: false, photo: 'data:x' }, 'photo', 'data:x') === 'data:x');
  check('_saveReplacer DROPS photo when hasPhoto is true (confirmed in IDB)',
    rep.call({ hasPhoto: true, photo: 'data:x' }, 'photo', 'data:x') === undefined);
  check('_saveReplacer passes through non-photo keys', rep.call({}, 'text', 'apple') === 'apple');

  // ---- migration: legacy inline photo → IDB, then strip (R3) ----
  let r = await runMigration([{ id:'a', text:'apple', photo:'data:image/jpeg;base64,AAA' }], {});
  check('migrate: photo bytes written to IDB', r.MEDIA._map.get('a') === 'data:image/jpeg;base64,AAA');
  check('migrate: hasPhoto flag set in memory', r.STATE.foodLog[0].hasPhoto === true);
  check('migrate: photo kept in memory for render', r.STATE.foodLog[0].photo === 'data:image/jpeg;base64,AAA');
  check('migrate: localStorage copy STRIPPED (hasPhoto true → dropped)', r.saved && r.saved.foodLog[0].photo === undefined, JSON.stringify(r.saved&&r.saved.foodLog[0]));
  check('migrate: localStorage keeps the hasPhoto flag', r.saved && r.saved.foodLog[0].hasPhoto === true);

  // ---- R3/R4 zero-loss: a FAILED put must NOT strip the inline photo ----
  r = await runMigration([{ id:'b', text:'pizza', photo:'data:image/jpeg;base64,BBB' }], { failPut:true });
  check('put-fail: hasPhoto stays false', r.STATE.foodLog[0].hasPhoto !== true);
  check('put-fail: inline photo KEPT in memory (no loss)', r.STATE.foodLog[0].photo === 'data:image/jpeg;base64,BBB');
  check('put-fail: localStorage KEEPS inline photo (zero-loss fallback)',
    !r.saved || r.saved.foodLog[0].photo === 'data:image/jpeg;base64,BBB',
    'saved=' + JSON.stringify(r.saved && r.saved.foodLog[0]));

  // ---- idempotent: an already-migrated entry (hasPhoto, no inline) is left alone but hydrated ----
  r = await runMigration([{ id:'c', text:'rice', hasPhoto:true }], { seed:{ c:'data:image/jpeg;base64,CCC' } });
  check('hydrate: bytes pulled back into memory', r.STATE.foodLog[0].photo === 'data:image/jpeg;base64,CCC');
  check('hydrate: hasPhoto stays true', r.STATE.foodLog[0].hasPhoto === true);

  // ---- IDB lost the bytes (eviction): stale hasPhoto flag is cleared, not left lying ----
  r = await runMigration([{ id:'d', text:'soup', hasPhoto:true }], { seed:{} });
  check('lost-bytes: stale hasPhoto cleared', r.STATE.foodLog[0].hasPhoto === false);

  // ---- R7: MEDIA unsupported → degrade, keep photos inline, never crash ----
  r = await runMigration([{ id:'e', text:'egg', photo:'data:image/jpeg;base64,EEE' }], { supported:false });
  check('unsupported: inline photo untouched (degrade gracefully)', r.STATE.foodLog[0].photo === 'data:image/jpeg;base64,EEE');

  // ---- exportDataCode: quick-move EXCLUDES photo bytes, KEEPS food metadata ----
  const expSandbox = {
    MODEL: { groups: [] },
    STATE: { foodLog: [{ id:'f', text:'burger', total:{kcal:500}, photo:'data:image/jpeg;base64,VERYLONGPHOTOBYTES' }], workouts:[], calendar:{}, log:[], body:{}, prs:[], notes:[], tax:{}, savingsBoxes:[], prefs:{}, reminders:[], usage:null, bdayYear:undefined, missionsDone:{} },
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    unescape: unescape, encodeURIComponent: encodeURIComponent   // legacy globals: real UTF-8-safe round-trip
  };
  const expFn = new Function('MODEL','STATE','btoa','unescape','encodeURIComponent', EXPORT_DATA + '\n return exportDataCode();');
  const code = expFn(expSandbox.MODEL, expSandbox.STATE, expSandbox.btoa, expSandbox.unescape, expSandbox.encodeURIComponent);
  const decoded = decodeURIComponent(escape(Buffer.from(code.replace('MRLNDATA-',''), 'base64').toString('binary')));
  check('quick-move EXCLUDES photo bytes', decoded.indexOf('VERYLONGPHOTOBYTES') < 0);
  check('quick-move KEEPS food metadata (id/text)', decoded.indexOf('burger') >= 0 && decoded.indexOf('"f"') >= 0);

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
