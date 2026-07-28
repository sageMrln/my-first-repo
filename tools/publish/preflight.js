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
const file = process.argv[2] || 'index.html';
const base = path.basename(file).toLowerCase();
const isIndex = base === 'index.html';
// static public marketing + legal pages: no app slots / signing key / watchdog to check.
const isMarketing = base === 'landing.html' || base === 'legal.html';
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
// name "Osefe Miradi" and the contact "Miradiosefe@gmail.com" are intended-public — but
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
const PII_RE = /miradi|osefe@|[^a-z]cpr[^a-z]|\bDK\d{8,}\b/gi;

// index.html: sanctioned identity forms, allowed ONLY inside the #legalBack block
const LEGAL_ALLOW = [
  // Terms/Privacy identity line: "… · Provider: Osefe Miradi[ ("we", "us")] · Contact: Miradiosefe@gmail.com"
  /Provider:\s*Osefe Miradi(?:\s*\("we",\s*"us"\))?\s*·\s*Contact:\s*Miradiosefe@gmail\.com/g,
  // the standalone Contact-section paragraph <p>Miradiosefe@gmail.com</p>
  /<p>\s*Miradiosefe@gmail\.com\s*<\/p>/g,
  // Refund-section inline contact (EU/DK consumer-law refund address) — anchored by "contact us at "
  /contact us at Miradiosefe@gmail\.com/g
];

// landing.html / legal.html: sanctioned contact/footer identity forms (context-anchored)
const CONTACT_ALLOW = [
  // Provider name (bold or plain), optionally followed by ("we", "us") — footer, meta, legal eff-lines
  /Provider:\s*(?:<strong>)?Osefe Miradi(?:<\/strong>)?(?:\s*\("we",\s*"us"\))?/g,
  // Contact label + email, plain or linked
  /Contact:\s*(?:<a href="mailto:Miradiosefe@gmail\.com">)?Miradiosefe@gmail\.com(?:<\/a>)?/g,
  // a mailto anchor to the sanctioned address anywhere it is used (e.g. the Refund section)
  /<a href="mailto:Miradiosefe@gmail\.com">Miradiosefe@gmail\.com<\/a>/g,
  // the standalone Contact-section paragraph <p>Miradiosefe@gmail.com</p>
  /<p>\s*Miradiosefe@gmail\.com\s*<\/p>/g
];

let piiScan = html;
if (isMarketing) {
  // whole-page scan; only the anchored allow-forms are removed before the PII sweep
  let sanitized = html;
  CONTACT_ALLOW.forEach(function (re) { sanitized = sanitized.replace(re, ''); });
  piiScan = sanitized;
} else {
  // index-style: strip sanctioned forms ONLY inside the #legalBack block (fail-closed)
  const legalBlock = html.match(/<div class="modal-back" id="legalBack">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
  if (legalBlock) {
    let sanitized = legalBlock[0];
    LEGAL_ALLOW.forEach(function (re) { sanitized = sanitized.replace(re, ''); });
    piiScan = html.replace(legalBlock[0], sanitized);
  }
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

console.log('PREFLIGHT — ' + file + (isMarketing ? ' (static public page)' : ''));
ok.forEach(x => console.log('  ✓ ' + x));
fails.forEach(x => console.log('  ✗ ' + x));
console.log(fails.length ? '\n✗ BLOCKED — ' + fails.length + ' issue(s). Do NOT publish.' : '\n✓ CLEAR to publish.');
process.exit(fails.length ? 1 : 0);
