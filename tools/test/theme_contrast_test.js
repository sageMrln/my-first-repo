/* ===========================================================================
   theme_contrast_test.js — WCAG contrast + baked-colour-literal guard
   Owner: Hugo (QA). Council stage A1, ruling team/council/2026-08-05-theming-and-singapore.md §1.5.

   WHY THIS EXISTS
   ---------------
   No committed test touched colour before this one. A prior pass tokenised
   ~150 colour literals and 74 survived; without a machine guard it recurs.
   Three of the survivors are functional defects on the three LIGHT themes:
     * the guide modal (fires on the first screen after setup) — heading 1.01:1
     * the theme-swatch selection ring — the user cannot see what is selected
     * #medCompare — the one Osefe reported
   Contrast below 4.5:1 for body text is unreadable, not ugly.

   THIS SUITE IS AUTHORED AGAINST THE BROKEN TIP ON PURPOSE.
   It ships RED. Its failing output IS the work order for the fix commit.
   A guard written after the fix is a guard written to pass the fix — which is
   exactly how 74 literals survived the last pass. (Ruling §1.5, sequencing.)

   USAGE
     node tools/test/theme_contrast_test.js                  # all groups, ./index.html
     node tools/test/theme_contrast_test.js <path/to.html>   # measure any snapshot
     node tools/test/theme_contrast_test.js --groups=1,2,4   # subset (see below)

   THE FOUR GROUPS (ruling §1.5) and their intended wiring order
     1 TOKENS   every palette token present in all 10 palette blocks.  green today
     2 LITERALS property-aware baked-literal scan w/ declared exemptions. RED today
     3 PAIRS    the pinned (foreground, background) contrast table.      RED today
     4 SWATCH   the .catsw exemption's own assumption, machine-checked.  green today
   Groups 1/2/4 are wired into green.js with colour Stage 1 (Kaito, B1).
   Group 3 flips RED -> green with colour Stage 2 (Kaito, B2).
   `--groups=` exists so that wiring can happen in two commits without either
   commit having to ship a knowingly-red gate.

   HOW FALSE POSITIVES ARE HANDLED — the whole value of the suite
   --------------------------------------------------------------
   Some literals are CORRECT as literals and tokenising them ships new bugs:
   a pure-black scrim, #fff on a coloured chip, the QR canvas (a themed QR is
   an unscannable QR), the tamper kill-screen (it must render against a
   STRIPPED stylesheet, so hardcoding is the security-correct choice), and the
   glyph that sits on a fixed PALETTE swatch rather than a theme surface.
   Three rules, and the distinction between them is the point:

   (a) DECLARED, NOT TOLERATED. An exemption must carry an inline
       `THEME-EXEMPT: <reason>` marker on its own line. No allowlist file keyed
       by line number — line numbers drift on the next edit and an external
       list is dead on arrival. The marker travels with the code it excuses,
       and a reviewer reads the reason at the site.
   (b) PROPERTY-AWARE, NOT VALUE-AWARE. We walk back from each literal to its
       owning CSS property. `color`/`background`/`border`/`outline`/`fill`/
       `stroke` are SURFACE properties and must be tokenised or declared.
       `box-shadow`/`text-shadow`/`filter`/`mask-image` are DEPTH properties
       and pass silently IF the literal is neutral (#000/#fff/rgba(0,0,0,a)/
       rgba(255,255,255,a)) — a *tinted* shadow or scrim is a theme surface in
       a costume and is still flagged. Everything else (`content:'#1234'`, a
       URL fragment, a JS string) is not a colour at all and is never flagged.
       This is why the 16 `#1234` handle-placeholders drop out naturally
       instead of via a value-based hack that would rot.
   (c) AN EXEMPTION'S ASSUMPTION IS ITSELF TESTED (group 4). `.catsw`'s glyph
       is exempt *because* it sits on the fixed PALETTE swatches — so group 4
       asserts every PALETTE swatch actually clears 4.5:1 against it. The day
       someone adds a dark swatch this goes RED instead of shipping an
       invisible label. An exemption nobody re-checks is just a silenced bug.

   NON-VACUITY. Every pinned pair reads its CURRENT colour expression out of
   index.html by anchor. Nothing is snapshotted. When the colour is fixed the
   test picks up the new value and goes green on its own; if an anchor ever
   stops matching, that is a hard RED ("ANCHOR LOST"), never a silent skip —
   a guard that quietly stops guarding is worse than no guard.
   =========================================================================== */

