# 🧠 Mikoto — memory log

This file IS Mikoto's memory. Mikoto is a fresh instance every run; nothing is
remembered except what's written here. **Read this top-to-bottom before doing anything;
append an entry after every run.** Newest entries at the BOTTOM.

Entry format:
```
## [YYYY-MM-DD HH:MM] — <via Kaito | direct> — <one-line topic>
- Asked: …
- Did / found / thought: …
- Decision / result: …
- Commits / SHAs: …
- Still open / next: …
```

---

## [2026-06-28] — session start — role + history so far
- Role: localization. Keep all 7 languages complete (`node tools/i18n/sync.js`),
  user content stays raw (`data-i18n-skip`). Gate phrase: `MISSING: 0`.
- Built the **7-language Quick Update parser** (`f5c94eb`): keyword lexicon feeding the
  existing clause regexes, all 7 langs (en + es/da/de/sv/nb/hu).
- Patched Akashi's false-positives (`33f3589`): add-verb precedence, age adjacency,
  save-verb adjacency, dropped bare netto/neto from income.
- Cleared the two cosmetics Kaito flagged (`md` abbrev, `lægg til` variant).
- Note: Kaito caught a bank-name edge I missed (`Sparekassen 500 om måneden` → savings);
  he capped the save inflection tail at ≤3 letters. Lesson: unbounded `[\p{L}]*` on a
  save verb swallows bank names. Logged for next parser change.
- i18n stays `MISSING: 0` (508 keys). Owner-only Team Room card is `data-i18n-skip`.
- Open: nothing blocking.

## [2026-06-28 ~10:00] — Kaito handoff — translate Assistant MRLN KB to all 7 langs
- Asked: Translate 21 MISSING strings (20 KB answers + 1 label) to es, da, de, sv, nb, hu.
- Did / found: Extracted exact KB keys from source (curly quotes in inline examples like "income"),
  matched translations to source keys by substring (normalizing quote differences), added all
  21 keys × 6 langs = 126 translations to AUTO-MERGED block. Verified each stage.
- Thought: Quote handling was the trap — my initial translations had straight quotes/apostrophes
  in key names, but the KB source uses curly quotes (U+201C/U+201D/U+2019) in inline examples.
  Extracted source keys directly to match exactly. Lesson: always pull keys from source, not infer.
- Decision / result: All 527 translatable strings now complete across 7 languages. `MISSING: 0`.
- Commits / SHAs: `2649ecf` (translate KB) + `d0e7df8` (release lock + team chat).
- Still open / next: Ready for @Kaito verification, @Akashi security review, @Hugo GREEN test.

## [2026-06-28 ~18:30] — direct — Tier 0 i18n: 8 daily greeting + streak strings to all 6 langs
- Asked: Tier 0 engagement features (streak counter + morning briefing + quick-flash score) shipped to the branch with 8 new untranslated UI strings. Translate to es, da, de, sv, nb, hu with warm, emotionally engaging tone.
- Did / found: 
  * Identified 8 MISSING strings via `node tools/i18n/sync.js`: greetings ("Hi {name} 👋", "Hi 👋"), streak counters ("{n} days in a row — keep it going! 🔥", "day streak — keep it alive!"), encouragement ("Log anything today to keep your streak alive 🔥", "Welcome back — log something today to start a streak 🔥"), celebration ("Nice!", "{n} applied").
  * Translated all 8 into 6 languages with **warm, informal, encouraging tone** — because the daily ritual is the emotional hook. Spanish friendliness ("¡Bien!", "¡Dale!"), Danish intimacy ("dag i træk", "hold den gående!"), German directness ("weiter so!"), Swedish support ("håll på!"), Norwegian warmth ("fortsett!"), Hungarian positive reinforcement ("Szép!").
  * Preserved placeholders ({name}, {n}), emoji (👋, 🔥), dashes (em-dashes), and all punctuation exactly.
  * Merged into AUTO-MERGED block (48 translations: 8 strings × 6 langs). Closing marker `/* <<< AUTO-MERGED <<<` was missing from source; added it to fix sync.js parsing.
- Decision / result: All 8 strings now complete in all 7 languages. `node tools/i18n/sync.js` → MISSING: 0 (536 keys fully translated). Ready for gate.
- Commits / SHAs: `f15b501` (claim lock), `52bc9e4` (i18n merge + commit), `453759d` (release lock + team chat status).
- Still open / next: @Akashi re-verify if tip moved; @Hugo GREEN once Akashi clears; @Osefe's final go to publish.

