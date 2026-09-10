#!/usr/bin/env node
/* LANDING AVAILABILITY SUITE — the five hand-caught defect classes, automated.
 *
 * Born from Akashi's standing complaint (5 availability defects found by hand,
 * zero coverage): de-fixed cursor (2b7b237), reticle under the radius kill,
 * mobile mask-reveal risk, calc-driven opacity staging, and the phase-A
 * no-visible-CTA hole (a06fa96). Every assertion here is a defect that
 * actually shipped or nearly shipped.
 *
 * Needs Playwright + the pre-installed Chromium; run where a browser exists:
 *   node tools/test/landing_avail.js
 * Wired into green.js: exit 0 = pass, exit 2 = unavailable (never a pass).
 *
 * KEY LESSON encoded here (Akashi's 8th instrument fault): opacity is NOT
 * inherited as a computed value — a child reads 1 while a 0-opacity ancestor
 * hides the subtree. Always multiply up the chain. */
const localBrowser = require('./browser')();
if (!localBrowser) { console.error('landing_avail: no browser available — SKIP (not a pass)'); process.exit(2); }
const { chromium, executablePath: exe } = localBrowser;

const URL = require('url').pathToFileURL(require('path').resolve(__dirname, '..', '..', 'landing.html')).href;
let fails = 0;
function check(ok, msg) { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fails++; }

// effective opacity: multiply the ancestor chain; 0-height or display:none = invisible
const EFF = `(function(el){
  if (!el) return 0;
  let o = 1, n = el;
  while (n && n !== document.documentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
    o *= parseFloat(cs.opacity);
    n = n.parentElement;
  }
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return 0;
  return o;
})`;

