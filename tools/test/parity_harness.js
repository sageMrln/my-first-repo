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
    await page.waitForTimeout(1600);
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
        await new Promise(r => setTimeout(r, 160));
        const panel = document.getElementById(tp);
        const vis = panel && getComputedStyle(panel).display !== 'none';
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
        /* #1 horizontal overflow — measured AFTER the settle loop: panels
           re-render async post-click and a mid-relayout read reports phantom
           overflow (the expenses flake, seen 3x before this move) */
        const over = document.documentElement.scrollWidth > window.innerWidth + 1;
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
  if (STAGE >= 3) {
    /* #4 + #2 — IMPLEMENTED (Akashi's rot-trap catch: these must be real code
       BEFORE the marker bumps to 3, so activation adds checks, never silence).
       They assume the Stage-3 dock exists; a missing dock is a loud FAIL. */
    const boot = async (page) => {
      await page.goto('file://' + path.join(root, 'index.html'), { waitUntil: 'load' });
      await page.waitForTimeout(1600);
      await page.evaluate(() => {
        document.getElementById('lockScreen')?.classList.add('unlocked');
        document.documentElement.classList.remove('lk-noscroll');
        document.getElementById('boot')?.remove();
        if (typeof loadDemoData === 'function') loadDemoData();
        document.querySelectorAll('.mrln-toast').forEach(t => t.remove());
      });
      await page.waitForTimeout(300);
    };
    console.log('=== stage-3 assertions (390 / 320) ===');
    const browser3 = await chromium.launch({ executablePath: exe });
    {
      const page = await (await browser3.newContext({ viewport: { width: 390, height: 844 } })).newPage();
      await boot(page);
      const r = await page.evaluate(() => {
        const dock = document.querySelector('nav.dock');
        if (!dock) return { noDock: true };
        const cells = [...dock.querySelectorAll('button,a')].filter(c => c.offsetParent !== null);
        const badCells = cells.filter(c => { const b = c.getBoundingClientRect(); return b.width < 48 || b.height < 56; })
          .map(c => (c.textContent || '').trim().slice(0, 14));
        const shorties = [...document.querySelectorAll('.btn,.field input,.field select')]
          .filter(el => el.offsetParent !== null && el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().height < 44)
          .map(el => (el.id || el.textContent || '').trim().slice(0, 18));
        return { cells: cells.length, badCells: badCells, shorties: shorties.slice(0, 8), shortCount: shorties.length };
      });
      if (r.noDock) bad('#4 nav cells ≥48×56', 'nav.dock MISSING at stage ' + STAGE + ' — the Stage-3 shell is not in the DOM');
      else {
        check(r.badCells.length === 0, '#4 dock cells ≥48×56 (' + r.cells + ' cells)' + (r.badCells.length ? ' — FAIL: ' + r.badCells.join(', ') : ''));
        check(r.shortCount === 0, '#4 tappables ≥44px (.btn/inputs/selects)' + (r.shortCount ? ' — ' + r.shortCount + ' under: ' + r.shorties.join(', ') : ''));
      }
      await page.context().close();
    }
    for (const lang of ['de', 'hu']) {
      const page = await (await browser3.newContext({ viewport: { width: 320, height: 844 } })).newPage();
      await boot(page);
      const r = await page.evaluate(async (lg) => {
        const sel = document.getElementById('langSel');
        if (sel) { sel.value = lg; sel.dispatchEvent(new Event('change', { bubbles: true })); }
        await new Promise(res => setTimeout(res, 300));
        const dock = document.querySelector('nav.dock');
        if (!dock) return { noDock: true };
        const clipped = [...dock.querySelectorAll('button,a')]
          .filter(c => c.offsetParent !== null)
          .map(c => { const lbl = c.querySelector('.dock-lbl') || c; return { t: (lbl.textContent || '').trim(), clip: lbl.scrollWidth > lbl.clientWidth + 1 }; })
          .filter(x => x.clip).map(x => x.t.slice(0, 16));
        return { clipped: clipped };
      }, lang);
      if (r.noDock) bad('#2 dock labels @320 ' + lang.toUpperCase(), 'nav.dock MISSING at stage ' + STAGE);
      else check(r.clipped.length === 0, '#2 dock labels fit @320 ' + lang.toUpperCase() + ' (no clip/ellipsis)' + (r.clipped.length ? ' — FAIL: ' + r.clipped.join(', ') : ''));
      await page.context().close();
    }
    await browser3.close();
  } else {
    armed(3, '#4 tappables ≥44px / nav cells ≥48×56   (implemented, dormant until marker=3)');
    armed(3, '#2 nav labels fit at 320px in DE + HU, no ellipsis   (implemented, dormant until marker=3)');
  }
  if (STAGE >= 4) {
    /* #6 + #7 — IMPLEMENTED before the marker bumps (same rot-trap rule as #4/#2) */
    const b4 = await chromium.launch({ executablePath: exe });
    const page = await (await b4.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    await page.goto('file://' + path.join(root, 'index.html'), { waitUntil: 'load' });
    await page.waitForTimeout(1600);
    await page.evaluate(() => {
      document.getElementById('lockScreen')?.classList.add('unlocked');
      document.documentElement.classList.remove('lk-noscroll');
      document.getElementById('boot')?.remove();
      if (typeof loadDemoData === 'function') loadDemoData();
      document.querySelectorAll('.mrln-toast').forEach(t => t.remove());
    });
    await page.waitForTimeout(300);
    console.log('=== stage-4 assertions (390) ===');
    for (const g of ['Money', 'Health', 'Life']) {
      const r = await page.evaluate(async (grp) => {
        const cell = document.querySelector('nav.dock button[data-sect="' + grp + '"]');
        if (!cell) return { noCell: true };
        cell.click();
        await new Promise(res => setTimeout(res, 200));
        const dir = document.getElementById('dockDir');
        const open = dir && dir.classList.contains('open');
        const items = open ? dir.querySelectorAll('.dockdir-item').length : 0;
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await new Promise(res => setTimeout(res, 100));
        return { open: open, items: items };
      }, g);
      if (r.noCell) bad('#6 section directory [' + g + ']', 'group cell missing at stage ' + STAGE);
      else check(r.open && r.items >= 2, '#6 ' + g + ' opens a visible directory (' + r.items + ' modules)');
    }
    const r7 = await page.evaluate(async () => {
      const cell = document.querySelector('nav.dock button[data-sect="Settings"]');
      if (!cell) return { noCell: true };
      cell.click();
      await new Promise(res => setTimeout(res, 200));
      const dir = document.getElementById('dockDir');
      const texts = [...dir.querySelectorAll('.dockdir-item')].map(x => x.textContent);
      const st = [...dir.querySelectorAll('.dockdir-item')].find(x => /Settings/.test(x.textContent));
      if (!st) return { texts: texts, noSettings: true };
      st.click();
      await new Promise(res => setTimeout(res, 250));
      const gp = document.getElementById('gearPanel');
      const ok = gp && gp.classList.contains('open') && !!gp.querySelector('#langSel');
      if (gp) gp.classList.remove('open');
      return { texts: texts, settingsPanel: ok };
    });
    if (r7.noCell) bad('#7 gear reach', 'gear cell missing at stage ' + STAGE);
    else check(!r7.noSettings && r7.settingsPanel && r7.texts.length >= 3,
      '#7 gear reaches Settings panel (+' + (r7.texts.length - 1) + ' entries: ' + r7.texts.slice(1).join(', ') + ')');
    await page.context().close();
    await b4.close();
  } else {
    armed(4, '#6 every section opens on a visible module directory   (implemented, dormant until marker=4)');
    armed(4, '#7 gear destination reaches Settings + Connect + Change Log   (implemented, dormant until marker=4)');
  }
  if (STAGE < 5) {
    armed(5, '#5 exactly one focal number on Home');
    armed(5, '#9 bottom nav + fabs + keyboard-open stack');
    armed(5, '#10 reduced-motion honored; vizzes do not re-animate per render');
  }

  if (failed) { console.log('PARITY: ' + failed + ' FAILED'); process.exit(1); }
  console.log('PARITY: all active assertions passed (' + held + ' armed for later stages)');
})().catch(e => { console.log('PARITY: harness error — ' + e.message); process.exit(1); });
