# MRLN — split-repo design (task #22)

**Author:** Akashi (security & architecture) · **Date:** 2026-08-06 · **Measured at tip `a295ae0`**
**Status: DESIGN ONLY. NOTHING EXECUTED. No lock taken, no app-code edit, no repo/DNS/Pages change.**
Osefe decides whether and when any of this happens. Everything below is measured on this box
and the measurement is named, so it can be re-run and refuted.

---

## 0. The premise, and how far I can actually verify it

Kaito reported (`8024069`, 2026-08-05) that the GitHub API returns `private: false, visibility: public`
for `sageMrln/my-first-repo`. **I could not independently re-run that from this box and I will not
pretend otherwise:** `api.github.com` returns `403` from the agent proxy ("GitHub access is not
enabled for this session"), and this environment has `GH_TOKEN`/`GITHUB_TOKEN` in the env plus
`gitConfigInjection`, so my `200` from `raw.githubusercontent.com` is *not* proof — it is exactly the
inconclusive result I logged for six weeks. I accept Kaito's API read as the working fact because the
API's own metadata field is a direct measurement, not an inference.

**Osefe's ten-second confirmation, which outranks both of us:** open
`https://github.com/sageMrln/my-first-repo` in a logged-out / private browser window. If the code
loads, it is public. Do that before spending an hour on this.

---

## 1. What I measured (the evidence this design rests on)

| # | Measurement | Result |
|---|---|---|
| 1 | Private-key material across **all 1,128 commits on all refs** (`MII…`, PEM bodies, `sk_live_`, `whsec_`, pkcs8) | **ZERO hits.** The signing key has never been committed, on any branch, ever. |
| 2 | `#__ownerKeySrc` slot content in **all 363 revisions of `index.html`** across all refs | **Empty in all 363.** |
| 3 | `#hud-state` slot content in the same 363 revisions | **Empty in all 363.** |
| 4 | `gh-pages` history (143 commits) for `team/`, `TEAM-CHAT.md`, `tools/`, `CLAUDE.md` | **Never present. Not once.** |
| 5 | `gh-pages` tree today | **74 files, exactly the `deploy_map.json` published set.** Already deploy-only. |
| 6 | Owner personal email in the *published* set | **0 hits** (published contact is `Kontaktmrln@gmail.com`). |
| 7 | Owner personal email in the *world-readable dev branch* | **42 occurrences** across `TEAM-CHAT.md`, 4 team logs, `tools/i18n/landing_keys.json`, `tools/test/preflight_pii_test.js`. |
| 8 | Lock-bypass recipe (`classList.add('unlocked')` + `__sys.arm()`) | **3 call sites**: `tools/shots/generate.js:153-154`, `tools/test/parity_harness.js:65-68` and `:151`. |
| 9 | DNS for `mrln.online` | **Apex A records → 185.199.108–111.153** (GitHub Pages anycast). No `www` CNAME. TXT is SPF only. |
| 10 | Repo-identifying URLs in the published set | `GUIDE.md:4` → `https://sagemrln.github.io/my-first-repo/`; `README.md:1`. Nothing else. |

**The headline: the two invariants I exist to protect were never breached, in the entire public
history.** No key, no owner figure. That single fact is what moves this from "emergency" to
"hygiene with a business tail", and it is why I am not recommending anything drastic.

---

## 2. THE RULING — invert the split. Do not move the site.

The brief (and Kaito's first sketch) assumes: *make this repo private, create a new public repo to
serve the site.* **That is the expensive half of a trade with a free half available, and I recommend
against it.**

**Do the opposite: the repo that already serves the site STAYS public and becomes deploy-only; the
workshop moves OUT into a new private repo.**

Why this is strictly better, in the order that matters:

1. **It touches no Pages configuration, no DNS, no CNAME, no TLS certificate. The cutover risk is
   not mitigated — it is *deleted*.** The domain binding, the Let's Encrypt certificate, the
   service-worker registration, the cache keys, the manifest identity and every customer bookmark
   are untouched because **the origin never changes**. There is no window to survive.
2. **`gh-pages` is already clean** (measurement 4 & 5). We are not "extracting" a public tree — it
   exists, it has 143 commits of history that never contained an internal file, and the one time
   internal content did reach the live site (`2964d70`, `team-chat.html`) it was fixed on the
   published branch and has stayed fixed. There is nothing to rebuild.
3. **It keeps `https://sagemrln.github.io/my-first-repo/` alive.** That URL is printed in
   `GUIDE.md:4` — a file customers hold. It is a **second origin**, which means any customer who
   ever opened the app there has their data in *that* origin's `localStorage`. Moving or renaming
   the repo silently strands that data with no error message and no recovery path from the new URL.
   That is real customer harm for zero security gain, and it is the strongest single argument here.
4. **Deleting a branch from a public repo is one click and cannot break a running site.** Moving a
   domain between repos is a multi-step operation with a TLS window in the middle.
5. Cost rule: both paths are free. This one is free *and* has no failure mode.

**What we give up by inverting:** the public repo keeps its existing (already-crawled) history and
its unlovely name `my-first-repo`. Neither is worth a certificate window — see §5 for history, and
note that customers never see the repo name; they see `mrln.online`.

---

## 3. Target shape

### PUBLIC — `sageMrln/my-first-repo` (unchanged identity, reduced to deploy-only)

| Keep | Delete |
|---|---|
| `gh-pages` — the 74 published files, untouched, Pages source unchanged | `claude/vibrant-pasteur-ie24ab` (the workshop) |
| `main` — reduced to `README.md` (+ `LICENSE` if wanted) and **nothing else** | `claude/brave-galileo-65za6t`, `claude/mrln-team-7rtjcn`, `claude/team-with-agents-7rpycn` |
| Pages: source `gh-pages` / root, custom domain `mrln.online`, Enforce HTTPS ON | `fix/readme-typos`, `snapshot-pre-arthur-20260629` |
| | From `main`: `CLAUDE.md`, `TEAM-CHAT.md`, `team/`, `tools/`, `.claude/` |

Settings on the public repo: Issues **off**, Wiki **off**, Projects **off**, Actions **off**
(nothing in the free path needs them; each is an unattended surface). Do **not** enable Discussions.
Repo description should say "deploy artifacts only — development is private", so a reader is not
hunting for source that isn't there.

**Rename: NO, not now.** Renaming changes the `github.io` path in `GUIDE.md:4` (and the PDF), forces
a Pages rebuild, and strands the second origin's data as in §2.3. If the name genuinely bothers us
it is a separate change with a guide + PDF rebuild and its own gate — never bundled with this.

### PRIVATE — `sageMrln/mrln-dev` (new)

Everything else, **with its full history pushed intact** (`git push --mirror`-style for the refs we
keep): the current working branch, `CLAUDE.md`, `TEAM-CHAT.md`, `team/` (logs, council, design),
`tools/` (tests, i18n, publish, shots, release). This becomes the working repo; every agent's cwd,
every lock, every sign-off happens here. Pages is **not** enabled on it (GitHub Free cannot serve
Pages from a private repo — that constraint is what makes the naive plan expensive, and it is
irrelevant to this plan).

> **Verify before executing:** GitHub Free serving Pages from public repos only is a *stated* plan
> limit. Confirm it on the plan page at execution time rather than on my say-so; if the account has
> since gained Pro, the option space widens (but the inversion is still the cheaper design).

---

## 4. Cutover sequence — zero downtime, and what "zero" honestly means

Under the inversion **there is no cutover for the site.** No published byte changes, no Pages
setting changes, no DNS record changes. The service worker, its cache, its scope (`./`), the
manifest `start_url`/`scope` and every installed PWA are untouched by construction. I am not
claiming "zero downtime" as a hope — there is no operation on the serving path at all.

**Order of operations (each step independently revertible):**

1. **Confirm visibility** (§0) and take a full local mirror: `git clone --mirror` of the repo to an
   external disk. Nothing else happens until that mirror exists.
2. **Create the private repo `mrln-dev`.** Push all working refs to it. Verify by cloning it fresh
   into a scratch dir and running `node tools/release/green.js` there — **the private repo must go
   GREEN on its own before the public one loses anything.** This is the interlock; if the tooling
   depends on something we didn't move, it surfaces here and costs nothing.
3. **Retarget the deploy plumbing** (§6) in the private repo, and prove a dry run: materialise the
   tree with `deploy.js --out` and diff it against live. **No push.**
4. **Only then, in the public repo:** delete the six non-`gh-pages`/`main` branches, then reduce
   `main` to `README.md`. **`gh-pages` is not touched in this step, at all.**
5. **Verify the site from a logged-out browser and a phone:** `mrln.online` loads, the installed PWA
   still launches, `sagemrln.github.io/my-first-repo/` still loads, an access key still validates.
   (Nothing should have changed — that is the point. Check anyway; the cost of checking is a minute.)
6. Update the release runbook + `CLAUDE.md` in the private repo to name the two remotes.

**The alternative (moving Pages to a new public repo), costed honestly, for the record:** create
repo → push tree → enable Pages → test on `*.github.io` → **remove the custom domain from the old
repo → add it to the new one**. DNS needs no change (measurement 9: the A records point at GitHub's
shared IPs, not at a repo). But the domain→repo binding is GitHub-side and exclusive, and attaching
it to a new repo triggers a **fresh Let's Encrypt issuance**: minutes to about an hour where
`https://mrln.online` can fail TLS. Installed/returning users mostly survive that window because
`sw.js` is network-first with a cache fallback — **but see §9, which is why I would not run that
window even with the SW as our safety net.** New visitors during it see a browser security error,
which is the worst possible first impression for a paid product. All of that risk buys us nothing
the inversion doesn't already give us.

---

## 5. The history problem — Osefe's prior is right, and here is the reasoning

**I agree: do not rewrite history. The horse left, and chasing it costs us more than it returns.**
Not because rewriting is hard, but because of what it does and does not do:

**What a rewrite cannot undo.** The content has been public for the life of the project. GitHub keeps
unreferenced objects reachable by SHA after a force-push (they are not purged on your schedule);
forks and network caches retain them; the code-search index, GH Archive, Software Heritage and any
crawler that has been through are all outside our control. A rewrite makes the repo *look* clean
while every third party that already took a copy still has one. That is worse than honest exposure,
because it invites us to believe a risk is closed when it isn't.

**What a rewrite would actively destroy.** Our gate is built on *"every sign-off names an explicit
SHA."* `TEAM-CHAT.md`, all five agent logs and every council ruling reference commit SHAs by hand —
hundreds of them. A rewrite dangles every one of those references at once and the audit trail
becomes unverifiable. **We would be paying with the integrity of our evidence base for a cosmetic
result.** I will not recommend that.

**And there is nothing to redact anyway.** Measurements 1–3: zero key material in 1,128 commits, the
owner-key slot empty in all 363 `index.html` revisions, the data slot empty in all 363. A history
rewrite exists to remove a secret. There is no secret in there to remove.

**What actually changes risk going forward, and it is not glamorous:**

- **Deleting the dev branches from the public repo** (§3) stops *new* internal content from being
  published from the moment it is done, and removes discoverability for humans and most crawlers.
  That is the entire realistic win, and it is worth taking. It is not retroactive and nobody should
  describe it as if it were.
- **Nothing here is rotatable.** No credential leaked, so there is nothing to revoke. The one
  irreversible item is the owner's personal email (measurement 7) — already out, unrecallable. The
  mitigation is account hardening (§8), not repository surgery.
- **Going forward: stop writing `Miradiosefe@gmail.com` into team files.** Use the business address.
  One line in `CLAUDE.md`, zero effort, and it stops the count from growing.

---

## 6. `deploy.js` / `deploy_map` retarget — free, manual, no CI

The publish flow becomes *private repo builds → pushes to the public repo's `gh-pages`*. There is
exactly **one** code change required, and it is small:

**`tools/publish/deploy.js:29`** — `const BRANCH = 'origin/gh-pages';` is hardcoded. After the
split, `origin` is the private repo and that ref does not exist, so `--check` dies at `:73`
("cannot read origin/gh-pages"). Change to:

```js
const BRANCH = process.env.MRLN_LIVE_REF || 'origin/gh-pages';
```

and set `MRLN_LIVE_REF=live/gh-pages` in the runbook. Default-preserving, so nothing breaks before
the split and the same commit is safe to land today. **@Kaito's edit, not mine** (this is deploy
plumbing, not a security fix — find-xor-fix applies).

**Note for whoever schedules this:** `green.js` does **not** invoke `deploy.js --check` (verified —
it runs `routing_test.js` at `green.js:137-138`, which reads the map and the files, never a git
ref). So the gate does not go RED from the split; `--check` is a *manual runbook step*, which means
**nothing will tell you it silently stopped running.** Make the runbook step explicit and loud.

**The release step (manual, free, ~30 seconds):**

```bash
# in the private dev repo, once:
git remote add live https://github.com/sageMrln/my-first-repo.git

# at release, AFTER Akashi SAFE + Hugo GREEN + Mikoto MISSING:0 + Osefe "ship it":
git fetch live gh-pages
MRLN_LIVE_REF=live/gh-pages node tools/publish/deploy.js --check     # path set MUST be identical
node tools/publish/deploy.js --out /tmp/mrln-live                    # materialise the 74 files
# then, in a scratch clone of the public repo checked out at gh-pages:
#   rm -rf everything-tracked ; copy /tmp/mrln-live over it ; git add -A ; commit ; push
```

**The anti-leak interlock, and be clear about which control does what.** The thing that stops an
internal file reaching the live site is **`deploy_map.json` + `deploy.js --out`** — it copies an
explicit 74-entry allowlist and *cannot* copy a file that isn't declared. The split does not provide
that guarantee and never did; the map does. Two hard rules for the push script:

1. It **materialises from the map** — it never `cp -r` a working tree and never pushes the dev repo's
   tree to `gh-pages`. A single stray `git push live HEAD:gh-pages` would republish the entire
   workshop, and it is exactly the muscle-memory mistake this design makes possible for the first
   time. Guard it: the script `rm -rf`s the scratch checkout's tracked files and copies only `--out`.
2. It runs `deploy.js --check` **and** `preflight` over every file, **before** the push, and aborts
   non-zero. Same discipline as today.

`deploy_map.json` itself needs no change: `source`/`published`/`role`/`phase` are repo-agnostic, and
`routing_test.js:58`'s 74-file pin still holds.

---

## 7. Sequencing against task #21 (root migration)

They touch the same publish path, so they must not run concurrently — but under the inversion they
are **not** in conflict, because #22 changes no published byte and no Pages setting.

- **#21 is the risky one.** It moves the app off `/`, rewrites `sw.js` and the manifest, and adds a
  root router — 4 phased deploys, each with real customer-facing failure modes (a dropped `#F-`
  fragment reads as fraud; a stale `caches.match('./index.html')` strands the offline launch;
  a changed `start_url` without a matching `id` makes installed apps launch the wrong URL forever).
  `routing_test.js` arms its guards off `deploy_map.phase` precisely because of this.
- **#22 (inverted) is the quiet one.** Zero published bytes, zero Pages config.

**Recommended order: #22 first, in a gap between #21 phases (or before phase 1 opens).** Reasons:
it is short and reversible; doing it first means #21's four noisy deploys all happen with the
workshop already private; and its one code change (`BRANCH` const, §6) is much safer to land while
`phase` is 0 and quiet than mid-migration when `deploy.js --check` is the thing everyone is leaning on.

**Hard rule either way: never start a #22 step while a #21 phase is live** (i.e. between a phase's
deploy and its verification). If the site misbehaves during an overlap, you cannot tell which change
caused it, and the migration's whole design premise is "four independently revertible deploys."

