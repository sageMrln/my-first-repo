#!/usr/bin/env node
/* Pre-publish safety guard — run BEFORE any gh-pages / live push.
 *
 *   node tools/publish/preflight.js [path-to-file.html]   (defaults to ./index.html)
 *
 * Why this is committed (release retro, adopted by Kaito): nothing private must ever
 * reach the public mirror. This run we checked by hand each time; a committed guard
 * makes it automatic and impossible to forget. Exit 1 on ANY violation — Hugo wires
 * this into the release flow so a failing preflight blocks the push.
 *
 * TWO published-file profiles (selected by filename — checks that do not apply to a
 * file are SKIPPED, never faked):
 *   • index.html — the APP. Full check: owner slots empty, no private key, exactly one
 *     public key, no owner PII (with the #legalBack legal-identity exception), PUBCHK
 *     anti-tamper intact, <script> tags balanced.
 *   • landing.html / legal.html — the STATIC public marketing + legal pages. They carry
 *     no owner data slots, no signing key and no watchdog, so the index-only structural
 *     checks (slot-present, exactly-one-public-key, PUBCHK) do not apply. The
 *     leak-relevant subset still runs: no private-key material, no owner PII (with a
 *     TIGHT contact/footer identity exception, below), <script> tags balanced, and —
 *     defensively — IF an owner slot id ever appears it MUST be empty.
 *
 * Checks the PUBLIC copy for:
 *   1. owner data slots (#hud-state, #__ownerKeySrc) are EMPTY   (required on index)
 *   2. no private-key material (PKCS8 / BEGIN PRIVATE)           (all files)
 *   3. exactly one PUBLIC key present (verify-only)              (index only)
 *   4. no owner PII (name/email/CPR/IBAN-style)                  (all files, scoped exc.)
 *   5. anti-tamper intact (PUBCHK constant present)              (index only)
 *   6. <script> tags balanced (structural sanity)               (all files)
 */
const fs = require('fs');
const path = require('path');
const argv = process.argv.slice(2);
const roleIx = argv.indexOf('--role');
const roleArg = roleIx >= 0 ? String(argv[roleIx + 1] || '').toLowerCase() : null;
// NOTE: only skip the value slot when --role was actually given, or index 0 (the file
// itself) gets filtered out and preflight silently checks index.html instead of the
// file you named — a silent pass, which is the exact failure this flag exists to close.
const file = argv.filter((a, i) => i !== roleIx && (roleIx < 0 || i !== roleIx + 1))[0] || 'index.html';
const base = path.basename(file).toLowerCase();

/* PROFILE SELECTION — fails CLOSED.
 * Selecting the profile by filename was a silent hole: the migration publishes the app
 * as `app.html`, and app content under any name other than index.html slipped through
 * with "✓ CLEAR to publish" while skipping the public-key count, the PUBCHK watchdog
 * and the owner-slot presence checks. A stripped watchdog would have shipped under a
 * green tick. So: an explicit --role wins; otherwise the deploy map decides; otherwise
 * the legacy filename rule; and anything still undeclared gets the FULL APP profile,
 * because over-checking a marketing page costs a false alarm while under-checking app
 * content costs the product. Any new published file must be declared to pass. */
// How much checking each role buys. Used ONLY to stop a downgrade — never to pick a role.
const ROLE_STRENGTH = { app: 3, marketing: 2, stub: 2, static: 1 };
// What the deploy map says about this file. Authoritative when present: it is committed
// and reviewed, whereas an --role flag is whatever the person at the keyboard typed.
let mapRole = null;
try {
  const map = JSON.parse(fs.readFileSync(path.join(__dirname, 'deploy_map.json'), 'utf8'));
  const rel = path.relative(path.resolve(__dirname, '..', '..'), path.resolve(file)).split(path.sep).join('/');
  const hit = map.entries.filter(e => e.source === rel || e.published === rel)[0];
  if (hit) mapRole = hit.role;
} catch (_) { /* map unreadable → fall through to the filename rule, then fail closed */ }