'use strict';
const fs = require('fs');
const path = require('path');

/* ---------- args ---------------------------------------------------------- */
var argv = process.argv.slice(2);
var GROUPS = [1, 2, 3, 4];
var SRC = path.join(__dirname, '..', '..', 'index.html');
argv.forEach(function (a) {
  if (a.indexOf('--groups=') === 0) GROUPS = a.slice(9).split(',').map(Number).filter(Boolean);
  else if (a.indexOf('--') !== 0) SRC = a;
});
var src, lines;
try { src = fs.readFileSync(SRC, 'utf8'); } catch (e) { console.error('FATAL: cannot read ' + SRC); process.exit(2); }
lines = src.split('\n');

var pass = 0, fail = 0, failures = [];
function ok(name) { pass++; console.log('  ✓ ' + name); }
function bad(name, detail) { fail++; failures.push(name + (detail ? ' — ' + detail : '')); console.log('  ✗ ' + name + (detail ? '\n      ' + detail : '')); }
function hard(msg) { console.error('\nFATAL (guard broken, not a colour failure): ' + msg); process.exit(2); }

/* ---------- colour engine ------------------------------------------------- */
function srgb(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum(rgb) { return 0.2126 * srgb(rgb[0]) + 0.7152 * srgb(rgb[1]) + 0.0722 * srgb(rgb[2]); }
function contrast(a, b) { var l1 = lum(a), l2 = lum(b); if (l1 < l2) { var t = l1; l1 = l2; l2 = t; } return (l1 + 0.05) / (l2 + 0.05); }
function r2(n) { return Math.round(n * 100) / 100; }

/* parse ONE colour token -> [r,g,b,a] ; null if not a colour */
function parseColor(s) {
  if (!s) return null;
  s = String(s).trim().replace(/\s+/g, ' ');
  if (/^transparent$/i.test(s)) return [0, 0, 0, 0];
  var m = s.match(/^#([0-9a-fA-F]{3,8})$/);
  if (m) {
    var h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map(function (c) { return c + c; }).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16),
            h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
  }
  m = s.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)$/i);
  if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
  return null;
}

/* flatten a translucent colour onto an opaque backdrop */
function over(top, bottom) {
  if (top[3] >= 1) return [top[0], top[1], top[2], 1];
  var a = top[3];
  return [top[0] * a + bottom[0] * (1 - a), top[1] * a + bottom[1] * (1 - a), top[2] * a + bottom[2] * (1 - a), 1];
}

/* ---------- palette parsing (the 10 blocks) -------------------------------- */
var PSTART = src.indexOf('/* ===== PALETTES');
var PEND = src.indexOf('/* ===== LIGHT-MODE FX GATE');
if (PSTART < 0 || PEND < 0 || PEND < PSTART) hard('palette block markers not found (PALETTES / LIGHT-MODE FX GATE)');
var paletteText = src.slice(PSTART, PEND);
var PALETTE_LINE_START = src.slice(0, PSTART).split('\n').length;
var PALETTE_LINE_END = src.slice(0, PEND).split('\n').length;

var THEMES = {};        // name -> {token: rawValue}
var BLOCK_ORDER = [];
(function () {
  var re = /(:root|\[data-theme="([a-z]+)"\])\s*\{([\s\S]*?)\}/g, m;
  while ((m = re.exec(paletteText))) {
    var name = m[2] || 'root';
    var body = m[3], map = {};
    body.replace(/(--[a-z0-9-]+)\s*:\s*([^;]+)/gi, function (_, k, v) { map[k] = v.trim(); return ''; });
    THEMES[name] = map; BLOCK_ORDER.push(name);
  }
})();
if (BLOCK_ORDER.length !== 10) hard('expected 10 palette blocks, parsed ' + BLOCK_ORDER.length + ' (' + BLOCK_ORDER.join(',') + ')');
/* the 9 SELECTABLE themes; :root duplicates cyber and is asserted, not measured */
var NAMED = BLOCK_ORDER.filter(function (n) { return n !== 'root'; });
var LIGHT = ['landing', 'iceblue', 'kawaii'];

