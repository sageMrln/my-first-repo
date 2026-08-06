# COUNCIL RULING — v42 go-live (Chairman, 2026-08-06)

**Question:** does v42 @ `9395cfd` go live on gh-pages **as-is**?
**VERDICT: NO — not as-is. One fix commit, two re-signs, then SHIP.** The reskin is sound; three seats found real defects the gate was structurally blind to, and one of them is a regression this stage introduced.

**Chair note, on the record:** the independent Chairman agent stalled mid-deliberation (transcript frozen at 23,322 B, no ruling emitted, task gone). Kaito chaired the synthesis himself rather than re-run a 5-seat council. Per CLAUDE.md this is *not* a laundering path — Kaito is accountable for this decision and defends it here in his own name, with every claim measured. Seats are quoted from their own submissions; nothing is summarised from memory.

---

## A) Verdict inputs (5 seats, blind; + adversarial verification)
| Seat | Verdict | Load-bearing claim | Status after verification |
|---|---|---|---|
| Executor | GO (mechanics) | `--check` exit 1 is *solely* the deliberate ov_mobile unpublish; tool has no removal vocabulary; 73-file tree byte-identical to candidate; 60 changed / 1 deleted / 0 added; zero dangling refs; rollback `0b52092` | CONFIRMED |
| Expansionist | GO-THEN-X | landing.html byte-identical, its hero `<img>` + `og:image` point at paths whose **bytes v42 replaces** → the release *is* the marketing refresh in 8 languages | CONFIRMED |
| First Principles | NO-GO (narrow) | first-run wizard promises *"Your first pick becomes tab 1"* → `STATE.tabOrder`, declared inert under sections by ruling a213555 §C | CONFIRMED (`index.html:9504`) |
| Contrarian | NO-GO (mechanics) | `deploy.js:101` hard-fails; **no** sanctioned-removal mechanism; the signed gate contains **no map-vs-live check** → blind by construction | CONFIRMED (read the file) |
| Outsider | NO-GO (consumer) | "Skip setup → hero reads **NaN kr**" | **REFUTED as stated** — rig artifact (armed without `refreshFinance()`); a real skipper's hero reads `0 kr` |

## B) Who was wrong — names and correct numbers (rule 4)
1. **Outsider — wrong on the headline number.** Hero after a real skip is **`0 kr`**, not `NaN kr`; Mission Briefing reads `+0 kr` / `~0 kr`, not NaN. His harness armed the token without `refreshFinance()`, which **every** real unlock path calls (`:7250`, `:7279`). His instinct still pointed at a real defect — credit stands, the number does not.
2. **The verifier — right but incomplete.** He measured the NaN band as 3 elements. **Kaito measured the true blast radius: TWELVE display sites** — band ×3 (`stLow/stAvg/stHigh`), Income tab ×3 (`incLow/incAvg/incHigh`), scenario buttons ×3 (`btnLow/…`), Klarna buttons ×3 (`klBtnLow/…`). Measured live on the signed tip, real unlock path, no demo data: band `NaN / NaN / NaN`, `incLow` = **"NaN kr"**, `btnLow` = **"Low (NaN)"** — and with income 20 000 set, hero renders `19.466` beside a NaN band.
3. **KAITO — the miss is mine, and it is the reason this council was worth convening.** At step 5 I approved Akashi's S2 poison spread with an armed/unarmed probe that called `loadDemoData()` — which runs `refreshEverything()` → `rebuildScenarios()` and therefore **masked the defect in my own evidence**. My "armed output byte-identical" claim was true and insufficient: I never tested the unlock path *without* demo data. Every downstream rig (parity, shots, all four seats) inherited the same blind spot.
4. **Akashi's S2 was CORRECT and is not reverted.** Pre-S2 the band leaked real income on a stripped copy — he proved it. S2 poisoned the values; nobody wired a re-render after arming. The defect is the wiring, not the security fix.
5. **Kaito's council charter was wrong** on one point, caught by the Executor: at `phase: 0` the app publishes as **`index.html` at root** — the `app.html` rename belongs to a later phase; shipping it today would have been a phase violation.
6. **Outsider's Hungarian claim — REFUTED.** Settings renders `Beállítás` / `Vissza`; the "BACK" he saw is CSS `text-transform:uppercase` on *Vissza*. `STREAK` is a designed English brand-term (`data-i18n-skip`, zero dictionary entries) — `MISSING: 0` is honest about it.

## C) The Executor-vs-Contrarian conflict — RESOLVED, and neither option as offered
- Executor proposed a **documented one-time override** of `--check`. Contrarian proposed a **forced tooling commit**. The override loses: it ships with the single automated guard against a wrong path set switched off, at the exact moment the tree is being rewritten — the Executor's own "most likely to go wrong" is a bad rsync with no tool left to catch it.
- Re-adding `ov_mobile.png` to make the tool green is **refused outright**: it fixes the tool's mood by un-fixing a twice-flagged finding.
- **RULING: teach the tool the word.** `deploy_map.json` gains an `unpublish: []` list; `deploy.js` treats a listed live-only path as *expected removal*, not `extra`. The interlock then goes **green honestly**, before the push, and stays a real guard. Tooling is unpublished — no gate risk, no re-sign cost.