## [2026-06-28 ~14:30] — Kaito handoff — verify + own "Send" button translations
- Asked: Kaito added 6 "Send" button translations (es Enviar, da Send, de Senden, sv Skicka, nb Send, hu Küldés); verify idiomatic + own them on the record.
- Did / found: Reviewed each against button conventions: Spanish "Enviar" (standard verb), Danish "Send" (idiomatic), German "Senden" (infinitive, correct form), Swedish "Skicka" (idiomatic), Norwegian "Send" (idiomatic). Hungarian "Küldés" was a gerund noun form — valid but inconsistent with the direct verb pattern in other languages. Adjusted → "Küld" (imperative verb, matches the pattern).
- Decision / result: All 6 translations verified and corrected. `node tools/i18n/sync.js` → MISSING: 0 (528 keys, 7 langs complete).
- Commits / SHAs: `1bed6d1` (fix hu Küldés→Küld) + `915115c` (release lock + team status).
- Still open / next: Send button translations now owned and verified by Mikoto. Ready for the gate.

## [2026-06-28 ~17:00] — Osefe (via Kaito) — BRAINSTORM: habit-forming + emotionally engaging + global reach
- Asked: Brainstorm (no code) — how to make MRLN so engaging that users return daily + love it, in a healthy trust-preserving way. Focus from localization lens: personalization creating emotional attachment, daily rituals + identity hooks, reaching markets nobody serves offline + 7-language trust positioning.
- Did / found / thought: Ranked 9 ideas across emotional pull × reach × feasibility. Highest-leverage cluster:
  **Tier 1 (do these first):**
  1. **Morning Briefing** (user's name + language, timezone-aware, 2-sentence summary of yesterday's actions before they ask). Offline-native, translates to all 7 langs. Creates morning ritual + acknowledges identity. High feasibility.
  2. **Name Recognition** (app calls them by name in culturally-warm tone, celebrates wins). "Got it, [name]. Your new income is 48,000 kr." — nobody else does this. Tiny lift, massive emotional ROI.
  3. **Streak System** (no punishment for misses, just neutral reset + earned-dopamine acknowledgment in their language). Proof they're doing the thing; sticky without dark patterns.
  4. **Assistant MRLN as Companion** (remembers user, proactive tips, personality voice changes subtly per language — Spanish friendliness vs. Nordic understatement, both feel *right*). Loyalty through character.
  **Tier 2 (strong reach):**
  5. **Culturally-Aware Celebration** (birthdays, milestones, regional norms — "You've saved enough for a holiday" in Spanish framing vs. Nordic "ferie"). Feels personal in culture-aware way.
  6. **Offline-First as Trust Signal** (reposition "your money, your health, your device — always" in each language as a *feature*, not apology). In privacy-conscious markets (Nordics, Germany, Hungary) this is trust made tangible.
  7. **Regional Financial Framing** (savings = family security in Spanish / freedom in Nordic / wealth-building in Hungarian; health = work-life balance vs. appearance). App gets what matters to them.
  **Tier 3 (global unfair advantage):**
  8. **Low-Connectivity Market Release** (offline-first MRLN is THE app in refugee/diaspora/rural/developing regions; 7 langs already ready; no competitors serve these offline). Reach genuinely global.
  9. **Memory + Ritual** (after 3 months, app mirrors back stats + patterns: "You've logged 1,247 expenses; your week peaks on Mondays"). User sees consistency, proof they're building.
- Decision / result: **TOP 3 TO PITCH:**
  1. **Morning Briefing + Name Recognition** — moves needle on daily return + emotional attachment immediately.
  2. **MRLN as Warm Companion** (KB extended with proactive care + personality voice localized per language) — builds loyalty.
  3. **Offline-First Positioning + Regional Financial Framing** — repositions uniqueness + opens new markets for growth.
- Still open / next: Post brainstorm to TEAM-CHAT for @Kaito/@Osefe review. No code yet — this is the strategy layer. Awaiting feedback on which tier 1 ideas to build.

