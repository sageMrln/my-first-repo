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

## [2026-06-28] — via Kaito — Assistant MRLN Q&A engine (`0d03dbb`)
- Asked: security-review the new Assistant MRLN feature (rename Quick Update→Assistant
  MRLN + offline Q&A engine: MRLN_HELP keyword table, mrlnAnswer() static t() strings,
  answerQuestion() router → answer or null).
- Did / found:
  - Read full diff (1.4MB — almost all i18n KB strings + renames; real code is ~90 lines).
  - Engine at index.html: MRLN_HELP @4005, mrlnAnswer @4026 (static t() only, no ops),
    _Q_WORDS @4050, answerQuestion @4051, handler @4074-4096, showAnswer @4098.
  - Router wiring (4080-4082): answerQuestion returns an answer ONLY when isQ (has '?' or
    starts with a Q-word); else null → parseInstructions, UNCHANGED command path. Verified
    by my own 20-case differential (not on faith): all edit commands (income is now 2600 /
    add Netflix 99 / save 2000/mo / loan 4500 / min alder er 41 / jeg sparer 250) → null →
    parser; all questions answered. No command misrouted; questions don't hijack commands.
    Only oddity: unnatural "is income 2600" routes to answer — not a real command form;
    natural "income is 2600"/"my income is 30000" reach parser. Not a regression.
  - showAnswer uses body.textContent (NOT innerHTML) @4100 → no DOM injection. Answer text
    is static t() anyway. Answer path applies NOTHING (clears aiProposal); only Apply→
    applyChange mutates, and that path is untouched.
  - Diff touches NO sensitive API: no __sys / exportHTML / importData / PUBCHK / PUB_B64 /
    applyChange / parseClause / parseInstructions edits; no eval/fetch/XHR/innerHTML added.
    No sw.js / manifest change.
  - Invariants: #__ownerKeySrc empty, #hud-state empty, PUB_B64 + PUBCHK(4047293148) +
    __sys.trip watchdogs intact, no private-key markers. KB example figures (18000/4500/
    2000/199/99) are illustrative, not owner data; preflight PII/key scan clean.
  - Ran node tools/release/green.js → GREEN exit 0 (parser 21/21, preflight CLEAR, all
    published files clean). assistant_test.js 16/16.
- Verdict: SAFE.
- Commits / SHAs reviewed: 0d03dbb (tip at review: c057f50 — only TEAM-CHAT/lock since,
  index.html unchanged from my reviewed state).
- Still open: nothing security-side. Mikoto owns the 21 MISSING KB translations; Hugo's
  GREEN + guide §. Gate not opened yet. If tip moves index.html, I re-sign.
