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

## [2026-06-28] — direct (Osefe) — release retro + gate tooling verification
- Asked: suggest process improvements, ship them to the team, keep running `status` sweeps.
- Did / found:
  - Proposed 5 process changes (shared harness, pre-publish guard, freeze-the-tip,
    sign-offs state HOW verified, artifact = every published file). Team adopted all;
    Hugo + Mikoto added lock-lifecycle, one-session-per-role, BACKLOG, differential rule.
  - Verified `tools/publish/preflight.js` fails-closed by exit code: clean→0; key in
    #__ownerKeySrc / PEM in comment / PUBCHK altered / data in #hud-state → BLOCK exit 1.
  - Verified `tools/release/green.js` both paths: clean→GREEN exit 0; planted PEM in
    GUIDE.md → RED exit 1 (multi-file scan catches non-index.html leak). Closes my #5.
  - Caught + cleared a stale-tip wrinkle pre-ship: gate stamped on c6d2171 while HEAD
    drifted to include GUIDE.md/PDF rebuild; verified live mirror clean, re-signed tip.
- Decision / verdict: process now tight where it bent; gate tooling sound. No security gap.
- Commits / SHAs: my chat/log commits only (no app-code changes this session).
- Still open: backlog has the low-sev Spar/Lønstrup + "add salary" parser residuals.

## [2026-06-28] — direct (Osefe, "do extra if useful") — holistic pass on tip 56af3f9
- Did: whole-surface security pass after the day's multiple ships (Assistant MRLN, Send).
  green.js GREEN; invariants intact (owner/hud slots empty, watchdogs, exportBlank strip).
- Team Room viewer (only fetch in app, index.html ~6818-6858): fetch is OWNER-GATED — early
  return at :6824 unless #__ownerKeySrc non-empty OR mrln_team flag → customer files never
  fetch (offline guarantee holds). Render escaped (esc+fmt) → no XSS from chat file.
- Verdict: SAFE / clean. 3 non-blocking backlog notes: no CSP (recommend connect-src lock),
  hardcoded working-branch raw URL (:6826), #team flag enableable on any device (:6822).
- Still open: those 3 are hardening, owner-only impact; not gating anything.

## [2026-06-28] — via Kaito — DRAFT: CSP hardening + STATE-header format (propose only)
- Asked: Kaito routed two backlog/owned items to me. DRAFT only, no edits to index.html, no ship.
  (1) propose exact CSP meta tag; (2) refine the pinned STATE block format. Kaito reviews → Osefe.
- Did / found (read the app, did NOT guess):
  - <head> @1-14: manifest link, apple-touch/icon PNGs, theme-color. Style block @15 opens with a
    Google Fonts @import (fonts.googleapis.com) → that pulls font FILES from fonts.gstatic.com.
  - Inline-everything confirmed: 4 <script> blocks + 1 <style>, AND 14 inline on*= handlers
    (onclick setScen/klSetScen @929-931/1127-1129, plus img onerror etc). => script-src MUST keep
    'unsafe-inline' and MUST NOT use a nonce/hash (a nonce silently disables 'unsafe-inline' →
    breaks every inline handler + script block). This is the load-bearing constraint.
  - Food photos: stored + rendered as data: URIs in <img src> (@5827 list thumb, @5839 viewer,
    readAsDataURL @5763). => img-src needs data:. Icons are same-origin PNGs ('self').
  - Exports (@4139/4193/5084/5599) build a Blob + <a download> (not rendered) → blob: in img-src
    is belt-and-suspenders, harmless. Manifest is REWRITTEN to a blob: URL at runtime @6754 (bakes
    File ID into start_url) => manifest-src MUST allow blob: or installed-app manifest breaks.
  - Service worker: register('sw.js') @6741 same-origin → worker-src 'self' (script-src fallback
    also covers it). showNotification @6635 needs no CSP directive.
  - The ONE outbound fetch: Team Room tick() @6850 → RAW @6826 = raw.githubusercontent.com (owner-
    gated). => connect-src 'self' https://raw.githubusercontent.com. THIS is the real win (bounds
    exfil); the inline 'unsafe-inline' is the honest partial.
  - No eval / new Function / string-timer found.
- Proposal: see TEAM-CHAT post (full meta tag + per-directive rationale + breakage-to-test list).
  Honest limit logged: 'unsafe-inline' on script-src means CSP does NOT stop injected-inline JS;
  it's defense-in-depth on egress (connect-src) + object/base lockdown, not XSS-proof. Stated so.
- Verdict: DRAFT proposed, not shipped. No code changed by me. Not gating anything.
- Commits / SHAs: this log + TEAM-CHAT post only (no index.html touch).
- Still open: Kaito to implement+test (esp. fonts loading, food photos, install/manifest, Team Room
  fetch still works, no console CSP violations), then take to Osefe. Backlog CSP item stays open
  until landed. Hardcoded-branch RAW URL + #team-flag reachability still open, separate items.
