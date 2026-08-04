#!/usr/bin/env node
/* MRLN deploy — build the gh-pages tree from tools/publish/deploy_map.json.
 *
 *   node tools/publish/deploy.js --check          diff the produced tree vs origin/gh-pages
 *   node tools/publish/deploy.js --out <dir>      materialise the tree into <dir>
 *
 * WHY THIS EXISTS (root-migration council, §2): the app must keep the SOURCE filename
 * `index.html` — green.js reads APP_VER from it and preflight.js picks its security
 * profile from the basename — while being PUBLISHED as `app.html`. Renaming in source
 * breaks both at the same moment as the cache semantics. So the rename lives here, in
 * one machine-checked artifact, instead of in 85 scattered references.
 *
 * --check is the interlock. It compares the PATH SET strictly (a mismatch exits 1),
 * because a wrong path set is what silently unpublishes a file or strands a cache
 * entry. Content differences are REPORTED, not failed: between releases the source
 * legitimately runs ahead of live. Read the two sections separately — a clean path
 * set with a listed content delta is the normal pre-release state.
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = path.resolve(__dirname, '..', '..');
const MAP = path.join(root, 'tools', 'publish', 'deploy_map.json');
const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const outIx = argv.indexOf('--out');
const OUT = outIx >= 0 ? argv[outIx + 1] : null;
const BRANCH = 'origin/gh-pages';

function die(msg) { console.error('✗ ' + msg); process.exit(1); }

/* ---- load + validate the map itself (an unchecked map rots — the Strategist's objection) ---- */
let map;
try { map = JSON.parse(fs.readFileSync(MAP, 'utf8')); }
catch (e) { die('cannot read ' + path.relative(root, MAP) + ': ' + e.message); }
const entries = map.entries;
if (!Array.isArray(entries) || !entries.length) die('deploy_map.json has no entries');

const ROLES = ['app', 'marketing', 'static', 'stub'];
const seenPub = new Map();
const mapFails = [];
entries.forEach((e, i) => {
  if (!e || typeof e.source !== 'string' || typeof e.published !== 'string')
    return mapFails.push('entry ' + i + ' is missing source/published');
  if (ROLES.indexOf(e.role) < 0)
    mapFails.push(e.source + ': role "' + e.role + '" is not one of ' + ROLES.join('|'));
  if (!fs.existsSync(path.join(root, e.source)))
    mapFails.push(e.source + ': source file does not exist');
  if (seenPub.has(e.published))
    mapFails.push(e.published + ': published twice (from ' + seenPub.get(e.published) + ' and ' + e.source + ')');
  seenPub.set(e.published, e.source);
});
if (entries.filter(e => e.role === 'app').length !== 1)
  mapFails.push('exactly one entry must carry role "app" (found ' +
    entries.filter(e => e.role === 'app').length + ')');
if (mapFails.length) { mapFails.forEach(m => console.error('  ✗ ' + m)); die('deploy map is invalid'); }

/* ---- materialise ---- */
if (OUT) {
  entries.forEach(e => {
    const dst = path.join(OUT, e.published);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(path.join(root, e.source), dst);
  });
  console.log('✓ wrote ' + entries.length + ' files to ' + OUT);
}

/* ---- --check: path set strictly, content informationally ---- */
if (CHECK) {
  let liveList;
  try { liveList = cp.execSync('git ls-tree -r --name-only ' + BRANCH, { encoding: 'utf8', cwd: root }); }
  catch (e) { die('cannot read ' + BRANCH + ' — fetch it first (git fetch origin gh-pages)'); }
  const live = new Set(liveList.split('\n').map(s => s.trim()).filter(Boolean));
  const want = new Set(entries.map(e => e.published));

  const missing = [...want].filter(p => !live.has(p)).sort();   // map publishes it, live lacks it
  const extra = [...live].filter(p => !want.has(p)).sort();     // live serves it, map forgot it

  console.log('\n— PATH SET vs ' + BRANCH + ' (must be empty) —');
  missing.forEach(p => console.log('  + would ADD    ' + p));
  extra.forEach(p => console.log('  - would REMOVE ' + p + '   ← live file the map does not declare'));
  if (!missing.length && !extra.length) console.log('  ✓ identical (' + want.size + ' files)');

  console.log('\n— CONTENT (informational: source legitimately runs ahead of live between releases) —');
  let differing = 0;
  entries.forEach(e => {
    if (!live.has(e.published)) return;
    let liveBuf;
    try { liveBuf = cp.execSync('git show ' + BRANCH + ':' + e.published, { cwd: root, maxBuffer: 1 << 28, encoding: 'buffer' }); }
    catch (_) { return; }
    const srcBuf = fs.readFileSync(path.join(root, e.source));
    if (!srcBuf.equals(liveBuf)) {
      differing++;
      console.log('  ~ ' + e.source + ' → ' + e.published +
        '   (' + srcBuf.length + ' B source vs ' + liveBuf.length + ' B live)');
    }
  });
  if (!differing) console.log('  ✓ every published file is byte-identical to live');

  if (missing.length || extra.length) die('PATH SET DIFFERS — do not deploy until the map matches');
  console.log('\n✓ deploy map path set verified against ' + BRANCH);
}

if (!CHECK && !OUT) {
  console.log('usage: deploy.js --check | --out <dir>');
  process.exit(2);
}
