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
        viewport: desktop ? { width: 1440, height: 900 }
             /* Stage 4 (Arthur's composition ruling): real phone frame — the 4+gear dock
                rides at the clip bottom. (Was 390x1700 tall-paint + content-only clip.) */
             : { width: 390, height: 800 },
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

      await page.evaluate(() => {
        document.getElementById('lockScreen').classList.add('unlocked');
        /* lk-noscroll clamps <html> to the viewport while the gate is up — without
           removing it the page cannot scroll AT ALL (scrollHeight == viewport), which
           silently broke the Stage-4 panel-top framing: shots captured y=0 forever. */
        document.documentElement.classList.remove('lk-noscroll');
        __sys.arm();
        if (typeof loadDemoData === 'function') loadDemoData();
        /* marketing profile — the same "Alex" in every language (sample data, never the
           owner's). Income is pinned LATER, after the currency switch. */
        try {
          MODEL.profile = MODEL.profile || {};
          MODEL.profile.name = 'Alex';
          MODEL.profile.employer = 'Acme';
        } catch (_) { }
      });

      /* SEED APPLICATION — Hugo's RED blocker 1. The previous version assigned
         window.__SEED and NOTHING EVER READ IT, so 5 of 6 French how-to shots showed an
         EMPTY app ("Aucune note", 0 kcal, no events) — every file existed, every dimension
         was right, and only opening the images caught it. This version drives the app's
         OWN add flows (the same handlers a real user's taps hit), so if a flow breaks the
         seeding breaks loudly instead of producing hollow marketing images. */
      const seed = SEED[L] || null;
      if (seed && mode === 'howto') {
        await page.evaluate(sd => {
          /* workouts + calendar: exact record shapes copied from the app's own save
             handlers (STATE.workouts.push({id,day,title,body}); calendar[date].push
             ({id,text,repeat})). */
          (sd.workouts || []).forEach(w => {
            STATE.workouts.push({ id: uid(), day: w.day || '', title: w.title || '', body: w.body || '' });
          });
          const base = new Date(); base.setDate(3);
          (sd.calendar || []).forEach((txt, i) => {
            const d = new Date(base); d.setDate(3 + i * 4);
            const key = d.toISOString().slice(0, 10);
            STATE.calendar[key] = STATE.calendar[key] || [];
            STATE.calendar[key].push({ id: uid(), text: String(txt), repeat: 'none' });
          });
          (sd.media || []).forEach(m => {
            STATE.media.push({ id: uid(), title: m.title || '', type: m.type || 'film',
              status: m.status || 'watched', rating: (m.rating != null ? m.rating : null),
              comment: m.comment || '', genre: m.genre || '' });
          });
          (sd.notes || []).forEach(n => {
            STATE.notes.push({ id: uid(), title: n.title || '', body: n.body || '', ts: new Date().toISOString() });
          });
          /* body stats through the REAL inputs (initHealth wires input-event autosave) —
             without these the gym shot's top frame is a hollow ÂGE/TAILLE/POIDS form,
             which is what shipped for fr until Akashi opened the file. Same "Alex"
             sample numbers in every language. */
          [['bAge', '29'], ['bHeight', '178'], ['bWeight', '74']].forEach(([id, v]) => {
            const el = document.getElementById(id);
            if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }
          });
          if (typeof refreshEverything === 'function') refreshEverything();
        }, seed);
        /* food seeding happens LATER, after the language switch — see below */
      }

      /* Currency through the app's OWN picker too. Writing STATE.prefs.currency directly
         left the selector reading "DKK kr" while the figures rendered "$2,400" — the
         formatter's symbol is derived elsewhere and never re-read. Half-set state produces
         a screenshot that is visibly wrong in a way no file check would catch. */
      await page.evaluate(() => {
        /* capture the demo numerals BEFORE the switch so they can be restored after it */
        window.__preSwitchAmts = [];
        (MODEL.groups || []).forEach(g => (g.items || []).forEach(it => window.__preSwitchAmts.push(it.amt)));
        window.__preSwitchSave = MODEL.savingsMatch; window.__preSwitchLoan = MODEL.loanPayment;
        const cur = document.getElementById('curSel');
        if (cur) { cur.value = 'USD'; cur.dispatchEvent(new Event('change', { bubbles: true })); }
      });
      await page.waitForTimeout(350);

      /* Income pin — Hugo's RED blocker 2. Two prior failures compound here:
         (a) pin BEFORE the currency switch and convertAllMoney() divides it (3400 -> $349);
         (b) pin after, and recomputeIncome() re-derives MODEL.income from the demo's
             income LOG, silently overwriting the pin on the next refresh.
         So: currency first, then empty the income log and pin income AND incomeGuess (the
         derive fallback), then recompute + refresh, then READ THE RENDERED DOM AND ASSERT.
         A pin that is not asserted is exactly how 8 wrong heroes shipped. */
      /* Keep the demo's NUMERALS and change only the symbol — the way the original
         hand-made hero was composed. Letting convertAllMoney divide the DKK demo by 6.87
         produced $161 rent and a $3,540 leftover on $3,800 income: internally consistent,
         economically silly, and a visible downgrade from the live marketing asset. */
      const pinned = await page.evaluate(() => {
        try {
          if (window.__preSwitchAmts) {
            let k = 0;
            (MODEL.groups || []).forEach(g => (g.items || []).forEach(it => { it.amt = window.__preSwitchAmts[k++]; }));
            if (window.__preSwitchSave != null) MODEL.savingsMatch = window.__preSwitchSave;
            if (window.__preSwitchLoan != null) MODEL.loanPayment = window.__preSwitchLoan;
          }
          MODEL.incomeLog = [];
          MODEL.income = { low: 3400, avg: 3800, high: 4300 };
          MODEL.incomeGuess = { low: 3400, avg: 3800, high: 4300 };
          /* country: set through the visible field like a user, not by poking prefs */
          const lab = [...document.querySelectorAll('label[data-i18n="Country"]')][0];
          const inp = lab ? document.getElementById(lab.getAttribute('for')) : null;
          if (inp) { inp.value = 'US'; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); }
          if (typeof recomputeIncome === 'function') recomputeIncome();
          if (typeof refreshEverything === 'function') refreshEverything();
          const txt = (document.body.innerText || '').replace(/\s+/g, ' ');
          let amtsOk = true, k = 0;
          (MODEL.groups || []).forEach(g => (g.items || []).forEach(it => { if (it.amt !== window.__preSwitchAmts[k++]) amtsOk = false; }));
          return { low: /3,400/.test(txt), avg: /3,800/.test(txt), high: /4,300/.test(txt),
                   amts: amtsOk, country: inp ? inp.value : '(no field)' };
        } catch (e) { return { err: String(e) }; }
      });
      if (pinned.err || !(pinned.low && pinned.avg && pinned.high && pinned.amts)) {
        console.log('  \u2717 ' + L + ' — income pin did not take: ' + JSON.stringify(pinned));
        failed++; await ctx.close(); continue;
      }
      await page.waitForTimeout(300);

      /* switch language through the app's OWN picker, so we capture what a user sees */
      if (L !== 'en') {
        await page.evaluate(lang => {
          const sel = document.getElementById('langSel');
          if (sel) { sel.value = lang; sel.dispatchEvent(new Event('change', { bubbles: true })); }
        }, L);
        await page.waitForTimeout(400);
      }

      /* food through the REAL input + button, so parsing, totals and the photo-less
         entry path are exactly what a user gets. This runs AFTER the language switch:
         the "Added — …" confirmation is written once at click-time and never
         re-rendered, so seeding before the switch shipped an ENGLISH line inside
         every localized food shot. The parser is language-agnostic, so the target
         language's seed lines parse identically here; the income-pin assertions
         above stay untouched before the switch. */
      if (seed && mode === 'howto') {
        for (const f of (seed.food || [])) {
          const txt = typeof f === 'string' ? f : (f.text || f.name || '');
          if (!txt) continue;
          await page.evaluate(t => {
            const ta = document.getElementById('foodText'); if (ta) ta.value = t;
            const add = document.getElementById('foodAdd'); if (add) add.click();
          }, txt);
          await page.waitForTimeout(120);
        }
        await page.waitForTimeout(250);
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
          /* Stage 4: scroll the active panel's top to the viewport top, then capture
             the FULL 390x800 frame — content from the panel top, dock at the bottom
             (Arthur's Stage-4 framing spec). Legacy tabs mode keeps the old origin. */
          const scrollInfo = await page.evaluate(async () => {
            if (document.documentElement.getAttribute('data-nav') !== 'sections') return null;
            /* P1-N16 (Arthur): terms-of-service prose has no place in a marketing
               shot — hide the global footer + per-panel legal strips during capture
               (restored in the cleanup evaluate below). Hide BEFORE measuring: it
               changes scrollHeight. */
            document.querySelectorAll('footer, .panel-legal').forEach(e => {
              e.setAttribute('data-shothide', ''); e.style.display = 'none';
            });
            const panel = [...document.querySelectorAll('section.panel')]
              .find(s => getComputedStyle(s).display !== 'none');
            if (!panel) return { noPanel: true };
            /* clamp to reachable scroll: a short page (notebook) cannot put its panel
               at the top — comparing against the UNCLAMPED target reported phantom
               drift (-351px) while the shot was actually correct. */
            /* Arthur (round-3): a short page clamps the scroll and leaves the panel
               mid-frame — pad the page bottom so the panel top can ALWAYS reach y=8,
               then remove the spacer after the shot (next evaluate). */
            const want = panel.getBoundingClientRect().top + window.scrollY - 8;
            let max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            if (want > max) {
              const sp = document.createElement('div'); sp.id = '__shotspacer';
              sp.style.height = Math.ceil(want - max + 8) + 'px';
              document.querySelector('.wrap').appendChild(sp);
              max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            }
            const target = Math.min(max, Math.max(0, want));
            window.scrollTo(0, target);
            await new Promise(r => setTimeout(r, 250));
            /* P1-N17 (Arthur): the target-vs-scrollY check compared two numbers that
               are equal by construction — 40/48 shots framed 23-30px low and it never
               fired. What matters is where the PANEL landed: correct once after the
               settle, then ASSERT on the real geometry. */
            let pt = panel.getBoundingClientRect().top;
            if (Math.abs(pt - 8) > 2) {
              if (pt > 10) {   // short page out of scroll room — grow the spacer by the deficit first
                let sp2 = document.getElementById('__shotspacer');
                if (!sp2) { sp2 = document.createElement('div'); sp2.id = '__shotspacer'; document.querySelector('.wrap').appendChild(sp2); }
                sp2.style.height = ((parseFloat(sp2.style.height) || 0) + (pt - 8) + 8) + 'px';
              }
              window.scrollBy(0, pt - 8);
              await new Promise(r => setTimeout(r, 120));
              pt = panel.getBoundingClientRect().top;
            }
            return { target: Math.round(target), y: Math.round(window.scrollY),
                     doc: document.documentElement.scrollHeight, panelTop: Math.round(pt * 10) / 10 };
          });
          if (scrollInfo && !scrollInfo.noPanel && Math.abs((scrollInfo.panelTop ?? 8) - 8) > 2) {
            console.log('  ✗ ' + L + '/' + t.shot + ' — panel framed at y=' + scrollInfo.panelTop + ' (want 8±2)');
            failed++;
          }
          await page.waitForTimeout(150);
          const navY = await page.evaluate(() => {
            if (document.documentElement.getAttribute('data-nav') === 'sections') return 0;
            const nav = document.querySelector('nav.tabs');
            return nav ? Math.max(0, Math.round(nav.getBoundingClientRect().top)) : 0;
          });
          const out = howtoPath(t.shot, L);
          await page.screenshot({ path: out, clip: { x: 0, y: navY, width: 390, height: 800 } });
          await page.evaluate(() => {
            document.getElementById('__shotspacer')?.remove();
            document.querySelectorAll('[data-shothide]').forEach(e => {
              e.style.display = ''; e.removeAttribute('data-shothide');
            });
          });
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
