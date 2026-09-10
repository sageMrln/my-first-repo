#!/usr/bin/env node
/* HTML script-parse guard — node tools/test/html_parse_test.js
 *
 * Every <script> body in index.html must be SYNTACTICALLY VALID JavaScript.
 *
 * Why this exists (a real incident): an i18n merge commit minified the feature-translations
 * IIFE and left ONE stray brace, so the entire main <script> died with "missing ) after
 * argument list" on load — window.LOCK / STATE / MEDIALOG all undefined, a dead page. It sailed
 * through the WHOLE gate: green.js extracts individual functions and runs them in isolation (never
 * parses the file as a browser does), and preflight.js checks <script> brace/tag BALANCE, not JS
 * VALIDITY (a stray-but-balanced brace passes). Only a live browser-load caught it.
 *
 * This guard compiles each <script> body with vm.Script (compile-only, no execution — browser
 * globals aren't needed to detect a SYNTAX error), which is exactly the parse a browser does when
 * it loads the page. A single invalid script = exit 1 = the app would be dead in a browser.
 *
 * Compile-only, zero dependencies, deterministic — safe to run in the committed gate.
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const file = path.resolve(__dirname, '../../index.html');
const html = fs.readFileSync(file, 'utf8');

const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
let m, i = 0, bad = 0;
while ((m = re.exec(html))) {
  const attrs = m[1] || '', body = m[2];
  // skip non-JS script blocks (e.g. type="application/json") and empty tags
  if (/type\s*=\s*["'](?!(text\/javascript|module|application\/javascript))/i.test(attrs)) continue;
  if (!body.trim()) continue;
  i++;
  const startLine = html.slice(0, m.index).split('\n').length;
  try {
    new vm.Script(body, { filename: 'index.html:script#' + i });
    console.log('✓ script #' + i + ' (starts ~line ' + startLine + ') parses');
  } catch (e) {
    bad++;
    console.log('✗ script #' + i + ' (starts ~line ' + startLine + ') FAILS TO PARSE: ' + e.message);
  }
}

console.log('\n' + (bad
  ? '✗ ' + bad + ' of ' + i + ' script block(s) fail to parse — the app would be DEAD in a browser'
  : '✓ all ' + i + ' script block(s) parse (app script is syntactically valid)'));
process.exit(bad ? 1 : 0);
