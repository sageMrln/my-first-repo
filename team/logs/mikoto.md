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