let role = null;
let roleNote = '';
if (roleArg) {
  if (!ROLE_STRENGTH[roleArg]) {
    console.error('✗ preflight: unknown --role "' + roleArg + '"'); process.exit(1);
  }
  // --role may DECLARE a role for an unmapped file, or restate/strengthen a mapped one.
  // It must NEVER weaken what the map declares. Measured before this guard existed:
  // `preflight.js index.html --role marketing` printed "✓ CLEAR to publish" on an
  // index.html whose PUBCHK watchdog had been gutted, because marketing skips the
  // watchdog/public-key/slot-presence checks. The flag is a convenience, not an
  // authority — a downgrade below the map is now a BLOCK. (Akashi)
  if (mapRole && ROLE_STRENGTH[roleArg] < ROLE_STRENGTH[mapRole]) {
    console.error('✗ preflight: --role ' + roleArg + ' would WEAKEN the deploy map\'s declared role "' +
      mapRole + '" for ' + file + ' — refusing. Fix the map, or drop the flag.');
    process.exit(1);
  }
  role = roleArg;
} else {
  role = mapRole;
  if (!role) role = (base === 'landing.html' || base === 'legal.html') ? 'marketing' : 'app';
}
// "static" describes a byte asset (icon, font, PDF, CNAME, manifest) — never a page of
// markup. An .html carrying that role would skip the public-key count, the owner-slot
// presence check and PUBCHK, i.e. a stripped watchdog under a green tick. Same principle
// the block above already states: over-checking a marketing page costs a false alarm,
// under-checking app content costs the product. So fail CLOSED onto the app profile and
// say so out loud. (Akashi)
if (role === 'static' && /\.html?$/i.test(base)) {
  roleNote = ' — role "static" is not valid for an HTML page; using the full app profile (fail-closed)';
  role = 'app';
}
const isIndex = role === 'app';
// static public marketing + legal pages: no app slots / signing key / watchdog to check.
const isMarketing = role === 'marketing' || role === 'stub';
const html = fs.readFileSync(file, 'utf8');
const fails = [];
const ok = [];

// --- check 1: owner data slots must be empty ---
// On index they MUST be present AND empty. On any other public file they are not
// expected — but if one ever appears it MUST be empty (a populated owner slot is a
// leak wherever it lives). So: required===isIndex; present-but-non-empty always fails.
function slotEmpty(id) {
  const m = html.match(new RegExp('id="' + id + '"[^>]*>([\\s\\S]*?)</script>'));
  return m ? m[1].trim() === '' : null;
}
[['hud-state'], ['__ownerKeySrc']].forEach(([id]) => {
  const e = slotEmpty(id);
  if (e === null) {
    if (isIndex) fails.push(`slot #${id} not found`);
    else ok.push(`#${id} absent (not expected on this page)`);
  } else if (!e) fails.push(`slot #${id} is NOT empty — private data would leak`);
  else ok.push(`#${id} empty`);
});

// --- check 2: no private-key material (ALL files) ---
if (/BEGIN [A-Z ]*PRIVATE|pkcs8/i.test(html)) fails.push('private-key material present');
else ok.push('no private-key material');