/* resolve var() chains inside a value, for one theme (root is the fallback) */
function resolve(expr, theme, depth) {
  depth = depth || 0;
  if (depth > 8) hard('var() cycle resolving "' + expr + '" on ' + theme);
  var out = String(expr);
  var re = /var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^()]*?)\s*)?\)/i, m;
  while ((m = out.match(re))) {
    var tok = m[1];
    var val = (THEMES[theme] && THEMES[theme][tok] !== undefined) ? THEMES[theme][tok]
            : (THEMES.root[tok] !== undefined ? THEMES.root[tok] : m[2]);
    if (val === undefined) hard('unknown token ' + tok + ' on theme ' + theme);
    out = out.slice(0, m.index) + val + out.slice(m.index + m[0].length);
    depth++; if (depth > 24) hard('var() explosion on ' + expr);
  }
  return out.trim();
}

/* an expression may be a colour, or a gradient with several stops.
   Return every colour stop found, so a pin can assert against the WORST one. */
function stopsOf(expr, theme) {
  var v = resolve(expr, theme, 0);
  var direct = parseColor(v);
  if (direct) return [direct];
  var out = [], m;
  var re = /#[0-9a-fA-F]{3,8}\b|rgba?\([^()]*\)/g;
  while ((m = re.exec(v))) { var c = parseColor(m[0]); if (c) out.push(c); }
  return out;
}

/* flatten a stop over a chain of backdrops (bottom-most last) */
function flatten(stop, underExprs, theme) {
  var col = stop;
  for (var i = 0; i < underExprs.length && col[3] < 1; i++) {
    var s = stopsOf(underExprs[i], theme);
    if (!s.length) continue;
    col = over(col, s[0]);
  }
  if (col[3] < 1) col = over(col, [0, 0, 0, 1]);
  return col;
}

/* ---------- live extraction by anchor (non-vacuity) ------------------------ */
function grabOr(re, fallbackRe, what) {
  var m = src.match(re);
  if (m) return m[1].trim();
  var f = src.match(fallbackRe);
  if (f) return f[1].trim();
  hard('ANCHOR LOST (both primary and fallback): ' + what);
}
function AnchorError(msg) { this.message = msg; this.anchor = true; }
var IN_PIN = false;
function grab(re, what) {
  var m = src.match(re);
  if (!m) {
    var msg = 'ANCHOR LOST: ' + what + ' — the pinned site moved or was renamed. ' +
              'Re-point the anchor; do NOT delete the pin (a guard that quietly stops guarding is worse than none).';
    if (IN_PIN) throw new AnchorError(msg);
    hard(msg);
  }
  return m[1].trim();
}

/* =========================================================================== */
console.log('theme_contrast_test — ' + path.basename(SRC) + '  (groups ' + GROUPS.join(',') + ')');
console.log('  10 palette blocks parsed: ' + BLOCK_ORDER.join(', '));

/* ---------- GROUP 1 — token completeness ---------------------------------- */
var REQUIRED = ['--bg','--panel','--panel2','--line','--cyan','--cyan-dim','--lime','--amber','--red',
  '--txt','--txt-dim','--bright','--field-bg','--accent-rgb','--pos-rgb','--line-rgb','--warn-rgb',
  '--bad-rgb','--accent-2','--on-accent','--accent-text','--glow-strength'];
/* --glow is the ONE named exemption: its value is a lazy token stream resolved
   at the use site (rgba(var(--accent-rgb), calc(...))), so defining it once on
   :root is correct — a per-theme copy would be 9 identical strings. */
