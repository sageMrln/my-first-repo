#!/usr/bin/env node
/* MRLN routing / deploy-map regression — root-migration council §6.
 *
 *   node tools/test/routing_test.js        (wired into tools/release/green.js)
 *
 * THE POINT: every assertion below is stated against tools/publish/deploy_map.json,
 * never against a hard-coded target layout. So the same suite is meaningful at every
 * phase of the migration, and it catches the one failure class that has no visible
 * symptom until it is too late — the service worker, the manifest and the in-app
 * links disagreeing with where the app is actually published.
 *
 * Assertions that only become true at a later phase are ARMED by deploy_map.phase and
 * printed as "armed at phase N" when they are not yet active. That is deliberate: a
 * silently-skipped check is how a gate rots, so an inactive check still names itself.
 *
 * The load-bearing ones, in order of how much damage they prevent:
 *   #2  every sw.js CORE entry is a published path  → an atomic addAll() that 404s
 *       leaves the offline cache EMPTY for every user at once.
 *   #3  the sw document fallback is the app's published path → otherwise an offline
 *       launch of "/" serves the marketing page, or loops forever with no escape.
 *   #8  the root router preserves BOTH location.search AND location.hash → dropping
 *       the fragment makes a brand-new customer's valid key report "belongs to a
 *       different file" (index.html rejects payload.f !== STATE.fid). Invisible to
 *       anyone testing on a device whose fid is already persisted.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const R = p => fs.readFileSync(path.join(root, p), 'utf8');

let failed = 0, armed = 0, held = 0;
function ok(m) { console.log('  ✓ ' + m); }
function bad(m) { console.log('  ✗ ' + m); failed++; }
function check(cond, m) { cond ? ok(m) : bad(m); }
/* an assertion that only applies from `p` onward — still named when inactive */
function fromPhase(p, m, fn) {
  if (PHASE >= p) { armed++; fn(); }
  else { held++; console.log('  · ' + m + '   (armed at phase ' + p + '; map says ' + PHASE + ')'); }
}

/* ------------------------------------------------------------------ the map */
const map = JSON.parse(R('tools/publish/deploy_map.json'));
const PHASE = map.phase;
const entries = map.entries;
const app = entries.filter(e => e.role === 'app')[0];
const pub = new Set(entries.map(e => e.published));
const bySource = {}; entries.forEach(e => { bySource[e.source] = e; });

console.log('\n[1] deploy map — structure');
check(typeof PHASE === 'number' && PHASE >= 0 && PHASE <= 4, 'phase is a number 0..4 (' + PHASE + ')');
check(!!app, 'exactly one entry carries role "app"' + (app ? ' → ' + app.source + ' publishes as ' + app.published : ''));
check(entries.every(e => fs.existsSync(path.join(root, e.source))), 'every mapped source file exists');
check(pub.size === entries.length, 'published paths are unique');
check(entries.every(e => ['app', 'marketing', 'static', 'stub'].indexOf(e.role) >= 0), 'every role is app|marketing|static|stub');
/* pin the set size so a file cannot be added to or dropped from the publish set
   without a deliberate edit here — the "expected set" half of council test #1 */
check(entries.length === 74, 'published set is 74 files (update this pin deliberately, never casually) — got ' + entries.length);   // 74: +Cabin-OFL.txt (Akashi compliance, 2026-08-10)

const APP_PUB = app ? app.published : 'index.html';
const APP_REL = './' + APP_PUB;                       // what sw.js must reference
const APP_URL = 'https://mrln.online/' + (APP_PUB === 'index.html' ? '' : APP_PUB);

