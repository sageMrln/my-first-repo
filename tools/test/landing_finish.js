#!/usr/bin/env node
/* Landing customer journey: localization, responsive layout and progressive enhancement. */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const local = require('./browser')();
if (!local) { console.error('landing_finish: browser unavailable — SKIP (not a pass)'); process.exit(2); }
const root = path.resolve(__dirname, '../..');
const url = process.env.MRLN_LANDING_URL || pathToFileURL(path.join(root, 'landing.html')).href;
const languages = ['en', 'es', 'da', 'de', 'sv', 'nb', 'hu', 'fr'];

(async () => {
  const browser = await local.chromium.launch({ executablePath: local.executablePath });
  try {
    for (const width of [320, 390, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [], external = [], failed = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('requestfailed', r => failed.push(r.url()));
      page.on('request', r => {
        if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== new URL(url).origin) external.push(r.url());
      });
      await page.goto(url, { waitUntil: 'load' });
      const original = await page.locator('.brand[aria-label]').getAttribute('aria-label');
      for (const lang of languages) {
        await page.selectOption('#langSw', lang);
        await page.evaluate(async () => {
          document.querySelectorAll('img[data-shot]').forEach(i => i.loading = 'eager');
          await Promise.all([...document.querySelectorAll('img[data-shot],img[data-hero]')].map(i => i.decode()));
        });
        const state = await page.evaluate(lang => {
          const d = window.__L10N[lang];
          const untranslated = [];
          document.querySelectorAll('[aria-label],img[alt]').forEach(el => {
            for (const attr of ['aria-label', 'alt']) {
              const orig = el.__originalAttrs && el.__originalAttrs[attr];
              if (orig && lang !== 'en' && (!d.t[orig] || el.getAttribute(attr) !== d.t[orig])) untranslated.push(orig);
            }
          });
          const keys = Object.keys(window.__L10N.da.t);
          const missing = lang === 'en' ? [] : keys.filter(k => !d.t[k]);
          const shots = [...document.querySelectorAll('a.howto-shot')];
          const brokenShots = shots.filter(a => a.href !== a.querySelector('img').src || !a.querySelector('img').naturalWidth).length;
          const cta = document.querySelector('.site-header .btn[href="#pricing"]');
          const r = cta.getBoundingClientRect();
          return { lang: document.documentElement.lang,
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            untranslated, missing, shots: shots.length, brokenShots,
            ctaFits: r.left >= 0 && r.right <= innerWidth + 1 && r.width >= 44 && r.height >= 40,
            anchors: [...document.querySelectorAll('a[href^="#"]')].filter(a => !document.getElementById(a.hash.slice(1))).map(a => a.hash) };
        }, lang);
        assert.equal(state.lang, lang);
        assert.equal(state.overflow, false, `horizontal overflow ${width}/${lang}`);
        assert.deepEqual(state.untranslated, [], `accessible translations ${width}/${lang}`);
        assert.deepEqual(state.missing, [], `dictionary coverage ${lang}`);
        assert.equal(state.shots, 6);
        assert.equal(state.brokenShots, 0, `localized images/links ${lang}`);
        assert.equal(state.ctaFits, true, `header purchase CTA clipped ${width}/${lang}`);
        assert.deepEqual(state.anchors, [], 'internal anchors resolve');
      }
      await page.selectOption('#langSw', 'en');
      assert.equal(await page.locator('.brand[aria-label]').getAttribute('aria-label'), original);
      const shot = page.locator('.howto-shot').first();
      await shot.focus();
      await page.keyboard.press('Enter');
      await page.waitForSelector('#shotLightbox.open');
      assert.equal(await page.locator('#shotLightboxImg').getAttribute('alt'), await shot.locator('img').getAttribute('alt'));
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.lb-close').evaluate(e => e === document.activeElement), true);
      await page.keyboard.press('Escape');
      assert.equal(await shot.evaluate(e => e === document.activeElement), true);
      await page.locator('#faq details').first().locator('summary').click();
      assert.equal(await page.locator('#faq details').first().getAttribute('open'), '');
      if (process.env.MRLN_SCREENSHOTS && (width === 390 || width === 1440)) {
        fs.mkdirSync(process.env.MRLN_SCREENSHOTS, { recursive: true });
        for (const section of ['top', 'storage', 'pricing']) {
          await page.locator('#' + section).scrollIntoViewIfNeeded();
          await page.screenshot({ path: path.join(process.env.MRLN_SCREENSHOTS, `${width}-${section}.png`) });
        }
      }
      assert.deepEqual(errors, [], 'page errors');
      assert.deepEqual(external, [], 'external requests');
      assert.deepEqual(failed, [], 'failed assets');
      console.log(`PASS ${width}px: eight languages, assets, CTA, anchors, keyboard lightbox, FAQ; no page errors or external requests`);
      await context.close();
    }
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(4200);
    const href = await page.locator('a.howto-shot').first().getAttribute('href');
    await page.locator('a.howto-shot').first().click();
    assert.equal(page.url(), new URL(href, url).href);
    console.log('PASS no JavaScript: screenshot opens its local image');
    await context.close();
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