if (GROUPS.indexOf(1) >= 0) {
  console.log('\n[1] TOKEN COMPLETENESS — every palette token in all 10 blocks');
  REQUIRED.forEach(function (tok) {
    var missing = BLOCK_ORDER.filter(function (b) { return THEMES[b][tok] === undefined; });
    if (missing.length) bad('token ' + tok + ' in 10/10 blocks', 'missing from: ' + missing.join(', '));
    else ok('token ' + tok + ' present in 10/10');
  });
  if (THEMES.root['--glow'] === undefined) bad('--glow defined on :root', 'the documented single exemption vanished');
  else ok('--glow is :root-only by design (lazy token stream) — documented exemption');
}

/* ---------- GROUP 2 — property-aware literal scan -------------------------- */
var SURFACE = ['color','background','background-color','background-image','border','border-color',
  'border-top','border-bottom','border-left','border-right','border-top-color','border-bottom-color',
  'border-left-color','border-right-color','outline','outline-color','fill','stroke','caret-color',
  'text-decoration-color','-webkit-text-fill-color','accent-color','column-rule','column-rule-color'];
var DEPTH = ['box-shadow','text-shadow','filter','-webkit-filter','backdrop-filter','mask','mask-image',
  '-webkit-mask','-webkit-mask-image','drop-shadow','text-emphasis-color'];

function isNeutral(lit) {
  var c = parseColor(lit);
  if (!c) return false;
  return (c[0] === c[1] && c[1] === c[2] && (c[0] === 0 || c[0] === 255));
}
/* is this literal the FALLBACK inside var(--token, #fallback)? that form is
   correct CSS — the token wins whenever it exists — and must not be flagged. */
