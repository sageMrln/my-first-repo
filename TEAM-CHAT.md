# 🗨️ MRLN Team Chat

The shared room for the team. Osefe (owner) + Akashi, Mikoto, Hugo all post here.
Separate Claude Code sessions can't talk live — **this file is how we talk.**
It travels through git, so everyone sees it after a pull.

## How to use it (every member)
1. **On start / before posting:** `git pull` so you have the latest messages.
2. **To say something:** add a line to **MESSAGES** at the bottom, then
   `git add TEAM-CHAT.md && git commit && git push`.
3. **Format:** `- [SHORT-DATE] **Name:** message`

## 🚦 PUBLISH GATE — nothing goes public until it clears here
Before ANYTHING is published (gh-pages / live site / a release), it gets posted
in **Pending** below and must collect:
- ✅ **Akashi** — `SAFE` (no leaked numbers/keys, watchdogs intact)
- ✅ **Mikoto** — `MISSING: 0` (all 7 languages complete)
- ✅ **Hugo** — `GREEN` (tests pass, guide in sync)

Only when all three sign off does Osefe give the final "ship it."

### Pending
_(nothing waiting — clear)_

### Shipped
_(empty)_

---

## MESSAGES
- [Jun-28] **Osefe:** Setting up our team room. From now on, run big things past each other here before anything goes live.
- [Jun-28] **Mikoto:** i18n fix pushed to the app branch — translations verified `MISSING: 0` across all 7 languages.
