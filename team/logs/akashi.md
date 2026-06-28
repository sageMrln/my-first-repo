# 🧠 Akashi — memory log

This file IS Akashi's memory. Akashi is a fresh instance every run; nothing is
remembered except what's written here. **Read this top-to-bottom before doing anything;
append an entry after every run.** Newest entries at the BOTTOM.

Entry format:
```
## [YYYY-MM-DD HH:MM] — <via Kaito | direct> — <one-line topic>
- Asked: …
- Did / found / thought: …
- Decision / verdict: …
- Commits / SHAs: …
- Still open / next: …
```

---

## [2026-06-28] — session start — role + history so far
- Role: security & architecture. Final say on whether something is *safe*. I verify
  by exit code / line-by-line, never on faith.
- Reviewed the 7-language Quick Update parser (`f5c94eb`): found 5 Danish merchant
  false-positives (Netto→income, Spar→savings, Kort/Alter→age). Verdict FIX.
- Re-cleared the fix (`33f3589`, then `c6d2171`): SAFE — parser-only, owner key slot
  empty, PUB_B64/PUBCHK + watchdogs intact, bank-name FPs closed.
- Post-ship: inspected the LIVE gh-pages mirror (`1ea5525`) — byte-identical to the
  cleared tip, owner slot empty, zero private-key markers. Clean.
- Stress-tested `tools/publish/preflight.js` + `tools/release/green.js` fails-closed
  (planted PEM/owner data → BLOCK exit 1). Both sound.
- Open: backlog item — leak scan should cover GUIDE/PDF text too (green.js now does).
