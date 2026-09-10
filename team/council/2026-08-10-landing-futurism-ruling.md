# COUNCIL RULING — landing.html @ `e82673f`

**Question:** Does landing.html @ `e82673f` reach the futuristic-site standard (lusion.co / ilabsolutions.it) while remaining a conversion-focused product page — and what must change before it ships?

## VERDICT: NO-SHIP AT e82673f. THE ENGINE STANDS; THE FIRST SCREEN AND THE BUY MOMENT FAIL THE STANDARD. FIX PER THE ORDERED LIST, RE-GATE ON THE NEW TIP.

The middle of the page reaches the bar: real WebGL depth in one draw call, section-pinned acts, the dome + "Your data stays yours." moment, verified-clean reduced-motion, 8/8 languages, zero external requests, zero libraries, one-command rollback. Nobody is asked to rebuild any of that. But the standard is judged where a visitor judges it — the first viewport and the pricing section — and both fail on confirmed measurement. Four seats said GO-WITH-FIXES; under our own freeze rule that label is self-contradictory for this SHA: any fix moves the tip and reopens the gate, so GO-WITH-FIXES **is** NO-GO for `e82673f`. The Contrarian's ship-verdict was the correct one, even though two of his three headline mechanisms were partly wrong (below).

This ruling is the build spec. Reference it against candidate SHA `e82673f`; the fix commits create a new candidate that re-enters the pipeline at step 2 (Arthur redline → Kaito → Akashi poison → Mikoto → Hugo GREEN → Akashi SAFE → Osefe's go).

---

## Seat table

| Seat | Verdict | How the seat's claims survived verification |
|---|---|---|
| Contrarian | NO-GO | Hero claim CONFIRMED; hash claim PARTIAL (right on the cloud, refuted on the stream); seams PARTIAL (right defect, wrong cause on privacy; undercounted the dead band). Right ship-verdict. |
| First Principles | GO-WITH-FIXES | Hero-typography claim CONFIRMED in full. Undercalled pricing-stream severity ("minor"); Chairman overrules to blocking. |
| Expansionist | GO-WITH-FIXES | Product-never-enters-world CONFIRMED; content-never-transforms PARTIAL (core right, enumeration wrong, effort estimate optimistic). Correctly named what NOT to build. |
| Outsider | GO-WITH-FIXES | Pricing scribble CONFIRMED with independent pixel counts; nav-CTA PARTIAL ("unreachable" refuted, clipping confirmed). Best consumer-eye finds of the run. |
| Executor | GO-WITH-FIXES | Nothing refuted, but the shed-truncation claim was never adversarially verified — Kaito re-verifies the premise before applying the fix. |

---

## Who was wrong, with the correct numbers

Per standing order: a confident wrong number is worse than an admitted gap. These are the corrections.

**Contrarian — wrong on the pricing stream's mechanism.** The scribble strands are **not** fp32 hash breakdown: `s_stream` (L1266-1267) contains **zero hash calls** in its position math, max trig argument ~44 rad (safely inside fp32), and a pure-fp64 control render with perfect randoms reproduces the same strands (av2_C vs av2_D). The ~7–8 strands **are the designed geometry** — a 1D 7-turn helix with ±0.16 jitter. His proposed hash fix would not fix the stream; only a geometry change does. He was right about the cloud: h1 over i∈[0,34000) collapses to **410 distinct values** (expected ~33,965) on the capture stack; birth alpha `h(i*9.31)` (arg to 4.02e7, larger than his claimed 4.3e6) collapses to **189**.

**Contrarian — wrong attribution on the privacy seam.** The y≈352 edge is **not** the line-533 tint gradient. It is an **un-reskinned light-theme leak**: line 249's `.privacy` cream radial (`#F0E3CE`, measured luminance ~209 on a ~13 page) was never overridden by the dark block (400–618, which restyles `.privacy-tile` only). His feathering fix would not have touched it. His "~250px" dead band is also an undercount: correct figure **~348px** of near-empty black between "One." and "THE HONEST PART" (bands y=157–367 and y=397–473, first text at y≈505). The #effort seam at line 533 he got exactly right: 8.35→15.87 luminance in one pixel.

**Contrarian — "banned" has no written source.** No ruling in CLAUDE.md, TEAM-CHAT.md, frontend-ruling.md, or the blueprint bans the two-column SaaS hero. The documented directive is "alive" + the two reference sites (commit 4f62aa3). The hero measurements stand; the word "banned" does not. The Chairman supplies the missing judgement below: the hero **is** blocking, on the merits, not by citation.

**Outsider — "unreachable" refuted.** The mobile nav CTA is **80.5% clipped (25.1px visible of 128.8px)** and cannot be scrolled into view — but `elementFromPoint` hits it and a real touchscreen tap on the sliver navigated to `#pricing`. Correct statement: clipped, label-unreadable, below every touch-target guideline, looks broken on the first phone screen — but functional. Severity stays major; the word was wrong.

**Expansionist — effort estimate and enumeration wrong.** "~10 lines GLSL + one DOM rect" for the product-shape beat ignores that the camera is dynamic (eye moves with scroll+pointer, `camZ=15+sin(doc*π)*3.2`, world rotates at `u_t*0.11`) — aligning a world-space lattice to a DOM rect needs unprojection at a chosen depth and moment. His claim that "--sp and #how live/dim are the only scrubbed DOM motion" is refuted: `frame()` also scrubs `--hp` (hero parallax), `--sy` (orbs/grid), `--doc` (progress rail). That error actually *strengthens* his proposal's feasibility — the precedent exists — but the evidence as filed was wrong.

**First Principles — severity undercall.** Filed the pricing stream and hash chips as "minor." The stream was reproduced 5× across 2 viewports crossing the heading (2.49% pixel coverage) and intro copy (4.00%, peak alpha 255) at the exact conversion moment. That is blocking, and this ruling records it as such.

**Recon (the measurement pass) — two artifacts.** `hotOnBtn=false` was a probe artifact (stepped pointer movement shows correct hot/cold). The desktop "errors=4" were ReadPixels GPU-stall warnings caused by the screenshot capture itself — landing.html contains zero `readPixels` calls. The page's true console error count is 0/0/0 across desk/rm/mob.

**The Chairman's own note on precision:** the "27% dead fold" has two legitimate bases — 247px/27.4% (marquee inner text) or 232px/25.8% (marquee outer edge). Either way: a quarter of the first viewport is near-black (mean luminance 7.3/255, 99.2% of pixels <20/255) with a 16px sliver of the next statement at y=884.

---

## The judgement the evidence demands (why the hero blocks)

The standard Osefe set is judged in the first second. Measured reality at `e82673f`: hero H1 caps at **72px** at every desktop width ≥1200px while the mid-page statements reach **136.8px** at 1440 — the typography is inverted, the enormous type arrives one beat too late. The composition is the canonical SaaS template (eyebrow / H1 / lead / 2 CTAs / trust row / browser-framed PNG in a 1.1fr/0.9fr grid / marquee), a quarter of the fold is empty black, and with the copy hidden the hero canvas is dim dust plus hash-collapsed square chips. "Impress before reading the copy" fails precisely where it must pass. No written rule bans this hero; this ruling now does, for this page.

---

## ORDERED FIX LIST — Kaito owns every item (all are code; none are i18n or security in origin)

**P0 — blocking. All four land before the candidate re-enters the gate.**

1. **Recompose the hero.** Scale the H1 toward the statement clamp (~9vw ⇒ ~129.6px at 1440, cap ~140px) or open with a full-width statement-style line before the product panel; reclaim the ~232–247px dead fold as visible assembling world; the framed screenshot becomes the second beat, not the first paint. Arthur writes the redline first (director only — he does not code); Kaito implements. If copy/keys change, Mikoto owns the new strings (`node tools/i18n/sync.js` → MISSING: 0).
2. **Fix the pricing stream at the buy moment.** Re-aim the helix so it rises beside/behind the price card — and because the world rotates (`ry=u_t*0.11`), the re-aim must be applied **post-rotation or in view space**, or the helix depth-culled/dimmed within the copy's projected band, else it rotates back over the copy every ~57s. Additionally raise `.price-card` backdrop toward opaque (~.92 surface) so the card stops being 96%-transparent glass. If a volumetric (non-strand) stream is wanted, that is a geometry change (hash-driven radial spread) — the hash fix alone will not do it.
3. **Fix the mobile header at ≤560px.** Hide the duplicate nav "Get access" (the hero repeats it, same `#pricing` href) or shrink/wrap the pill row so all controls fit 390px. Correct numbers: 80.5% clipped, 25.1px visible, no scroll path exists (`overflow-x:hidden` at line 54).
4. **Fix the fp32 hash.** Hash bounded arguments (e.g. `h1(fract(i*0.618034))` or `i/u_n` — control measured 3,018 distinct, mean 0.4994, no serial correlation) **or** upload a true per-particle random attribute (differential av2_B renders a clean cloud). This repairs the birth/cloud chips and point-size/color variety everywhere.

**P1 — major. Land before ship.**

5. **Kill the light-theme leak.** Override `.privacy`'s line-249 cream radial in the dark reskin. This is the verifier's find, not any seat's — the defect the Contrarian saw and misdiagnosed.
6. **Re-upload `u_n` in both degrade branches** (`gl.uniform1f(U.u_n, DRAW)`) so shed thins shapes instead of truncating them (tier-2 currently turns the sphere into a top cap, opens the ring, deletes the stream's rise — per Executor's node simulation). **Unverified adversarially:** Kaito reproduces the truncation on the committed GLSL first, then applies. Verify, don't trust — including our own Executor.
7. **Feather the section tints and close the dead band.** Fade the line-533 tint over 200–300px at #why/#effort/#storage/#faq; tighten the pre-#effort statement spacing (24vh → ~16vh) or route a visible morph through the ~348px gap.

**P2 — logged, not gating.** Warm-underline registration under "all of you"; `webglcontextlost/restored` handling; the ~8% morph snap at act boundaries; mobile spacer compression / particle brightness through the void stretches; an early-degrade heuristic for the first 5s; an act for #how (18% of the scroll currently beat-less); the #why chips scroll-scrub. Good work, later work.

After Kaito's P0+P1: Akashi poisons everything new (pipeline step 4, his standing find-xor-fix exception), Kaito reviews Akashi's changes, Mikoto to MISSING: 0 if strings moved, Hugo GREEN and Akashi SAFE **on the new tip's SHA**, then Osefe's explicit go. Nothing in this ruling authorizes a publish.

---

## What we are NOT building, and why

Stated plainly, per standing order — including where it cuts against what Osefe asked for:

1. **No fullscreen menu, no particles-over-text interleaving, no sound.** These are the three signature Lusion moves the reference implies, and Osefe's ask was "reach lusion.co." We are not building them: the fullscreen menu buries the always-visible "Get access" one click deep on a conversion funnel; content/3D interleaving puts additive glow through body copy and fights both the serious register and the "9-year-old can use it" bar; audio adds nothing to conversion and violates the register. Chasing the reference's *genre* here would damage the product page it decorates. Recorded so future passes don't manufacture these to look ambitious.
2. **Not building the DOM-aligned product-lattice as the Expansionist spec'd it.** The idea (particles converge into MRLN, not a generic sphere) is the right long-term move and the confirmed gap is real — but "~10 lines" was wrong, the camera is dynamic, and the hero frame is already receding during the hero→#why morph. If pursued post-ship, it is the **hero pre-beat** variant, properly scoped.
3. **Not scroll-scrubbing the #why chips for this ship.** Confirmed static, and the hero-parallax precedent makes the fix feasible — but the section converts through its copy today, and RM/mobile keep the static layout regardless. P2, not gate.
4. **Not rebuilding the engine, not reverting the dark reskin.** Everything the Executor measured — cleanup, fallbacks, budget, constraints — passed. The rollback path (`git revert e82673f`) exists and stays unused.
5. **Not adding anything external or paid.** Zero external requests is verified and is a hard property of this page, per the cost rule. No CDN "polish" of any kind.
6. **And one thing said to Osefe directly:** the standard we are grading against is a reconstruction. Commit 4f62aa3's own message admits neither lusion.co nor ilabsolutions.it could actually be opened, and the phrases "enormous cinematic" / "banned SaaS hero" exist in no repo file — they live in council briefs. The measurements in this ruling are real; the *bar* they are measured against is our best reading of a reference nobody here has rendered. If Osefe can view either site and pin what specifically he wants from it, that becomes evidence and replaces the reconstruction. Until then, this ruling's hero judgement is the operative spec.

---

## Honest limits

- **The catastrophic hash numbers (410/189 distinct) are SwiftShader measurements** — the headless capture stack. Real-GPU severity varies; but even perfect fp32 `sin` caps this hash near ~3k distinct values (measured control), so degradation is intrinsic, only its magnitude is environment-dependent. No real weak device was measured; mobile perf is throttled emulation.
- **Executor's three claims were never adversarially verified.** The `u_n` truncation is a node simulation of the committed GLSL — credible, load-bearing, and item 6 requires Kaito to reproduce it before patching.
- **This ruling is argument, not proof.** It bows to the tooling: `green.js` exiting 0 on the new tip, and a re-run of the probes on the recomposed hero, outrank every paragraph above. If a P0 fix makes a probe red, the probe wins and the item reopens.
- **Pinned to `e82673f`** (landing.html byte-identical at HEAD 8819602; only team logs differ). The first fix commit moves the tip; every sign-off, including this ruling's factual baseline, then applies only to what is re-measured on the new SHA. Kaito remains accountable for the outcome — this council does not launder it.

— Chairman, MRLN Council, 2026-08-10