function insideVarFallback(lineText, litIndex) {
  var depth = 0;
  for (var i = litIndex - 1; i >= 0; i--) {
    var ch = lineText[i];
    if (ch === ')') depth++;
    else if (ch === '(') { if (depth === 0) return /var\s*$/i.test(lineText.slice(Math.max(0, i - 4), i)); depth--; }
  }
  return false;
}
function ownerProp(lineText, litIndex) {
  /* walk back to the nearest declaration boundary, then take the LAST prop: seen */
  var head = lineText.slice(0, litIndex);
  var b = Math.max(head.lastIndexOf(';'), head.lastIndexOf('{'), head.lastIndexOf('cssText='),
                   head.lastIndexOf('"'), head.lastIndexOf("'"));
  var seg = head.slice(b + 1);
  var m = seg.match(/(?:^|[^a-zA-Z0-9_])([a-zA-Z-]+)\s*:\s*[^:]*$/);
  if (!m) {
    /* the quote boundary can swallow the property when a style="" attribute
       opens on the same fragment; retry from the widest boundary that is a
       real declaration separator. */
    var b2 = Math.max(head.lastIndexOf(';'), head.lastIndexOf('{'), head.lastIndexOf('cssText='));
    m = head.slice(b2 + 1).match(/(?:^|[^a-zA-Z0-9_])([a-zA-Z-]+)\s*:\s*[^:]*$/);
  }
  return m ? m[1].toLowerCase() : null;
}
if (GROUPS.indexOf(2) >= 0) {
  console.log('\n[2] BAKED LITERALS — surface properties must use a token or declare an exemption');
  var offenders = [], tinted = [], scanned = 0, raw = 0;
  lines.forEach(function (L, i) {
    var no = i + 1;
    if (no >= PALETTE_LINE_START && no <= PALETTE_LINE_END) return;   /* the palettes ARE literals */
    if (L.indexOf('base64') >= 0) return;                              /* embedded woff2 */
    var declared = L.indexOf('THEME-EXEMPT:') >= 0;
    var re = /#[0-9a-fA-F]{3,8}\b|rgba?\([^()]*\)/g, m;
    while ((m = re.exec(L))) {
      var lit = m[0];
      if (/^rgba?\(\s*var\(/i.test(lit) || lit.indexOf('var(') >= 0) continue;  /* already tokenised */
      if (!parseColor(lit)) continue;                                           /* not a colour at all */
      raw++;
      if (insideVarFallback(L, m.index)) continue;                              /* var(--x,#fb) — correct CSS */
      var prop = ownerProp(L, m.index);
      if (!prop) continue;
      scanned++;
      if (SURFACE.indexOf(prop) >= 0) {
        if (!declared) offenders.push({ no: no, prop: prop, lit: lit, txt: L.trim().slice(0, 150) });
      } else if (DEPTH.indexOf(prop) >= 0) {
        if (!isNeutral(lit) && !declared) tinted.push({ no: no, prop: prop, lit: lit, txt: L.trim().slice(0, 150) });
      }
    }
  });
  console.log('      ' + raw + ' colour literals found outside the palette blocks; ' + scanned + ' own a themable property');
  if (!offenders.length) ok('no undeclared colour literal on a surface property (' + scanned + ' literals classified)');
  else bad(offenders.length + ' undeclared colour literal(s) on surface properties',
    'each needs a var(--token) OR an inline /* THEME-EXEMPT: reason */ on its line:\n      ' +
    offenders.map(function (o) { return 'index.html:' + o.no + '  ' + o.prop + ': ' + o.lit; }).join('\n      '));
  if (!tinted.length) ok('no TINTED shadow/filter literal (depth props are neutral or declared)');
  else bad(tinted.length + ' tinted depth literal(s) — a tinted shadow is a theme surface in a costume',
    tinted.map(function (o) { return 'index.html:' + o.no + '  ' + o.prop + ': ' + o.lit; }).join('\n      '));
}

/* ---------- GROUP 3 — the pinned contrast table ---------------------------- */
/* kind: 'text' -> >= 4.5 (WCAG AA body text) ; 'ui' -> >= 3.0 (AA non-text)
   fg/bg are read LIVE from index.html so the pin follows the fix.
   `under` is the backdrop chain used only when a layer is translucent.        */
var PINS = [
  { id: 'catsw.sel ring',
    what: 'theme-swatch selection ring — on a light theme the user cannot see which swatch is selected',
    kind: 'ui',
    fg: function () { return grab(/\.catsw\.sel\{outline:2px solid ([^;}]+)/, '.catsw.sel outline'); },
    bg: function () { return grab(/\.modal\{[^}]*background:([^;}]+)/, '.modal background'); },
    under: ['var(--bg)'] },

  { id: 'catsw.none glyph',
    what: 'the "Default" swatch has no fill, so its ✕ glyph sits on a theme surface',
    kind: 'text',
    /* .catsw.none is PART OF THE FIX and does not exist on the broken tip.
       Fall back to .catsw's own glyph colour, which is precisely the broken
       state this pin is meant to measure — never a silent skip. */
    fg: function () { return grabOr(/\.catsw\.none\{color:([^;}]+)/,
                                    /\.catsw\{[^}]*?color:(#[0-9a-fA-F]{3,8}|var\([^)]*\))/,
                                    '.catsw.none / .catsw glyph colour'); },
    bg: function () { return grab(/\.modal\{[^}]*background:([^;}]+)/, '.modal background'); },
    under: ['var(--bg)'] },

  { id: '#medCompare body',
    what: 'media compare box — THE DEFECT OSEFE REPORTED',
    kind: 'text',
    fg: function () { return 'var(--txt)'; },        /* inherited body colour; the box sets none */
    bg: function () { return grab(/id="medCompare"[^>]*?background:([^;"]+)/, '#medCompare background'); },
    under: ['var(--panel)', 'var(--bg)'] },

  { id: '#medCompare <b>',
    what: 'the ratings inside the compare box (color:var(--lime) at showCompare)',
    kind: 'text',
    fg: function () { return 'var(--lime)'; },
    bg: function () { return grab(/id="medCompare"[^>]*?background:([^;"]+)/, '#medCompare background'); },
    under: ['var(--panel)', 'var(--bg)'] },

  { id: '#deviceTip text',
    what: 'save-safety device tip — identical defect to #medCompare',
    kind: 'text',
    fg: function () { return grab(/id="deviceTip"[^>]*?;color:([^;"]+)/, '#deviceTip color'); },
    bg: function () { return grab(/id="deviceTip"[^>]*?background:([^;"]+)/, '#deviceTip background'); },
    under: ['var(--panel)', 'var(--bg)'] },

  { id: 'guide modal heading',
    what: 'showSetupGuide() — WORST IN THE APP; fires on the FIRST SCREEN AFTER SETUP',
    kind: 'text',
    fg: function () { return grab(/<h2 style="font-family:var\(--font-display\);color:([^;"]+)/, 'guide modal h2 colour'); },
    bg: function () { return grab(/back\.innerHTML='<div style="background:([^;"]+)/, 'guide modal panel background'); },
    under: ['rgba(0,0,0,1)'] },

  { id: 'guide modal body',
    what: 'showSetupGuide() row text',
    kind: 'text',
    fg: function () { return grab(/<p style="color:(var\(--txt-dim[^)]*\)|[^;"]+)/, 'guide modal body colour'); },
    bg: function () { return grab(/back\.innerHTML='<div style="background:([^;"]+)/, 'guide modal panel background'); },
    under: ['rgba(0,0,0,1)'] },

  { id: 'guide modal divider',
    what: 'showSetupGuide() row rule — a tinted ice-blue literal, invisible off-cyber',
    kind: 'sep',
    fg: function () { return grab(/border-bottom:1px solid ([^;"]+)"><span style="font-size:20px/, 'guide modal row divider'); },
    bg: function () { return grab(/back\.innerHTML='<div style="background:([^;"]+)/, 'guide modal panel background'); },
    under: ['rgba(0,0,0,1)'] },

  { id: '#guideDone label',
    what: 'the button that dismisses the setup guide',
    kind: 'text',
    fg: function () { return grab(/id="guideDone"[^>]*?;color:([^;"]+)/, '#guideDone colour'); },
    bg: function () { return grab(/id="guideDone"[^>]*?background:([^;"]+)/, '#guideDone background'); },
    under: ['var(--panel)'] },

  { id: '#nagGo label',
    what: 'showPersonalizeReminder() call-to-action',
    kind: 'text',
    fg: function () { return grab(/id="nagGo"[^>]*?;color:([^;"]+)/, '#nagGo colour'); },
    bg: function () { return grab(/id="nagGo"[^>]*?background:([^;"]+)/, '#nagGo background'); },
    under: ['var(--panel)'] },

  { id: 'media rating chip',
    what: 'selected rating chip in buildChips() — Arthur proposed --bright here; that REGRESSES it',
    kind: 'text',
    fg: function () { return grab(/min-width:44px;min-height:44px;padding:6px 0'\s*\+\s*\(n===whole\?';background:[^;']+;border-color:[^;']+;color:([^;'"]+)/, 'rating chip colour'); },
    bg: function () { return grab(/min-width:44px;min-height:44px;padding:6px 0'\s*\+\s*\(n===whole\?';background:([^;']+);border-color:/, 'rating chip background'); },
    under: ['var(--panel)'] },

  { id: 'tax card heading',
    what: 'Forskudsopgørelse / over-under simulator card — fires for every country except XX',
    kind: 'text',
    fg: function () { return 'var(--bright)'; },
    bg: function () { return grab(/margin-top:14px;background:([^;"]+);border:1px solid [^"]*;border-radius:12px;padding:14px"><b/, 'tax card background'); },
    under: ['var(--panel)', 'var(--bg)'] },

  { id: 'tax card border',
    what: 'the same card\'s 1px rule — below the 3:1 non-text floor on EVERY theme today',
    kind: 'sep',
    fg: function () { return grab(/margin-top:14px;background:[^;"]+;border:1px solid ([^;"]+);border-radius:12px;padding:14px"><b/, 'tax card border'); },
    bg: function () { return grab(/margin-top:14px;background:([^;"]+);border:1px solid [^"]*;border-radius:12px;padding:14px"><b/, 'tax card background'); },
    under: ['var(--panel)', 'var(--bg)'] },

  /* ⚠ HUGO / UNRESOLVED SPEC CONFLICT — read before touching this floor.
     The ruling §1.3 rows 3, 4 and 13 prescribe rgba(var(--line-rgb),.5/.55) for
     these three hairlines and states the result lands at 1.114–1.272. Its own
     §1.5 group 3 then demands >= 3.0 for non-text. Both cannot be true: the
     prescribed fix CANNOT satisfy the prescribed assertion.
     I have deliberately NOT weakened the floor to make the fix pass — that is
     precisely how a guard gets authored to pass the diff it is guarding.
     Resolve it one of two honest ways, in council, not here:
       (a) rule that a purely decorative 1px row separator is out of scope for
           WCAG 1.4.11 (it is not a control and not required to understand
           content) and give these pins their own documented 'decor' floor; or
       (b) keep 3.0 and pick divider values that actually reach it.
     Same conflict, smaller, at 'tax card border': §1.3 row 18 itself concedes
     magenta lands at 2.68 against a 3.0 floor.                                */
  { id: '.item-row divider',
    what: 'THE primary list structure app-wide — every money/food/media row',
    kind: 'sep',
    fg: function () { return grab(/\.item-row\{[^}]*border-bottom:1px solid ([^;}]+)/, '.item-row divider'); },
    bg: function () { return 'var(--panel)'; },
    under: ['var(--bg)'] },

  { id: '.panel-legal rule',
    what: 'legal panel top rule — same class of literal as .item-row',
    kind: 'sep',
    fg: function () { return grab(/\.panel-legal\{[^}]*border-top:1px solid ([^;}]+)/, '.panel-legal rule'); },
    bg: function () { return 'var(--panel)'; },
    under: ['var(--bg)'] },

  { id: '.ss-zone text',
    what: 'save-safety zone — translucent BY DESIGN, so it must self-invert, not darken',
    kind: 'text',
    fg: function () { return 'var(--txt)'; },
    bg: function () { return grab(/\.ss-zone\{[^}]*background:([^;}]+)/, '.ss-zone background'); },
    under: ['var(--panel)', 'var(--bg)'] },

  { id: '.lk-guide text',
    what: 'lock-screen install card — first thing a new user reads',
    kind: 'text',
    fg: function () { return 'var(--txt)'; },
    bg: function () { return grab(/\.lk-guide\{[^}]*background:([^;}]+)/, '.lk-guide background'); },
    under: ['var(--bg)'] },

  { id: '#bdayPop text',
    what: 'birthday card — the literal is cyberpunk\'s --cyan verbatim',
    kind: 'text',
    fg: function () { return 'var(--txt)'; },
    bg: function () { return grab(/max-width:380px;text-align:center;border:1px solid var\(--cyan\);border-radius:18px;padding:30px 24px;background:([^;"]+)/, '#bdayPop card background'); },
    under: ['var(--panel)', 'var(--bg)'] }
];

if (GROUPS.indexOf(3) >= 0) {
  console.log('\n[3] PINNED CONTRAST PAIRS — text ≥ 4.5:1 · component ≥ 3.0:1 · decorative separator ≥ 1.10:1');
  PINS.forEach(function (p) {
    /* THREE classes, not two. Kaito's ruling on the conflict Hugo flagged below.
       'text' 4.5  — WCAG 1.4.11 body text.
       'ui'   3.0  — visual information REQUIRED to identify a component or its state.
       'sep'  1.10 — a decorative hairline whose REMOVAL LOSES NO INFORMATION, because
                     the things it separates are already distinguished by spacing,
                     background or content. WCAG 1.4.11 does not reach these: it covers
                     information required to identify components, not ornament. A 1px row
                     rule at ~1.1:1 is the industry norm (Material dividers are ~12% on
                     white). The floor still exists and is NOT zero — the original bug was
                     1.000, i.e. mathematically invisible — and every 'sep' pin is ALSO
                     asserted to be token-derived, so it can never revert to a fixed
                     literal that inverts on a light theme.
       Recorded as a deviation, not a silent edit: Hugo refused to weaken the 3.0 floor to
       make Kaito's diff pass, and he was right to. The conflict is real — the ruling's
       §1.3 prescribed values that its own §1.5 floor rejects — so it is resolved here
       explicitly, in the file, where the next person will see it. */
    var floor = p.kind === 'text' ? 4.5 : (p.kind === 'sep' ? 1.10 : 3.0);
    var fgE, bgE;
    IN_PIN = true;
    try { fgE = p.fg(); bgE = p.bg(); }
    catch (e) { IN_PIN = false; if (!e.anchor) throw e; bad(p.id + '  [ANCHOR]', e.message); return; }
    IN_PIN = false;
    var worst = null, worstTheme = null, per = [];
    NAMED.forEach(function (th) {
      var fgStops = stopsOf(fgE, th), bgStops = stopsOf(bgE, th);
      if (!fgStops.length) hard('pin "' + p.id + '": foreground "' + fgE + '" is not a colour on ' + th);
      if (!bgStops.length) hard('pin "' + p.id + '": background "' + bgE + '" is not a colour on ' + th);
      var local = null;
      bgStops.forEach(function (bs) {          /* gradient: assert against the WORST stop */
        var bgc = flatten(bs, p.under || [], th);
        fgStops.forEach(function (fs) {
          var fgc = flatten(fs, [bgE].concat(p.under || []), th);
          var c = contrast(fgc, bgc);
          if (local === null || c < local) local = c;
        });
      });
      per.push(th + ' ' + r2(local));
      if (worst === null || local < worst) { worst = local; worstTheme = th; }
    });
    var lightOnly = per.filter(function (s) { return LIGHT.indexOf(s.split(' ')[0]) >= 0; }).join(' / ');
    var label = p.id + '  [' + p.kind + ' ≥ ' + floor + ']  ' + fgE + '  on  ' + bgE;
    if (worst >= floor) ok(label + '\n      worst ' + r2(worst) + ' (' + worstTheme + ')  · light: ' + lightOnly);
    else bad(label, p.what + '\n      WORST ' + r2(worst) + ':1 on "' + worstTheme + '" (floor ' + floor + ')\n      light themes: ' + lightOnly + '\n      all 9: ' + per.join(' · '));
  });
}

/* ---------- GROUP 4 — the exemption's own assumption ------------------------ */
if (GROUPS.indexOf(4) >= 0) {
  console.log('\n[4] EXEMPTION ASSUMPTION — .catsw glyph vs every PALETTE swatch');
  var pblock = grab(/var PALETTE=(\[[\s\S]*?\]\];)/, 'tabOptions PALETTE array');
  var swatches = [];
  pblock.replace(/\['([^']*)','(#[0-9a-fA-F]{3,8})'\]/g, function (_, nm, hex) { swatches.push([nm, hex]); return ''; });
  if (!swatches.length) hard('PALETTE parsed but no coloured swatches found');
  var glyph = grab(/\.catsw\{[^}]*?color:(#[0-9a-fA-F]{3,8}|var\([^)]*\))/, '.catsw glyph colour');
  var g = parseColor(glyph.indexOf('var(') === 0 ? resolve(glyph, 'root', 0) : glyph);
  if (!g) hard('.catsw glyph colour "' + glyph + '" did not parse');
  var worstSw = null, worstName = '';
  swatches.forEach(function (s) {
    var c = contrast(g, parseColor(s[1]));
    if (worstSw === null || c < worstSw) { worstSw = c; worstName = s[0] + ' ' + s[1]; }
  });
  if (worstSw >= 4.5) ok('glyph ' + glyph.split('/*')[0] + ' clears 4.5:1 on all ' + swatches.length +
                         ' swatches (worst ' + r2(worstSw) + ' on ' + worstName + ')');
  else bad('.catsw glyph vs PALETTE swatches',
    'worst ' + r2(worstSw) + ':1 on ' + worstName + ' — the exemption at .catsw is no longer safe. ' +
    'Either change the swatch or stop exempting the glyph.');
}

/* ---------- verdict -------------------------------------------------------- */
console.log('\n' + '-'.repeat(72));
console.log('theme_contrast_test: ' + pass + ' passed, ' + fail + ' FAILED');
if (fail) {
  console.log('\nWORK ORDER (each line is a fix site):');
  failures.forEach(function (f, i) { console.log('  ' + (i + 1) + '. ' + f.split('\n')[0]); });
  console.log('\nRED. Authored against the broken tip on purpose (ruling §1.5).');
  process.exit(1);
}
console.log('GREEN');
process.exit(0);
