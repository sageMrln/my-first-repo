# COUNCIL RULING — Full-App Reskin Reconciliation (Chairman, 2026-08-05)
**Pinned tip `5d384de`** (index.html unchanged through e172b6f; Chairman re-verified :1682/:3110/:3531/:7033/:2240/:4473/:3015/:2760 and weight-grep=0 at this tree). **This ruling AMENDS the standing blueprint ruling `a8abee4` (pinned da15b2c)** — written before the owner brief arrived — keeping what survives, superseding what Osefe's directives overturn, each change named in §A. **Governing directives:** Osefe's brief @ `1b6d5c4`, addendum 1 (consolidate tabs, consumer-ease decides) @ `7ac3127`, addendum 2 (complete reskin, every screen) @ `5d384de`. Already ruled by Osefe, not reopened: grouped nav YES · complete reskin YES · fonts = Inter body + futuristic headings (closes a8abee4 §7.3 as its option b, ≈+28 KB) · serious voice confirmed. Kaito's verification memo verdicts V1–V5 are binding facts herein.

## A) Named amendments to a8abee4
1. **§3 IA superseded:** 5 text sections → **4 groups + gear** (§B). MORE's contents survive; its text-tab form does not. #stats moves MONEY→HOME.
2. **§3 "zero new backend" CORRECTED** — the mock's full Home needs two new data models (V1, V2). Contrarian's correction adopted.
3. **§1.1 mechanism sharpened:** `data-nav` axis retained; its mandated implementation is the Executor's **delegating dock** (§C).
4. **§4 grade-ring-as-hero DROPPED:** the mock supersedes the blueprint's ring hero; Home = §D. S–E tier naming keeps the a8abee4 §7.4 recommendation; ring gauge demoted to optional Stage-5 component for the Grades screen only.
5. **§5 stages amended** per §G (light-contrast prerequisite pulled into Stage 1; Stage 4 = 4+gear; Stage 5 adds the leaf-page skin pass; Stage 0 grows four defect fixes).
6. **§7.5 layouts recommendation sharpened** (§F). §4 out-list carries forward and grows (§I). Everything else in a8abee4 stands.

## B) Nav structure — DECIDED: 4 groups + gear (5 fixed destinations)
Arthur/Expansionist win the count; the Contrarian's real point — connect/log/settings must have a first-class home (connect = 10,884 B, second-largest panel) — is honored by making the **gear a permanent 5th dock slot**, not an overflow. All 16 panels routed, no orphans:
- **HOME** — #overview (new composition §D) + **#stats** (Grades) as its subscreen. Brief's Dashboard Philosophy ("How am I doing?") justifies grades under Home.
- **MONEY** — #income (Tax Helper stays inside), #expenses (Subscriptions group surfaced as a directory card), #loan, #flow, #rule, **#checklist** (the brief itself lists Checklist in the Finance module, line 83 — Arthur's Diary placement is overruled by the brief), #klarna (stays hidden/master-only; :7236 reveal slots it into Money's directory).
- **HEALTH** — #gym (weight/grade/anatomy/PRs stay subsections), #food.
- **LIFE** — #calendar, #notebook, #media. **Name ruled "Life", not "Diary":** the Outsider showed "Diary" is the mock's weakest label (cannot predict whether Food/Calendar/Notebook lives there) and the brief's own module name is Life. Plainly, Osefe: the mock's "Diary" should not ship as drawn; override is yours (§J.5). Mikoto owns all 4+1 labels, tested at 320px DE/HU before Stage 4 locks — never ellipsized.
- **GEAR** (icon slot) — Settings subscreen (lang/theme/layout/currency pickers leave the header, killing Arthur's measured 156px settings bar), **#connect ("Move my data")**, #log (Change Log), legal. All rare-use, so nothing weekly hides there — and Osefe is told plainly: **"Move my data" lives behind the gear** (Contrarian's condition, accepted).
Every section opens on a **visible module directory** (addendum-1 companion rule via Arthur) — never a hamburger. Desktop ≥860px: left sidebar, groups + sublists (a8abee4 §1.5 stands). Mobile ≤859px: bottom dock.

## C) Nav mechanism — DECIDED: data-nav axis, implemented as the delegating dock
Not a 6th layout, not "finish canvas" (Arthur's live render: canvas+light still opens with the 156px settings bar, HUD chrome, fabs over text, a cut-off scroll strip — a theme+layout swap cannot express the mock; First Principles' Phase-0 is refused). The dock/sidebar is new chrome under `data-nav="sections"`; **the 16-button `nav.tabs` stays in the DOM byte-identical and visually hidden**, and dock/directory buttons route by calling the existing buttons' `.click()`. This is what preserves, untouched: the once-captured NodeList :3110, the visTabs() inline-display contract (:3183 vs :7236/:9141 — no third option exists, Executor verified), per-tab listeners :3531/:3687/:7276/:7404, onboarding finish() :8843-8847, and the 8 deep-link sites. The 7 tour steps (:8918-8923) retarget to dock/directory nodes **in the Stage-4 commit**. tabOrder/tabColors/tabHold state: preserved, inert under sections (a8abee4 stands); re-scoping reorder to modules-within-a-section is future work, not v1.