(async () => {
  const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

  /* 1. FIRST-PAINT PURCHASE AFFORDANCE — desktop and mobile, scroll 0 */
  for (const [tag, w, h] of [['1440', 1440, 900], ['390', 390, 844]]) {
    const pg = await browser.newPage({ viewport: { width: w, height: h } });
    await pg.goto(URL, { waitUntil: 'load' });
    await pg.waitForTimeout(3400); // past any boot screen
    const best = await pg.evaluate(`(function(){
      let best = 0;
      document.querySelectorAll('a[href="#pricing"]').forEach(a => {
        const r = a.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) best = Math.max(best, ${EFF}(a));
      });
      return best;
    })()`);
    check(best > 0.05, `first paint @${tag}: a pricing CTA is visible (eff opacity ${best.toFixed(2)})`);
    await pg.close();
  }

  /* 2. FIXED OVERLAYS STAY FIXED — the body>* specificity trap (2b7b237 class) */
  {
    const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pg.goto(URL, { waitUntil: 'load' });
    await pg.waitForTimeout(3400);
    await pg.mouse.move(640, 340);
    await pg.waitForTimeout(300);
    const r = await pg.evaluate(() => {
      const out = {};
      [['cur', '.mx-cur'], ['ring', '.mx-curR'], ['prog', '.mx-prog'], ['spot', '.mx-spot'], ['header', '.site-header']].forEach(([k, s]) => {
        const e = document.querySelector(s);
        out[k] = e ? getComputedStyle(e).position : 'missing';
      });
      const cur = document.querySelector('.mx-cur');
      out.curInView = cur ? (cur.getBoundingClientRect().top < innerHeight && cur.getBoundingClientRect().top >= 0) : false;
      out.curRadius = cur ? getComputedStyle(cur).borderRadius : '';
      return out;
    });
    check(r.cur === 'fixed' && r.ring === 'fixed' && r.prog === 'fixed' && r.spot === 'fixed', `engine overlays are position:fixed (${r.cur}/${r.ring}/${r.prog}/${r.spot})`);
    check(r.curInView, 'cursor dot is inside the viewport (not parked at document bottom)');
    check(r.curRadius === '50%', `cursor reticle survives the radius kill (${r.curRadius})`);
    check(r.header === 'sticky', `header is sticky (${r.header})`);
    // sticky actually sticks (the overflow-x:hidden killer class)
    await pg.evaluate(() => scrollTo({ top: 2000, behavior: 'instant' }));
    await pg.waitForTimeout(300);
    const hd = await pg.evaluate(() => Math.round(document.querySelector('.site-header').getBoundingClientRect().top));
    check(hd === 0, `header actually pinned at depth (top=${hd})`);
    await pg.close();
  }

  /* 3. SETTLE SWEEP — nothing readable is stuck under 0.9 effective opacity */
  for (const [tag, w, h] of [['1440', 1440, 900], ['390', 390, 844]]) {
    const pg = await browser.newPage({ viewport: { width: w, height: h } });
    await pg.goto(URL, { waitUntil: 'load' });
    await pg.waitForTimeout(3400);
    const H = await pg.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    let stuck = 0; const bad = [];
    for (let f = 0; f <= 10; f++) {
      await pg.evaluate(t => scrollTo({ top: t, behavior: 'instant' }), Math.round(H * f / 10));
      await pg.waitForTimeout(420); // generous settle: staging updates on the next frames
      const s = await pg.evaluate(`(function(){
        let n = 0; const b = [];
        document.querySelectorAll('.stg, .mx-state .st-mask, .privacy-quiet, .pv-k, .pv-v').forEach(e => {
          const r = e.getBoundingClientRect();
          if (r.height > 0 && r.top >= 0 && r.top < innerHeight * 0.72 && r.bottom > 0) {
            const o = ${EFF}(e);
            if (o < 0.9) { n++; if (b.length < 3) b.push(e.tagName + '.' + String(e.className).slice(0, 24) + '=' + o.toFixed(2)); }
          }
        });
        return { n, b };
      })()`);
      stuck += s.n; if (s.n) bad.push('stop' + f + ':' + s.b.join(','));
    }
    check(stuck === 0, `settle sweep @${tag}: 0 stuck (${stuck}${bad.length ? ' :: ' + bad.slice(0, 3).join(' | ') : ''})`);
    await pg.close();
  }

  /* 4. NO-JS — full content, visible CTA */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const pg = await ctx.newPage();
    await pg.goto(URL, { waitUntil: 'load' });
    await pg.waitForTimeout(4200); // loader must self-clear by CSS alone
    const r = await pg.evaluate(`(function(){
      let hidden = 0;
      document.querySelectorAll('section .wrap > *').forEach(e => {
        if (e.getBoundingClientRect().height > 0 && ${EFF}(e) < 0.9) hidden++;
      });
      let cta = 0;
      document.querySelectorAll('a[href="#pricing"]').forEach(a => { cta = Math.max(cta, ${EFF}(a)); });
      return { hidden, cta };
    })()`);
    check(r.hidden === 0, `no-JS: 0 hidden top-level blocks (${r.hidden})`);
    check(r.cta > 0.05, `no-JS: a pricing CTA exists at eff opacity ${r.cta.toFixed(2)}`);
    await ctx.close();
  }

  /* 5. REDUCED MOTION — everything opaque, loader skipped */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const pg = await ctx.newPage();
    await pg.goto(URL, { waitUntil: 'load' });
    await pg.waitForTimeout(900);
    const r = await pg.evaluate(`(function(){
      let n = 0;
      document.querySelectorAll('.stg, .mx-state .st-mask, .hero-cta, .trustline').forEach(e => {
        if (e.getBoundingClientRect().height > 0 && ${EFF}(e) < 1) n++;
      });
      return { n, loader: !!document.getElementById('mrln-loader') };
    })()`);
    check(r.n === 0, `reduced motion: all content fully opaque (${r.n} translucent)`);
    check(!r.loader, 'reduced motion: boot screen skipped entirely');
    await ctx.close();
  }

  await browser.close();
  console.log(fails === 0 ? '\n✓ landing_avail: all assertions passed' : `\n✗ landing_avail: ${fails} FAILED`);
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.error('landing_avail crashed:', e); process.exit(1); });
