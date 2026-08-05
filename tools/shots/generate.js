#!/usr/bin/env node
/* Landing-page screenshot generator — COMMITTED, not a scratchpad script.
 *
 *   node tools/shots/generate.js                 # every language, every shot
 *   node tools/shots/generate.js --lang fr       # one language
 *   node tools/shots/generate.js --only hero     # hero only  (or --only howto)
 *   node tools/shots/generate.js --check         # report what exists vs what should
 *
 * WHY IT IS COMMITTED. The 30 localized how-to shots were produced by a scratchpad script
 * that no longer exists, so French could not be generated without rebuilding it from
 * scratch — and nobody could verify how the existing images were made. A published asset
 * that cannot be regenerated is a published asset nobody can check.
 *
 * WHAT IT DRIVES. The real app in headless Chromium: unlock, load the demo profile, switch
 * language through the app's own picker (never by writing the dictionary directly, so what
 * is captured is exactly what a user sees), then screenshot.
 *
 * OUTPUTS, matching the names landing.html already expects:
 *   ov_desktop.png            2880x1800  Overview hero, English
 *   ov_desktop.<lang>.png     2880x1800  Overview hero, per language
 *   assets/howto/<tab>.png     780x1600  English
 *   assets/howto/<tab>.<lang>.png        per language
 *
 * The demo profile is SAMPLE data (window.__DEMO_MODEL) and is never the owner's. The
 * preflight/leak rules still apply to anything published — see tools/release/green.js.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CHROME = process.env.MRLN_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PW = process.env.MRLN_PW || '/opt/node22/lib/node_modules/playwright';

/* The six how-to tabs the landing page shows, by the app's own data-p value. */
const TABS = [
  { shot: 'expenses', panel: 'expenses' },
  { shot: 'gym', panel: 'gym' },
  { shot: 'food', panel: 'food' },
  { shot: 'calendar', panel: 'calendar' },
  { shot: 'notebook', panel: 'notebook' },
  { shot: 'media', panel: 'media' },
];

/* Languages that get their own set. 'en' writes the un-suffixed base files.
   Keep this in step with landing.html's LOCSHOTS — routing_test-style parity is the
   next hardening step; today a mismatch shows up as a missing file in --check. */
const LANGS = ['en', 'da', 'es', 'de', 'sv', 'nb', 'hu', 'fr'];

const argv = process.argv.slice(2);
const arg = n => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : null; };
const has = n => argv.indexOf('--' + n) >= 0;
const ONLY = arg('only');
const WANT = arg('lang') ? [arg('lang')] : LANGS;

/* A screenshot that captured the splash, or an empty panel, is a FILE THAT EXISTS and
   therefore passes every existence check. Assert the page actually had app content on it
   at capture time, and report the byte size so a suspiciously small image is visible. */
async function notSplash(page, out) {
  const fs2 = require('fs');
  const info = await page.evaluate(() => ({
    boot: !!document.getElementById('boot'),
    text: (document.body.innerText || '').replace(/\s+/g, ' ').trim().length,
  }));
  const b = fs2.readFileSync(out);
  const dims = b.readUInt32BE(16) + 'x' + b.readUInt32BE(20);
  if (info.boot || info.text < 200) {
    console.log('  \u2717 ' + path.relative(ROOT, out) + '  ' + dims +
      '  \u2014 SPLASH OR EMPTY (boot=' + info.boot + ', visible text=' + info.text + ' chars)');
    try { fs2.unlinkSync(out); } catch (_) { }
    return false;
  }
  console.log('  \u2713 ' + path.relative(ROOT, out) + '  ' + dims + '  ' + Math.round(b.length / 1024) + ' KB  (' + info.text + ' chars on screen)');
  return true;
}

/* A transient greeting toast ("Good afternoon 👋 ...") floats over the header and landed
   ON TOP of the app title in the first French capture. Marketing shots must not contain a
   momentary notification. */