// --- check 3: exactly one PUBLIC key (index only; marketing pages carry no key) ---
if (isIndex) {
  const pub = (html.match(/PUB_B64\s*=\s*'MFkw/g) || []).length;
  if (pub === 1) ok.push('public key present (1)');
  else fails.push(`expected exactly 1 public key, found ${pub}`);
}

// --- check 4: owner PII — strict, with a TIGHT legal-identity exception ---
// EU/DK consumer law REQUIRES a named, identifiable trader + a contact, so the provider
// name "Osefe Miradi" and the contact "Kontaktmrln@gmail.com" are intended-public — but
// ONLY as the provider/contact identity lines. We strip ONLY those exact sanctioned
// forms, then run the normal PII scan on the result. The SAME name/email is still a
// BLOCK anywhere else, and CPR/IBAN-style PII is still caught. The exception is scoped
// per file (fail-closed — anything not matching an anchored allow-form still trips):
//   • index.html   — allow-forms live INSIDE the #legalBack modal only (LEGAL_ALLOW).
//                     If that block can't be located the WHOLE file is scanned unmodified.
//   • landing/legal — the static marketing + legal pages: the identity appears in the
//                     footer + the legal sections as Provider:/Contact:/mailto-anchor/
//                     standalone <p>email</p> forms. Each allow-form is context-anchored,
//                     so a BARE or unexpected occurrence (comment, heading, bare text)
//                     is NOT stripped and still BLOCKS.
// NOTE (email change, v39): the sanctioned contact is now the BRANDED, NON-OWNER address
// Kontaktmrln@gmail.com, which by design does NOT match PII_RE (no 'miradi'/'osefe@') — it is
// intended-public and may appear anywhere. PII_RE still tracks the owner IDENTITY: the name
// 'Osefe Miradi' (via 'miradi') and any owner personal email (via 'osefe@'), plus CPR/IBAN. So
// the NAME remains the only owner token that must be stripped-in-sanctioned-context /
// blocked-elsewhere; the email allow-forms below stay anchored to the new address only to keep
// the strips meaningful (they are no longer load-bearing for PII, since the address isn't PII).
const PII_RE = /miradi|osefe@|[^a-z]cpr[^a-z]|\bDK\d{8,}\b/gi;

// index.html: sanctioned identity forms, allowed ONLY inside the #legalBack block
const LEGAL_ALLOW = [
  // Terms/Privacy identity line: "… · Provider: Osefe Miradi[ ("we", "us")] · Contact: Kontaktmrln@gmail.com"
  /Provider:\s*Osefe Miradi(?:\s*\("we",\s*"us"\))?\s*·\s*Contact:\s*Kontaktmrln@gmail\.com/g,
  // the standalone Contact-section paragraph <p>Kontaktmrln@gmail.com</p>
  /<p>\s*Kontaktmrln@gmail\.com\s*<\/p>/g,
  // Refund-section inline contact (EU/DK consumer-law refund address) — anchored by "contact us at "
  /contact us at Kontaktmrln@gmail\.com/g
];

// index.html: the lock-screen renewal-contact sentence, allowed ONLY inside the
// .lk-foot element. The SAME sanctioned public contact (Kontaktmrln@gmail.com) is
// reused as the "email me to get next month's key" renewal instruction (keys are
// delivered by email). Anchored to the EXACT phrasing AND scoped to .lk-foot, so a
// bare/stray Kontaktmrln@gmail.com — or ANY other email — in the lock foot or
// anywhere else still trips PII_RE. Fail-closed: if .lk-foot isn't found nothing is
// stripped and the phrase would BLOCK (never leak).
const LOCK_ALLOW = [
  /Email Kontaktmrln@gmail\.com to get next month's key/g
];

// index.html: the SAME renewal sentence is carried into the i18n translation dictionary
// (key = the exact English source string; value = the per-language translation). The email
// is intended-public, but the email address itself is NOT translated, so it appears once in
// the key and once in each language's value. We allow it ONLY inside the exact renewal
// key:value pair, anchored to the full quoted English key, and — via a callback — strip
// ONLY the email token, never the surrounding value. So an injected CPR/IBAN or any other
// PII smuggled into that value STILL trips PII_RE, and the email in any OTHER dict entry
// (different key) is untouched and still BLOCKS.
const RENEWAL_I18N = /"Your key unlocks the dashboard for the month\. Email Kontaktmrln@gmail\.com to get next month's key\. Your financial data never leaves this device\.":"[^"]*Kontaktmrln@gmail\.com[^"]*"/g;

// landing.html / legal.html: sanctioned contact/footer identity forms (context-anchored)
const CONTACT_ALLOW = [
  // Provider name (bold or plain), optionally followed by ("we", "us") — footer, meta, legal eff-lines
  /Provider:\s*(?:<strong>)?Osefe Miradi(?:<\/strong>)?(?:\s*\("we",\s*"us"\))?/g,
  // Contact label + email, plain or linked
  /Contact:\s*(?:<a href="mailto:Kontaktmrln@gmail\.com">)?Kontaktmrln@gmail\.com(?:<\/a>)?/g,
  // a mailto anchor to the sanctioned address anywhere it is used (e.g. the Refund section)
  /<a href="mailto:Kontaktmrln@gmail\.com">Kontaktmrln@gmail\.com<\/a>/g,
  // the standalone Contact-section paragraph <p>Kontaktmrln@gmail.com</p>
  /<p>\s*Kontaktmrln@gmail\.com\s*<\/p>/g
];

let piiScan = html;
if (isMarketing) {
  // whole-page scan; only the anchored allow-forms are removed before the PII sweep
  let sanitized = html;
  CONTACT_ALLOW.forEach(function (re) { sanitized = sanitized.replace(re, ''); });
  piiScan = sanitized;
} else {
  // index-style: fail-closed, scoped strips of anchored sanctioned forms only.
  let sanitized = html;
  // (a) legal-identity forms — ONLY inside the #legalBack modal block.
  const legalBlock = sanitized.match(/<div class="modal-back" id="legalBack">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
  if (legalBlock) {
    let lb = legalBlock[0];
    LEGAL_ALLOW.forEach(function (re) { lb = lb.replace(re, ''); });
    sanitized = sanitized.replace(legalBlock[0], lb);
  }
  // (b) the renewal-contact sentence — ONLY inside the lock-screen .lk-foot element.
  const lockFoot = sanitized.match(/<div class="lk-foot"[\s\S]*?<\/div>/);
  if (lockFoot) {
    let lf = lockFoot[0];
    LOCK_ALLOW.forEach(function (re) { lf = lf.replace(re, ''); });
    sanitized = sanitized.replace(lockFoot[0], lf);
  }
  // (c) the renewal sentence's i18n dictionary entries — strip ONLY the sanctioned email
  //     token, and ONLY within the exact renewal key:value pair (any other PII in that
  //     value, or the email under any other key, still BLOCKS).
  sanitized = sanitized.replace(RENEWAL_I18N, function (m) { return m.replace(/Kontaktmrln@gmail\.com/g, ''); });
  piiScan = sanitized;
}
const pii = piiScan.match(PII_RE);
if (pii) fails.push('possible owner PII: ' + [...new Set(pii)].join(', '));
else ok.push('no owner PII (legal-identity exception applied)');

// --- check 5: anti-tamper watchdog present (index only) ---
if (isIndex) {
  if (/PUBCHK\s*=\s*4047293148/.test(html)) ok.push('PUBCHK watchdog intact');
  else fails.push('PUBCHK watchdog missing/changed');
}

// --- check 6: <script> tags balanced (ALL files) ---
const open = (html.match(/<script\b/g) || []).length, close = (html.match(/<\/script>/g) || []).length;
if (open === close) ok.push(`script tags balanced (${open})`);
else fails.push(`script tags unbalanced: ${open} open / ${close} close`);

console.log('PREFLIGHT — ' + file + '  [role: ' + role + (roleArg ? ' (explicit)' : ' (resolved)') + ']' +
  (isMarketing ? ' (static public page)' : '') + roleNote);
ok.forEach(x => console.log('  ✓ ' + x));
fails.forEach(x => console.log('  ✗ ' + x));
console.log(fails.length ? '\n✗ BLOCKED — ' + fails.length + ' issue(s). Do NOT publish.' : '\n✓ CLEAR to publish.');
process.exit(fails.length ? 1 : 0);