**Also note the reverse dependency:** if Osefe ever chooses the *naive* split instead, it MUST come
after #21 completes, never during — two Pages-level risks stacked on one weekend is how a live
product goes dark with no clean revert.

---

## 8. Risk ranking — what is actually at stake while we do nothing

Ordered by what I would actually spend Osefe's next hour on. **Honest bottom line: this is hygiene
with a business tail, not an emergency, and it should not jump the reskin queue.**

| Sev | What is exposed | Real consequence | Fixed by the split? |
|---|---|---|---|
| **HIGH — and it is NOT the split** | Owner's personal email ×42 in world-readable files (m.7), tied to the account that owns the domain, the repo and Stripe | Targeted phishing / credential stuffing against the account that controls **everything**. A successful phish loses the domain, the site and the payment flow — far more damage than every other item here combined. | **No.** Already public, unrecallable. Fix is **2FA/passkeys on the GitHub + Google + Stripe accounts, today.** If Osefe does one thing from this document, it is this. |
| **MEDIUM (business)** | Lock-bypass recipe ×3 sites (m.8) + my logs' written inventory of live, unfixed parser/tamper weaknesses | Cheaper licence cracking → revenue leakage. **Severity is bounded by the fact that the entire anti-tamper is client-side in a file every customer downloads** — an attacker holding `index.html` already has full capability. Our notes save them an evening; they do not grant them anything. | **Yes, going forward.** Removes the map. Does not remove the capability, which was never removable. |
| **MEDIUM (competitive)** | Strategy, roadmap, pricing rationale, Maki's go-to-market, council rulings, agent process | A competitor can read our plan. Bounded the same way: the product itself is one public HTML file anyone can read end to end. Copying the plan is easier than copying the execution. | **Yes, going forward.** |
| **LOW** | Owner name + city in dev files | Name and city are on the legal page by design (provider identity, required). No incremental exposure. | Partially. |
| **NONE — measured, not assumed** | Private signing key (m.1), owner balances (m.2, m.3), any customer data | **Not exposed. Ever.** No customer data has ever been in this repo — the app is local-only and stores nothing server-side. | n/a |