async function dismissToasts(page) {
  await page.evaluate(() => {
    /* Remove any toast on screen AND stop new ones: the greeting fires on a timer and
       reappeared in the 200ms between removal and capture, landing on top of the app
       title in the first French hero. */
    document.querySelectorAll('[class*="toast"], [id*="toast"]').forEach(el => el.remove());
    try { window.toast = function () { }; } catch (_) { }
    const kill = document.createElement('style');
    kill.textContent = '[class*="toast"],[id*="toast"]{display:none !important}';
    document.head.appendChild(kill);
  });
  await page.waitForTimeout(150);
}

const suffix = L => (L === 'en' ? '' : '.' + L);
const heroPath = L => path.join(ROOT, 'ov_desktop' + suffix(L) + '.png');
const howtoPath = (t, L) => path.join(ROOT, 'assets', 'howto', t + suffix(L) + '.png');

/* ---------------------------------------------------------------- --check */
if (has('check')) {
  let missing = 0;
  console.log('shot                         ' + LANGS.join('   '));
  const row = (label, fn) => {
    const cells = LANGS.map(L => { const ok = fs.existsSync(fn(L)); if (!ok) missing++; return ok ? ' ✓ ' : ' ✗ '; });
    console.log(label.padEnd(29) + cells.join('  '));
  };
  row('ov_desktop (hero)', heroPath);
  TABS.forEach(t => row('assets/howto/' + t.shot, L => howtoPath(t.shot, L)));
  console.log('\n' + (missing ? missing + ' missing' : 'complete'));
  process.exit(missing ? 1 : 0);
}

