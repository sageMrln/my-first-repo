# Translation pipeline — keeping every language complete

MRLN ships in 7 languages (English source + **es, da, de, sv, nb, hu**). The whole
UI must stay translated, and switching language must never leave remnants of the
previous one. Two mechanisms keep that true:

## 1. Runtime (in `index.html`) — automatic, no maintenance

- **`t()`** is the single translation gate. Any string passed through it is shown in
  the active language (or English as a graceful fallback).
- **`applyLang()`** translates all static markup, then runs a **remnant sweep**: a
  reverse index (every known translation → its English source) lets it move *any*
  text still showing a previous language to the new one — even dynamically rendered
  content. It **never** touches `[data-i18n-skip]` containers (notes, item names,
  calendar, food log, change log, reminders), so user-typed text is left exactly as
  written.
- **Switching language re-renders every panel**, so `t()`-driven content regenerates
  in the new language.

Result: as long as a string is (a) wrapped in `t()` or static markup and (b) present
in the dictionary, it translates and leaves no remnant.

## 2. Build-time — run after ANY text change

When you add or change UI copy, the dictionary can drift. Detect it:

```sh
node tools/i18n/sync.js
```

This scans `index.html` for every `t()` literal and every `WHATS_NEW` item, compares
them against the live dictionary, and writes any untranslated strings to
`tools/i18n/need_translate.json` (exit code 1 if anything is missing, 0 if complete).

To fill the gap, translate `need_translate.json` into all six languages — one pass
per language — producing an object of the shape:

```json
{ "es": { "<english>": "<translation>", … }, "da": {…}, "de": {…},
  "sv": {…}, "nb": {…}, "hu": {…} }
```

…then merge it into the `>>> AUTO-MERGED FULL UI TRANSLATIONS <<<` block in
`index.html` (only adding keys that aren't already there). Re-run `sync.js` until it
prints **`MISSING: 0`**, then ship.

### Rules for translators
- Keep keys **byte-for-byte exact** — including emoji, inline `<b>…</b>` tags (kept in
  the same positions), curly quotes, em-dashes, arrows.
- Don't translate brand/proper nouns (MRLN, Klarna, Safari, Chrome…), currency codes,
  or placeholders.
- Friendly, concise, informal second-person tone.

> The translation step is done by the assistant's language agents during development;
> `sync.js` is the gate that guarantees nothing ships untranslated.