**So: is it urgent?** No. Nothing that is exposed can hurt a customer, and nothing exposed is
rotatable-but-unrotated. **Is it worth doing?** Yes — it is roughly a one-evening job with no
downtime under this design, and every day it waits is another day of internal notes being written
into a public file. **Should it interrupt the reskin?** No. Finish the reskin stage in flight, then
take it in a gap. **The account hardening in row 1 should not wait for any of that** — it is fifteen
minutes and it is the highest-value item on this page.

---

## 9. PREREQUISITE FINDING — `sw.js` caches error responses (→ @Kaito)

Found while modelling the cutover, and it matters to **both** #21 and #22:

`sw.js:26-29` (document branch) and `sw.js:35-38` (asset branch) cache **whatever the fetch
resolves to**, with no status check:

```js
fetch(req).then(function(resp){
  try{ var cp = resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, cp); }); }catch(_){}
  return resp;
})
```

A failed *network* rejects and lands in `.catch` — that path is fine. But a **successful HTTP
response with a bad status does not reject**, and `Cache.put()` only refuses `206` and
`error`/`opaqueredirect` responses — **a `404` or `503` body is perfectly cacheable.** So during any
window where the origin answers but serves the wrong thing (a Pages cutover, an unattached custom
domain, a GitHub incident, a mid-deploy tree), a returning user's cache entry for `/` is
**overwritten with GitHub's 404 page** — and from then on their *offline* launch serves that 404
instead of their app. The data in `localStorage` is untouched, but the app looks bricked, offline,
with no way for them to fix it.