/* ------------------------------------------------------------------ sw.js */
const sw = R('sw.js');
console.log('\n[2] sw.js — cache list vs the map');
const coreM = sw.match(/var\s+CORE\s*=\s*\[([^\]]*)\]/);
const critM = sw.match(/var\s+CRITICAL\s*=\s*\[([^\]]*)\]/);
const listPaths = m => m ? (m[1].match(/'[^']*'|"[^"]*"/g) || []).map(s => s.slice(1, -1)) : [];
const cacheList = listPaths(coreM).concat(listPaths(critM));
check(cacheList.length > 0, 'sw.js declares a CORE (and/or CRITICAL) precache list');
cacheList.forEach(p => {
  const rel = p.replace(/^\.\//, '');
  if (rel === '' || rel === '/') {                      // './' is the directory index
    check(pub.has('index.html'), "CORE './' resolves to a published index.html");
  } else {
    check(pub.has(rel), 'CORE entry ' + p + ' is a published path in the map');
  }
});

console.log('\n[3] sw.js — offline fallback follows the app, not the filename');
const fbM = sw.match(/caches\.match\(\s*'(\.\/[^']*)'\s*\)/g) || [];
check(fbM.length === 1, 'exactly one hard-coded document fallback in sw.js (found ' + fbM.length + ')');
check(sw.indexOf("caches.match('" + APP_REL + "')") >= 0,
  "document fallback is '" + APP_REL + "' — the app's published path");
fromPhase(2, "sw.js contains no caches.match('./index.html')", () => {
  check(sw.indexOf("caches.match('./index.html')") < 0, "no stale caches.match('./index.html')");
});

console.log('\n[4] sw.js — a tapped reminder must open the app');
const nc = (sw.match(/openWindow\(\s*'([^']*)'\s*\)/) || [])[1];
if (APP_PUB === 'index.html') check(nc === './' || nc === APP_REL, "notificationclick opens the app ('" + nc + "')");
else check(nc === APP_REL, "notificationclick opens '" + APP_REL + "' (got '" + nc + "')");

fromPhase(2, 'sw.js install fails loud + skipWaiting inside the success path', () => {
  const inst = (sw.match(/addEventListener\('install'[\s\S]*?\n\}\);/) || [''])[0];
  check(!/addAll\([^)]*\)\s*\.catch\(\s*function\s*\(\s*\)\s*\{\s*\}\s*\)/.test(inst),
    'install does not swallow a failed precache (an empty cache must not look like success)');
  check(inst.indexOf('skipWaiting') > inst.indexOf('addAll'),
    'skipWaiting() is inside the success path, after the precache resolves');
});
fromPhase(2, 'sw.js document cache-put is restricted to the app pathname', () => {
  const doc = (sw.match(/if\(isDoc\)\{[\s\S]*?\n  \}/) || [''])[0];
  check(/pathname/.test(doc), 'the document branch guards its cache.put by pathname');
});

/* ------------------------------------------------------------------ manifest */
console.log('\n[5] manifest — identity and launch target');
const mf = JSON.parse(R('manifest.webmanifest'));
check(mf.scope === '.', 'scope is "." (got ' + JSON.stringify(mf.scope) + ')');
const su = String(mf.start_url || '').replace(/^\.\//, '');
check(su === '' || su === '.' || pub.has(su), 'start_url resolves to a published path (' + JSON.stringify(mf.start_url) + ')');
fromPhase(2, 'manifest start_url is the app and carries an explicit id', () => {
  check(mf.start_url === APP_REL, 'start_url === "' + APP_REL + '" (got ' + JSON.stringify(mf.start_url) + ')');
  /* id must land in the SAME edit as a start_url change or Chromium discards the
     update and the install keeps launching the old URL forever */
  check(mf.id === '/', 'id === "/" — pins the existing install identity (got ' + JSON.stringify(mf.id) + ')');
});

/* ------------------------------------------------------------------ the root router */
console.log('\n[6] published root — the permanent router');
const rootEntry = entries.filter(e => e.published === 'index.html')[0];
const rootIsApp = rootEntry && rootEntry.role === 'app';
if (rootIsApp) {
  console.log('  · root still serves the app — no router required yet (phase ' + PHASE + ')');
  held++;
} else {
  armed++;
  const rootHtml = R(rootEntry.source);
  const head = rootHtml.slice(0, rootHtml.indexOf('</head>'));
  const firstEl = (head.match(/<(script|style|link|img|meta\s+http-equiv)/i) || [])[1];
  check(/MRLN ROOT ROUTER/.test(head), 'the router script is present in <head>');
  check(String(firstEl).toLowerCase() === 'script', 'the router is the FIRST element in <head> (found <' + firstEl + '>)');
  const rt = (head.match(/location\.replace\(\s*'([^']*)'\s*\+\s*([^)]*)\)/) || []);
  check(rt[1] === '/' + APP_PUB, "router target is '/" + APP_PUB + "' (got '" + rt[1] + "')");
  /* the single most important operator in the migration */
  check(/location\.search/.test(head) && /location\.hash/.test(head),
    'router reads BOTH location.search and location.hash');
  check(/\+\s*q\s*\+\s*h|search[\s\S]{0,40}hash/.test(String(rt[2] || '') + head),
    'router APPENDS the query and fragment to the target — a dropped #F- key reads as fraud');
  check(/sessionStorage/.test(head) && /4000|hop/.test(head), 'router carries the time-boxed hop guard');
  check(/stay|home/.test(head), 'router honours the ?stay=1 / ?home=1 escape');
}

/* ------------------------------------------------------------------ in-app links */
console.log('\n[7] in-app canonical links agree with the map');
const idx = R(app.source);
const hostBase = (idx.match(/var HOST_BASE\s*=\s*'([^']*)'/) || [])[1];
const canonBase = (idx.match(/function _canonLink\(\)\{ return '([^']*)'/) || [])[1];
check(!!hostBase && !!canonBase, 'HOST_BASE and _canonLink() both found in ' + app.source);
/* these two feed the lock-screen display and the copy-link button; if they ever
   disagree the app SHOWS one link and COPIES another */
check(hostBase === canonBase, 'HOST_BASE === _canonLink() base (' + hostBase + ' vs ' + canonBase + ')');
fromPhase(3, 'minted key links point at the app, not the marketing root', () => {
  check(hostBase === APP_URL + (APP_URL.endsWith('/') ? '' : ''), 'HOST_BASE === ' + APP_URL);
  entries.filter(e => /\.html$/.test(e.published) && e.role !== 'app').forEach(e => {
    check(R(e.source).indexOf("'https://mrln.online/'") < 0 && R(e.source).indexOf('"https://mrln.online/"') < 0,
      e.source + ' contains no bare app link of exactly https://mrln.online/');
  });
});

/* ------------------------------------------------------------------ stub + 404 */
console.log('\n[8] retired aliases');
fromPhase(3, 'landing.html is a <2 KB redirect stub and 404.html rescues extensionless aliases', () => {
  const stub = entries.filter(e => e.published === 'landing.html')[0];
  check(stub && stub.role === 'stub', 'landing.html is published from a stub source');
  if (stub) {
    const s = R(stub.source);
    check(Buffer.byteLength(s) < 2048, 'stub is under 2 KB (' + Buffer.byteLength(s) + ' B)');
    check(/rel=["']?canonical/.test(s), 'stub has rel=canonical → /');
    check(/http-equiv=["']?refresh/i.test(s), 'stub has a meta refresh (works without JS)');
    check(/location\.replace/.test(s), 'stub has the JS replace');
    check(/noindex/.test(s), 'stub is noindex');
  }
  const p404 = entries.filter(e => e.published === '404.html')[0];
  check(!!p404, '404.html is published');
  if (p404) {
    const s = R(p404.source);
    const hits = (s.match(/\/(landing|app|legal)\b/g) || []).length;
    check(hits >= 3, '404 rescue allowlist covers /landing, /app and /legal');
  }
});

/* ------------------------------------------------------------------ version pair */
/* ---------------------------------------------------- preflight profile selection */
console.log('\n[9] preflight picks its profile by ROLE, not by filename');
{
  const os = require('os'), cp = require('child_process');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrln-preflight-'));
  const bad = path.join(dir, 'app.html');
  /* the exact regression: app content published under a name other than index.html.
     Before --role this printed "✓ CLEAR to publish" while skipping the public-key
     count, the owner-slot presence check and the PUBCHK watchdog — a stripped
     watchdog would have shipped under a green tick. */
  fs.writeFileSync(bad, idx.replace('PUBCHK = 4047293148', 'PUBCHK = 1'));
  const run = a => {
    const r = cp.spawnSync(process.execPath, [path.join(root, 'tools/publish/preflight.js')].concat(a),
      { encoding: 'utf8' });
    return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
  };
  const r1 = run([bad]);
  check(r1.code === 1, 'app content named app.html with PUBCHK stripped is BLOCKED (exit ' + r1.code + ')');
  check(/role: app/.test(r1.out), 'it resolved to the app profile, not a marketing pass');
  const r2 = run([path.join(root, 'landing.html')]);
  check(r2.code === 0 && /role: marketing/.test(r2.out), 'landing.html still resolves to the marketing profile');
  /* an undeclared file must not slip through as "static" */
  const un = path.join(dir, 'whatever.html');
  fs.writeFileSync(un, '<html><head></head><body>hello</body></html>');
  const r3 = run([un]);
  check(/role: app/.test(r3.out), 'an UNDECLARED published file falls back to the full app profile (fails closed)');
  check(r3.code === 1, 'and is therefore blocked until it is declared in the map (exit ' + r3.code + ')');
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) { }
}

console.log('\n[10] version tag reads from the map, not the filename');
const av = (idx.match(/APP_VER\s*=\s*'([^']+)'/) || [])[1];
const sv = (sw.match(/VERSION\s*=\s*'([^']+)'/) || [])[1];
check(!!av && av === sv, 'APP_VER (' + av + ' in ' + app.source + ') === sw.js VERSION (' + sv + ')');

console.log('\n' + (failed ? '✗ routing_test: ' + failed + ' failure(s)' : '✓ routing_test: all assertions passed') +
  '   [' + armed + ' phase-gated group(s) armed, ' + held + ' held for a later phase]');
process.exit(failed ? 1 : 0);
