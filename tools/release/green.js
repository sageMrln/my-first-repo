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

// 0) HTML script-parse guard — every <script> in index.html must be valid JS (browser-load parity).
//    Catches the class of bug where a minified/i18n merge leaves a stray brace and the WHOLE app
//    script dies on load — invisible to function-extraction suites and to brace-BALANCE preflight.
section('HTML script-parse guard — tools/test/html_parse_test.js');
run(['tools/test/html_parse_test.js'], 'html-parse guard');

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

// Meal Ideas engine + DB guard (council v40): coverage, macros, boundaries, allergens, the banana bug
section('meal engine & database — tools/test/meal_test.js');
run(['tools/test/meal_test.js'], 'meal suite');

// 5b) committed Smart Onboarding priority-picker test — tab-order mapping contract
//     Guards that priority picker → tabOrder sets picked tabs first in order,
//     unpicked follow in original order, no tab lost/duplicated, skip path preserves order
section('Smart Onboarding priority-picker mapping — tools/test/onboarding_test.js');
run(['tools/test/onboarding_test.js'], 'onboarding suite');

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

// 9) committed Personal Records (PRs) test — strength + cardio support
//    Guards cardio expansion (distance/time/pace), back-compat for old PRs without type,
//    grouping by (exercise, type) prevents collisions, and render logic never applies 1RM to cardio
section('Personal Records (strength + cardio) — tools/test/pr_test.js');
run(['tools/test/pr_test.js'], 'PR suite');

// 10) committed tax engine test — all 13 countries (5 new FR/IT/SG/JP/KR, 8 old DK/US/GB/DE/ES/SE/NO/XX)
//     Guards sane output (finite, ≥0, ≤gross, correct currency), poison gate (NaN on bypass),
//     back-compat (no regression on existing engines), and edge cases (zero/negative/empty no-crash)
section('tax engine — tools/test/tax_test.js');
run(['tools/test/tax_test.js'], 'tax suite');

// 11) committed Media Log test — rating clamping, formatting, ranking, calibration-neighbour selection
//     Guards clamp(r) keeps ratings in [1,10] at 0.1 resolution, fmtR formats one decimal,
//     ranked() sorts by rating desc + title asc (excludes to-watch), calibration ±0.2 filter
//     excludes self, and back-compat for entries missing status or rating don't crash the sort
section('Media Log (rating/ranking/calibration) — tools/test/media_test.js');
run(['tools/test/media_test.js'], 'media suite');

section('Save Safety (durability fail-loud + detection) — tools/test/savesafety_test.js');
run(['tools/test/savesafety_test.js'], 'save-safety suite');

// committed Monthly Income Log guard — the DERIVED low/typical/high engine that now drives the
// whole finance model. Locks the median math, the last-12 window, the >=3-month threshold, the
// manual-override-until-next-log precedence, de-dupe, and old-save migration.
section('Monthly Income Log (derive + precedence) — tools/test/income_log_test.js');
run(['tools/test/income_log_test.js'], 'income-log suite');

// committed import-sanitize guard — locks Akashi's stored-XSS fix (imported ids/keys/numerics
// are neutralized at the applyImportedData chokepoint; legit data passes through unchanged)
section('import sanitize (stored-XSS guard) — tools/test/import_sanitize_test.js');
run(['tools/test/import_sanitize_test.js'], 'import-sanitize suite');

// 12) deep pre-publish guard on the app itself
section('preflight — index.html (slots empty · no private key · 1 public key · no PII · PUBCHK · script balance)');
run(['tools/publish/preflight.js', 'index.html'], 'preflight(index.html)');

// 12a) preflight guard on landing.html — static public marketing page (no slots/keys/watchdogs; legal-identity exception for footer contact)
section('preflight — landing.html (static marketing page, no PII except sanctioned footer contact)');
run(['tools/publish/preflight.js', 'landing.html'], 'preflight(landing.html)');

// 12b) preflight guard on legal.html — static legal + privacy page (legal-identity exception for provider/contact throughout)
section('preflight — legal.html (static legal page, legal-identity exception for provider/contact)');
run(['tools/publish/preflight.js', 'legal.html'], 'preflight(legal.html)');

// 12c) guards the TIGHT legal-identity PII exception in preflight (the intended-public
//      trader name/contact is allowed ONLY inside #legalBack — never a blanket removal)
section('preflight PII exception guard — tools/test/preflight_pii_test.js');
run(['tools/test/preflight_pii_test.js'], 'preflight-PII guard');

// 13) leak scan across every OTHER published text file (the "whole surface" rule)
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

// 14) version-drift guard — the visible build tag (index.html APP_VER) MUST equal sw.js VERSION,
//     or a device can't be told which build it runs and the "update ready" signal misfires.
section('version tag — index.html APP_VER === sw.js VERSION');
try {
  const idx = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const av = (idx.match(/APP_VER\s*=\s*'([^']+)'/) || [])[1];
  const sv = (sw.match(/VERSION\s*=\s*'([^']+)'/) || [])[1];
  if (!av) { console.log('  ✗ APP_VER not found in index.html'); failed = true; }
  else if (!sv) { console.log('  ✗ VERSION not found in sw.js'); failed = true; }
  else if (av !== sv) { console.log('  ✗ drift: index.html APP_VER=' + av + ' but sw.js VERSION=' + sv); failed = true; }
  else console.log('  ✓ build tag matches sw.js (' + av + ')');
} catch (e) { console.log('  ✗ version check errored: ' + e.message); failed = true; }

section('VERDICT');
console.log(failed
  ? '✗ RED — do NOT ship. Fix the above, then re-run.'
  : '✓ GREEN — parser suite passed and every published file is clear to publish.');
process.exit(failed ? 1 : 0);
