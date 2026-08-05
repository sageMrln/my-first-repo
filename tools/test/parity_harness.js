#!/usr/bin/env node
/* MRLN parity harness — reskin ruling a213555 §G Stage 0 (Arthur's 11 assertions).
 *
 *   node tools/test/parity_harness.js        (real browser; needs Playwright+Chromium)
 *
 * Assertions, not eyeballs. Boots index.html in Chromium (lock bypassed, demo
 * data), walks every tab at every mandated width, and asserts the machine-
 * checkable invariants. Assertions whose SUBJECT does not exist yet (dock,
 * directories, hero) are ARMED by tools/test/reskin_stage.json and print
 * themselves when inactive — a silently-skipped check is how a gate rots.
 *
 * Active from stage 0:
 *   #1  zero horizontal page overflow at 320/360/390/768/1024/1440
 *   #8  fabs never permanently occlude text (at max scroll, on every tab)
 *   #11 all 16 destinations reachable (click-through, panel becomes visible)
 *   #0  boot with zero page errors (the class that killed Desktop Alive v1)
 * Armed later (stage in brackets):
 *   [3] #4 tappables ≥44px, nav cells ≥48×56    [3] #2 nav labels fit @320 DE/HU
 *   [4] #6 every section opens on a visible directory   [4] #7 gear reach
 *   [5] #5 one focal number on Home              [5] #9 keyboard+nav stack
 *   [5] #10 reduced-motion / no re-animating sparklines
 */
const path = require('path');
const fs = require('fs');
const root = path.resolve(__dirname, '..', '..');
const STAGE = JSON.parse(fs.readFileSync(path.join(__dirname, 'reskin_stage.json'), 'utf8')).stage;

let chromium;
try { chromium = require('playwright').chromium; }
catch (_) { try { chromium = require('/opt/node22/lib/node_modules/playwright/index.js').chromium; } catch (_2) {} }
const exe = (() => {
  const base = '/opt/pw-browsers';
  try {
    const d = fs.readdirSync(base).find(n => n.startsWith('chromium'));
    if (d) {
      const p = path.join(base, d, 'chrome-linux', 'chrome');
      if (fs.existsSync(p)) return p;
      if (fs.existsSync(path.join(base, d))) return path.join(base, d);
    }
  } catch (_) {}
  return null;
})();
if (!chromium || !exe) {
  console.log('PARITY HARNESS: SKIPPED — Playwright/Chromium not available in this environment.');
  console.log('  (Run on a machine with the browser; the gate treats this as a named skip, not a pass.)');
  process.exit(0);
}

const WIDTHS = [320, 360, 390, 768, 1024, 1440];
let failed = 0, held = 0;
const ok = m => console.log('  ✓ ' + m);
const bad = m => { console.log('  ✗ ' + m); failed++; };
const check = (c, m) => (c ? ok(m) : bad(m));
const armed = (s, m) => { held++; console.log('  · ' + m + '   (armed at stage ' + s + '; stage file says ' + STAGE + ')'); };

