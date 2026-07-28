#!/usr/bin/env node
/* tools/test/preflight_pii_test.js — guards Akashi's TIGHT legal-identity PII
 * exception in tools/publish/preflight.js.
 *
 * The legal layer intentionally names the trader "Osefe Miradi" + contact
 * Miradiosefe@gmail.com (EU/DK consumer law requires an identifiable trader).
 * preflight allows those EXACT strings, but ONLY inside the #legalBack legal
 * block. This suite locks that the exception did NOT become a blanket removal:
 *   - the real index.html passes,
 *   - the same name/email BLOCKS anywhere OUTSIDE the legal block (by location,
 *     not just by string — even formatted identically as <p>email</p>),
 *   - CPR/IBAN-style PII still BLOCKS even INSIDE the legal block,
 *   - the email in a non-sanctioned form inside legal still BLOCKS.
 * If this suite fails, the owner-PII net has a hole — do NOT ship.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const preflight = path.join(root, 'tools/publish/preflight.js');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mrln-pf-'));

// returns preflight's exit code for a given html string (0 = CLEAR, 1 = BLOCKED)
function code(html) {
  const f = path.join(tmp, 'x.html');
  fs.writeFileSync(f, html);
  try { execFileSync('node', [preflight, f], { encoding: 'utf8' }); return 0; }
  catch (e) { return e.status != null ? e.status : 99; }
}

const cases = [
  ['real index.html passes',                     () => index,                                                                       0],
  ['email leaked OUTSIDE legal (comment)',        () => index.replace('<body', '<!-- Miradiosefe@gmail.com --><body'),               1],
  ['provider name leaked OUTSIDE legal',          () => index.replace('<body', '<!-- Osefe Miradi --><body'),                        1],
  ['<p>email</p> leaked OUTSIDE legal (by-loc)',  () => index.replace('<footer>', '<p>Miradiosefe@gmail.com</p><footer>'),           1],
  ['CPR/IBAN-style PII INSIDE legal still fails', () => index.replace('<h5>14. Contact</h5>', '<h5>14. Contact</h5><p>DK1234567890123</p>'), 1],
  ['email in non-sanctioned form INSIDE legal',   () => index.replace('<h5>14. Contact</h5>', '<h5>14. Contact Miradiosefe@gmail.com</h5>'), 1],
];

let pass = 0, fail = 0;
cases.forEach(([name, build, want]) => {
  const got = code(build());
  if (got === want) { pass++; console.log('  ✓ ' + name + ' (exit ' + got + ')'); }
  else { fail++; console.log('  ✗ ' + name + ' — expected exit ' + want + ', got ' + got); }
});
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}

console.log('\npreflight-PII guard: ' + pass + ' passed / ' + fail + ' failed');
process.exit(fail ? 1 : 0);
