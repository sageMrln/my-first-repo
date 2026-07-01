#!/usr/bin/env node
/* Save Safety — durability fail-loud + detection guard.   node tools/test/savesafety_test.js
 *
 * A real incident (Osefe): titles added on mobile vanished on refresh because localStorage is
 * ephemeral in in-app browsers / private mode and autosave's catch ONLY handled quota — the
 * failure was SILENT. This suite locks in the fix so it can never silently regress:
 *   - autosave READ-BACK VERIFY: a write that silently no-ops (getItem !== written) → fail loud
 *   - autosave fails loud on ANY non-quota throw (not just QuotaExceededError)
 *   - a QUOTA throw still routes to _warnStorageFull, NOT the durability warning (no clobber)
 *   - a WORKING store persists and raises NO warning (normal-browser regression)
 *   - the IN_APP_BROWSER UA sniff matches known social webviews and NOT normal browsers
 *   - the copy link is canonical host + own fid in the FRAGMENT only (never path/query)
 * We extract the LIVE functions from index.html (no copy drift) and sandbox them with mocks.
 * A FAIL here = a user could silently lose data again, or the copy-link could leak the fid. */
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
const SAVE_REPLACER = extractFn('_saveReplacer');
const WARN_FULL = extractFn('_warnStorageFull');
const WARN_NOT_DURABLE = extractFn('_warnNotDurable');
const AUTOSAVE = extractFn('autosave');
const CANON = extractFn('_canonLink');

let pass = 0, fail = 0;
function check(name, cond, detail){ cond ? (pass++, console.log('✓  ' + name)) : (fail++, console.log('✗ FAIL  ' + name + (detail ? '\n        ' + detail : ''))); }

// ---------- run the LIVE autosave with a mocked store in one of four modes ----------
function runAutosave(mode){
  const store = {};
  const localStorage = {
    setItem(k, v){
      if (mode === 'throwQuota'){ const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
      if (mode === 'throwOther'){ throw new Error('SecurityError: storage blocked'); }
      if (mode === 'noop'){ return; }                 // silent no-op (in-app browser wipe)
      store[k] = String(v);
    },
    getItem(k){ return (k in store) ? store[k] : null; }
  };
  const elems = {};
  const document = { getElementById(id){ return elems[id] || (elems[id] = { style:{}, textContent:'', getAttribute(){ return null; } }); } };
  const code = `
    var _quotaWarned=false, _durabilityWarned=false, TEMPLATE_MODE=false;
    ${SAVE_REPLACER}
    ${WARN_FULL}
    ${WARN_NOT_DURABLE}
    ${AUTOSAVE}
    autosave();
    return { quota:_quotaWarned, durable:_durabilityWarned };
  `;
  const fn = new Function('STATE','STORE_KEY','localStorage','document','nowISO','toast','t', code);
  const STATE = { savedAt:null, media:[{ id:'x', title:'Bleach', rating:9.8 }] };
  const r = fn(STATE, 'financeHudState', localStorage, document, () => '2026-07-01T00:00:00.000Z', () => {}, s => s);
  return Object.assign(r, { saved: store['financeHudState'] });
}

// working store: persists, no warning
let r = runAutosave('ok');
check('working store: media persisted (contains title)', !!r.saved && r.saved.indexOf('Bleach') >= 0);
check('working store: NO durability warning (normal browser)', r.durable === false);
check('working store: NO quota warning', r.quota === false);

// silent no-op write: read-back verify catches it → fail loud (THE bug)
r = runAutosave('noop');
check('silent no-op write: durability warning FIRES (read-back verify)', r.durable === true, 'this is the exact Media-Log-loss regression');

// any non-quota throw: fail loud
r = runAutosave('throwOther');
check('non-quota throw: durability warning FIRES (no silent swallow)', r.durable === true);

// quota throw: routes to storage-full, NOT durability (no clobber)
r = runAutosave('throwQuota');
check('quota throw: raises quota warning', r.quota === true);
check('quota throw: does NOT raise the durability warning (distinct states)', r.durable === false);

// ---------- IN_APP_BROWSER UA sniff ----------
const m = src.match(/IN_APP_BROWSER\s*=\s*\(function\(\)\{[^]*?return\s*(\/[^]*?\/i)\.test\(/);
check('IN_APP_BROWSER regex is extractable', !!m, 'detection sniff not found');
if (m){
  const re = new Function('return ' + m[1])();
  const webviews = [
    'Mozilla/5.0 (iPhone) AppleWebKit/605 Instagram 250.0',
    'Mozilla/5.0 (Linux; Android) [FBAN/FB4A;FBAV/1.0]',
    'Mozilla/5.0 (iPhone) Snapchat/12.0',
    'Mozilla/5.0 (Linux; Android) musical_ly_2023 TikTok',
    'Mozilla/5.0 (iPhone) MicroMessenger/8.0'
  ];
  const normals = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) AppleWebKit/605.1.15 Version/16.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Gecko/20100101 Firefox/121.0'
  ];
  check('UA sniff: flags known in-app browsers', webviews.every(u => re.test(u)), 'missed: ' + webviews.filter(u => !re.test(u)).join(' | '));
  check('UA sniff: does NOT flag normal browsers', normals.every(u => !re.test(u)), 'false-positive: ' + normals.filter(u => re.test(u)).join(' | '));
}

// ---------- copy link: canonical host + fid in FRAGMENT only ----------
function canon(fid){
  const fn = new Function('STATE', CANON + '\n return _canonLink();');
  return fn({ fid });
}
const withFid = canon('F-7K2P9X');
check('copy link: fid rides in the fragment (#…)', withFid.indexOf('#F-7K2P9X') >= 0, withFid);
check('copy link: fid NEVER in path/query (no leak to servers)', !/[?&][^#]*F-7K2P9X/.test(withFid) && withFid.split('#')[0].indexOf('F-7K2P9X') < 0, withFid);
check('copy link: uses the canonical https host', /^https:\/\/[^/]+\//.test(withFid), withFid);
check('copy link: no fid fragment when file has none', canon('').indexOf('#') < 0, canon(''));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