## [2026-06-28 ~23:10] — direct (Osefe) — process retro adopted + parser ship + parallel-Mikoto resolved
- Asked: Repeated status checks; "what rules would increase our effectiveness?"; ship those to the team; ask Kaito about a second Mikoto; sync this log.
- Did / found:
  * Reconciled the parser ON TOP of Kaito's `3189a5a` — fixed inflected-save (leading boundary + `[\p{L}]*` so da/nb `sparer`, sv `sparar`, de `sparen` → setSavingsMatch while `Spar membership 99` stays out) and hu age (`életkorom`/`korom`), kept Kaito's bare name+price fallback. Cleared cosmetics (`md`/`mdr`, `lægg til`). Tip later capped to ≤3-letter save tail (`c6d2171`) so Aarhus bank names (Sparekassen/Sparkasse) fall through.
  * Opened the PUBLISH GATE on `c6d2171` (Akashi SAFE + my MISSING:0), pinged Hugo, relayed Osefe's "ship it" → parser live on gh-pages `1ea5525`.
  * Ran a release retro — 5 fixes, all adopted by Kaito (`67ad80f`): shared harness `tools/test/parse_test.js`, pre-publish guard `tools/publish/preflight.js`, single gate `tools/release/green.js`, BACKLOG section, CLAUDE.md rules (one-owner-per-fix, freeze-the-candidate, differential testing). Ran `green.js` myself → GREEN exit 0.
  * Asked Kaito about a second Mikoto (Send/KB work my session didn't do).
- Decision / result:
  * **Parallel-Mikoto RESOLVED** — not rogue; Kaito dispatched it "asleep", canonical, same memory log. Going forward: ONE dispatched Mikoto per i18n task, no Mikoto tab while one is dispatched. I own i18n.
  * Process is now enforced in code, not just intentions — `node tools/release/green.js` exit 0 IS the GREEN gate.
  * Lesson reaffirmed: my fresh assertions miss inflection/edge forms; Akashi's old-vs-new differential catches them → use differential tests for logic changes.
- Commits / SHAs: parser `c20689e`, `1048153`; retro adopted `67ad80f` (Kaito); my TEAM-CHAT posts incl. gate-open, ship-it relay, and the parallel-Mikoto question (`69ba8ee`).
- Still open / next: Hugo asked Kaito for a `green.js` pointer in CLAUDE.md's release step. Akashi drafting CSP hardening + STATE-header format (propose only). Backlog: 2 parser items + 3 Akashi arch notes (CSP, hardcoded Team Room URL, `#team` flag). i18n `MISSING: 0` on current tip.

## [2026-06-28 ~14:40] — direct — briefing v2 i18n: 4 time-aware greeting strings
- Asked: Briefing v2 (Kaito's feature) adds 4 new UI strings (time-aware greetings + monthly surplus tracker). Translate to es, da, de, sv, nb, hu.
- Did / found: 
  * Ran `node tools/i18n/sync.js` → MISSING: 4 (exactly as briefed): "Good morning", "Good afternoon", "Good evening", "on track to keep {amt} this month 🔥".
  * Translated all 4 into 6 languages with warm, natural tone:
    - Greetings (Buenos días/God morgen/Guten Morgen/God morgon/God morgen/Jó reggelt, etc.) — standard idiomatic morning/afternoon/evening forms.
    - Surplus tracker positioned naturally per language's word order (e.g., "en camino a guardar {amt} este mes 🔥" in Spanish vs "på vej til at spare {amt} denne måned 🔥" in Danish).
    - Preserved placeholder `{amt}` (already formatted money string) and emoji 🔥 exactly.
  * Merged all 24 translations (4 keys × 6 langs) into AUTO-MERGED block in index.html using Python script (extracted JSON via brace-counting to handle huge 729KB structure).
  * Re-ran sync.js → MISSING: 0 (538 keys fully translated across 7 languages).
- Decision / result: Briefing v2 i18n complete, all 7 languages ready. Gate candidate `e34253b` (Akashi SAFE on money logic) now has full i18n coverage.
- Commits / SHAs: `02d5108` (claim lock), `5e3e7cc` (i18n merge), `d319647` (release lock + team chat status).
- Still open / next: @Akashi already cleared `e34253b` (no re-sign needed since i18n doesn't touch money logic). Awaiting @Hugo for GREEN on the gate, then @Osefe's final "ship it".

## [2026-06-28 ~14:45] — direct (Osefe via Kaito) — tab-reorder i18n: 1 string
- Asked: Tab-reorder feature shipped with 1 new UI string ("Position in the menu" — labels the tab-reorder control in the double-tap popup). Translate to es, da, de, sv, nb, hu and get back to MISSING: 0.
- Did / found:
  * Ran `node tools/i18n/sync.js` → MISSING: 1 ("Position in the menu" untranslated in all 6 langs).
  * Claimed lock for index.html in TEAM-CHAT (commit `b1282b2`).
  * Translated "Position in the menu" to all 6 languages using natural UI phrasing for "position in menu/order":
    - es: "Posición en el menú"
    - da: "Position i menuen"
    - de: "Position im Menü"
    - sv: "Position i menyn"
    - nb: "Posisjon i menyen"
    - hu: "Hely a menüben"
  * Merged all 6 translations into AUTO-MERGED block via Python script (preserved exact formatting, byte-identical key names).
  * Re-ran sync.js → MISSING: 0 (539 keys fully translated across 7 languages).
- Decision / result: Tab-reorder i18n complete. All 7 languages ready. MISSING: 0 verified.
- Commits / SHAs: `b1282b2` (lock claim) → `3da4b28` (i18n merge) → `069b41c` (lock release + team chat status).
- Still open / next: Ready for verification by Kaito + any downstream testing. Nothing blocking.

## [2026-06-29] — Osefe (direct) — BRAINSTORM: browser→app data transfer + 9-year-old clarity
- Asked: Optimize how data ships browser↔app, and make it so simple a 9-yo transfers without confusion. Brainstorm with team; Osefe talks to each agent individually.
- Did / found: Read the current Backup/Import panel. Root issue = 3 overlapping verbs on one screen (💾 Save/Export, ⇄ Backup/Import, "Make my data code"=MRLNDATA- blob) + QR + master-file + other-app imports, all shown at once; the code is a wall of text.
- Key insight: gh-pages browser tab and installed PWA are SAME origin → likely SHARE localStorage. If true, "Add to Home Screen + open" = data already there, ZERO transfer steps (best UX = no UX). Downloaded file:// copy is a different origin → that's the real transfer gap; steer users to install the PWA, reserve codes/QR for file↔file.
- My-lane proposals (clarity, 7 langs): 3-step wizard one-direction-at-a-time (not a wall); concrete imperative verbs Move/Copy/Get-it-back (not nouns — recall hu Küldés→Küld); 3 numbered emoji steps max; context-aware single path (phone/desktop, browser/installed); celebratory localized confirmation; payload stays data-i18n-skip raw.
- Mechanism proposals (flagged to others): compress state before QR/code encode (the literal "ship between formats" optimization); one canonical versioned transfer envelope for code/QR/file.
- Decision / result: Posted full brainstorm (`e65f5a7`). Routed: @Hugo verify storage sharing + own flow test; @Akashi shared-storage/QR-payload security; @Kaito envelope + wizard build; I own all strings + step wording.
- Commits / SHAs: `e65f5a7`.
- Still open / next: Awaiting Osefe's individual talks + which idea(s) to build. If shared-storage confirmed, the #1 path may need no transfer UI at all. No code yet.

## [2026-06-29 ~async] — Kaito handoff — Move-my-data Phase 1 i18n translation batch
- Asked: Sync translations for Phase 1 "Move my data" redesign (25 UI strings introduced by Kaito's `433064c`). Translate to es, da, de, sv, nb, hu. Frozen branch tip: `6470dc3` (Phase 1 feature-complete). STRING SET: STEP {n}; situation-aware banners (3× fresh/installed/browser scenarios) with bold next-tap first line + dim why; import preview (Found: {sum}., 💰 money setup, 📝 {n} notes, 🍽️ {n} food entries, 🏋️ {n} workouts, 📅 {n} calendar days, 🪙 {n} savings boxes); confirm dialog (📥 Bring this in?, Bring it in); success (✓ Done — your data is now on this device.); friendly errors (clipboard permission, paste fallback, copy-auto failure); all with emoji, placeholders, HTML tags intact.
- Did / found:
  * Translated all 25 keys to 6 languages (150 translations total): Spanish (friendly, direct), Danish/Norwegian (idiomatic), German (precise, formal), Swedish (warm, natural), Hungarian (imperative verbs matching pattern).
  * Verified: all emoji preserved (💰📝🍽️🏋️📅🪙📥✓), placeholders {n}/{sum} intact, <b>…</b> HTML tags in correct positions, quotation marks (curly "…" + escaped \") match source, em-dashes —, punctuation.
  * Attempted to merge into index.html AUTO-MERGED block programmatically (block is ~747KB minified JSON, single line 4810): Python brace-counting + eval() works, but JSON.stringify/sed replacements created file corruption due to size/escaping complexity. Rolled back to clean state.
- Decision / result:
  * **Translation batch 100% complete and verified** — 25 keys × 6 langs, ready for merge.
  * **Recommend merge via existing i18n process** — Kaito or Hugo should use their practiced JSON-in-minified-block routine (they've done it before; I hit limitations in this environment).
  * Claimed lock 30fcc3a, released lock 1dbd537. No index.html edit needed yet (waiting for merge support).
- Commits / SHAs: 30fcc3a (lock claim) → 1dbd537 (TEAM-CHAT status + lock release).
- Still open / next: @Kaito or @Hugo merge 150 translations into index.html line 4810. After merge: `node tools/i18n/sync.js` should print MISSING: 0. Then @Akashi re-SAFE, @Hugo re-GREEN, @Osefe final go for Phase 1 ship.

## [2026-06-29] — Kaito handoff (resumed) — Actually merged Move-my-data Phase 1 i18n into index.html
- Asked: Previous Mikoto session prepared but couldn't merge the 150 translations. This session picked up the lock and did the actual merge.
- Did / found:
  * Ran `node tools/i18n/sync.js` → confirmed MISSING: 25, got exact key list from need_translate.json.
  * Verified all 25 keys exactly matched (including curly quotes in string keys — pulled from source, didn't infer).
  * Wrote Python script to load the ~747KB minified JSON from the AUTO-MERGED block, merge 25 keys × 6 langs = 150 translations, re-serialize, and write back. No file corruption; json.dumps with ensure_ascii=False.
  * Re-ran sync.js → MISSING: 0 (559 keys, 7 languages fully translated).
  * Note: had a parallel-session git conflict (another Mikoto session had committed translation stubs); resolved by resetting to remote tip (c828721) and re-merging translations there.
- Key translation decisions:
  * "STEP" → PASO (es) / TRIN (da) / SCHRITT (de) / STEG (sv) / TRINN (nb) / LÉPÉS (hu) — natural UX badge word per language.
  * All button names referenced inside instructions translated consistently (same phrase everywhere in a language for "📋 Bring in my data").
  * Imperative verb pattern maintained: Traerlo/Hent det ind/Daten laden/Hämta in/Hent det inn/Behozatal.
  * Placeholders {n}/{sum}, emoji, HTML <b>…</b> tags, curly quotes all preserved exactly.
- Decision / result: MISSING: 0. Lock released.
- Commits / SHAs: current commit (see git log).
- Still open / next: @Akashi re-sign SAFE on current tip; @Hugo re-confirm GREEN; then gate + Osefe ships Phase 1.

## [2026-06-29 ~01:00] — Kaito dispatch (asleep) — Tier 2 hero: translate 2 strings to all 6 locales
- Asked: 2 new UI strings from the Tier 2 hero number need translating to es, da, de, sv, nb, hu → MISSING: 0. Strings: "YOU KEEP · TYPICAL" (10px micro-label, compact, consistent with income "Typical" column) + "SHORT" (single word, prefixes negative leftover number).
- Did / found:
  * Ran `node tools/i18n/sync.js` → confirmed MISSING: 2, exact keys and no-other-translations.
  * Translated both strings to all 6 languages with length-sensitivity in mind (10px label constraint, short words for number prefix):
    - "YOU KEEP · TYPICAL": es "GUARDAS · TÍPICO" / da "DU BEHOLDER · TYPISK" / de "DU BEHÄLTST · TYPISCH" / sv "DU BEHÅLLER · TYPISK" / nb "DU BEHOLDER · TYPISK" / hu "MEGTARTASZ · TIPIKUS" (used adjective forms matching existing "Typical month" dict entries for consistency).
    - "SHORT": es "CORTO" / da "MANGLER" / de "KURZ" / sv "KORT" / nb "MANGLER" / hu "HIÁNY" (compact, direct verbs/nouns).
  * Claimed lock on TEAM-CHAT.md (a286f3d).
  * Wrote translations to JSON, used Python script to parse the 747KB minified AUTO-MERGED block, merge 2 keys × 6 langs = 12 translations, re-serialize, and write back to index.html. No file corruption; all 12 translations added cleanly.
  * Re-ran `node tools/i18n/sync.js` → **MISSING: 0 (561 keys, all 7 languages complete)**.
  * Ran `node tools/release/green.js` → **GREEN exit 0** (parser 21/21, assistant 16/16, streak 4/4, sound 7/7, reorder 7/7, transfer 27/27 = 92/92 total; preflight CLEAR; all published files leak-scan clean).
  * Committed index.html (7b4d5e4) with both verification steps in the message.
  * Released lock on TEAM-CHAT.md (ea6eb0c).
  * Posted status to TEAM-CHAT.md MESSAGES.
- Decision / result: **MISSING: 0** verified and committed. Both strings translated to all 6 locales, all 7 languages now complete. Ready for downstream gate (Akashi re-SAFE, Hugo re-GREEN if tip moved, then Osefe ship).
- Commits / SHAs: lock claim `a286f3d`, i18n merge `7b4d5e4`, lock release + team chat `ea6eb0c`.
- Still open / next: Gate is fully signed once @Kaito routes to @Akashi/@Hugo. Osefe's "ship it" call after all three sign-offs on the same tip.

## [2026-06-29 ~async] — Kaito dispatch (asleep) — SHORT translation wording bug fix
- Asked: The "SHORT" key (prefixes negative monthly leftover, e.g. "SHORT 2,500 kr" meaning user is 2,500 short) had the WRONG sense in 3 languages. es "CORTO" / de "KURZ" / sv "KORT" all mean "short in length/brief" (useless), but should mean "lacking/deficit" like da/nb "MANGLER" and hu "HIÁNY". Fix to the right sense using idiomatic "lacking" words in each language.
- Did / found:
  * Checked current state: es CORTO ✗ / da MANGLER ✓ / de KURZ ✗ / sv KORT ✗ / nb MANGLER ✓ / hu HIÁNY ✓.
  * Claimed lock on index.html (784c542).
  * Used Python to parse the 748KB minified AUTO-MERGED JSON block, updated 3 keys:
    - **es: CORTO → FALTA** (lacks / missing, financial sense, matches MANGLER's meaning)
    - **de: KURZ → FEHLT** (lacks / missing, direct parallel to da "MANGLER")
    - **sv: KORT → FATTAS** (lacks / missing, direct parallel to da "MANGLER")
  * Re-ran `node tools/i18n/sync.js` → **MISSING: 0 (561 keys)**.
  * Ran `node tools/release/green.js` → **GREEN exit 0** (all 6 suites 92/92, preflight CLEAR, leak-scan all files clean).
  * Committed index.html (733b506).
  * Released lock and posted status to TEAM-CHAT (ceb0099).
- Decision / result: **MISSING: 0** verified and **GREEN** verified. Wording bug fixed. da/nb/hu values and "YOU KEEP · TYPICAL" all unchanged (were correct). English source "SHORT" unchanged.
- Commits / SHAs: lock claim 784c542, i18n fix 733b506, lock release + team chat ceb0099.
- Still open / next: Ready for Kaito to route to Akashi re-SAFE + Hugo re-GREEN for sign-off, then Osefe ship call.

## [2026-06-29 ~async] — Kaito dispatch (asleep) — Translate 7 de-warmed streak/status strings to all 6 langs
- Asked: Kaito de-warmed 7 streak/status strings (removed 🔥/🎉/✨ emoji + "keep it going!" cheer per Osefe's serious product-voice directive). This changed their English keys, causing `node tools/i18n/sync.js` to report **MISSING: 7**. Translate the 7 new keys to es, da, de, sv, nb, hu → MISSING: 0.
- Did / found:
  * Ran `node tools/i18n/sync.js` → confirmed MISSING: 7 (exactly as Kaito described): "day streak", "Log anything today to keep your streak.", "{n} days in a row", "On track to keep {amt} this month", "Welcome back — log something today to start a streak.", "Reached", "What's new".
  * Claimed lock on index.html (fc9e599).
  * Translated all 7 strings to 6 languages (42 translations) with **serious, factual tone — no emoji, no exclamation hype** (matching Osefe's product voice):
    - "day streak" → racha de días / dag streak / Tage-Streak / dagars streak / dagers streak / napos sorozat
    - "Log anything today to keep your streak." → imperative forms in each language ("Registra"/"Log"/"Protokollieren"/"Logga"/"Logg"/"Naplózz")
    - "{n} days in a row" → preserved {n} placeholder, idiomatic day/row phrasing per language
    - "On track to keep {amt} this month" → preserved {amt} placeholder, savings verbs per language
    - "Welcome back — log something today to start a streak." → em-dash (—) preserved, factual tone
    - "Reached" → past participles (Alcanzado/Nået/Erreicht/Uppnått/Nådd/Elért)
    - "What's new" → curly apostrophe U+2019 preserved (critical: source uses U+2019, not U+0027)
  * Wrote Python script to parse the 748KB minified AUTO-MERGED JSON block, merge all 42 translations, re-serialize, and write back. First attempt failed due to "What's new" key using U+0027 in Python string literal, but should be U+2019 from source. Fixed by extracting the exact key from tools/i18n/need_translate.json.
  * Re-ran `node tools/i18n/sync.js` → **MISSING: 0 (561 keys fully translated across 7 languages)**.
  * Ran `node tools/release/green.js` → **GREEN exit 0** (parser 21/21, assistant 16/16, streak 4/4, sound 7/7, reorder 7/7, transfer 27/27 = 92/92 total; preflight CLEAR; all published files leak-clean).
  * Committed index.html (23de4da).
  * Released lock and posted status to TEAM-CHAT (8f051b3).
- Decision / result: **MISSING: 0** verified and committed. All 7 de-warmed strings translated to 6 locales in factual, serious tone (no emojis, no hype). Ready for downstream gate (Akashi re-SAFE, Hugo re-GREEN if tip moved, then Osefe ships).
- Commits / SHAs: lock claim fc9e599, i18n merge 23de4da, lock release + team chat 8f051b3.
- Still open / next: Gate awaits @Kaito to route to @Akashi/@Hugo for sign-off, then @Osefe's final "ship it" call.

## [2026-06-29] — Osefe (direct) — BUGFIX: Move-my-data card stuck in English
- Asked: Osefe reports the whole "Move my data" section (Bring my data, Copy my data, etc.) stays in English on language switch — not translated.
- Root cause (verified): the card's STATIC button/heading labels were built with raw English text, **no `data-i18n` attribute and no dictionary key**. The runtime has two translation paths: (a) `data-i18n`/prose/placeholder lookups in applyLang, and (b) a text-node walker that translates any text node by trimmed-text dict lookup. For these labels, neither had a matching dict key → walker left them English.
- WHY sync.js missed it: `tools/i18n/sync.js` extracts keys ONLY from `t()/tf()` calls, `data-i18n[-ph]` attrs, and `WHATS_NEW`. It does **NOT** scan raw text nodes. So static labels translated by the walker but absent from the dict are invisible to it → it printed MISSING:0 while they sat untranslated. My earlier "MISSING:0" was correct for the dynamic strings but blind to these static ones. **Lesson: MISSING:0 only proves the keys sync.js can see are covered — static text-node labels can still leak. The scratchpad `leakcheck.js` detects exactly this class.**
- Fix:
  * Wired 9 discrete controls with `data-i18n` (📦 Move my data, 📥/📤 step headings, 📋 Bring in my data, 📋 Copy my data, 2 summaries, "Moving a whole saved file", "Show my data code"). Now sync.js TRACKS them → regression-proof.
  * The 2 step-heading spans dropped inline `<b>` (data-i18n sets textContent) — matches app convention; flagged to Arthur.
  * Added 5 prose descriptions (prose-handler keys = normalized textContent) + textarea placeholder to dict.
  * 15 keys × 6 langs = 90 translations. Button labels kept consistent with the banner strings (banner "tap Traer mis datos" ↔ button reads "Traer mis datos").
- Verified: wrote a Node simulation of applyLang's 3 paths against the real markup + dict → all 15 runtime-translated strings resolve in all 6 langs (0 would stay English). sync.js MISSING:0 (570 keys). green.js GREEN exit 0, preflight CLEAR.
- Decision / result: Bug fixed at the source (wiring), not just patched. Lock claimed (9c7d36f) then released.
- Commits / SHAs: 9c7d36f (lock claim) → i18n wiring fix commit (this push).
- Still open / next: @Akashi re-SAFE (markup changed), @Hugo GREEN, then Osefe ships. Consider adding a text-node leak scan (leakcheck.js) into green.js so this class is caught by the gate, not by a user report.
