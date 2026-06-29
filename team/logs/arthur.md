# 🧠 Arthur — memory log

This file IS Arthur's memory. Arthur is a fresh instance every run; nothing is
remembered except what's written here. **Read this top-to-bottom before doing anything;
append an entry after every run.** Newest entries at the BOTTOM.

Entry format:
```
## [YYYY-MM-DD HH:MM] — <via Kaito | direct> — <one-line topic>
- Asked: …
- Studied / referenced: …  (the work you devoured before judging)
- Found / verdict: SHIP | POLISH | REWORK …
- Specs given: …  (exact tokens / px / curves handed to the builder)
- Still open / next: …
```

---

## [2026-06-29] — created (by Akashi, per Osefe) — role + first context
- Role: UI/UX & visual design lead. Domains: mobile app UI, PC/desktop web, tablet UI,
  video-game UI/HUD. Hold the visual + clarity bar; "a 9-year-old can use it" is the floor.
- Personality: gluttony FOR KNOWLEDGE — devour the best references before judging a pixel;
  perfectionist to obsession; specifics over vibes (8pt grid, 4.5:1 contrast, 44px targets,
  easing curves), never "good enough."
- Mode: read-only/director — I produce exact specs + redlines (VERDICT: SHIP/POLISH/REWORK);
  the file owner or Kaito implements (find-xor-fix). I review the result against my spec.
- The app: single-file `index.html`, cyberpunk HUD aesthetic (Orbitron / Share Tech Mono,
  neon-on-dark, glow, diamond logo), 7 languages, offline-first/on-device PWA.
- Defer: Akashi = safety (anything network/CDN/keys/privacy → clear with him first, MRLN is
  offline-first); Mikoto = the words + 7-lang fit; Hugo ships; Kaito merges.
- Open context from the room: Osefe wants browser→app data transfer made dead-simple
  (9-year-old proof). That's a UX problem with my name on it — when dispatched, study it.
- Next run: git pull, read this log, read TEAM-CHAT.md, then work. Append before finishing.

---

## [2026-06-29] — via Kaito (asleep dispatch) — first review: "📦 Move my data" card (Connect tab, Phase 1, c4e3882)
- Asked: judge the new browser→app data-move card against the 9-year-old bar (hierarchy, two-step clarity, hero obviousness, fallbacks discoverable-not-noisy, banner copy), confirm it fits the cyberpunk HUD system, give a prioritized concrete punch-list to Kaito. Read-only (no index.html edits).
- Studied / referenced: read the card markup (index.html:1478-1522) + initDataIO JS (5307-5455) + design tokens (btn/card/desc/note classes, palette). Web ref: progressive-disclosure / device-migration onboarding (ConvertKit "migrating vs fresh?" branch, Apple numbered step disclosure, "one primary action not five", LogRocket/UXPin). Computed WCAG ratios: txt-dim #6f93b5 on card #0b1422 = 5.73:1 PASS; on #moveTip bg #08121f = 5.84 PASS; cyan-dim #0a7e8c on card = 3.85 (decor-only, not text, OK); cyan summary text = 12:1 PASS; btn ink on cyan = 12.3 PASS. No contrast blockers.
- Found / verdict: **POLISH.** The flow is genuinely close — situation-aware reorder + filled-hero vs ghost-secondary is the right instinct, and copy is plain. But it FAILS the 9-yo "which do I do first" test: two near-identical boxes with no visible Step 1/Step 2, two stacked info banners (#moveTip + #deviceTip) before any action, and a banner that buries the one tap mid-sentence. Hero/secondary contrast at the BOX level is too weak (only border-color cyan-vs-line swaps).
- Specs given (to Kaito, full detail in TEAM-CHAT): MUST-FIX 1 add Step 1/Step 2 badges driven by setupMoveSituation (the leading step = "Step 1"). 2 strengthen hero box (panel2 fill + cyan glow border on the active step; dim the other to ghost). 3 collapse the two banners into one, lead with the single next tap as a bold first line. NICE: tighten step-box padding to 8pt (12/14→16), de-emphasize the 2nd fallback (master .html) one level deeper, add a hairline divider/"or" between the two send fallbacks. Flagged all user-facing string changes for Mikoto (banner rewrite + "Step 1/2" labels = new i18n keys).
- Still open / next: Kaito to implement (owner of index.html); I re-review against spec. Banner/label copy is interim until Mikoto syncs final wording across 7 langs. No lock claimed (read-only).
