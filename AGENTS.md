# MRLN — Agent Onboarding

You are working on MRLN: a privacy-first personal life app (money, health,
plans, notes) that runs entirely in the browser with no server, no account,
and no network calls. The product's core promise is that user data never
leaves the device — every rule below exists to protect that promise or the
people relying on it.

## The map

| Thing | Where |
|---|---|
| The app (mrln.online) | `index.html` — the entire app, one file |
| The site (mrln.online/landing) | `landing.html` — the entire site, one file |
| Legal page | `legal.html` |
| Site screenshots | `assets/howto/*.png`, `ov_desktop*.png` |
| User guide | `GUIDE.md` (+ `MRLN-Guide.pdf`, rebuilt from it) |
| Release gate | `tools/release/green.js` |
| Publish tooling | `tools/publish/deploy.js` + `deploy_map.json` |
| Tests | `tools/test/` |
| Team rules (read it) | `CLAUDE.md` |
| Coordination / lock board | `TEAM-CHAT.md` |

There is **no build step**. Edit the HTML file, open it in a browser, see the
change. The live site is the `gh-pages` branch; source edits change nothing
publicly until published.

## The loop

1. **Claim the lock** in `TEAM-CHAT.md` (🔒 ACTIVE WORK section): one agent
   edits at a time. Commit the lock line before touching code. If a lock is
   already there, do not start.
2. Edit → open in a browser → verify what you changed actually works.
3. Run the gate: `node tools/release/green.js` — **must exit 0.**
   Where a browser exists, it includes `tools/test/landing_avail.js`
   (13 availability assertions); if that section prints SKIPPED, run it
   somewhere with Chromium before calling the work done.
4. Commit small and atomic, push to a work branch, release the lock.
5. **Never reset, stash, or checkout a dirty shared working tree** — if the
   tree has changes you didn't make, stop and report. In-flight work has been
   destroyed by agents "cleaning up" before a rebase.

## Hard rules (the gate enforces most, you enforce the rest)

- **8 languages, always complete** (en es da de sv nb hu fr). Any new
  user-visible English string needs all 7 translations in the same commit —
  landing strings live in `landing.html`'s `__L10N` dictionaries, keyed by
  exact trimmed text. A missing key silently shows English to everyone else.
- **Every claim must be factually true.** The page says "no cloud", "no
  tracking", "nothing syncs" — these are measured properties, not slogans.
  Never add copy asserting something the product doesn't do (a boot screen
  once said "Syncing" and was blocked in review; it's binding precedent).
- **Zero external requests.** No CDNs, no fonts from Google, no analytics,
  no fetch to anywhere. Assets are bundled (fonts as data URIs, with their
  OFL license files published in `assets/fonts/`).
- **Reduced motion = fully static and complete.** Every animation must be
  disabled under `prefers-reduced-motion` with all content readable.
  No-JS must also leave the full page readable with a visible purchase CTA.
- **Never push to `gh-pages` directly.** Publishing is its own gated step:
  `node tools/publish/deploy.js --check` must verify the path set, then the
  74 mapped files are materialized (`--out`) and committed to `gh-pages`,
  then `--check` again must report "byte-identical to live". The previous
  `gh-pages` SHA is always the rollback.
- Serious, factual register. No hype, no invented testimonials or stats,
  no emoji in the UI (the site uses its own SVG glyph set).

## History you should know

`TEAM-CHAT.md` carries the shipped-release log (v1→v6), council rulings live
in `team/council/`, and reviewer memory in `team/logs/`. When your change
touches something with a ruling attached, read the ruling first — several
"obvious improvements" are deliberate decisions with recorded reasons.
