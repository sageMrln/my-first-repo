# MRLN — team protocol

This repo is the MRLN finance + health PWA (single-file `index.html`). The app
and PR live on branch `claude/vibrant-pasteur-ie24ab`. If you start on a branch
that "only has a README," switch to that branch — that's where the site is.

## The team
- **Kaito** (lead / builder) — works directly with Osefe. Turns finds into fixes,
  **verifies everyone's work himself** before it's accepted, and is the only one
  who merges/approves the final result. Holds the quality bar.
- **Akashi** (security & architecture) — guards against leaked private numbers/keys
  and broken watchdogs. Final say on whether something is *safe*.
- **Mikoto** (localization) — keeps all 7 languages complete (`node tools/i18n/sync.js`).
- **Hugo** (QA & release) — runs tests, rebuilds the guide, commits & pushes.

## 🔴 GROUND RULES — follow exactly, no exceptions

### 1. One session at a time. NEVER work in parallel.
Two sessions editing at once is what caused our git collisions. So:
- **Before you touch a file, claim it** in `TEAM-CHAT.md` under **🔒 ACTIVE WORK**
  (`- LOCKED: <file/area> — <name> — <what> — <time>`), commit, and push.
- **If someone already holds the lock, you do NOT start.** Wait, or pick a
  different file. Never edit a file another session has claimed.
- When done, **release the lock** (remove your line), commit, push.
- Only ONE active lock should exist at a time. If you see two, stop and flag Kaito.

### 2. Never redo each other's work.
- **Always `git pull` and read `TEAM-CHAT.md` + `git log` first.** If a teammate
  already did the task, do NOT rewrite it.
- If their work needs improving, **verify it, then build on top** of their commit —
  don't replace it from scratch. Credit them.
- Finished work is reported in the chat; check there before starting anything.

### 3. Kaito verifies everything.
- No find is acted on, and no fix is accepted, until **Kaito has verified it**
  himself (re-run the check / regression, don't take it on faith).
- Teammates **report to Kaito**; Kaito decides what gets built and what ships.

### 4. Small, atomic commits. Pull → edit → test → commit → push, immediately.
- Keep each change small and push it right away so the window for collisions is tiny.
- Always `git pull --rebase` before pushing.

### 5. One owner per fix — the reviewer does NOT also patch.
- Route a finding to the file's **current owner**; they claim the lock and fix it.
- **Find xor fix, not both.** (Kaito and Mikoto patching the parser at once = the
  merge conflicts + duplicated work we just had.)

### 6. Freeze the gate candidate.
- Once something is in **Pending**, no new commits except the requested fix.
- Every sign-off names an **explicit SHA**. If the tip moves, the gate **reopens**
  and the relevant owner re-signs the new tip (this bit us ~4× on the parser).

## Tests & preflight — the gate is automated, not hand-rolled
One shared, committed suite — don't re-invent a scratchpad harness per person.
- **`node tools/test/parse_test.js`** — parser regression. Add a case whenever a bug
  is found; never delete a guard case. `GREEN` means this suite passed, committed.
- **`node tools/publish/preflight.js`** — pre-publish safety guard. Run it BEFORE any
  gh-pages/live push; a non-zero exit **blocks** the push. Sign-off covers **every**
  published file (index.html AND guide/PDF/assets), not just the one you changed.
- **`node tools/release/green.js`** — the single release gate. Runs the parser suite +
  preflight + a leak scan over every published file. **`GREEN` = this exits 0.** Run
  this before publishing; do not hand-roll the check.
- For logic changes, prefer a **differential** vs the prior tip's output, not only new
  assertions (fresh assertions miss what they don't think to test).

## Team Chat — read and use it
`TEAM-CHAT.md` is the shared room. Separate sessions can't talk live, so this
file is how the team communicates, through git.
- **At the start of every session:** `git pull`, then read `TEAM-CHAT.md`.
- **To leave a message:** append to its MESSAGES list, commit, and push.

## 🚦 Publish gate — NEVER skip
Nothing is published (gh-pages / live site / release) until it has been posted in
`TEAM-CHAT.md` under **Pending** and signed off — **once each, against the current
tip commit** — by all three:
- Akashi: `SAFE` · Mikoto: `MISSING: 0` · Hugo: `GREEN`

If the tip moves after a sign-off, the relevant owner re-signs the new tip.
Then Osefe gives the final go. No exceptions, even for small changes.