**Fix (2 lines, both branches):** only cache a good, same-origin response —

```js
if (resp && resp.ok && resp.type === 'basic') { var cp = resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, cp); }); }
```

This is a robustness fix in a **shipped** build; it is worth landing on its own merits regardless of
either migration, and it is a **hard prerequisite if Osefe ever chooses the naive Pages-move path**.
Route: @Kaito (it is `sw.js` behaviour, not a security control — I am not claiming my standing
exception here). It also pairs naturally with `routing_test.js`'s phase-2 `pathname` guard on the
same branch, so do them in one edit. A test belongs with it: a fixture asserting the document branch
does not cache a non-`ok` response.

---

## 10. What we are NOT doing, and why (stated plainly, per the council rules)

- **NOT making this repo private and standing up a new public one.** §2. It buys nothing the
  inversion doesn't, and it pays for it with a TLS window, a stranded second origin and a broken
  URL in a customer-held guide.
- **NOT rewriting history.** §5. It cannot un-publish what is out, and it would dangle every SHA our
  sign-off discipline depends on.
- **NOT renaming the repo.** §3. Breaks `GUIDE.md:4` and strands `github.io`-origin data. If wanted,
  it is its own change with its own gate.
- **NOT deleting the public repo** (the only way to truly force object removal short of asking
  GitHub Support). It is the thing serving the site, and there is no secret in it to justify the cost.
- **NOT enabling any CI to do the deploy.** The manual push is free, auditable and already how we
  work. A GitHub Action holding a cross-repo push token is a new credential, a new attack surface,
  and — for a step we take once a fortnight — no gain.
- **NOT treating the split as the control that keeps internal files off the live site.** That is
  `deploy_map.json` + `deploy.js --out` + `preflight`, before and after this change. §6.

---

## 11. Effort

| Step | Effort |
|---|---|
| Confirm visibility + full `--mirror` backup | 10 min |
| Create private repo, push refs, prove `green.js` GREEN in a fresh clone | 20–30 min |
| `BRANCH` const change + runbook + push script (@Kaito) | 30–45 min |
| Delete 6 branches + reduce `main` in the public repo | 10 min |
| Verify live site + PWA + key validation unchanged | 10 min |
| **Total** | **~1.5 hours, no downtime, every step revertible** |
| Account hardening (2FA/passkeys) — *do this regardless* | 15 min |

**Recommendation: approve the inverted split, schedule it in a gap between reskin stages, and do the
account hardening now. Do not rewrite history. Do not move the site.**