/* ---------------------------------------------------------------- generate */
(async () => {
  let chromium;
  try { ({ chromium } = require(PW)); }
  catch (e) { console.error('✗ playwright not found at ' + PW + ' — set MRLN_PW'); process.exit(2); }

  const seedPath = path.join(ROOT, 'tools', 'i18n', 'seed_langs.json');
  const SEED = fs.existsSync(seedPath) ? JSON.parse(fs.readFileSync(seedPath, 'utf8')) : {};

  const browser = await chromium.launch({ executablePath: CHROME });
  let wrote = 0, failed = 0;

  for (const L of WANT) {
    /* a fresh context per language: no storage bleed between runs, which is how a
       previous seeding attempt silently captured the PREVIOUS language's data */
    for (const mode of (ONLY ? [ONLY] : ['hero', 'howto'])) {
      const desktop = mode === 'hero';
      const ctx = await browser.newContext({
        /* The app is a FIXED-VIEWPORT layout: html and body are both overflow:hidden, so
           window.scrollTo() does nothing and there is no scrollable container to drive.
           Render the phone shots in a TALL viewport so the whole panel paints, then CLIP a
           390x800 window starting at the tab strip — which is how the existing six
           localized sets are framed. Clipping is the only way to compose these. */
        viewport: desktop ? { width: 1440, height: 900 } : { width: 390, height: 1700 },
        deviceScaleFactor: 2,
      });
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(String(e)));
      await page.goto('file://' + path.join(ROOT, 'index.html'));

      /* The app opens with a ~900ms cold-boot splash (#boot) that paints on frame 1. A
         screenshot taken before it tears down captures the MRLN logo on black and NOTHING
         else — seven such files were generated and passed a file-exists check before
         anyone looked at one. Wait for it to actually go. */
      await page.waitForFunction(() => {
        const b = document.getElementById('boot');
        return !b || b.offsetParent === null || getComputedStyle(b).opacity === '0' || !b.isConnected;
      }, null, { timeout: 15000 }).catch(() => { });
      await page.evaluate(() => { const b = document.getElementById('boot'); if (b) b.remove(); });

      await page.evaluate(seed => {
        document.getElementById('lockScreen').classList.add('unlocked');
        __sys.arm();
        if (typeof loadDemoData === 'function') loadDemoData();
        /* localized demo CONTENT (note text, media titles) where we have it — the UI
           chrome is translated by the app itself, this only makes the sample data read
           natively too */
        if (seed) { try { window.__SEED = seed; } catch (_) { } }

        /* THE MARKETING PROFILE — explicit, so every language's hero is the SAME profile in
           a different language, which is the whole point of a localized screenshot set.
           The shipped English hero showed "Alex · Acme · USD · 3,400/3,800/4,300" but
           DEFAULT_MODEL is "Sample · no employer · DKK · 2,400/2,800/3,400": it had been
           hand-typed and was not reproducible from any committed data. Pinning it here is
           what makes the whole set regenerable. Sample data only — never the owner's. */
        try {
          MODEL.profile = MODEL.profile || {};
          MODEL.profile.name = 'Alex';
          MODEL.profile.employer = 'Acme';
        } catch (_) { }
      }, SEED[L] || null);

      /* Currency through the app's OWN picker too. Writing STATE.prefs.currency directly
         left the selector reading "DKK kr" while the figures rendered "$2,400" — the
         formatter's symbol is derived elsewhere and never re-read. Half-set state produces
         a screenshot that is visibly wrong in a way no file check would catch. */
      await page.evaluate(() => {
        const cur = document.getElementById('curSel');
        if (cur) { cur.value = 'USD'; cur.dispatchEvent(new Event('change', { bubbles: true })); }
      });
      await page.waitForTimeout(350);

      /* Income is pinned AFTER the currency switch, never before: convertAllMoney() rewrites
         every stored figure on a currency change, so a pre-set 3400 became $349 (2400 DKK
         / 6.87). Set the display currency first, then the numbers we want shown in it. */
      await page.evaluate(() => {
        try {
          MODEL.income = { low: 3400, avg: 3800, high: 4300 };
          if (typeof refreshEverything === 'function') refreshEverything();
        } catch (_) { }
      });
      await page.waitForTimeout(300);

      /* switch language through the app's OWN picker, so we capture what a user sees */
      if (L !== 'en') {
        await page.evaluate(lang => {
          const sel = document.getElementById('langSel');
          if (sel) { sel.value = lang; sel.dispatchEvent(new Event('change', { bubbles: true })); }
        }, L);
        await page.waitForTimeout(400);
      }

      if (desktop) {
        await page.waitForTimeout(600);
        await dismissToasts(page);
        const out = heroPath(L);
        await page.screenshot({ path: out });
        if (!(await notSplash(page, out))) { failed++; } else { wrote++; }
      } else {
        for (const t of TABS) {
          const ok = await page.evaluate(p => {
            const tab = document.querySelector('nav.tabs .tab[data-p="' + p + '"]');
            if (!tab) return false;
            tab.click();
            return true;
          }, t.panel);
          if (!ok) { console.log('  ✗ ' + L + '/' + t.shot + ' — no tab with data-p="' + t.panel + '"'); failed++; continue; }
          await page.waitForTimeout(450);
          /* FRAMING. The existing set is composed from the TAB STRIP DOWN, showing the
             panel's real content. Screenshotting from the page top instead captures the
             settings bar (Language/Theme/Layout/Currency) — app chrome no marketing shot
             should show, and visibly different from the other six languages. Scroll the
             tab strip to the top edge so every language composes identically. */
          await dismissToasts(page);
          const navY = await page.evaluate(() => {
            const nav = document.querySelector('nav.tabs');
            return nav ? Math.max(0, Math.round(nav.getBoundingClientRect().top)) : 0;
          });
          const out = howtoPath(t.shot, L);
          await page.screenshot({ path: out, clip: { x: 0, y: navY, width: 390, height: 800 } });
          if (!(await notSplash(page, out))) { failed++; } else { wrote++; }
        }
      }
      if (errs.length) { console.log('  ! ' + L + '/' + mode + ' page errors: ' + errs.slice(0, 2).join(' | ')); failed++; }
      await ctx.close();
    }
  }

  await browser.close();
  console.log('\n' + wrote + ' written' + (failed ? ', ' + failed + ' FAILED' : ''));
  process.exit(failed ? 1 : 0);
})();
