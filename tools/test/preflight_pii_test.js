#!/usr/bin/env node
/* tools/test/preflight_pii_test.js — guards Akashi's TIGHT legal-identity PII
 * exception in tools/publish/preflight.js.
 *
 * The legal layer intentionally names the trader "Osefe Miradi" + contact
 * Miradiosefe@gmail.com (EU/DK consumer law requires an identifiable trader and a
 * refund contact). preflight allows those EXACT strings, but ONLY as anchored
 * identity/contact forms, and per-file:
 *   • index.html   — allowed ONLY inside the #legalBack modal (Provider:/Contact:
 *                    line, standalone <p>email</p>, and the refund "contact us at …").
 *   • landing.html / legal.html — the static public pages: allowed ONLY as the
 *                    footer/legal Provider:/Contact:/mailto-anchor/<p>email</p> forms.
 * This suite locks that the exception did NOT become a blanket removal:
 *   - the real index.html / landing.html / legal.html all PASS,
 *   - the same name/email BLOCKS anywhere OUTSIDE a sanctioned form (by location,
 *     not just by string — even formatted identically as <p>email</p>),
 *   - CPR/IBAN-style PII still BLOCKS,
 *   - the email in a non-sanctioned form (heading/comment) still BLOCKS.
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
  ['index: real passes',                          () => ['index.html', index],                                                                      0],
  ['index: email leaked OUTSIDE legal (comment)',  () => ['index.html', index.replace('<body', '<!-- Miradiosefe@gmail.com --><body')],              1],
  ['index: provider name leaked OUTSIDE legal',    () => ['index.html', index.replace('<body', '<!-- Osefe Miradi --><body')],                       1],
  ['index: <p>email</p> leaked OUTSIDE (by-loc)',  () => ['index.html', index.replace('<footer>', '<p>Miradiosefe@gmail.com</p><footer>')],          1],
  ['index: CPR/IBAN-style INSIDE legal fails',     () => ['index.html', index.replace('<h5>14. Contact</h5>', '<h5>14. Contact</h5><p>DK1234567890123</p>')], 1],
  ['index: email non-sanctioned form INSIDE legal',() => ['index.html', index.replace('<h5>14. Contact</h5>', '<h5>14. Contact Miradiosefe@gmail.com</h5>')], 1],
  // ---- landing.html / legal.html (static-page contact/footer exception) ----
  ['landing: real passes',                         () => ['landing.html', landing],                                                                  0],
  ['legal: real passes',                           () => ['legal.html', legal],                                                                      0],
  ['landing: bare email in comment blocks',        () => ['landing.html', landing.replace('<body', '<!-- Miradiosefe@gmail.com --><body')],          1],
  ['landing: bare provider name blocks',           () => ['landing.html', landing.replace('<body', '<h9>Osefe Miradi</h9><body')],                   1],
  ['legal: CPR/IBAN-style PII blocks',             () => ['legal.html', legal.replace('</body>', '<p>DK1234567890123</p></body>')],                  1],
  ['legal: email non-sanctioned form blocks',      () => ['legal.html', legal.replace('</body>', '<h4>Miradiosefe@gmail.com</h4></body>')],          1],
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
