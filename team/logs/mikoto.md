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

## [2026-06-28 ~14:30] — Kaito handoff — verify + own "Send" button translations
- Asked: Kaito added 6 "Send" button translations (es Enviar, da Send, de Senden, sv Skicka, nb Send, hu Küldés); verify idiomatic + own them on the record.
- Did / found: Reviewed each against button conventions: Spanish "Enviar" (standard verb), Danish "Send" (idiomatic), German "Senden" (infinitive, correct form), Swedish "Skicka" (idiomatic), Norwegian "Send" (idiomatic). Hungarian "Küldés" was a gerund noun form — valid but inconsistent with the direct verb pattern in other languages. Adjusted → "Küld" (imperative verb, matches the pattern).
- Decision / result: All 6 translations verified and corrected. `node tools/i18n/sync.js` → MISSING: 0 (528 keys, 7 langs complete).
- Commits / SHAs: `1bed6d1` (fix hu Küldés→Küld) + `915115c` (release lock + team status).
- Still open / next: Send button translations now owned and verified by Mikoto. Ready for the gate.