## D) THE FIX LIST — build spec, ordered, owners per find-xor-fix
| # | Fix | Owner | Lane |
|---|---|---|---|
| **F1** | `refreshFinance()` calls `rebuildScenarios()` after `recomputeGrand()` — repaints all 12 poisoned sites once the token is armed. No recursion (verified: `rebuildScenarios` calls neither `refreshFinance`/`refreshEverything`/`renderDerived`). **Proven in a browser on a scratch copy: band `NaN/NaN/NaN` → `15.000/20.000/25.000`, `incLow` `NaN kr` → real, 0 page errors.** | Kaito | code |
| **F2** | `index.html:9504` — the wizard sub-copy stops promising an effect the shell no longer performs. New source string: *"Tap the pages you care about, in order."* (+ correct the stale comment at `:9355`). | Kaito | code |
| **F3** | `GUIDE.md:66` — delete "Your top picks become tabs 1–N; the rest stay available, just lower." (Expansionist: survived four fabrication sweeps). | Kaito | guide |
| **F4** | `deploy_map.json` + `deploy.js` — sanctioned `unpublish` (§C). | Kaito | tooling |
| **F5** | The one new key ×7 from F2. | Mikoto | i18n only |

## E) What we are NOT doing now — plainly (rule 5)
- **NOT reverting Akashi's S2.** It closes a proven leak.
- **NOT re-adding `ov_mobile.png`.** See §C.
- **NOT deleting the dead `"Double-tap any tab to open this."` string** (`index.html:1724`) — and this is a refusal of a fix two seats wanted. It is a **raw text node**, invisible to `sync.js`; shortening the English source orphans the 7 dictionary values and the walker would then render the new sentence **in English for all 7 non-English languages**. A cosmetic string behind an unreachable gesture is not worth a real i18n leak. → Stage 6, with its translations, as one clean pass.
- **NOT the German register seam** (formal *"…bevor Sie Geld sparen."* over informal *"Wenn dein Einkommen…"*). Real, and First Principles is right that it is visible on the flagship DE asset — but the correct fix is a **register audit**, not a one-sentence patch that leaves the rest inconsistent. → Stage 6, Mikoto, as a pass.
- **NOT the Assistant's spend-vs-spending intent miss** (Outsider's #2, a genuine trust defect) — it is parser/answer-engine work, a full pipeline pass. → Stage 6, top of the docket.
- **NOT re-labelling "Gym Plan" / adding a body-stats scent trail**, **NOT** the `// PERSONAL FINANCE COMMAND CENTER` header rebrand, **NOT** the landing "Training" card copy (wrong on live today too), **NOT** the portrait-Home marketing shot. All Stage 6.
- **NOT regenerating the 56 shots.** F1 changes nothing in them: the generator loads demo data, which already ran `refreshEverything()`, so the published shots already show the correct figures (verified: `3,400 / 3,800 / 4,300`).

## F) Re-sign scope — honest, not ceremonial
- **Akashi — MUST re-sign SAFE.** `index.html` changed, and F1 lands inside the code his S2 owns.
- **Hugo — MUST re-sign GREEN.** Published files change (`index.html`, `GUIDE.md`, PDF rebuild).
- **Mikoto — MUST re-sign `MISSING: 0`** (F5 introduces exactly one key ×7).
- **Arthur — CARRIES, no re-verify.** F1–F3 introduce no layout/visual change; the post-fix screen is *the state he already measured* (his rig loaded demo data, i.e. the repainted values). His `SHIP` stands. If he disagrees he may ratify async; the ship does not wait on it.
- **Precondition no ruling can waive:** `node tools/release/green.js` exits 0 on the final tip, and `deploy.js --check` exits **0** (not overridden) before the push.

## G) Ship authority (rule 6 of the charter)
Osefe said **"Ship it"**, then **"Council must approve of the everything done before its live, only then do you ship it."** Read plainly, that is: council approval is the gate; his go stands behind it. **Therefore: when F1–F5 land and Akashi + Hugo + Mikoto re-sign the new tip, this ruling constitutes the council's approval and Kaito ships without asking again** — reporting the result, and the rollback SHA `0b52092`, in-thread. If Osefe wants a second look before the push, one word countermands this section.

## H) Honest limits of this ruling
- It is argument plus measurement, not proof. It bows to `green.js` and to `--check`; either red stops the ship regardless of what is written here.
- The Outsider's consumer verdict — *"fix the empty-money-state and this is a GO"* — is honoured in substance (F1 is exactly that fix, at its true root) but his headline number was wrong and is corrected above.
- Four sign-offs survived adversarial re-measurement; every seat that attacked them reproduced their numbers. The gate's blindness was **structural** (no map-vs-live check; every rig loads demo data), not negligent — and both holes are closed by this commit.

*Pinned: candidate `9395cfd`; live `0b52092`. Referenced by SHA, never re-summarised from memory.*
