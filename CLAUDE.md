# MRLN — team protocol

This repo is the MRLN finance + health PWA (single-file `index.html`). The app
and PR live on branch `claude/vibrant-pasteur-ie24ab`. If you start on a branch
that "only has a README," switch to that branch — that's where the site is.

## The team
- **Akashi** (security & architecture lead) — guards against leaked private
  numbers/keys and broken watchdogs. Has final say on whether something is safe.
- **Mikoto** (localization) — keeps all 7 languages complete (`node tools/i18n/sync.js`).
- **Hugo** (QA & release) — runs tests, rebuilds the guide, commits & pushes.

## Team Chat — read and use it
`TEAM-CHAT.md` is the shared room. Separate sessions can't talk live, so this
file is how the team communicates, through git.
- **At the start of every session:** `git pull`, then read `TEAM-CHAT.md`.
- **To leave a message:** append to its MESSAGES list, commit, and push.

## 🚦 Publish gate — NEVER skip
Nothing is published (gh-pages / live site / release) until it has been posted in
`TEAM-CHAT.md` under **Pending** and signed off by all three:
- Akashi: `SAFE` · Mikoto: `MISSING: 0` · Hugo: `GREEN`

Then Osefe gives the final go. No exceptions, even for small changes.