(async () => {
  const browser = await chromium.launch({ executablePath: exe });
  for (const W of WIDTHS) {
    const page = await (await browser.newContext({ viewport: { width: W, height: 844 } })).newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + path.join(root, 'index.html'), { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      const el = document.getElementById('lockScreen'); if (el) el.classList.add('unlocked');
      document.documentElement.classList.remove('lk-noscroll');
      const bt = document.getElementById('boot'); if (bt) bt.remove();
      if (typeof __sys !== 'undefined' && __sys.arm) __sys.arm();
      if (typeof loadDemoData === 'function') loadDemoData();
      document.querySelectorAll('.mrln-toast').forEach(t => t.remove());
    });
    await page.waitForTimeout(300);

    console.log('=== width ' + W + 'px ===');
    check(errs.length === 0, '#0 boot: zero page errors' + (errs.length ? ' — ' + errs[0] : ''));

    const tabs = await page.evaluate(() =>
      [...document.querySelectorAll('#tabs .tab')]
        .filter(t => t.style.display !== 'none')
        .map(t => t.getAttribute('data-p')));

    let overflowBad = [], unreachable = [], occluded = [];
    for (const t of tabs) {
      const r = await page.evaluate(async (tp) => {
        const btn = document.querySelector('#tabs .tab[data-p="' + tp + '"]');
        if (!btn) return { reach: false };
        btn.click();
        await new Promise(r => setTimeout(r, 120));
        const panel = document.getElementById(tp);
        const vis = panel && getComputedStyle(panel).display !== 'none';
        /* #1 horizontal overflow — page must never scroll sideways */
        const over = document.documentElement.scrollWidth > window.innerWidth + 1;
        /* #8 fab occlusion at max scroll: after scrolling to the bottom, no
           text-bearing element's box may still intersect a fab's box (mid-
           scroll float-over is inherent to fabs; PERMANENT occlusion is not).
           Panels re-render async after the tab click, so settle + re-scroll
           until the document height is stable and we are truly at max scroll —
           otherwise a mid-relayout measurement reports phantom occlusion. */
        for (let i = 0; i < 6; i++) {
          const h = document.documentElement.scrollHeight;
          window.scrollTo(0, h);
          await new Promise(r => setTimeout(r, 120));
          if (document.documentElement.scrollHeight === h &&
              window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) break;
        }
        let occ = null;
        const fabs = [...document.querySelectorAll('.savefab,.botfab')].filter(f => f.offsetParent !== null || getComputedStyle(f).position === 'fixed');
        for (const f of fabs) {
          const fr = f.getBoundingClientRect();
          if (!fr.width) continue;
          const els = panel ? panel.querySelectorAll('p,li,label,.desc,.stat,.bignum,h2,h3,td,button:not(.savefab):not(.botfab)') : [];
          for (const el of els) {
            /* skip unpainted content: closed <details> children report phantom
               rects via forced layout of the display-locked subtree */
            if (el.closest('details:not([open])')) continue;
            if (el.checkVisibility && !el.checkVisibility()) continue;
            const er = el.getBoundingClientRect();
            if (!er.width || !er.height) continue;
            if (!(el.textContent || '').trim()) continue;
            const ix = Math.max(0, Math.min(fr.right, er.right) - Math.max(fr.left, er.left));
            const iy = Math.max(0, Math.min(fr.bottom, er.bottom) - Math.max(fr.top, er.top));
            if (ix > 8 && iy > 8) { occ = (el.className || el.tagName) + ''; break; }
          }
          if (occ) break;
        }
        window.scrollTo(0, 0);
        return { reach: vis, over: over, occ: occ };
      }, t);
      if (!r.reach) unreachable.push(t);
      if (r.over) overflowBad.push(t);
      if (r.occ) occluded.push(t + ' (' + String(r.occ).slice(0, 40) + ')');
    }
    check(overflowBad.length === 0, '#1 zero horizontal overflow on all ' + tabs.length + ' tabs' + (overflowBad.length ? ' — FAIL: ' + overflowBad.join(', ') : ''));
    check(occluded.length === 0, '#8 fabs occlude no text at max scroll' + (occluded.length ? ' — FAIL: ' + occluded.join('; ') : ''));
    check(unreachable.length === 0, '#11 all ' + tabs.length + ' visible destinations reachable' + (unreachable.length ? ' — FAIL: ' + unreachable.join(', ') : ''));
    await page.context().close();
  }
  await browser.close();

  console.log('=== armed (future-stage) assertions ===');
  if (STAGE >= 3) { /* implemented in the Stage-3 diff */ } else {
    armed(3, '#4 tappables ≥44px / nav cells ≥48×56');
    armed(3, '#2 nav labels fit at 320px in DE + HU, no ellipsis');
  }
  if (STAGE < 4) {
    armed(4, '#6 every section opens on a visible module directory');
    armed(4, '#7 gear destination reaches Settings + Connect + Change Log');
  }
  if (STAGE < 5) {
    armed(5, '#5 exactly one focal number on Home');
    armed(5, '#9 bottom nav + fabs + keyboard-open stack');
    armed(5, '#10 reduced-motion honored; vizzes do not re-animate per render');
  }

  if (failed) { console.log('PARITY: ' + failed + ' FAILED'); process.exit(1); }
  console.log('PARITY: all active assertions passed (' + held + ' armed for later stages)');
})().catch(e => { console.log('PARITY: harness error — ' + e.message); process.exit(1); });
