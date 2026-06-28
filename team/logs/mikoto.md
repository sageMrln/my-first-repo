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
