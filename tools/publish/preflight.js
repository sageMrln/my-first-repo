#!/usr/bin/env node
/* Pre-publish safety guard — run BEFORE any gh-pages / live push.
 *
 *   node tools/publish/preflight.js [path-to-index.html]   (defaults to ./index.html)
 *
 * Why this is committed (release retro, adopted by Kaito): nothing private must ever
 * reach the public mirror. This run we checked by hand each time; a committed guard
 * makes it automatic and impossible to forget. Exit 1 on ANY violation — Hugo wires
 * this into the release flow so a failing preflight blocks the push.
 *
 * Checks the PUBLIC copy for:
 *   1. owner data slots (#hud-state, #__ownerKeySrc) are EMPTY
 *   2. no private-key material (PKCS8 / BEGIN PRIVATE)
 *   3. exactly one PUBLIC key present (verify-only)
 *   4. no owner PII (name/email/CPR/IBAN-style)
 *   5. anti-tamper intact (PUBCHK constant present)
 *   6. <script> tags balanced (structural sanity)
 */
const fs = require('fs');
const file = process.argv[2] || 'index.html';
const html = fs.readFileSync(file, 'utf8');
const fails = [];
const ok = [];

function slotEmpty(id) {
  const m = html.match(new RegExp('id="' + id + '"[^>]*>([\\s\\S]*?)</script>'));
  return m ? m[1].trim() === '' : null;
}
[['hud-state'], ['__ownerKeySrc']].forEach(([id]) => {
  const e = slotEmpty(id);
  if (e === null) fails.push(`slot #${id} not found`);
  else if (!e) fails.push(`slot #${id} is NOT empty — private data would leak`);
  else ok.push(`#${id} empty`);
});

if (/BEGIN [A-Z ]*PRIVATE|pkcs8/i.test(html)) fails.push('private-key material present');
else ok.push('no private-key material');

const pub = (html.match(/PUB_B64\s*=\s*'MFkw/g) || []).length;
if (pub === 1) ok.push('public key present (1)');
else fails.push(`expected exactly 1 public key, found ${pub}`);

const pii = html.match(/miradi|osefe@|[^a-z]cpr[^a-z]|\bDK\d{8,}\b/gi);
if (pii) fails.push('possible owner PII: ' + [...new Set(pii)].join(', '));
else ok.push('no owner PII');

if (/PUBCHK\s*=\s*4047293148/.test(html)) ok.push('PUBCHK watchdog intact');
else fails.push('PUBCHK watchdog missing/changed');

const open = (html.match(/<script\b/g) || []).length, close = (html.match(/<\/script>/g) || []).length;
if (open === close) ok.push(`script tags balanced (${open})`);
else fails.push(`script tags unbalanced: ${open} open / ${close} close`);

console.log('PREFLIGHT — ' + file);
ok.forEach(x => console.log('  ✓ ' + x));
fails.forEach(x => console.log('  ✗ ' + x));
console.log(fails.length ? '\n✗ BLOCKED — ' + fails.length + ' issue(s). Do NOT publish.' : '\n✓ CLEAR to publish.');
process.exit(fails.length ? 1 : 0);
