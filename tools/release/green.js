#!/usr/bin/env node
/* tools/release/green.js — the single GREEN gate for a release.
 *
 *   node tools/release/green.js
 *
 * What "GREEN" means (per the release retro, Kaito's adoption): a release is GREEN
 * only when BOTH of these hold, across EVERY file that publishes to gh-pages:
 *   1. the committed parser regression suite passes  (tools/test/parse_test.js)
 *   2. the pre-publish safety guard is clear         (tools/publish/preflight.js)
 *
 * preflight.js does the deep structural/key check on index.html. But the gate must
 * cover the WHOLE published surface — this run, GUIDE.md + the rebuilt PDF shipped
 * outside a sign-off and only a manual catch saved us. So this runner also leak-scans
 * every OTHER published text file for private-key material and owner PII.
 *
 * Exit 0 = GREEN (safe to hand to the publish gate). Exit 1 = RED (do not ship).
 *
 * Hugo owns this runner (orchestration + multi-file leak net). It SHELLS OUT to the
 * parser suite and preflight rather than copying them, so each stays owned by its
 * author and there is no logic drift.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');

let failed = false;
function section(t) { console.log('\n=== ' + t + ' ==='); }
function run(args, label) {
  try {
    console.log(execFileSync('node', args, { cwd: root, encoding: 'utf8' }).trimEnd());
  } catch (e) {
    console.log((e.stdout || '').trimEnd());
    if (e.stderr) console.log(e.stderr.trimEnd());
    console.log('✗ ' + label + ' FAILED (exit ' + (e.status != null ? e.status : '?') + ')');
    failed = true;
  }
}

// 1) committed parser regression suite — runs the live parseClause from index.html
section('parser regression — tools/test/parse_test.js');
run(['tools/test/parse_test.js'], 'parser suite');

// 2) committed assistant MRLN test suite — router + Q&A engine
section('assistant MRLN test — tools/test/assistant_test.js');
run(['tools/test/assistant_test.js'], 'assistant suite');

// 3) committed Tier 0 streak engine test
section('Tier 0 streak engine — tools/test/streak_test.js');
run(['tools/test/streak_test.js'], 'streak suite');

// 4) committed sound engine test — Tier 0 UI sounds (Web Audio, offline, no files)
section('Tier 0 sound engine — tools/test/sound_test.js');
run(['tools/test/sound_test.js'], 'sound suite');

// 5) committed tab reorder test — nav tab repositioning + ripple logic
section('tab reorder engine — tools/test/reorder_test.js');
run(['tools/test/reorder_test.js'], 'reorder suite');

// 6) committed data-transfer round-trip test — export → decode → deep-diff for losslessness
//    Phase 1: guards exportDataCode/decodeDataCode/applyImportedData field lists don't drift
section('data-transfer losslessness — tools/test/transfer_test.js');
run(['tools/test/transfer_test.js'], 'transfer suite');

// 7) committed assistant silly-question test — misspells, typos, affordability on small amounts
//    Guards against the "20 kr gum" bug and questions that slip through to the dead-end answer
section('assistant silly-question test — tools/test/assistant_silly_test.js');
run(['tools/test/assistant_silly_test.js'], 'assistant silly suite');

// 8) committed photo-storage IndexedDB logic guard — zero-loss migration, fail-closed import
//    Photos moved off the ~5MB localStorage ceiling; this guards the SECURITY-CRITICAL
//    logic (strip-on-save, migrate + hydrate, fail-closed on put failure, export exclusion)
section('photo-storage IndexedDB logic — tools/test/photo_store_test.js');
run(['tools/test/photo_store_test.js'], 'photo store suite');

// 9) deep pre-publish guard on the app itself
section('preflight — index.html (slots empty · no private key · 1 public key · no PII · PUBCHK · script balance)');
run(['tools/publish/preflight.js', 'index.html'], 'preflight(index.html)');

// 10) leak scan across every OTHER published text file (the "whole surface" rule)
//     Amend PUBLISHED_TEXT when the gh-pages deploy set changes. index.html is covered
//     by preflight above; the PDF derives from GUIDE.md (scanned) and is binary.
const PUBLISHED_TEXT = ['GUIDE.md', 'manifest.webmanifest', 'sw.js', 'team-chat.html'];
const KEY = /BEGIN [A-Z ]*PRIVATE|pkcs8/i;                       // private-key material
const PII = () => /miradi|osefe@|[^a-z]cpr[^a-z]|\bDK\d{8,}\b/gi; // owner PII (same shape as preflight)
section('leak scan — other published files');
PUBLISHED_TEXT.forEach(function (f) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) { console.log('  - ' + f + ' (not present — skipped)'); return; }
  const t = fs.readFileSync(p, 'utf8');
  const issues = [];
  if (KEY.test(t)) issues.push('private-key material');
  const pii = t.match(PII());
  if (pii) issues.push('owner PII: ' + [...new Set(pii)].join(', '));
  if (issues.length) { console.log('  ✗ ' + f + ' — ' + issues.join('; ')); failed = true; }
  else console.log('  ✓ ' + f + ' clean');
});
console.log('  · MRLN-Guide.pdf derives from GUIDE.md (scanned above); binary — not text-scanned here.');

section('VERDICT');
console.log(failed
  ? '✗ RED — do NOT ship. Fix the above, then re-run.'
  : '✓ GREEN — parser suite passed and every published file is clear to publish.');
process.exit(failed ? 1 : 0);