## D) Home composition — DECIDED: Arthur's hero + four cards (five equal cards rejected)
A money app needs one focal number; five equal 28px values have no hierarchy. Ship:
- **Hero block** (no card chrome, 40px, tabular-nums): **"Left this month"** = leftover TYPICAL — the concept customers' eyes already know in that position (Outsider). Beneath it: the **incomeLog monthly mini-viz, labeled "Income history"** (V3 — real persisted series, :3015/:4289, rendered today ~:4328). The **Low/Typical/High scenario band survives** as the hero's secondary line (First Principles is right: the three-scenario reality check is the product's thesis; a single number is less informative). The "why" copy survives as a 12px dim sub-label inside the hero.
- **Four 88px cards:** Calories today (fully backed, V5) · Macros today (fully backed, V5) · Weight — **current value only, no delta, no chart** (V2: history absent) · Workouts — **"N in your plan" or streak** (V1: day is free text, weekly count not computable).
- **Every card carries an explicit time-scope label** ("today", "this month", "current") — the Outsider's ambiguity gap is a ship-blocker, assertion added to the parity harness.

## E) Reskin scope under addendum 2 — three classes, all 16 pages touched
- **Class A — full KPI-card anatomy + directories:** #overview, the four group directory screens, #stats. Arthur's card anatomy (§ his redline: label 12px/600 sentence-case, value 28px/700 tabular-nums, two-column, min-height 88px) is the spec.
- **Class B — skin + restyle of existing summary elements to the new anatomy:** #income, #expenses, #loan, #flow, #rule, #gym, #food. Their dense entry forms keep form layout.
- **Class C — skin only (palette/type/spacing/card chrome/44px targets), NO KPI-card retrofit:** #checklist, #klarna, #calendar, #notebook, #media, #connect, #log, Tax Helper, meal engine. Forcing card vocabulary onto data-entry tools is decoration costing weeks (Expansionist, adopted) — but per addendum 2 these pages are IN scope for the skin; nothing ships visually stale.

## F) Themes & layouts
- **Cyberpunk survives as a selectable theme+layout pair ("Cyber")** — deleting it discards two months of shipped gated work and desyncs landing.html (Arthur/Outsider, adopted). The new identity becomes the default.
- **Layouts' end-state, sharpened for Osefe (§J.4):** retire editorial/analyst/focus/canvas/command via the shipped LMIG migration pattern (:6935 precedent) → end-state = new default + Cyber legacy. Permanent dual "Classic" system stays **forbidden** (74-literal decay evidence). Re-spec-all-5 remains a fork only if Kaito prices it in Arthur-days first.
- **Prerequisite:** per-theme `--accent-text`/green-on-light values land in Stage 1, **before the identity ships** — Arthur computed #22D3EE = 1.68:1 and #22C55E = 2.12:1 on #F5F7FA; Glacier/Rose/Daylight would ship illegible. Floors: label grey ≥ #8A94A6 (5.40), light-theme accent-as-text ≤ #0E7490 (4.99), green ≤ #15803D (4.67).

## G) Build order (amends a8abee4 §5; each stage a frozen mini-gate: Akashi SAFE · Mikoto MISSING:0 · Hugo GREEN on the stage SHA + Arthur live review)
- **Stage 0 — startable NOW, no visual diff:** null-guard :3531 · fix dead subs selector :7033 (route to #expenses Subscriptions group) · onboarding_test ALL_TABS derived from index.html (kills the phantom-`subs` false-green) · nav_test data-p↔panel bijection · DEFAULTS `layout:'pro'` quirk (:2760) · fab-over-text overlap @390/820 (Arthur MUST-FIX, independent of the reskin) · Hungarian latin-ext · font-role tokens (pixel-diff-identical) · parity harness = **Arthur's 11 machine-checkable assertions verbatim** (overflow, 320px DE/HU labels, 4.5:1 all themes, ≥44px/48×56, one focal number, visible directories, gear reach, fab overlap, keyboard+nav, reduced-motion, all-16-reachable+tour) · commit this ruling.
- **Stage 1 — tokens:** `--alt` ×10 blocks + scales + **per-theme `--accent-text` (light-contrast prerequisite)** + contrast-test rows, same commit.
- **Stage 2 — typography (Osefe-decided):** Inter body + futuristic display via role tokens; migrate 186 by-name refs; tabular-nums on every numeric class; regenerate 57 screenshots.
- **Stage 3 — responsive shell, SAME 15 visible destinations:** `data-nav` axis + delegating dock/sidebar; the five mandatory prototypes (a8abee4 §1.5) before freeze; generate.js selectors same commit.
- **Stage 4 — 4-group+gear regroup:** directories, Settings subscreen, deep-link + tour retarget (8 sites + 7 steps) in the same commit, Mikoto's pre-tested labels.
- **Stage 5 — components + Home + leaf-skin pass:** hero+4 cards (§D), Class B/C skin sweep, mok() language rebuilt as ONE parameterised SVG helper on the incomeChartSVG pattern, **every new viz carries the `isNaN(__sys.token())` refusal guard** (Akashi's poison pass, pipeline step 4); weight-log lands here IF ordered (§J.1).
**One customer-visible publish** after Stage 5 on Osefe's explicit go (default); two marketing beats = his call, priced §J.3.

## H) Who was wrong — names and correct numbers (rule 4)
- **Executor + Expansionist:** "Workouts weekly count derivable / all five cards map to computed data" — **REFUTED (V1/V2)**. Records are `{id, day:free-text, title, body}` (:4473, placeholder :2240); no timestamp exists. Correct number: **2 of 5 cards fully backed** (Calories, Macros). Expansionist wrong on 3 of 5.
- **The standing ruling itself (a8abee4 §3):** "zero new backend" Home — **WRONG**; weight history is absent (grep 0) and workouts undated. The prior Chairman's claim is corrected by the Contrarian, in writing, here.
- **Executor's "canvas delivers ~85% of the mock":** unverified code estimate, refuted at the experience level by Arthur's live render; no pixel-diff was ever run. The number is **withdrawn**, not corrected — no honest replacement exists.
- **Contrarian's "mock evidences 2.1% of the app":** the 1,509/71,919 B measurement was real; the **inference was misleading** — byte-share of panel markup is not evidence-share of a design directive, and addendum 2 mooted it: the owner ordered every screen.
- **Kaito:** told Osefe "no record of the task exists" — **wrong** (a8abee4 existed, V4); correction already delivered in-thread.
- **First Principles:** initial data-layout grep of 0 (self-corrected to 65); repeated no unfixed number here.
**Pre-existing defects, routed (find-xor-fix):** :7033 dead subs selector → Kaito · onboarding_test false-green → Kaito (Hugo re-gates) · fab-over-text @390/820 → Kaito (Arthur redline stands) · :3531 unguarded → Kaito Stage 0 · DEFAULTS `layout:'pro'` ∉ LAYOUTS → Kaito.

## I) What we are NOT building — plainly (rule 5)
- **"Balance $1,250" as drawn** — Osefe, this one should not be built as you drew it: MRLN has no balance concept, no bank feed (cost rule forbids one), and the card would assert a fact the app does not possess — a credibility bug on a paid finance product's most prominent card. Card 1 ships as "Left this month" + labeled income history instead.
- **Any invented series:** no weight delta/trend chart, no "4 this week" workout bars, until the backing data exists (§J.1/2). A sparkline with no series never ships.
- **Five equal Home cards** (no focal point) — hero + four instead.
- **A 6th layout or "finish canvas" as the vehicle**; a desktop letterbox of the phone layout; a permanent dual Classic design system.
- **"Diary" as the group label** (predictability failure — override yours, §J.5).
- **KPI-card anatomy forced onto Class-C data-entry tools.**
- **Warm/hype copy or 🔥 streak fanfare** — the serious-voice rule stands, confirmed by Osefe; a8abee4's C1-retroactivity question (existing warm strings) remains open with him.
- **Deleting cyberpunk, tabOrder/tint/hold state, or the Low/Typical/High scenario band** — all preserved as specified above.

## J) Decisions that remain genuinely Osefe's (each one line)
1. **Dated weight log** — order (+1 gate-sized commit + small i18n; unlocks the Weight card's honest delta/trend; **recommended: ORDER**) or drop (Weight stays value-only).
2. **Dated workout-session log** — a real feature (new entry flow + render + i18n, a full pipeline pass; **recommended: DEFER**; card shows plan/streak meanwhile).
3. **One ship vs two marketing beats** — two beats ≈ double the 57-screenshot × 8-language regeneration + full gate, twice; default one.
4. **Layouts retirement via LMIG (recommended) vs re-spec all 5** — the fork is real only after Kaito prices re-spec in Arthur-days.
5. **"Life" vs your mock's "Diary"** — we ruled Life for predictability; your override costs one label + 8 translations.
6. **Warm-copy retroactivity (a8abee4 C1)** — keep serious everywhere (recommended) or grandfather existing strings.

*This ruling is argument, not proof — it bows to green.js and a real device. Line numbers re-pin to the Stage-0 branch point before any stage cites them as spec.*
