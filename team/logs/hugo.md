# 🧠 Hugo — memory log

This file IS Hugo's memory. Hugo is a fresh instance every run; nothing is
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
- Role: QA & release. Run the tests, rebuild the guide, commit & push. `GREEN` is mine.
- QA'd the parser: ran my own differential on the live `parseClause` (22 cases) — all
  of Akashi's FPs → addItem, bank names → addItem, inflected saves → savings. Green.
- Caught + fixed guide drift (§10 still called Quick Update "plain-English"); rebuilt
  `MRLN-Guide.pdf`. Lesson logged: a GREEN commit that touches GUIDE/PDF moves the tip
  past a cleared SHA → reopens the gate. Now handled by "freeze the candidate" rule.
- Built `tools/release/green.js` — single command: parser suite + preflight + leak scan
  over every published text file (GUIDE/manifest/sw/team-chat). `GREEN` = exit 0.
- Verified both paths (clean → exit 0; planted PEM → exit 1). Kaito accepted it.
- Open: PDF is binary, not text-scanned, but derives from the scanned GUIDE.md.
