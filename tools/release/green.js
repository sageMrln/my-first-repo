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

// 11b) price-signal differential — the assistant must never green-light a purchase against
//      a number it invented from a product name ("can I afford a PS5?" -> "Yes, 5 kr fits").
//      Extracts the LIVE _priceFrom and pins model-designator questions to "ask, don't answer"
//      while real prices still answer. Never delete a case here; add one when a bug is found.
section('assistant price-signal differential — tools/test/price_test.js');
run(['tools/test/price_test.js'], 'price suite');

// 11c) routing / deploy-map regression — the source→published rename, the service
//      worker's cache list and fallback, the manifest identity, and (from phase 3)
//      the root router that must forward BOTH ?query and #fragment. Every assertion
//      is stated against tools/publish/deploy_map.json, so it stays meaningful as the
//      migration advances instead of pinning one layout.
section('routing & deploy map — tools/test/routing_test.js');
run(['tools/test/routing_test.js'], 'routing suite');

// 11d) allergen / dislike filter across the six non-English languages we ship.
//      The app promises "never suggest a dislike" in seven languages; the matcher
//      is ASCII-only, so most non-English allergen terms hide NOTHING and seven of
//      them are Levenshtein-corrected into an unrelated food (worse than a miss).
//      Ships XFAIL BY DESIGN (council 2026-08-05 §4 row A0): it prints the live
//      count every run and exits 0 while the count is at or below the recorded
//      baseline, and exits 1 the moment it goes UP. The number can only go down.
//      It does NOT block the gate today; the fix is stage C1. Do not "quiet" it.
section('allergen dislike filter × 6 languages — tools/test/allergen_i18n_test.js  [XFAIL RATCHET]');
run(['tools/test/allergen_i18n_test.js'], 'allergen i18n ratchet');

// 12) deep pre-publish guard on EVERY published HTML page, driven by the deploy map.
//     Hand-listing the three pages was drift waiting to happen: a new published file
//     simply would not be preflighted, and the app is published under a DIFFERENT name
//     from phase 3 on. The map is the single source of truth for the deploy set, and
//     --role carries the security profile across the rename. Fails closed: an unreadable
//     map stops the gate rather than silently checking nothing.
section('preflight — every published HTML page (role-driven, from tools/publish/deploy_map.json)');
let pfPages = null;
try {
  const dm = JSON.parse(fs.readFileSync(path.join(root, 'tools/publish/deploy_map.json'), 'utf8'));
  // EVERY published .html is preflighted, whatever role the map gives it. Excluding
  // role:"static" re-opened, one layer up, the exact silent-pass phase 0 set out to close:
  // an .html declared "static" (the role 58 of 61 entries use, so the natural typo for the
  // migration entry) was dropped from this loop entirely — no owner-slot check, no
  // private-key check, no PII scan, no PUBCHK. PROVEN on a scratch copy: app content
  // published as app.html with the watchdog gutted AND the owner-key slot populated still
  // printed "GREEN" once the file-count pin was bumped. preflight.js itself now also
  // fail-closes an .html declared static onto the full app profile. (Akashi)
  pfPages = dm.entries.filter(e => /\.html?$/i.test(e.source));
} catch (e) {
  console.log('  ✗ cannot read tools/publish/deploy_map.json — ' + e.message); failed = true;
}
if (pfPages && !pfPages.length) { console.log('  ✗ deploy map declares no publishable HTML page'); failed = true; }
(pfPages || []).forEach(e => {
  console.log('  · ' + e.source + ' → published as ' + e.published + ' [' + e.role + ']');
  run(['tools/publish/preflight.js', e.source, '--role', e.role], 'preflight(' + e.source + ')');
});

// 12c) guards the TIGHT legal-identity PII exception in preflight (the intended-public
//      trader name/contact is allowed ONLY inside #legalBack — never a blanket removal)
section('preflight PII exception guard — tools/test/preflight_pii_test.js');
run(['tools/test/preflight_pii_test.js'], 'preflight-PII guard');

// 13) leak scan across every OTHER published text file (the "whole surface" rule)
//     Amend PUBLISHED_TEXT when the gh-pages deploy set changes. index.html is covered
//     by preflight above; the PDF derives from GUIDE.md (scanned) and is binary.
//     NOTE (2026-08-04, Akashi): team-chat.html was REMOVED from this list. It is an
//     owner-local viewer, unpublished from gh-pages at 2964d70 and absent from
//     tools/publish/deploy_map.json — scanning it asserted over a file the deploy set
//     does not contain, which reads as coverage but is none. It stays in source,
//     unpublished; if it is ever re-added to the deploy map, it comes back here too.
const PUBLISHED_TEXT = ['GUIDE.md', 'manifest.webmanifest', 'sw.js'];
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

// 13b) PHONE-HOME scan — NO published file may reference raw.githubusercontent.
//      The in-app Team Room polled that host every 5s from a flag any visitor could set
//      (`#team` in the URL), which made the shipped customer build phone home and falsified
//      the "owner-gated / customer files never fetch" claim. The viewer is deleted; this
//      assertion is what stops it — or anything like it — coming back.
//      The file list is DERIVED from tools/publish/deploy_map.json (the single source of
//      truth for the deploy set) rather than hand-listed, so it cannot go stale the way
//      PUBLISHED_TEXT did. FAIL-CLOSED: an unreadable/unparseable map is a RED.
section('phone-home scan — no published file may reference raw.githubusercontent');
const PHONE_HOME = /raw\.githubusercontent/i;
const SKIP_BINARY = /\.(png|jpe?g|gif|webp|pdf|woff2?|ttf|otf|ico)$/i;
try {
  const map = JSON.parse(fs.readFileSync(path.join(root, 'tools/publish/deploy_map.json'), 'utf8'));
  const sources = (map.entries || []).map(e => e.source).filter(Boolean).filter(f => !SKIP_BINARY.test(f));
  if (!sources.length) { console.log('  ✗ deploy_map.json declared no scannable published files'); failed = true; }
  let dirty = 0;
  sources.forEach(function (f) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) { console.log('  ✗ ' + f + ' — declared in deploy_map.json but MISSING from source'); failed = true; dirty++; return; }
    if (PHONE_HOME.test(fs.readFileSync(p, 'utf8'))) {
      console.log('  ✗ ' + f + ' — references raw.githubusercontent (a published file must never phone home)');
      failed = true; dirty++;
    }
  });
  if (!dirty) console.log('  ✓ ' + sources.length + ' published text files — no raw.githubusercontent reference');
} catch (e) { console.log('  ✗ phone-home scan could not read tools/publish/deploy_map.json: ' + e.message); failed = true; }

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
