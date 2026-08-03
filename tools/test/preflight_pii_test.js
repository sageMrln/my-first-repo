#!/usr/bin/env node
/* tools/test/preflight_pii_test.js — guards Akashi's TIGHT legal-identity PII
 * exception in tools/publish/preflight.js.
 *
 * The legal layer intentionally names the trader "Osefe Miradi" + a contact address
 * (EU/DK consumer law requires an identifiable trader and a refund contact). preflight
 * allows those EXACT strings, but ONLY as anchored identity/contact forms, and per-file:
 *   • index.html   — allowed ONLY inside the #legalBack modal (Provider:/Contact:
 *                    line, standalone <p>email</p>, and the refund "contact us at …").
 *   • landing.html / legal.html — the static public pages: allowed ONLY as the
 *                    footer/legal Provider:/Contact:/mailto-anchor/<p>email</p> forms.
 *
 * EMAIL-CHANGE NOTE (v39): the sanctioned contact is now the BRANDED, NON-OWNER address
 * Kontaktmrln@gmail.com. By design it does NOT match PII_RE (no 'miradi'/'osefe@'), so it
 * is intended-public and does NOT have to be confined to sanctioned forms — the real
 * index/landing/legal (which now carry it) simply PASS. The owner IDENTITY that PII_RE
 * still tracks — and that MUST stay stripped-in-context / blocked-elsewhere — is the NAME
 * "Osefe Miradi" and any OWNER personal email. The retired owner address
 * Miradiosefe@gmail.com is therefore RETAINED below purely as an owner-PII probe: it still
 * matches PII_RE and must still BLOCK anywhere outside a sanctioned form. (Swapping these
 * adversarial probes to the new non-PII address would silently gut the coverage — they'd
 * pass instead of block — so we deliberately do NOT.)
 *
 * This suite locks that the exception did NOT become a blanket removal:
 *   - the real index.html / landing.html / legal.html all PASS,
 *   - the owner NAME / an owner email BLOCKS anywhere OUTSIDE a sanctioned form (by
 *     location, not just by string — even formatted identically as <p>email</p>),
 *   - CPR/IBAN-style PII still BLOCKS,
 *   - the new branded contact is treated as public (does NOT block outside legal).
 * If this suite fails, the owner-PII net has a hole — do NOT ship.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const preflight = path.join(root, 'tools/publish/preflight.js');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const landing = fs.readFileSync(path.join(root, 'landing.html'), 'utf8');
const legal = fs.readFileSync(path.join(root, 'legal.html'), 'utf8');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mrln-pf-'));

// The retired OWNER contact address — kept ONLY as an owner-PII probe (still matches
// PII_RE via 'miradi'; must block outside sanctioned forms). Distinct from the new
// intended-public contact Kontaktmrln@gmail.com that the real files carry.
const OWNER_EMAIL = 'Miradiosefe@gmail.com';
// the new sanctioned, NON-OWNER contact — intended-public, must NOT be treated as PII.
const PUBLIC_EMAIL = 'Kontaktmrln@gmail.com';

// returns preflight's exit code (0 = CLEAR, 1 = BLOCKED). The file is written under
// `fname` so preflight selects the right profile (index vs landing/legal vs generic).
function code(fname, html) {
  const f = path.join(tmp, fname);
  fs.writeFileSync(f, html);
  try { execFileSync('node', [preflight, f], { encoding: 'utf8' }); return 0; }
  catch (e) { return e.status != null ? e.status : 99; }
}

const cases = [
  // ---- index.html (#legalBack exception) ----
  ['index: real passes (new public contact accepted in legal)', () => ['index.html', index],                                                          0],
  ['index: OWNER email leaked OUTSIDE legal (comment)', () => ['index.html', index.replace('<body', '<!-- ' + OWNER_EMAIL + ' --><body')],             1],
  ['index: provider name leaked OUTSIDE legal',    () => ['index.html', index.replace('<body', '<!-- Osefe Miradi --><body')],                         1],
  ['index: <p>OWNER email</p> leaked OUTSIDE (by-loc)', () => ['index.html', index.replace('<footer>', '<p>' + OWNER_EMAIL + '</p><footer>')],         1],
  ['index: CPR/IBAN-style INSIDE legal fails',     () => ['index.html', index.replace('<h5>14. Contact</h5>', '<h5>14. Contact</h5><p>DK1234567890123</p>')], 1],
  ['index: OWNER email non-sanctioned form INSIDE legal', () => ['index.html', index.replace('<h5>14. Contact</h5>', '<h5>14. Contact ' + OWNER_EMAIL + '</h5>')], 1],
  // new-address regression: the branded non-owner contact is intended-public — appearing
  // OUTSIDE the legal block must NOT block (documents why it is not added to PII_RE).
  ['index: new public contact OUTSIDE legal is allowed (non-owner)', () => ['index.html', index.replace('<body', '<!-- ' + PUBLIC_EMAIL + ' --><body')], 0],
  // ---- index.html lock-screen renewal line (.lk-foot exception) ----
  // The real index.html carries the sanctioned renewal sentence (new public contact) in
  // .lk-foot; 'index: real passes' above is the positive lock — if LOCK_ALLOW is
  // deleted/weakened it flips to fail. These two prove the exception stays TIGHT: it is
  // scoped to .lk-foot AND to the exact phrasing, so an OWNER email in any other
  // form/location still BLOCKS.
  ['index: renewal phrase w/ OWNER email OUTSIDE lk-foot still fails', () => ['index.html', index.replace('<body', "<!-- Email " + OWNER_EMAIL + " to get next month's key --><body")], 1],
  ['index: different-form OWNER email INSIDE lk-foot fails',  () => ['index.html', index.replace('never leaves this device.', 'never leaves this device. Ping ' + OWNER_EMAIL + ' anytime.')], 1],
  // ---- index.html i18n dictionary renewal entries (RENEWAL_I18N exception) ----
  // The renewal sentence is translated into every language; the (public) contact stays
  // verbatim in the key + each value. The exception allows ONLY that email token inside
  // the exact renewal key:value pair, and strips ONLY the token — so anything else
  // smuggled in still BLOCKS. 'index: real passes' is the positive lock.
  ['index: CPR/IBAN in a renewal translation value fails', () => ['index.html', index.replace('for at få næste måneds nøgle', 'for at få næste måneds nøgle DK99887766554433')], 1],
  ['index: OWNER email under a DIFFERENT dict key fails',   () => ['index.html', index.replace('var I18N = {', 'var I18N = {"zz":{"hi":"contact ' + OWNER_EMAIL + ' now"},')], 1],
  // ---- landing.html / legal.html (static-page contact/footer exception) ----
  ['landing: real passes',                         () => ['landing.html', landing],                                                                  0],
  ['legal: real passes',                           () => ['legal.html', legal],                                                                      0],
  ['landing: bare OWNER email in comment blocks',  () => ['landing.html', landing.replace('<body', '<!-- ' + OWNER_EMAIL + ' --><body')],            1],
  ['landing: bare provider name blocks',           () => ['landing.html', landing.replace('<body', '<h9>Osefe Miradi</h9><body')],                   1],
  ['legal: CPR/IBAN-style PII blocks',             () => ['legal.html', legal.replace('</body>', '<p>DK1234567890123</p></body>')],                  1],
  ['legal: OWNER email non-sanctioned form blocks', () => ['legal.html', legal.replace('</body>', '<h4>' + OWNER_EMAIL + '</h4></body>')],           1],
];

let pass = 0, fail = 0;
cases.forEach(([name, build, want]) => {
  const [fname, html] = build();
  const got = code(fname, html);
  if (got === want) { pass++; console.log('  ✓ ' + name + ' (exit ' + got + ')'); }
  else { fail++; console.log('  ✗ ' + name + ' — expected exit ' + want + ', got ' + got); }
});
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}

console.log('\npreflight-PII guard: ' + pass + ' passed / ' + fail + ' failed');
process.exit(fail ? 1 : 0);
