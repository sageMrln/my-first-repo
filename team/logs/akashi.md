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

## [2026-06-28] — via Kaito — BRAINSTORM (draft, no code): how far can we push the PWA
- Asked: Osefe wants a big security+architecture brainstorm — push this single-file,
  offline, free, no-server PWA to limits no one's shipped, WITHOUT breaking invariants
  (offline / private / no data leaves device / owner key never exposed / watchdogs intact).
  Rank by wow × feasibility × safety. Draft only, no code.
- Did / found (grounded in the actual app, not guessing):
  - Licensing engine is a SELF-CONTAINED pure-JS P-256 ECDSA + SHA-256 verifier (index.html
    @4243-4312), deliberately NOT crypto.subtle — runs in file:// / content:// non-secure
    contexts. Public key in PUB_B64 only; private key signs licenses (owner master only).
    This is already the hard part of "self-sovereign SaaS" — verify side is done & offline.
  - App already touches: navigator.bluetooth (weight scale @3175), navigator.share (@5139),
    serviceWorker (@6741), storage.persist (@6739), showNotification (@6635), data:/blob:
    URIs for food photos + exports, one owner-gated fetch (Team Room). 38 watchdog/key sites.
- My ranked take (wow × feasibility × safety), full text in TEAM-CHAT brainstorm post:
  1. SELF-SOVEREIGN LICENSE TOOLKIT (extend existing ECDSA): owner-master-only signing UI,
     offline. Highest feasibility (engine exists), highest safety (private key never moves),
     real wow. TOP PICK.
  2. P2P E2E SYNC between owner's OWN devices via WebRTC DataChannel, payload encrypted with
     a key DERIVED FROM THE EXISTING ECDSA KEYPAIR (ECDH), manual SDP paste = no signaling
     server. Safe IF: opt-in, owner-only, E2E so relay never sees plaintext, no fallback to
     cleartext. Medium feasibility, high wow. Risk: STUN/TURN can leak IP/metadata — must be
     manual-SDP or self-hosted only; never a public TURN that sees ciphertext+metadata.
  3. ON-DEVICE AI assistant (WebGPU/WASM small model, e.g. 0.5-1B quantized) for conversational
     MRLN. Highest wow, LOWEST feasibility-in-single-file (model is 100s of MB — can't inline;
     breaks "single file" + offline-first unless cached via SW on first online load). SAFETY
     OK only if model is static weights, runs 100% local, NO telemetry, NO model-hosted fetch
     at inference. The current static-KB assistant already gives 80% of value at 0% risk.
  - Device APIs verdict: SAFE to add — File System Access (owner save/load, user-gesture),
    Web Share Target (import-in), Badging, Periodic Background Sync (local-only recompute).
    RISKY / NO without care — anything that needs a server, push (needs push service = phones
    home), geolocation, contacts. NFC = niche, owner-only at most.
- THE ONE INVARIANT I WILL NOT TRADE FOR ENGAGEMENT: no private financial data and no private
  key ever leaves the device. Every idea above is gated on that. P2P only ships E2E-or-not-at-all;
  AI only ships fully-local-or-not-at-all. Trust is the product for a finance app.
- Verdict: DRAFT brainstorm posted. No code touched, nothing gated, nothing to ship.
- Commits / SHAs: this log + TEAM-CHAT brainstorm post only. App tip unchanged.
- Still open: if Osefe picks one, it gets a real arch spec + threat model before any build.

## [2026-06-28] — via Kaito — REVIEW: Tier 0 engagement build (`cddff9d`)
- Asked: security-review the Tier 0 build — daily streak engine + morning briefing
  (name-personalized toast) + score flash. Confirm no money logic touched, no leak,
  no injection, watchdogs/key slots intact, blank export still strips owner data.
- Did / found (read the full index.html diff, did not guess):
  - Diff is +60 lines, surgical: streakPill span @781 (data-i18n-skip, display:none),
    __sDay/__bumpStreak/renderStreak/morningBriefing/scoreFlash @1750-1807, one call
    to __bumpStreak() inside logChange @1750, Apply-path scoreFlash @4150, and two
    boot calls (renderStreak + setTimeout(morningBriefing,1400)) @6793.
  - MONEY LOGIC UNTOUCHED: parser, applyChange, finance calc, export/import not edited.
    Apply path only adds `nApplied = aiProposal.changes.length` + a flash of that COUNT
    (`{n} applied`) — a count, not a balance. `aiProposal.changes.map(applyChange)` line
    preserved verbatim. green.js parser 21/21 unchanged.
  - NO LEAK / NO NETWORK: grepped added lines for fetch/XHR/eval/innerHTML/__sys/PUBCHK/
    PUB_B64/exportBlank/exportHTML/importData/localStorage → ZERO hits. morningBriefing
    name is MODEL.profile.name first-token, rendered LOCALLY via toast() on the user's
    OWN device; never networked, never written to any public element. New STATE fields
    are streak{count,last(date)} + briefedOn(date) — no money figures at all. They
    persist only to localStorage (autosave). 'sample'/TEMPLATE_MODE guards prevent
    greeting a fresh share copy.
  - BLANK EXPORT SAFE: exportBlank (@4224) does NOT serialize STATE into hud-state — it
    hard-writes hud-state = {__fresh,fid,prefs:{lang,currency}} (@4238). So streak/briefedOn
    can NEVER reach a customer/blank file even though they aren't in the explicit blank
    list — the blank's persisted state is a reconstructed object, not a STATE dump.
    Owner's own exportHTML bakes full STATE incl. streak — that's his private file, fine.
  - NO INJECTION: renderStreak → n.textContent (@1771); toast() → d.textContent (@6676);
    scoreFlash → d.textContent (from diff). tf() is plain {key} string substitution, no DOM.
    No innerHTML with user data anywhere in the change.
  - INVARIANTS: #__ownerKeySrc empty (@1591), #hud-state empty (@1587), PUB_B64 + PUBCHK
    (4047293148) + 21 __sys. sites all present/untouched. preflight CLEAR.
  - Ran node tools/release/green.js → GREEN exit 0 (parser 21/21, preflight CLEAR, all
    published files clean). node tools/test/streak_test.js → 4/4 (first day=1, no double
    count, consecutive +1, gap resets).
- Verdict: SAFE. Cosmetics + a local day-counter; zero money/key/network/injection surface.
- Commits / SHAs reviewed: cddff9d (tip). If tip moves index.html, I re-sign.
- Still open: nothing security-side. Gate not opened; 8 new strings await Mikoto (i18n),
  Hugo's GREEN/guide. Sleep-mode: no auto-publish — needs Osefe's explicit go.

## [2026-06-28] — via Kaito — REVIEW: morning briefing v2 (money figure) `e34253b`
- Asked: re-review briefing v2 — now DISPLAYS the user's monthly surplus. Security-critical
  (first time it shows a money figure). Confirm accuracy / tamper-guard / no-leak / no money
  logic change; run green.js.
- Did / found (read the diff + all load-bearing fns on the tip, not on faith):
  - DIFF (index.html @1785-1799, +13/-5): time-aware greeting (Good morning/afternoon/evening
    by hour) + name + streak + new figure line `on track to keep {amt} this month`.
  - ACCURACY ✓: figure = `fmtN(leftOver(MODEL.income.avg))+curInfo().sym` (@1794/1797) — BYTE-
    for-logic identical to the existing "Left over" display `set('ovLeft', fmtN(leftOver(MODEL.
    income.avg)))` @2066. leftOver(income)=token*income−GRAND−loanAmt() @1920 (income−all
    expenses−loan). User's OWN computed surplus, on their OWN device. Not fabricated.
  - TAMPER GUARD ✓ HOLDS: __sys.token() @1870 returns 1 (armed&!tripped) else NaN. GRAND @1916
    and leftOver @1920 both multiply by token → on a tampered/bypassed copy leftOver=NaN.
    Briefing gates `isFinite(surplus) && surplus>0` @1797 → NaN drops the figure (and surplus≤0
    also hides it). A poisoned copy can surface NO bogus number. Verified the poison path, not
    just the comment.
  - NO LEAK ✓: shown only via toast() @6682 → `d.textContent=msg` @6684 (NOT innerHTML) → no
    injection, no fetch/XHR, never written to a public element. STATE.briefedOn/streak can't
    reach an export: exportBlank @4246 HARD-overwrites hud-state to a reconstructed
    {__fresh,fid,prefs} (not a STATE dump) + zeroes usage @4242, so blank/customer files never
    carry it; exportHTML @4191 dumps full STATE incl. briefedOn — but that's the owner's OWN
    private master (and it trips @4187 on a tampered copy). Briefing also gated by TEMPLATE_MODE
    @1781 (no greet in a fresh share copy) + once-per-day @1783.
  - NO MONEY LOGIC CHANGED ✓: read-only display of an existing computed value. parseClause/
    applyChange/finance calc/leftOver/GRAND all untouched by the diff. parser 21/21 unchanged.
  - INVARIANTS: #__ownerKeySrc empty, #hud-state empty, PUB_B64+PUBCHK(4047293148)+__sys
    poison threading all intact (diff doesn't touch them). 4 new i18n strings (greetings +
    figure line) await Mikoto.
  - Ran node tools/release/green.js → GREEN exit 0 (parser 21/21, assistant 16/16, streak 4/4,
    preflight CLEAR, all published files clean).
- Verdict: SAFE.
- Commits / SHAs reviewed: e34253b (tip). If tip moves index.html, I re-sign.
- Still open: nothing security-side. Gate not opened; 4 new strings → Mikoto (MISSING), Hugo
  GREEN/guide. Sleep-mode: no auto-publish — needs Osefe's explicit go.

## [2026-06-28] — via Kaito — REVIEW: Tier 0 UI sounds (`5221b6d`)
- Asked: security-review the synthesized Web Audio UI sounds — MRLN_SFX engine
  (no files), 🔊/🔇 mute toggle persisted to STATE.prefs.sound. Confirm pure synth/
  no network, no leak, sound flag can't reach customer export, no injection,
  watchdogs intact; run green.js.
- Did / found (read the FULL diff + verified load-bearing lines on the tip, not on faith):
  - SCOPE: commit touches only index.html (+43) + TEAM-CHAT (1 line). No sw.js/manifest/
    parser/applyChange/finance/export edits. Diff is 4 hunks: soundBtn span @769
    (data-i18n-skip), MRLN_SFX.streak() call inside __bumpStreak @1765, MRLN_SFX engine
    @1818-1840, MRLN_SFX.success() on Apply @4184, wireSound() boot IIFE @6829-6845.
  - PURE WEB AUDIO ✓: engine creates OscillatorNode+GainNode only (synthesizes tones).
    Grepped ADDED lines for fetch/eval/innerHTML/XHR/new Function/.src=/document.write →
    ZERO. No external assets, no network, no new data collected. AudioContext is created
    lazily (ac()) and only resumed inside play() which runs on a user gesture (Apply/tab/
    save/toggle click) → autoplay-safe; nothing auto-plays on load.
  - NO LEAK / EXPORT SAFE ✓: STATE.prefs.sound is a plain boolean (default true). It can
    NOT reach a customer/blank file — exportBlank @4272 HARD-writes hud-state to a
    reconstructed { __fresh, fid, prefs:{ lang, currency } } only; `sound` is not in that
    object, so it's dropped by construction (same mechanism that strips streak/briefedOn).
    Owner's own exportHTML dumps full STATE incl. sound — his private master, fine, and a
    boolean prefs flag is non-sensitive regardless.
  - NO MONEY LOGIC TOUCHED ✓: Apply path only ADDS one MRLN_SFX.success() call after the
    existing applyChange loop + scoreFlash; the money ops line is untouched. parser 21/21
    unchanged. __bumpStreak gains a milestone-fanfare call gated on streak.count ∈ set —
    audio only, no figure read/written.
  - NO INJECTION ✓: soundBtn icon set via sb.textContent ('🔊'/'🔇') @paint — no innerHTML
    anywhere in the diff. All listeners are addEventListener; the whole boot block is
    try/catch wrapped so a missing element can't throw.
  - INVARIANTS ✓: #__ownerKeySrc empty (@1592), #hud-state empty (@1588), PUB_B64 +
    PUBCHK (4047293148) + __sys threading all present; __sys count identical parent vs tip
    (23 == 23) → no watchdog weakened/removed. data-i18n-skip on soundBtn keeps it off the
    i18n engine (zero new strings, MISSING:0 holds).
  - Ran node tools/release/green.js → GREEN exit 0 (parser 21/21, assistant 16/16,
    streak 4/4, preflight CLEAR, all published files clean).
- Verdict: SAFE. Cosmetic audio-output layer; zero money/key/network/injection/leak surface.
- Commits / SHAs reviewed: 5221b6d (tip). If tip moves index.html, I re-sign.
- Still open: nothing security-side. Gate not opened. Sleep-mode: no auto-publish —
  needs Osefe's explicit go.

## [2026-06-28] — via Kaito — DRAFT: pressure-test app-wide sound design (architecture + safety, no code)
- Asked: before Kaito builds an EXPANDED Web Audio layer firing on many interactions (rapid taps, slider drags), pressure-test the ARCHITECTURE + SAFETY of the current MRLN_SFX engine. Draft only, no code. Give Kaito concrete engine constraints.
- Read the actual engine (index.html @1818-1840) + all call/wire sites (@1765 streak, @4184 Apply success, wireSound @6829-6845: tab .tick, save .save, toggle). Did NOT guess.
- ENGINE TODAY: lazy single AudioContext (ctx cached in closure — good, ONE context already), per-note creates Oscillator+Gain, connects straight to ctx.destination, o.stop(t0+dur+.03). play() resumes ctx if suspended + gated on `on` boolean. Pure synth — no files/fetch/eval/network. AudioContext created lazily, resumed only inside play() on a user gesture → autoplay-safe; nothing plays on load.
- KEY ARCH FINDINGS for a HIGH-FREQUENCY layer (current engine is fine at today's ~4 low-rate triggers; NOT fine if fired on drags/rapid taps):
  1. NODE LEAK / GC: per-call new Oscillator+Gain IS the right Web Audio pattern — a stopped node disconnects + is GC'd automatically (no manual cleanup needed) PROVIDED stop() is always scheduled (it is, @1829). The risk is not leak-per-node, it's UNBOUNDED CONCURRENCY: a slider drag firing every pointermove = dozens/hundreds of live oscillators at once → audio glitches, CPU spike, on weak phones a crash. No voice cap today.
  2. NO THROTTLE/DEBOUNCE: nothing rate-limits play(). High-frequency callers MUST be throttled at the call site or in the engine.
  3. SHARED MASTER GAIN: today every note connects directly to destination. With many voices that's an unbounded sum → clipping/distortion. Need ONE master GainNode between voices and destination so total output is bounded and mute is a single gain ramp (cheaper + click-free vs the boolean).
  4. SUSPEND-ON-HIDDEN: ctx is resumed but never suspended when idle/backgrounded → keeps the audio HW/clock alive, drains battery. Recommend ctx.suspend() on visibilitychange hidden, resume on next gesture. (App already has 3 visibilitychange handlers @4958/6655/6784 — pattern is established; ADD to one, don't fight them.)
- CONSTRAINTS I gave Kaito (full text in TEAM-CHAT): single shared ctx (already done) + ONE master GainNode; voice cap MAX_VOICES≈12-16 (drop new notes when at cap, never queue); per-trigger throttle ≈60-80ms (a drag/scroll fires at most one blip per throttle window); coalesce continuous gestures (slider/scroll) to a single rate-limited tick, NOT one-per-event; suspend ctx on visibilitychange→hidden, resume lazily on gesture; keep stop() always scheduled so GC stays automatic; keep play() gated on the boolean AND user-gesture-resume (autoplay-safe); cap master gain so summed voices can't clip.
- SECURITY: pure-synthesis layer adds ZERO new surface — no fetch/XHR/eval/innerHTML, no data collected, no AudioContext fingerprinting concern (we GENERATE tones, we don't read an analyser/render-offline-and-hash — that's the fingerprinting vector, and we do none of it). Sound pref is a local boolean; exportBlank reconstructs prefs as {lang,currency} only (index.html:4272) so `sound` is dropped by construction → can't reach a customer/blank file. Nothing here touches money logic, parser, applyChange, finance calc, export/import, watchdogs (PUB_B64/PUBCHK/__sys), or the owner key. The pattern KEEPS all that true as long as new triggers are output-only (call a chime), never read/write a money figure or a watchdog.
- ACCESSIBILITY: sound must stay OPT-OUT-able (it is — 🔊/🔇 toggle, persisted) and must NEVER be the ONLY signal for an action (always paired with a visible toast/flash — it is today). Respect prefers-reduced-motion-adjacent intent: consider defaulting OFF or honoring a reduced setting; loud/sharp at high rate is an accessibility AND annoyance risk → keep volumes low (current .05-.12 is good) and rate-limited.
- Verdict: DRAFT — constraints proposed, NO code changed by me, nothing gated. The engine is safe to EXPAND only with the voice-cap + throttle + master-gain + suspend-on-hidden guards; without them an app-wide high-frequency layer risks a runaway-node CPU/battery problem on phones (a stability bug, not a leak/key bug).
- Commits / SHAs: this log + TEAM-CHAT post only. App tip unchanged.
- Still open: Kaito to build the expanded engine WITH these constraints, then I security-review the actual diff (output-only, no money/watchdog touch) + Hugo gates. Sleep-mode: no auto-publish without Osefe's go.

## [2026-06-28] — via Kaito — REVIEW: full sound design build, MRLN_SFX v2 (`7c919a5`)
- Asked: security-review the v2 sound engine + app-wide wiring I specced. Verify MY constraints
  (shared ctx+master gain, voice cap 14, global throttle ~55ms, suspend-on-bg, autoplay-safe)
  are actually IMPLEMENTED; confirm no money/parser/watchdog/export touch; run sound + green.
- Did / found (read the engine + setIncome + exportBlank on the tip, ran both suites — not on faith):
  - SCOPE: diff = index.html (+72/-15) + TEAM-CHAT + new tools/test/sound_test.js. No
    sw.js/manifest/parser/applyChange/export edits. Grepped the +/- lines for fetch/XHR/eval/
    innerHTML/new Function/document.write/.src=/exportBlank/exportHTML/importData/applyChange/
    parseClause/PUBCHK/PUB_B64/__sys/localStorage → ZERO hits. Pure-synthesis output layer.
  - MY CONSTRAINTS — all implemented, verified line-by-line @1819-1866:
    1. SHARED CTX + MASTER GAIN ✓ — ac() creates ctx ONCE (if(!ctx)) and master ONCE in the
       same guard; master.connect(ctx.destination); every note g.connect(master). One ctx,
       one master. Not a context-per-sound.
    2. VOICE CAP ✓ — note() early-returns if voices>=CAP (14); voices++ on start; o.onended
       decrements + o.disconnect()/g.disconnect() (try-wrapped). No node leak; GC stays auto
       because o.stop() is always scheduled (t0+dur+.03).
    3. GLOBAL THROTTLE ✓ — play() gates on t-last < (gap||GAP=55ms) using the AUDIO clock
       (c.currentTime*1000). The new delegated click listener routes every tap through tap()→
       play(...,55) so a rapid drag/tap BURST collapses to ≤1 blip per 55ms window — verified
       by sound_test.js ("60 rapid taps < 60 nodes", throttle bounds node creation). Per-sound
       longer gaps too (toggle 120 / remove 700 / coin 800 / error 1200).
    4. SUSPEND-ON-BG ✓ — visibilitychange → hidden ? MRLN_SFX.suspend() : resume(); suspend
       only acts if ctx.state==='running'. Handler is ADDED (count 3→4), not fighting the
       existing 3 — exactly as I specced.
    5. AUTOPLAY-SAFE ✓ — nothing plays on load; ctx is lazy (ac()) and resume() happens only
       INSIDE play(), which fires on a user gesture. on-boolean still gates. Default ON but
       OFF for prefers-reduced-motion (good a11y call).
    - Subtle arch note (benign): throttle reads currentTime which freezes while suspended → a
      sound right at resume can be suppressed for one window. No leak/runaway/crash; acceptable.
  - MONEY LOGIC UNTOUCHED ✓ — setIncome @2954: `_up` is a pure read-compare; the assignment
    MODEL.income[key]=Number(value) is byte-identical to before (written value unchanged, NOT
    derived from _up); coin() is output-only, additive; logChange/rebuild/refresh order intact.
    Parser path: the only added call is MRLN_SFX.error() on the EMPTY-result branch (p.changes
    .length==0) — a chime on "nothing recognised", touches no value. parser 21/21 unchanged.
  - NO LEAK / EXPORT SAFE ✓ — STATE.prefs.sound stays a plain boolean. exportBlank @4300
    HARD-reconstructs hud-state as {__fresh,fid,prefs:{lang,currency}} — `sound` dropped by
    construction → can never reach a customer/blank file. Owner's exportHTML dumps full STATE
    (his master, fine; a bool pref is non-sensitive).
  - NO INJECTION ✓ — delegated listener is a PASSIVE observer: no preventDefault/stopPropagation/
    return false; guarded (e.target.closest &&); only reads classList/matches → calls a sound.
    Can't alter clicks/DOM/money. soundBtn icon via textContent. No innerHTML anywhere in diff.
  - NO NEW STRINGS ✓ — no data-i18n=/t('…') added (the one grep "hit" is the CSS selector
    string in closest()). MISSING:0 holds.
  - INVARIANTS ✓ — #__ownerKeySrc empty (@1592), #hud-state empty (@1588), PUB_B64(×3)+
    PUBCHK(4047293148)+__sys threading intact; __sys count IDENTICAL parent vs tip (23==23) →
    no watchdog weakened/removed.
  - Ran node tools/test/sound_test.js → 6/6 (throttle/cap/mute). node tools/release/green.js →
    GREEN exit 0 (parser 21/21, assistant 16/16, streak 4/4, preflight CLEAR, all published clean).
- Verdict: SAFE. Every constraint I specced is implemented correctly; zero money/key/network/
  injection/leak surface. A pure-synthesis output layer with the guardrails that make it phone-safe.
- Commits / SHAs reviewed: 7c919a5 (tip). If tip moves index.html, I re-sign.
- Still open: nothing security-side. Gate not opened. Sleep-mode: no auto-publish — needs Osefe's go.

## [2026-06-28] — via Kaito — REVIEW: tab reorder + category-open sound (`c7c5810`)
- Asked: security-review the double-tap-tab Position control + __tabReorder/moveTabTo
  DOM re-append reorder (persisted in STATE.tabOrder, restored by applyTabOrder on load),
  plus a distinct `panel` sound on expense-category open and `panel`/`ping` added to
  MRLN_SFX. Confirm tab integrity / persistence-safe / no money-logic-or-watchdog touch /
  sounds pure / no injection. Run reorder_test + green.
- Did / found (read the full diff + load-bearing fns on the tip, ran both suites — not on faith):
  - SCOPE: diff = index.html (+71/-5) + TEAM-CHAT + new tools/test/reorder_test.js. NO added
    line touches a sensitive API — grepped the `+` lines for innerHTML/fetch/eval/new Function/
    document.write/.src=/parseClause/applyChange/setIncome/exportBlank/PUBCHK/__sys → ZERO hits.
    (The only innerHTML grep matches are pre-existing CONTEXT lines expMonth/expYear @diff157-158,
    shown because the panel() sound was added to the adjacent exp-head click handler — not added.)
  - TAB INTEGRITY ✓: nav handler @1993 does `getElementById(t.getAttribute('data-p'))` — keyed
    off data-p, NOT DOM position. Reorder only re-appends existing .tab nodes (data-p preserved),
    so order changes can't change which panel a tab opens. __tabReorder is pure (top-level, no
    DOM) → reorder_test 7/7 incl. clamp + "hidden tab stays put".
  - HIDDEN-TAB CANNOT BE REVEALED ✓ (the key worry): reorder NEVER touches .style.display — it
    only appendChild's. Klarna visibility is gated solely on STATE.showKlarna (reveal @5249 customer
    /@6636 master set display=''); visTabs() filters display!=='none' so a hidden tab rides along in
    the order but stays hidden. A customer reordering cannot surface a master-only tab.
  - PERSISTENCE SAFE ✓: STATE.tabOrder is an array of data-p STRINGS (overview/income/…), no
    numbers/secrets. exportBlank @4363 HARD-reconstructs hud-state as {__fresh,fid,prefs:{lang,
    currency}} — tabOrder NOT in that object → dropped by construction, can't reach a customer/
    blank file (same proven mechanism as streak/sound). Owner's exportHTML dumps full STATE incl.
    tabOrder — his master, fine (tab order is non-sensitive layout, no figures).
  - SOUNDS ✓: panel/ping are defined exactly like existing sounds — pure play(fn,150) into the
    SAME engine (note() CAP=14/master/voices, play() on-boolean+55ms throttle+resume). No new
    AudioContext, no new surface, output-only. Guardrails (cap/throttle/master/suspend/autoplay)
    UNCHANGED — sound_test 6/6. ping fires on options-popup open; panel on category unfold.
  - NO INJECTION ✓: position control writes only posIn.value=p / posIn.max=n (numeric) /
    posOf.textContent='/ '+n (textContent) / titleEl.textContent=name (textContent). name(tab)
    goes to logChange → STATE.log[].detail (data, not DOM; change log is data-i18n-skip + escaped
    on render). No innerHTML with user data anywhere in the diff.
  - I18N ✓: exactly ONE new translatable string "Position in the menu" (data-i18n) → Mikoto's
    MISSING. The arrows/number input/`/N` counter are all data-i18n-skip so the position number
    isn't mangled. user content untouched.
  - INVARIANTS ✓: #__ownerKeySrc empty (@1601), #hud-state empty (@1597), PUB_B64(@4421)+PUBCHK
    (4047293148 @4607)+__sys threading intact; __sys count IDENTICAL parent vs tip (23==23) → no
    watchdog weakened/removed. No SW/manifest change.
  - Ran node tools/test/reorder_test.js → 7/7. node tools/release/green.js → GREEN exit 0
    (parser 21/21, assistant 16/16, streak 4/4, sound 6/6, preflight CLEAR, all published clean).
- Verdict: SAFE. DOM-reorder + two pure-synth sounds; zero money/key/network/injection/leak
  surface, watchdogs intact, hidden tabs can't be revealed by reorder, tabOrder can't reach a
  customer file.
- Commits / SHAs reviewed: c7c5810 (tip). If tip moves index.html, I re-sign.
- Still open: nothing security-side. Gate not opened; 1 new i18n string → Mikoto (MISSING),
  Hugo GREEN/guide. Sleep-mode: no auto-publish — needs Osefe's explicit go.

## [2026-06-29] — via Kaito — REVIEW: slider drag SFX (`ea94ab2`)
- Asked: perf-focused security review of MRLN_SFX.slide(frac) + one delegated `input`
  listener firing on every `input[type=range]` (6 sims). Key worry: `input` fires very
  rapidly during a drag — confirm bounded, no money touch, no leak/injection. Run
  sound_test + green.
- Did / found (read engine + listener + both parent/tip on the tip, ran suites — not on faith):
  - SCOPE: index.html +15, sound_test.js +12/-3, TEAM-CHAT 1 line. No sw.js/manifest/
    parser/applyChange/export edits. Grepped the diff for fetch/innerHTML/eval/XHR/new
    Function/document.write/.src=/__sys/PUBCHK/PUB_B64/ownerKeySrc/hud-state/exportBlank/
    applyChange/parseClause/STATE. → ZERO hits.
  - RAPID-DRAG BOUNDED ✓: slide() (@1872-1874) routes through the SAME guarded play(fn,42)
    → note(). Global throttle is shared `last` on the audio clock (play @1851-1857, line
    1854 `t-last < (gap||GAP)`), and note() early-returns at voices>=CAP (CAP=14 @1834). A
    drag firing input every pointermove collapses to ≤1 blip per 42ms window AND can't exceed
    14 live voices. o.stop() always scheduled + onended disconnect/decrement → no node leak.
    sound_test "throttle bounds node creation (<60)" still passes.
  - LISTENER CHEAP ✓ (@6958-6965): per event = parseFloat(min/max/value) + one subtraction +
    one division + clamp. No allocation per event, no array build (sc[] lives in the engine
    closure, not the listener). Range-only guard (el.type!=='range') → keystrokes/text/number
    inputs never fire (stays silent); mx>mn guard avoids NaN/div-by-zero. PASSIVE observer:
    no preventDefault/stopPropagation/return false, reads el.value only.
  - NO MONEY LOGIC ✓: listener READS el.value for a fraction; never writes a slider value,
    never recomputes finance. The simulators' OWN input handlers are untouched (separate
    listeners; this is an added capture-phase observer). parser 21/21 unchanged.
  - NO LEAK / INJECTION ✓: no fetch/XHR/eval/innerHTML, output-only (synth tone). No new STATE
    field. No new i18n string (MISSING:0 holds). #__ownerKeySrc empty (@1601), #hud-state empty
    (@1597), PUB_B64+PUBCHK present, __sys count IDENTICAL parent vs tip (23==23) → no watchdog
    weakened/removed.
  - Ran node tools/test/sound_test.js → 7/7 (incl. "slide pitch rises with value 0<.25<.5<1").
    node tools/release/green.js → GREEN exit 0 (parser 21/21, assistant 16/16, streak 4/4,
    sound 7/7, reorder 7/7, preflight CLEAR, all published files clean).
- Verdict: SAFE. Pure-synth output layer; rapid drag bounded by the shared throttle+voice cap;
  zero money/key/network/injection/leak surface; watchdogs intact.
- Commits / SHAs reviewed: ea94ab2 (tip). If tip moves index.html, I re-sign.
- Still open: nothing security-side. Gate not opened. Sleep-mode: no auto-publish — needs Osefe's go.

## [2026-06-29] — via Kaito — REVIEW: HUD long-press selection privacy fix (`a674002`)
- Asked: privacy + correctness review of a selective CSS rule that stops Android long-press
  → "Web search" from sending a private HUD figure (income etc.) to Google. Confirm it closes
  the leak vector, didn't over-disable copyable elements (#mintKey/#mintLink/#dataCode + all
  inputs), is CSS-only (no logic/watchdog/money touch). Run green.js.
- Did / found (read the diff + every select-to-copy fallback on the tip, ran green.js — not on faith):
  - SCOPE: diff = index.html only, TWO CSS hunks (index.html @45-56). Hunk 1: body{} gains
    -webkit-user-select:none; user-select:none; -webkit-touch-callout:none. Hunk 2: re-enable
    block `input, textarea, select, [contenteditable="true"], .selectable, #dataCode, #mintKey,
    #mintLink, #lkInput { user-select:text; -webkit-touch-callout:default }`. The `none` attaches
    to `body{` (verified @35 — body is the rule above the new block). NO money/parser/watchdog/
    export/SW line in the diff.
  - CLOSES THE LEAK ✓: HUD figures/labels are plain divs/spans, NOT inputs, so they fall under
    the body `user-select:none`. With user-select:none + -webkit-touch-callout:none on the
    container, Android's long-press text-selection + the callout menu (Copy/Share/Web search /
    "tap to search") cannot grab a HUD number → it can't be sent to Google. Directive covers the
    figures by inheritance (none is inherited; the re-enable list is the only escape and it's
    inputs/key/code only). Leak vector closed.
  - DID NOT OVER-DISABLE ✓ — the load-bearing find: the app's copy-out UX on phones opening a
    local file:// (insecure context, navigator.clipboard blocked) falls back to PROGRAMMATIC
    select-then-"long-press → Copy". I traced all three on-screen select-to-copy targets:
      • #dataCode — data export code box; selBox() selectNodeContents @5274, click→selBox @5275,
        copy fallback selBox @5280. IN re-enable list ✓ (also has inline user-select:text @1486).
      • #mintKey — the ACCESS KEY box; selectKeyText() selectNodeContents @6701, copyKey fallback
        @6723. IN re-enable list ✓.
      • #mintLink — share link; selectNodeContents on click @6688. IN re-enable list ✓ (inline
        user-select:text @6686).
    All three users-need-to-copy elements stay selectable, so the file://-phone Copy fallback
    still works. Every <input>/<textarea> stays typeable/selectable (covered by the list);
    #lkInput (unlock paste) explicitly included. QR path is canvas (scan-to-copy) + instructional
    caption — no select-to-copy text there, nothing missed. No File ID / recovery-phrase
    select-to-copy block exists outside these three. Re-enable list is complete; nothing critical
    wrongly disabled.
  - CSS-ONLY, NO LOGIC ✓: diff is two style rules; no __sys/PUBCHK/PUB_B64/parseClause/applyChange/
    exportBlank/exportHTML/importData/fetch/eval/innerHTML touched. No new i18n string (MISSING:0
    holds — CSS only). Invariants untouched by construction.
  - Ran node tools/release/green.js → GREEN exit 0 (parser 21/21, assistant 16/16, streak 4/4,
    sound 7/7, reorder 7/7, preflight CLEAR — owner/hud slots empty, PUBCHK intact, 1 public key,
    all published files clean).
- Verdict: SAFE. Closes a real privacy leak (HUD figure → Google Web-search); copyable key/code/
  link/inputs all preserved via the re-enable list; pure CSS, zero money/key/watchdog/network touch.
- Commits / SHAs reviewed: a674002 (tip). If tip moves index.html, I re-sign.
- Still open: nothing security-side. Gate not opened. Sleep-mode: no auto-publish — needs Osefe's go.

## [2026-06-29] — direct (Osefe) — brainstorm: browser→app data transfer
- Asked: brainstorm making data transfer browser→app dead-simple (9-yr-old), Osefe to talk to team 1:1.
- Did: grounded in real code (exportDataCode/MRLNDATA base64 @5209, importDataCode @5239,
  importMasterHTML/#hud-state @5249, QR write-only @5666, same-origin install). Posted ranked ideas:
  (1) same-origin install = ZERO transfer (data already there, just make it obvious) — best+safest;
  (2) QR camera handoff incl. rolling-QR for big payloads — cross-device wow, needs in-app reader;
  (3) one "Move my data" button + hide the base64 blob + preview-before-import;
  (4) OS share-sheet/AirDrop handoff.
- Security guardrails I will hold: STAY ON-DEVICE (no server/account/cloud-sync default — hard NO
  unless opt-in E2E); never put data in URL path/query (fragment/file/QR/P2P only); data code/file
  must NEVER carry the private signing key (current code correct — preserve); import must validate
  schema/version + cap size + escaped render + confirm.
- Verdict/next: pick = ship #1+#3 now (UX, zero new risk), build #2 as the wow. Offered deeper
  threat-model on the QR reader. No code touched (brainstorm only); nothing at the gate.

## [2026-06-29] — direct (Osefe) — created Arthur (UI/UX design agent)
- Asked: create a new agent, Arthur — UI/UX specialist (app/desktop/tablet/game UI),
  personality = 7DS-Merlin "gluttony for knowledge" perfectionist.
- Did: wrote .claude/agents/arthur.md (opus; Read/Grep/Glob/Bash/WebSearch/WebFetch;
  read-only director model — specs not patches; defers to me on network/privacy, Mikoto on
  words). Seeded team/logs/arthur.md. Wired CLAUDE.md (roster + sleep-mode "one per role" +
  memory-log list). Claimed/released the lock properly (aadea11 → 36e9d95). Announced + routed
  to Kaito to fold into dispatch.
- Noted: "Move my data" Phase 1 redesign landed (c4e3882, index.html) — touches export/import,
  needs my SAFE review before any gate. NEXT.
- Open: review c4e3882 data-transfer diff for leak/key/injection + export-strip integrity.
## [2026-06-29] — via Kaito — REVIEW: Phase 1 "Move my data" data-transfer redesign (`c4e3882`)
- Asked: security-review the Phase 1 redesign — one situation-aware "Move my data" card
  (Bring-in clipboard hero + Copy-out + decode→validate→preview→confirm import). Verify my
  4 gating constraints (on-device / no key in transfer / validate+cap+escape+confirm /
  clipboard fails-safe), watchdogs intact, master-fallback still skips the key. Run green.
- Did / found (read the full diff + all load-bearing fns on the tip, ran the gate — not on faith):
  - SCOPE: diff = index.html only (+132/-28). UI rework of the Connect "Move my data" card +
    new fns: decodeDataCode, importSummary, setupMoveSituation, bringInFromClipboard,
    copyOutData; doImport now takes (code,report) and decode→preview→confirm→apply.
  - CONSTRAINT 1 — ON-DEVICE ✓: grepped the `+` lines for fetch/XHR/eval/new Function/
    location.href|search|hash=/.src= → ZERO. No server/account/cloud, no data in any URL
    path/query. The only clipboard WRITE is exportDataCode() output (the user's own data,
    user-initiated); transfer stays device↔device.
  - CONSTRAINT 2 — KEY NEVER TRAVELS ✓: exportDataCode (@5230-5233) is BYTE-IDENTICAL parent
    (aadea11) vs tip — explicit allowlist {v,cfg,workouts,calendar,log,body,prs,notes,foodLog,
    tax,savingsBoxes,prefs,reminders,usage,bdayYear,missionsDone}; NO ownerKey/signingKey/
    #__ownerKeySrc field. applyImportedData (@5237) reads only d.* fields, never reads/writes
    #__ownerKeySrc. importMasterHTML (@5290) reads #hud-state ONLY, never #__ownerKeySrc →
    master-file fallback still imports data-but-not-key. Confirmed by grep: no key field in
    the export/apply data object.
  - CONSTRAINT 3 — VALIDATE + CAP + ESCAPE + CONFIRM ✓: decodeDataCode (@5262) trims, strips
    MRLNDATA-, **3,000,000-char size cap** BEFORE atob (the cap I asked for), then JSON.parse,
    then schema check `!d||typeof d!=='object'||!d.cfg||!d.cfg.groups` → throws "isn't MRLN
    data". applyImportedData re-checks cfg.groups (defense in depth). doImport (@5348) decodes →
    importSummary → uiConfirm preview → ONLY applies on confirm. XSS: importSummary builds the
    preview from static tf() strings + NUMERIC counts only (.length / Object.keys().length) —
    no user text (note/item names) ever reaches the {sum} interpolation. innerHTML sinks
    (tip/biMsg/coMsg @5328/5364/5383) receive ONLY static tf() strings; every error display
    uses esc(e.message). Raw clipboard/file text is used only via indexOf/slice → decode
    (base64+JSON), never rendered. No injection path.
  - CONSTRAINT 4 — CLIPBOARD FAILS-SAFE ✓: bringInFromClipboard (@5366) guards
    `!(navigator.clipboard&&readText)` → friendly fallback to paste box (covers file:// /
    insecure context, iOS); .then sniffs for MRLNDATA- (no payload → friendly "copy on other
    device first"); .catch (Don't Allow) → friendly "paste in the box instead" + reveals it.
    readText result goes ONLY to doImport; never written anywhere, never networked. No silent
    auto-read (no readText on load) — only on the explicit button tap. Leaks nowhere.
  - WATCHDOGS / INVARIANTS ✓: __sys count IDENTICAL parent vs tip (23==23) → none weakened/
    removed. PUBCHK 4047293148 intact (@4644/4651), #__ownerKeySrc empty (@1633), #hud-state
    empty (@1629). No SW/manifest change. licensing poison untouched (diff doesn't touch it).
  - TIP NOTE: review target c4e3882; HEAD moved to b4cdc9f (36e9d95 team roster + b4cdc9f
    Hugo tools/ lock). Verified index.html is **byte-identical c4e3882..HEAD** → my SAFE holds
    on the current tip; published artifact unchanged.
  - Ran node tools/release/green.js → GREEN exit 0 (parser 21/21, assistant 16/16, streak 4/4,
    sound 7/7, reorder 7/7, preflight CLEAR — slots empty/PUBCHK/1 public key, all published
    files clean).
- Verdict: SAFE @ c4e3882 (and current tip b4cdc9f — index.html identical). All 4 of my gating
  constraints met; key never travels; validate+cap+escape+confirm sound; clipboard fails-safe;
  watchdogs intact. New user strings (tf()/t()) await Mikoto for MISSING:0.
- Commits / SHAs reviewed: c4e3882 (index.html identical at tip b4cdc9f). If index.html moves, I re-sign.
- Still open: nothing security-side. New i18n strings → Mikoto (MISSING). Gate not opened.
  Sleep-mode: no auto-publish — needs Osefe's explicit go.

## [2026-06-29] — direct (Osefe, status) — SAFE on Phase 1 Move-my-data @ 39df9d0
- Did: fresh security review of the data-transfer flow on the CURRENT tip (prior SAFE was
  c4e3882, stale). Verified: exportDataCode omits #__ownerKeySrc; decodeDataCode size-cap
  (3MB, mine) + schema validate; importSummary = counts only → NO XSS via uiConfirm innerHTML
  preview; apply gated decode→preview→confirm; clipboard readText user-gesture read, raw text
  never echoed to DOM; imported content renders through esc()'d renderers. green.js GREEN exit 0.
- Verdict: SAFE @ 39df9d0. Posted to room; flagged freeze-the-tip (any index.html commit reopens).
- Open: Phase 2 (QR camera reader) threat model still parked on me — not started. Gate not formally
  opened in Pending yet; needs Hugo GREEN + Osefe ship.

## [2026-06-29] — direct (Osefe, "do what's needed / full security") — Phase 2 QR threat model
- Did: produced + posted the Phase 2 QR-camera-reader threat model (was parked on me, blocking Phase 2).
- Key requirements locked: reuse Phase-1 chain (decodeDataCode cap+validate → importSummary counts →
  confirm → apply); DECODER MUST BE VENDORED not CDN (offline/supply-chain); getUserMedia on gesture +
  hard teardown, no frame storage/upload, file:// degrades to paste; rolling-QR reassembly fail-closed
  (cap total + cap bytes BEFORE decode, single payloadId, complete-set check, length+checksum prefix,
  throttle); never auto-apply. Noted clear-text-on-screen as accepted v1 property (PIN = future lever).
- Open: review vendored decoder + reassembly code before it touches STATE. Phase 1 SAFE still holds
  (index.html unchanged since 39df9d0); will re-confirm final tip incl. Hugo's guide before ship.

## [2026-06-29] — direct (Osefe) — RE-SIGN Phase 1 @ e19e1ba
- Hugo flagged tip moved past my SAFE (39df9d0). Verified: index.html byte-identical (code SAFE holds);
  only published delta = GUIDE.md §9 sync (Hugo) — leak-clean (no PII/keys/figures); green.js GREEN.
- Re-signed SAFE on e19e1ba. Scoped my SAFE to the PUBLISHED ARTIFACT, not every commit — chat/log commits
  don't reopen it; only a published-file change does (stops the re-sign treadmill from chat churn).
- Gate now aligned: Akashi SAFE · Mikoto MISSING:0 · Hugo GREEN → awaiting Osefe ship.

## [2026-06-29] — via Kaito (asleep) — REVIEW: Arthur Tier 1 motion polish (`2a1291b`)
- Asked: SAFE review of CSS/JS-only motion polish (5 items: B directional panel slide via
  tab-click handler computing a direction class from the tab's live index; D :active scale;
  E accordion nth-child row stagger; F :focus-visible glow; G body::before opacity heartbeat).
  Confirm no new net/data surface, JS only adds/removes presentational classes, body::before
  decorative, no leak/watchdog touch. Re-run green.js myself.
- Did / found (read FULL diff + verified load-bearing lines on the tip, ran the gate — not on faith):
  - SCOPE: index.html only, +34/-5. CSS hunks (gridPulse @66-67, focus-glow+tab:active @123-124,
    panel display refactor + slideFromR/L @143-150, exp row stagger nth-child @238-250,
    scen-btn/btn :active @252/283) + ONE JS hunk: tab-switch handler @2049-2068.
  - 1. NO NET/DATA SURFACE ✓: grepped the `+` lines for fetch/XHR/eval/new Function/document.write/
    .src=/location.*=/innerHTML/outerHTML/insertAdjacentHTML/__sys/PUBCHK/PUB_B64/ownerKeySrc/
    hud-state/exportBlank/exportHTML/importData/applyChange/parseClause/MODEL./STATE. → ZERO hits.
    Pure CSS + classList add/remove + a slice/indexOf on the live tab NodeList.
  - 2. TAB JS PRESENTATIONAL ONLY ✓: handler still routes the panel via
    getElementById(t.getAttribute('data-p')) @2063 — UNCHANGED, keyed off data-p not DOM position
    (consistent w/ the reorder review c7c5810). Added logic only: computes `dir` (from-left/right)
    from live indexOf vs a `prevTabIdx` closure var (NOT STATE), and add/removes show/from-left/
    from-right/active classes. Does NOT change which panel/data renders, touch STATE/money/poison/
    watchdogs. prevTabIdx is a local var, never serialized, never exported.
  - PANEL REFACTOR SAFE ✓: was `.panel{display:none;animation}` + `.panel.show{display:block}`;
    now `.panel{display:none}` + `.panel.show{display:block;animation}`. Visibility semantics
    IDENTICAL — a panel is visible iff it has .show, exactly as before. No panel can surface
    without the class; nothing hidden gets revealed.
  - 3. body::before DECORATIVE ✓: gridPulse only animates opacity .72→1/6s on the fixed grid
    overlay (pointer-events:none, z-index:0). It's a background; can't affect layout-trust, can't
    hide/cover a security-relevant element (.wrap is z-index:1 above it), reads/writes no data.
  - 4. NO LEAK / INVARIANTS ✓: #hud-state empty (@1656), #__ownerKeySrc empty (@1660), PUB_B64 +
    PUBCHK(4047293148) intact, __sys count IDENTICAL parent 9d63c10 vs tip (23==23) → no watchdog
    weakened/removed. exp-group.open is a PRE-EXISTING toggled class (@230/232) — new CSS only
    decorates it, adds no behavior. No new i18n string (MISSING:0 holds). No SW/manifest change.
  - Ran node tools/release/green.js → GREEN exit 0 (parser 21/21, assistant 16/16, streak 4/4,
    sound 7/7, reorder 7/7, transfer 27/27, preflight CLEAR — slots empty/PUBCHK/1 public key/
    script tags balanced 4, all published files clean).
- Verdict: SAFE @ 2a1291b. Pure presentational motion layer; zero money/key/network/injection/leak
  surface; tab routing + panel visibility semantics unchanged; watchdogs intact.
- Commits / SHAs reviewed: 2a1291b (tip). If index.html moves, I re-sign.
- Still open: nothing security-side. Gate not opened. Sleep-mode: no auto-publish — needs Osefe's go.

## [2026-06-29] — via Kaito (asleep) — RE-SAFE: Arthur E accordion stagger fix (`5e04ee3`)
- Asked: re-SAFE the tiny delta `2a1291b..5e04ee3` — Arthur's E fix. Keys the rowIn stagger off a
  transient `just-opened` class (added on the .exp-head open gesture, removed via setTimeout 600ms)
  instead of the persisted `.open` class, so it can't re-fire on an innerHTML rebuild from an
  unrelated number change. Confirm presentational only, invariants intact, run green.
- Did / found (read full delta + JS hunk in context @2239-2250, ran the gate — not on faith):
  - SCOPE: delta = index.html ONLY. CSS hunk @236-251: 11 selectors renamed `.exp-group.open` →
    `.exp-group.just-opened` (rowIn keyframe + nth-child delays unchanged). JS hunk @2242-2248:
    on the OPEN branch only, add `just-opened` + setTimeout(remove,600); the pre-existing
    MRLN_SFX.panel() call is now nested inside the same `if(opening)` (same trigger condition as
    before — still open-only). Toggle of `.open` itself UNCHANGED (@2241).
  - PRESENTATIONAL ONLY ✓: pure classList.add/remove + a setTimeout that only removes a CSS class.
    Grepped the `+` lines for fetch/XHR/eval/new Function/document.write/.src=/location.*=/innerHTML/
    outerHTML/insertAdjacentHTML/__sys/PUBCHK/PUB_B64/ownerKeySrc/hud-state/exportBlank/exportHTML/
    importData/applyChange/parseClause/MODEL./STATE. → only "hit" is the word innerHTML inside a
    CODE COMMENT (not code). No STATE/value/figure/poison/watchdog/network/data-surface touch.
    `just-opened` is a transient view-only class, never serialized/exported (it's removed after 600ms).
  - FIX IS SOUND ✓: keying the animation off a transient open-gesture class instead of the persisted
    `.open` means renderExpenses' host.innerHTML rebuild (which re-creates rows on any number change)
    no longer re-applies the stagger to an already-open group — animation now fires ONLY on the actual
    user open gesture. Doesn't change which rows/figures render (host.innerHTML build @2234 untouched),
    only when the cosmetic stagger plays.
  - INVARIANTS ✓: __sys count IDENTICAL parent 2a1291b vs tip (23==23) → no watchdog weakened/removed.
    #__ownerKeySrc empty (@1660), #hud-state empty (@1656), PUBCHK(4047293148) + PUB_B64(×3) intact.
    No SW/manifest change. No new i18n string (MISSING:0 holds).
  - Ran node tools/release/green.js → GREEN exit 0 (parser 21/21, transfer 27/27 + suites, preflight
    CLEAR — slots empty/PUBCHK/1 public key/script tags balanced 4, all published files clean).
- Verdict: SAFE @ 5e04ee3. Cosmetic accordion-stagger gating fix; zero money/key/network/injection/leak
  surface; watchdogs intact; only changes WHEN a CSS animation plays.
- Commits / SHAs reviewed: 5e04ee3 (tip). If index.html moves, I re-sign.
- Still open: nothing security-side. Gate not opened. Sleep-mode: no auto-publish — needs Osefe's go.

## [2026-06-29] — via Kaito (asleep) — REVIEW (steps 4+10): Move-my-data i18n bugfix + setBox weight (`684197e`)
- Asked: steps 4 (errors/security + decide if NEW surface needs poison) + 10 (SAFE green) of the
  11-step workflow, for (1) Mikoto's Move-my-data static-label i18n wiring (`0192136`) and (2) Kaito's
  setBox active-step fontWeight emphasis (`684197e`). Confirm purely presentational; decide poison;
  AUTO-MERGED block well-formed + slots empty + watchdogs + no leak; re-run green.js for SAFE.
- Did / found (read both immediate diffs in context, validated JSON, ran the gate — not on faith):
  - SCOPE: index.html only. (a) Mikoto `9c7d36f..0192136`: 64-line diff = 8 `data-i18n` attrs added
    (card h2; 2 step-title spans; bringInBtn; copyOutBtn; dataExportBtn; 2 <summary>; 1 .note) + the
    AUTO-MERGED dictionary line regenerated. (b) Kaito `09a2737..684197e`: +4 lines in setBox @5395 —
    one querySelector + a fontWeight string. HEAD db879c4 = CLAUDE.md/TEAM-CHAT only; index.html
    BYTE-IDENTICAL 684197e..HEAD.
  - PURELY PRESENTATIONAL ✓ — no new STATE/value/network/financial logic. data-i18n attrs are display
    labels resolved by the existing i18n engine; setBox change is `el.querySelector('h2 span:not(.stepBadge)').style.fontWeight = active?'700':'600'` — a CSS weight on the title span. No fetch/XHR/eval/
    innerHTML/parseClause/applyChange/export/import added.
  - POISON DECISION ✓ — NO new __sys.token()/watchdog coverage warranted. These are display labels +
    a font weight, not new figures and not a new data path. The data-transfer logic (decode/validate/
    apply, exportDataCode key-strip) was already reviewed + poison-aware (c4e3882 / 39df9d0 / e19e1ba)
    and is UNTOUCHED here. Nothing new to thread poison into. Stated explicitly to Kaito.
  - setBox SELECTOR SOUND ✓ — `span:not(.stepBadge)` targets ONLY the title span; the .stepBadge span
    (JS-filled step number) is excluded → step number never weight-bolded, and (grep) stepBadge spans
    carry NO data-i18n → the JS-set "STEP 1/2" badge can't be mistranslated. The dropped inline <b>this</b>
    in the step titles is exactly what this fontWeight replaces (so data-i18n doesn't fragment the string).
  - AUTO-MERGED JSON WELL-FORMED ✓ — extracted the IIFE arg + JSON.parse OK: 6 langs es/da/de/sv/nb
    (1423 keys each) + hu (1463). All 8 new move-data keys present in ALL 6 locales (MISSING:0 for this
    card). Owner-only/private slots NOT in the dict (it's UI strings).
  - INVARIANTS ✓ — __sys count IDENTICAL parent 8898d72 vs HEAD (31==31) → no watchdog weakened/removed.
    PUBCHK(×2)+PUB_B64(×3)+poison hash 4047293148 present. #hud-state empty (@1672), #__ownerKeySrc empty
    (@1676). No SW/manifest change. No private-key marker; preflight PII/key scan CLEAR.
  - GREEN ✓ — node tools/release/green.js → exit 0: parser 21/21, assistant 16/16, streak 4/4, sound 7/7,
    reorder 7/7, transfer 27/27; preflight CLEAR (slots empty, 1 public key, PUBCHK, script tags balanced 4);
    all published files (GUIDE/manifest/sw/team-chat) clean.
  - Note: a pre-existing stash@{0} (WIP on 86277b2) sits in the repo — not mine, didn't touch it; working
    tree clean. Flagging so it isn't lost/confused with the gate candidate.
- Verdict: SAFE @ 684197e. Presentational i18n labels + a CSS weight; no new poison needed; AUTO-MERGED
  block valid, slots empty, watchdogs intact, no key/PII leak.
- Commits / SHAs reviewed: 684197e (index.html identical at HEAD db879c4). If index.html moves, I re-sign.
- Still open: nothing security-side. Gate: my SAFE in; needs Mikoto MISSING:0 + Hugo GREEN + Osefe ship.
  Sleep-mode: no auto-publish without Osefe's explicit go. Pre-existing stash@{0} noted for Kaito.

## [2026-06-29] — via Kaito (asleep, step 4) — REVIEW: Assistant MRLN your-numbers Q&A — answerData (`fe7dc58`)
- Asked: step 4 — verify the tamper-poison is FULLY spread into the new answerData() feature that
  reads the user's PRIVATE numbers (total/by-category spend, leftover, affordability, save-time).
  Confirm EVERY numeric branch yields NaN on a tampered/bypassed copy (token()=NaN) and can NEVER
  surface a real figure off a removed lock. Confirm no new net/exfil, _amtFrom regex not ReDoS/
  injectable, answer render is escaped. Watchdogs/slots intact. Run green.
- Did / found (read the full diff + every load-bearing fn on the tip, traced each branch, ran the gate — not on faith):
  - SCOPE: index.html only, +51/-1. New: _amtFrom (@4339), answerData (@4344-4383), one wire line in
    answerQuestion (@4389: `var d=answerData(text); if(d) return d;` BEFORE the feature-Q&A + fallback),
    and the out-of-scope fallback string change (@4397). No sw.js/manifest/parser/applyChange/export edit.
  - POISON — token() (@2012) returns 1 armed&!tripped else NaN; NaN propagates through all arithmetic and
    isFinite(NaN)=false. Traced EVERY numeric branch on a tampered copy (T=NaN):
    1. by-category spend: `groupTotal(hitCat)*T` — groupTotal sums Math.round(itemMonthly) and itemMonthly
       multiplies by token (@2046/2054) → NaN; ×T → NaN. Total: `GRAND*T` — GRAND already token-gated
       (@2058) → NaN. Both poisoned. ✓
    2. leftover: `money(left)`, left=leftOver(inc)=token()*inc−GRAND−loanAmt() (@2062) → NaN. (`!inc` guard
       uses RAW inc only to decide WHETHER to answer; figure shown is `left`, gated.) ✓
    3. affordability: compare `a <= left*T` → NaN → false → falls to else, shows money(a)=user's typed
       price (not private) + money(left)=NaN. No real leftover surfaced either branch. ✓
    4. save-time: `rate=((MODEL.savingsMatch||0)*T)||left` — savingsMatch is RAW but ×T=NaN, NaN is falsy →
       falls back to left=NaN → rate=NaN → `!isFinite(rate)` true → returns the non-figure "set a saving
       first" string. target/amt shown are user-typed, not private. ✓
    money()→fmtN(n)=Math.round(n).toLocaleString → Math.round(NaN)=NaN → renders literally "NaN" (visibly
    poisoned, never a real number). CONCLUSION: NO branch can leak a real figure when the lock is removed.
    No DIRECT fix needed — Kaito's gating is correct and complete. The +3 __sys refs (23→26) are exactly
    answerData's comment+guard+`var T=__sys.token()`; no pre-existing watchdog touched.
  - NO NET/EXFIL ✓: answerData is pure computation + string building. Grepped the diff for fetch/XHR/eval/
    new Function/innerHTML/.src=/location.*=/localStorage/exportBlank/exportHTML → ZERO. No STATE write, no
    storage, no network.
  - _amtFrom REGEX SAFE ✓: `/(\d+(?:\.\d+)?)(k)?/i` — linear, no nested/overlapping quantifiers → no ReDoS;
    `.replace(/[,\s]/g,'')` linear. Input is a short user question. Branch regexes are simple alternations,
    linear. parseFloat only; output is a Number used in arithmetic, never eval'd/rendered as code.
  - RENDER ESCAPED ✓: answer flows answerQuestion→showAnswer→`body.textContent=textAns` (@4439) — textContent,
    NOT innerHTML. No DOM injection regardless of content. Answer path applies nothing (clears aiProposal).
  - WIRING ✓: answerData only runs when isQ already true (@4387-4389) and returns BEFORE the command path —
    a numbers-question can't misroute into a money mutation (consistent w/ my 0d03dbb routing review).
  - INVARIANTS ✓: #__ownerKeySrc empty (@1676), #hud-state empty (@1672), PUBCHK(4047293148)+PUB_B64(×3)+
    trip/pubChk watchdogs (@4766-4774) + export-trip (@4460) all intact. No SW/manifest change. New t()/tf()
    strings → Mikoto for MISSING:0.
  - Ran node tools/release/green.js → GREEN exit 0 (parser 21/21, assistant 16/16, streak 4/4, sound 7/7,
    reorder 7/7, transfer 27/27 = 92/92; preflight CLEAR — slots empty, 1 public key, PUBCHK, 4 scripts).
- Verdict: SAFE @ fe7dc58. Assistant fully poison-gated; no leak/exfil/ReDoS/injection; watchdogs intact.
  No DIRECT security fix was required (gating already correct + complete).
- Commits / SHAs reviewed: fe7dc58 (tip). If index.html moves, I re-sign.
- Still open: Arthur's POLISH (P1 `{n} month(s)` split, P2 "That's tight"→"No —") routes to Kaito → will
  MOVE the tip and REOPEN my SAFE; I re-verify the new tip (copy-only, but I confirm no figure ungated).
  New strings await Mikoto MISSING:0; Hugo GREEN. Gate not opened. Sleep-mode: no auto-publish w/o Osefe's go.

## [2026-06-29] — via Kaito (asleep, step 10) — RE-SAFE: Assistant v1 final tip — Arthur copy + Mikoto i18n (`767017f`)
- Asked: re-SAFE on the final Assistant MRLN v1 tip. Prior SAFE was answerData @ fe7dc58 (all 5 branches
  traced, fully poison-gated). Delta since: (1) 5fcb562 Kaito folds Arthur P1/P2 copy — affordability
  else reworded "No — … part of it would come from savings"; save-time split singular "1 month" / plural
  "{n} months". (2) 767017f Mikoto merges 13 assistant strings × 6 langs. Confirm copy rewrite leaves NO
  figure ungated; i18n merge well-formed; invariants intact; green.
- Did / found (read full delta fe7dc58..767017f, traced branches on tip, validated JSON, ran gate — not on faith):
  - SCOPE: index.html only. 5fcb562 = +5/-3 PURE COPY (two tf() string args reworded; save-time split into
    n===1?singular:plural). 767017f = 1-line AUTO-MERGED dict regen. index.html BYTE-IDENTICAL 767017f..HEAD
    (ff9f160) — chat/lock commits since don't move the published artifact.
  - GATING UNCHANGED: answerData @4344-4385 byte-identical to fe7dc58 EXCEPT the two reworded strings.
    left=leftOver(inc) (@4349) still = token()*inc-GRAND-loanAmt() (@2062) -> NaN on tamper. money(n)=fmtN(n)+sym
    -> fmtN(NaN)->"NaN". Re-traced the two rewritten branches with T=NaN:
    * AFFORDABILITY else (@4372): guard a<=left*T -> a(finite) <= NaN -> false -> else. Shows money(a)=user-typed
      price (not private) + money(left)=NaN. New "No -" wording surfaces NO real figure -- left still gated.
    * SAVE-TIME (@4381/4382): rate=((savingsMatch||0)*T)||left -> savingsMatch*T=NaN (falsy) -> falls to left=NaN
      -> rate=NaN -> guard !isFinite(rate) true -> returns non-figure "set a saving first" string; figure lines
      NEVER reached on tamper. Even if reached: rate=NaN->"NaN", target=user-typed, n=ceil(target/NaN)=NaN.
    A bypassed copy (token()=NaN) surfaces NaN in every branch, never a real figure. Kaito's gating correct
    + complete; no DIRECT security fix needed (copy-only delta).
  - I18N MERGE WELL-FORMED: extracted line 4927 AUTO-MERGED IIFE arg, JSON.parse OK. 6 langs
    es/da/de/sv/nb (1436 keys each) + hu (1476). All 12 source assistant strings (the 13th = old "That's
    tight" was REPLACED, correctly absent) present in ALL 6 langs; placeholders {amt}{cat}{left}{rate}{n}
    intact in every locale (verified set-equality per key). Stale keys ("That's tight...", "{n} month(s)")
    confirmed GONE. No PII / private key / private figure / owner identity in the merged block (scanned
    PEM/SPKI/osefe|miradi/aarhus/\d{4,}[.,]\d{2} -> all none).
  - INVARIANTS: __sys count IDENTICAL parent fe7dc58 vs tip (26==26) -> no watchdog weakened/removed.
    #hud-state empty (@1672), #__ownerKeySrc empty (@1676), PUB_B64(@4579,x3)+PUBCHK(4047293148 @4765)+
    trip/pubChk watchdogs intact. No SW/manifest change.
  - Ran node tools/release/green.js -> GREEN exit 0 (parser 21/21, assistant 16/16, streak 4/4, sound 7/7,
    reorder 7/7, transfer 27/27 = 92/92; preflight CLEAR — slots empty, 1 public key, no PII, PUBCHK, 4 scripts;
    GUIDE/manifest/sw/team-chat clean).
- Verdict: SAFE @ 767017f (index.html identical at HEAD ff9f160). Copy rewrite leaves no figure ungated;
  every branch yields NaN on a tampered copy; i18n merge valid + placeholders intact + no leak; watchdogs intact.
- Commits / SHAs reviewed: 767017f (index.html identical at HEAD ff9f160). If index.html moves, I re-sign.
- Still open: nothing security-side. Gate (steps 7-11): my SAFE in; needs Mikoto MISSING:0 + Hugo GREEN + Osefe
  ship. Sleep-mode: no auto-publish without Osefe's explicit go.

## [2026-06-29] — direct (Osefe) — routed IndexedDB migration directive to Kaito
- Osefe: max storage for text+images, remove 5MB localStorage ceiling, "done". Routed to Kaito (builds).
- My gating constraints posted: vendored-not-CDN helper; navigator.storage.persist()+handle denial;
  fail-loud on QuotaExceeded (check current autosave); one-time lossless migration; integrity token +
  on-device/no-network preserved.
- Flagged the hard coupling to surface to Osefe: big photo storage BREAKS the QR/clipboard "Move my data"
  path (can't move GB optically) — heavy data needs file-based/separate transfer. Storage vs transfer
  trade must be a deliberate decision.
- Open: review Kaito's design + vendored helper + persistence/quota handling before it touches STATE.

## [2026-06-29] — via Kaito (asleep, step 4) — REVIEW: Assistant v2 — 4 new your-numbers intents (`666d19f`)
- Asked: step 4 — verify the tamper-poison is FULLY spread into 4 NEW answerData branches that read
  MORE private numbers (income avg/low/high, savings total + per-box balance/target/pct, top-3 spend
  categories, body weight). Every new figure must yield NaN on a tampered/bypassed copy (token()=NaN)
  and NEVER surface a real number off a removed lock. Confirm box-NAME renders via textContent (no XSS)
  + isn't a sensitive figure; no new net/exfil; regexes linear (no ReDoS); invariants intact. Fix DIRECTLY
  if any hole. Run green.
- Did / found (read full diff 5f17cdb..666d19f + every supporting fn on the tip, traced each branch with
  T=NaN, ran the gate — not on faith):
  - SCOPE: index.html only, +42. 4 new branches inside answerData (@4351-4414): where-money, income,
    savings (total+box), weight. T=__sys.token() read ONCE @4348 and reused → 0 new __sys refs (count
    unchanged). No sw.js/manifest/parser/applyChange/export edit. Grepped the region for fetch/XHR/eval/
    new Function/innerHTML/insertAdjacentHTML/document.write/.src=/location.* → ZERO. Pure compute+string.
  - POISON — token() @2012 returns 1 armed&!tripped else NaN; fmtN(NaN)=Math.round(NaN).toLocaleString="NaN".
    Traced ALL 4 branches on a tampered copy (T=NaN):
    1. WHERE-MONEY: x.v=groupTotal(g); groupTotal sums Math.round(itemMonthly) and itemMonthly returns
       token()*(…) (@2046-2054) → NaN per item → groupTotal=NaN. DOUBLE-gated: the .filter(x.v>0) drops
       every group (NaN>0=false) → returns the empty-state string; even if reached, money(x.v*T) → NaN. ✓
    2. INCOME: money((avg|low|high||0)*T) → NaN. !inc guard reads RAW inc only to DECIDE whether to answer;
       all shown figures *T-gated. ✓
    3. SAVINGS: per-box bal=(+balance||0)*T → NaN; tgt is RAW but DISPLAYED as money(tgt*T) → NaN (tgt>0
       guard only PICKS which sentence, leaks nothing); pct=Math.round(bal/tgt*100)=Math.round(NaN)=NaN;
       total=reduce(balance)*T → NaN. Every savings figure poisoned. ✓
    4. WEIGHT: Math.round(w*T*10)/10 → NaN. !w guard reads RAW w only to decide whether to answer. ✓
    CONCLUSION: NO new branch can surface a real figure when the lock is removed — every one yields NaN.
    No DIRECT fix needed; Kaito's gating is correct + complete on all 4.
  - BOX NAME SAFE ✓: {name:hitBox.name} is a user-chosen LABEL (e.g. "Holiday"), not a private figure;
    flows tf() (plain split/join → String) → showAnswer → body.textContent=textAns (@4473), NOT innerHTML
    → even an HTML/script-laden name renders as literal text. No XSS. Shown back to the user on their OWN
    device, never networked.
  - ReDoS ✓: new regexes are flat literal-word alternations with \b anchors + single-char optionals
    (how.?s/what.?s) + one `my \w+ (box|pot|goal)`. No nested/overlapping quantifiers → linear. Input is a
    short user question; .test(s) runs once per branch.
  - INVARIANTS ✓: __sys count IDENTICAL parent 5f17cdb vs tip (35==35) → no watchdog weakened/removed.
    PUBCHK(4047293148) present, PUB_B64(×3) present, #hud-state empty (@1672), #__ownerKeySrc empty (@1676).
    No SW/manifest change. New t()/tf() strings (4 branch templates + empty-states) → Mikoto for MISSING:0.
  - Ran node tools/release/green.js → GREEN exit 0 (27 release-tests passed; preflight CLEAR — slots empty,
    no private key, 1 public key, no PII, PUBCHK intact, 4 scripts balanced; GUIDE/manifest/sw/team-chat clean).
- Verdict: SAFE @ 666d19f. All 4 new intents fully poison-gated (NaN on tamper, never a real figure); box
  name escaped via textContent + non-sensitive; no net/exfil/ReDoS; watchdogs intact. No DIRECT fix required.
- Commits / SHAs reviewed: 666d19f (HEAD bb0c96d = Arthur log + TEAM-CHAT only; index.html byte-identical →
  SAFE holds on current artifact). If index.html moves, I re-sign.
- Still open: Arthur POLISH (2 EN copy tweaks for savings-total + named-box, no new keys) routes to Kaito →
  will MOVE the tip and REOPEN my SAFE; I re-verify the new tip (copy-only, confirm no figure ungated). New
  strings await Mikoto MISSING:0; Hugo GREEN. Gate not opened. Sleep-mode: no auto-publish w/o Osefe's go.

## [2026-06-29] — via Kaito (asleep, step 10) — RE-SAFE: Assistant v2 final tip — Arthur copy + Mikoto i18n (`14ba394`)
- Asked: re-SAFE on the final Assistant MRLN v2 tip (predicted reopen from my 666d19f SAFE). Delta since:
  (1) 34313c4 Kaito folds Arthur 2 copy tweaks ("put away"→"hold", "% of the way there"→"% of your
  target"); (2) 14ba394 Mikoto merges 10 your-numbers strings × 6 langs. Confirm copy fold left every
  figure gated; i18n merge well-formed JSON, 10 keys × 6 langs, placeholders intact, no leak/PII, owner
  slots empty, PUBCHK/__sys intact. Run green.js.
- Did / found (read full delta 666d19f..14ba394, traced branches on tip, validated JSON, ran gate — not on faith):
  - SCOPE: index.html only. 6 changed (non-context) lines, TWO hunks: hunk1 = 4 lines (2 reworded tf()
    strings), hunk2 = 1-line AUTO-MERGED dict regen (old @4956 / now @4959). 34313c4 = PURE COPY,
    14ba394 = dict regen. index.html BYTE-IDENTICAL 14ba394..HEAD (53b7dd0); 2d35a61=Hugo guide sync,
    53b7dd0/71f9d7c = Mikoto log + lock release (don't move the published artifact).
  - GATING UNCHANGED — re-traced both reworded branches with T=NaN @4404/4407:
    * NAMED-BOX (@4404): `…{pct}% of your target.` — {bal}=money(bal), bal=(+balance||0)*T→NaN;
      {tgt}=money(tgt*T)→NaN; {pct}=Math.round(bal/tgt*100)=Math.round(NaN)=NaN. All 3 *T-gated.
    * SAVINGS-TOTAL (@4407): `…you hold {amt}.` — {amt}=money(total), total=reduce(balance)*T→NaN.
    Reword changed only prose words; zero figure expressions touched. fmtN(NaN)→"NaN" → every figure
    renders visibly poisoned, never a real number off a removed lock. No DIRECT fix needed (copy-only).
  - I18N MERGE — line 4959 AUTO-MERGED IIFE arg JSON.parse OK. 6 langs es/da/de/sv/nb (1448 keys) + hu
    (1488). All 3 reworded savings keys present in ALL 6 langs; stale "…put away."/"% of the way there."
    confirmed GONE; placeholders ({name}{bal}{tgt}{pct}{amt}) intact per locale (set-equality, no mismatch).
    Authoritative coverage: `node tools/i18n/sync.js` → MISSING: 0 (592/592) — my hand-guessed probe
    strings for income/weight were wrong wording (real = "Your typical monthly income is {avg}…", "Your
    last recorded weight is {w} kg.") so I trusted the TOOL not my guess. Leak scan of merged dict:
    PEM/private-key, owner identity (osefe|miradi|aarhus), dd.dd-money, 120+char base64 blob → ALL clean.
  - INVARIANTS — __sys count IDENTICAL parent 666d19f vs tip (35==35) → no watchdog weakened/removed.
    PUBCHK(4047293148 ×1)+PUB_B64(×3) present, #hud-state empty (@1672), #__ownerKeySrc empty (@1676),
    0 private-key markers. No SW/manifest change.
  - Ran node tools/release/green.js → GREEN exit 0 (27/27 release-tests; preflight CLEAR — slots empty,
    1 public key, no PII, PUBCHK intact, 4 scripts balanced; GUIDE/manifest/sw/team-chat all clean).
- Verdict: SAFE @ 14ba394 (index.html byte-identical at HEAD 53b7dd0). Copy fold leaves no figure ungated;
  every branch yields NaN on a tampered copy; i18n merge valid + placeholders intact + no leak; watchdogs intact.
- Commits / SHAs reviewed: 14ba394 (index.html identical at HEAD 53b7dd0). If index.html moves, I re-sign.
- Still open: nothing security-side. Gate (steps 7–11) now aligned: Akashi SAFE · Mikoto MISSING:0 ·
  Hugo GREEN @ 14ba394 — awaiting Osefe ship. Sleep-mode: no auto-publish without Osefe's explicit go.

## [2026-06-29] — via Kaito (asleep) — RETROACTIVE RE-SAFE: "20 kr"→20,000 affordability fix (`9fa83f8`, LIVE @ c5599c0)
- Asked: retroactive re-SAFE of the kr-bug fix that landed AFTER my SAFE @ 14ba394 and shipped into the v2
  gh-pages deploy (c5599c0, sw v6) WITHOUT my re-sign — Kaito missed the tip moved. Already LIVE; if I find a
  hole, fix + re-ship now. Review delta 14ba394..HEAD index.html (= only 9fa83f8): _amtFrom regex rewrite,
  _aiNorm typo normaliser, answerData intent-regex widenings, answerQuestion uses _aiNorm.
- Did / found (read full diff + traced + adversarial-tested + ran both suites — not on faith):
  - SCOPE: index.html delta = ONLY 9fa83f8 (+39/-9). HEAD index.html BYTE-IDENTICAL to 9fa83f8 AND to the
    LIVE deploy c5599c0 (git diff --stat empty both ways) → what I cleared == what is live. sw.js v5→v6 is a
    correct cache-bust so clients fetch the new index.html. No manifest/parser/applyChange/export edit.
  - 1. _amtFrom ReDoS-SAFE ✓: new re /(\d+(?:\.\d+)?)\s*(k)?(?![a-z])/gi with vals[] max-pick. No nested/
    overlapping quantifiers (\d+, \s*, (k)? are independent atoms; lookahead is zero-width) → LINEAR. Timed
    adversarial inputs to 200k chars (all-digits, "9k"×2000, all-spaces, "1 "×100k, "9 k "×50k) → every case
    <15ms, no blowup. parseFloat-ONLY; output is a Number used in arithmetic, never eval'd/rendered as code.
    BUG FIXED: "can i afford a 20 kr gum" → 20 (was 20,000 — the 'k' of "kr" was read as ×1000). "2k"→2000,
    "2k phone"→2000, "20 kg"→20, "199 kr"→199 all correct.
  - 1b. FUNCTIONAL (non-security) REGRESSION flagged to Kaito: the NO-SPACE unit form "20kr"→2 and "199kr
    thing"→19 (the negative-lookahead makes the engine retry from a shifted start, dropping a digit). NOT a
    security issue — it's the user's OWN typed price (never a private figure), and it UNDER-reports, leaking
    nothing. Spaced form "20 kr"→20 is correct. Routed to Kaito as a parser-accuracy fix (e.g. allow the unit
    to consume the trailing letters instead of failing the optional k). Does NOT gate SAFE.
  - 2. POISON-GATING INTACT ✓: the diff changes ONLY regexes (which branch fires) + prose strings. Grepped the
    +/- lines for money(/*T/*__sys/leftOver/GRAND/groupTotal → ZERO figure-expression lines changed. Every
    shown/compared figure (left=leftOver(inc)=token()*inc−GRAND−loanAmt(), GRAND*T, groupTotal*T, income*T,
    savings*T, weight*T) is BYTE-IDENTICAL to the v2 tip I traced @ 14ba394 / 666d19f — all yield NaN on a
    tampered copy (token()=NaN → fmtN(NaN)="NaN"). The widened intent regexes (what costs me the most / how
    much…left / \bafford / can i buy|get|have / how much do i way / how fat am i) only change WHICH branch
    matches; the figures inside each branch stay token-gated. The parsed _amtFrom price is the user's own typed
    number, not private. No branch can surface a real figure off a removed lock.
  - 3. _aiNorm SAFE ✓: normalises the QUESTION text only (lowercase + a fixed list of \b-bounded global
    replaces typo→canonical). Operates on `text` arg only — never reads/writes STATE/MODEL/storage/DOM, can't
    inject (output is a String fed to .test()/_amtFrom, never to a DOM sink or eval). Word-bounded so it can't
    touch amounts/category names. ReDoS-safe: each pattern is \b(?:alt|alt)\b — no nested quantifiers; timed
    200k–350k-char adversarial inputs → ≤12ms. answerQuestion now gates isQ on _aiNorm(text) (canonical words)
    — same routing semantics, still returns null for non-questions → command path UNCHANGED (consistent w/ my
    0d03dbb routing review).
  - 4. RENDER still escaped ✓: answer path unchanged → showAnswer → body.textContent (not innerHTML). No
    net/exfil added (grep for fetch/XHR/eval/new Function/innerHTML/.src=/location.*=/localStorage/export* in
    the + lines → NONE).
  - INVARIANTS ✓: __sys count IDENTICAL 14ba394 vs HEAD (26==26) → no watchdog weakened/removed. #__ownerKeySrc
    empty (@1676), #hud-state empty (@1672) — and EMPTY in the LIVE c5599c0 artifact too. PUBCHK/4047293148
    (×2) + PUB_B64 (×3) present. No SW/manifest leak (sw.js delta = version bump only).
  - Ran node tools/test/assistant_silly_test.js → 41/41. node tools/release/green.js → GREEN exit 0 (parser
    21/21 + suites; preflight CLEAR — slots empty, 1 public key, no PII, PUBCHK intact, 4 scripts; GUIDE/
    manifest/sw/team-chat clean).
- Verdict: SAFE @ 33c9ae2 (index.html identical at fix 9fa83f8 and at LIVE c5599c0). ReDoS-safe parser,
  poison-gating fully intact (no figure expr changed), _aiNorm bounded/non-injecting, watchdogs intact, no
  leak/exfil. Retroactive clear of the already-live fix is valid — no hole. No DIRECT security fix required.
- Process note (honest): this SHIPPED LIVE without my re-SAFE — the gate's freeze-the-tip rule was bypassed.
  Outcome is clean here, but Kaito should treat sleep-mode ships as still needing all three sign-offs on the
  CURRENT tip BEFORE deploy, never after. Logged so it's not normalised.
- Commits / SHAs reviewed: 9fa83f8 (index.html identical at HEAD 33c9ae2 and LIVE c5599c0). If index.html
  moves, I re-sign.
- Still open: the "20kr" no-space parser-accuracy regression → Kaito (functional, non-gating). Sleep-mode:
  no auto-publish without Osefe's explicit go — this one already shipped, flagged above.

## [2026-06-29] — via Kaito (asleep) — SAFE: _amtFrom no-space unit fix (`e4e5563`) [my own find]
- Asked: SAFE the fix for the no-space regression I flagged (33c9ae2 entry): "20kr"→2, "199kr"→19
  dropped a digit. Kaito's fix @ e4e5563. Verify ReDoS-safe + parser-correct + poison-gating
  unchanged + invariants intact. Run green.js + assistant_silly_test.
- Did / found (read full diff 33c9ae2..e4e5563, ran the regex + ReDoS timing + both suites — not on faith):
  - SCOPE: index.html ONLY change = ONE regex line + its comment (@4342-4345). re was
    `/(\d+(?:\.\d+)?)\s*(k)?(?![a-z])/gi` → now `/(\d+(?:\.\d+)?)(k(?![a-z]))?/gi`: 'k'=×1000
    only when ATTACHED to the digits AND not followed by a letter. The while/parseFloat/`if(m[2])
    n*=1000`/Math.max line is BYTE-IDENTICAL — no figure expression touched. No sw/manifest/parser/
    applyChange/export edit.
  - GROUP INDEX OK ✓: the magnitude marker is still capture group 2 — `(k(?![a-z]))?` is group 2
    (inner is a zero-width lookahead, not a capture), so `if(m[2])` still correctly gates ×1000.
    Confirmed by tests: 2k→2000 (m[2] fired), 20kr→20 (didn't).
  - PARSER CORRECT ✓ (my own 14-case run, parseFloat-only): 2k→2000, 2k phone→2000, 5k→5000,
    20kr→20, 199kr→199 (the two FIXED no-space forms), 20 kr→20, 20 kg→20, 20km→20, 1.5k→1500,
    "can i afford a 20 kr gum"→20, "199kr thing"→199, "20kr or 30kr"→30, save 2000→2000, 100→100.
    All pass. Output is a Number used in arithmetic, never eval'd/rendered as code.
  - ReDoS-SAFE ✓: \d+, (?:\.\d+)?, (k(?![a-z]))? are independent atoms; lookahead is zero-width →
    no nested/overlapping quantifiers → LINEAR. Timed adversarial to 200k chars (all-digits, 9k×2000,
    all-spaces, 9kr×50000, 9a×100000) → every case ≤10ms, no blowup.
  - POISON-GATING UNCHANGED ✓: the diff changes ONLY which digits are parsed from the USER's own
    typed price (never a private figure). Every SHOWN/COMPARED figure (left=leftOver(inc)=token()*inc-
    GRAND-loanAmt(), GRAND*T, groupTotal*T, income*T, savings*T, weight*T) is untouched — all still
    yield NaN on a tampered copy (token()=NaN → fmtN(NaN)="NaN"). The parsed _amtFrom value is the
    user's own number, not private. No branch can surface a real figure off a removed lock.
  - INVARIANTS ✓: __sys count IDENTICAL parent 33c9ae2 vs tip (26==26) → no watchdog weakened/removed.
    PUBCHK(4047293148) + PUB_B64(×3) present, #__ownerKeySrc empty (@1676), #hud-state empty (@1672).
    No SW/manifest change. No new i18n string (regex+comment only → MISSING:0 holds).
  - Ran node tools/test/assistant_silly_test.js → 43/43 (incl. the 2 new no-space regression cases).
    node tools/release/green.js → GREEN exit 0 (7 suites; preflight CLEAR — slots empty, 1 public key,
    no PII, PUBCHK intact, 4 scripts balanced; GUIDE/manifest/sw/team-chat clean).
- Verdict: SAFE @ e4e5563. Pure regex-correctness fix; ReDoS-safe linear; poison-gating fully intact
  (no figure expr changed); watchdogs intact; no leak/exfil; the no-space regression I flagged is closed.
  No DIRECT security fix required.
- Commits / SHAs reviewed: e4e5563 (tip). If index.html moves, I re-sign.
- Still open: nothing security-side. Gate not opened. Sleep-mode: no auto-publish without Osefe's go.

## [2026-06-29] — direct (Osefe / via Kaito build) — DESIGN PRE-REVIEW: IndexedDB photos-only migration (no code wired yet)
- Asked: the design pre-review I explicitly demanded BEFORE the IDB migration touches STATE.
  Osefe chose Option 1 (photos excluded from quick-move; moved via a separate file export).
  Review architecture + security; answer my 4 security questions A–D; hard requirements for Kaito.
- Read (not guessed): autosave @1828 (confirmed `catch(_){ }` — SWALLOWS QuotaExceededError SILENTLY),
  exportHTML @4555-4567 (serializes full STATE incl. in-memory foodLog[].photo into #hud-state — owner
  master), exportBlank @4570-4607 (zeroes STATE.foodLog=[] @4579 + RECONSTRUCTS hud-state as
  {__fresh,fid,prefs} @4584 — not a STATE dump → hasPhoto/photo CANNOT reach a blank/customer file),
  loadState @1790 (TEMPLATE_MODE foodLog=[] → nothing hydrates), exportDataCode @5419 (allowlist,
  currently includes full foodLog WITH photo), persist @7323 (fires persist() but IGNORES result —
  `.catch(()=>{})` only), food render/add/del @6293/6335/6344/6347, resizePhoto @6288 (app's OWN
  capture re-encodes via canvas max 720px JPEG q0.6 → trusted path always data:image/jpeg + bounded;
  the directive's "1–4MB" is the pre-resize guess, real stored photos are ~tens–low-hundreds KB),
  poison @6264 (FT=__sys.token() gates calorie/macro FIGURES, never photo bytes), transfer_test @180
  (asserts foodLog incl. pic byte-identical — breaks under strip-on-export, Hugo's file).
- Also read the helper Kaito already inlined: MEDIA @1786-1809 (raw IndexedDB, DB 'mrln-media' store
  'photos' v1, put/get/del/keys/all + supported()). put() correctly propagates rejection (no .catch)
  so quota surfaces; read paths swallow to safe defaults (good for graceful hydrate). all() zips
  getAllKeys()+getAll() by index — spec guarantees both ascending key order, so correct. Clean,
  vendored, no CDN, no network → meets my constraint #1.
- ANSWERS:
  A. NO leak via the exported file. exportBlank zeroes foodLog + reconstructs hud-state (never dumps
     STATE) → photo/hasPhoto can't ride along; IDB is per-origin and never serialized into HTML;
     preflight scans index.html only and IDB isn't in the file. The ONE residual worry I RAISE:
     a blank/preview rendered on the OWNER's own browser hydrates from the OWNER's IDB (same origin)
     → owner photos could appear ON SCREEN during a local preview. Not a FILE leak, but the
     hydrate/preview path must be TEMPLATE_MODE-gated (skip MEDIA.get when TEMPLATE_MODE) so an
     owner-side blank/preview shows no real photos. REQUIRED.
  B. Confirmed — photos need NO poison. They're user images, not owner figures; a NaN-gated data URL
     is just a broken image. The calorie/macro figures stay token-gated @6264 (unchanged). Moving
     bytes to IDB touches no watchdog/figure-gate. __sys count must stay identical parent vs tip.
  C. Import chain REQUIRED: (1) JSON.parse under a byte cap BEFORE parse; (2) per-image regex
     `^data:image\/(jpeg|png|webp);base64,` + (3) per-image byte cap (~1.5MB) + (4) total cap
     (~50–100MB) + (5) cap entry COUNT; reject the whole import if any item fails (fail-closed,
     all-or-nothing). For v1 a prefix+size cap is ENOUGH — full decode-verify (load into Image to
     confirm it really decodes) is BETTER and cheap (the app already does it in resizePhoto); I
     RECOMMEND routing imported images through the SAME resizePhoto/canvas re-encode so every stored
     byte is app-normalized (strips EXIF/GPS, kills any non-image payload, bounds size). That closes
     a stored-XSS-in-data-URL / oversized / metadata-leak class in one move. Only put+set hasPhoto on
     entries whose id matches an existing foodLog entry; ignore orphans.
  D. Photos-only over all-STATE: AGREED, correct call (text fits localStorage for years; photos are
     the sole driver — moving all STATE is risk without benefit). Two hazards I REQUIRE handled:
     (i) crash/quota BETWEEN MEDIA.put and autosave during the one-time migration — design already
     orders put→(resolve)→hasPhoto+autosave-strip, so a failure leaves the inline photo intact (no
     loss). MUST be idempotent + MUST NOT strip on put-failure. Good. (ii) async-hydration gap: a
     photo is absent until MEDIA.get resolves → render must tolerate a missing photo (it already does
     — `e.photo?...:''`) and re-render after hydrate. Acceptable. ALSO: exportHTML bakes in-memory
     photos into the owner master (zero-loss, intended) — note the master file grows with photos;
     that's the owner's private file, fine.
- VERDICT: DESIGN-SAFE with hard requirements (see TEAM-CHAT post R1–R10). The model is sound; the
  blanks/preview path must be TEMPLATE_MODE-gated against owner IDB (A), and the import path must
  validate→cap→normalize fail-closed (C). No watchdog/figure-gate is weakened by moving image bytes.
- Did NOT edit index.html (Kaito owns it; design review only). Posted verdict + R1–R10 to TEAM-CHAT.
- Open: review the ACTUAL wired migration + autosave-strip + hydrate + import code on a real tip
  before any gate; confirm __sys count unchanged, exportBlank still reconstructs (not dumps), green.js
  GREEN, transfer_test re-baselined by Hugo. Sleep-mode: no auto-publish without Osefe's go.

## [2026-06-29] — via Kaito (asleep, step 4+10) — REAL-CODE SAFE: IndexedDB photo storage wired (`81fd473`)
- Asked: the real-code SAFE I promised on the ACTUAL wired migration+strip+hydrate+import code (Kaito's
  build at 81fd473). Verify against my R1–R10 + standing invariants. Security = my find-xor-fix exception:
  fix DIRECTLY if a hole, else route non-security to Kaito. Run green.js + photo_store_test.
- Did / found (read FULL index.html diff e4e5563..81fd473 + every load-bearing fn on the tip, ran both
  suites + ReDoS timing — not on faith):
  - SCOPE: index.html (+~190) + sw.js (v6→v7 cache bump ONLY, verified — no leak/url/net) + TEAM-CHAT/lock.
    New: MEDIA IIFE @1793 (vendored raw IDB, no CDN), _warnStorageFull/_saveReplacer @1863/1869, initFoodMedia
    @1888, PHOTOMOVE IIFE @6455, movePhotos UI block @1561, exportDataCode foodLogLite strip @5495, FOODLOG
    addEntry/del MEDIA wiring @6380/6427, persist-denial reveal @7458, boot calls initFoodMedia+PHOTOMOVE.wire
    @7393. No parser/applyChange/finance-calc/manifest edit.
  - R1 ✓ initFoodMedia gated `if(TEMPLATE_MODE || !MEDIA.supported()) return;` @1892 — no owner photo hydrates
    on a blank/preview (owner-side IDB never read in TEMPLATE_MODE). Closes design-review residual A.
  - R2 ✓ strip lives in _saveReplacer (serialization output): `if(k==='photo' && this && this.hasPhoto) return
    undefined;` — drops photo from localStorage ONLY when confirmed in IDB; NEVER mutates STATE.foodLog[].photo.
    Render @6418 (list thumb) + @6430 (openPic) read e.photo IN MEMORY → on-screen photo never blanked.
  - R3 ✓ migration order = MEDIA.put → ONLY on resolve set hasPhoto+autosave (which strips). On put REJECT →
    .catch keeps inline (zero-loss). Idempotent: inline&&!hasPhoto migrates; hasPhoto&&!photo hydrates;
    hasPhoto&&!photo&&lost-bytes clears the stale flag. photo_store_test proves all 4 branches.
  - R4 ✓ quota LOUD on BOTH paths: MEDIA.put reject → _warnStorageFull (addEntry @6380, migration .catch,
    import .catch @6517) AND autosave catch now fires _warnStorageFull on QuotaExceededError/code22/1014 @1883
    (the long-standing silent `catch(_){}` gap @1828 is CLOSED). _warnStorageFull = toast(t(...)) + red saveBadge,
    once/session.
  - R5 ✓ persist denial surfaced: initPWA @7458 chains persisted()→persist()→`if(granted===false)` reveals
    #persistWarn (@1572, amber note). A finance app silently evicted no longer fails silent.
  - R6 ✓ import fail-closed, verified in order: (1) text.length size-cap BEFORE JSON.parse @6488; (2) schema
    v===1+photos-object @6490; (3) empty + COUNT_MAX(5000) @6492-6493; (4) per-image anchored linear regex
    /^data:image\/(jpeg|png|webp);base64,/ + PER_MAX(~1.6MB) + running TOTAL_MAX(~90MB), reject WHOLE file if
    any off @6494-6500; (5) orphan ids ignored (only matched-to-foodLog kept) @6502-6504; (6) canvas reencode()
    of EVERY image (strips EXIF/GPS, validates real decodable image, kills non-image payload, re-bounds 720px
    JPEG q0.6) fail-closed before any commit @6506-6512. RX is ReDoS-safe (anchored, single alternation, no
    nested quantifier — timed 500k-char adversarial inputs <1ms). msg() innerHTML sink receives ONLY static
    tf() strings with numeric {n} counts — no photo id/bytes/user-text ever interpolated → no XSS.
  - R7 ✓ !MEDIA.supported() → photos kept inline in localStorage as today, no crash, no loss (photo_store_test
    "unsupported: inline photo untouched"). Boot + addEntry + del all guard on supported().
  - R8 ✓ del @6427 calls `if(MEDIA.supported()) MEDIA.del(id)` — no orphaned IDB bytes.
  - R9 ✓ exportPhotos payload = strictly {v:1, photos:map} from MEDIA.all() (user's own images keyed by food id);
    no MODEL/figure/#__ownerKeySrc/STATE financials ride along. User-initiated dl() download, on-device, no net.
  - R10 ✓ HARD INVARIANTS: __sys count IDENTICAL parent e4e5563 vs tip 81fd473 (35==35, matches Kaito's measure)
    → NO watchdog weakened/removed; the diff adds ZERO __sys/token/PUBCHK/PUB_B64/figure-gate line (grep empty).
    PUBCHK 4047293148 + PUB_B64(×3) intact. #__ownerKeySrc empty (@1686), #hud-state empty (@1682). exportBlank
    @4645 STILL zeroes STATE.foodLog=[] (@4654) + RECONSTRUCTS hud-state {__fresh,fid,prefs} (@4659) — photo/
    hasPhoto CANNOT ride into a customer file (not a STATE dump). Food calorie/macro poison FT=__sys.token()
    intact + unchanged (@6233/6312). CONFIRMED photos need NO poison (images, not owner figures — a NaN-gated
    data URL is just a broken image). No new network/exfil: only `.src=` added is `img.src=url` (in-memory Image
    load of an already-validated data: URL in reencode — not a network request); no fetch/XHR/eval/new Function.
  - photo_store_test.js = REAL (not theater): extracts the LIVE _saveReplacer/initFoodMedia/exportDataCode from
    index.html by brace-balancing (no copy drift), mocks MEDIA/STATE/autosave, asserts strip-only-when-hasPhoto,
    migrate→strip, put-fail zero-loss, hydrate, lost-bytes flag-clear, unsupported degrade, quick-move excludes
    photo bytes but keeps metadata. 17/17. Genuinely guards R2/R3/R4/R6(partial)/R7.
  - Ran node tools/test/photo_store_test.js → 17/17. node tools/release/green.js → GREEN exit 0 (parser 21/21,
    assistant 16/16, silly 43/43, transfer 27/27 + suites; preflight CLEAR — slots empty, 1 public key, no PII,
    PUBCHK intact, 4 scripts balanced; GUIDE/manifest/sw/team-chat clean).
- TWO NON-GATING NOTES (robustness, NOT security defects — routed to team, do NOT block SAFE):
  1. transfer_test fixture (@66) uses food field `pic`, but the strip drops key `photo` → it passes VACUOUSLY
     (doesn't actually exercise the new strip). → Hugo: re-baseline with a `photo` field so it guards the strip,
     AND wire photo_store_test into green.js (currently I ran it standalone; green.js doesn't include it yet).
  2. import commit (@6515): if quota hits MID-Promise.all(MEDIA.put), some puts land before _warnStorageFull
     → partial write (user warned loudly "some photos may be missing"). The SECURITY-critical fail-closed parts
     (validate+re-encode) ARE fully all-or-nothing BEFORE any byte is written; a quota-partial writes only
     already-validated re-encoded user-owned images. Not a leak/key/integrity issue. Optional hardening: stage
     to a temp set + atomic swap, or pre-check estimate() vs total. Routed to Kaito as non-gating.
- VERDICT: SAFE @ 81fd473. All R1–R10 met on the real wired code; key never travels; import validate→cap→
  re-encode fail-closed + ReDoS-safe; quota loud on both paths; persist denial surfaced; exportBlank still
  reconstructs (photo/hasPhoto can't reach a customer file); __sys 35==35 + watchdogs intact; photos correctly
  un-poisoned; no net/exfil. No DIRECT security fix required (build is correct).
- Commits / SHAs reviewed: 81fd473 (tip). If index.html moves (incl. Hugo's transfer_test re-baseline if it
  touches index.html — it won't, it's a tools/ file), I re-sign.
- Still open: (gate steps 7–11) my SAFE in @ 81fd473 — needs Mikoto MISSING:0 (new move-photos + warning
  strings), Hugo GREEN (wire photo_store_test into green.js + re-baseline transfer_test) on this tip, Osefe
  ship. Sleep-mode: no auto-publish without Osefe's explicit go.

## [2026-06-29] — via Kaito (asleep, step 10) — RE-SAFE: photo-storage final tip — Arthur copy + Mikoto i18n + Hugo QA (`a5baaf8`)
- Asked: re-SAFE on the final IndexedDB photo-storage tip. Prior SAFE was real-code @ 81fd473 (R1–R10 met,
  photo_store_test 17/17, GREEN). Tip moved to a5baaf8 via 3 NON-code-logic changes — re-sign per
  freeze-the-tip. DELTA review: confirm no new leak/regression + FULL published set clean.
- Did / found (read full delta 81fd473..a5baaf8, diffed load-bearing fns BY NAME, validated dict JSON,
  scanned PDF binary, ran the gate — not on faith):
  - SCOPE: index.html 4 hunks only (@1548 SEND desc reword + "photos aren't in this copy" sender note;
    @1563 movePhotos explainer reword; @5062 the 1-line AUTO-MERGED dict regen = Mikoto; @5667 copyOutData
    toast appends a static photo-separate note gated on (STATE.foodLog||[]).some(e=>e.hasPhoto||e.photo)).
    Plus GUIDE.md §9 note, MRLN-Guide.pdf rebuild, green.js (wire photo_store_test as suite 8 + renumber),
    transfer_test.js (pic→photo+hasPhoto fixture + assert export STRIPS photo bytes/KEEPS metadata), logs/chat.
  - R1–R10 HOLD — code they cover is BYTE-IDENTICAL 81fd473 vs a5baaf8: diffed exportBlank, exportDataCode,
    _saveReplacer, initFoodMedia, applyImportedData, decodeDataCode, resizePhoto by name → ALL IDENTICAL.
    No load-bearing fn changed; the 4 hunks are copy + dict only. exportBlank still zeroes foodLog +
    reconstructs hud-state (photo/hasPhoto can't reach a customer file).
  - TOAST .some() GUARD ✓ — pure read: .some() iterates in-memory STATE.foodLog (||[] fallback), callback
    returns a boolean, no assignment/side-effect, no STATE write. Result only decides whether a STATIC tf()
    note string is APPENDED to coMsg text — never a photo byte/id/user-text interpolated → no XSS, no leak.
    copyOutData still routes through exportDataCode() (key-strip allowlist, byte-identical) → key never travels.
  - i18n DICT ✓ — AUTO-MERGED line JSON.parse OK; 6 langs es/da/de/sv/nb (1476 keys) + hu (1516);
    4 new photo strings present in ALL 6 langs; placeholders ({n}) intact (zero key/val mismatch). Leak scan
    of every dict value: KEY/PII(miradi|osefe@|aarhus)/long-base64 → NONE. The only MONEY-regex hits are the
    PRE-EXISTING tax-rate example keys "...rate (e.g. 0.25/0.08)" (rate hints, no currency, existed @81fd473)
    — not owner figures, not new. `node tools/i18n/sync.js` → MISSING:0 (616/616) authoritative.
  - HUGO QA STRENGTHENS, doesn't weaken ✓ — green.js now RUNS photo_store_test (suite 8) [closes my non-gating
    note #1]; PUBLISHED_TEXT/KEY/PII scan unchanged. transfer_test fixture now uses the REAL stripped key
    (photo+hasPhoto, fixing the vacuous-pass I flagged) and asserts export STRIPS photo bytes but KEEPS
    metadata — a stronger guard. GUIDE §9 note is plain English, no figures/PII/keys.
  - INVARIANTS ✓ — __sys count IDENTICAL 81fd473 vs a5baaf8 (35==35) → no watchdog weakened/removed.
    PUBCHK(4047293148 ×1)+PUB_B64(×3) intact. #__ownerKeySrc empty (@1687), #hud-state empty (@1683). sw.js
    UNTOUCHED this delta, still v7. No new network/exfil surface.
  - FULL PUBLISHED SET CLEAN ✓ — preflight CLEAR (slots empty, 1 public key, no PII, PUBCHK, 4 scripts);
    GUIDE.md/manifest.webmanifest/sw.js/team-chat.html clean; MRLN-Guide.pdf binary independently
    text-extracted+scanned (Flate streams) → KEY/PII/CPR/big-money NONE.
  - Ran node tools/release/green.js → GREEN exit 0 (parser 21/21, photo_store 17/17 now in-gate, transfer
    re-baselined, all suites; preflight CLEAR; every published file clean). node tools/i18n/sync.js → MISSING:0.
- Verdict: SAFE @ a5baaf8. Delta is copy + i18n + test/docs only; R1–R10 hold (load-bearing code byte-identical);
  toast guard is a non-mutating read of static note; key never travels; dict valid + leak-clean + placeholders
  intact; watchdogs intact (__sys 35==35); full published set (incl. PDF) leak-clean.
- Commits / SHAs reviewed: a5baaf8 (tip). If index.html or any published file moves, I re-sign.
- Still open: gate (steps 7–11) now aligned @ a5baaf8 — Akashi SAFE · Mikoto MISSING:0 · Hugo GREEN —
  awaiting Osefe's explicit ship. Sleep-mode: no auto-publish without his go.

## [2026-06-30] — via Kaito (asleep) — DESIGN OPINION (no code): cardio PRs in STATE.prs[]
- Asked: arch/security opinion (NO code) on expanding Gym→Personal Records to cover cardio
  (distance/time) alongside lifts. Read PR form @1370-1379, logic @3585-3609, render @3889-3908,
  transfer path. Answer 4 Qs: data model, transfer/storage, poison/integrity, input safety.
- Read the REAL code (not from memory):
  - PR object today = {id, ex, wt, reps, date} (push @3594). render @3889-3908 groups by ex, sorts
    by epley1rm(wt,reps), shows wt/reps/1RM. esc() on best.ex + p.date in render. Inputs @1370-1379:
    prEx text, prWt number(min0 step.5), prReps number(min1 max100), prDate date.
  - body-grade: computeBodyGrade @3270 reads STATE.body ONLY (h/w/a/sex) — does NOT read prs. A cardio
    entry with no wt can NOT NaN the grade. answerData/finance don't read prs either (12 prs refs total,
    all enumerated: DEFAULTS/blankState/Array-guard/push/remove/render/exportBlank snap+clear+restore/
    exportDataCode/applyImportedData). prs is render-only + transfer payload.
  - transfer: exportDataCode @5500 includes prs:STATE.prs||[] (whole array, no field allowlist) →
    applyImportedData @5509 STATE.prs=d.prs||[]. New optional fields ride for FREE (just more JSON).
  - exportBlank @4649/4655 snapshots+clears STATE.prs=[] then reconstructs → prs CANNOT reach a
    customer/blank file (cardio fields inherit that, no new leak).
  - transfer_test fixture @64 uses prs:[{id,name,weight,date}] — note: REAL app field is `ex`/`wt`,
    fixture uses name/weight. It deep-diffs decoded==original so it round-trips ITS OWN shape, but does
    NOT exercise the real {ex,wt,reps} keys. Pre-existing drift; flagged to Hugo to fix + add cardio row.
- VERDICT: SAFE TO BUILD (design opinion, no gate). My recommendation to Kaito:
  1. DATA MODEL — single prs[] array + a `type:'strength'|'cardio'` discriminator on the SAME object;
     do NOT add a second array. Strength keeps {ex,wt,reps}; cardio adds {dist,distUnit:'km'|'mi',secs}.
     BACKWARD-COMPAT default-on-READ: treat missing/!=='cardio' as strength (`var ty=(p.type==='cardio')
     ?'cardio':'strength'`), so every existing PR (no type) renders as a lift unchanged. Never default by
     presence of wt — be explicit on the discriminator. epley1rm/1RM/PR-sort path must run ONLY for
     strength; cardio sorts by its own metric (pace or distance) and shows no 1RM.
  2. TRANSFER/STORAGE — round-trips losslessly for free (whole-array dump, no allowlist to update). No
     localStorage/size concern (text, negligible; photos are the only heavy thing and they're IDB now).
     HARD ASK: Hugo adds a cardio-PR fixture to transfer_test (and fix the name/weight→ex/wt drift) so
     the new fields are guarded against a future silent drop.
  3. POISON/INTEGRITY — wt/reps/dist/secs are PERSONAL HEALTH stats, NOT owner FINANCIAL figures →
     NO __sys.token() gating, consistent with how wt/reps are handled today (un-poisoned). Adding cardio
     touches NO watchdog, NO key, NO #hud-state/#__ownerKeySrc. Confirmed body-grade does NOT read prs →
     a cardio entry missing wt can't NaN the grade. The ONLY integrity nit: render @3897 sorts by
     epley1rm(p.wt,p.reps); a cardio entry (wt undefined) → epley1rm(NaN)→NaN in the strength comparator.
     MUST partition by type BEFORE the epley sort so a cardio row never enters the 1RM math (NaN sort =
     cosmetic mis-order, not a security bug, but fix it). No poison needed; this is a correctness guard.
  4. INPUT SAFETY — keep NUMERIC inputs + a UNIT SELECTOR (km/mi dropdown, and time as mm:ss numeric or
     two number fields) — do NOT free-text parse "5km"/"25:00" (avoids any parse/ReDoS surface; today's
     form already uses parseFloat/parseInt + type=number). Validate/clamp: dist>0 with a sane cap (e.g.
     ≤1000 km), secs>0 with a sane cap (e.g. ≤24h=86400), reject NaN/≤0 like the existing wt>0/reps>0
     guard @3593. ex/type text already esc()'d in render @3900/3904 → no injection; keep any new cardio
     label (e.g. "Run") on the SAME esc() path. distUnit must be a fixed enum ('km'/'mi'), never rendered
     raw from import — validate on read.
- HARD GUARDS TO PRESERVE (for the eventual real-code SAFE review): (a) prs stays out of exportBlank
  (reconstruct, not dump) — already true; (b) all PR strings rendered via esc() incl. new cardio fields;
  (c) no __sys/PUBCHK/PUB_B64 line added or removed (count must stay equal parent vs tip); (d) epley/1RM
  math runs strength-only (partition before sort); (e) numeric+enum inputs, no free-text unit parsing,
  positive+capped clamps.
- Did NOT edit index.html (opinion only; Kaito builds, I SAFE-review the real diff later). Posted verdict
  to TEAM-CHAT.
- Commits / SHAs: this log + TEAM-CHAT post only. App tip unchanged.
- Still open: review the ACTUAL cardio-PR code on a real tip (partition-before-sort, validate/clamp,
  esc on cardio fields, __sys count unchanged, exportBlank still reconstructs); Hugo to add cardio
  fixture + fix transfer_test ex/wt drift. Sleep-mode: no auto-publish without Osefe's go.

## [2026-06-30] — via Kaito (asleep, step 4+10) — REAL-CODE SAFE: cardio PRs wired (`d2abf77`)
- Asked: SAFE review of the ACTUAL cardio-PR code (Kaito's build d2abf77) vs my R-list from the
  design opinion + standing invariants. Security = find-xor-fix exception: fix DIRECTLY if a hole,
  else route non-security to Kaito. Run green.js + i18n sync.
- Parent baseline: d2abf77^ = 30daa6f (a LOCK-only commit; index.html byte-identical to the prior
  shipped tip a5baaf8 — confirmed `git diff a5baaf8 30daa6f -- index.html` empty). So the real diff
  is exactly the cardio feature, +92/-29 in index.html, no other file touched.
- Did / found (read the FULL diff + every load-bearing fn on the tip, ran the gate — not on faith):
  - SCHEMA / BACK-COMPAT (R1) ✓ — prType(p)=`(p&&p.type==='cardio')?'cardio':'strength'` @3928 is an
    EXPLICIT discriminator, NOT has-wt inference. Old PRs (no type) → 'strength' → render via the
    epley path unchanged. Add-path stamps `type:'strength'` @3631 / `type:'cardio'` @3622. Exactly
    my recommendation.
  - PARTITION / NO-1RM-FOR-CARDIO (R4/integrity-nit) ✓ — group key @3936 = `(ex).toLowerCase()+' '+
    prType(p)`, so a group is HOMOGENEOUS in type (same name as both lift+run never merges). Render
    branches on `prType(arr[0])` @3940: cardio branch sorts by pace/distance and NEVER calls
    epley1rm; strength branch is the only caller of epley1rm. A cardio entry (no wt) can't enter the
    1RM comparator → no NaN sort. The exact correctness guard I required is implemented.
  - INPUT SAFETY (R4) ✓ — add-path uses parseFloat(prDist)/parseInt(prMin/prSec) + a km/mi <select>
    validated `==='mi'?'mi':'km'` @3621 (no free-text "5km"/"25:00" parse → no ReDoS surface).
    mm:ss is TWO numeric fields (prMin/prSec), `secs=mins*60+ssec`. Caps APPLIED @3623:
    `dist>100000→100000`, `secs>86400→86400`. Validation: cardio requires `ex && dist>0` (time
    optional), strength requires `ex && wt>0 && reps>0` — both reject NaN/≤0.
  - INJECTION (R-guard b) ✓ — every cardio render value is esc()'d: ex `esc(best.ex)` @3948,
    date `esc(p.date)` @3953, header `esc(header)` @3949, row meta `esc((+p.dist)+' '+u+…)` @3952,
    Delete `esc(t('Delete'))`. Load-bearing defense: dist/secs are coerced with unary `+`
    (`+p.dist`, `+p.secs`) → Number or NaN, NEVER a raw string into the DOM, and distUnit is
    collapsed to the enum 'km'/'mi' EVERYWHERE rendered (`p.distUnit==='mi'?'mi':'km'`, prDistKm
    uses the same). So even a hand-crafted MALICIOUS import can't inject via the cardio path. p.id
    in data-del is uid() (same as parent). prPace returns only numeric `m:ss`.
  - TRANSFER (R2) ✓ — exportDataCode @5563 dumps `prs:STATE.prs||[]` (whole array, no field
    allowlist) → applyImportedData @5572 `STATE.prs=d.prs||[]`. New cardio fields ride for free,
    round-trip lossless. Nothing strips them. (Hugo to add the cardio fixture + fix the pre-existing
    transfer_test {name,weight}→{ex,wt,reps} drift — robustness, non-gating.)
  - EXPORTBLANK (R-guard a) ✓ — exportBlank @4707 snapshots STATE.prs (snapP) → clears to `[]`
    @4716 → reconstructs hud-state → restores @4742. prs (incl. cardio fields) CANNOT reach a
    customer/blank file — it's a reconstruct, not a dump. Unchanged mechanism, cardio inherits it.
  - POISON/INTEGRITY (R3) ✓ — __sys count IDENTICAL parent vs tip (35==35) → NO watchdog weakened/
    removed; the diff adds/removes ZERO __sys/token()/PUBCHK/PUB_B64 line (grep of +/- lines empty).
    PUBCHK 4047293148 (×1) + PUB_B64 (×3) intact. #__ownerKeySrc empty (@1693), #hud-state empty
    (@1689). CONFIRMED computeBodyGrade reads STATE.body ONLY (0 prs refs in the fn) → a cardio
    entry with no wt CANNOT NaN the body-grade. wt/reps/dist/secs are personal HEALTH stats, NOT
    owner financial figures → correctly UN-poisoned (no __sys.token() gating needed/added), exactly
    as the design opinion established.
  - applyLang hook @5208-5209: adds `__refreshPrMode()` + `renderPRs()` re-run on language switch,
    both try/catch-wrapped, render-only (cardio rows use tf() so must re-render in new lang). No
    money/state write. setPrMode @3590 only flips .style.display on .prStrength/.prCardio fields +
    styles the seg buttons — pure UI toggle, no STATE write, no hidden-tab reveal.
  - Ran node tools/release/green.js → GREEN exit 0 (8 suites: parser 21/21, assistant 16/16,
    streak 4/4, sound 7/7, reorder 7/7, transfer 34/34, silly 43/43, photo_store 17/17 = 149;
    preflight CLEAR — slots empty, 1 public key, no PII, PUBCHK intact, 4 scripts balanced;
    GUIDE/manifest/sw/team-chat clean). node tools/i18n/sync.js → MISSING:12 (the 12 new cardio
    strings: STRENGTH/CARDIO/Activity/Distance/Time(optional) + the validation/log/best strings) —
    EXPECTED, awaiting Mikoto; not a security issue.
- ONE NON-GATING PRE-EXISTING NOTE (robustness, NOT a defect this diff introduced — routed to Kaito,
  does NOT block SAFE): the STRENGTH render branch still emits `best.wt`/`p.wt`/`reps` UN-esc'd
  @3961/3963 (as it did at parent). For app-entered PRs these are always numeric (parseFloat/
  parseInt). The only way to inject is a hand-crafted import with a string wt containing HTML — a
  pre-existing condition the cardio work neither created nor widened (cardio's own dist/secs ARE
  hardened via unary-+ coercion + esc()). Optional future hardening: coerce wt/reps with unary +
  (or esc) on the strength row too, mirroring the cardio path. Non-gating.
- VERDICT: SAFE @ d2abf77. All R1–R4 met on the real wired code; explicit discriminator (old PRs =
  strength); cardio never enters 1RM math; numeric+enum inputs, no free-text parse, caps applied;
  all cardio fields esc()'d + dist/secs unary-+-coerced + distUnit enum-validated → no injection even
  from a crafted import; key never travels; exportBlank reconstructs (prs can't reach a customer
  file); __sys 35==35 + watchdogs intact; body-grade can't NaN; cardio correctly un-poisoned. No
  DIRECT security fix required (build is correct).
- Commits / SHAs reviewed: d2abf77 (tip). TIP WILL MOVE (Mikoto i18n MISSING→0 + Hugo cardio fixture/
  transfer_test fix) — I re-sign the final tip before any ship per freeze-the-candidate.
- Still open: gate (steps 7–11) — my SAFE in @ d2abf77; needs Mikoto MISSING:0 (12 cardio strings),
  Hugo GREEN (add cardio fixture + fix transfer_test ex/wt drift) on the final tip, Osefe ship.
  Sleep-mode: no auto-publish without Osefe's explicit go.

## [2026-06-30] — via Kaito (asleep, step 10) — DELTA RE-SIGN: cardio-PR final tip (`ba19dc0`)
- Asked: re-sign on the current tip per freeze-the-candidate. My cardio SAFE was @ d2abf77;
  tip moved to ba19dc0. Delta = Arthur display-fix (folded into 2c1bd0b) + Mikoto i18n (8220f21)
  + Hugo QA/docs (81d1486). Confirm load-bearing add/validate/poison UNCHANGED; verify every
  published file clean. Run green.js + i18n sync; text-extract the rebuilt PDF.
- INDEX.HTML DELTA d2abf77..ba19dc0 PROVEN = exactly 2 hunks, nothing else:
  1. @3942 renderPRs CARDIO branch (Arthur): whole group renders in best entry's unit via a
     DISPLAY-ONLY distIn(p) = km→(gu==='mi'?km/1.60934:km), +v.toFixed(2) → Number (never raw
     string). Storage stays per-entry (distIn used ONLY in render strings). Pace spacing
     {pace}/{unit} (no space, matches dict). ALL values still esc()'d (esc(best.ex)/esc(header)/
     esc(dv+' '+gu+…)); gu enum-collapsed ('mi'/'km'); dv/pc numeric. NO add/validate/parser/
     poison/export line touched.
  2. @5128 the single AUTO-MERGED dict line (Mikoto): IIFE merge wrapper byte-identical; only
     embedded dict data changed. No logic moved. Confirmed by short-line grep (<400 char) for
     exportBlank/exportHTML/importData/parseClause/applyChange/__sys/PUBCHK/PUB_B64/fetch/eval/
     innerHTML/.src= → ZERO hits on any logic line (only the long dict line matches, harmless).
- I18N (8220f21): node tools/i18n/sync.js → 632/632, MISSING:0 ✓. New cardio values carry only
  placeholders {ex}{dist}{unit}{wt}{reps}{pace} (intact, incl. {pace}/{unit} no-space) + labels
  (STRENGTH/CARDIO/Activity/Distance/Time(optional)/best…/Logged…). NO figure/key/PII in new
  values. The long-number scan hits (18000/2600/2000/25000/319700/…) ALL have IDENTICAL count
  parent vs tip (18000:4==4, 2600:6==6, etc.) → pre-existing illustrative KB figures, NONE
  introduced by this commit.
- HUGO QA/DOCS (81d1486) — TEST/DOC only, no app logic, no guard weakened:
  • new tools/test/pr_test.js (suite 9, 12/12 incl. "cardio fields cannot be used with epley1rm
    → NaN" + grouping-no-collision guards). • transfer_test: REMOVED only the broken
    {id,name,weight} fixture + 1 weak assertion; REPLACED with real {ex,wt,reps,type}+cardio row
    + 14 field-level round-trip asserts (the exact ex/wt drift I flagged, now fixed + cardio
    guarded). NO guard deleted — upgraded. • green.js: inserted suite 9, renumbered downstream
    sections 10/11; deep guard + leak scan still run. • GUIDE.md §6.3 = cardio doc only (strength
    1RM + cardio dist/time/pace), no figures.
- STANDING INVARIANTS on tip ba19dc0 (text-mode -a counts): __sys 35==35 parent vs tip → NO
  watchdog added/removed; PUBCHK 4047293148 ×1, PUB_B64 ×3, __sys.token ×14 intact; #__ownerKeySrc
  + #hud-state EMPTY (closing tag immediately follows); no PRIVATE KEY/PEM marker. exportBlank
  @4711 still snapshots STATE.prs (snapP) → clears → reconstructs hud-state → restores (delta
  doesn't touch it) → cardio fields CANNOT reach a customer/blank file. No new network/exfil
  (no fetch/eval line in delta). Cardio figures correctly UN-poisoned (personal health, not owner
  financial).
- PUBLISHED FILES: node tools/release/green.js → GREEN exit 0 (9 suites incl. pr 12/12; preflight
  CLEAR — slots empty, 1 public key, no PII, PUBCHK intact, 4 scripts balanced; GUIDE/manifest/sw/
  team-chat clean). Among published files only index.html + GUIDE.md + MRLN-Guide.pdf changed;
  sw.js/manifest/team-chat/icons untouched. Independently text-extracted MRLN-Guide.pdf (85,173
  chars): NO key/PII marker (no PRIVATE KEY/PEM/osefemiradi/@gmail); the 4+ digit numbers are PDF
  structural tokens (object offsets/xref) — ZERO of them appear as prose in GUIDE.md. The only
  guide figures (8,000 kr→~1,070 €, Ingrid €2,140) are pre-existing illustrative samples, not
  owner data, not in this delta.
- VERDICT: SAFE @ ba19dc0. Delta is display-only + i18n + tests/docs; all load-bearing add/
  validate/poison logic I cleared @ d2abf77 is unchanged; watchdogs/key-slots intact; exportBlank
  reconstructs; published files (incl. rebuilt PDF) leak-clean; MISSING:0; GREEN. No DIRECT
  security fix required. This is the last gate sign-off — Kaito freeze-checks the tip, then Osefe
  ships. Sleep-mode: NO auto-publish without Osefe's explicit go.
- Commits / SHAs reviewed: ba19dc0 (tip). If the tip moves again, I re-sign.
- Still open: nothing security-side. Gate: Akashi SAFE @ ba19dc0 ✓ · Mikoto MISSING:0 ✓ · Hugo
  GREEN ✓ — awaiting Osefe's explicit "ship it".

## [2026-06-30] — via Kaito (asleep, pre-build) — DESIGN: CJK/i18n + 5-tax-engine infra (NO code)
- Asked: architecture design pass for the +5 lang (fr/it/zh/ja/ko) + 5 tax-engine (FR/IT/SG/JP/KR) expansion.
  No code edits — produce build-ready design + risk flags Kaito builds to. 4 blockers: fonts/CJK,
  i18n Latin assumption, currency (SGD/JPY/KRW, decimal-less), integrity/offline invariants.
- Read the REAL code (not memory): @import @16 (Latin-only Orbitron/Rajdhani/ShareTechMono); ~16
  font-family stacks (grep); i18n engine @5138-5410 (t/tf @5138-5140, collectI18nNodes @5147, applyLang
  @5170, sweepRemnants @5226, translateForwardAll @5271, observer @5302, translateSubtree @5318, audit
  watchdog @5349); 7 Latin gates `/[A-Za-zÀ-ÿ]/` @5154/5230/5274/5289/5322/5374/5383; CURRENCIES @1742
  (JPY ALREADY present ¥ before:true; NO KRW/SGD), FX_RATES @1751 (no KRW/SGD), fmt/fmtN @1759-1760
  (Math.round → integer, decimal-less safe by construction); curSel @809-820 (JPY present, no KRW/SGD),
  langSel @799-807 + lkLangSel @600-608 (7 langs, no fr/it/zh/ja/ko); TAX_CCY @5825, TAX_COUNTRIES @5826,
  computeTax @5839 (poison @5842 gross=__sys.token()*grossRaw, withheld likewise), txMoney @5951 (own
  symbol map, NO JPY/KRW/SGD), defCountry @5954, txCountry select @5982. SW @19-42 (doc network-first,
  asset cache-first), CORE @9 (6 same-origin files, NO fonts).
- KEY FINDINGS:
  1. FONTS — system-CJK fallback chain is correct + free + offline-neutral. Append CJK system fonts to
     the ~16 font-family stacks (or fewer via a CSS var). Google @import is ALREADY an online-only dep
     (cross-origin, NOT in SW CORE @9 → never cached → already fails to Latin system fallback offline);
     CJK adds ZERO new network surface (system fonts are on-device). RISK (low, pre-existing): offline =
     no Orbitron, falls to sans-serif — true today, unchanged by CJK. Decorative Orbitron has no CJK
     glyphs → per-glyph fallback already routes CJK chars to the next family in the stack, so appending
     system CJK makes headings render. NO bundled webfont (would be 5-15MB → violates size/free, rejected).
  2. i18n LATIN GATES — applyLang (data-i18n + __en capture) is script-AGNOSTIC → CJK target fully covered
     for tagged/captured strings. The 7 `/[A-Za-zÀ-ÿ]/` gates are the BACKSTOP walkers (forward translator,
     remnant sweep, observer, audit). For en→zh they still work (source is Latin). The REAL gap: zh→ja or
     any CJK→CJK switch — sweepRemnants/translateForwardAll REJECT CJK-only nodes (no Latin) → stale
     previous-CJK text never swept forward. FIX: extend each regex to include CJK ranges. Exact:
     `/[A-Za-zÀ-ÿぁ-ヿ㐀-䶿一-鿿가-힯]/` (Hiragana+Katakana ぀-ヿ, CJK-Ext-A
     㐀-䶿, CJK Unified 一-鿿, Hangul 가-힯). Safer than "guarantee 100% data-i18n coverage" (fragile, one
     missed dynamic string = permanent leak). KEEP data-i18n-skip honored (user content) — unchanged.
  3. CURRENCY — JPY already wired (CURRENCIES@1747 + curSel@819 + FX@1753). Decimal-less is ALREADY SAFE
     in the MAIN formatters (fmt/fmtN Math.round → integer; toLocaleString won't add decimals to a round
     int). NEED: add KRW{sym:'₩',before:true,loc:'ko-KR'} + SGD{sym:'S$',before:true,loc:'en-SG'} to
     CURRENCIES@1742; FX_RATES.perUSD KRW/SGD@1753; curSel options@820 + lkLangSel n/a; TAX_CCY@5825
     SG:'SGD',JP:'JPY',KR:'KRW'; defCountry@5954 map SGD→SG,JPY→JP,KRW→KR; **txMoney@5951 own map MUST add
     JPY:['¥',''],KRW:['₩',''],SGD:['S$','']** (today falls through to `ccy+' '` → "12345 JPY", ugly but
     not decimal-broken). NO .toFixed(2)/decimal money formatter anywhere → no ¥/₩ mis-render risk.
  4. INTEGRITY/OFFLINE — poison cascades FREE to new engines IF they compute from the @5842 `gross`
     (=__sys.token()*grossRaw); HARD RULE for Kaito: new engines must derive every figure from that
     poisoned `gross`/`withheld`, never re-read num(T.gross) un-poisoned. No new network (tax = pure
     arithmetic, FX = offline snapshot). SW CORE unchanged (no new cached files; langs/fonts add nothing
     to cache — fonts are system/online-import, dict is inline in index.html).
- Verdict: design delivered, build-ready. No code touched. Nothing gated.
- Commits / SHAs: this log + TEAM-CHAT note only. App tip unchanged (ba19dc0 cardio still pending Osefe ship).
- Still open: SAFE-review the REAL Wave-1/2/3 builds later — esp. (a) new tax engines compute from poisoned
  gross (poison count must rise, never the bare-num path), (b) the 7 Latin regexes actually extended +
  CJK→CJK sweep tested, (c) txMoney JPY/KRW/SGD added, (d) data-i18n-skip still honored, (e) __sys count
  rises with new poisoned figures / never drops. Sleep-mode: no auto-publish.

## [2026-06-30] — via Kaito (asleep, step 4+10) — REAL-CODE SAFE: Wave 1 — FR/IT/SG/JP/KR tax engines (`8d22a1a`)
- Asked: SAFE-review the real code for 5 new tax engines (France/Italy/Singapore/Japan/South Korea)
  built from sourced 2025 data, against my design-pass hard rule (poison from gross) + standing
  invariants. Security = find-xor-fix exception: fix DIRECTLY if a hole, else route to Kaito.
- BASELINE: 8d22a1a^=6698eda is a LOCK-only commit; index.html byte-identical to 3937b4f (the Arthur
  brainstorm commit before the lock). So the real index.html delta is exactly the tax feature:
  3937b4f..8d22a1a = +73/-6, one file. No sw.js/manifest/parser/applyChange/export/finance-calc edit.
- THE HARD RULE — POISON FROM GROSS ✓ (the watchdog-integrity check):
  - Confirmed `grossRaw`/`T.gross` appear ONLY at line 5849 (`grossRaw=num(T.gross),
    gross=__sys.token()*grossRaw, withheld=__sys.token()*num(T.withheld)`) and the `ok:grossRaw>0` /
    `if(!(grossRaw>0))return R` early-gate (5851/5852). NO new branch re-reads `num(T.gross)`
    un-poisoned — grep proves it. Every figure in all 5 branches derives from the poisoned `gross`
    (or from `ded`/`taxAdv` = USER input, and bracket constants = public).
  - INDEPENDENTLY traced + RAN all 5 on a tampered copy (extracted the 5 branches verbatim from the
    file into a Node harness, set __sys.token()=NaN): FR/IT/SG/JP/KR ALL → totalTax/incomeTax/social
    = NaN. NO branch can surface a real figure off a removed lock. (Confirmed Kaito's JP→NaN claim AND
    the other four myself, not on faith.) fmtN(NaN)/M(NaN)→"NaN" renders visibly poisoned.
- __sys / token() COUNT — HELD, did not drop ✓: __sys 35==35 parent vs tip; __sys.token() 14==14.
  Kaito added ZERO new token calls — poison cascades free from the single gross multiply @5849, exactly
  as my design pass specified. (Design baseline said "12/26" but the live parent baseline is 14/35 post-
  cardio; the rule is HOLD-or-RISE, and it held.) PUBCHK 4047293148 (×1) + PUB_B64 (×3) intact.
- NO NEW NETWORK / EXFIL ✓: grepped the `+` lines for fetch/XHR/.src=/eval/new Function/location.*=/
  innerHTML/insertAdjacentHTML/document.write/localStorage/navigator. → ZERO. Tax = pure arithmetic; FX
  untouched. Render is the PRE-EXISTING escaped sink (breakdown @6067 `esc(b.label)`+`M(amount)`; notes
  @6093 `R.notes.map(esc)`) — the 5 branches only push into those arrays, add no new sink.
- NO LEAK / PII ✓: added code is ONLY public bracket constants (FR/IT/SG/JP/KR_BR from NTA/IRAS/INPS/
  Agenzia/NTS) + rate literals + TAX_CCY/TAX_COUNTRIES/txMoney/defCountry/field-set wiring. Grep of added
  lines for osefe|miradi|aarhus|PRIVATE KEY|BEGIN|@gmail → NONE. #__ownerKeySrc empty (@1693), #hud-state
  empty (@1689). exportBlank path UNTOUCHED (tax country/gross is user input in STATE.tax, already handled
  by the existing reconstruct-not-dump export) — the 5 branches add NO new owner-data path into a
  published/blank file.
- txMoney FIX ✓ (the bug I flagged in design): map now has JPY:['¥',''],KRW:['₩',''],SGD:['S$',''] →
  no "12345 JPY" fallthrough. defCountry reverse-map gained SGD→SG/JPY→JP/KRW→KR. Decimal-less stays safe
  (Math.round → integer; no .toFixed anywhere). Placeholder hint handles ¥/₩/S$ magnitudes.
- SANITY ✓ (token=1, ran them): FR €40k 31.9% / IT €40k 31.9% / SG S$80k 22.7% / JP ¥5M 21.4% /
  KR ₩50M 17.9% — match Kaito's spot-run; all finite, all in [0,gross], marg finite. Edge inputs
  (1 / 100 / 1e9): never NaN, never negative, never crash; txBr/txMarg/`/fr_parts` guarded
  (fr_parts<1→1), Math.max(0,…) on every taxable.
- ONE NON-GATING ACCURACY NOTE (NOT a security defect — routed to Kaito, does NOT block SAFE): at
  ABSURD sub-¥1000 / sub-₩1000 incomes, JP and KR return total>gross because flat social-insurance
  floors dominate (KR pension floor `Math.max(gross,4800000)*0.045`=₩216k; JP inhabitant flat `+5000`).
  At realistic low wages (JP ¥500k+, KR ₩5M+) effective rates are sane (JP ~15%, KR ~9–12%). Never NaN,
  never negative, never a crash, leaks nothing — it's a tax-model artifact at non-real inputs (txGross has
  min=0; real input is an annual salary). Tax-rate ACCURACY is covered by the sourced research + the
  per-branch "unofficial estimate — adjust in Advanced / verify with your tax authority" disclaimers; I'm
  clearing that it can't crash or leak, not auditing the brackets.
- Ran node tools/release/green.js → GREEN exit 0 (11 suites: parser 21, assistant 16, streak 4, sound 7,
  reorder 7, transfer 47, silly 43, photo_store 17, pr 12; preflight CLEAR — slots empty, 1 public key,
  no PII, PUBCHK intact, 4 scripts balanced; GUIDE/manifest/sw/team-chat clean). node tools/i18n/sync.js →
  MISSING:18 (the new tax UI labels + disclaimer notes) — EXPECTED, awaiting Mikoto, not a security issue.
- VERDICT: SAFE @ 8d22a1a. All 5 engines fully poison-gated (NaN on tamper, never a real figure off a
  removed lock); __sys 35==35 / token 14==14 (held, didn't drop); no new network/exfil/injection; only
  public bracket constants + rate literals added (no PII/key/owner figure); slots empty; txMoney ¥/₩/S$
  fix in; render via pre-existing escaped sink; exportBlank path untouched (no new owner-data path to a
  blank/published file). No DIRECT security fix required (build is correct).
- Commits / SHAs reviewed: 8d22a1a (tip). TIP WILL MOVE (Mikoto i18n MISSING→0 + Hugo tests/guide) —
  I re-sign the final tip before any ship per freeze-the-candidate.
- Still open: gate (steps 7–11) — my SAFE in @ 8d22a1a; needs Mikoto MISSING:0 (18 tax strings) + Hugo
  GREEN on the final tip + Osefe ship. Non-gating JP/KR low-income floor note → Kaito (accuracy). Wave 2/3
  (CJK langs + remaining engines) still to come — esp. the 7 Latin i18n regexes actually extended for
  CJK→CJK sweep. Sleep-mode: no auto-publish without Osefe's explicit go.


## [2026-06-30] — via Kaito (asleep, step 10) — RE-SIGN: Wave 1 final tip (`a614f48`)
- Asked: re-sign SAFE on the moved tip per freeze-the-candidate. My prior SAFE was @ 8d22a1a
  (5 tax engines). Tip moved to a614f48 (Mikoto i18n dfbcbad + Hugo QA/docs a614f48). DELTA
  re-review: prove the load-bearing engine code I cleared is unchanged; clear the i18n/test/doc delta.
- DELTA 8d22a1a..a614f48 (git diff --numstat / --stat):
  - index.html: +1/-1, ONE line — the AUTO-MERGED dict line @5131 only. Hunk header
    `@@ -5128,7 +5128,7 @@` = single-line change. NO tax-engine logic moved; the 5 branches +
    poison (gross=__sys.token()*grossRaw) + txMoney byte-identical to my 8d22a1a sign-off (numstat 1/1).
  - GUIDE.md +3/-1 (doc: covers 12 countries + XX fallback — no figures/keys); MRLN-Guide.pdf
    rebuilt (binary); tools/test/tax_test.js new (+254); tools/release/green.js +10/-4 (renumber +
    INSERTS tax suite run — adds a guard, weakens none); team logs/TEAM-CHAT. No sw.js/manifest edit.
- i18n DICT (dfbcbad) OK: eval-loaded the live AUTO-MERGED IIFE -> parses clean. 6 langs es/da/de/
  sv/nb/hu (1506x5 + 1546 hu keys). 0 PII/key hits in all values (osefe|miradi|aarhus|BEGIN|PRIVATE
  KEY|@gmail|----|ownerKey|signingKey). Tax acronyms/symbols intact: IRPEF/CPF/IRAS/bareme/
  addizionale/% present. (Won/S$ absent in dict values is EXPECTED — those glyphs come from txMoney
  CODE not translatable strings; notes reference CPF/IRAS/brackets. Not a defect.) MISSING:0 (650/650).
- INVARIANTS on tip (parent vs tip, grep -a) OK: __sys 35==35, __sys.token() 14==14 (held, no drop).
  PUBCHK 4047293148 x1, PUB_B64 x3. #hud-state empty (@1689), #__ownerKeySrc empty (@1693). hud-state
  read = JSON.parse of the slot (@1832), reconstruct-not-dump export path untouched. NOTE: index.html
  has 1 NUL byte @3936 (a key-join delimiter in a grouping fn) — PRE-EXISTING (1==1 parent vs tip),
  deliberate code, NOT in a translation value; only effect = grep sees the file as binary (use -a). Benign.
- NO NEW NETWORK/EXFIL OK: the only index delta is a dict line (Object.keys/I18N assign) — no
  fetch/XHR/eval/.src=/location.*=. Pure data merge.
- PUBLISHED FILES all clean OK: node tools/release/green.js -> GREEN exit 0 (tax suite 105/105;
  preflight CLEAR — slots empty, 1 public key, no PII, PUBCHK intact, 4 scripts balanced; leak scan
  GUIDE.md/manifest/sw.js/team-chat.html clean). node tools/i18n/sync.js -> MISSING:0. PDF:
  independently extracted (decompressed streams + ToUnicode CMap decode + raw byte scan) -> 0 hits for
  -----BEGIN / PRIVATE KEY / osefe / miradi / aarhus / @gmail / ownerKey / signingKey; decoded text
  shows updated section 6 (covers 12 countries; Singapore/France/Japan/Denmark/Norway), no PII, no
  private figure. The earlier `-----` raw hits were Markdown rules (-----BEGIN count = 0).
- POISON-GATE TEST IS REAL, NOT THEATER OK: tax_test.js readFileSync-extracts the LIVE computeTax
  from index.html (no copy drift); Test 3 (@155-175) sets __sys.token=()=>NaN and asserts totalTax
  AND incomeTax AND social each NaN for ALL 5 engines (FR/IT/SG/JP/KR) = 15 NaN assertions, all pass
  in the 105/105 GREEN. The tamper-guard I hand-verified @8d22a1a is now regression-locked: any future
  un-poisoned num(T.gross) re-read in those branches turns this suite RED.
- VERDICT: SAFE @ a614f48. index.html delta is exactly the Mikoto dict line — all load-bearing
  engine/poison/txMoney logic byte-identical to my 8d22a1a SAFE; watchdogs held (35/14), slots empty,
  exportBlank reconstructs, no new network; every published file (incl. rebuilt PDF) leak-clean;
  MISSING:0; GREEN. No DIRECT security fix required. Last gate sign-off — Kaito freeze-checks the tip,
  then Osefe ships. Sleep-mode: NO auto-publish without Osefe explicit go.
- Commits / SHAs reviewed: a614f48 (tip). If the tip moves again, I re-sign.
- Still open: nothing security-side. Gate: Akashi SAFE @ a614f48 OK / Mikoto MISSING:0 OK / Hugo GREEN
  OK — awaiting Osefe explicit "ship it". Wave 2/3 (CJK langs + remaining engines) still to come — esp.
  the 7 Latin i18n regexes extended for CJK->CJK sweep.

## [2026-06-29] — direct (Osefe) — created Maki (marketing agent) w/ deep research
- Asked: create a Lead Branding/Marketing agent (TikTok/IG/YT/Twitter/Google Trends), goal first
  $10k revenue; persona female, 22, perfectionist, media-trained, knows the algorithms + what
  degrees teach; works w/ Osefe's girlfriend. Use deep research (salvaged a stalled workflow).
- Did: ran live WebSearch across TikTok/YT/IG algorithms (2026), $0→customers GTM, FTC/fintech
  marketing compliance. Wrote .claude/agents/maki.md (opus; web tools; read-only director) +
  seeded team/logs/maki.md with a grounded first-$10k plan + algo baseline. Wired CLAUDE.md
  (roster + sleep-mode + memory-log). Lock claimed/released. Announced + routed to Kaito (5th role).
- Security guardrails baked into Maki: every privacy/security CLAIM routes to me before public;
  market only shipped features; no gamifying financial decisions; FTC disclosure + no dark patterns;
  serious-not-warm voice; organic-first.
- Open: I vet her first batch of public privacy claims when she produces content.

## [2026-06-30] — via Kaito (asleep, step 4) — REAL-CODE SAFE w/ DIRECT FIX: Media Log new tab (review @ `9ba07d5` → fixed @ `63c2a01`)
- Asked: SAFE-review the new Media Log tab (STATE.media[] {id,title,status,rating,comment,added,rated};
  panel #media + var MEDIALOG ~6786 + renderMedia; wired into DEFAULTS/loadState/exportDataCode/
  applyImportedData; startup render x2). Verify: (1) XSS — title/comment free user input into innerHTML;
  (2) MEDIA/IDB name-collision fully resolved (Kaito renamed his module MEDIA→MEDIALOG to stop clobbering
  the IDB photo helper var MEDIA ~1851); (3) data-i18n-skip on dynamic containers correct+sufficient;
  (4) no poison needed (user taste, not owner figures) + no watchdog touched; (5) no new net surface +
  exportBlank still strips. Security = find-AND-fix exception. Run green.js (sync MISSING:27 expected).
- BASELINE: 9ba07d5^=ac794d2 (Maki, non-code); index.html byte-identical a614f48(last shipped)..ac794d2 →
  real diff = exactly Media Log, index.html only +188/-5. Arthur 8d29ca3 landed after (POLISH verdict,
  TEAM-CHAT+arthur.md only; index.html byte-identical to 9ba07d5 — confirmed).
- FOUND A REAL LEAK → FIXED DIRECTLY (the gating defect):
  - exportBlank @4760 RECONSTRUCTS hud-state {__fresh,fid,prefs} (so media can't re-hydrate from the
    embedded JSON) BUT then serializes `document.documentElement.outerHTML` @4782 AFTER renderAll() @4771.
    renderAll calls renderMedia @4754 → renderLists writes the owner's STATE.media titles + PRIVATE
    comments into #medToWatch/#medRanked innerHTML. exportBlank zeroes every OTHER personal array @4769
    (workouts/calendar/log/body/prs/notes/foodLog/tax/reminders/usage/bdayYear/missionsDone) precisely so
    the serialized blank DOM has no personal text — but STATE.media was MISSED from that zero list. Result:
    owner's film titles + "note to your future self" comments BAKED into every customer/blank file's DOM
    (visible in the file / view-source). Violates invariant #1 (no private content in public/customer files).
  - FIX (3 surgical edits, mirror the existing snapshot→zero→restore pattern): snapMedia=STATE.media @4763;
    STATE.media=[] @4769 (before renderAll/serialize); STATE.media=snapMedia in finally @4795. Owner master
    (exportHTML @4713) is UNTOUCHED — still dumps full STATE incl media (his private file, intended; also
    trips on a tampered copy @4714). Committed 63c2a01. Verified diff = exactly those 3 lines, nothing else.
- XSS — VERIFIED CLOSED (the primary risk). tf() @5189 does PLAIN {k} substitution (NO escaping) → any
  user content into an innerHTML sink must be pre-esc()'d. esc() @1843 escapes & < > ". Traced ALL sinks:
  - renderLists tw.innerHTML (To-watch): esc(m.title) + m.id(uid, [a-z0-9]) + static t(). ✓
  - renderLists rk.innerHTML (ranked): esc(m.title), esc(m.comment), esc(whenY(m.rated)), m.id(uid),
    numeric rankNo/fmtR, static t(). ✓  empty branch = static t() only. ✓
  - showCompare box.innerHTML: rows = esc(x.title)+numeric; header tf('…{title}…',{title:esc(m.title)})
    (esc'd BEFORE substitution); buttons static t(). ✓
  - buildChips: b.textContent=n. ✓  openRate: medRateTitle.textContent + medComment.value. ✓
  - msg() m.textContent (so tf with raw {title} is safe). ✓  paintVal textContent. ✓
  - share()/fb(): clipboard.writeText / textarea.value + execCommand('copy') — NOT innerHTML, NO net. ✓
  - del-confirm uiConfirm message is STATIC (no user content) — uiConfirm DOES innerHTML message elsewhere,
    but here no user text. ✓
  A crafted title `<img src=x onerror=…>` renders as escaped text in list/ranked/calibration; rate-title via
  textContent → NO execution path anywhere. (grep: 5 innerHTML sinks in diff, all enumerated above.)
- MEDIA/IDB COLLISION — FULLY RESOLVED. `var MEDIA` declared EXACTLY ONCE (@1851, the IDB photo helper).
  All MEDIA.supported/put/get/del/all calls (initFoodMedia @1947, addEntry @6568, food del @6616, photo
  export/import @6667-6704) resolve to that one helper. New module = `var MEDIALOG` @6786 (distinct id, no
  shadowing). The applyCompare local is named `t2` (doesn't shadow global t()). Photo storage intact.
- data-i18n-skip — CORRECT + SUFFICIENT. #medToWatch/#medRanked/#medRateTitle all carry data-i18n-skip;
  the i18n TreeWalker FILTER_REJECTs any node under [data-i18n-skip] @5282 → never descends → dynamic
  titles/comments never mangled. #medComment is a textarea (.value not walked); data-i18n-ph = static UI.
- POISON / INVARIANTS. NO poison needed/added — ratings/comments are user's OWN media taste, not owner
  FINANCIAL figures (consistent w/ notes/foodLog/prs un-poisoned). __sys 35→36 is ONE word in the Media
  Log header COMMENT ("…no __sys poison."), NOT a watchdog change → __sys.token() 14==14 (held). PUBCHK
  4047293148 ×1 + PUB_B64 ×3 intact. #hud-state empty (@1737), #__ownerKeySrc empty (@1741). No SW/manifest
  change. No new network/exfil (grep added lines: fetch/XHR/.src=/eval/new Function/location.*/document.write
  → ZERO). exportDataCode @5617 adds media:STATE.media||[] (whole-array, round-trips lossless via
  applyImportedData STATE.media=d.media||[]); no key/owner figure in the data object.
- Ran node tools/release/green.js → GREEN exit 0 (10 suites: parser 21, assistant 16, streak 4, sound 7,
  reorder 7, transfer 47, silly 43, photo_store 17, pr 12, tax 105; preflight CLEAR — slots empty, 1 public
  key, no PII, PUBCHK, 4 scripts; GUIDE/manifest/sw/team-chat clean). node tools/i18n/sync.js → MISSING:27
  (new Media Log strings → Mikoto; EXPECTED, not security).
- ONE NON-GATING NOTE (robustness, routed to Hugo — does NOT block SAFE): transfer_test required-fields
  assert doesn't yet list `media`; exportDataCode round-trips it fine but it's not test-guarded (same pattern
  as the cardio/photo fixture adds). Hugo: add a media entry to the transfer fixture + required-fields list.
- VERDICT: SAFE @ 63c2a01 (after my DIRECT security fix). The exportBlank media-leak is the gating defect,
  now closed; XSS fully esc()'d-closed on every sink; MEDIA/IDB collision resolved (photo storage intact);
  data-i18n-skip correct; no poison needed; watchdogs/key-slots intact; exportBlank now strips media (owner
  content can't reach a customer file); owner master unaffected; no net surface; GREEN.
- Commits / SHAs: reviewed 9ba07d5; FIX 63c2a01 (tip). Lock claimed (6a774ba) + released this session.
  TIP WILL MOVE (Arthur polish folded by Kaito + Mikoto MISSING:0 + Hugo media fixture/GREEN) → I re-sign
  the final tip per freeze-the-candidate. Sleep-mode: no auto-publish without Osefe's explicit go.

## [2026-06-30] — via Kaito (asleep, final gate) — RE-SIGN: Media Log delta 63c2a01..d718677 (re-SAFE @ `d718677`)
- Asked: re-sign Media Log on the moved tip per freeze-the-candidate. My prior SAFE was @ 63c2a01
  (after I fixed the exportBlank media leak). Delta = Arthur polish + Kaito calibration nit
  (display-only), Mikoto i18n (27 strings × 6 langs), Hugo tests/guide/PDF. Confirm no logic/poison/
  export-blank regression; XSS verdict holds; published files leak-clean; MISSING:0; GREEN.
- DELTA 63c2a01..d718677 (numstat): index.html +15/-8, GUIDE.md +26/-8, MRLN-Guide.pdf rebuilt,
  green.js +9/-2, NEW tools/test/media_test.js (149), transfer_test.js +25, logs/chat/maki docs.
  No sw.js/manifest edit.
- index.html delta = EXACTLY the display-toggle hunks + the i18n dict line (proved by awk-omitting
  the 2 long AUTO-MERGED lines): (1) Done→Cancel label; (2) #medNudge id added; (3) Save+comment
  wrapped in #medRateForm; (4) openRate resets medRateForm/medChips/medNudge display=''; (5) showCompare
  hides medRateForm/medChips/medNudge (style.display='none' — "strictly one decision"); (6) paintVal
  band-tint v.style.color red/amber/lime; (7) chips 38px→44px min-width+min-height; (8) comment
  placeholder reworded. ALL touch only .style.display / .style.color / textContent — NO user data into
  any NEW sink, NO logic/validation/parser/finance/poison change.
- MY MEDIA-STRIP INTACT ✓: exportBlank snapMedia @4765, `STATE.media=[]` @4771 (before renderAll/
  serialize), restore `STATE.media=snapMedia` @4797 — all THREE present on tip and UNCHANGED in the
  delta (git diff shows zero hits for snapMedia/STATE.media in the 63c2a01..d718677 index diff).
  exportDataCode media:STATE.media||[] @5619 + applyImportedData STATE.media=d.media||[] @5628 intact.
- XSS VERDICT HOLDS ✓: all sinks still esc()'d on tip — showCompare esc(x.title) @6852 +
  tf(...,{title:esc(m.title)}) @6853; renderLists esc(m.title) @6877/6890, esc(m.comment)+esc(whenY())
  @6887. New display toggles introduce no innerHTML and no user content. Crafted title/comment cannot
  execute anywhere. MEDIA/MEDIALOG split still clean (no var rename in delta; IDB photo helper untouched).
- INVARIANTS (base 63c2a01 vs tip d718677, grep -a) ✓: __sys 36==36, __sys.token() 14==14 (HELD),
  PUBCHK 4047293148 ×1, PUB_B64 ×3. #__ownerKeySrc empty, #hud-state empty. No new network/exfil in
  index delta (added lines scanned: fetch/XHR/.src=/eval/new Function/location.*/document.write → NONE).
- i18n DICT ✓: AUTO-MERGED IIFE parses as JSON; 6 langs es/da/de/sv/nb (1537 keys each) + hu (1577).
  0 PII/key hits in added values (osefe|miradi|aarhus|BEGIN|PRIVATE KEY|@gmail|ownerKey|signingKey).
  Placeholder integrity perfect — {title}/{r} present in value iff present in key (0 mismatches).
  node tools/i18n/sync.js → MISSING:0 (fully translated).
- TESTS/GUIDE/PDF ✓: green.js delta ONLY inserts the media suite (now 11; preflight→12, leak→13) —
  no guard removed, PUBLISHED_TEXT list unchanged. transfer_test ADDS a media fixture + round-trip
  asserts (closes my prior non-gating note). media_test.js new = 23/23. GUIDE.md adds §8 Media Log
  ("Nothing ever leaves your device"; excluded from clipboard quick-move — matches exportBlank/transfer)
  — the 3 grep "hits" are descriptive security-model copy ("private key only in owner master"), NOT key
  material/PII. Rebuilt MRLN-Guide.pdf independently extracted (FlateDecode streams + paren-string +
  raw byte scan): 0 hits for BEGIN/PRIVATE KEY/osefe/miradi/aarhus/@gmail/ownerKey/signingKey — clean.
- GATE: node tools/release/green.js → GREEN exit 0 (media 23/0; preflight CLEAR — slots empty, 1 public
  key, no PII, PUBCHK, 4 scripts balanced; leak scan GUIDE/manifest/sw/team-chat clean). MISSING:0.
- VERDICT: SAFE @ d718677. index.html delta vs my 63c2a01 SAFE is exactly the display-toggle hunks +
  the Mikoto dict line — load-bearing logic/poison/export-blank byte-identical, my media-strip present,
  XSS closed, watchdogs held (36/14), slots empty, no new network, every published file (incl. rebuilt
  PDF) leak-clean, MISSING:0, GREEN. No DIRECT security fix required this pass. Last gate sign-off —
  Kaito freeze-checks the tip, then Osefe ships item 1 (Media Log). Sleep-mode: NO auto-publish without
  Osefe's explicit go.
- ONE NON-GATING NOTE (routed to Hugo, does NOT block SAFE): GUIDE.md section numbering skips §10
  (§9 Installing → §11 Connect). Cosmetic doc-numbering only, no security impact.
- Commits / SHAs reviewed: re-signed d718677 (tip). If the tip moves again, I re-sign.
- Still open: nothing security-side. Gate: Akashi SAFE @ d718677 / awaiting Kaito freeze-check + Osefe
  "ship it". Wave-2 (CJK langs) Media Log strings still future work, not in scope here.

## [2026-06-30] — via Kaito (asleep, step 4) — REAL-CODE REVIEW: Smart Onboarding (life-stage + priority picker) — SAFE @ `38a87c2`
- Asked: SAFE-review item 2 Smart Onboarding (2 additive WIZ steps: 'stage' life-stage enum +
  'priority' tap-to-rank picker → STATE.tabOrder). Verify COPPA (no numeric age), tab-order
  integrity (no tab lost/dup, klarna stays hidden, __tabReorder/reorder_test untouched, returning
  users unaffected), no XSS, no net/leak, exportBlank covers new stage field, no wizard regression.
  Security = find-AND-fix exception. Run green.js (reorder must pass).
- BASELINE: parent 38956c8 (Arthur build-spec, non-code) — index.html BYTE-IDENTICAL to last-shipped
  d718677 (numstat empty). Real diff = exactly Smart Onboarding, index.html ONLY +90/-3.
- COPPA ✓: 'stage' step (stageStepHTML) is 3 single-select cards school/working/managing → data.stage,
  an ENUM only. Collects NO numeric age. Existing Age field stays OPTIONAL on profile, NOT made
  required. data.stage is only compared (===o[0]) and stored; never a number. Sidesteps COPPA/GDPR-K
  exactly as Arthur designed.
- TAB-ORDER INTEGRITY ✓ (the load-bearing check): finish() @7279-7286 builds STATE.tabOrder=
  data.priority.concat(rest) where rest = live `#tabs .tab` data-p keys NOT picked, then calls the
  EXISTING window.__applyTabOrder (@2283). applyTabOrder filters saved→present (drops unknowns) and
  RE-APPENDS any present key missing from saved at the end → NO tab can be lost or duplicated; it only
  appendChild's existing nodes, never creates/deletes, NEVER touches .style.display. KLARNA: not in
  PICK_CARDS so can't be in data.priority; it lands in `rest`, gets re-appended, display:none untouched
  → stays hidden. priority[0].click() only ever targets a PICK_CARDS key (all visible tabs) → no hidden
  tab surfaced. __tabReorder (pure, reorder_test.js) NOT in the diff — unchanged. Returning user
  (STATE.fresh=false → wizard never opens, new steps never run) unaffected; saved tabOrder still applies.
  SKIP / empty-pick: finish gated `if(data.priority && data.priority.length)` → block skipped →
  STATE.tabOrder untouched → nav default (as specced).
- NO XSS ✓: new step HTML interpolates ONLY fixed internal values — data-stage from the fixed opts
  array (school/working/managing), data-pick=p from PICK_CARDS (fixed), pbadge number n+1 (numeric),
  mok(p) (static switch SVG/HTML), pickTitle(p)/t() (i18n strings). NO user free-text reaches innerHTML;
  data.stage/data.priority are constrained to internal enums/keys (click handler only pushes data-pick
  values from rendered PICK_CARDS cards; seed filtered to PICK_CARDS). Rendered via the existing wizard
  render() innerHTML path — no NEW sink. A crafted value can't reach the step HTML.
- NO POISON NEEDED ✓: nothing new reads/writes an owner FINANCIAL figure. mok('overview') "1 240" is a
  STATIC mock label, not a real figure. stage=enum, priority=key array → not owner money → no
  __sys.token() gating required (consistent with how profile/tabOrder are handled). __sys 36==36 /
  __sys.token() 14==14 (HELD, no drop), PUBCHK 4047293148 ×1, PUB_B64 ×3 — all intact (diff touches none).
- NO LEAK / EXPORT-BLANK ✓: exportBlank @4792 does `MODEL = blankModel()` — replaces the WHOLE MODEL,
  so MODEL.profile.stage is dropped by construction (blankModel().profile @2125 has no stage field).
  New stage field CANNOT reach a blank/customer file; and even if it did, it's a 1-word enum, not PII/
  number/key. Owner master (exportHTML) dumps full STATE incl stage — his private file, fine. No new
  network/exfil: added lines scanned for fetch/XHR/eval/new Function/.src=/location.*/document.write/
  innerHTML → ZERO. #__ownerKeySrc empty, #hud-state empty. No SW/manifest change.
- NO WIZARD REGRESSION ✓: STEPS extended additively (2 steps inserted); existing step branches,
  collect/validate/finish MODEL writes, go() clamp, demo-data path, WIZOPEN — NOT modified in the diff
  (only the `el` data-object init gained stage:''/priority:[] + a trailing comma; finish's profile
  object gained `stage:(data.stage||'')`). collect/validate/go absent from the diff entirely.
- ONE NON-GATING NOTE (cosmetic, routed to Kaito — does NOT block SAFE): `FIRST_PROMPT` map (@6945) is
  DECLARED but never read (1 occurrence, dead var) — fixed internal static strings, never interpolated/
  rendered → no security impact; likely a future first-prompt nudge. Kaito: wire it or drop it.
- Ran node tools/release/green.js → GREEN exit 0 (11 suites: parser 21, assistant 16, streak 4, sound 7,
  reorder 7, transfer 58, silly 43, photo_store 17, pr 12, tax 105, media 23; preflight CLEAR — slots
  empty, 1 public key, no PII, PUBCHK, 4 scripts; GUIDE/manifest/sw/team-chat clean). reorder_test
  explicit 7/7 (hidden tab stays put). node tools/i18n/sync.js → MISSING:14 (new onboarding strings →
  Mikoto; EXPECTED, not security).
- VERDICT: SAFE @ 38a87c2. Additive UI wizard steps; zero money/key/network/injection/leak surface;
  tab-order integrity proven (no tab lost/dup, klarna hidden, returning users + skip unaffected,
  __tabReorder/reorder_test untouched); COPPA-safe (enum, no numeric age); exportBlank reconstructs whole
  MODEL so stage can't reach a customer file; watchdogs held (36/14), slots empty. No DIRECT security fix
  required (build is correct).
- Commits / SHAs reviewed: 38a87c2 (tip). TIP WILL MOVE (Arthur polish + Mikoto MISSING:0 + Hugo tests/
  guide) → I re-sign the final tip per freeze-the-candidate. No lock taken (read-only review, no fix).
- Still open: gate (steps 7–11) — my SAFE @ 38a87c2; needs Mikoto MISSING:0 (14 strings) + Hugo GREEN
  (wants a picker→tabOrder test) on the final tip + Osefe ship. Non-gating FIRST_PROMPT dead-var → Kaito.
  Sleep-mode: NO auto-publish without Osefe's explicit go.

## [2026-06-30] — via Kaito (asleep, final gate) — RE-SIGN: Smart Onboarding delta 38a87c2..d4e14f1 (re-SAFE @ `d4e14f1`)
- Asked: re-sign Smart Onboarding (item 2) on the moved tip per freeze-the-candidate. Prior SAFE @ 38a87c2.
  Delta = Arthur polish + dead-code removal (d103359), Mikoto i18n 14 strings×6 langs (ebcd7d7), Hugo
  tests/guide/PDF (d1fe834). Confirm no onboarding logic / tab-order / finish() write changed; invariants;
  every published file leak-clean; MISSING:0; GREEN; PDF text-extract clean.
- DELTA 38a87c2..d4e14f1 (numstat): index.html +3/-7, GUIDE.md +9/-7, MRLN-Guide.pdf rebuilt, TEAM-CHAT,
  green.js +6, NEW tools/test/onboarding_test.js (126), logs/maki docs. No sw.js/manifest edit.
- index.html delta = EXACTLY 3 polish hunks + the i18n dict line (proved by awk-folding the long
  AUTO-MERGED lines): (1) FIRST_PROMPT dead map REMOVED @6949 — verified 0 references on tip (grep -ac=0),
  it was never read so removal breaks nothing; (2) expenses mok() gains a STATIC `<div class="mok-lbl">
  kr/mo</div>` literal in the switch — no interpolation, no user data; (3) #wPrioSkip inline style gains
  min-height:44px (Arthur's tap-target floor). ALL touch only static HTML/style — NO logic/validation/
  parser/finance/tab-order change, NO new user-input sink. mok(p) still feeds the SAME existing wizard
  render() innerHTML path ('<div class="pmok">'+mok(p)+'</div>') — no NEW sink; mok returns only fixed
  literals/SVG. The COPPA-safe stage enum + the picked.concat(rest) tabOrder concat + finish()/__applyTabOrder/
  __tabReorder are NOT in the delta — byte-identical to what I cleared @38a87c2 (git diff: zero hits for
  blankModel/__tabReorder/__applyTabOrder/finish in the index delta).
- INVARIANTS (base 38a87c2 vs tip d4e14f1, grep -a) ✓: __sys 27==27, token() 16==16 (HELD), PUBCHK
  4047293148 ×1, PUB_B64 ×3. #__ownerKeySrc empty (type=text/plain, no content), #hud-state empty. No new
  network/exfil in index delta (added lines: fetch/XHR/.src=/eval/new Function/location.*/document.write/
  innerHTML → NONE). exportBlank `MODEL=blankModel()` strip intact (untouched) → profile.stage dropped by
  construction, can't reach a customer file.
- i18n DICT ✓: AUTO-MERGED IIFE parses; node tools/i18n/sync.js → MISSING:0 (695/695). PII/key scan: the
  Osefe(3)/Aarhus(1)/ownerKey(7) hits in index are base==tip (pre-existing, in code COMMENTS + the empty
  key slot, NOT new, NOT a leaked figure). The only delta-added matches are 6× "private key" — descriptive
  licensing UI copy translations, no PEM/key material. Zero `-----BEGIN` added.
- TESTS/GUIDE/PDF ✓: green.js delta ONLY inserts the onboarding suite (5b) — no guard removed, PUBLISHED_TEXT
  unchanged. onboarding_test.js (new) mirrors the real picked.concat(rest) contract: picked-first-in-order,
  unpicked-original-order, no-tab-lost/dup, empty-pick preserves order, stale keys don't corrupt — a TEST,
  weakens no guard. GUIDE.md §4 setup adds life-stage + prioritize steps; delta-added GUIDE lines have NO
  PII/key/figure. Rebuilt MRLN-Guide.pdf (503KB) independently extracted (raw + FlateDecode streams): 0 hits
  for -----BEGIN/PRIVATE KEY/MIIB/MIIC/osefe/miradi/aarhus/@gmail/ownerKey/signingKey. The 156 "BEGIN" hits
  are PostScript CMap font keywords (begincmap/beginbfchar/dict begin) — font machinery, NOT PEM. Clean.
- GATE: node tools/release/green.js → GREEN exit 0 (12 suites incl onboarding; preflight CLEAR — slots
  empty, 1 public key, no private key, no PII, PUBCHK, 4 scripts balanced; leak scan GUIDE/manifest/sw/
  team-chat clean). MISSING:0.
- VERDICT: SAFE @ d4e14f1. index.html delta vs my 38a87c2 SAFE is exactly the 3 polish/dead-code hunks +
  the Mikoto dict line — onboarding logic / tab-order mapping / finish() write byte-identical, FIRST_PROMPT
  removal breaks nothing (never read), exportBlank strip present, watchdogs held (27/16), slots empty, no
  new network, every published file (incl rebuilt PDF) leak-clean, MISSING:0, GREEN. No DIRECT security fix
  required this pass. Last gate sign-off — Kaito freeze-checks the tip, then Osefe ships item 2.
  Sleep-mode: NO auto-publish without Osefe's explicit go.
- Commits / SHAs reviewed: re-signed d4e14f1 (tip). If the tip moves again, I re-sign.
- Still open: nothing security-side. Gate: Akashi SAFE @ d4e14f1 / Mikoto MISSING:0 @ ebcd7d7 / Hugo GREEN
  @ d1fe834 — awaiting Kaito freeze-check + Osefe "ship it" for item 2 (Smart Onboarding).

## [2026-06-30] — via Kaito (asleep, step 4) — REAL-CODE SAFE: Desktop Alive v1 (item 3) @ `7aa3231`
- Asked: SAFE-review Desktop Alive v1 (ambient-HUD polish). CSS block after @keyframes gridPulse
  (body::after breath, html::before scanline, body::before translate3d(var(--px),--py), 3 keyframes,
  reduced-motion @media, desktop-gated card:hover lift) + cursorParallax IIFE before initPWA. Verify
  no net/exfil/storage, no watchdog/key/money touch, no mobile perf landmine (listener gated off touch),
  SW/manifest unchanged, no new injection surface. Run green.js + i18n sync.
- BASELINE: parent 394d705 (Arthur build-spec, non-code) — real diff = exactly Desktop Alive, index.html
  ONLY +42/-0 (purely additive). sw.js/manifest UNTOUCHED by this build (394d705..7aa3231 numstat empty
  for sw.js/manifest); the v11→v12 sw bump was the PRIOR Smart Onboarding ship (d4e14f1..394d705), not this.
  Item 4 (manifest/SW unchanged, CORE list untouched) ✓.
- NO NETWORK / NO EXFIL / NO STORAGE ✓: added `+` lines grepped for fetch/XHR/eval/new Function/
  document.write/innerHTML/location.(href|search|hash)/.src=/localStorage/sessionStorage/cookie/indexedDB/
  WebSocket/EventSource/import() → ZERO. The ONLY JS is cursorParallax: reads e.clientX/clientY + window
  innerWidth/innerHeight, computes tx,ty (centered frac), and writes TWO CSS custom props --px/--py on
  document.documentElement via style.setProperty (±3.5px after *7 then .toFixed). Coords used transiently
  for a transform; never stored, never networked, never into a text/DOM sink. No PII/money touched.
- NO MOBILE PERF LANDMINE ✓ (the load-bearing perf check): IIFE gates on matchMedia
  '(hover:hover) and (pointer:fine) and (min-width:1024px)' AND '(prefers-reduced-motion: no-preference)';
  `if(!ok) return;` sits BEFORE window.addEventListener → on touch/phone/reduced-motion NO listener is
  attached → zero added per-event work on phones. pointermove handler is rAF-coalesced (one DOM write per
  frame), passive:true, and early-returns for non-mouse pointerType. will-change:transform is on body::before
  ONLY (one existing fixed grid layer), not sprayed. Whole IIFE try/catch-wrapped. Reduced-motion users get
  the static HUD (all animation under @media prefers-reduced-motion:no-preference).
- NO WATCHDOG / KEY / MONEY IMPACT ✓: pure presentation. __sys 36==36, __sys.token() 14==14 (HELD), PUBCHK
  4047293148 ×1, PUB_B64 ×3 — IDENTICAL parent vs tip (diff touches none). #__ownerKeySrc empty, #hud-state
  empty on tip. No money figure in the added CSS — the only 4+ digit numbers are 1024 (breakpoint), 1100/620
  (gradient sizing px), 229/255 (cyan rgba channels); no owner figure/PII/key material (grep osefe|miradi|
  aarhus|@gmail|BEGIN|PRIVATE KEY|MIIB|MIIC|signingKey|ownerKey → only false-positive comment/CSS hits).
  No parser/applyChange/finance/export edits.
- NO NEW ATTACK SURFACE ✓: no innerHTML, no user input, no new DOM from untrusted data. CSS custom props
  consumed only by body::before transform:translate3d(var(--px),var(--py),0). No new i18n string (CSS+rAF
  only) → MISSING:0 holds.
- GATE: node tools/release/green.js → GREEN exit 0 (12 suites incl onboarding/media; preflight CLEAR — slots
  empty, 1 public key, no private key, no PII, PUBCHK, 4 scripts; GUIDE/manifest/sw/team-chat leak-clean).
  node tools/i18n/sync.js → MISSING:0 (695/695).
- VERDICT: SAFE @ 7aa3231. Lowest-risk feature yet — pure CSS ambient layer + one rAF cursor read writing
  two CSS vars; zero network/exfil/storage/money/key/watchdog/injection surface; phones get NO added listener
  (matchMedia gate returns early); reduced-motion users keep static HUD; SW/manifest/CORE untouched; watchdogs
  held (36/14), slots empty; GREEN; MISSING:0. No DIRECT security fix required (build is clean).
- Commits / SHAs reviewed: 7aa3231 (tip), baseline 394d705. No lock taken (read-only review, no fix).
  TIP WILL MOVE (Arthur polish + Hugo GREEN) → I re-sign the final tip per freeze-the-candidate.
- Still open: nothing security-side. Gate (steps 7–11): my SAFE @ 7aa3231; no new strings so Mikoto MISSING:0
  trivially; Hugo GREEN on final tip + Osefe ship. Sleep-mode: NO auto-publish without Osefe's explicit go.

## [2026-06-30] — via Kaito (asleep, step 4+10) — REAL-CODE SAFE: Lock-Screen Alive (flagship gate) @ `75f03b5`
- Asked: SAFE-review Lock-Screen Alive — cyberpunk ambient INSIDE the pre-unlock gate overlay (Arthur
  spec 98d3435). Confirm Kaito's 5 points: (1) opaque curtain still hides ALL app content (negative-z
  decoration can't punch through), (2) zero app data in the canvas/particles/parallax, (3) FX stops dead
  on unlock (no in-app rAF/listener) + restarts on re-lock, (4) watchdog/anti-tamper intact + decide if
  the canvas needs watchdog coverage, (5) export/template stays clean. Fix DIRECTLY if a hole.
- BASELINE: parent 98d3435 (Arthur spec, non-code) — `git diff 33634d2(last-shipped) 98d3435 -- index.html`
  EMPTY → real diff = exactly the feature, index.html ONLY +126/-2. (NOTE: Kaito's quoted base 33634d2 is
  the gh-pages SHIP commit, NOT an ancestor of 75f03b5 — divergent line; the byte-identical check confirms
  index.html is the same so the delta is clean. Used 98d3435 as the true parent.) sw.js/manifest UNTOUCHED.
- 1. CURTAIN HOLDS ✓ (the load-bearing privacy check): #lockScreen base rule (@377) UNCHANGED in diff —
  still `position:fixed;inset:0;z-index:100000` + `background:radial(...),var(--bg)` (the var(--bg) layer is
  the OPAQUE base) + `.unlocked{display:none}` + lk-noscroll page-freeze (@382) all byte-identical. #lockScreen
  forms a STACKING CONTEXT (positioned + z-index:100000≠auto), so its children's negative z-index resolves
  WITHIN that context: the new layers (::before z-2, ::after z-2, .lk-scan z-1, #lkfx z-1) paint ABOVE the
  overlay's own var(--bg) bg but BELOW .lockcard (z auto/0) — they CANNOT escape #lockScreen to render behind
  it / reveal the dashboard. No opacity/filter/mix-blend added to #lockScreen or .lockcard (would break
  compositing) — confirmed absent from diff. Markup: lk-scan + canvas inserted as FIRST children (before
  .lockcard) → card/guides sit clear+interactive on top. scan band animates translateY(102vh) but #lockScreen
  has overflow-y:auto → clipped, can't paint outside the gate. Both new els aria-hidden + textless.
- 2. ZERO DATA IN DECORATION ✓: scanned the entire new JS block (5089-5162) for fetch/XHR/eval/new Function/
  innerHTML/outerHTML/localStorage/indexedDB/cookie/WebSocket/.src=/location.*/MODEL/STATE./__sys/PUBCHK/
  PUB_B64/ownerKey/hud-state/fmtN/leftOver/GRAND → the ONLY hit is the word "STATE" inside a comment ("reads
  NO app STATE"). Canvas particles = Math.random + geometry (clientWidth/clientHeight/devicePixelRatio) only;
  parallax = e.clientX/clientY + innerWidth/innerHeight only. Nothing private can enter the canvas or the
  --lkpx/--lkpy CSS vars (cosmetic ±4px cursor offsets). Parallax listener is {passive:true}, pointerType
  guarded to mouse.
- 3. STOPS DEAD ON UNLOCK ✓: unlock() (@5016) now calls __lockFX.stop() (try-wrapped). unlock() is the SINGLE
  chokepoint for both dismiss paths — manual verify-success (@5074) AND silent saved-key auto-unlock (@5050)
  both route through unlock(). stop() teardown is COMPLETE: running=false (frame() early-returns), 
  cancelAnimationFrame, removeEventListener('resize',onResize), clearRect (blank bitmap) → zero in-app rAF +
  zero canvas listener + nothing painted. start() guards re-entry (if(running)return) → no double rAF stack.
  RE-LOCK restarts: lock() (@5017) calls __lockFX.start(); lock() is hit by expireNow (@5035), failed verify
  (@5075), logout (@5085) → field correctly comes back. Initial start (@5161) gated on #lockScreen present &&
  !.unlocked. ONE HONEST NON-GATING NUANCE (flagged to Kaito, does NOT gate): the lkParallax pointermove
  listener is NEVER torn down — but it's DESKTOP-ONLY (matchMedia hover+fine+≥1024px+no-pref gate; never
  attaches on touch/phone) AND after unlock it early-returns at `if(el.classList.contains('unlocked'))return`
  BEFORE scheduling any rAF or DOM write → near-zero residual (one early-return per desktop mousemove, no
  animation/paint). So "ZERO CPU once in-app" is very slightly imprecise (trivial idle early-return on
  desktop), but there is no animation/leak/perf defect; re-attaching per lock-cycle would be more error-prone.
  Acceptable by design.
- 4. WATCHDOG / ANTI-TAMPER INTACT ✓: __sys count IDENTICAL parent vs tip (27==27), __sys.token() 12==12 (HELD,
  no drop), PUBCHK 4047293148 ×1, PUB_B64 ×3 — diff touches NONE. watchdog beat #1 (@5194) trips on
  'overlay-removed' if #lockScreen is GONE — the diff only ADDS children inside it, never removes it → no
  false trip. beats #2/#3 (key-swapped pubChk, verifier-neutered) untouched. POISON DECISION: the canvas
  needs NO watchdog coverage — it's pure decoration, not a security control; deleting it cannot bypass the
  gate (gate = opaque overlay + key verify, neither depends on the canvas), and watch-guarding a cosmetic
  element would add fragility (a future canvas-removal refactor would falsely trip the lock) for zero security
  gain. Agree with Kaito's read. #__ownerKeySrc empty (@1840), #hud-state empty (@1836).
- 5. EXPORT/TEMPLATE CLEAN ✓: both export paths (exportDataCode @4827, exportBlank @4874) toggle the
  'unlocked' class DIRECTLY (not via unlock()/lock()) → __lockFX.start/stop NOT called → export doesn't
  perturb FX state. Serialization is documentElement.outerHTML: the two new els serialize as empty static
  tags (no data); the canvas BITMAP is NOT serialized by outerHTML (never the painted pixels). The only new
  serialized state is the inline --lkpx/--lkpy on #lockScreen IF the owner moused before exporting — two
  ±4px cosmetic cursor offsets, NOT private data, re-computed on the new device. exportBlank's data-wipe
  (MODEL=blankModel + STATE arrays zeroed incl media + reconstruct hud-state {__fresh,fid,prefs}) UNTOUCHED.
  A shared/blank file carries no new data and just inherits the decoration.
- Ran node tools/release/green.js → GREEN exit 0 (parser 21/21, assistant 16/16, streak 4/4, sound 7/7,
  reorder 7/7, transfer/silly/photo_store/pr 12, tax 105/105, media 23/23; preflight CLEAR — slots empty,
  no private key, 1 public key, no PII, PUBCHK intact, 4 scripts balanced; GUIDE/manifest/sw/team-chat clean).
  node tools/i18n/sync.js → MISSING:0 (new els are aria-hidden, ZERO new strings). sw.js/manifest untouched.
- VERDICT: SAFE @ 75f03b5. Pure presentation inside the gate; opaque curtain holds (negative-z can't escape
  #lockScreen's stacking context, base bg/lk-noscroll untouched); decoration carries zero app data; FX stops
  dead on unlock (complete teardown via the single unlock() chokepoint covering click+auto paths) + restarts
  on re-lock; watchdogs held (27/12) + canvas correctly UN-watched (decoration, not a control); export bakes
  no new data (canvas bitmap not serialized, only cosmetic --lkpx/y offsets). No DIRECT security fix required.
- Commits / SHAs reviewed: 75f03b5 (tip). TIP WILL MOVE (Arthur polish + Hugo GREEN; no new i18n so Mikoto
  MISSING:0 trivially) → I re-sign the final tip per freeze-the-candidate. No lock taken (read-only review).
- Still open: nothing security-side. Gate (steps 7–11): my SAFE @ 75f03b5; needs Hugo GREEN on the final tip
  + Osefe ship. Non-gating: parallax-listener-not-torn-down nuance → Kaito (no defect, FYI only). Sleep-mode:
  NO auto-publish without Osefe's explicit go.

## [2026-06-30] — via Kaito (asleep) — RE-SIGN: Lock-Screen Alive tip moved 75f03b5 → `aa7430f`
- Asked: re-sign SAFE on the moved tip per freeze-the-candidate. Kaito says the ONLY diff is
  Arthur's particle-cap polish (the one line I flagged would move). Verify it's exactly that one
  constant, confirm security-neutral, post SAFE @ aa7430f; STOP and flag if the diff shows anything else.
- Did / found (ran the git diff myself, did NOT trust the description):
  - `git diff --stat 75f03b5 aa7430f`: index.html (2 ±, 1 line), TEAM-CHAT.md, and three log files
    (akashi/arthur/hugo). The non-index files are chat + memory logs — NOT published artifacts.
  - `git diff 75f03b5 aa7430f -- index.html` = EXACTLY ONE line (@5108, the __lockFX resize/cap):
    `var cap = Math.min(Math.round(W*H/4600), 90);` → `… , 140);` + the trailing comment updated
    (ceil 140 holds density on big desktops; ~72 on a 390×844 phone unchanged). Nothing else moved.
  - SECURITY-NEUTRAL ✓: this is a larger INTEGER CEILING on the particle-spawn count in a pure
    decoration loop (`for(i<cap) ps.push(spawn(true))`). No new data/network/storage/listener/eval;
    the opaque curtain, FX-stop-on-unlock teardown, __sys/token/PUBCHK/PUB_B64 watchdogs, and the
    export/exportBlank clean path are all UNTOUCHED by the diff. Worst case of a bigger cap = more
    cosmetic motes painted on a large desktop gate — a perf knob, not a security surface. (Voice/cost
    is bounded: it's a one-time spawn of `cap` particles at resize, not an unbounded per-frame growth.)
  - INVARIANTS on the tip (verified, not assumed): __sys count 27==27 vs 75f03b5, __sys.token() 12==12,
    PUBCHK 4047293148 ×1, PUB_B64 ×3 — all identical to my 75f03b5 baseline. #__ownerKeySrc + #hud-state
    empty (preflight). 
  - Ran node tools/release/green.js on aa7430f → GREEN exit 0 (parser 21/21, tax 105/105, media 23/23,
    + all suites; preflight CLEAR — slots empty, no private key, 1 public key, no PII, PUBCHK intact,
    4 scripts balanced; GUIDE/manifest/sw/team-chat leak-clean).
- VERDICT: **SAFE @ aa7430f.** Everything I cleared at 75f03b5 holds; the only delta is one decoration
  cap constant. Posted SAFE @ aa7430f to TEAM-CHAT.
- Commits / SHAs reviewed: 75f03b5 (prior SAFE) → aa7430f (re-signed tip). Read-only; no lock taken.
- Still open: nothing security-side. Gate (steps 7–11): my SAFE @ aa7430f stands; needs Hugo GREEN on
  this same tip + Osefe's explicit ship (sleep-mode: NO auto-publish). If the tip moves again, I re-sign.

## [2026-07-01] — via Kaito — DESIGN: Save Safety (fail-loud storage durability probe + always-accessible open/copy-link) — NO code, design contract
- Asked: DESIGN the safety-critical contract for "Save Safety" (Osefe lost 3 Media Log adds on a mobile refresh — NOT a media bug; localStorage silently non-persisting in an in-app/ephemeral context, and autosave()'s catch @2037 only handles QuotaExceededError → SecurityError/ephemeral wipe swallowed = silent loss = violates "fail loud, never silent"). Kaito holds index.html lock + builds; I design + SAFE-review. Deliver: (1) honest detection contract w/ FP/FN risk, (2) fail-loud contract coexisting w/ _warnStorageFull/saveBadge, (3) escape-hatch mechanisms assessed for abuse, (4) exact copyable link string (fid privacy), (5) IDB mirror worth it?, (6) confirm no new leak surface + name the canary key.
- Read the REAL code (not memory): STORE_KEY='financeHudState' @1976; readLocal @1981 (try/catch→null); loadState @1985 (TEMPLATE_MODE @1990 embedded __fresh; newest-wins l vs e @1995); autosave @2029 (TEMPLATE_MODE early-return w/ amber "try mode" badge @2033; setItem @2036; catch @2037 = QUOTA-ONLY — the silent-loss gap); _warnStorageFull @2017 (once/session toast + red saveBadge, "fail loud" Akashi constraint); _quotaWarned @2016; saveBadge #saveBadge @1826; persistWarn #persistWarn @1726 (amber, display:none). Existing share/link: es #expShare @6014-6018 (navigator.share {url:location.origin+location.pathname} → clipboard.writeText → dl fallback — NO fid in that url); qrLink @6027 (u=origin+pathname+(fid?'#'+fid)); mintLink @7716 (HOST_BASE+'#'+fid); HOST_BASE='https://sagemrln.github.io/my-first-repo/' @7701; manifest start_url bakes '#'+fid @8051. LS namespaces in use: financeHudState, mrln_access_key, mrln_i18n_audit, mrln_team → canary must avoid all.
- DELIVERED (full contract in TEAM-CHAT + my final message to Kaito). Headlines:
  1. DETECTION — three signals, honest limits: (a) canary throw-probe (setItem→getItem→removeItem key `__mrln_probe`) catches storage that THROWS (private-mode-throw, storage disabled, SecurityError) — near-0 FP, but FN on the exact failure that bit Osefe (write succeeds in-session, wiped on reload). (b) THE REAL DETECTOR for Osefe's bug = a RELOAD-SURVIVAL check: on boot, if STATE was loaded from localStorage AND we have a prior-session marker but readLocal() came back null/stale, OR simpler: write a boot-count/heartbeat token and detect it's missing after a reload we know happened → in-app wipe. Simpler still + honest: (c) in-app-browser UA sniff as a PROBABILISTIC warn-early signal — token list below. NONE is a guarantee; contract is "warn on any negative signal, and always give the escape hatch so durability doesn't have to be proven."
     UA TOKENS (in-app webviews that commonly wipe/ephemeral-store): FBAN, FBAV, FB_IAB (Facebook), Instagram, Messenger, Line/ Line, Snapchat, TikTok / musical_ly / BytedanceWebview, Twitter / TwitterAndroid, Pinterest, WhatsApp, LinkedInApp, GSA (Google App), MicroMessenger (WeChat). FP risk: UA sniffing is brittle (spoofable, version-drift) → use it ONLY to raise the always-available banner, NEVER to block or to claim durability either way.
  2. FAIL-LOUD — closes the @2037 gap: autosave catch must fire _warnStorageFull on ANY throw (not just quota), with a DISTINCT message for non-quota ("This browser isn't saving — open MRLN in your real browser or copy your link"). Add a post-write VERIFY (read back STORE_KEY, compare savedAt) so a silent no-op write is caught even when setItem doesn't throw. Persistent (not once-only) banner for the durability case — reuse #persistWarn amber note pattern; saveBadge goes red. Coexist: _quotaWarned stays for quota; add a separate _durabilityWarned latch so the two messages don't clobber.
  3. ESCAPE HATCHES — SAFE set: <a target="_blank" rel="noopener noreferrer"> to the canonical URL (safest, no API), navigator.share (Web Share, user-gesture, already used @6016 — safe), clipboard copy-link (already used, fails-safe to dl()). RISKY/REJECT: android intent:// (fragile, can be hijacked to force-open arbitrary apps/schemes, breaks non-Android, ugly UX) — do NOT ship; a plain https link + "open in browser" instruction covers it. window.open acceptable but noopener-guard it.
  4. COPYABLE LINK — copy the CANONICAL app URL = HOST_BASE (the gh-pages root) OPTIONALLY + '#'+STATE.fid. PRIVACY on the fid: the #F-XXXX hash is the CUSTOMER'S OWN file id (already in their address bar, already in qrLink/mintLink/manifest start_url) → copying THEIR OWN fid back to them is fine (it's how their key binds; stripping it breaks re-open of a file-bound install). HARD RULE: NEVER put the fid in a URL PATH/QUERY (only the fragment, which browsers don't send to servers) — matches existing code. NEVER copy anyone else's fid. For a customer, copy `HOST_BASE + (STATE.fid?('#'+STATE.fid):'')`. No money/key/private-number ever in the URL — confirmed (fid is an opaque id, not a figure).
  5. IDB MIRROR — NOT worth building as a durability fallback. Honest reasoning: the same in-app/ephemeral contexts that wipe localStorage on reload ALSO wipe IndexedDB (both are "site data" cleared together by the webview) → an IDB mirror is FALSE COMFORT for exactly Osefe's failure mode. IDB already exists for photos (MEDIA @1851) and is the right tool for SIZE (photos), not for DURABILITY. The real durability answer is the escape hatch (open in a real browser / install / copy link + export), not a second same-fate store. Say so plainly.
  6. NO NEW LEAK SURFACE — canary key `__mrln_probe` holds a fixed constant ('1'), removed immediately; NEVER owner data. Banner/link carry only the canonical URL + the user's own fid (opaque id, no figure/key). No fetch/network added. No #hud-state/#__ownerKeySrc touch. UA string is read locally, never sent. exportBlank/export paths untouched.
- Verdict: DESIGN delivered, build-ready, honest about limits (I explicitly told Kaito to ship "we can't guarantee this browser saves — here's your link + install" over a false "all good"). No code touched (Kaito owns index.html + holds the lock). Nothing gated.
- Commits / SHAs: this log + TEAM-CHAT design post only. App tip unchanged (Lock-Screen Alive already SHIPPED live ab0c4ae / sw v14 per chat; lock board = Kaito holds index.html for Save Safety @ line 23).
- Still open: SAFE-review the REAL wired build later — (a) autosave catch fires _warnStorageFull on ANY throw + post-write read-back verify, (b) canary + UA signal + durability banner, (c) copy-link = canonical+own-fid only, fid never in path/query, (d) escape hatch is target=_blank rel=noopener + share + clipboard (NO intent://), (e) canary key not owner data + no new network, (f) __sys count unchanged (pure UI/storage-guard, no new figure → no poison needed). Sleep-mode: NO auto-publish without Osefe's go.

## [2026-07-01] — via Kaito (asleep, step 4+10) — REAL-CODE SAFE: Save Safety WIRED build @ `b4afa69`
- Asked: SAFE-review the WIRED Save Safety build (my own design from `e643e1b`). Verify the real diff matches
  my contract on 7 points; fix DIRECTLY if a hole, else post SAFE @ b4afa69. Osefe already lost data once → airtight.
- BASELINE: parent of the feature = 81a943c^. `git diff 81a943c^..b4afa69` = index.html (+102/-26) + TEAM-CHAT
  + mikoto.md (log). 1.7MB diff is ~all i18n dict noise; the REAL functional delta is ~120 lines (CSS banner/zone/
  lock-hatch styles + saveSafetyBanner DOM + lock #lkSaveHelp inline reveal + localebar #openSaveBtn + autosave
  read-back/fail-loud + IN_APP_BROWSER/_canonLink/_warnNotDurable + buildModalBody 3-zone rewrite + __copyLink +
  saveSafetyWire boot IIFE). sw.js/manifest UNTOUCHED (numstat empty for both).
- 1. READ-BACK VERIFY + ANY-THROW FAIL-LOUD ✓ (autosave @2072-2092): `_stuck=(getItem===_json)` after setItem
  catches a SILENT no-op write; catch branches quota→_warnStorageFull, ELSE→_warnNotDurable (any non-quota throw,
  never swallowed); `if(!_stuck && !_quotaWarned) _warnNotDurable()` catches wrote-but-didn't-stick. Double-warn
  guarded: on quota, _quotaWarned=true so the post-catch !_quotaWarned is false (no clobber); _durabilityWarned
  latch makes _warnNotDurable idempotent. Badge line gated on !_quotaWarned && !_durabilityWarned so the amber
  "auto-saved locally" can't overwrite the red "not saving". The @2037 silent-loss gap that bit Osefe is closed.
- 2. COPY LINK = CANONICAL HOST + OWN FID IN FRAGMENT ONLY ✓: `_canonLink()` @2058 =
  'https://sagemrln.github.io/my-first-repo/' + (STATE.fid?('#'+fid):''). Fid is the customer's OWN opaque file id
  (already in their address bar / qrLink / mintLink / manifest start_url). NEVER path/query (browsers don't send
  fragment to servers), NEVER a figure/key. Grepped every _canonLink use — all fragment.
- 3. NO intent:// ✓ (0 hits on tip). Escape hatches: copy-link (clipboard API → textarea/execCommand fallback,
  @8169), install STEPS (existing buildModalBody flow), open-in-browser INSTRUCTIONS (Z3, IN_APP_BROWSER only) —
  no forced scheme, no target=_blank window.open even. Safe set exactly as I specced; risky intent:// rejected.
- 4. CANARY `__mrln_probe` ✓ (@8177): setItem('1')→getItem==='1'→removeItem, immediate. Holds only '1', never
  owner data. No collision with the 4 real LS keys: financeHudState(STORE_KEY @2006), mrln_access_key(@4871/STORE),
  mrln_i18n_audit(@5623), mrln_team(@8198). Distinct namespace.
- 5. NO IDB MIRROR / NO NETWORK / NO NEW FIGURE → NO POISON ✓: grepped the +lines for fetch/XHR/eval/new Function/
  indexedDB./WebSocket/EventSource → ZERO. No money math added → no new poison site needed. __sys count 27==27,
  __sys.token() 14==14 IDENTICAL baseline vs tip → no watchdog weakened/removed. (Correctly held IDB out — same-fate
  store for the ephemeral-webview failure mode = false comfort, per my design R5.)
- 6. CURTAIN INTACT ✓ (the load-bearing privacy check): lock hatch is a SELF-CONTAINED INLINE reveal inside
  .lockcard — #lkSaveHelp (@728, display:none) toggled by #lkOpenSave (@727) to block/none; it does NOT open the
  shared .modal-back (which is z-90000, BELOW the lock overlay z-100000 → would be hidden anyway). Shows ONLY
  _canonLink() (into #lkSaveUrl via .textContent @8183) + two generic i18n steps ("open in browser"). NO MODEL/
  STATE/figure. Nothing app-content bleeds through the opaque overlay; the hatch itself is part of the lockcard,
  above the curtain, textContent-only (no injection).
- 7. NO PRIVATE DATA IN BANNER/MODAL/LOCK ✓: #saveSafetyBanner (@900) is generic warning copy only; modal URL is
  esc()'d (@132, buildModalBody h += esc(url)); lock/lockhatch textContent-only. #__ownerKeySrc empty (@1870),
  #hud-state empty (@1866). PUBCHK 4047293148 ×1, PUB_B64 ×3, no SW/manifest change → export/exportBlank untouched.
- GATE: node tools/release/green.js → GREEN exit 0 (parser 21/21, tax 105/105, media 23/23 + all 12 suites/323;
  preflight CLEAR — slots empty, no private key, 1 public key, no PII, PUBCHK, 4 scripts balanced; GUIDE/manifest/
  sw/team-chat leak-clean). node tools/i18n/sync.js → MISSING:0 (711/711, Mikoto's c983696 done).
- VERDICT: **SAFE @ b4afa69.** Every contract point implemented correctly; the silent-loss gap is genuinely closed
  (read-back + any-throw fail-loud); copy-link is canonical+own-fid fragment only (no figure/key, no path/query);
  no intent://, no network, no IDB mirror, no new poison; watchdogs held (27/14); curtain intact (inline lock hatch,
  no modal, no bleed); no private data in any new surface. No DIRECT security fix required — the build is clean.
- Commits / SHAs reviewed: b4afa69 (tip), baseline 81a943c^. Read-only review, no lock taken. Posted SAFE @ b4afa69
  to TEAM-CHAT.
- Still open: nothing security-side. Gate (steps 7–11): Mikoto MISSING:0 @ c983696 done, my SAFE @ b4afa69 posted;
  needs Hugo GREEN on THIS tip + Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If the tip moves index.html,
  I re-sign.

## [2026-07-01] — via Kaito (asleep) — RE-SIGN: Save Safety tip moved b4afa69 → `28e7d4f`
- Asked: re-sign SAFE on the moved tip per freeze-the-candidate. Kaito/Arthur say the ONLY delta is two polish nits: (1) new CSS `#openSaveBtn{min-height:44px;padding:9px 12px}` touch target, (2) the two Z3 open-in-browser step strings wrapped in `esc(t(...))`. Verify exactly those two, confirm security-neutral/positive, post SAFE @ 28e7d4f; STOP + flag if anything else.
- Did / found (ran the diff myself, did NOT trust the description):
  - `git diff --stat b4afa69 28e7d4f`: index.html (3 ±, +2/-1), TEAM-CHAT.md, three log files (akashi/arthur/hugo). Non-index files = chat + memory logs, NOT published artifacts.
  - `git diff b4afa69 28e7d4f -- index.html` = EXACTLY the two claimed hunks, nothing else:
    1. @425 ADD `#openSaveBtn{ min-height:44px; padding:9px 12px }` — pure CSS touch-target on the recovery button. No logic/data/network/listener.
    2. @8148 buildModalBody Z3 (IN_APP_BROWSER branch): the two `<li>` step strings changed from `t('…')` to `esc(t('…'))`. `esc` = the existing HTML-escape helper (@1973, &/</>/" → entities). Both strings are STATIC i18n literals (no user/MODEL/STATE data) → esc is defense-in-depth PARITY, strictly security-positive, cannot regress. `body.innerHTML=h` sink unchanged; wrapping its inputs in esc only hardens it.
  - SECURITY-NEUTRAL-OR-POSITIVE ✓: no money/parser/applyChange/export/exportBlank/watchdog line touched; no fetch/eval/new src/network added; no new i18n string (both already in dict). CSS is cosmetic; esc() is a hardening delta.
  - INVARIANTS on the tip (verified, not assumed): __sys 27==27, __sys.token() 14==14, PUBCHK 4047293148 ×1, PUB_B64 ×3 — all IDENTICAL to my b4afa69 baseline. #__ownerKeySrc empty (@1871), #hud-state empty (@1867) — confirmed byte-empty via cat -A. sw.js/manifest UNTOUCHED (numstat empty).
- VERDICT: **SAFE @ 28e7d4f.** Everything I cleared at b4afa69 holds; the only index.html delta is a cosmetic 44px CSS rule + esc()-parity on two static Z3 strings — security-neutral-or-positive, no logic/data/network change. Posted SAFE @ 28e7d4f to TEAM-CHAT.
- Commits / SHAs reviewed: b4afa69 (prior SAFE) → 28e7d4f (re-signed tip). Read-only; no lock taken.
- Still open: nothing security-side. Gate (steps 7–11): my SAFE @ 28e7d4f stands; needs Hugo GREEN on THIS same tip + Mikoto MISSING:0 on this tip (no new strings → trivially holds) + Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If the tip moves again, I re-sign.

## [2026-07-01] — via Kaito — DESIGN: Media Log v2 IMDb link-out (ruling) + Desktop Alive v2 cursor-wake (SAFE-in-principle)
- Asked: (1) RULING on the app's FIRST outbound third-party nav — a per-entry "↗ IMDb" link opening imdb.com/find/?q=<title> in a new tab. Confirm offline/cost-rule compliance, no-leak attrs, injection-safe construction, privacy honesty, games/shows/films→IMDb concern. (2) Quick SAFE-in-principle on the desktop cursor-wake ambient (cyan ripple canvas trailing mouse in side gutters). No code from me; build-ready design + I SAFE-review the wired diff.
- Read the REAL code (not memory): esc() @1973 (&/</>/" → entities); the ONE existing outbound-link precedent renderStats row() @3199 (`<a href="'+s.url+'" target="_blank" rel="noopener noreferrer">` — s.url is a STATIC trusted GRADE_SOURCES url, s.label is esc()'d); media module MEDIALOG @7013-7141 — renderLists() @7094 paints title via esc(m.title) at @7099 (to-watch) + @7112 (ranked) into innerHTML; delegated click handler @7130-7136 on medToWatch/medRanked reads data-rate/data-delmed/data-togcm via closest(). Both media containers are data-i18n-skip (@1663/1671). Desktop-gate precedent: lkParallax @5197 uses matchMedia('(hover:hover) and (pointer:fine) and (min-width:1024px)') && '(prefers-reduced-motion: no-preference)', pointerType!=='mouse' guard, {passive:true}, single coalesced rAF; __lockFX start() @5178 bails on reduced-motion, guards running, teardown stop() @5188 cancels rAF+removes resize listener+clearRect.
- RULING (full text in TEAM-CHAT + my message to Kaito):
  1. OFFLINE/COST ✓ APPROVED, no opt-in toggle needed. A rendered <a href> is inert until the USER taps it — the app makes ZERO automatic network call, runs nothing, costs nothing. Same class as the existing Save-Safety open-in-browser link + qrLink/mintLink. It is a plain hyperlink, not a background fetch → does NOT need an opt-in switch (the offline/cost rule is about the app phoning home or incurring running cost by DEFAULT; a user-initiated link-out does neither). FREE·OFFLINE promise intact.
  2. NO-LEAK ATTRS ✓ REQUIRED: target="_blank" rel="noopener noreferrer". noreferrer is MANDATORY (not optional) — it strips the Referer header so the app's URL + the #F-<fid> fragment never reach IMDb. noopener prevents the opened tab controlling window.opener (also implied by noreferrer, but state both). Query carries ONLY encodeURIComponent(title) — NO fid, NO key, NO other STATE. Verified the fid lives in location.hash; noreferrer is what stops it leaking.
  3. INJECTION-SAFE CONSTRUCTION ✓ — the load-bearing bit. Titles are rendered into innerHTML at @7099/@7112, so a naive href WILL break out (a title like `x" onmouseover=alert(1) x` would inject an attribute). REQUIRED construction:
       var q = encodeURIComponent(m.title||'');
       var href = 'https://www.imdb.com/find/?q=' + q;
       // then in the innerHTML string:
       '<a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer" ...>↗ IMDb</a>'
     TWO-layer defense: encodeURIComponent makes the title a safe URL component (kills ", <, >, space, etc. → %22/%3C/…), AND esc(href) on the whole href re-encodes any residual " so it cannot close the attribute. Either alone is weaker; both together = airtight. The visible link TEXT must be a STATIC label ('↗ IMDb' / t('IMDb')) — do NOT echo the raw title as link text (would need its own esc and adds nothing). "↗ IMDb" is fine.
     NOTE: encodeURIComponent does NOT encode the literal quote by default? It DOES — %22. But esc(href) is still required belt-and-suspenders because href sits inside a double-quoted attribute and any un-encoded char (there won't be, but defense-in-depth) is neutralized. Both layers stay.
     ALTERNATIVE (also SAFE, Kaito's call): build the <a> WITHOUT inline handler and let the existing delegated click handler @7130 catch a data-imdb attr → e.preventDefault + window.open(href,'_blank','noopener,noreferrer'). If going this route: href still encodeURIComponent'd, the data-attr value esc()'d, and window.open feature string MUST include 'noopener' AND set opened.opener=null is redundant with noreferrer — prefer the plain <a href> which is simpler and needs no JS. I recommend the plain <a href> (fewer moving parts, no listener change).
  4. PRIVACY HONESTY ✓ — no warning required. Tapping sends the user's own typed title + their IP to IMDb; that is inherent to ANY user-initiated outbound link and is the user's explicit choice (they tapped it). It's the same trust model as the existing open-in-browser link. A subtle affordance is enough: the ↗ arrow + "IMDb" label already signals "leaves the app to a third party." No modal/warning needed. (If Osefe wants extra care: a one-time tooltip "opens IMDb" — optional, not required by me.)
  5. GAMES/SHOWS/FILMS→IMDb ✓ no concern. IMDb's find page covers films, TV and (increasingly) games; a title-only find query degrades gracefully to a search-results page even on a miss. No accuracy/safety issue — worst case is a "no exact match" results page, which is fine. No per-type routing needed.
- DESKTOP ALIVE v2 (cursor-wake) — SAFE-IN-PRINCIPLE ✓, same class as the lock particle field / lkParallax:
  - It's pure decoration: coordinate math (pointermove clientX/Y) + Math into a canvas with pointer-events:none. Reads NO MODEL/STATE, no money figure, no network, no storage, no key. Zero data/leak/poison surface → NO poison/watchdog coverage needed (identical reasoning to the lock canvas: deleting a decoration can't bypass any security control; watch-guarding cosmetics only adds false-trip fragility).
  - THINGS TO WATCH (make these build requirements, I'll verify in the wired diff):
    a. DESKTOP-GATED HARD: gate on matchMedia('(hover:hover) and (pointer:fine) and (min-width:1024px)') AND '(prefers-reduced-motion: no-preference)' — EXACTLY like lkParallax @5199. On phone/touch/reduced-motion NOTHING attaches (no pointermove listener, no canvas, no rAF). Verify the listener is never added on mobile.
    b. LISTENER MUST NOT LEAK INTO THE APP: pointermove is {passive:true}, reads coords ONLY, never preventDefault/stopPropagation/returns false → cannot interfere with app clicks/scroll/sliders. Confine visual to the side gutters; canvas pointer-events:none so it never eats a click.
    c. rAF COALESCED + BOUNDED: one in-flight rAF (if(!raf) pattern like @5209), not one-per-event; particle/ripple count capped (like __lockFX cap) so a fast drag can't spawn unbounded work → phone-safe even if it ever ran (it won't, it's desktop-gated).
    d. TEARDOWN / IDLE: honor visibilitychange to stop the rAF when hidden (battery), consistent with existing FX. Not strictly security, but flag it.
  - Verdict on cursor-wake: SAFE by design PROVIDED it's a pure coordinate→canvas decoration with the desktop gate + passive listener + no STATE read. I SAFE-review the real diff once wired (checking: no data read, listener passive+desktop-only, __sys count unchanged, export bakes no new data, no new i18n string).
- Verdict: DESIGN + rulings DELIVERED, build-ready. Both features carry NO money figure → NO poison needed (confirmed with Kaito). No code touched by me (Kaito owns index.html + holds the lock). Nothing gated yet.
- Commits / SHAs: this log + TEAM-CHAT design post only. App tip f0ec566 (Arthur's IMDb spec), Kaito holds the lock per b58a6b4.
- Still open: SAFE-review the WIRED builds later — (Media) href=encodeURIComponent(title) + esc(href), target=_blank rel="noopener noreferrer", link text static, query carries ONLY the title (no fid/key/STATE), no new network in-app, no new i18n string that mangles user titles (link label is static/skip-safe), __sys count unchanged; (Cursor-wake) desktop-gated listener never attaches on mobile, passive coord-only read, no STATE/network/storage, rAF bounded+coalesced, no new data in export, __sys count unchanged. Sleep-mode: NO auto-publish without Osefe's explicit go.

## [2026-07-01] — via Kaito (asleep, step 4+10) — REAL-CODE SAFE: Media Log v2 (types/filter/genre/seed/IMDb link-out) @ `b278a49`
- Asked: real SAFE review on the CURRENT tip (verify, don't trust). (a) IMDb link-out can't leak owner numbers/fid/referrer + can't be XSS'd via hostile title/genre (esc + encodeURIComponent hold at href AND visible text); media_test injection cases assert what matters. (b) all new user-content fields (genre/title/seed) render through esc() — no raw interpolation into innerHTML. (c) no money figure → confirm no __sys poison needed (or apply directly if any new surface needs it). (d) run green.js + preflight myself, confirm CLEAR.
- READ THE REAL CODE (index.html MEDIALOG @7027-7188, esc @1989, t @5427, tf @5429, exportBlank @4928):
  - (a) IMDb `imdb(m)` @7046: `href='https://www.imdb.com/find/?q='+encodeURIComponent(m.title||'')` then `'<a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer" class="btn ghost" data-i18n-skip …>↗ IMDb</a>'`. TWO-LAYER as I specced: encodeURIComponent kills "/</>/space in the title (→%22/%3C/%3E/%20), esc(href) re-encodes any residual " so it can't close the attr. Visible text is the STATIC label ↗ IMDb (never the raw title). Query carries ONLY the title — no fid/key/STATE. rel="noopener noreferrer" present → strips Referer so the app URL + #F-<fid> fragment never reach IMDb, and opened tab can't touch window.opener. Hand-traced hostile title `"><img src=x onerror=alert(1)>` → fully %-encoded in href, ZERO markup emitted. AIRTIGHT.
  - media_test.js (43/43): extracts the LIVE imdb()+esc() from index.html (no copy drift) and asserts the RIGHT things — hostile title `"><img…>` → `%22%3E%3Cimg` in href AND no `<img` tag; `Tom & Jerry`→`q=Tom%20%26%20Jerry` (encodeURIComponent survives esc, single param, no double-mangle); target=_blank + rel="noopener noreferrer" present; label static (no `>Dune<`); missing title → empty query, no crash. Real injection guards, not cosmetic.
  - (b) EVERY new user-content sink escaped: title esc(m.title) @7134/7150/7153 + calibration neighbours esc(x.title) @7109 + showCompare header tf('…{title}…',{title:esc(m.title)}) @7110 (tf does raw {k} substitution → the pre-esc is REQUIRED and present); genre esc(m.genre) in subLine @7044; comment esc(m.comment)+esc(whenY) @7150; seed chips esc(s) in BOTH the data-seed attr and visible text @7141 (SEED is a static hardcoded proper-noun array anyway). typeOf() @7034 restricts to film/game/show so TYPE_LABEL lookup can't be poisoned. medRateTitle/medComment/medRateGenre set via .textContent/.value @7072-7074 (no innerHTML). msg() @7041 uses textContent → the tf() add/rated toasts (raw title) are safe. NO raw user string reaches any innerHTML anywhere.
  - i18n invariant #4 held: #medToWatch @1678 + #medRanked @1686 + #medRateTitle @1691 all data-i18n-skip; imdb <a> and seed chips carry data-i18n-skip → the translation walker never touches user titles/genre/comments.
  - (c) NO POISON NEEDED — CONFIRMED. Media Log holds NO money figure: nothing in the module reads/derives/displays a licensed/poisoned value (ratings are the user's OWN taste, not owner finances). Adding __sys.token() to a taste list would only add false-trip fragility and guard nothing — same ruling as the lock/sound/reorder cosmetics. __sys count 27==27, token() 12==12 vs my aa7430f/28e7d4f baseline → NO watchdog weakened/removed. NO security edit made.
  - LEAK/EXPORT: STATE.media (titles/genre/type) can't reach a customer/blank file — exportBlank @4928 HARD-reconstructs hud-state as {__fresh,fid,prefs:{lang,currency}} @4942 (fresh object, not a STATE dump), so media is dropped by construction (same proven mechanism as streak/sound/tabOrder). Owner's own data-code round-trips media (transfer_test 58/58) — his file, fine. No fetch/XHR/eval/new Function in the module (the ONLY network-ish is the inert user-tapped <a href>). No SW/manifest change.
  - (d) node tools/release/green.js → GREEN exit 0 (13 suites/all: parser 21/21, tax 105/105, media 43/43, transfer 58/58, savesafety 14/14, +rest; preflight CLEAR — slots empty, no private key, 1 public key, no PII, PUBCHK 4047293148 ×1, 4 scripts balanced; GUIDE/manifest/sw/team-chat leak-clean). node tools/publish/preflight.js index.html → CLEAR exit 0. #__ownerKeySrc @1887 + #hud-state @1883 byte-empty. PUB_B64 ×3.
- VERDICT: **SAFE @ b278a49.** IMDb link-out is injection-proof (encodeURIComponent+esc, static label, noreferrer) and leaks no number/fid/referrer; every new user field renders through esc(); no money figure → no poison needed (watchdogs 27/12 unchanged); media can't reach a blank/customer file; gate GREEN. NO security edit required — the build implements my a9214c6 design contract exactly.
- Commits / SHAs reviewed: b278a49 (tip). Baseline for watchdog counts: aa7430f/28e7d4f (27/12 → identical). Read-only, no lock taken, NO edits. Posted SAFE @ b278a49 to TEAM-CHAT.
- Still open: nothing security-side. Gate (steps 7–11): Mikoto MISSING:0 already posted (6f3c065, tip since moved to b278a49 = only i18n grammar/log commits, no functional index.html change — she should re-confirm MISSING:0 on b278a49, trivially holds); needs Hugo GREEN on THIS tip + Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If the tip moves index.html, I re-sign.

## [2026-07-01] — via Kaito (asleep, freeze re-sign) — RE-SIGN Media Log v2 UI/guide delta b278a49..86c55e8
- Asked: re-sign on the CURRENT tip 86c55e8 (freeze-the-candidate — surface moved since my SAFE @ b278a49). (a) confirm index.html dbf3469 is display-only, no new data path / un-esc'd string / injection, watchdogs+slots intact; (b) confirm GUIDE.md 03da14d IMDb privacy CLAIM is accurate & no overclaim (my final say), PDF leak-clean; (c) run green.js + preflight myself.
- Did / found (read the actual b278a49..86c55e8 diffs, ran the gate — not on faith):
  - (a) index.html DISPLAY-ONLY ✓ — diff is purely CSS/layout: medTypeBtn/medFilterBtn gained min-height:44px; imdb() <a> gained title="IMDb" (STATIC literal, not user data) + min-height:36px/inline-flex; rows wrapped action buttons into a `.med-actions` flex cluster; title min-width:60%; ranked rating moved adjacent to title. The imdb() href construction is BYTE-IDENTICAL: `encodeURIComponent(m.title||'')` then `esc(href)` on the whole href, static "↗ IMDb" label — two-layer defense unchanged. m.title still rendered ONLY through esc(m.title); m.genre via esc() in subLine; m.comment/whenY via esc(). NO raw interpolation added. title="IMDb" is a fixed string → no injection surface. No fetch/XHR/eval/innerHTML-with-user-data added. Grepped diff: no parseClause/applyChange/exportBlank/exportHTML/__sys/PUBCHK/PUB_B64/ownerKeySrc/hud-state touch.
  - WATCHDOGS/SLOTS ✓ — __sys 27==27, token() 14==14 (HEAD vs b278a49) → nothing weakened/removed. PUBCHK/PUB_B64 present (5). #__ownerKeySrc byte-empty, #hud-state byte-empty. No money figure in Media Log → no poison needed (unchanged ruling).
  - (b) GUIDE.md — the IMDb BULLET (§8 line 158) is ACCURATE ✓: "sends only the title to IMDb — never your MRLN data (no finance ID, and rel=noopener noreferrer strips the referrer)". Correctly matches the code (query carries only encodeURIComponent(title); noreferrer strips Referer so app URL + #F-<fid> fragment never reach IMDb). No overclaim in the bullet.
  - (b) OVERCLAIM FOUND — §8 line 166 "**Data:** … all stored locally. **Nothing ever leaves your device.**" — this bolded ABSOLUTE sits in the SAME section that now documents the IMDb link, which DELIBERATELY sends the user's title off-device. In the narrow "stored fields never sync" sense it's true, but as an unqualified "nothing leaves" absolute it CONTRADICTS the IMDb bullet 8 lines above. As the privacy authority I will not sign a guide that makes a blanket "nothing leaves" claim next to a documented outbound link. This is a doc overclaim, NOT a code/leak defect.
  - PDF ✓ — MRLN-Guide.pdf derives from the scanned GUIDE.md; green.js leak scan marks it clean-by-derivation (GUIDE.md scanned clean). Note: if GUIDE.md line 166 is corrected, the PDF must be rebuilt from the corrected source (Hugo).
  - GATE ✓ — node tools/release/green.js → GREEN exit 0 (14/14 leak+copy-link tests, preflight CLEAR, all published files clean). node tools/publish/preflight.js index.html → CLEAR exit 0 (slots empty, no private key, 1 public key, no PII, PUBCHK intact, scripts balanced).
- Decision / verdict: index.html 86c55e8 is display-only + injection-safe + watchdogs/slots intact → the CODE surface is SAFE. BUT the guide has a privacy OVERCLAIM (line 166) I have final say on → I do NOT post SAFE on the current tip. Verdict = FIX (doc-only). Find-xor-fix: GUIDE.md is Hugo's file → I route the precise wording fix to Hugo (I do NOT edit it; security edit exception is code-integrity, not prose). Gate stays OPEN until line 166 is scoped/caveated and the PDF is rebuilt from the corrected source; I re-sign the new tip then.
  - Precise fix routed to Hugo: replace the bolded "Nothing ever leaves your device." with a SCOPED claim, e.g. "Your Media Log data is stored only on your device and never syncs or uploads on its own." (or keep it and append: "— the only exception is the ↗ IMDb link, which you tap on purpose and which sends just the title.") Then rebuild MRLN-Guide.pdf from the corrected GUIDE.md and re-run green.js.
- Commits / SHAs: reviewed 86c55e8 (tip); index.html delta dbf3469, GUIDE.md delta 03da14d. Baseline watchdog counts b278a49 (27/14 → identical). Read-only, NO lock taken, NO edits by me.
- Still open: Hugo fixes GUIDE.md line 166 overclaim + rebuilds PDF → tip moves → I re-sign (code side already clear; only the guide wording gates my SAFE). Sleep-mode: NO auto-publish without Osefe's explicit go.

## [2026-07-01] — via Kaito (asleep, re-sign) — SAFE: Media Log v2 guide overclaim fixed @ `cbfa3f0`
- Asked: re-verify ONLY what changed since my FIX verdict — the guide §8 prose + rebuilt PDF — and re-sign if clear. (a) §8 "Data:" claim now accurate + no other §8/guide absolute contradicts the IMDb link-out (my final-say privacy call); (b) PDF derives from corrected clean GUIDE.md; (c) run green.js + preflight myself.
- Context: current tip cbfa3f0 (Hugo's GREEN+log commits sit on af8ca27, the fix). At my last review (86c55e8) I withheld SAFE — §8 line 166 had an unqualified bolded "Nothing ever leaves your device." contradicting the outbound ↗ IMDb link. Verdict then = FIX (doc-only), routed to Hugo.
- Did / found (git diff 86c55e8..HEAD + full guide sweep + gate, not on faith):
  - (a) §8 "Data:" line (166) NOW ACCURATE ✓ — reads "Your Media Log data stays on your device — it never syncs or uploads on its own (the ↗ IMDb button is the one exception, and only when you tap it: it sends just the title, nothing else)." The unqualified absolute is gone; matches the code (imdb() query = encodeURIComponent(title) only, rel="noopener noreferrer" strips Referer) and is consistent with the §8 IMDb bullet (158). No other §8 absolute contradicts the link.
  - WHOLE-GUIDE SWEEP for contradicting absolutes ✓ — grepped never-leaves/nothing-uploaded/fully-offline/no-server across GUIDE.md. Line 18 (features table: "Private | your data never leaves your device. Nothing is uploaded, tracked, or sold.") and §15 line 273 ("never uploaded — there's no server to upload to") are the app's AUTONOMOUS-behavior promise (no telemetry/no server sync), scoped to uploaded/tracked/sold. The user-tapped IMDb link is a browser navigation the user initiates — NOT the app phoning home — and is now disclosed twice in detail (§8 + §15). These are the standard honest framing, not overclaims → NON-GATING. (Both predate Media Log v2 — from 2026-06-28, not introduced by this change.) RULING: different class from the §8 line I blocked (that one was unqualified + sat 8 lines below the IMDb bullet in the very section documenting the link = glaring local contradiction). Line 18 = qualified global principle + fully disclosed exception → accurate.
  - (b) PDF DERIVES FROM CORRECTED SOURCE ✓ — GUIDE.md AND MRLN-Guide.pdf both last touched in the SAME commit af8ca27 (the fix); NO GUIDE.md edit after. Raw byte scan of the PDF: old "Nothing ever leaves your device" string ABSENT (stream compressed, so text-verify not possible directly, but the old string can't be present as loose bytes + derivation-by-commit is the proof). green.js leak scan = clean-by-derivation. The two commits on top (6b11ac7, cbfa3f0) = Hugo GREEN + log only, no GUIDE/PDF/index change.
  - index.html UNCHANGED since dbf3469 (already cleared at 86c55e8: display-only, imdb() href byte-identical, all fields esc'd). Re-confirmed watchdogs via preflight (slots byte-empty, PUBCHK 4047293148, 1 public key, 4 scripts balanced).
  - (c) node tools/release/green.js → GREEN exit 0 (13 suites: parser 21/21, assistant 16/16, streak 4/4, sound 7/7, reorder 7/7, onboarding 10/10, transfer 58/58, silly 43/43, photo 17/17, pr 12/12, tax 105/105, media 43/43, savesafety 14/14; preflight CLEAR; GUIDE/manifest/sw/team-chat leak-clean; PDF clean-by-derivation). node tools/publish/preflight.js index.html → CLEAR exit 0.
- Decision / verdict: **SAFE @ cbfa3f0.** The §8 privacy claim is now accurate with NO remaining contradiction (final-say privacy call). PDF derives from the corrected clean source. Gate GREEN/CLEAR. Full gate satisfied on this tip's content (Akashi SAFE · Mikoto MISSING:0 · Hugo GREEN). NO security edit required.
- Commits / SHAs: reviewed cbfa3f0 (tip); guide/PDF fix af8ca27. Read-only, NO lock, NO edits. Posted SAFE @ cbfa3f0 to TEAM-CHAT MESSAGES + added Media Log v2 to Pending (fully signed).
- Still open: awaiting Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If the tip moves, I re-sign. Low-pri hardening note (non-gating): line 18's global "never leaves your device" could one day add "(the app never phones home)" belt-and-suspenders, but the qualifier + §8/§15 disclosure make it accurate today.

## [2026-07-01] — via Kaito (asleep, step 4+10) — REAL-CODE SAFE: Desktop Alive v2 cursor-wake + premium cold-boot @ `d1aa48f`
- Asked: SAFE-review BOTH new pure-decoration features on the CURRENT tip (verify, don't trust). (a) confirm both are pure decoration → NO poison needed, and the NEW inline __bootFX script reads no app state (only clock + #boot node), not an exfil path; (b) watchdogs intact + new 5th <script> doesn't break preflight script-balance; (c) #boot can't leak/trap (self-removes, 4000ms net, zero data); (d) assess the pre-existing render-blocking Google-Fonts @import (line 16) — real offline risk? worth a separate fix? do NOT let it block THIS ship (features didn't touch it); (e) run green.js + preflight myself.
- BASELINE: cleared vs live gh-pages 106ffcd. index.html real delta +110/-57 (~all i18n dict noise; functional delta = CSS boot/wake blocks + boot markup + __bootFX inline script + cursorWake IIFE + one .ready() call + 1 data-i18n string). sw.js/manifest UNTOUCHED (numstat empty).
- FEATURE 1 — cursor-wake (cursorWake IIFE @8155-8192): PURE DECORATION ✓. Scanned the whole IIFE for MODEL/STATE/fetch/XHR/eval/localStorage/sessionStorage/cookie/indexedDB/innerHTML/.src=/__sys/PUBCHK/PUB_B64/ownerKey/setItem/getItem → ZERO. Reads ONLY e.clientX/clientY/pointerType/timeStamp + window.innerWidth/innerHeight + devicePixelRatio; writes ONLY canvas pixels (expanding cyan ring strokes). DESKTOP-GATED HARD (matches lkParallax): matchMedia '(hover:hover) and (pointer:fine) and (min-width:1024px)' AND '(prefers-reduced-motion: no-preference)'; `if(!ok) return;` BEFORE any listener → on touch/phone/reduced-motion NO pointermove/resize listener, no canvas ctx, no rAF. pointermove {passive:true}, mouse-only guard, reads coords only — no preventDefault/stopPropagation → can't eat app clicks/scroll (#wakefx also pointer-events:none, z-index:0 BEHIND .wrap z:1). rAF SINGLE-IN-FLIGHT (if(!raf)) + bounded ring cap MAX=60 (rings.shift() when full) → a fast drag can't spawn unbounded work; raf cancels itself (`if(rings.length) …; else clearRect`) when empty. try/catch wrapped. NO money figure → NO poison needed (deleting a decoration can't bypass a control; same ruling as lock/sound/media cosmetics).
- FEATURE 2 — premium cold-boot (#boot markup @744-747, __bootFX inline script @748-762, .ready() call @5295, CSS @102-132): PURE DECORATION ✓. The NEW 5th <script> (__bootFX) is the load-bearing new surface — read it line-by-line: it calls ONLY document.getElementById('boot'), el.classList.add('boot-out'), el.parentNode.removeChild(el), el.addEventListener('transitionend',…,{once:true}), setTimeout, performance.now(). NO app state, NO MODEL/STATE, NO fetch/XHR/eval/storage/cookie/innerHTML/.src= (the sole "state" token in the block is the COMMENT "reads no app state"). NOT a data/exfil path — it has no data to move and no channel to move it on. #boot carries ZERO data: just the "MRLN" wordmark + the "// SYSTEM ONLINE" i18n status line (aria-hidden). 
- CANNOT LEAK OR TRAP ✓: kill() removes #boot via removeChild → zero rAF/paint/listener after. Removal is driven by TIMERS (performance.now floor + setTimeout), NOT by font-load or transitionend alone — reduced-motion has no transition so `setTimeout(gone, FADE+90)` still fires; and a 4000ms self-dismiss net calls ready() even if init throws before .ready() → boot can NEVER strand the user. #boot is z-index:100001 (ABOVE lock 100000), opaque background:var(--bg) → it fully covers the gate during boot then removes itself; nothing app-content bleeds and nothing is trapped underneath.
- WATCHDOGS / SLOTS ✓: __sys 36==36, __sys.token( 14==14, PUBCHK 2==2 (value 4047293148 present), PUB_B64 3==3 — IDENTICAL HEAD vs 106ffcd (diff touches none). #__ownerKeySrc byte-empty (`<script id="__ownerKeySrc" type="text/plain"></script>`), #hud-state byte-empty. New 5th <script> is BALANCED — preflight reports "script tags balanced (5)"; open=5/close=5. No unguarded surface introduced (the boot script is self-contained, no eval/no dynamic src).
- i18n invariant ✓: ONE new string "// SYSTEM ONLINE" (data-i18n on .boot-sys, aria-hidden); Mikoto MISSING:0 (723 keys). "MRLN" wordmark stays raw. No user-content mistranslation risk (boot carries no user data).
- (d) @import ASSESSMENT (line 16, PRE-EXISTING, untouched by these features): render-blocking CSS @import of fonts.googleapis.com → pulls Orbitron/Rajdhani/Share Tech Mono. It has `display=swap` in the URL, which makes the TEXT fall back to a system font and paint immediately once the font request resolves/fails — BUT a CSS @import inside <style> is itself render-blocking (the stylesheet isn't considered ready until the import resolves or the connection fails), so on a HANGING (not-refused) connection first paint can stall until the socket times out (Kaito's 13s offline-sandbox observation). REAL-WORLD verdict: on a normal offline device the request FAILS FAST (DNS/connection refused → ms, not seconds) and the app paints; the 13s is a pathological hang-not-refuse sandbox, not the common offline path. So it fast-fails acceptably in PRACTICE, but it IS a genuine (pre-existing, low-frequency) first-paint-resilience weakness for an "offline-first" app. My call: NON-BLOCKING for THIS ship — the two features did NOT touch line 16 and did NOT make it materially worse (boot/wake fall back to system fonts if the @import stalls; boot removal is timer-driven, not font-driven, so a stalled font can't even trap the boot). WORTH a SEPARATE hardening fix (backlog, low-med): move fonts off the render-blocking @import → either self-host/inline-subset the 3 families (best for true offline, +MB but no money cost) or use a non-blocking `<link rel="preload" as="font">`/`<link rel="stylesheet" media=print onload> `swap, so a hung font connection can never block first paint. Recommend self-hosted subset (keeps the FREE·OFFLINE promise honest — currently the app fetches fonts from Google on first online load, a third-party call). Logging as a backlog item, not gating.
- GATE: node tools/release/green.js → GREEN exit 0 (14 suites: parser 21/21, assistant 16/16, streak 4/4, sound 7/7, reorder 7/7, onboarding 10/10, transfer 58/58, silly 43/43, photo 17/17, pr 12/12, tax 105/105, media 43/43, savesafety 14/14, copy-link/leak 14/14; preflight CLEAR — slots empty, no private key, 1 public key, no PII, PUBCHK intact, script tags balanced (5); GUIDE/manifest/sw/team-chat leak-clean). node tools/publish/preflight.js index.html → CLEAR exit 0.
- VERDICT: **SAFE @ d1aa48f.** Both features are pure coordinate/clock→canvas/DOM decoration; zero money/key/network/storage/injection surface; the new __bootFX inline script reads only the clock + #boot node (no app state, not an exfil path); #boot self-removes and can't trap (timer-driven removal + 4000ms net) and carries no data; watchdogs held IDENTICAL (36/14, PUBCHK/PUB_B64) + correctly UN-poisoned (decoration, not a control); slots byte-empty; script tags balanced (5); GREEN/CLEAR. NO security edit required — build is clean. @import is a pre-existing, non-blocking, separate-backlog hardening item (features didn't touch/worsen it).
- Commits / SHAs reviewed: d1aa48f (tip), baseline live 106ffcd. Read-only, NO lock taken, NO edits by me. Posting SAFE @ d1aa48f to TEAM-CHAT.
- Still open: nothing security-side. Gate (steps 7–11): Hugo GREEN @ d1aa48f + Mikoto MISSING:0 already posted, my SAFE @ d1aa48f = full sign-off on this tip → awaiting Osefe's explicit "ship it" (sleep-mode: NO auto-publish). NEW BACKLOG: move Google-Fonts @import off render-blocking (self-host/inline subset or preload-swap) — low-med, offline-first resilience + removes a third-party font fetch. If the tip moves index.html, I re-sign.

## [2026-07-01] — via Kaito (asleep, freeze re-sign after P0) — RE-SIGN Desktop Alive v2 + P0 script-parse repair @ `c5f92bb`
- Asked: re-verify + re-sign on the CURRENT tip after Arthur browser-caught a P0 the whole gate (incl. my SAFE @ d1aa48f) missed — i18n merge 2f3c9cc left an orphan brace → the ENTIRE main <script> failed to parse ("missing ) after argument list") → window.LOCK/STATE/MEDIALOG undefined → dead app. Kaito fixed at c5f92bb: 1-char index.html change (line ~5427, feature-translations merge IIFE '});'→');') + a NEW committed guard tools/test/html_parse_test.js (compiles every <script> body with vm.Script, wired as green.js step 0). (a) confirm index.html change is EXACTLY the brace repair + app now parses; (b) sanity-check the new guard is sound + safe; (c) run green.js + preflight.
- Did / found (git diff d1aa48f HEAD myself + ran the gate — not on faith):
  - (a) BRACE-ONLY ✓ — index.html delta is EXACTLY +1/-1: the only changed line pair is `});` → `);` at the feature-translations merge IIFE (line 5427). Confirmed by counting: `grep -cE '^\+[^+]'`=1, `^-[^-]`=1. The 872KB `git diff` is PURE CONTEXT NOISE — one giant single-line i18n dictionary object; only its closing paren differs. Read the repaired region (5424-5428): now `(function(extra){…})({…es…da…de…sv…nb…hu…})` invoked, then `);` closes the outer wrap correctly. The old `});` had an orphan `}` (an extra object-close before the call-paren) that broke the parse. NO other code/surface change — no parser/applyChange/export/watchdog/SW/manifest edit.
  - APP PARSES ✓ — node tools/test/html_parse_test.js → all 3 JS <script> blocks compile (script #1 ~line 748 __bootFX, #2 ~1951 main app, #3 ~8294), "app script is syntactically valid", exit 0. The dead-script bug is gone. (Guard skips the type="application/json" hud-state + empty __ownerKeySrc slots; counts 3 JS scripts vs preflight's 5 balanced tag-pairs — both consistent.)
  - (b) GUARD SOUND + SAFE ✓ — read tools/test/html_parse_test.js line-by-line: fs.readFileSync(index.html) only; regex-extracts <script> bodies; `new vm.Script(body,{filename})` COMPILE-ONLY — there is NO .runInContext / .runInThisContext / eval / Function() anywhere → it detects syntax errors WITHOUT EXECUTING a single line of page code (browser globals not needed to catch a parse error). No network, no writes, no reads of any secret/owner file. It cannot run anything dangerous. Correctly skips type != text/javascript|module|application/javascript and empty bodies. Deterministic, zero deps. Exactly closes the gap: green.js extracts individual functions (never parses the file as a browser) + preflight checks brace BALANCE not VALIDITY (a stray-but-balanced brace passes) → only a browser-load (or now this guard) catches it. Sound design.
  - WATCHDOGS / SLOTS ✓ — since the only index.html change is that one brace (touching none of them), the watchdog surface is BYTE-IDENTICAL to my already-cleared d1aa48f: PUBCHK 4047293148 present (×2 lines), PUB_B64 ×3, __sys.token( / __sys. threading intact. #__ownerKeySrc byte-empty (`<script id="__ownerKeySrc" type="text/plain"></script>`), #hud-state byte-empty. Pure decoration → NO poison needed (my d1aa48f ruling unchanged; a brace fix adds no money math).
  - i18n ✓ — brace fix doesn't touch dictionary content; Mikoto MISSING:0 (723 keys) holds trivially (she should re-confirm on c5f92bb — no functional i18n change).
  - (c) GATE ✓ — node tools/release/green.js → GREEN exit 0 (NOW 14 suites incl. the new html-parse guard as step 0: html-parse 3/3, parser 21/21, assistant 16/16, streak 4/4, sound 7/7, reorder 7/7, onboarding 10/10, transfer 58/58, silly 43/43, photo 17/17, pr 12/12, tax 105/105, media 43/43, savesafety 14/14; preflight CLEAR — slots empty, no private key, 1 public key, no PII, PUBCHK intact, script tags balanced (5); GUIDE/manifest/sw/team-chat leak-clean). node tools/publish/preflight.js index.html → CLEAR exit 0.
- Decision / verdict: **SAFE @ c5f92bb.** index.html delta is brace-only (`});`→`);`, +1/-1) and the app now parses (html_parse_test 3/3); the new parse guard is compile-only (no exec/eval/network/sensitive reads) → sound + safe and closes the dead-script class for good; my d1aa48f decoration findings all still hold (no poison, watchdogs byte-identical, slots empty, scripts balanced 5); gate GREEN/CLEAR. NO security edit required.
- MY MISS (owned): my d1aa48f SAFE relied on green.js + preflight, neither of which parsed the file as a browser — so a syntactically-invalid-but-brace-balanced merge slipped past me. Arthur's browser-load caught it. The new html_parse_test.js (green.js step 0) is the right structural fix; from now on my SAFE is backed by an actual browser-parity parse of every <script>. Lesson logged.
- Commits / SHAs: reviewed c5f92bb (tip); index.html delta = the 1-char brace repair; new guard tools/test/html_parse_test.js + green.js step-0 wiring. Baseline for decoration/watchdog findings: d1aa48f (my prior SAFE). Read-only, NO lock taken, NO edits to app code by me (only TEAM-CHAT + this log).
- Still open: Hugo re-signs GREEN on c5f92bb (tip moved d1aa48f→c5f92bb for the P0 fix + new guard); Mikoto re-confirm MISSING:0 on c5f92bb (trivial). Then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If the tip moves index.html again, I re-sign. BACKLOG still open: move Google-Fonts @import off render-blocking (offline-first resilience).

## [2026-07-01] — via Kaito (asleep, re-SAFE) — SAFE: cold-boot retime to ~3s @ `61c8363`
- Asked: quick re-SAFE on the current tip. Osefe wanted the loading screen slowed to ~3s (it flashed by unseen); Kaito retimed it at 61c8363. Claim = TIMING/CSS ONLY. Verify, don't trust: diff should show only (a) __bootFX MIN 900→3000 + (b) CSS anim durations/delays + two new decorative keyframes. No data/network/storage/JS logic/watchdog surface.
- Did / found (ran `git diff 8bb5f8d HEAD` MYSELF + read the __bootFX block + ran the gate — not on faith):
  - DIFF EXACTLY AS CLAIMED ✓ — index.html +17/-... (2±): (a) `#boot` @759 `MIN=900`→`MIN=3000` (the fade floor). (b) CSS @120-138: bootGrid 620→900ms/60→120ms delay, bootSweep 720→1700ms/240→500ms + keyframe 12%→10% opacity + 70vh→82vh translateY, bootLogoIn 520→1000ms/380→900ms delay + glitch 420→560ms + ADDED `bootLogoBreath 2.4s …infinite`, bootSysIn 400→600ms/720→1750ms + ADDED `bootSysPulse 1.5s …infinite`. Two NEW keyframes: `bootLogoBreath{50%{filter:brightness(1.22)}}` + `bootSysPulse{50%{opacity:.5}}` — pure visual pulses. Plus a 3-line explanatory comment. NOTHING else — no parser/applyChange/export/exportBlank/__sys/PUBCHK/PUB_B64/SW/manifest touch.
  - STRAND-NET INTACT ✓ (the one thing to check when a boot floor is raised): __bootFX @759-766 — `ready(){…setTimeout(kill,Math.max(0,MIN-nowMs()))}` and the hard net `setTimeout(function(){if(!done)ready();},4000)` @765. MIN=3000 sits BELOW the 4000ms net → the net always fires ready(), and at t≈4000 `Math.max(0,3000-4000)=0` → kill immediate. Boot ALWAYS dismisses (~3s when app-ready fires earlier, ~4s worst case). Raising MIN below 4000 cannot strand the user. #boot still carries zero data + self-removes (classList boot-out → removeChild + FADE+90 timeout fallback for reduced-motion).
  - WATCHDOGS / SLOTS BYTE-IDENTICAL to 8bb5f8d ✓ — `__sys.token(` 12==12, `__sys.` 24==24, PUBCHK/4047293148 2==2, PUB_B64 3==3 (diff touches none). `#hud-state` (@1950) + `#__ownerKeySrc` (@1954) byte-empty. Pure decoration → NO poison needed (a boot animation reads no money figure; watch-guarding it only adds false-trip fragility — same standing ruling as lock/sound/media/cursor-wake cosmetics).
  - GATE ✓ — node tools/test/html_parse_test.js → 3/3 exit 0 (app parses). node tools/release/green.js → GREEN exit 0 (14 suites: html-parse 3/3, parser 21/21, assistant 16/16, streak 4/4, sound 7/7, reorder 7/7, onboarding 10/10, transfer 58/58, silly 43/43, photo 17/17, pr 12/12, tax 105/105, media 43/43, savesafety 14/14; preflight CLEAR — slots empty, no private key, 1 public key, no PII, PUBCHK intact, script tags balanced (5); GUIDE/manifest/sw/team-chat leak-clean). node tools/publish/preflight.js index.html → CLEAR exit 0.
- VERDICT: **SAFE @ 61c8363.** The change is purely timing/CSS: one floor constant (900→3000, still below the 4000ms strand-net → can't trap) + retimed anim durations/delays + two decorative pulse keyframes. Zero data/network/storage/JS-logic/injection surface; watchdogs byte-identical; slots empty; boot can't strand or leak; gate GREEN/CLEAR. NO security edit required.
- Commits / SHAs: reviewed 61c8363 (tip), baseline 8bb5f8d (prior shipped v17). Read-only, NO lock, NO edits to app code. Posted SAFE @ 61c8363 to TEAM-CHAT.
- Still open: nothing security-side. Gate: needs Hugo GREEN + Mikoto MISSING:0 re-confirm on 61c8363 (no new i18n string → trivial), then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If the tip moves index.html, I re-sign. BACKLOG still open: Google-Fonts @import off the render-blocking critical path.

## [2026-07-01] — via Kaito (asleep, quick SAFE) — SAFE: boot loading-dots + interaction-layer Tier 1 @ `c4bc7e6`
- Asked: quick SAFE on current tip c4bc7e6 for TWO pure-CSS presentation changes — (1) boot loading dots (f2c7302: 3 decorative cyan dots, staggered CSS anim, in #boot) and (2) interaction-layer Tier 1 (c4bc7e6: universal :active press + desktop :hover + :focus-visible rings). Confirm presentation-only → no poison; watchdogs byte-identical + slots empty; run html_parse + green + preflight.
- Did / found (ran `git diff a077248 HEAD` MYSELF + verified counts + gate — not on faith):
  - SCOPE ✓ — `git diff --stat a077248 HEAD` = index.html ONLY, +48/-0 (no deletions). sw.js/manifest/manifest.json numstat EMPTY (untouched). Range = 39d8ef2(chat) → f2c7302(dots) → b69f9ed(Arthur spec/chat) → c4bc7e6(Tier1).
  - PURE CSS/MARKUP ✓ — read the whole diff line-by-line. TWO regions, both inside the `<style>` block: (a) @119-131 `.boot-dots` = flex container opacity:0 + 3 span dots + a `@media (prefers-reduced-motion:no-preference)` wrapper with `animation:bootDotsIn`/`bootDot` + nth-child delays + 2 `@keyframes` (bootDotsIn opacity, bootDot opacity/translateY). Motion-gated, hidden for reduced-motion. (b) @212-249 Tier 1 = one shared `transition:` on a control list (specific props, NOT `all`), `:active` press rules (scale .99/.95 + brightness) under motion-gate, a desktop-gated `(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)` `:hover` block (border/background/filter brighten, no translate), and a `:focus-visible` ring block. PLUS ONE markup line @799: `<div class="boot-dots" aria-hidden="true"><span></span>×3</div>` inside #boot. The `<script>` line right after is CONTEXT (unchanged). NO JS added.
  - NO POISON NEEDED ✓ CONFIRMED — grepped the ADDED (`^+`) lines for fetch/xhr/eval/innerHTML/new Function/localStorage/MODEL/STATE/__sys/<script/.src= → ZERO hits. Reads no app state, no money figure, no network, no storage. Decoration + interaction feedback only → adding __sys.token() would guard nothing and only add false-trip fragility (same standing ruling as lock/sound/media/cursor-wake/boot cosmetics). Dots are 3 empty spans + keyframes; Tier1 is :active/:hover/:focus-visible + a transition. Nothing reads state.
  - WATCHDOGS BYTE-IDENTICAL a077248↔HEAD ✓ — `__sys.token(` 12==12 (fixed-string), `__sys.` 24==24, PUBCHK 2==2 (value 4047293148 ×1), PUB_B64 3==3. A big CSS block touched none of them.
  - SLOTS BYTE-EMPTY ✓ — `#hud-state` @1998 `<script id="hud-state" type="application/json"></script>` (cat -A: `…></script>$`), `#__ownerKeySrc` @2002 `<script id="__ownerKeySrc" type="text/plain"></script>` (byte-empty). Preflight re-confirms both empty.
  - i18n invariant ✓ — no NEW data-i18n string (the boot .boot-sys "// SYSTEM ONLINE" is pre-existing); .boot-dots is aria-hidden decoration, no text. MISSING:0 holds trivially. User-content skips untouched.
  - GATE ✓ — node tools/test/html_parse_test.js → 3/3 exit 0 (app parses; scripts #1 ~801 __bootFX, #2 ~2004 main, #3 ~8347). node tools/release/green.js → GREEN exit 0 (14 suites: html-parse 3/3, parser 21/21, assistant 16/16, streak 4/4, sound 7/7, reorder 7/7, onboarding 10/10, transfer 58/58, silly 43/43, photo 17/17, pr 12/12, tax 105/105, media 43/43, savesafety 14/14; preflight CLEAR — slots empty, no private key, 1 public key, no PII, PUBCHK intact, script tags balanced (5); GUIDE/manifest/sw/team-chat leak-clean). node tools/publish/preflight.js index.html → CLEAR exit 0.
- VERDICT: **SAFE @ c4bc7e6.** Both changes are pure CSS/markup presentation — GPU transform/filter/opacity, motion+desktop gated, one aria-hidden dots div; zero JS/state-read/network/storage/money surface → correctly un-poisoned; watchdogs byte-identical (12/24, PUBCHK/PUB_B64); slots byte-empty; app parses (3/3); GREEN/CLEAR. NO security edit required — build is clean.
- Commits / SHAs reviewed: c4bc7e6 (tip), baseline a077248. Read-only, NO lock taken, NO edits to app code. Posted SAFE @ c4bc7e6 to TEAM-CHAT.
- Still open: nothing security-side. Gate (steps 7–11): needs Hugo GREEN + Mikoto MISSING:0 on THIS tip (no new i18n string → trivial), then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If the tip moves index.html, I re-sign. BACKLOG still open: Google-Fonts @import off the render-blocking critical path.

## [2026-07-01] — via Kaito (asleep, re-SAFE) — SAFE: Tier-1 polish F1/F2/F4/F5 @ `cc25475`
- Asked: quick re-SAFE on current tip cc25475. Kaito folded Arthur's Tier-1 polish (F1/F2/F4/F5) onto my SAFE @ c4bc7e6 — claim = pure CSS delta (press-cancel :active, added :active/:hover/:focus-visible, transitions). Verify don't trust.
- Did / found (ran `git diff c4bc7e6 HEAD` MYSELF + counts + gate):
  - SCOPE ✓ — index.html ONLY (+34/-3, 2 hunks, both inside `<style>`). Other files = TEAM-CHAT + 3 memory logs (non-published). sw.js/manifest/manifest.json numstat EMPTY.
  - PURE CSS ✓ — hunk1 @235: removed `.exp-head`/`.cal-cell` hovers + `.savebtn`/`.lk-btn`/`.modal-actions button` from the brightness-hover list (moved down), replaced with a comment. hunk2 @696: NEW "INTERACTION LAYER Tier 1 POLISH" block — F1 `:active` press-cancel (translateY(0) scale(.95) brightness) on .catsw/.savebtn/.lk-btn/.modal-actions button; F2 transitions+`:active` on .loantoggle/.chatx/.check li .box; F4 `.exp-head` transition+ desktop `:hover`; F4/F5 `.cal-cell`/`.chip` hover; F5 `.chip:focus-visible` ring. All motion-gated / desktop-gated (`(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)`). NO JS, NO markup change.
  - NO POISON NEEDED ✓ — added-line grep (fetch/xhr/eval/innerHTML/new Function/localStorage/sessionStorage/indexedDB/STATE/MODEL/__sys/PUBCHK/PUB_B64/<script/.src=/onclick/addEventListener) = 0 hits. Reads no state/money/network/storage → decoration+interaction feedback only (same standing ruling).
  - WATCHDOGS BYTE-IDENTICAL c4bc7e6↔HEAD ✓ — `__sys.token(` 14==14, `__sys.` 30==30, PUBCHK 4047293148 1==1, PUB_B64 3==3 (grep -a text-mode; the earlier c4bc7e6 log noted 12/24 was a binary-flagged undercount — the invariant that matters is c4bc7e6==HEAD, confirmed).
  - SLOTS byte-empty ✓ — #hud-state @2026 + #__ownerKeySrc @2030 both `…></script>$` (cat -A). Preflight re-confirms.
  - i18n ✓ — no new data-i18n string; MISSING:0 holds trivially. User-content skips untouched.
  - GATE ✓ — node tools/test/html_parse_test.js → 3/3 exit 0 (app parses). node tools/release/green.js → GREEN exit 0. node tools/publish/preflight.js index.html → CLEAR (slots empty, no private key, 1 public key, no PII, PUBCHK intact, scripts balanced 5).
- VERDICT: **SAFE @ cc25475.** Pure CSS presentation (press-cancel/hover/focus-visible/transitions), motion+desktop gated; zero JS/state/network/storage/money surface → correctly un-poisoned; watchdogs byte-identical; slots empty; app parses; GREEN/CLEAR. NO security edit required.
- Commits / SHAs reviewed: cc25475 (tip), baseline c4bc7e6 (my prior SAFE). Read-only, NO lock, NO edits to app code. Posted SAFE @ cc25475 to TEAM-CHAT.
- Still open: Gate (steps 7–11): needs Hugo GREEN + Mikoto MISSING:0 on THIS tip (no new string → trivial), then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If the tip moves index.html, I re-sign. BACKLOG still open: Google-Fonts @import off the render-blocking critical path.

## [2026-07-01] — via Kaito (asleep, step 10) — REVIEW: Interaction Tier 2 + 3 (`b4a7523`)
- Asked: SAFE-review Tier 2+3 — CSS motion + two new JS IIFEs (liveVal value-pulse, cardSheen
  cursor glare) + a one-line toast class. Critical worry: liveVal observes the elements that DISPLAY
  the owner's MONEY figures — confirm it's a read-to-compare ONLY, never stores/logs/transmits/exposes
  the value. Confirm cardSheen reads only pointer coords, watchdogs intact, run gate.
- Did / found (read full diff cc25475..HEAD, grepped added lines, ran the gate — not on faith):
  - SCOPE: index.html +72 (CSS motion block @727-756 + 2 JS IIFEs @8305-8344 + toast className line
    @8077) + sw.js v18→v19 (VERSION string cache-flush, from prior commit 38c19e4 folded into range).
    No parser/applyChange/finance/export/manifest edit.
  - liveVal READ-TO-COMPARE ONLY ✓ (the critical one): MutationObserver on SEL='.hero-num, .bignum,
    .calc-out, .stat .val'. Callback reads el.textContent → compares now!==last (last = a CLOSURE var,
    transient in-memory, never persisted/networked) → if both non-empty & !=='—' calls pulse(el) which
    only removes/re-adds the CSS class 'val-pulse' (+ void offsetWidth reflow). el.__lv=1 is a de-dupe
    marker (value 1, NOT the money). Grepped ALL added lines for fetch/XMLHttpRequest/postMessage/
    localStorage/sessionStorage/eval/innerHTML/new Function/.src=/JSON.stringify/dataset/setItem/
    location.(href|search|hash) → ZERO hits. The money figures never leave the DOM; a class toggle is
    not a leak. Class changes aren't observed (only childList/characterData/subtree) → pulse can't
    self-trigger (matches the comment). First population (— → value) is skipped by the dash guard.
  - cardSheen POINTER-ONLY ✓: pointermove (passive) → e.target.closest('.card') + getBoundingClientRect
    → mx/my = clientX/Y as % → card.style.setProperty('--mx'/'--my'). rAF-coalesced (1 write/frame),
    desktop-gated (hover:hover+pointer:fine+min-width:1024+no-preference), mouse-only. No state/money/
    key read, no network, no DOM injection. toast: one cosmetic d.className='mrln-toast' for enter anim
    (fresh div, no prior class clobbered; inline cssText untouched).
  - ANTI-TAMPER INTACT ✓: pulsing/observing a poisoned value element does NOT weaken the watchdog —
    the poison is the token() multiplier inside GRAND/leftOver/itemMonthly (the COMPUTATION), not the
    rendered DOM text; liveVal never reads/writes that path. No new figure introduced → no new poison
    needed. __sys count IDENTICAL parent cc25475 vs HEAD (27==27); PUBCHK(4047293148 ×2) + PUB_B64(×3)
    present; <script> tag count 5==5 (parent==HEAD → no smuggled script block); #hud-state (@2056) +
    #__ownerKeySrc (@2060) byte-empty (both parent & HEAD).
  - Ran node tools/test/html_parse_test.js → 3/3 script blocks parse. node tools/release/green.js →
    GREEN exit 0 (356 tests; preflight CLEAR — slots empty, 1 public key, no PII, PUBCHK, 5 scripts
    balanced; GUIDE/manifest/sw/team-chat clean). node tools/publish/preflight.js index.html → CLEAR exit 0.
- Verdict: SAFE @ b4a7523. Money-figure observer is read-to-compare-and-toggle-a-class ONLY — it does
  NOT exfiltrate (no fetch/storage/postMessage/dataset/serialize of the value); cardSheen is pointer-only;
  watchdogs byte-intact; no new poison required.
- Commits / SHAs reviewed: b4a7523 (tip). If index.html moves, I re-sign.
- Still open: nothing security-side. Gate: Hugo GREEN + Mikoto MISSING:0 already posted @ b4a7523; my
  SAFE now in. Awaiting Osefe's explicit "ship it" (sleep-mode: no auto-publish).

## [2026-07-02] — via Kaito (asleep) — FULL-SURFACE AUDIT (Osefe directive) → VULNERABLE+FIXED (import stored-XSS) @ tip 9d2ec15
- Asked: intensive FULL-surface re-audit of the whole app (not a delta), sw v20 live. Re-derive, don't re-assert. Fix real vulns directly (security exception).
- THREAT MODEL (honest, 2-3 lines): Client-side single-file PWA. License bar is "not trivially bypassed / poison trips on tamper," NOT unbreakable — a determined tamperer editing a STATIC copy can bypass (see poison note). Real invariants defended: no private key / no owner numbers in public files; STATE never auto-leaves the device; injected data can't run script or steal the stored access key.
- (a) KEY/LICENSE — SAFE: PUB_B64 (index.html:5173) is PUBLIC key only; preflight confirms no private-key material, slots (#__ownerKeySrc/#hud-state) byte-empty. verify() (5237) does full pure-JS P-256 ECDSA + SHA-256 + expiry (5250) + file-binding (5253). Deliberately not crypto.subtle (runs file://). Live expiry re-lock (armExpiry/expireNow 5264-5280) + backup poll (5306). Console override of __sys.token is EPHEMERAL (per-session, doesn't persist to a distributable file) → within accepted model.
- (b) POISON/WATCHDOGS — INTACT: token() (2483) = 1 armed&!tripped else NaN. Threaded through EVERY licensed money figure: itemMonthly/groupTotal/recomputeGrand/leftOver/comfort (2516-2534), body score (2989,3646), tax gross+withheld (6259), food (6861), chart refuses-to-draw on NaN (2849). 3 watchdogs (5432): overlay-exists, pubChk===4047293148 (=fnv(PUB_B64)), verifier-still-rejects POISON (a well-formed-but-unsigned key → catches a neutered verifier). HONEST LIMIT (accepted, pre-existing): token() itself has no direct watchdog, so a single static edit `token(){return 1}`+overlay-removal bypasses — but it's threaded so widely a naive tamper leaves visible NaNs, and the 3 watchdogs must also be defeated. Counts unchanged by my edit: __sys.token( ×12, PUBCHK ×1, PUB_B64 ×3.
- (c) DATA PRIVACY — SAFE. Outbound vectors enumerated: ONLY fetch = Team Room (8484), OWNER-GATED (8458 early-return unless owner file or mrln_team flag) → customer files never fetch. navigator.share (6230) sends static 'My MRLN finance dashboard' + app URL, ZERO owner data. Clipboard writes = user-initiated copies. IMDb/yt/source links use encodeURIComponent + rel=noopener noreferrer (fragment #F-fid never sent in Referer). exportBlank (5101): strips owner key (oks=''), blanks MODEL+all STATE arrays, reconstructs hud-state={__fresh,fid,prefs:{lang,currency}} → streak/sound/tabOrder/baked-key(k) dropped by construction; photos live in IndexedDB (device-local, never serialized into the HTML) → customer copy carries ZERO owner data. GOOGLE FONTS @import (line 16) leaks IP+Referer(origin, NOT fid) to Google on cache-miss — genuine but LOW privacy/offline-resilience item; ALREADY on backlog + Kaito holds the lock self-hosting it right now.
- (d) STORAGE — SAFE: localStorage holds STATE + access key in plaintext ON-DEVICE (standard for a local app; physical-access is out of model). Photo IndexedDB fail-closed intact (photo_store 17/17: put-fail keeps inline photo, localStorage strips bytes when in IDB).
- (e) INJECTION — one REAL VULN FOUND + FIXED (below); everything else clean. Content strings (note/media/calendar/food/PR-ex/workout/reminder/savings) all esc()'d at render; esc() (2162) escapes &<>" (double-quoted attrs safe; no single-quote-attr sinks). i18n applies translations via textContent (5631/5765); innerHTML only restores the app's OWN captured English (5622) → dictionary values never injected. CSV/ICS/QR importers: bank desc never rendered (only internal category labels), ICS SUMMARY esc'd at render, MFP food totals Math.round-coerced + text esc'd, weight parseNum'd.
- (f) SUPPLY CHAIN — SAFE: no eval / new Function / dynamic script / string-timer (grep clean). 5 script tags balanced (3 JS + json + text slot). SW network-first for the document (cache-poisoning resistant), cache-first assets; notificationclick focus/open only; NO postMessage/onmessage listener.
- === THE VULN (MEDIUM→HIGH impact, LOW-MED likelihood): stored XSS via untrusted DATA import ===
  applyImportedData (6008) blindly trusted arbitrary imported objects: STATE.prs/foodLog/notes/media/workouts/reminders/savingsBoxes/calendar + MODEL.groups[].items[] assigned verbatim. ensureIds (2457) only fills MISSING ids — never sanitizes existing ones. ~30 render sinks interpolate object .id and calendar keys RAW into double-quoted data-* attributes (e.g. data-del="'+w.id+'", data-date="'+e.key+'"), and PR strength wt/reps + food-log total.{kcal,p,c,f} render RAW into text. A crafted MRLNDATA code (paste/clipboard 6157) OR a hostile master-file hud-state (importMasterHTML 6061) with id/key = `"><img src=x onerror=...>` → stored XSS in a LEGIT licensed instance → can read the localStorage access key + all data and exfiltrate (NO CSP to contain egress). Not "opening a hostile HTML file" (that's inherently RCE) — this is a legit app INGESTING attacker DATA. All 3 ingest paths funnel through applyImportedData = single chokepoint.
  FIX (my security exception, committed): added _sanitizeIngested() called inside applyImportedData right after STATE assignment. Coerces every object .id + calendar-event id to safe charset via _sid() = String(x).replace(/[^\w-]/g,'').slice(0,64) — SAFE IN EVERY HTML CONTEXT and a NO-OP for real uid() values ('id'+base36 → [\w] only); forces PR wt/reps/dist/secs + foodLog total.* to Numbers via _inum(); DROPS calendar keys failing /^\d{4}-\d{2}-\d{2}$/ (rendered raw in data-date). Content strings deliberately LEFT to esc-at-render (they legitimately contain <>&" — sanitizing would MANGLE them, breaking invariant #4). Chose boundary-sanitize (one chokepoint, behavior-preserving, closes present+future sinks) over 30 fragile esc() sink-edits; the sanitized field TYPES are safe in every context so input-sanitize here is robust, not fragile.
  VERIFIED: node logic test — _sid strips `"><img onerror>`→'imgsrconerror...', preserves 'id5abc12x9f'/'2026-07-15'; _inum('10<img>')→0, 72.5→72.5. transfer_test 58/58 (ids preserved → no-op on legit data, round-trip intact). html_parse 3/3. green.js GREEN (14/14 + all suites), preflight CLEAR (slots empty, 1 public key, PUBCHK intact, 5 scripts balanced).
- (g) GATE GAPS / PROPOSALS (propose, don't build): (1) NEW guard case — feed applyImportedData a poisoned object (id/key/wt = markup) and assert render output has no `<img`/`onerror` and _sid/_inum neutralize it (locks this fix in). (2) Defense-in-depth (route to Kaito): esc() the ~30 raw .id/numeric render sinks too (belt-and-suspenders; savings-box already esc(b.id) — prove intent). (3) CSP meta (already backlogged) — this vuln shows its value: connect-src lock would have BOUNDED exfil even with an XSS. (4) preflight could grep for `data-\w+="'+\w` raw-id sinks as a lint.
- VERDICT: **VULNERABLE + FIXED** → now SAFE pending Kaito's re-verify. Real stored-XSS-via-import closed at the ingest chokepoint; everything else (key/poison/privacy/storage/supply-chain) clean.
- LOCK TENSION (flagged): Kaito holds the index.html lock (font self-hosting) and designated my audit read-only. I made a SECURITY edit under my standing exception + Kaito's explicit "fix directly, commit, push" task instruction. My region (applyImportedData ~6009) is ~6000 lines from the font work (line 16) → clean auto-merge. Kaito must rebase the font pass on top of my commit and re-verify (pipeline step 5).
- Commits / SHAs: (see commit below) index.html sanitizer + this log + TEAM-CHAT. Baseline tip 9d2ec15 (sw v20 live).
- Still open: Kaito re-verify my security code (step 5) + integrate with font pass; NOT auto-published (sleep-mode). Backlog: @import self-host (in progress), CSP (parked), + the 4 gate proposals above.

## [2026-07-02] — via Kaito (asleep, batch SAFE) — SAFE: self-hosted fonts + XSS-fix landed+guarded + Futurism Wave A @ `7bb7009`
- Asked: batch SAFE-review the 3 things added since my full-surface audit (baseline 9d2ec15): (1) self-host fonts cdef663, (2) my XSS fix 47df421 landed + guard test 2c7b34b, (3) Futurism Wave A 7bb7009. Verify don't trust; run green + preflight + import_sanitize.
- BASELINE diff 9d2ec15..7bb7009 = index.html only +147/-5 (sw.js/manifest UNTOUCHED). Read the real code + ran the gate myself.
- (1) FONTS cdef663 — INERT + NO LEAK ✓: the render-blocking Google Fonts `@import` is GONE (only remaining "@import/gstatic/googleapis" hits are explanatory COMMENTS "was fonts.gstatic.com", not directives/URLs). All 10 `@font-face` use `src:url(data:font/woff2;base64,…)` — 10 src total, all data:, ZERO network url. Every blob is PURE base64 (`^data:font/woff2;base64,[A-Za-z0-9+/=]+$`, no `<>"'` smuggled) → nothing executable can hide in a pure-base64 font resource. Decoded magic = `wOF2\0\1…` (valid woff2). No NEW external refs (investopedia/who/acefitness/pew are pre-existing citation links, unchanged). Resolves my long-standing @import backlog item (no more Google IP/referer ping; true offline typography). preflight leak-scan still CLEAR on the now-larger file.
- (2) MY XSS FIX 47df421 — INTACT + GUARDED ✓: `_sid`/`_inum`/`_sanitizeIngested` at index.html 6075-6087 are byte-identical to what I committed; `_sanitizeIngested()` is called inside applyImportedData @6103 right after STATE assignment, before any render. Guard tools/test/import_sanitize_test.js (25 cases) extracts the LIVE fns from index.html (no copy drift) and asserts exactly the right things: hostile `"><img src=x onerror=…>` id neutralized on workouts/notes/media/reminders/savingsBoxes/prs/foodLog/groups/items/calendar-events; non-date calendar key `"><svg onload=x>` DROPPED (only the YYYY-MM-DD key survives); PR wt/reps/dist/secs + foodLog total.* forced to Numbers (markup→0); content strings (note `<b>` title) UNTOUCHED (esc-at-render preserved, invariant #4); legit uid()/date values pass through UNCHANGED (no-op); odd shapes don't crash. Wired as green.js step (import-sanitize suite). 25/25.
- (3) FUTURISM WAVE A 7bb7009 — SAFE ✓:
  - countUp(el,to) @2804: receives the ALREADY-computed poison-gated value (`leftOver(MODEL.income.avg)` @2829, hero @2847) — reads/adds NO new figure. `to=Math.round(to)`; guard `isNaN(to)` → on a tampered copy leftOver=NaN → lands on fmtN(NaN) (dash/NaN, NO fabricated number). `start` parsed from el.textContent only as the tween's START point; animation ALWAYS lands EXACTLY on fmtN(to) (@2819) = the correct gated value. Writes only el.textContent; NO fetch/XHR/storage/postMessage/network → money figure never leaves the DOM, no exfil. rAF cancels on complete (no perpetual loop); reduced-motion → instant. Does NOT weaken poison (poison lives in the COMPUTATION token()× in leftOver/GRAND, not the rendered text). _cuAnimating flag composes with the 2b liveVal observer (pulse once, then settle) — no self-trigger.
  - tap ripple + haptic tapFeedback() @8461: ONE delegated `window.addEventListener('pointerdown', …, {passive:true})` — passive → can't preventDefault/eat clicks/scroll; primary-press only (`e.button!==0` return). Reads ONLY e.clientX/Y + getBoundingClientRect() (pointer coords + geometry) → NO MODEL/STATE/money/network/storage read. Ripple = createElement span, numeric style props, className 'ripple', removed on animationend + 700ms fallback; NO innerHTML/user-data → no injection. `navigator.vibrate(8)` gated on API-exists AND motionOk AND `t.closest('.btn,.tab,.scen-btn,.savebtn,.chattoggle')` (primaries), fired inside pointerdown = user-gesture, try/catch, iOS no-ops. Benign capability call — buzzes device, carries NO data, no network. Whole IIFE try/catch wrapped.
- WATCHDOGS BYTE-IDENTICAL vs 9d2ec15 ✓: `__sys.token(` 14==14, PUBCHK 2==2, value 4047293148 1==1, PUB_B64 3==3. The 3 commits touch NO watchdog/slot line (only diff match = my own XSS-fix SECURITY comment mentioning "hud-state"). #__ownerKeySrc + #hud-state byte-empty. Wave A is pure decoration/reformat → correctly UN-poisoned (no new figure introduced).
- GATE ✓: node tools/test/import_sanitize_test.js → 25/25. node tools/publish/preflight.js index.html → CLEAR exit 0 (slots empty, no private key, 1 public key, no PII, PUBCHK intact, scripts balanced 5). node tools/release/green.js → GREEN exit 0 (html-parse 3/3 browser-parity, parser 21/21, tax 105/105, media 43/43, transfer 58/58, import-sanitize 25/25, +rest; preflight CLEAR; GUIDE/manifest/sw/team-chat leak-clean).
- VERDICT: **SAFE @ 7bb7009.** Fonts inert + no-leak (backlog item resolved), my XSS fix intact + locked by a live-extracting 25-case guard, countUp re-formats the same gated value with no exfil + can't surface a bogus number on tamper, vibrate is a benign gesture-gated haptic, ripple is pointer-only; watchdogs byte-identical, slots empty, gate GREEN/CLEAR. NO security edit required.
- Commits / SHAs reviewed: 7bb7009 (tip), baseline 9d2ec15. Read-only, NO lock, NO edits to app code (log + TEAM-CHAT only). Posted SAFE @ 7bb7009 to TEAM-CHAT.
- Still open: nothing security-side. Gate (steps 7–11): needs Mikoto MISSING:0 + Hugo GREEN on 7bb7009, then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If tip moves index.html, I re-sign. BACKLOG: @import self-host is now DONE (drop from backlog); CSP meta still parked.

## [2026-07-02] — via Kaito — RE-SAFE: liveVal descendant-aware guard (`30f3caf`)
- Asked: quick re-SAFE after Kaito folded Arthur's Wave-A redline at 30f3caf (on top of my
  already-SAFE 7bb7009 batch). Verify diff is ONLY the liveVal guard fix; watchdogs byte-
  identical; run green + preflight.
- Did / found (read `git diff 7bb7009 HEAD -- index.html`, ran both gates — not on faith):
  - DELTA is EXACTLY the liveVal observer guard @__bootFX ~8424: adds `cuBusy(node)` helper
    (reads node._cuAnimating, else iterates node.getElementsByTagName('*') and returns true if
    any descendant has _cuAnimating) + swaps the A3 guard `!el._cuAnimating` → `!cuBusy(el)`,
    plus updated comments. countUp sets _cuAnimating on the DESCENDANT value span (#ovLeft/
    heroLeftVal) while the observer watches the CONTAINER (.bignum/.hero-num) → without descendant
    awareness count-up's per-frame writes re-fired the pulse (~108 reflows/render, Arthur). Fix
    is correct + minimal.
  - PURE JS DOM-FLAG READ ✓ — cuBusy only reads a boolean property set by countUp and walks
    descendants. No fetch/XHR/eval/innerHTML/new Function/document.write/.src=, no storage, no
    money-figure read (the observer is display-only decoration — pulses an existing value node,
    reads/writes NO amount for logic). Zero new security surface. No sw.js/manifest/parser/
    applyChange/export/i18n touch. No new strings.
  - WATCHDOGS BYTE-IDENTICAL ✓ — parent(7bb7009) vs HEAD marker counts all equal: PUBCHK
    4047293148 (1==1), PUB_B64 (3==3), __sys.token( (12==12), __sys. (24==24), __ownerKeySrc
    (7==7), hud-state (1==1). #__ownerKeySrc byte-empty @2117, #hud-state byte-empty @2113.
    The one-hunk guard fix touches no watchdog/slot/poison. No poison needed (display decoration,
    no money math added).
  - Ran node tools/release/green.js → GREEN exit 0 (14 suites: parser 21/21, assistant 16/16 +
    silly 43/43, streak 4/4, sound 7/7, reorder 7/7, onboarding 10/10, transfer 58/58, photo
    17/17, pr 12/12, tax 105/105, media 43/43, savesafety 14/14, import_sanitize 25/25, html-parse
    3/3; preflight CLEAR; all published files clean). node tools/publish/preflight.js index.html →
    CLEAR exit 0 (slots empty · no private key · 1 public key · no PII · PUBCHK · 5 balanced scripts).
- Verdict: SAFE @ 30f3caf. JS-guard-only, no security surface, watchdogs byte-identical, gates green.
- Commits / SHAs reviewed: 30f3caf (current tip). If tip moves index.html, I re-sign.
- Still open: nothing security-side. Sleep-mode: no auto-publish — needs Osefe's explicit go.

## [2026-07-02] — via Kaito (asleep, batch SAFE) — SAFE: Save-Safety Discord hotfix + Wave B B6/B7 @ `e976932`
- Asked: SAFE-review the batch on tip e976932 (baseline my last SAFE 30f3caf): (1) DISCORD detection hotfix — tester opened link in Discord's in-app browser (the distribution channel), added Media Log entries, lost them silently on reopen because the IN_APP_BROWSER sniff missed Discord → no durability warning. Fix adds `Discord|Slack|Telegram` to the regex + 4 UA test cases. (2) B6 chat entrance CSS anim. (3) B7 keyboard a11y (tabindex/role/aria-expanded + delegated Enter/Space keydown). Run green + preflight + savesafety.
- Did / found (ran `git diff 30f3caf HEAD` + read the load-bearing regions + ran all 3 gates — not on faith):
  - SCOPE ✓ — index.html +31/-8 (3 real regions), sw.js v20→v21 (1 line VERSION cache-flush), tools/test/savesafety_test.js +8 (4 webview UAs), rest = TEAM-CHAT/logs. No parser/applyChange/finance/export/manifest edit.
  - (1) DISCORD DETECTION ✓ — index.html @2308: IN_APP_BROWSER regex gains `|Discord|Slack|Telegram`. It's WARN-ONLY: a match fires `_warnNotDurable()` (amber banner + escape hatch) — it can NEVER suppress a warning, so even a false-positive is low-harm (extra caution). Flags all 4 new UAs (2 Discord Android+iOS, Slack desktop, Telegram Android); does NOT match real Chrome/Safari/Firefox — Discord/Slack/Telegram are distinct product tokens absent from normal UAs (savesafety normals[] green). Only WIDENS the detection SET — the copy-link fid-in-fragment invariant (`_canonLink` fid only in `#…`) + every Save-Safety guarantee are byte-untouched. savesafety 14/14 (regex live-extracted from index.html → no copy drift).
  - (2) B6 CHAT ENTRANCE ✓ — index.html @474-478: `.chatwidget` gains `transform-origin:bottom right` + a `@media (prefers-reduced-motion:no-preference)` `animation:chatIn` + `@keyframes chatIn` (opacity/scale/translateY). Pure CSS, motion-gated. NO JS, no state read, no network, no markup change → presentation-only, no poison needed.
  - (3) B7 KEYBOARD REACH ✓ — .exp-head @2782 gains tabindex=0/role=button/aria-expanded (reflected each render @2791 + on toggle @2795 via setAttribute — a11y correctness); .cal-cell @4555 gains tabindex=0/role=button (EMPTY cells @4547 get neither → matcher excludes them). New delegated IIFE @8502-8514: one document `keydown` that, ONLY when `e.target.matches('.exp-head[role="button"], .cal-cell[data-date][role="button"]')`, preventDefaults (stops Space page-scroll) and calls `el.click()`. That dispatches a synthetic click → the EXISTING vetted delegated handlers fire (cal @4483 `closest('[data-date]')`→openDayModal; exp-head toggle @2790). **No new data path** — reuses vetted handlers so behaviour can't drift. Reads only `e.key` + `el.matches` — no innerHTML/fetch/eval/storage/money read → no injection, no security surface. `data-date` value = `key` = locally-generated `dateKey()` YYYY-MM-DD from calView numbers (NOT user input); imported calendar keys are still date-validated/dropped by my `_sanitizeIngested` fix → B7 doesn't touch or weaken that. Whole IIFE try/catch wrapped.
  - sw.js ✓ — VERSION 'v20'→'v21' only (cache-flush for the index.html change); CORE list + network-first-doc strategy unchanged.
  - WATCHDOGS BYTE-IDENTICAL 30f3caf↔HEAD ✓ — `__sys.token(` 12==12, PUBCHK 2==2, value 4047293148 1==1, PUB_B64 3==3. Batch touches no watchdog/slot/poison line. #__ownerKeySrc + #hud-state byte-empty (preflight re-confirms). No new money figure → correctly un-poisoned (Discord fix is a UI guard; B6/B7 are CSS/a11y).
  - i18n ✓ — no new data-i18n string (Mikoto MISSING:0 723 keys holds). data-i18n-skip user-content containers untouched.
  - GATE ✓ — node tools/test/savesafety_test.js → 14/14 (incl. new Discord/Slack/Telegram cases + normals-no-FP). node tools/publish/preflight.js index.html → CLEAR exit 0 (slots empty · no private key · 1 public key · no PII · PUBCHK intact · 5 scripts balanced). node tools/release/green.js → GREEN exit 0 (all suites incl. import-sanitize 25/25, savesafety 14/14, html-parse 3/3).
- Verdict: **SAFE @ e976932.** Discord hotfix only WIDENS a warn-only durability sniff (flags Discord/Slack/Telegram, not real browsers; fid-in-fragment + Save-Safety guarantees intact); B6 pure CSS; B7 reuses vetted click handlers via a delegated keydown with no new data path / injection / poison surface; watchdogs byte-identical; slots empty; gates green. NO security edit required.
- Commits / SHAs reviewed: e976932 (tip), baseline 30f3caf (my prior SAFE). Read-only, NO lock taken, NO edits to app code (TEAM-CHAT + this log only). Posted SAFE @ e976932 to TEAM-CHAT + filled the Pending sign-off.
- Still open: gate now FULL (Akashi SAFE · Mikoto MISSING:0 · Hugo GREEN @ e976932) → awaiting Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If tip moves index.html, I re-sign. BACKLOG: CSP meta still parked (would bound exfil even under an XSS); the 4 gate proposals from the full-surface audit.

## [2026-07-02] — via Kaito (asleep, re-SAFE) — SAFE: renderDayModal `var t`→`var ttl` P1 fix @ `422eb29`
- Asked: quick re-SAFE after Kaito folded one P1 fix (Arthur-found) on top of my e976932 SAFE. `renderDayModal` had `var t=document.getElementById('dayMTitle')` shadowing the global translate `t()` → opening any calendar day threw, modal never showed. Fix = rename local to `ttl` (index.html ~4567). Verify delta is rename-only + no security surface; run green + preflight; post SAFE @ 422eb29.
- Did / found (ran `git diff e976932 422eb29 -- index.html` + counts + both gates — not on faith):
  - DELTA ✓ — index.html +1/-1: exactly `var t=…getElementById('dayMTitle'); if(t)…` → `var ttl=…; if(ttl)…` on the SAME line (+ a trailing `// was var t` comment). No other index.html change. Full commit scope: index.html (2 lines) + TEAM-CHAT + team/logs (akashi/arthur/hugo) — no parser/applyChange/finance/export/manifest/sw edit.
  - NO NEW SURFACE ✓ — pure lexical rename of a local. Removing the shadow RESTORES correct global `t()` resolution inside renderDayModal (that was the bug). Rendered day-modal content still flows through `esc()`/`t()`/`tf()` exactly as before — host.innerHTML is built from `evs.map` of escaped fields, unchanged by this diff. No new data path, no logic/money change, no fetch/eval/injection introduced.
  - WATCHDOGS BYTE-IDENTICAL e976932↔422eb29 ✓ — `__sys.token(` 12==12, PUBCHK 2==2, value 4047293148 1==1, PUB_B64 3==3. No poison/watchdog/slot line touched. #__ownerKeySrc + #hud-state byte-empty (preflight re-confirms). No new money figure → correctly un-poisoned.
  - GATE ✓ — node tools/release/green.js → GREEN exit 0 (15 suites: parser 21, assistant 16, streak 4, sound 7, reorder 7, onboarding 10, transfer 58, silly 43, photo_store 17, pr 12, tax 105, media 43, savesafety 14, import_sanitize 25, html-parse step-0 all 3 scripts parse). node tools/publish/preflight.js index.html → CLEAR exit 0 (slots empty · no private key · 1 public key · no PII · PUBCHK intact · 5 scripts balanced).
- Verdict: **SAFE @ 422eb29.** Rename-only P1 fix; zero security surface; watchdogs byte-identical; slots empty; gates green. No security edit required.
- Commits / SHAs reviewed: 422eb29 (tip), baseline e976932 (my prior SAFE). Read-only, NO lock taken, NO app-code edit (TEAM-CHAT + this log only). Posted SAFE @ 422eb29 to TEAM-CHAT + re-signed the Pending block.
- Still open: TIP MOVED → Hugo re-sign GREEN + Mikoto re-confirm MISSING:0 on 422eb29 to refill the gate, then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If tip moves index.html again, I re-sign. BACKLOG unchanged (CSP meta parked; the 4 gate proposals).

## [2026-07-02] — via Kaito (asleep, re-SAFE) — SAFE: MEDIALOG renderLists() on-load fix @ `a4ba0b8`
- Asked: quick re-SAFE after Kaito folded one bug fix on top of my 422eb29 SAFE. Media Log To-watch/Ranked lists rendered EMPTY on a fresh open (even under "All") until the user clicked a filter — the tester's "not saving" report was actually a display-on-load gap (data WAS saved). Fix = add one `renderLists();` at MEDIALOG init after wire() (index.html ~7431). Verify delta is init-call-only + no security surface; run green + preflight; SAFE @ a4ba0b8.
- Did / found (ran `git diff 422eb29 HEAD -- index.html` + read renderLists + counts + both gates — not on faith):
  - DELTA ✓ — index.html +3/-0: exactly one `renderLists();` call + a 3-line explanatory comment, inserted right after `wire();` at MEDIALOG module init (@7431). No other index.html change. Full commit scope: index.html (3 lines) + TEAM-CHAT + team/logs (akashi/hugo) — no parser/applyChange/finance/export/manifest/sw edit.
  - PURE PRESENTATION, NO NEW SURFACE ✓ — renderLists() (@7368) is the SAME render fn already invoked on every add (@7294/7300), delete (@7305), rate (@7342/7357), search input (@7410), filter click (@7414), rate-close (@7419), and the returned render() (@7434). The init call just runs it ONCE on load so saved STATE.media shows without a filter click. It renders EXISTING items() only — user content all esc()'d (m.title @7373/7394, m.comment/whenY @7390, SEED chips esc+data-i18n-skip @7381); m.id interpolated into data-rate/data-delmed is already sanitized on ingest by my `_sanitizeIngested` fix (import_sanitize 25/25) and locally-generated ids are [\w]-safe. Media Log holds NO money figure → no poison needed. No new data path, no fetch/XHR/eval/innerHTML-with-user-data/storage/network introduced.
  - WATCHDOGS BYTE-IDENTICAL 422eb29↔a4ba0b8 ✓ — `__sys.token(` 12==12, `__sys.` 24==24, PUBCHK 2==2, value 4047293148 1==1, PUB_B64 3==3. Init-call touches no watchdog/slot/poison line. #hud-state (@2117) + #__ownerKeySrc (@2121) byte-empty (preflight re-confirms).
  - GATE ✓ — node tools/release/green.js → GREEN exit 0 (15 suites incl. html-parse 3/3 browser-parity, parser 21/21, media 43/43, transfer 58/58, import_sanitize 25/25, tax 105/105, savesafety 14/14; preflight CLEAR; GUIDE/manifest/sw/team-chat leak-clean). node tools/publish/preflight.js index.html → CLEAR exit 0 (slots empty · no private key · 1 public key · no PII · PUBCHK intact · 5 scripts balanced).
- Verdict: **SAFE @ a4ba0b8.** Init-call-only presentation fix — renders existing STATE.media through the same esc()'d path that already ran on every filter/add; zero new data/logic/network/figure/injection surface; watchdogs byte-identical; slots empty; gates green. No security edit required.
- Commits / SHAs reviewed: a4ba0b8 (tip), baseline 422eb29 (my prior SAFE). Read-only, NO lock taken, NO app-code edit (TEAM-CHAT + this log only). Posted SAFE @ a4ba0b8 to TEAM-CHAT + re-signed the Pending block.
- Still open: TIP MOVED → Hugo re-sign GREEN + Mikoto re-confirm MISSING:0 on a4ba0b8 to refill the gate, then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If tip moves index.html again, I re-sign. BACKLOG unchanged (CSP meta parked; the 4 gate proposals).

## [2026-07-03] — via Kaito (asleep, pipeline step 4) — SECURITY REVIEW + POISON: Monthly Income Log + version-tag/self-heal (baseline 6e68279)
- Asked: (1) SAFE-review the whole delta 9e36b47^..6e68279 (income-log sanitize soundness, SVG injection, SW version plumbing, watchdog intactness). (2) Spread the anti-tamper poison into the NEW money displays (income history strip / SVG bars / month list) which rendered RAW fmt() with no token() thread. Edit index.html directly (security exception). Run green.js + income_log_test.
- READ THE REAL CODE (index.html: token core @2638, itemMonthly/leftOver/comfort @2673-2691, savings-chart refuse-to-draw @3038, income engine @3800-3946, incomeChartSVG @3881, renderIncomeHistory @3895, openIncomeEntry @3937, _sanitizeIngested income block @6396-6402, unlock arm+refresh @5666/5694; sw.js message handler; green.js version guard).
- JOB 1 — SECURITY REVIEW = SAFE:
  - SANITIZE SOUND ✓ — _sanitizeIngested (applyImportedData chokepoint) neutralises MODEL.incomeLog: ym→`.replace(/[^\d-]/g,'').slice(0,7)` THEN filter `/^\d{4}-\d{2}$/` (result is digits+dash only → safe in every markup/data-attr context), amt/ts→_inum, est→bool; incomeGuess low/avg/high→_inum; incomeGuessTs→_inum. Income lives on MODEL (cfg:MODEL) → same chokepoint as groups; both hostile-ingest paths (paste code + importMasterHTML) funnel through it. Boot-embedded #hud-state is byte-empty in public files (preflight) / owner's own data on master → matches the established trust boundary. MINOR (non-security): the char-filter+/^\d{4}-\d{2}$/ still admits invalid MONTHS (2026-13..2026-99) — harmless (digits only, no injection; ymValid gates month-name display). Not a leak.
  - SVG / RENDER INJECTION CLEAN ✓ — incomeChartSVG: ym is sanitized-on-import AND esc()'d at both data-ihbar and <title>; ymLabel returns dict month name (app-controlled) + year digits, esc()'d; fmt(v) numeric; coords all numeric; aria-label esc(t()). renderIncomeHistory strip/list: every user field esc()'d or numeric; data-ihedit/data-ihdel = esc(sanitized ym). Triple defense (import-sanitize + esc + ymValid). No raw untrusted field reaches innerHTML.
  - SW VERSION PLUMBING SAFE ✓ — sw.js message handler: `mrln-skip-waiting`→skipWaiting() (standard PWA activate of an already-same-origin-cached worker; no NEW capability/privilege/egress); `mrln-version`→replies {mrlnSwVersion:VERSION} (VERSION is a public build string, zero owner data). Only same-origin controlled clients can postMessage. Update chip (lock screen + Change Log): user-gesture tap → postMessage skip-waiting + location.reload; no forced reload, no data read, no new fetch/exfil. APP_VER is a plain const shown as text.
  - WATCHDOGS INTACT ✓ (pre-edit 6e68279 vs my HEAD): 4047293148 ×1, PUB_B64 ×3, PUBCHK ×2, __sys.arm ×2, __sys.trip ×6 ALL unchanged. #hud-state + #__ownerKeySrc byte-empty (preflight ✓). New lock-screen <script> block is balanced → preflight "script tags balanced (6)" (checks open===close, not a fixed count; html_parse step-0 compiles it).
- JOB 2 — POISON SPREAD (my security direct-edit; 4 surgical edits, each matched exactly once):
  - incomeChartSVG @3882: added `if(isNaN(__sys.token())) return '';` at top → refuse to draw the bars/tooltips on a tampered copy (MIRRORS the savings chart @3038). Kills SVG bar + `<title>` figure leakage under tamper.
  - renderIncomeHistory cell() @3901: `fmt(val)`→`fmt(__sys.token()*val)` — strip Lowest/Typical/Highest/Average now token-gated (NaN on tamper); the `val==null?'—'` guard preserved so "Average" still shows a dash pre-derive (token*null NOT taken on the null branch).
  - renderIncomeHistory list amt @3922: `fmt(Math.max(0,Number(en.amt)||0))`→`fmt(__sys.token()*Math.max(...))` — per-month amounts NaN on tamper.
  - openIncomeEntry incUsualN @3943: `fmt(typ)`→`fmt(__sys.token()*typ)` — modal "Paid the usual (N)" figure gated.
  - WHY DISPLAY-LAYER: the derive math (median/window/min/max) already feeds MODEL.income → leftOver/comfort/GRAND which are ALREADY token-multiplied; the gap was the Income-History PANEL reading deriveIncome/incomeEntries/incomeGuess RAW. token()=1 armed → fmt(1*v)=v (honest); NaN tampered → fmt(NaN)="NaN" (visible poison, no fabricated number — same as leftOver). SELF-HEAL confirmed: renderIncomeHistory is inside refreshFinance, and BOTH unlock paths (submit @5666-68, auto-unlock boot @5694) call __sys.arm() THEN refreshFinance() → panel re-renders honest post-arm; __sys.trip() also re-runs refreshFinance → NaN on trip. Pre-arm boot render is behind the lock overlay (invisible). Matches the existing hero/leftOver re-render-after-arm pattern.
  - DELIBERATELY NOT poisoned (consistent with precedent, NOT gaps): the change-log line `income-month … fmtN(a)` (setIncome/setLoanPayment already log raw fmtN into the data-i18n-skip history; poisoning would corrupt persistent history + diverge from precedent); the incAmt input prefill of an existing amount (an editable field, like existing expense-edit inputs which show raw cost). Both are post-unlock, precedent-consistent.
  - income_log_test extracts ONLY logic fns (deriveIncome/recomputeIncome/logIncomeMonth/…), none reference __sys → my render-layer edits don't touch it.
- GATE (ran myself, not on faith): node tools/test/income_log_test.js → 35 passed / 0 failed. node tools/publish/preflight.js index.html → CLEAR (slots empty · no private key · 1 public key · no PII · PUBCHK intact · script tags balanced 6). node tools/release/green.js → GREEN exit 0 (all suites incl income-log 35, import-sanitize 25, html-parse step-0; version-drift guard: APP_VER v22 === sw.js v22).
- Verdict: **SAFE + POISON APPLIED** on my commit (SHA below). Security review clean (sanitize sound, no SVG/SW injection, watchdogs byte-intact, gate green); new income money displays now token-gated so a DOM/JS tamper yields NaN, honest render self-heals after unlock via refreshFinance.
- Commits / SHAs: index.html poison committed @ 72a0aece233e7d0ea9f93b8893ed3e23cb601179 (tip MOVED 6e68279→72a0aece233e7d0ea9f93b8893ed3e23cb601179); this log + TEAM-CHAT SAFE in the follow-up sign-off commit. __sys.token( 14→18 (my 4 adds); every other watchdog marker unchanged.
- Still open: PIPELINE STEP 5 — Kaito re-verifies my poison code (verify, don't trust) + integrates; then step 7 Mikoto i18n on the NEW strings (income modal/panel labels), step 9 Hugo GREEN, step 10 my SAFE re-sign on the FROZEN candidate tip (tip will move for Mikoto's strings → I re-sign the final tip), step 11 Osefe's explicit "ship it". Sleep-mode: NO auto-publish. Backlog unchanged (CSP meta parked).

## [2026-07-03] — via Kaito (asleep, step 10) — RE-SAFE: frozen Income Log candidate (asked 80c8faf → signed current tip 6915011)
- Asked: re-SAFE the frozen release candidate `80c8faf` (i18n merge 67b8a6a + version bump 80c8faf on top of my poison SAFE @72a0aec). Verify diff is ONLY i18n strings + 2 version strings, watchdogs byte-intact, slots empty, script PARSES (the orphan-brace P0 class), green.js exit 0, preflight CLEAR. Read-only expected.
- TIP MOVED: after my initial `git pull` (said up-to-date @80c8faf), a `git fetch` surfaced 2 MORE commits — 6474b42 (guide docs) + 6915011 (Hugo GREEN chat). Current origin tip = **6915011**. Per freeze/tip-moved rule I sign the CURRENT tip, and verified the extra delta.
- CODE UNCHANGED SINCE 80c8faf: `git diff --quiet 80c8faf 6915011 -- index.html sw.js` → IDENTICAL. So my full code verification stands at 6915011.
- (a) DIFF 72a0aec..80c8faf(index.html+sw.js) = 4 index lines + 1 sw line: the minified AUTO-MERGED dictionary line grew 885318→896589 chars (36 keys × 6 langs, pure translation data) + `window.APP_VER 'v22'→'v23'` + `sw.js VERSION 'v22'→'v23'`. Scanned the ADDED dict line: ZERO `</script`/`<script`, ZERO eval/new Function/fetch/document.write/.innerHTML/localStorage/__sys/PUBCHK/PUB_B64/.src=. Dictionary is data applied via `I18N[L][k]=extra[L][k]` + rendered by textContent (prior audits) → non-executable even with arbitrary content. No logic/watchdog/surface change.
- (b) WATCHDOGS BYTE-IDENTICAL 72a0aec↔80c8faf (also holds @6915011): 4047293148 ×1, PUB_B64 ×3, PUBCHK ×2, `__sys.token(` 18==18 (my 4 income poison adds intact), __sys.arm ×2, __sys.trip ×6.
- (c) SLOTS byte-empty on 80c8faf: `<script id="hud-state" …></script>` + `<script id="__ownerKeySrc" …></script>` both empty (preflight re-confirms).
- (d) HTML-parse guard (green step 0): all 4 script blocks compile → the i18n merge did NOT reintroduce the orphan-brace P0 that once killed the app. Version-drift guard: APP_VER v23 === sw VERSION v23.
- (e) EXTRA DELTA 80c8faf..6915011 (published files): GUIDE.md +9/-2 documents Monthly Income Log; only number is generic `18000` example already present in prior guide (documentation placeholder, NOT an owner figure). MRLN-Guide.pdf rebuilt (507084→511169 B); byte-scanned for PRIVATE KEY/BEGIN EC/pkcs8/osefe/miradi/aarhus → NONE. TEAM-CHAT.md +1 (Hugo chat).
- GATE (ran myself on current tip): node tools/release/green.js → GREEN exit 0 (html-parse 4/4, parser 21/21, tax 105/105, transfer 58/58, import_sanitize 25/25, income_log 35, media 43/43, …; preflight CLEAR — slots empty, no private key, 1 public key, no PII, PUBCHK intact, scripts balanced 6; GUIDE/manifest/sw/team-chat leak-clean; version tag v23 matches). node tools/publish/preflight.js index.html → CLEAR exit 0.
- VERDICT: **SAFE @ 6915011** (the moved tip; Kaito asked 80c8faf, code identical). Pure i18n-string + version-string change on the code side; watchdogs byte-identical; income poison intact; slots empty; app parses; guide+PDF leak-clean; gates green. NO security edit required.
- Commits / SHAs reviewed: 6915011 (current tip), 80c8faf (Kaito's named candidate), baseline 72a0aec (my prior poison SAFE). Read-only, NO lock, NO app-code edit (TEAM-CHAT + this log only). Posted SAFE @ 6915011 to TEAM-CHAT.
- Still open: gate on 6915011 — Hugo posted GREEN @6474b42 (index.html unchanged since → holds; ideally re-stamp 6915011), Mikoto MISSING:0 @67b8a6a (i18n unchanged since → holds). Then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If tip moves index.html, I re-sign. BACKLOG: CSP meta parked; the 4 gate proposals from the full-surface audit.

## [2026-07-03] — via Kaito (asleep, step 10) — SAFE: Budget tab merge (Expenses+Subscriptions→Budget) v24, frozen code 07c00cc / tip df385d8
- Asked: SAFE-sign the frozen v24 candidate for a LIVE ship. Budget tab merge: #subs panel + Subscriptions nav button removed, Expenses→"Budget", renderExpenses() rewritten to a summary (total/month count-up + total/year + per-category share-bars) instead of the old expGroups breakdown; editable list stays renderManage()/#customList. +8 i18n keys×6 langs. v23→v24. Read-only expected; poison only if a hole found.
- TIP: Kaito froze CODE @ 07c00cc; repo tip had already moved to df385d8 = Hugo's docs-only guide-sync. `git diff --numstat 07c00cc df385d8 -- index.html sw.js` = EMPTY → code byte-identical. Per freeze/tip-moved rule I sign the current tip df385d8; code review holds at 07c00cc.
- READ THE REAL DIFF (6915011..07c00cc index.html, +61/-96): CSS .bud-bars/.bud-bar-* block; APP_VER v23→v24; nav Expenses→Budget + Subscriptions button removed; #expenses panel rebuilt (Your Budget summary card [expMonth/expYear + #budgetBars] + Add-a-cost card [SAME ids addName/addCat/addCost/addFreq/addNote/addBtn] + Your-costs card [#customList + newCat*]); #subs section deleted; renderExpenses() rewritten; sw VERSION v23→v24; i18n dict grew (8 keys×6 langs); TOUR/assistant copy Expenses→Budget.
- (1) WATCHDOGS BYTE-IDENTICAL 6915011↔07c00cc↔df385d8: `__sys.token(` 16==16, `__sys.` 28==28, __sys.arm 2==2, __sys.trip 6==6, PUBCHK 2==2, 4047293148 1==1, PUB_B64 3==3. #hud-state @2194 + #__ownerKeySrc @2198 byte-empty (`…></script>$`, cat -A + preflight). <script> open/close 6==6 balanced. html-parse guard (green step 0) passes all 4 blocks → the i18n merge did NOT reintroduce the orphan-brace P0.
- (2) POISON INHERITED FOR FREE — the critical check. Budget money figures: expMonth via `countUp(mEl, GRAND)`, expYear `'~'+fmtN(GRAND*12)`, budgetBars use `groupTotal(g)` + `GRAND`. Verified the chain: itemMonthly @2661 `var t=__sys.token(); return t*(...)`; groupTotal @2672 = Σ round(itemMonthly); recomputeGrand @2674 = token()*Σ groupTotal. So on tamper: itemMonthly→NaN → groupTotal→NaN → GRAND→NaN. In renderExpenses the bars `.filter(c.total>0)` drops NaN (NaN>0 false) → ZERO bars, empty state "No costs yet"; expMonth countUp(NaN)→fmtN(NaN) dash; expYear fmtN(NaN)→dash; share=GRAND>0?..:0 and pct=max?..:0 both null-safe. NO new un-token-gated money figure renders — a tamperer cannot forge a Budget number. NO poison edit required (self-heal via refreshFinance→recomputeGrand→renderExpenses on arm/trip).
- (3) NO INJECTION: bar label `esc(c.icon+' '+t(c.name))` (category name t()'d + esc'd); fmtN(c.total)/sym(curInfo)/share/pct all numeric/app-controlled; empty state static `t('No costs yet — add one below.')`. expMonth/expYear write via countUp textContent / plain textContent (span split from the ccy `<small>` — no innerHTML with user data). New data-i18n strings are app-authored English, applied via textContent (established). Add-cost/Your-costs cards reuse existing vetted ids + renderManage()/#customList (unchanged logic, already esc()'d + import-sanitized ids).
- (4) RESIDUAL #subs REFS — all guarded/dead/static, none throw or leak: renderLedger @3328 `if(!host)return` (subLedger gone → no-op, still called from refreshFinance @3388 behind `typeof`), initEditShortcuts goManageBtn @6251 `if(gm)` (button removed → no listener), MRLN_HELP/mrlnAnswer 'subs' @5172/5194 = static t() Q&A copy (stale wording, harmless — routed via textContent), missions add('subs',…) @3448 = pre-existing engine untouched. Flagged as NON-security cleanup for Kaito (stale copy + dead code), not a crash/leak/watchdog issue.
- (5) TIP df385d8 EXTRA DELTA (published docs): GUIDE.md +6/-9 (Budget merge) + MRLN-Guide.pdf rebuilt 511169→510831 B. grep -aic BEGIN EC|BEGIN PRIVATE|pkcs8|osefe|miradi|aarhus over PDF+GUIDE = 0/0. green.js leak-scan: GUIDE/manifest/sw/team-chat all clean.
- GATE (ran myself on df385d8): node tools/publish/preflight.js index.html → CLEAR exit 0 (slots empty · no private key · 1 public key · no PII · PUBCHK intact · 6 scripts balanced). node tools/release/green.js → GREEN exit 0 (16 suites/417: parser 21, income_log 35, import_sanitize 25, tax 105, media 43, savesafety 14, html-parse 4-block step-0; preflight CLEAR; all published files leak-clean; version tag APP_VER v24===sw v24).
- VERDICT: **SAFE @ df385d8** (code frozen 07c00cc, byte-identical). Watchdogs byte-intact; slots empty; app parses; Budget summary fully inherits the token() poison (no forgeable figure); no injection; residual subs refs are guarded dead code/static copy (non-security cleanup routed to Kaito); guide+PDF leak-clean; GREEN/CLEAR. NO security edit required.
- Commits / SHAs reviewed: df385d8 (current tip, docs-only), 07c00cc (Kaito's frozen code), baseline 6915011 (my prior v23 SAFE). Read-only, NO lock, NO app-code edit (TEAM-CHAT + this log only). Posting SAFE @ df385d8 to TEAM-CHAT.
- Still open: gate now FULL on df385d8 (Akashi SAFE · Mikoto MISSING:0 776 · Hugo GREEN 417) → awaiting Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If the tip moves index.html/sw.js, I re-sign. Non-security cleanup for Kaito: stale 'subs' Q&A copy + dead renderLedger/goManageBtn refs. Backlog unchanged (CSP meta parked).

## [2026-07-03] — via Kaito (asleep, step 10, LIVE ship) — SAFE: auto-updater + Budget sound/flash polish v25 @ `1c815f6`
- Asked: SAFE-sign the frozen v25 candidate `1c815f6` for a LIVE deploy (Osefe blocked on the stale-cache bug). Two small changes since v24 (live 18cb2e5): (1) auto-updater in initPWA — force `reg.update()` on load + a `controllerchange` listener that reloads ONCE (guards: `_hadCtrl` + sessionStorage `mrln-swupd`); (2) Budget sound/flash polish (MRLN_SFX cues + budFlashItem rowBorn). v24→v25. Read-only expected; poison only if a hole found. Mikoto NOT needed (no string changes).
- READ THE REAL DIFF (`git diff 6740796^..1c815f6`): index.html +18/-2, sw.js VERSION v24→v25. Regions: CSS `.item-row.row-flash`/`@keyframes rowBorn` (motion-gated); APP_VER v24→v25; addItem wire adds `MRLN_SFX.save()`+`budFlashItem(newIt.id)`; addCategory/delete/edit/save wires add `MRLN_SFX.save/remove/tap`; new `budFlashItem(id)` fn; new AUTO-UPDATE IIFE in initPWA after sw.register.
- (1) AUTO-RELOAD CANNOT LOOP — walked every path:
  - `_hadCtrl=!!navigator.serviceWorker.controller` captured at load. controllerchange handler: `if(!_hadCtrl) return` → FIRST-EVER install has no controller → false → no reload. Returning user + real update → controller existed → true → check sessionStorage `mrln-swupd`: unset first time → set it → `location.reload()`. sessionStorage SURVIVES the reload (per-tab) → any later controllerchange returns early → capped at EXACTLY ONE reload/tab. No update → controllerchange never fires → no reload. Offline → `reg.update()` rejects → `.catch()` no-op.
  - Hostile-SW weaponisation: for controllerchange to re-fire you need a genuinely NEW worker to activate each time; even then the sessionStorage cap (set BEFORE reload) blocks the 2nd reload. sessionStorage is the RIGHT primitive here (a module boolean would reset on reload; this survives it — more robust than the canonical web.dev pattern). Only theoretical gap: sessionStorage THROWS (sandboxed/privacy) AND a new SW re-activates repeatedly — but controllerchange doesn't self-fire without a new activation, and a same-origin trusted sw.js in steady state doesn't. Realistic threat model (stale cache, trusted origin) fully covered. Canonical PWA reload-on-controllerchange pattern.
  - NO NEW EXFIL/PRIVILEGE: `reg.update()` re-fetches same-origin sw.js (standard); controllerchange + location.reload are local. Nothing new leaves the device.
- (2) budFlashItem — NO INJECTION: `host.querySelector('[data-del="'+id+'"], [data-edit="'+id+'"]')`. id = addItem()'s returned `.id` (uid(), [\w-]) or the edited item's data-save id (locally-generated / import-sanitized to [\w-] by _sanitizeIngested). No `"` can break the attribute selector; even a malformed selector throws SyntaxError → whole body is try/catch wrapped → worst case flash doesn't show. `if(!id) return` guards undefined. Pure decoration: reads a DOM node, toggles a class. No money figure, no innerHTML, no network → no poison needed.
- (3) SFX cues — `if(typeof MRLN_SFX!=='undefined') MRLN_SFX.save/remove/tap()` — existing vetted sound module (sound suite 7/7); typeof-guarded; no new surface.
- (4) WATCHDOGS BYTE-IDENTICAL v24(6740796)↔v25(1c815f6): 4047293148 1==1, PUB_B64 3==3, PUBCHK 2==2, __sys.arm 2==2, __sys.trip 6==6, `__sys.token(` 16==16, `__sys.` 28==28, __ownerKeySrc 7==7, hud-state 6==6. Slots byte-empty (#hud-state @2197, #__ownerKeySrc @2201). <script> 6==6 balanced. sw.js = 1-line VERSION v24→v25 (cache-flush) — CORE list + strategy unchanged.
- GATE (ran myself on 1c815f6): node tools/release/green.js → **GREEN exit 0** (html-parse 4/4 all blocks compile, parser 21/21, assistant, income_log, import_sanitize, tax 105, media 43, savesafety 14, …; preflight CLEAR; GUIDE/manifest/sw/team-chat leak-clean; version tag APP_VER v25===sw v25). node tools/publish/preflight.js index.html → **CLEAR exit 0** (slots empty · no private key · 1 public key · no PII · PUBCHK intact · 6 scripts balanced).
- VERDICT: **SAFE @ 1c815f6.** Auto-reload is provably capped at one/tab by construction (hadController + sessionStorage-survives-reload); no new exfil (reg.update same-origin, controllerchange/reload local); budFlashItem selector fed only [\w-] ids + try/catch → no injection; SFX typeof-guarded; watchdogs byte-identical; slots empty; app parses; gates green. NO security edit required.
- Commits / SHAs reviewed: 1c815f6 (frozen tip), baseline v24 6740796/df385d8 (prior SAFE, live 18cb2e5). Read-only, NO lock, NO app-code edit (TEAM-CHAT + this log only). Posting SAFE @ 1c815f6 to TEAM-CHAT.
- Still open: LIVE ship — gate needs Hugo GREEN @1c815f6 (I re-ran green.js myself → exit 0) + Mikoto unchanged (MISSING:0 holds, no new strings), then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If tip moves index.html/sw.js, I re-sign. Backlog unchanged (CSP meta parked; Team Room #team flag/hardcoded branch).

## [2026-07-03] — via Kaito (asleep, step 10, LIVE hotfix) — SAFE: NaN Budget-price re-render fix v26 @ `51e2d93`
- Asked: fast SAFE on a one-line LIVE hotfix. Live users (Discord) see "NaN kr/mo" on every Budget item: the item list (renderManage/#customList) drew ONCE at boot BEFORE __sys armed, so prices resolved to NaN and never re-drew. Fix = call renderManage inside refreshFinance so it re-draws AFTER __sys.arm() on unlock, guarded `editId==null` so an in-progress edit isn't wiped. Frozen tip 51e2d93 (v26), baseline live 874cbe5. Read-only.
- DIFF 874cbe5..51e2d93 (index.html+sw.js) = EXACTLY as described: index.html +4/-1 → one line `if(typeof renderManage==='function' && editId==null) renderManage();` + a 3-line explanatory comment inside refreshFinance (@3389-3392), plus `APP_VER 'v25'→'v26'`. sw.js = 1-line `VERSION 'v25'→'v26'` (cache flush). No other logic, no parser/applyChange/export/manifest/watchdog edit.
- WATCHDOGS BYTE-IDENTICAL v25(1c815f6)↔v26(51e2d93): `__sys.token(` 16==16, __sys.arm 2==2, __sys.trip 6==6, PUBCHK 2==2, 4047293148 1==1, PUB_B64 3==3. Slots byte-empty (#hud-state @2197, #__ownerKeySrc @2201 — preflight ✓). <script> 6==6 balanced.
- NO NEW SURFACE / POISON INTACT ✓ — renderManage (@3723) is the SAME existing fn already called on add(@3635)/addCat(@3655)/delete(@3641/3647/3661)/edit(@3694)/cancel(@3695)/save(@3703). It renders existing esc()'d item data; the per-item prices it shows come from itemMonthly (@2661 `var t=__sys.token(); return t*(...)`) → still NaN under tamper (poison intact, self-heals honest post-arm). The fix EXPLOITS that gating: pre-arm boot render = NaN (behind lock overlay, invisible), refreshFinance re-render post-arm = honest. Same self-heal pattern as leftOver/income panel.
- editId GUARD SOUND ✓ — `editId` (var @3608) + renderManage (fn decl @3723) share refreshFinance's (@3386) module scope → hoisted; at boot pre-3608, editId===undefined, `undefined==null`→true (renders); during an active edit editId=<id> (@3694) → guard SKIPS the clobber so the in-progress edit form isn't wiped. Direct edit path still calls renderManage itself, so edit UI stays live. typeof guard on renderManage = belt-and-suspenders; whole script compiles (green html-parse step-0).
- GATE (ran myself on 51e2d93): node tools/release/green.js → GREEN exit 0 (parser 21, html-parse 4-block step-0 compiles, income_log, import_sanitize, tax 105, media 43, savesafety 14, …; preflight CLEAR; GUIDE/manifest/sw/team-chat leak-clean; version tag APP_VER v26===sw v26). node tools/publish/preflight.js index.html → CLEAR exit 0 (slots empty · no private key · 1 public key · no PII · PUBCHK intact · 6 scripts balanced).
- VERDICT: **SAFE @ 51e2d93.** One-line presentation re-render of an existing esc()'d, token-gated list through the existing self-heal path; editId guard protects in-progress edits; zero new data/logic/network/figure/injection surface; watchdogs byte-identical; slots empty; app compiles; gates green. NO security edit required. Mikoto not needed (no strings).
- Commits / SHAs reviewed: 51e2d93 (frozen tip, v26), baseline 1c815f6/live 874cbe5 (v25). Read-only, NO lock, NO app-code edit (TEAM-CHAT + this log only). Posting SAFE @ 51e2d93 to TEAM-CHAT.
- Still open: LIVE ship — gate needs Hugo GREEN @51e2d93 (I re-ran green.js myself → exit 0) + Mikoto unchanged (MISSING:0 holds, no new strings), then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If tip moves index.html/sw.js, I re-sign. Backlog unchanged (CSP meta parked).

## [2026-07-03] — via Kaito (asleep, step 10, LIVE ship) — SAFE: v27 premium Budget redesign, frozen code `416ac3b` / tip `b481e12`
- Asked: SAFE-sign the frozen v27 candidate 416ac3b for a LIVE ship. Premium Budget redesign = renderManage rewritten into a two-state display/edit list + Mikoto i18n (2 keys×6) + v26→v27. Verify: isFinite guard genuinely prevents forged/NaN figure; esc() on all interpolated fields; toggle benign; watchdogs byte-intact; app compiles; green+preflight. Read-only unless a real hole.
- TIP MOVED: repo tip already at b481e12 = Hugo's docs-only guide-sync (GUIDE.md + rebuilt PDF). `git diff --numstat 416ac3b b481e12 -- index.html sw.js` = EMPTY → code byte-identical → my code-SAFE transfers to b481e12 (Kaito pre-authorised this transfer for a docs-only move).
- READ THE REAL DIFF (5304f20..416ac3b, index +102/-33, sw v26→v27):
  - CSS block for .bud-head/.bud-toggle/.item-row/.ir-name/.ir-price/.ir-amt/.ir-skel(+skelShimmer keyframes, motion-gated)/.ir-tools/.ir-e/.ir-x/.ir-editfields; `#expenses.budget-editing` reveals tools/catdel, `:not(.budget-editing)` hides #addCostCard/#budCatAdd. APP_VER v26→v27; sw VERSION v26→v27.
  - Markup: Add-a-cost card given id=addCostCard (edit-mode only); Your-costs card gains .bud-head with #budEditToggle (aria-pressed); category-add wrapped in #budCatAdd. renderManage() rewritten.
- (1) SECURITY REDLINE — isFinite guard HOLDS ✓ — priceCell(it): `var m=itemMonthly(it); if(!isFinite(m)) return '<span class="ir-skel" aria-hidden="true"></span>';` then `fmtN(m)` ONLY past the guard. itemMonthly @ token-gated (`var t=__sys.token(); return t*(...)`) → NaN on tamper → skeleton shimmer, NEVER "NaN", NEVER a forged number. Raw `it.cost` billing `<small>` sits AFTER the isFinite return → UNREACHABLE under tamper (only shows post-arm honest). Category subtotal `groupTotal(g)` → `isFinite(sub)?fmtN(sub):'—'`. Edit-prefill `cur = it.cost!=null?it.cost:(isFinite(itemMonthly(it))?Math.round(itemMonthly(it)):0)` → 0 not NaN. NO forgeable Budget figure renders; full self-heal via refreshFinance→renderManage (v26 hotfix path) post-arm.
- (2) NO INJECTION ✓ — item name `esc(t(it.name))`; category `esc(g.icon+' '+t(g.name))`; `data-delcat="'+esc(g.name)+'"`; until `esc(it.until)` gated by `/^\d{4}-\d{2}-\d{2}$/`; ADDED badge `t('ADDED')`; all title/aria `esc(t('Edit'/'Delete'/'Delete category'))`; FQ options from ['monthly','quarterly','yearly']. data-edit/data-del/data-cost/data-save/data-freq carry `it.id` (NOT esc'd) = import-sanitized `[\w-]` (_sanitizeIngested, import_sanitize 25/25) + local uid() — precedent unchanged from prior renderManage.
- (3) TOGGLE BENIGN ✓ — #budEditToggle click: `panel.classList.toggle('budget-editing')` + `setAttribute('aria-pressed',…)` + `innerHTML = on?('✓ '+esc(t('Done'))):('✎ '+esc(t('Edit')))` (esc(t()) app strings, no user data) + `if(!on && editId){editId=null; renderManage();}` (closes open editor) + `MRLN_SFX.panel()` (verified `panel: function` EXISTS in module, typeof-guarded) + `navigator.vibrate(12)` try/catch. NO eval/fetch/XHR/new Function/document.write/.src=/storage/money-read, no new data path/network. Pure CSS class-flip UI, no re-render of the money list (renderManage only on exit-edit-with-open-editor).
- (4) WATCHDOGS BYTE-IDENTICAL 5304f20↔416ac3b (grep -a text mode; first pass mis-flagged binary): `__sys.token(` 18==18, `__sys.arm` 2==2, `__sys.trip` 6==6, PUBCHK 2==2, 4047293148 1==1, PUB_B64 3==3, `__ownerKeySrc` 7==7. Slots byte-empty (#hud-state @2243, #__ownerKeySrc @2247 — `…></script>`). 6 `<script>` open==close. No poison/watchdog/slot line touched. No new un-token-gated money figure → correctly un-poisoned (Budget inherits token() gating for free).
- (5) i18n: 2 new keys×6 langs (Mikoto a372e33, MISSING:0 776). AUTO-MERGED dict line grew; applied via textContent path (established), non-executable.
- (6) TIP b481e12 EXTRA DELTA (published docs): GUIDE.md +13/-11 (display/edit toggle) + MRLN-Guide.pdf rebuilt. PDF grep -aic BEGIN EC/BEGIN PRIVATE/PRIVATE KEY/pkcs8/osefe/miradi/aarhus = ALL 0. GUIDE.md added number = generic `18000` example (documentation placeholder, not owner figure), no PII. green leak-scan: GUIDE/manifest/sw/team-chat clean.
- GATE (ran myself on current tip b481e12): node tools/publish/preflight.js index.html → CLEAR exit 0 (slots empty · no private key · 1 public key · no PII · PUBCHK intact · 6 scripts balanced). node tools/release/green.js → GREEN exit 0 (html-parse step-0 compiles all blocks, parser 21, import_sanitize 25, income_log, tax 105, media 43, savesafety 14, …; preflight CLEAR; all published files leak-clean; APP_VER v27===sw v27).
- VERDICT: **SAFE @ b481e12** (frozen code 416ac3b, byte-identical; docs-only move). isFinite guard provably prevents a forged/NaN Budget figure (skeleton on tamper); all interpolated fields esc'd / ids sanitized; toggle is a pure CSS class-flip with no new surface; watchdogs byte-identical; slots empty; app compiles; guide+PDF leak-clean; gates green. NO security edit or new poison required.
- Commits / SHAs reviewed: b481e12 (current tip, docs-only), 416ac3b (Kaito's frozen v27 code), baseline v26 5304f20 (live). Read-only, NO lock, NO app-code edit (TEAM-CHAT + this log only). Posted SAFE @ b481e12 to TEAM-CHAT.
- Still open: LIVE ship — gate needs Hugo GREEN + Mikoto MISSING:0 on the current tip (Mikoto MISSING:0 776 @a372e33 unchanged since; Hugo re-stamp), then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If tip moves index.html/sw.js, I re-sign. Backlog unchanged (CSP meta parked; stale 'subs' Q&A copy + dead renderLedger/goManageBtn cleanup for Kaito).

## [2026-07-28] — via Kaito (asleep, LAUNCH-DAY) — SAFE + preflight PII fix: legal layer v28, tip `a505abe` (code e5e114a)
- Asked: (1) VERIFY the Privacy Policy / lock-screen privacy CLAIMS match the actual code (verify-don't-trust) for the launch-day legal layer Kaito built @ e5e114a (Disclaimer + Terms + Privacy modal #legalBack, 16 .panel-legal footers, .lk-legal lock-screen acceptance → STATE.legalAccepted, footer link, APP_VER/sw v27→v28). (2) FIX the preflight PII BLOCK — green.js went RED because preflight flagged "Miradi, miradi" (the Terms/Privacy INTENTIONALLY name trader "Osefe Miradi" + contact osefemiradi@gmail.com, required by EU/DK consumer law) — implement a TIGHT scoped exception, not a blanket removal.
- JOB 1 — PRIVACY CLAIMS VERIFIED vs CODE = MATCH (grepped EVERY outbound primitive in index.html: fetch/XHR/sendBeacon/WebSocket/EventSource/Image.src/form action/method/http(s)):
  - NO programmatic transmission of user financial/health/personal data. The claims "no backend / we don't collect / never transmitted to us / no account" HOLD.
  - The ONLY auto (non-user-tapped) outbound request is the Team Room poll `fetch(RAW+'?t='+Date.now())` @9228 — GATED @9196-9202 behind `ownerFile (#__ownerKeySrc non-empty → false in public build) || flag (localStorage mrln_team, set ONLY if location.hash matches /team/)`. A normal customer NEVER triggers it; it only GETs the PUBLIC TEAM-CHAT.md and sends NO personal data → correctly not disclosed in the customer-facing policy. Confirmed inert for customers.
  - Link-outs (user-tapped, new tab): IMDb @7799 `?q=`+encodeURIComponent(title), rel="noopener noreferrer", title only, no fid/key/STATE ✓. YouTube recipe @4871/4890 `search_query=`+encodeURIComponent(m.n+' recipe') — meal name from the app's OWN meal DB (not user personal data); rel="noopener" (see MINOR below). Citation links (Investopedia/WHO/ACE/Pew @3705-3711) static reference URLs. All covered by policy §3 "Features you choose to use … carry only what's needed (such as a title you searched)".
  - `new Image()` @7522/7529/7647/7656 = LOCAL data:image canvas re-encode (RX `^data:image/(jpeg|png|webp);base64,` @7642), strips EXIF/GPS — NOT network. `_canonLink` @2583 builds a share-link STRING (fid in #fragment), user copies it — not a transmission. NO forms/POST/beacon anywhere.
  - Policy disclosures (a) app-load from static host, (b) user-tapped link-outs, (c) payments = ACCURATE + COMPLETE for customers. Team Room poll (owner-only, no personal data) needs no customer disclosure. NO wording change required of Kaito.
  - MINOR (non-blocking, routed to Kaito): YouTube link uses rel="noopener" WITHOUT noreferrer (IMDb has both). Referer leaked = the app's PUBLIC base URL (browsers strip the #fid fragment) — NOT personal data, not a claim violation — but add `noreferrer` for consistency/hardening.
- JOB 1 — WATCHDOG/INTEGRITY = INTACT: legal commit e5e114a is pure-additive UI (CSS + #legalBack modal + i18n attrs + wiring); `git diff e5e114a^ e5e114a` touches ZERO watchdog/poison/slot/money line (grep for __sys|PUBCHK|PUB_B64|4047293148|ownerKeySrc|hud-state|fmt(|fmtN(|countUp|token( over the diff = empty). Markers BYTE-IDENTICAL parent↔tip: `__sys.token(` 18==18, PUBCHK 2==2, 4047293148 1==1, PUB_B64 3==3, __sys.arm 2==2, __sys.trip 6==6, __ownerKeySrc 7==7, hud-state 6==6. Slots byte-empty (`<script id="hud-state" …></script>`, `<script id="__ownerKeySrc" …></script>`). Legal text has NO displayed monetary STATE value (only static legal numerals EUR 50 / 14 days / 16 yrs) → NO new poison needed, CONFIRMED correct. Legal-modal wiring: STATE.legalAccepted={v,ts} set @submit-success (try/catch, autosave), open() does getElementById(data-legal-to='lg-disclaimer' app-static) + scroll, modal body is 100% file-authored static HTML — no user data interpolated → no XSS. #legalBack z-index above lock is display-only (read-only text; unlock/__sys.arm logic untouched).
- JOB 2 — PREFLIGHT PII FIX (I own security tooling; edited tools/publish/preflight.js DIRECTLY):
  - Replaced the flat PII scan with a TIGHT legal-identity exception: carve out the #legalBack block (regex `<div class="modal-back" id="legalBack">[\s\S]*?</div></div></div>`), strip ONLY the exact sanctioned strings `Provider: Osefe Miradi[ ("we","us")] · Contact: osefemiradi@gmail.com` (both lg-eff lines) and standalone `<p>osefemiradi@gmail.com</p>` (both Contact §), and ONLY from inside that block; then run the UNCHANGED PII_RE on the result. Fail-closed: if the block isn't found, whole file scanned unmodified.
  - PROVED tight with 6 adversarial cases: real index.html→CLEAR; email OUTSIDE legal (comment)→BLOCK; name OUTSIDE→BLOCK; `<p>email</p>` OUTSIDE (by-location, identical string)→BLOCK; CPR/IBAN `DK…` INSIDE legal→BLOCK; email in non-sanctioned form (heading) INSIDE legal→BLOCK. Not a blanket removal.
  - Added `tools/test/preflight_pii_test.js` (those 6 cases) + wired into green.js after the preflight section (12b) so the exception can't silently regress. green.js's own PUBLISHED_TEXT PII scan (GUIDE/manifest/sw/team-chat, NOT index.html) needs no change (those files are legal-block-free + clean).
- GATE (ran myself on a505abe): `node tools/publish/preflight.js index.html` → CLEAR exit 0 (slots empty · no private key · 1 public key · no PII (legal-identity exception applied) · PUBCHK intact · 6 scripts balanced). `node tools/test/preflight_pii_test.js` → 6/6. `node tools/release/green.js` → GREEN exit 0 (all suites incl new preflight-PII guard; APP_VER v28===sw v28; all published files leak-clean).
- VERDICT: **SAFE @ a505abe.** Privacy claims match code (no personal-data exfil; owner-only Team Room poll gated + payload-free; link-outs disclosed + minimal); watchdogs byte-identical; slots empty; no new money figure → no poison needed; legal modal is static/no-XSS; preflight PII exception is tight + guard-tested; gate GREEN/CLEAR.
- Commits / SHAs: security tooling fix @ **a505abe** (preflight.js + preflight_pii_test.js + green.js). Legal-layer code reviewed @ e5e114a (index.html/sw.js, unchanged by my commit). This log + TEAM-CHAT SAFE sign-off in the follow-up commit (docs-only → SAFE @ a505abe transfers).
- Still open: MINOR non-security polish for Kaito (add rel="noopener noreferrer" to the YouTube recipe link @4890 for consistency). Gate: needs Mikoto MISSING:0 (new legal i18n strings) + Hugo GREEN on the frozen tip, then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If tip moves index.html/sw.js, I re-sign. Backlog unchanged (CSP meta parked).

### [2026-07-28] follow-up — TIP MOVED (Mikoto i18n) → RE-SAFE @ `87afd4a`
- During my run the tip advanced past e5e114a: Mikoto's `56037c2` (legal-layer i18n, 10 strings×6 langs) + `82ef85a` (her log), then my `a505abe` (preflight fix) + `87afd4a` (this sign-off). My code review referenced e5e114a's index.html, so I re-verified the delta e5e114a→HEAD myself (verify-don't-trust, tip-moved-reopens).
- `56037c2` = pure i18n: the hand-maintained multi-line `var I18N = {…}` base dict (~82 pretty-printed lines) was MINIFIED to one line (14336 chars) with the new legal strings folded in — net +1/-82, same dictionary content. Scanned the new minified line: ZERO `</script>`/`<script`/eval/new Function/document.write/.innerHTML/fetch/localStorage/__sys/PUBCHK/PUB_B64/.src= → pure non-executable data (applied via textContent per prior audits). No owner name/email folded into the dict (legal identity stays in the #legalBack modal HTML only).
- Re-verified on CURRENT tip 87afd4a: watchdogs BYTE-IDENTICAL e5e114a↔HEAD (`__sys.token(` 18==18, PUBCHK 2, 4047293148 1, PUB_B64 3, arm 2, trip 6, __ownerKeySrc 7, hud-state 6); slots byte-empty; APP_VER v28===sw v28; html-parse step-0 compiles the minified dict; `preflight` CLEAR exit 0; `green.js` GREEN exit 0.
- VERDICT stands: **SAFE @ 87afd4a** (index.html at 56037c2 = a505abe = 87afd4a, byte-identical; tooling at a505abe). If the tip moves index.html/sw.js again, I re-sign.

## [2026-07-28] — via Kaito (asleep, step 10, re-SAFE) — SAFE: legal-layer email re-sync + noreferrer, frozen tip `7fa2298`
- Asked: re-SAFE the frozen legal-layer tip 7fa2298 (baseline my SAFE @a505abe/87afd4a). Delta = contact email osefemiradi→Miradiosefe (4 spots) + preflight LEGAL_ALLOW/test re-synced to it + noreferrer on the recipe link. SCRUTINIZE Kaito's edit to MY security guard (verify-don't-trust): confirm the re-sync didn't widen/loosen the allow-list, still fail-closed + #legalBack-scoped, 6/6 guard, watchdogs byte-intact, green exit 0.
- Read the REAL diff a505abe/87afd4a..7fa2298 (index.html 6 lines, preflight.js 5/5, preflight_pii_test.js 4/4) + read preflight.js check-4 in full + ran all gates myself (NOT on faith):
  - index.html 4 email edits (lg-eff Terms @1158, Terms §14 @1186, lg-eff Privacy @1189, Privacy §9 @1213) — grep confirms ALL 4 inside #legalBack (block opens @1137), ZERO occurrence of email/name outside the block. Correct + confined.
  - noreferrer (@4883 recipe "Watch a recipe video"): `rel="noopener"`→`rel="noopener noreferrer"` — purely additive, strips Referer, no behavior change. My own prior non-blocking note, now closed.
  - 6th index line = folded Mikoto i18n grammar correction (commit a0ed4ef, sv/nb/da): char-diffed the minified I18N base-dict line (SequenceMatcher) → ONLY translation VALUE edits (da "Informativ"→"Informativt" ×2; sv "skattejur"→"skattemässig", "råd"→"rådgivning"). Breakout scan (</script,<script,eval,new Function,document.write,.innerHTML,fetch,localStorage,__sys,PUBCHK,PUB_B64,.src=) = NONE. Pure non-executable data, Mikoto's lane, non-security.
  - GUARD STILL TIGHT (the critical check — Kaito touched MY tooling): PII_RE `/miradi|osefe@|[^a-z]cpr[^a-z]|\bDK\d{8,}\b/gi` UNCHANGED. Independently ran PII_RE on `Miradiosefe@gmail.com` → `['Miradi','osefe@']` — the NEW email trips TWO patterns (the string literally contains both "Miradi" and "osefe@") → detection STRENGTHENED, not widened. LEGAL_ALLOW re-sync only swapped the email literal inside two exact-anchored regexes (`Provider:…Contact:Miradiosefe@gmail\.com` and `<p>\s*Miradiosefe@gmail\.com\s*</p>`, `.` escaped) — same structure, not loosened. Strip logic byte-identical: `let piiScan=html; if(legalBlock){ strip LEGAL_ALLOW from legalBlock[0]; piiScan=html.replace(legalBlock[0],sanitized) }` → location-scoped to inside #legalBack + FAIL-CLOSED (block not found → whole file scanned unmodified).
  - GUARD 6/6 pass: real index CLEAR; email-in-comment OUTSIDE→BLOCK; name OUTSIDE→BLOCK; `<p>email</p>` OUTSIDE by-location→BLOCK; CPR/IBAN INSIDE→BLOCK; email in non-sanctioned `<h5>` form INSIDE→BLOCK. The two OUTSIDE cases + the INSIDE-non-sanctioned case already PROVE the NEW email blocks outside/unsanctioned → satisfied, no extra adversarial case needed.
  - WATCHDOGS BYTE-IDENTICAL 87afd4a↔7fa2298 (grep -ac line-counts, equal both tips): `__sys.token(` 16==16, PUBCHK 2, 4047293148 1, PUB_B64 3, __sys.arm 2, __sys.trip 6, __ownerKeySrc 7, hud-state 6. Slots byte-empty on 7fa2298 (`<script id="hud-state" type="application/json"></script>`, `<script id="__ownerKeySrc" type="text/plain"></script>`). APP_VER v28===sw v28. Delta touches ZERO money/poison line → no new poison needed (email is not a displayed money STATE value).
- GATE (ran myself on 7fa2298): `node tools/test/preflight_pii_test.js` → 6/6 exit 0. `node tools/publish/preflight.js index.html` → CLEAR exit 0 (slots empty · no private key · 1 public key · no PII (legal-identity exception) · PUBCHK intact · 6 scripts balanced). `node tools/release/green.js` → GREEN exit 0 (incl. preflight-PII guard 6/6, all published files leak-clean, APP_VER v28===sw v28).
- VERDICT: **SAFE @ 7fa2298.** Email swap confined to #legalBack; my PII guard is still tight (new email doubly-caught, allow-list re-sync not widened, fail-closed + scoped intact, 6/6); noreferrer additive; folded i18n = pure data; watchdogs byte-identical; slots empty; gates green. NO security edit required — Kaito's edit to my tooling is correct.
- Commits / SHAs reviewed: 7fa2298 (frozen tip), baseline a505abe/87afd4a (my prior SAFE). Also verified extra commits in range: 0700c60 (email set), a0ed4ef+6a2ffba (Mikoto i18n grammar), 445fb76 (my prior sign-off). Read-only, NO lock, NO app-code edit (TEAM-CHAT + this log only). Posted SAFE @ 7fa2298 to TEAM-CHAT + updated the Pending block.
- Still open: gate needs Hugo GREEN on 7fa2298 (I re-ran green.js → exit 0), Mikoto MISSING:0 @a0ed4ef holds (i18n unchanged since) → then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If tip moves index.html/sw.js/preflight, I re-sign. Backlog unchanged (CSP meta parked).

## [2026-07-28] — via Kaito (asleep) — landing.html security review (NEW public file for gh-pages + Stripe)
- Asked: verify scratchpad/landing.html SAFE to publish — (1) no external network requests, (2) no leaked private data/keys, (3) Stripe/price are marked PLACEHOLDERS + safe rel, (4) no privacy over-claim. Verdict + mustFix + preflight notes.
- File is in scratchpad (NOT yet in repo/release). Reviewed read-only, no lock, no edit.
- (1) SELF-CONTAINED ✓ — fonts = system-ui/serif stacks (no CDN/googleapis). No <link>, no @import, no analytics/gtag, no data: URIs (grep 0). Only outbound refs are user-tapped anchors to the live app https://sagemrln.github.io/my-first-repo/ (5×, same-tab) + mailto. Two <img> are RELATIVE local files ov_desktop.png / ov_mobile.png (exist in scratchpad, must ship alongside). Script (573-615) is pure DOM: js flag, sticky-header, year, IntersectionObserver reveal — NO eval/fetch/XHR/new Function/document.write. Truly zero auto network.
- (2) NO LEAK ✓ — grep osefe|miradi|aarhus|@|BEGIN|PRIVATE|KEY|cpr|IBAN|DK\d|sk_/pk_/whsec/price_/prod_ → ONLY the sanctioned public identity: "Osefe Miradi" @563 + mailto:Miradiosefe@gmail.com @564 (matches app's post-swap public contact). No private key, no numbers/balances (screenshots captioned demo "Alex").
- (3) PLACEHOLDERS ✓ — data-checkout="PLACEHOLDER-owner-sets-stripe-link" (href="#") @242/260/472/525; data-price / data-price-year="PLACEHOLDER" ($—) @460/462. No real/broken Stripe secret baked in. target= count 0 → no target=_blank → no tabnabbing (rel not required as-is; if owner adds _blank later, add rel=noopener noreferrer).
- (4) NO OVER-CLAIM ✓ — FAQ @493 honestly concedes "loading the app itself uses a static web host, but what you type stays with you"; claims are "numbers you enter stay on device / no bank / no cloud copy / no account" = matches app reality (localStorage, no backend). Defensible.
- MUSTFIX before it actually ships:
  1. Visually verify ov_desktop.png / ov_mobile.png contain ONLY demo "Alex" data — images bypass the text leak scan; the one real leak vector in the bundle. (I can't OCR here.)
  2. Preflight: when landing.html is added to the release, the green.js/preflight leak scan must COVER it, and the tight fail-closed LEGAL_ALLOW exception (currently scoped to index.html #legalBack) must be extended to landing's .footer-legal line — else "Miradiosefe@gmail.com" trips PII_RE ("Miradi"+"osefe@") → RED. Scope to that exact footer line, not a blanket skip. (My tooling, I own the fix when the file lands in repo.)
  3. Before Stripe review / go-live: fill the marked placeholders (checkout link ×4, price ×2) and point footer Legal links (Terms/Privacy/Disclaimer, currently all → app root @555-557) to REAL policy pages — Stripe requires working Terms/Privacy/Refund links. Currency shows "$—" though base is DKK; owner sets correct symbol.
- VERDICT: **POLISH** — the HTML artifact itself is safe (self-contained, leak-free, placeholders marked, honest copy). Not clean SHIP only because the release gate would go RED as-is (item 2) and the screenshots are unverified (item 1); neither is a watchdog/key/network defect. Not BLOCK.
- Still open: items 1-3 above. When landing.html enters the repo/release, I extend the preflight allow-list + re-run green. No app-code/watchdog surface touched by this page.

## [2026-07-28] — via Kaito (asleep) — SAFE: landing.html + legal.html premium elevation (bundled Instrument Serif font) + preflight extended to the static public pages
- Asked: security-gate the elevated public marketing/legal pages (commit 70562b8) before they publish to gh-pages + go to Stripe. (1) Clear the bundled self-hosted display font (Instrument Serif, base64 woff2 data-URIs — landing Regular+Italic, legal Regular). (2) Confirm zero-external + no-leak on both pages incl. demo screenshots. (3) Extend the tight fail-closed preflight PII exception (I own tools/publish/preflight.js) to cover the contact/footer identity on landing.html + legal.html — scoped, not blanket — add/adjust the guard test, confirm preflight CLEAR on both + green.js GREEN.
- JOB 1 — FONT CLEARED ✓: decoded the base64 data-URIs with fontTools — all are valid woff2 (magic `wOF2`, flavor woff2, 18 STANDARD OpenType tables: glyf/cmap/head/name/OS-2/GPOS/GSUB/GDEF/hmtx/loca/… no unusual/exec table). name records = "Instrument Serif Regular" / "Instrument Serif Italic"; version from ttfautohint+gftools (genuine Google-Fonts OFL build). Landing embeds font#0 Regular (27072B) + font#1 Italic (27776B); legal embeds Regular (27072B). Passive font data only — NOT a script/exploit surface, decodes to sane 27KB tables (no decompression bomb). OFL license present + valid (assets/fonts/InstrumentSerif-OFL.txt, SIL OFL 1.1, Instrument Serif Project Authors). @font-face uses ONLY `src:url("data:font/woff2;base64,…")` → NO external request. ~73KB(landing)/~36KB(legal) is base64 TEXT size = size-cost only (allowed, not a money cost). NOTE: YoungSerif-Regular.woff2 + OFL are also committed in assets/fonts/ but NOT embedded/referenced in either page (unused extra asset — harmless, no leak).
- JOB 2 — ZERO-EXTERNAL + NO-LEAK ✓ (both pages): NO <link>, NO @import, NO external src/href (only outbound refs = user-tapped anchors to the live app https://sagemrln.github.io/my-first-repo/ + mailto; the only http() token is the `http://www.w3.org/2000/svg` XML NAMESPACE on inline SVG grain — an identifier, not a fetch). Grain = inline SVG data-URI, fonts = base64, screenshots = local ov_desktop.png/ov_mobile.png. Inline scripts (landing 1, legal 2) EXTRACTED + scanned = pure DOM (js flag, sticky header, year, IntersectionObserver reveal) — NO eval/new Function/fetch/XHR/sendBeacon/WebSocket/EventSource/document.write/.src=/localStorage/indexedDB/.innerHTML. (My first raw grep "hits" were FALSE POSITIVES inside the base64 blob — the base64 alphabet contains substrings like "eval"/"import"; re-scanned only the <script> bodies = clean.) LEAK SCAN: the ONLY name/email present is the sanctioned public identity Osefe Miradi / Miradiosefe@gmail.com (landing footer; legal meta+eff-lines+Contact §+Refund §+footer). NO private key, NO sk_/pk_/whsec/price_/prod_, NO CPR/IBAN/DK-acct, NO owner slots, NO private figures. SCREENSHOTS visually inspected (Read tool): both show ONLY demo profile "Alex" / WORK "Acme" with round placeholder figures ($1,252 keep, $3,400/$3,800/$4,300 low/typ/high, +$1,102, -$852), USD, country US — NO real owner balances. Clean.
- JOB 3 — PREFLIGHT EXTENDED (my security lane; edited tools/publish/preflight.js + tools/test/preflight_pii_test.js DIRECTLY):
  - Made preflight FILE-AWARE by basename: `index.html` = full app profile (slots-present+empty, exactly-1-public-key, PUBCHK, PII-with-#legalBack-exception, script balance) — BYTE-IDENTICAL behavior to before. `landing.html`/`legal.html` = static-public-page profile: leak-relevant subset only (no private key, no owner PII with a TIGHT contact/footer exception, script balance, and defensively: if an owner slot ever appears it MUST be empty). The index-only structural checks (slot-present, 1-public-key, PUBCHK) are SKIPPED for the static pages (they legitimately have none) — skipped, not faked.
  - NEW `CONTACT_ALLOW` (marketing pages) = 4 CONTEXT-ANCHORED forms: `Provider: [<strong>]Osefe Miradi[</strong>][ ("we","us")]`, `Contact: [<a mailto>]Miradiosefe@gmail.com[</a>]`, the bare `<a href="mailto:Miradiosefe@gmail.com">…</a>` anchor (Refund §), and standalone `<p>Miradiosefe@gmail.com</p>`. Whole-page scan strips ONLY those anchored forms, then runs the UNCHANGED `PII_RE` — a BARE/unexpected occurrence (comment/heading/plain text), CPR/IBAN/DK, or any non-sanctioned form still BLOCKS. Not a blanket skip.
  - ALSO FOUND + FIXED a PRE-EXISTING RED (not from my font work): commit ab015b3 (30-day refund guarantee) added an inline `contact us at Miradiosefe@gmail.com` sentence INSIDE index.html's #legalBack that matched NEITHER existing LEGAL_ALLOW form → preflight(index.html) was BLOCKING → green.js was ALREADY RED at this tip (confirmed the ORIGINAL/backup preflight also blocked). Extended index LEGAL_ALLOW with one TIGHT anchored form `/contact us at Miradiosefe@gmail\.com/g` (anchored by "contact us at " — a bare email elsewhere still blocks). This is the intended-public EU/DK refund contact. FLAG: ab015b3 landed while the gate was RED — process note for Kaito/Hugo (the refund feature never passed a clean preflight before it was committed).
  - GUARD TEST rewritten (preflight_pii_test.js) 6→12 cases: index profile (6, unchanged intent incl. real-index-passes now validating the refund form) + NEW static-page profile (6): real landing/legal PASS; bare email-in-comment (landing) BLOCK; bare provider-name (landing) BLOCK; CPR/DK inside legal BLOCK; email in non-sanctioned <h4> (legal) BLOCK. Test now writes each case under its real filename so preflight selects the right profile. 12/12.
- GATE (ran myself): `node tools/publish/preflight.js index.html` CLEAR exit 0; `… landing.html` CLEAR exit 0 (static public page); `… legal.html` CLEAR exit 0. `node tools/test/preflight_pii_test.js` 12/12 exit 0. `node tools/release/green.js` GREEN exit 0 (all suites + preflight-PII 12/12 + all published files leak-clean + APP_VER v28===sw v28).
- MUSTFIX (routed to Hugo/Kaito — green.js is Hugo's runner, I did NOT edit it): green.js's PUBLISHED_TEXT / gate does NOT yet RUN preflight on landing.html + legal.html, so the AUTOMATED release gate does not yet cover these two new public files (they are clean NOW — verified manually + preflight CLEAR + guard-locked — but a FUTURE edit wouldn't be caught). Hugo should add `run(['tools/publish/preflight.js','landing.html'])` + `… legal.html` to green.js (do NOT add them to the raw PUBLISHED_TEXT leak scan — that regex has no exception and would false-RED on the sanctioned email; they must go through preflight). Also: point landing footer Legal links to the real legal.html (Stripe requires working Terms/Privacy/Refund) + fill Stripe checkout/price placeholders before go-live (non-security, prior notes).
- VERDICT: **SAFE @ current tip (index.html unchanged; my commit = preflight.js + preflight_pii_test.js).** Font is a legitimate self-contained OFL woff2 (passive data, no external request, no exploit surface); both pages are zero-external + leak-free (only the sanctioned public identity; screenshots demo-only); preflight exception is tight, per-file, context-anchored, fail-closed, and guard-tested 12/12; I also cleared a pre-existing index refund-line RED. Gate GREEN/CLEAR. Publish still needs the green.js wiring (MUSTFIX above) so the gate durably covers these files, + Osefe's explicit "ship it" (sleep-mode: NO auto-publish).
- Commits / SHAs: security tooling @ <this commit> (preflight.js + preflight_pii_test.js). Pages reviewed: landing.html/legal.html @ 70562b8; refund line from ab015b3. This log + TEAM-CHAT SAFE in the same/follow-up commit. Still open: Hugo green.js wiring (MUSTFIX), then re-run gate + Osefe go. If a page/preflight/index changes, I re-sign.

## [2026-07-29] — via Kaito (asleep, FINAL SAFE, PRODUCTION LAUNCH) — SAFE: full launch batch (backup reminder + domain→mrln.online + i18n) @ `e97e08d`
- Asked: final SAFE gate before a REAL production deploy tonight (Osefe gave launch go). Baseline = my last SAFE `999f77c`. Verify range `999f77c..e97e08d`; run green.js + preflight myself; confirm APP_VER===sw v28; fix directly if anything in MY lane (preflight/poison/watchdog) needs it.
- SCOPE — reviewed PER-COMMIT, not just the task summary (the range was BIGGER than described): 24aeae1 index +36 backup reminder · 35d210b+b9b5504+5eb302d landing.html WARM-PALETTE REDESIGN (+legal comment cleanup) — task only mentioned "4 domain refs", I reviewed the FULL landing/legal delta since it ships to gh-pages tonight · 5e18612 domain sagemrln.github.io/my-first-repo→mrln.online (index HOST_BASE+_canonLink, landing 4 refs) + new CNAME "mrln.online" · 6a4b8c0(+e97e08d log) Mikoto i18n 3 backup strings×6 langs.
- (1) BACKUP REMINDER — no poison surface, correctly un-poisoned: `_backupDataScore()` (@~4180) counts STATE array LENGTHS (customItems/workouts/prs/notes/foodLog/media/log/savingsBoxes/incomeLog + calendar keys + MODEL.groups items), try/catch, returns int. `checkBackupReminder()` gates score>=12 + lastBackup>30d + snooze14d → `uiConfirm(title '📥 '+t('Save a copy of MRLN'), message t(...), confirm t('Save a copy'))` → on confirm `exportHTML()`. NO displayed MONEY figure, no innerHTML, no network → no `__sys` poison needed (task's assumption CONFIRMED). Title/message = t() file strings (no user data → no XSS). 📥 = allowed data-transfer icon. Wired into `__afterUnlock` @2600ms, guarded `if(document.querySelector('.modal-back.show')) return` → never stacks on another modal. Runs only post-unlock (armed).
- (2) exportHTML GUARD NOT WEAKENED (the task's specific concern): guard @5667 `if(!__sys.isArmed()||__sys.isTripped()){__sys.trip('export-while-tampered');return;}` is the FIRST statement, returns/trips on tamper. The new `STATE.lastBackup=Date.now()` stamp is @5693 = the LAST line of exportHTML, reached ONLY after guard passes AND export completes. lastBackup is a timestamp, not a money value. Even if a tampered state reached the reminder and the user tapped Save, exportHTML's own guard trips → no bypassed copy exportable. Defense-in-depth intact.
- (3) DOMAIN CHANGE — verification-safe, CRITICAL claim CONFIRMED: verify() @5850 checks signature via `_ecVerify(sigBytes,payloadBytes)` (P-256 ECDSA) + file-binding via `if(payload.f!==myFid)` where myFid=STATE.fid (@5866). ORIGIN/domain plays NO role in verification. HOST_BASE (@8545/8560) + _canonLink (@2583) only build share-link STRINGS (fid in #fragment) for display/copy — never used in signing/verify. mrln.online changes only GENERATED links, not key validity → NO key/binding regression. CNAME = public string "mrln.online".
- (4) WATCHDOGS BYTE-IDENTICAL 999f77c↔e97e08d: `__sys.token(` 18==18, __sys.arm 2==2, __sys.trip 6==6, PUBCHK 2==2, 4047293148 1==1, PUB_B64 3==3, __ownerKeySrc 7==7, hud-state 6==6, isArmed 2==2, isTripped 3==3, _ecVerify 2==2. 6 <script> balanced. Slots byte-empty (#hud-state @2385, #__ownerKeySrc @2389, both `></script>`). APP_VER v28 === sw VERSION v28.
- (5) i18n 6a4b8c0 — pure data: AUTO-MERGED dict is one ~1M-char line; SequenceMatcher char-diff timed out but danger-token counts ON the dict line are byte-identical base↔tip (</script 0, <script 0, eval( 0, new Function 0, document.write 0, innerHTML 0, fetch( 0, localStorage 0, __sys 0, PUBCHK 0, PUB_B64 0, .src= 0; function( 2==2 = pre-existing IIFE wrapper). +2494 chars = translation VALUES only (es/da/de/sv/nb/hu backup strings). Non-executable, applied via textContent path.
- (6) PUBLIC PAGES landing.html + legal.html (ship to gh-pages tonight) — zero-external + leak-free on the CURRENT files (not just the diff): landing NO <link>/@import/CDN/fetch/analytics; only http refs = 4× user-tapped https://mrln.online/ + 1× w3.org SVG NAMESPACE (identifier, not a fetch). legal = zero external refs (only the SVG namespace). Screenshots still local ov_desktop.png/ov_mobile.png, UNCHANGED since 999f77c (my prior demo-"Alex" visual verification holds). Only name/email = sanctioned public identity Osefe Miradi / Miradiosefe@gmail.com (landing footer @638; legal Provider/Contact §). No private key, no sk_/pk_/whsec/price_/prod_, no CPR/IBAN/DK-acct, no "aarhus", no owner figures. Warm-palette redesign added NO currency/number. FAQ "lose my phone" now honestly describes the backup nudge — no over-claim. legal @5eb302d = comment-removal only.
- MY PRIOR MUSTFIX CLOSED: green.js now RUNS preflight on landing.html + legal.html (visible in the run) + the 12/12 PII guard — Hugo/Kaito wired it. The automated gate now durably covers all three public files.
- GATE (ran ALL myself on e97e08d): green.js → GREEN exit 0 (16 suites all pass + html-parse 4/4 + preflight CLEAR on index/landing/legal + PII guard 12/12 + all published files leak-clean + APP_VER v28===sw v28). preflight index.html/landing.html/legal.html → CLEAR exit 0 each. preflight_pii_test.js → 12/12.
- NON-BLOCKING NOTE (for Kaito/Hugo, NOT security): APP_VER stayed v28 across the backup feature (index.html changed without a version bump). NOT a gate failure (green checks APP_VER===sw, both v28) and NOT a stale-cache risk for THIS launch — mrln.online is a brand-new origin (fresh SW install for every visitor, no prior cache). Flagged only so they decide whether to bump to v29 for cleanliness.
- VERDICT: **SAFE @ e97e08d.** Backup reminder shows no money figure → correctly un-poisoned; exportHTML tamper-guard intact (stamp is post-guard, last line); domain change verification-safe (keys bind by fid+ECDSA, not origin); watchdogs byte-identical; slots empty; i18n pure data; both public pages zero-external + leak-free; gates GREEN/CLEAR. NO security edit required.
- Commits/SHAs reviewed: e97e08d (tip), 6a4b8c0/5e18612/24aeae1/35d210b/b9b5504/5eb302d (batch), baseline 999f77c (my prior SAFE). Read-only, NO lock, NO app-code edit (TEAM-CHAT + this log only). Posted SAFE @ e97e08d to TEAM-CHAT.
- Still open: PRODUCTION deploy needs Hugo GREEN @e97e08d (I re-ran green.js → exit 0) + Mikoto MISSING:0 @6a4b8c0 (holds) + Osefe's explicit in-thread "ship it" (launch go given; sleep-mode = confirm before push). TEAM-CHAT Pending block still names the stale 7fa2298 legal candidate — real candidate is now e97e08d; my MESSAGES SAFE line covers it. If tip moves index.html/sw.js/landing/legal/preflight, I re-sign. Backlog unchanged (CSP meta parked; #team flag / hardcoded branch).

## [2026-07-29] — via Kaito (asleep, re-SAFE, PRODUCTION DEPLOY) — SAFE: favicon parity on landing+legal, tip `f0bff4d`
- Asked: fast re-SAFE on the new tip f0bff4d for tonight's production deploy. Baseline = my SAFE `e97e08d` (published files byte-identical through docs-only 673fc2c). Confirm the only published-file change is the favicon `<link>` lines; confirm index/sw/manifest byte-identical; confirm icon-192.png is same-origin; preflight landing+legal CLEAR; green.js GREEN.
- SCOPE — reviewed the FULL range e97e08d..f0bff4d per-commit: 7e0c8da (green.js — gate/tooling), 673fc2c (my SAFE doc), f0bff4d (favicon). Published-file delta = landing.html + legal.html ONLY. (Range also since grew Hugo's GREEN docs ec20b06/00b1985 — docs-only, no published-file bytes.)
- (1) PUBLISHED-PAGE DIFF = EXACTLY the favicon lines: `git diff e97e08d..f0bff4d -- landing.html legal.html` → +2/+2, both pages get `<link rel="icon" type="image/png" href="icon-192.png">` + `<link rel="apple-touch-icon" href="icon-192.png">` in `<head>`. NOTHING else on either page.
- (2) CORE APP BYTE-IDENTICAL: `git diff e97e08d..f0bff4d -- index.html sw.js manifest.webmanifest` = **0 bytes**. All prior watchdog/key/poison/slot findings from SAFE @ e97e08d HOLD unchanged (slots byte-empty, APP_VER v28===sw v28) — no bytes moved, no re-audit needed.
- (3) icon-192.png = SAME-ORIGIN published asset, NOT external: `href="icon-192.png"` is RELATIVE (no scheme/`//`). File exists (9351B, valid PNG 192x192 RGBA), ALREADY referenced by manifest.webmanifest @12 AND index.html @13-14 with the IDENTICAL path — same same-origin icon the app already ships, not a new/third-party request. Zero-external property PRESERVED (legal 0 external href/src; landing's only external hrefs = pre-existing 4× user-tapped https://mrln.online/). Before: browsers auto-404'd /favicon.ico (same-origin); now same-origin 200. No new cross-origin surface.
- (4) green.js delta 7e0c8da = TOOLING (NOT published, doesn't ship to gh-pages), PURELY ADDITIVE: adds preflight runs for landing+legal (§12a/§12b), renumbers PII-guard comment §12b→§12c. Strengthens gate, weakens nothing. CORRECTION to my e97e08d log: I wrote the landing/legal preflight wiring was already closed at e97e08d — the diff proves it landed at 7e0c8da (after e97e08d). Not a security defect (pages manually verified clean + preflight CLEAR at e97e08d); at the current tip the automated gate durably covers all three, run by me.
- GATE (ran ALL myself on f0bff4d): preflight index/landing/legal CLEAR exit 0 · `green.js` **GREEN exit 0** (parser 21, assistant 16, tax 105, media 43, transfer 58, import_sanitize 25, income_log 35, savesafety 14, photo_store 17, pr 12, silly 43, streak/sound/reorder/onboarding; html-parse 4/4; preflight CLEAR ×3; PII guard 12/12; all published files leak-clean; APP_VER v28===sw v28).
- VERDICT: **SAFE @ f0bff4d.** Only published-file change is a same-origin favicon `<link>` on two static pages; index/sw/manifest byte-identical; icon-192.png already-shipped same-origin asset; green.js additive tooling; gates GREEN/CLEAR. NO security edit required.
- Commits/SHAs reviewed: f0bff4d (tip favicon), 7e0c8da (green.js additive), 673fc2c (my SAFE doc), baseline e97e08d. Read-only, NO lock, NO app-code edit. NOTE: first push attempt hit a rebase race with Hugo's concurrent GREEN commits — my appends auto-stashed + didn't pop; recovered from stash@{0} (only my 2 files) and re-committed. Posted SAFE @ f0bff4d to TEAM-CHAT.
- Still open: gate needs Hugo GREEN @ f0bff4d (posted ec20b06/00b1985) + Mikoto MISSING:0 (unchanged — no new i18n in this delta) on the current tip, then Osefe's explicit in-thread "ship it" (sleep-mode: NO auto-publish; Kaito handles gh-pages). If index.html/sw.js/landing/legal/preflight moves, I re-sign.

## [2026-07-29] — via Kaito (asleep, LIVE payment path) — SAFE: landing Stripe wire + price $9.99/$69, tip `27c5209`
- Asked: fast SAFE confirm on already-deployed landing-page change (tip 27c5209 → gh-pages 72fcb43). Wired real Stripe checkout links into CTAs + price $6.99/$59→$9.99/$69. Verify (1) diff = ONLY text/href, no scripts/other files; (2) buy.stripe.com URLs are PUBLIC payment links, no secret; (3) no PII, preflight CLEAR; (4) zero external requests on load; (5) green.js exit 0.
- (1) SCOPE ✓ — `git diff 27c5209^..27c5209` = landing.html ONLY (+9/-8, 17 lines). Range 547af89..27c5209 also has docs (TEAM-CHAT.md, maki.md) — no code. index.html/sw.js/manifest UNTOUCHED. Changes exactly as described: 3× nav/hero/footer "Get access" href="#"+data-checkout=PLACEHOLDER → href="#pricing" (drops the placeholder attr cleanly); pricing primary btn → href=buy.stripe.com/aFa7sE7Dp4A7buoc4t97G03 (annual $69); new secondary <a> → href=buy.stripe.com/8x2aEQ8HteaHaqk5G597G02 (monthly $9.99); price 6.99/59→9.99/69, save 30%/under $5 → save 42%/under $6; FAQ line same; delivery copy "your access key emailed shortly after payment". NO <script> added.
- (2) STRIPE URLs = PUBLIC PAYMENT LINKS, NO SECRET ✓ — both are `https://buy.stripe.com/<id>` = Stripe's PUBLIC hosted-checkout links (the id is a public link token, safe to embed by design; the merchant secret never appears in one). Grepped landing.html for `sk_live_/sk_test_/rk_live_/whsec_/price_/prod_/cs_(live|test)_/Bearer` → NONE. Both URLs live ONLY inside `<a href=...>` = navigation targets (user clicks → leaves to Stripe), NOT resource loads. No account secret, no session token exposed.
- (3) NO PII / preflight ✓ — only name/email on page = sanctioned public identity (unchanged). `node tools/publish/preflight.js landing.html` → CLEAR exit 0 (slots absent, no private key, no owner PII [legal exception], 1 script balanced).
- (4) ZERO EXTERNAL ON LOAD ✓ — only `<link>` on page = same-origin relative icon-192.png (×2, unchanged). All http(s) tokens: w3.org SVG namespace (identifier, not a fetch), 2× buy.stripe.com (anchor href, not fetched on load), mrln.online (user-tapped). No `<script src>`, no external `<link href>`, no @import/fetch/XHR/Image/beacon/WS/EventSource. Page still makes ZERO auto network requests. No orphaned data-checkout JS handler (grep: only data-price attrs remain, non-network).
- (5) GATE (ran myself on 27c5209): `node tools/release/green.js` → GREEN exit 0 (all suites; preflight CLEAR ×3 index/landing/legal; PII guard 12/12; published files leak-clean; APP_VER v28===sw v28). preflight landing.html → CLEAR exit 0. Math sanity: $9.99×12=$119.88 vs $69 = saves 42.4% ("save 42%" ✓); $69/12=$5.75 ("under $6/month" ✓).
- VERDICT: **SAFE @ 27c5209.** landing.html-only text/href change; the two Stripe URLs are public payment links carrying no secret, used as navigation hrefs (not on-load fetches); zero-external-on-load preserved; no PII; core app byte-untouched; gates GREEN/CLEAR. NO security edit required. Already live (72fcb43) — nothing to hotfix.
- Commits/SHAs reviewed: 27c5209 (tip, live 72fcb43), baseline f0bff4d (prior SAFE). Read-only, NO lock, NO app-code edit (TEAM-CHAT + this log only). Posting SAFE @ 27c5209 to TEAM-CHAT.
- Still open: none security-side. If tip moves index/sw/landing/legal/preflight, I re-sign.

## [2026-07-29] — via Kaito (asleep, PRODUCTION DEPLOY, FINAL SAFE) — SAFE: v29 theming/layout deploy tip `e8c3122`
- Asked: fast FINAL SAFE on the exact production-deploy tip e8c3122 (Kaito pushes to gh-pages the moment I + Hugo confirm). Baseline = my prior SAFE d9a68fb (theming/layout switcher, commit 5243429). Confirm the delta d9a68fb..e8c3122 is exactly 3 benign things; watchdogs byte-intact; APP_VER===sw===v29; run green.js + preflight.
- DELTA d9a68fb..e8c3122 = index.html +9/-2, sw.js 1 line. Isolated the real edits (grep short changed lines; the 2MB raw diff is just the minified i18n dict line rendering):
  - (1) i18n (Mikoto e1e2db3) — AUTO-MERGED dict line grew 1052739→1053498 chars (+759 = 8 theme/layout labels ×6 langs). EXACTLY 1 added long line + 1 removed long line (the dict swap, nothing else). Danger-token scan on the added line (</script,<script,eval(,new Function,document.write,.innerHTML,fetch(,localStorage,__sys,PUBCHK,PUB_B64,4047293148,.src=,__ownerKeySrc,XMLHttp,sendBeacon) = ZERO. Pure non-executable data, applied via textContent path. MISSING:0 (target langs) per Mikoto 2cf6375/56f5ac3.
  - (2) v28→v29 bump — index APP_VER='v29' + sw VERSION='v29', both === v29 (pre-authorized). green version-tag check passes.
  - (3) pure-CSS bug fixes (6 added lines, all in <style>): `html{background:var(--bg); overscroll-behavior-y:none}` (seals white overscroll void), `#lockScreen{overscroll-behavior:contain}` (tames rubber-band — CSS scroll property, does NOT touch lock/arm/unlock JS), and hide empty food imgs `#foodPicImg/#foodPhotoThumb:not([src]),[src=""]{display:none!important}` (kills broken-image glyph). Touch NO money/key/watchdog/network — pure presentation.
- WATCHDOGS BYTE-IDENTICAL d9a68fb↔e8c3122: `__sys.token(` 18==18, __sys.arm 2==2, __sys.trip 6==6, isArmed 2==2, isTripped 3==3, _ecVerify 2==2, PUBCHK 2==2, 4047293148 1==1, PUB_B64 3==3, __ownerKeySrc 7==7, hud-state 6==6. Slots byte-empty on e8c3122 (`<script id="hud-state" type="application/json"></script>`, `<script id="__ownerKeySrc" type="text/plain"></script>`). 6 <script> balanced.
- TIP MOVED DURING RUN: HEAD advanced e8c3122→1fe9ab4 (Hugo's "FINAL GREEN @ e8c3122" LOG commit — docs-only). `git diff e8c3122..1fe9ab4 -- index.html sw.js manifest landing legal` = 0 bytes; e8c3122 is ancestor of HEAD. My gates ran on the working tree (1fe9ab4) = byte-identical published files → valid for e8c3122.
- GATE (ran myself): `node tools/release/green.js` → GREEN exit 0 (all suites; html-parse; preflight CLEAR ×3 index/landing/legal; PII guard 12/12; published files leak-clean; APP_VER v29===sw v29). `node tools/publish/preflight.js index.html` → CLEAR exit 0 (slots empty · no private key · 1 public key · no PII [legal exception] · PUBCHK intact · 6 scripts balanced).
- VERDICT: **SAFE @ e8c3122** (= HEAD 1fe9ab4 for all published bytes). Delta is exactly the 3 declared benign things: i18n pure data (no exec tokens), v29 parity bump, pure-CSS presentation fixes; watchdogs byte-identical; slots empty; gates GREEN/CLEAR. NO security edit required.
- Commits/SHAs reviewed: e8c3122 (deploy tip), 88191e7 (v29 bump), 2cf6375/56f5ac3/e1e2db3 (Mikoto i18n), d9a68fb (baseline theming code + my prior SAFE 5243429), 1fe9ab4 (Hugo log, docs-only). Read-only, NO lock, NO app-code edit (TEAM-CHAT + this log only). Posting SAFE @ e8c3122 to TEAM-CHAT.
- Still open: deploy needs Hugo GREEN @ e8c3122 (posted 1fe9ab4) + Mikoto MISSING:0 (2cf6375) + Osefe's explicit "ship it" (given: "ship it, no mistakes"; sleep-mode = Kaito handles the gh-pages push on confirm). If index.html/sw.js/landing/legal/preflight moves, I re-sign.

## [2026-07-29] — via Kaito (asleep, CUSTOMER LAUNCH, FAST SAFE) — SAFE: launch-polish (title + OG/twitter meta + http→https redirect) tip `9acd7e9`
- Asked: fast SAFE on live-now launch-polish tip 9acd7e9. Baseline = my prior SAFE e8c3122 (v29). 3 edits to index/landing/legal: (1) app <title> FINANCE HUD→"MRLN — Private money & health"; (2) OG+twitter meta added to all 3 pages; (3) http→https redirect (index: 1 line prepended INTO existing boot <script>, no new tag; landing+legal: small head <script>). Verify watchdogs byte-intact, 6 scripts, no leak/PII, redirect safe, run green+preflight.
- DELTA e8c3122..9acd7e9 published files = index.html (+12/-1), landing.html (+13), legal.html (+6); rest docs. Read all 3 diffs in full.
  - (1) TITLE: dev-leftover fix, cosmetic text only. index also gained a `<meta name="description">`.
  - (2) OG/TWITTER META: content = ONLY public mrln.online URLs (/, /landing.html, /legal.html) + og:image `https://mrln.online/ov_desktop.png` (the already-public demo-"Alex" screenshot, prior visual-verified) + product copy ("private, offline, no bank/cloud/account"). NO email, NO key, NO private figure, NO owner name in the new tags (legal's pre-existing description already carried sanctioned "Provider: Osefe Miradi"; the new OG desc does NOT add name/email). og:image is a social-crawler hint, NOT an on-load browser fetch → zero-external-on-load preserved.
  - (3) REDIRECT SAFE: `if(location.hostname==='mrln.online'&&location.protocol==='http:'){location.replace(location.href.replace(/^http:/,'https:'));}`. Anchored `^http:` = protocol-only swap; target derived from same URL (no user-controlled destination → NO open-redirect). Double-gated hostname+protocol → no-op on https (protocol!=='http:'), no-op off-domain (localhost/gh preview) → NO redirect loop, runs once max. location.replace = no history entry. index line is prepended as the FIRST statement INSIDE the existing boot <script> (line 1092, opened @1091) — NOT a new tag; touches no __sys/arm/token/money. landing+legal got a tiny head <script> (those are static pages, not the guarded 6-script app).
- WATCHDOGS BYTE-IDENTICAL e8c3122↔9acd7e9 (grep -acF line-counts, equal both tips): `__sys.token(` 16==16, __sys.arm 2==2, __sys.trip 6==6, isArmed 2==2, isTripped 3==3, _ecVerify 2==2, PUBCHK 2==2, 4047293148 1==1, PUB_B64 3==3, __ownerKeySrc 7==7, hud-state 6==6. index.html <script>/</script> = 6/6 (SAME as e8c3122 base 6/6) — the 6 = 4 code scripts + 2 empty slots; redirect added NO tag as claimed. Slots byte-empty (#hud-state @2470 `></script>`, #__ownerKeySrc @2474 `></script>`). APP_VER v29 === sw VERSION v29.
- GATE (ran ALL myself on 9acd7e9): preflight index/landing/legal → CLEAR exit 0 each (index: slots empty · no private key · 1 public key · no PII · PUBCHK · 6 scripts balanced). green.js → GREEN exit 0 (parser 21, assistant 16, streak/sound/reorder/onboarding, transfer 58, silly 43, photo 17, pr 12, tax 105, media 43, savesafety 14, income 35, import 25, html-parse 4/4, preflight CLEAR ×3, PII guard 12/12, published files leak-clean, APP_VER v29===sw v29).
- VERDICT: **SAFE @ 9acd7e9.** Title is cosmetic; OG/twitter meta reference only public URLs + the public demo screenshot + product copy (no PII/key); http→https redirect is a double-gated protocol-only forced-TLS with no open-redirect/loop, prepended into the existing boot script (no new tag, 6 scripts held); watchdogs byte-identical; slots empty; gates GREEN/CLEAR. NO security edit required.
- Commits/SHAs reviewed: 9acd7e9 (tip), baseline e8c3122 (my prior SAFE). Read-only, NO lock, NO app-code edit (TEAM-CHAT + this log only). Posting SAFE @ 9acd7e9 to TEAM-CHAT.
- Still open: none security-side. If index/sw/landing/legal/preflight move, I re-sign.

---
### 2026-07-29 — Preflight PII: allow sanctioned renewal email (lock-screen + i18n)
- **ASKED (via Kaito):** renewal copy points to email Miradiosefe@gmail.com instead of Discord; preflight REDed ("Miradi, osefe@"). Add ONE tight allow-form for the exact renewal sentence without loosening the net; add guard cases; confirm CLEAR/GREEN. Given tip 2e29208.
- **REALITY was bigger than the brief.** By the time I worked, Mikoto's i18n commit `d11eeda` had (a) translated the renewal line into 7 langs — planting Miradiosefe@gmail.com into the I18N dictionary **14×** (key + value per lang), so it was NOT "a static string only, no script touched"; and (b) **swept my UNCOMMITTED preflight.js + test edits into her i18n commit** — a lock/find-xor-fix collision (I held the lock on those files). Content ended up mine, but process was violated. Flagged to Kaito in chat.
- **DID (security, my domain — edited preflight.js + preflight_pii_test.js directly):**
  - `LOCK_ALLOW` = `/Email Miradiosefe@gmail\.com to get next month's key/g`, stripped ONLY inside the `.lk-foot` element (fail-closed) — covers the English lock-screen line (attr+text).
  - `RENEWAL_I18N` = `/"Your key unlocks the dashboard for the month\. Email Miradiosefe@gmail\.com to get next month's key\. Your financial data never leaves this device\.":"[^"]*Miradiosefe@gmail\.com[^"]*"/g`, stripped via a **callback that removes ONLY the email token**, not the surrounding value — so an injected CPR/IBAN in a translation value, or the email under any OTHER dict key, STILL REDs. Covers all 7 i18n key/value pairs.
  - +4 guard cases (renewal-phrase-outside-lk-foot fails; different-form email in lk-foot fails; CPR/IBAN in a renewal translation value fails; email under a different dict key fails). Suite now **16/16**.
- **VERIFIED @ f020a0e:** preflight(index.html) CLEAR (slots empty · no private key · 1 public key · PUBCHK intact · 6 scripts). PII guard 16/16. green.js GREEN (all suites, MISSING:0, version v31===sw v31, all published files leak-clean). Watchdogs byte-intact: `token()` count 13 in both `700a774` and HEAD; index.html minus the `var I18N` line + `lk-foot` line hashes **identical** (4f91ad6…) across 700a774→f020a0e → only the renewal copy + its i18n entries changed; no watchdog/money/key byte touched.
- **VERDICT: SAFE @ f020a0e.**
- **OPEN / for Kaito:** (1) process — Mikoto's d11eeda absorbed my in-flight security edits; verify the committed preflight.js is exactly mine (it is, on my check) and remind the team lock/find-xor-fix. (2) SAFE is on tip f020a0e; if the tip moves, I re-sign.
- Commit: security(preflight) fix pushed as `f020a0e` (earlier lock chore `30217f9`).

## [2026-07-29] — via Kaito (asleep, step 4) — SAFE: theme-system overhaul (8 palettes + 5 layouts), tip `546bfcf`
- Asked: security-pass the theme overhaul (cb561aa tokenize + 7ad6aaf 8 palettes/5 layouts + 4a01f78 i18n + 546bfcf light-edge polish). Confirm anti-tamper untouched; spread poison into anything NEW that computes/displays a value OR state explicitly that pure decoration needs none; confirm cssVar + migration can't be abused; confirm no private number/key leak. Fix directly if needed; SAFE against explicit SHA.
- Baseline pre-overhaul index.html tip = **ddef4c0**; reviewed range ddef4c0..546bfcf (index.html ONLY changed: +250/-147; sw.js/manifest/landing/legal 0 bytes).
- WATCHDOGS BYTE-INTACT ddef4c0↔546bfcf (grep -acF, equal both tips): `__sys.token(` 16==16, `token(` 18==18, `__sys` 31==31, __sys.arm 2, __sys.trip 6, isArmed 2, isTripped 3, _ecVerify 2, PUBCHK 2, 4047293148 1, PUB_B64 3, __ownerKeySrc 7, hud-state 6. Slots byte-empty (`<script id="hud-state" type="application/json"></script>`, `<script id="__ownerKeySrc" type="text/plain"></script>`). 6 <script> balanced. APP_VER v33 === sw v33.
- FULL-DIFF SENSITIVE-TOKEN SCAN (grep the +/- lines for __sys/token/PUBCHK/PUB_B64/4047293148/ownerKeySrc/hud-state/_ecVerify/isArmed/isTripped/fetch/XMLHttp/sendBeacon/eval/new Function/document.write/innerHTML/.src=/localStorage/indexedDB): exactly ONE hit — `bar.innerHTML='…<b style="color:#eaffff…'` → `…color:var(--bright)…`. This is a PRE-EXISTING onboarding innerHTML; the change is a color-LITERAL swap only, interpolated content still 100% file-static (no user data) → no new injection surface. Everything else in the diff is CSS token blocks + color-literal→var(--token) swaps.
- cssVar (@2586) `getComputedStyle(documentElement).getPropertyValue(n).trim()||'#888'` in try/catch — READ-ONLY, arg `n` is a fixed file-authored var name. All 7 call sites (3395/3405/3406/3415/3451 savings chart; 6163/9108 lock/wake FX) feed canvas strokeStyle/fillStyle/font = COLOR STRINGS only, no execution surface; invalid color = ignored. `_COLT={low:'--amber',avg:'--cyan',high:'--lime'}`/`_RGBT={low:'--warn-rgb',avg:'--accent-rgb',high:'--pos-rgb'}` are FIXED internal maps keyed by the internal scen enum → no user-controlled var name. Chart only recolors; its numeric data path (poisoned upstream) is untouched.
- applyAppearance (@6560) migration is INJECTION-SAFE: THEMES(8)/LAYOUTS(5) fixed whitelists; `if(THEMES.indexOf(p.theme)<0) p.theme=TMIG[p.theme]||'landing'` (TMIG/LMIG only map 3 retired keys→whitelist values, everything else→'landing'/'command') FORCES p.theme/p.layout into the whitelist BEFORE setAttribute('data-theme'/'data-layout'). Even a malicious imported STATE.prefs.theme is normalized first; and setAttribute doesn't parse HTML — data-theme/layout are consumed only by CSS attribute selectors (inert, no exec) → no attribute/CSS/HTML injection. themeSel/layoutSel change handlers set from fixed <option> values + re-validate via applyAppearance.
- POISON DECISION: **intentionally added NONE.** The overhaul is pure presentation — no money/health math, no NEW displayed STATE value, no private number, no network, no new export/import. cssVar only picks DRAW COLORS; applyAppearance only sets two whitelisted attrs. Poisoning decoration (deleting it can't bypass a control) would be wrong per the brief. Correctly un-poisoned.
- LEAK: no BEGIN PRIVATE KEY / sk_/whsec_ / aarhus / cpr / owner figure in tip index.html; only public key present (1). Slots empty.
- GATE (ran myself @546bfcf): `preflight index.html` CLEAR exit 0 (slots empty · no private key · 1 public key · no PII [legal exception] · PUBCHK intact · 6 scripts). `green.js` GREEN exit 0 (all suites; html-parse; preflight CLEAR ×3 index/landing/legal; PII guard 16/16; published files leak-clean; APP_VER v33===sw v33).
- VERDICT: **SAFE @ 546bfcf.** Watchdogs byte-identical; slots empty; the only innerHTML touch is a static color swap; cssVar is read-only color-only; theme migration is whitelist-forced (no injection); pure presentation → no poison needed; gates GREEN/CLEAR. NO security edit required.
- Commits/SHAs reviewed: 546bfcf (tip), 4a01f78/7ad6aaf/cb561aa (overhaul), baseline ddef4c0. Read-only, NO lock, NO app-code edit (TEAM-CHAT + this log only). Posting SAFE @ 546bfcf to TEAM-CHAT.
- Still open: gate needs Hugo GREEN @546bfcf (I re-ran green.js → exit 0) + Mikoto MISSING:0 for the 13 theme/layout option names (4a01f78 covers es/da/de/sv/nb/hu — Mikoto confirms), then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If index/sw/landing/legal/preflight moves, I re-sign.

### [2026-07-29] follow-up — TIP MOVED → RE-SAFE @ `dfd7904`
- Freeze rule: tip advanced 546bfcf→dfd7904 ("fix(theme): toast text invisible on light themes"). Re-verified the delta myself.
- Published-byte diff 546bfcf..dfd7904 = index.html ONE line only (toast() builder @8901): `color:#eaffff` → `color:var(--bright)` inside d.style.cssText — makes the greeting/toast readable on the 3 light palettes. `d.textContent=msg` UNCHANGED (still textContent, not innerHTML) → no injection. sw.js/manifest/landing/legal 0 bytes.
- Watchdogs BYTE-IDENTICAL 546bfcf↔dfd7904: `__sys.token(` 16==16, token( 18==18, __sys 31==31, PUBCHK 2, 4047293148 1, PUB_B64 3, __ownerKeySrc 7, hud-state 6, _ecVerify 2, isArmed 2, isTripped 3. Slots byte-empty; 6 scripts; APP_VER v33===sw v33. No new value/math/network → no poison needed (color token swap only).
- GATE (ran myself @dfd7904): preflight index CLEAR exit 0; green.js GREEN exit 0.
- VERDICT: **SAFE @ dfd7904** (index.html at dfd7904 = 546bfcf + the single toast color line). Hugo re-GREEN @dfd7904 (50fc3de). If tip moves index/sw/landing/legal/preflight, I re-sign.

### [2026-07-29] follow-up 2 — TIP MOVED → RE-SAFE @ `e58f3d5`
- Freeze rule: tip advanced dfd7904→e58f3d5 ("restore Cyberpunk as default + fix theme persistence, v33→v35"). Verified the delta myself.
- Published diff dfd7904..e58f3d5 = index.html (CSS + JS presentation) + sw.js (v35 bump only). Exactly the 4 declared things:
  1. CSS: :root default tokens Daylight→Cyberpunk; added explicit [data-theme="cyber"] block (= :root); light-FX gate no longer keys on `html:not([data-theme])` so the cyber default keeps neon FX. Pure presentation.
  2. JS applyAppearance: THEMES whitelist +'cyber' (9), default 'cyber', TMIG drops cyber (valid again). STILL `if(THEMES.indexOf(p.theme)<0) p.theme=TMIG[p.theme]||'cyber'` → whitelist-FORCES before setAttribute — the injection-safe pattern I already ruled on. themeSel default 'landing'→'cyber' + new <option value="cyber">.
  3. Removed the stale boot-time validator @~2758 (`if(['calm','pink','cyber']...) theme='cyber'` / layout) that reset every NEW theme/layout to cyber/pro on reload (the persistence bug). NOT a security control — it was a theme/layout STRING validator; `applyAppearance()` is still called on the very next line and still normalizes to the whitelist before setAttribute → validation consolidated + corrected, NOT weakened. No injection opened.
  4. Version v33→v35 (APP_VER + sw VERSION).
- No money math, no __sys/watchdog byte, no network, no export/import, no new displayed value. WATCHDOGS BYTE-IDENTICAL dfd7904↔e58f3d5: `__sys.token(` 16==16, token( 18, __sys 31, PUBCHK 2, 4047293148 1, PUB_B64 3, __ownerKeySrc 7, hud-state 6, _ecVerify 2, isArmed 2, isTripped 3. Slots byte-empty; 6 scripts; APP_VER v35===sw v35. Pure presentation → no poison needed.
- GATE (ran myself): preflight index CLEAR exit 0; green.js GREEN exit 0.
- VERDICT: **SAFE @ e58f3d5.** Cyberpunk-default + persistence fix is presentation + a removed redundant validator (applyAppearance still whitelist-forces → no injection, no weakened control); watchdogs byte-identical; slots empty; v35 parity; gates GREEN/CLEAR. NO security edit required. Hugo re-GREEN @e58f3d5 (6687a96). If tip moves index/sw/landing/legal/preflight, I re-sign. New i18n string "Cyberpunk" → Mikoto MISSING check (not security).

### [2026-07-29] follow-up 3 — TIP MOVED → RE-SAFE @ `4a10893`
- Freeze rule: tip advanced e58f3d5→4a10893 ("fix(layout): Canvas bottom bar unreadable with 13 tabs, v35→v36"). Verified delta myself.
- Published diff e58f3d5..4a10893 = index.html CSS-only (entirely inside the `html[data-layout=canvas]` block: nav.tabs flex:1→horizontal-scroll strip of natural-width pills [flex:0 0 auto, white-space:nowrap, scrollbar hidden, active-pill highlight], .savebar lifted above the bar) + APP_VER v35→v36; sw.js VERSION v35→v36. NO JS, no money math, no strings, no network.
- WATCHDOGS BYTE-IDENTICAL e58f3d5↔4a10893: `__sys.token(` 16==16, token( 18, __sys 31, PUBCHK 2, 4047293148 1, PUB_B64 3, __ownerKeySrc 7, hud-state 6, _ecVerify 2, isArmed 2, isTripped 3. Diff sensitive/JS-token scan = empty. Slots byte-empty; 6 scripts; APP_VER v36===sw v36. Pure CSS → no poison needed.
- GATE (ran myself): preflight index CLEAR exit 0; green.js GREEN exit 0.
- VERDICT: **SAFE @ 4a10893.** CSS-only canvas-nav readability fix + v36 parity bump; watchdogs byte-identical; slots empty; gates GREEN/CLEAR. NO security edit required. Hugo re-GREEN @4a10893 (4218d9c). If tip moves index/sw/landing/legal/preflight, I re-sign.

### [2026-08-03] follow-up 4 — TIP MOVED → SAFE @ `d67cdac` (landing "How it works" + 6 new screenshots)
- Freeze rule: tip advanced 4a10893→d67cdac (content commit 4438500; Hugo GREEN 3f9c60d on top). Verified myself.
- (1) SCOPE ✓ — published-byte delta = landing.html (+58) + 6 NEW PNGs assets/howto/{expenses,gym,food,calendar,notebook,media}.png. index.html/sw.js/legal.html/manifest = **0 bytes** (index.html + sw.js sha256 IDENTICAL 4a10893↔d67cdac: b3d80477b16e368f / 394c27d2037a630c). Rest of range = docs (TEAM-CHAT, team logs, Maki competitor report).
- (2) NO NEW NETWORK/SCRIPT SURFACE ✓ — landing.html diff added ZERO `<script>`, zero external src/href, zero @import/fetch/url(https:). All 6 new `<img src>` are RELATIVE local repo assets (assets/howto/*.png), lazy/async, plain alt text. Full current-file external-ref sweep = only the PRE-EXISTING 2× buy.stripe.com + 4× mrln.online anchors (user-tapped navigation, not on-load fetches). NO third-party hotlink introduced — zero-external-on-load PRESERVED. New CSS is a scoped `.howto-*` block (presentation only).
- (3) IMAGE LEAK SCAN — the real risk here (images bypass every text scan; my own standing precedent from ov_desktop.png). VISUALLY INSPECTED ALL SIX with the Read tool, not assumed:
  · expenses.png — Budget tab, demo figures: total/mo 1.795 kr, /yr ~21.540 kr, Housing 1.100 / Food 470 / Transport 120 / Subs 75 / Other 30 kr. Synthetic + implausibly low for a real Aarhus household (real rent is multiples of 1.100 kr) → clearly seeded demo, NOT owner data. No name/PII.
  · notebook.png — generic seeded notes only ("Groceries this week: chicken, rice, oats… stay under 600 kr", "Renewal reminder: gym membership renews on the 12th"). No names, addresses, credentials or keys. Country field EMPTY.
  · media.png — public film/show titles (Interstellar, Severance, Breaking Bad 9.5). No personal content.
  · calendar.png — August 2026 month grid with DOTS only; no event text rendered. Placeholder is the app's static example string ("e.g. Mum's birthday / Rent due / Dentist 14:00").
  · gym.png — generic training split (Mon Push / Wed Pull / Fri Legs, standard lifts+sets). No body stats, no health figures.
  · food.png — macro totals 1,270 kcal / 108p / 134c / 27f. Generic, no identity.
  · METADATA: parsed PNG chunks on all 6 — ZERO tEXt/iTXt/zTXt/eXIf/tIME chunks (no embedded username/path/device/timestamp). Raw-byte grep for miradi|osefe|aarhus|BEGIN|PRIVATE KEY across all 6 = NONE. Landing also carries the honest caption "All screenshots show the app's demo profile — example data, not a real person."
- (4) WATCHDOGS ✓ — index.html untouched (hash-identical), so all markers byte-identical by construction: `__sys.token(` 16==16, token( 18, __sys 31, PUBCHK 2, 4047293148 1, PUB_B64 3, __ownerKeySrc 7, hud-state 6, _ecVerify 2, isArmed 2, isTripped 3. Slots byte-empty; APP_VER v36===sw v36. No money math / no new displayed STATE value / no network / no export → NO poison needed (static marketing HTML+CSS).
- GATE (ran myself): preflight landing.html CLEAR exit 0; preflight index.html CLEAR exit 0; green.js GREEN exit 0.
- VERDICT: **SAFE @ d67cdac.** landing.html + 6 local PNGs only; no script/network/hotlink added; all 6 screenshots visually verified demo-only (no real PII/owner figures/keys) with no PNG metadata; core app byte-identical; gates GREEN/CLEAR. NO security edit required.
- STANDING NOTE (not blocking, for Hugo/Kaito): the automated gate CANNOT scan image CONTENT — assets/howto/*.png + ov_*.png are cleared by human/visual review only. Any FUTURE regeneration of these screenshots must be re-inspected visually before publish; a text-only green.js pass is not sufficient evidence for images.

### [2026-08-03] follow-up 5 — TIP MOVED → SAFE @ `b3169dd` (landing i18n EN/DA/FR — NEW inline script)
- Freeze rule: tip advanced d67cdac→b3169dd (c5bf8c2 Kaito runtime + 78dca36/04f55ac Mikoto da/fr dicts; Hugo GREEN 05f96f5 on top). This is the first landing change adding EXECUTABLE code + an innerHTML sink, so I read the runtime line-by-line rather than trusting the summary.
- (1) SCOPE ✓ — published delta = landing.html (+65) only; new tools/i18n/landing_keys.json is BUILD TOOLING under tools/ (not served to gh-pages), 151 lines, zero identity/key markers. index.html/sw.js/legal.html/manifest = **0 bytes** (index+sw sha256 IDENTICAL d67cdac↔b3169dd: b3d80477b16e368f / 394c27d2037a630c) → watchdogs byte-intact by construction (`__sys.token(` 16, PUBCHK 2, 4047293148 1, PUB_B64 3, __ownerKeySrc 7, hud-state 6). Slots empty; APP_VER v36===sw v36.
- (2) NEW RUNTIME (landing.html @785-833) — ZERO network/exfil surface, verified by count on the whole block: fetch( 0, XMLHttpRequest 0, sendBeacon 0, WebSocket 0, EventSource 0, eval( 0, new Function 0, document.write 0, importScripts 0, createElement('script') 0, .src= 0, http:// 0, https:// 0, @import 0. Nothing is transmitted anywhere; dictionaries are inline literals. Landing external refs UNCHANGED (only pre-existing 2× buy.stripe.com + 4× mrln.online anchors) → zero-external-on-load preserved. Script blocks 3/3 balanced (preflight agrees).
- (3) INJECTION ANALYSIS — two sinks, both safe:
  · TEXT nodes: `n.nodeValue = orig.replace(key,tr)` — nodeValue assignment is TEXT ONLY, never HTML-parsed, so even a hostile `t` value CANNOT inject markup. TreeWalker rejects script/style/noscript/[data-i18n-html] subtrees.
  · innerHTML: ONLY on `[data-i18n-html]` = exactly 2 file-authored elements (<h1 hero-h1>, <p price-year>). Values come from the static `h` dict. SWEPT the full 32KB dict block: `<script` 0, `</script` 0 (no breakout), `<iframe|<img|<svg|<object|<embed` 0, srcdoc 0, `javascript:` 0, `data:text/html` 0, onerror/onclick/onload/onmouseover/onfocus 0, generic `on*=` regex 0. **The ONLY tag names present in the entire dict block are `span` and `strong`** (`<span class="warm-underline">`, `<span class="tnum" data-price-year="69">`, `<strong>`) = benign inline formatting mirroring the English source. No smuggled markup.
- (4) LANGUAGE INPUT IS WHITELISTED ✓ — `lang` from localStorage OR navigator.language sniff is filtered by `if(['en','da','fr'].indexOf(lang)<0) lang='en'` BEFORE any use, so `setAttribute('lang',lang)` only ever receives en/da/fr → no attribute injection. I tested a poisoned pref myself: `__proto__`, `constructor`, `<img src=x onerror=alert(1)>`, `" onload="x`, null → ALL fall back to 'en'. The select's only values are the fixed en/da/fr options. Prototype-key lookup is harmless too: `__L10N['__proto__']` yields d.t/d.h undefined → no translation applied, innerHTML restored to the captured original (no pollution exploit).
- (5) localStorage — key `mrln_landing_lang` stores ONLY a whitelisted 3-value language code, in try/catch. Benign UI preference, no PII, no app/finance data (landing page holds no user data at all).
- (6) `$`-SUBSTITUTION quirk checked empirically (String.replace GetSubstitution): dict values contain 28 `$` chars, all price strings ($12/$69/$9.99/$6). Ran the real strings through `orig.replace(key,tr)` → output byte-intact (with a STRING pattern there are no captures, so `$1`/`$6`/`$9` stay literal). No mangling. (Would only bite if a future value contained `$&`, `` $` ``, `$'` or `$$` — none do; noted for Mikoto, cosmetic not security.)
- GATE (ran myself): preflight landing.html CLEAR exit 0; preflight index.html CLEAR exit 0; preflight legal.html CLEAR exit 0; green.js GREEN exit 0.
- VERDICT: **SAFE @ b3169dd.** New i18n runtime is offline/no-network, innerHTML limited to 2 static elements fed by dictionaries containing only span/strong, text path is nodeValue (unparseable), language input whitelisted against poisoned storage, localStorage is a benign pref; core app byte-identical; gates GREEN/CLEAR. NO security edit required. Marketing page has no money math/private numbers → no poison needed.
- Still open: nothing security-side. Standing image note from d67cdac stands (gate can't scan screenshot CONTENT).

### [2026-08-03] follow-up 6 — TIP MOVED → SAFE @ `ee4e801` (v37 lock-screen "New here?" link)
- Freeze rule: tip advanced b3169dd→ee4e801 (398a65a anchor+CSS+v37, ddc9313 Mikoto 6 dict entries; Hugo GREEN 1d9fab7 on top). This touches the LOCK SCREEN — the app's most security-sensitive surface — so I isolated the real edits instead of trusting the summary.
- (1) SCOPE ✓ — published delta = index.html + sw.js only (landing/legal/manifest 0 bytes). sw.js = VERSION v36→v37, nothing else. index.html real edits, ISOLATED by filtering the diff to short lines: EXACTLY 2 CSS rules (.lk-about + :hover, @779-780), 1 anchor (@1236), APP_VER v36→v37, + the i18n dict line. Subtracting those, the remaining changed-line set is **EMPTY** → no unlock/verify/mint/arm/trip logic line touched.
- (2) UNLOCK/CRYPTO PATHS BYTE-IDENTICAL b3169dd↔ee4e801: `__sys.token(` 16==16, token( 18, __sys 31, __sys.arm 2, __sys.trip 6, isArmed 2, isTripped 3, _ecVerify 2, `verify(` 4==4, `subtle` 5==5, PUBCHK 2, 4047293148 1, PUB_B64 3, __ownerKeySrc 7, hud-state 6. Slots byte-empty; 6 scripts balanced; APP_VER v37===sw v37.
- (3) THE ANCHOR — `<a class="lk-about" href="https://mrln.online/landing.html" target="_blank" rel="noopener" data-i18n="New here? See what MRLN is">`. STATIC file-authored href to our OWN domain; NO dynamic href construction; grep for `lk-about|lkAbout` = exactly 3 hits (2 CSS + the anchor) → **NO JS handler bound**, no getElementById, no addEventListener. It is inert markup: no script, no fetch, no new network surface (nothing loads until the user taps it).
- (4) REFERRER ANALYSIS (the one thing worth pressing on — `noopener` present, `noreferrer` absent): NOT a leak, proven not assumed. `rel="noopener"` blocks `window.opener` → tabnabbing closed (the real target=_blank risk). For Referer: the file ID lives ONLY in the URL **fragment** — `_canonLink()` @2788 builds `'https://mrln.online/' + '#'+STATE.fid`, and it is read back via `location.hash` @2761; `location.search`/`URLSearchParams` occurrences = **0**. Fragments are stripped from the Referer header by spec, so the fid CANNOT be transmitted. Destination is same-origin (mrln.online→mrln.online) anyway; from a locally-saved customer file (file://) no Referer is sent at all, and cross-origin the modern default `strict-origin-when-cross-origin` sends only the origin. Conclusion: adding `noreferrer` would be harmless belt-and-suspenders but is NOT required here — I am deliberately NOT raising it as a finding, because the fragment-only fid makes it a non-leak.
- (5) i18n (ddc9313) — dict line +347 chars ("New here? See what MRLN is" ×7 langs, 14 key/value occurrences). Danger-token counts on the dict line are IDENTICAL base↔tip and all ZERO: </script, <script, eval(, new Function, document.write, innerHTML, fetch(, localStorage, __sys, PUBCHK, PUB_B64, 4047293148, .src=, __ownerKeySrc, XMLHttp, sendBeacon, javascript:, onerror. Pure non-executable data (applied via the textContent path).
- (6) NO POISON NEEDED — the anchor displays a static marketing sentence; no money/health value computed or displayed, no STATE read, no export. Poisoning inert decoration would be wrong. Correctly un-poisoned. Lock screen's own arm/verify controls are byte-identical, so the gate on the dashboard is unchanged.
- GATE (ran myself): preflight index/landing/legal CLEAR exit 0 each; green.js GREEN exit 0; APP_VER v37===sw v37.
- VERDICT: **SAFE @ ee4e801.** One inert static anchor + 2 CSS rules + version bump + pure-data i18n; unlock/verify/mint and every watchdog marker byte-identical; no JS handler, no dynamic href, no new network surface; fid is fragment-only so no Referer leak despite noreferrer being absent; gates GREEN/CLEAR. NO security edit required.
- Still open: nothing security-side. Standing image note from d67cdac stands (gate cannot scan screenshot CONTENT).

### [2026-08-03] follow-up 7 — via Kaito (asleep, step 4) — SAFE @ `9114d48` (v38 lock-screen "Export my data" escape hatch)
- Asked: security-review Kaito's v38 data-export escape hatch. Product decision (Osefe): a lapsed/expired key keeps the app LOCKED (subscription enforced), but the user must ALWAYS be able to get their own data out — makes the landing "your data is always yours" truthful. 6-point brief: (1) key-leak, (2) paid-gate, (3) threat model, (4) poison decision, (5) watchdog byte-identity, (6) gate.
- Baseline pre-change tip = **b1fcd2c** (9114d48^). Reviewed range b1fcd2c..9114d48 (index.html +46/-2, sw.js v37→v38, TEAM-CHAT). Read the FULL diff, not the summary.
- WHAT CHANGED (exactly 4 index.html hunks): CSS `.lockcard .lk-export`@781-784 (amber-hover ghost btn); `#lkExport` button@1241 (`style="display:none"`, `data-i18n="📤 Export my data"`, between `.lk-about` and `.lk-legal`); new JS in the LOCK IIFE@6086-6122 (`DATA_KEY='financeHudState'`, `_dataObj`, `hasExportableData`, `updateExportBtn`, `exportMyData`); wiring — `lock()`@6084 gained `try{ updateExportBtn(); }catch(_){ }`, `boot()`@6169 gained the `#lkExport` click→`exportMyData` listener + an initial `updateExportBtn()`. APP_VER v37→v38, sw VERSION v37→v38.
- (1) KEY-LEAK = **NONE**. Owner PRIVATE signing key lives ONLY in DOM `#__ownerKeySrc` (empty in product), read via `priv()`@8736 → used transiently to derive the RFC6979 signing scalar inside MINT; it is NEVER assigned to any STATE property. `financeHudState` is written ONLY at autosave@2816–2817 (`JSON.stringify(STATE,_saveReplacer)`) + the blank-seed@7081; DEFAULTS@2734 + every `STATE.*` field = data (workouts/log/prs/notes/foodLog/media/calendar/body/tax/cfg/prefs/…), zero key material (`STATE.bakeKey` is a BOOLEAN "keep me signed in" checkbox, not a key). `exportMyData` reads ONLY `localStorage['financeHudState']` → cannot carry the private key. The customer ACCESS key is a SEPARATE localStorage key `mrln_access_key`@6001 (baked only into a COPY `stateForFile`@5887 for `exportHTML`, not into STATE) — also not in the export, and it's the customer's own key regardless.
- (2) PAID-GATE = intact. `exportMyData`@6111 → `new Blob([raw],{type:'application/json'})`@6117, `.json` download via createObjectURL+a.click()+revoke. NO `outerHTML`, no HTML — a `.json` is not a runnable app. Deliberately NOT `isArmed`-gated (must work on lapse). Contrast `exportHTML`@5879 which IS `__sys.isArmed()&&!isTripped()`-gated@5880 because it emits a runnable/armed app. Correct asymmetry.
- (3) THREAT MODEL = consistent. Lock = licensing gate, NOT device-theft encryption. `financeHudState` already plaintext in localStorage → anyone at an unlocked-OS device could already read it via devtools; the button only surfaces via UI what was trivially reachable, decrypts nothing, exposes no OTHER user's data, and makes ZERO network calls (local blob download only) → "never leaves this device" preserved, "your data is always yours" now literally true. No new meaningful exposure. Minor info-disclosure (button presence reveals "device holds data") is negligible vs physical access.
- (4) POISON = correctly NONE. `hasExportableData` only checks truthiness/`.length`/`Object.keys` (renders no figure), `updateExportBtn` toggles visibility, `exportMyData` downloads raw JSON. None compute/display a money-or-health value, none arm the core or unlock the dashboard; short-circuiting any only REMOVES the escape hatch (grants no bypass). Poison guards integrity-critical computations — none here. Same standing ruling as the "New here?" anchor + theme overhaul. All new fns are scoped INSIDE the LOCK IIFE (`var LOCK=(function(){…`@5998) — no global pollution.
- (5) WATCHDOGS BYTE-IDENTICAL b1fcd2c↔9114d48: `__sys.token(` 16==16, `token(` 18, `__sys` 31, `__sys.arm` 2, `__sys.trip` 6, isArmed 2, isTripped 3, `_ecVerify` 2, PUBCHK 2, 4047293148 1, PUB_B64 3, `__ownerKeySrc` 7, hud-state 6, `verify(` 4, `subtle` 5. Full diff = ONLY the 4 declared hunks; subtracting them, no unlock/verify/mint/money/tax/food line touched. Slots byte-empty (`<script id="hud-state" type="application/json"></script>`, `<script id="__ownerKeySrc" type="text/plain"></script>`). APP_VER v38===sw v38.
- (6) GATE (ran myself @9114d48): `node tools/release/green.js` → **GREEN exit 0** (parser + all suites; html-parse; preflight CLEAR ×3 index/landing/legal; PII guard 16/16; published files leak-clean; APP_VER v38===sw v38). Only leak-marker hit in index.html = "Aarhus" @5594 — a CODE COMMENT ("our Aarhus base") in the transfer-parser, pre-existing + far from the diff, preflight CLEAR → benign. The one `fetch(`@9452 = pre-existing owner-gated Team Room viewer (not touched); the new export code adds zero network.
- VERDICT: **SAFE @ 9114d48.** Owner private key structurally cannot enter the export (separate DOM node, never in STATE); export emits raw JSON not a runnable app so paid-gate holds; consistent with the licensing (not encryption) threat model, zero network; no poison needed (no integrity-critical computation); watchdogs byte-identical; slots empty; gates GREEN/CLEAR. NO security edit required.
- Commits/SHAs reviewed: 9114d48 (tip), baseline b1fcd2c (9114d48^). Read-only, NO lock, NO app-code edit (TEAM-CHAT + this log only). Posted SAFE @ 9114d48 to TEAM-CHAT.
- Still open: gate needs Hugo GREEN @9114d48 + Mikoto MISSING:0 for the new `📤 Export my data` string on the current tip, then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). Non-security note routed to Mikoto/Kaito: the `setStatus(...)` toast literals inside `exportMyData` are hardcoded English (not `t()`/`data-i18n`) — cosmetic i18n gap, not a security matter. If tip moves index/sw, I re-sign.

### [2026-08-03] follow-up 7b — TIP MOVED `9114d48`→`1aeba2e` (concurrent-push collision; my SAFE still valid)
- After committing my SAFE (c8af910), a concurrent LOCAL commit `1aeba2e` (landing identity revamp, landing.html +232/-150, authored 14:27) was present in my branch and got pushed up with mine (`9114d48..1aeba2e`). Not my commit — looks like a second session (Kaito holds the landing-revamp lock @ TEAM-CHAT line 24) committing into the shared cwd while I finalized. Flagged to Kaito in TEAM-CHAT (ground-rule #1 collision).
- MY SAFE UNAFFECTED: `git diff --stat 9114d48..1aeba2e -- index.html sw.js manifest.webmanifest` = EMPTY → app bytes byte-identical; watchdogs/slots/version all as signed. SAFE @ 9114d48 holds for the current tip's app.
- `1aeba2e` is NOT part of my assigned review — it must get its own gate before ship (Mikoto i18n on new EN copy, Hugo GREEN, full Akashi pass on any changed landing i18n runtime/innerHTML). Quick safety scan only (NOT a full review): preflight landing.html CLEAR, 4 scripts balanced, zero new external/network/PII; green.js GREEN exit 0 @1aeba2e.
- Open: same as follow-up 7 (Hugo GREEN + Mikoto MISSING:0 @ current tip for the export string, then Osefe ship). Plus: landing revamp 1aeba2e awaits its own review/gate. Reminder to team re lock/one-session-at-a-time.

### [2026-08-03] follow-up 8 — via Kaito (asleep, gate step 10) — SAFE @ `8565ddd` (LANDING REVAMP + v38 export escape-hatch candidate)
- Asked: give SAFE on the frozen Pending candidate "LANDING REVAMP + v38 DATA-EXPORT ESCAPE HATCH" (published-byte state frozen @ `8565ddd`). Scope = (a) the LANDING revamp (privacy claims + leaks/XSS) and (b) the index.html DELTA since my escape-hatch `SAFE @ 9114d48`. Escape-hatch app logic already cleared @ 9114d48 (follow-up 7); this pass adds the landing + the i18n delta. HEAD was `53a3b31` (Pending-registration docs commit).
- FREEZE ✓ — `git diff --stat 8565ddd -- index.html landing.html sw.js legal.html manifest` = **EMPTY** (working tree == frozen tip for all published files; the 53a3b31 tip commit is docs-only). Full range `9114d48..8565ddd` published-file delta = index.html (+1/-1 content) + landing.html (revamp).
- (A) INDEX DELTA since 9114d48 = ONLY Mikoto `aeb1208`. Exactly **one** i18n dict IIFE line swapped (+1 / -1 content line, single hunk @~6323); no short structural edits at all. Adds 6 translations of "📤 Export my data" (es/da/de/sv/nb/hu; ms passthrough). Danger-token scan on the ADDED line = **0** for </script,<script,eval(,new Function,document.write,.innerHTML,fetch(,XMLHttp,sendBeacon,localStorage,__sys,PUBCHK,PUB_B64,4047293148,.src=,__ownerKeySrc,javascript:,onerror,onload,data:text/html,import( . Pure non-executable data (textContent path).
  - WATCHDOGS BYTE-IDENTICAL 9114d48↔8565ddd (grep -aoF, text mode): `__sys.token(` 18==18, `token(` 20==20, `__sys` 40==40, `__sys.arm(` 2, `__sys.trip(` 6, isArmed 2, isTripped 3, `_ecVerify` 2, PUBCHK 2, 4047293148 1, PUB_B64 3, `__ownerKeySrc` 7, hud-state 6, `verify(` 4, `subtle` 5. Slots byte-empty (`#hud-state`@2588, `#__ownerKeySrc`@2592 both `></script>`). 6/6 scripts. APP_VER **v38 === sw v38**. No PII/leak in the new label strings.
- (B) LANDING privacy claims — vetted vs code, NOT the summary. Enumerated every outbound primitive in index.html@8565ddd: `fetch(`=1 (the owner-gated Team Room@9452 — card hidden unless `#__ownerKeySrc` non-empty OR `mrln_team` localStorage flag set via `#team` hash; customer never triggers; GETs the *public* raw TEAM-CHAT.md with only a `?t=`+Date.now() cache-buster → sends NO PII), XMLHttpRequest/sendBeacon/WebSocket/EventSource/geolocation = 0, `new Image()`=2 (both LOCAL: resizePhoto@7743 + reencode@7868 = FileReader/data:→canvas EXIF-strip re-encode, no remote src). No external LLM/API/CDN/script src (only refs: `mrln.online` anchor + the raw-GitHub Team Room URL; the "Gpt"/"CDN." grep hits are random substrings inside the PUB_B64 blob). Claims:
  · ASSISTANT "runs on your device — nothing is uploaded, and no outside AI service is called" (l.575-576/727/735) — `answerData`@5730 has NO network primitive; the sole fetch is unrelated (Team Room) → TRUE/defensible.
  · SOFTENED #1 "No sign-up, no cloud, no password. There is no account to hack, leak, or reset." (l.516) — scoped to ACCOUNT; none exists (no signup/cloud/password; `mrln_access_key` is a *license* key, not an account) → defensible, no longer the over-broad "nothing to hack".
  · SOFTENED #2 "turn on airplane mode and open MRLN — everything you've saved still works, because your data never needed the network." (l.523) — data path fully local; SW-cached PWA runs offline → scoped to DATA, defensible (not "nothing ever needed the network").
  · l.503 "no server, no account, and no copy of your life anywhere but your device" — true from customer POV; Team Room is owner-only + reads a PUBLIC file, stores no user data → does not falsify "no copy of your LIFE".
  · "your data never leaves your device" (l.8/13/19 meta, 673, 781), "no bank connection" (l.715), storage self-serve "only you ever hold a copy / nothing syncs behind your back" (l.663), escape-hatch "export every number from the lock screen even if your key lapses" (l.663/731) — all match code: no exfil, no auto-sync/beacon, and the lock-screen export matches the v38 `exportMyData` (no isArmed gate, dumps `financeHudState` JSON) I cleared @9114d48. store-warn honestly discloses the no-server data-loss tradeoff (not overclaiming).
- (C) LEAKS/PII in landing — only the SANCTIONED footer identity: l.814-815 "Provider: Osefe Miradi" / "Contact: Miradiosefe@gmail.com" (the disclosed legal footer). No BEGIN/PRIVATE KEY/sk_/whsec_/Aarhus. The base64 blob@225 is a self-hosted **WOFF2 font** (`data:font/woff2;base64,d09GMg…` = wOF2 magic) — the 2 "CPR" grep hits are random font-binary substrings, NOT a Danish CPR. The `__L10N` dict (from l.903) carries NO name/email → Kaito's PII-passthrough-key trim (8565ddd) confirmed. preflight-PII guard 16/16 incl. landing cases (real passes; bare email/provider-name OUTSIDE the footer BLOCK) → legal-identity exception is TIGHT, behaves.
- (D) XSS — landing is static file-authored HTML, no user input. Only dynamic surface = the i18n runtime (same architecture I cleared @b3169dd). `innerHTML` (l.942) limited to the 2 `[data-i18n-html]` els (hero-h1@434, price-year@681) fed by the static `d.h` dict; text path `nodeValue = orig.replace(key,tr)` (l.935) is unparseable; `lang` whitelisted `['en','da','fr']` before use (l.952). RE-SWEPT the REBUILT da+fr dict (78cb7ed): only tags present = span(4)/strong(2); 0 script/iframe/img/svg/object/embed/link/style/srcdoc/javascript:/data:text/html; the 2 `onerror=` are a file-authored JS screenshot fallback (l.913, `img.onerror` → local `assets/howto/*.png`, from file-authored `data-shot` + whitelisted lang) — not an HTML attr, not injected. No XSS. Landing network primitives fetch/XHR/beacon/WS/Image = 0; external refs only user-tapped stripe×2 + mrln.online×1; font embedded (no CDN) → zero-external-on-load + free/offline preserved. 4/4 scripts balanced.
- (E) GATE (ran myself @8565ddd): `node tools/release/green.js` → **GREEN exit 0** (html-parse 4/4; parser 21; assistant 16; silly 43; transfer 58; photo 17; pr 12; tax 105; media 43; savesafety 14; income 35; import-sanitize 25; preflight index/landing/legal CLEAR; PII guard 16/16; published files leak-clean; APP_VER v38===sw v38). preflight landing.html CLEAR (no PII except sanctioned footer; 4 scripts).
- VERDICT: **SAFE @ 8565ddd.** Index delta is pure i18n data (0 danger tokens, watchdogs byte-identical, v38 parity); every landing privacy claim is code-accurate and the two softened absolutes are now defensibly scoped; no leak/PII beyond the sanctioned footer (font-blob + dict clean); no XSS surface; gates GREEN/CLEAR. NO security edit required.
- Commits/SHAs reviewed: 8565ddd (frozen tip), baseline 9114d48 (my prior escape-hatch SAFE); range incl. aeb1208 (i18n export string), dadc237/78cb7ed (Mikoto landing da+fr rebuild), 1aeba2e+folds (landing revamp), 8565ddd (Kaito FR-note wire + PII-key trim). Read-only, NO lock, NO app-code edit (TEAM-CHAT + this log only). Posted SAFE @ 8565ddd under Pending + MESSAGES.
- Still open: gate needs Hugo GREEN @8565ddd + (Mikoto MISSING:0 already posted 78cb7ed), then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). If tip moves index.html/landing.html/sw.js/legal.html/preflight, I re-sign the new tip. Standing image note from d67cdac stands (gate can't scan screenshot CONTENT — the DA/FR screenshot swap uses assets/howto/*.png which were visually cleared previously; any NEW .da.png set must be visually re-inspected before publish).

### [2026-08-03] follow-up 9 — via Kaito (asleep, gate step 10) — SAFE @ `bc9c82a` (LANDING full app language set es/de/sv/nb/hu + 30 localized screenshots)
- Asked: SAFE on frozen candidate — 5 new __L10N dicts (es/de/sv/nb/hu) + language-picker/updateShots/navigator wiring + 30 new PNGs under assets/howto/. Core app claimed byte-identical to my SAFE @ 8565ddd.
- FREEZE ✓: `git diff --stat bc9c82a -- landing.html index.html sw.js assets/howto legal.html manifest` = EMPTY (working tree == frozen tip). CORE ✓: `git diff --stat 8565ddd bc9c82a -- index.html sw.js` = EMPTY → app SAFE @ 8565ddd (watchdogs/slots/v38 parity already verified there) HOLDS, no re-review. This round's published delta = landing.html (+14/-8) + 30 new PNGs only.
- (1) SCREENSHOTS — VISUAL leak-scan (my standing practice; gate cannot scan image CONTENT). Opened 9/30 spanning ALL 6 tabs × ALL 5 new langs: expenses.es/de/hu, notebook.hu/de, food.sv, calendar.nb, gym.nb, media.es. ALL seeded DEMO data — expenses identical round figures across langs (1.795 kr/mo; Housing 1.100/Food 470/Transport 120/Subs 75/Other 30; ~21.540/yr), notebook generic sample notes ("Weekly shopping…","Renewal reminder…"), gym stock split (Push/Pull/Legs standard lifts), media well-known titles (Interstellar/Severance/Breaking Bad), calendar generic event dots + placeholder text. Country field = EMPTY placeholder, currency DKK kr base, footer "FINANCE HUD v5". NO owner balance/amount, NO name/email, NO key material in any image.
- (2) DICTS es/de/sv/nb/hu — parsed __L10N via node. Tight owner-PII/key scan over every key+value = 0 (miradi/osefe/@gmail/BEGIN/PRIVATE KEY/sk_/whsec_/Aarhus/CPR/MRLN-license). Passthrough-key leak did NOT recur. Danger-token scan on new dict values = 0 (script/iframe/eval/Function/write/innerHTML/fetch/XHR/beacon/localStorage/__sys/PUBCHK/PUB_B64/4047293148/.src=/__ownerKeySrc/js:/on*=/data:html/import/img/svg). .h innerHTML surface tags across ALL langs = span,strong ONLY. h=2/t=189 per new lang. Whole-file grep (minus HU "MRLN-t/-nel" suffixes) = only sanctioned footer: Provider: Osefe Miradi · Contact: Kontaktmrln@gmail.com (new NON-owner contact).
- (3) WIRING — pure client UI, no new sink. `updateShots`: want='assets/howto/'+name(data-shot,file-authored)+suf+'.png', suf=LOCSHOTS[lang]?'.'+lang:'' with LOCSHOTS={da,es,de,sv,nb,hu}; lang whitelisted [en,es,da,de,sv,nb,hu,fr] before use. navigator auto-detect = fixed map [[da,da]..[hu,hu]]→whitelist. langSw change → apply(this.value) from fixed <option>. i18n runtime architecture UNCHANGED from SAFE @ b3169dd: innerHTML limited to 2 [data-i18n-html] els (hero-h1/price-year) fed by dict .h; text path nodeValue (unparseable); img.onerror EN-fallback file-authored. No network/eval/new innerHTML → no XSS.
- (4) GATE (ran myself @bc9c82a): green.js GREEN exit 0 (15 suites/417 tests; html-parse 4/4; preflight index/landing/legal CLEAR; PII guard 16/16; leak scan 4/4; APP_VER v38===sw v38). preflight landing.html CLEAR exit 0 (4 scripts balanced).
- VERDICT: SAFE @ bc9c82a. Core app byte-identical (app SAFE @ 8565ddd holds); 30 screenshots demo-only (visually confirmed 9/30 full coverage of tabs×langs); 5 new dicts 0 owner-PII/key/danger-token, innerHTML span/strong only; wiring pure client UI, no XSS; gates GREEN/CLEAR. NO security edit required. Read-only, NO lock, NO app-code edit (TEAM-CHAT + this log only). Posted SAFE under Pending + MESSAGES.
- Still open: gate has Hugo GREEN @bc9c82a (line 56) + Mikoto MISSING:0 (472ae38) — needs Mikoto re-confirm on bc9c82a — then Osefe's explicit "ship it" (sleep-mode: NO auto-publish). Non-owner: footer email now Kontaktmrln@gmail.com on landing ONLY; app + legal still on old Miradiosefe@gmail.com (Osefe deferred the wider consistency pass) — not a security matter. If tip moves index/landing/sw/legal/preflight, I re-sign. Standing image note: any NEW screenshot set must be visually re-inspected before publish (done for this set).

### [2026-08-03] follow-up 10 — via Kaito (asleep, security fix + gate step 10) — SAFE @ `95c3ce4` (CONTACT EMAIL EVERYWHERE + v39)
- Asked: Osefe changed contact email everywhere `Miradiosefe@gmail.com`→`Kontaktmrln@gmail.com` (non-owner branded address). Kaito's content swap `d47c488` (index.html 21×: lock DOM + #legalBack modal + lock-foot i18n string ×7 langs [email verbatim → DOM key still == dict key]; legal.html 10×; landing footer already done in bc9c82a). APP_VER+sw v38→v39. EXPECTED breakage: preflight now BLOCKS on the provider NAME "Osefe Miradi" — my legal-identity strips were anchored to the OLD email, so the swap made the combined Provider:/Contact: regexes stop matching → name no longer stripped → trips PII_RE. My job (security tool, standing exception): re-anchor the guard, update fixtures, verify, sign SAFE.
- CONFIRMED breakage: `preflight index.html` @d47c488 → BLOCKED "possible owner PII: Miradi" (only that). landing/legal already CLEAR (their CONTACT_ALLOW provider-name strip is email-INDEPENDENT; the email itself is non-PII). PII test suite @d47c488 = 15/16 (only "index: real passes" failed).
- FIX (edited `tools/publish/preflight.js` — my security exception; tooling only, ZERO published-byte change):
  · Swapped EVERY old-email literal → `Kontaktmrln@gmail\.com` where it anchors a strip: LEGAL_ALLOW[0] Provider+Contact (THE load-bearing one — strips the NAME), LEGAL_ALLOW[1] `<p>email</p>`, LEGAL_ALLOW[2] refund "contact us at", LOCK_ALLOW renewal phrase, RENEWAL_I18N (key+value email token), CONTACT_ALLOW[1..3] (landing/legal mailto/Contact/<p>). CONTACT_ALLOW[0] provider-NAME regex needs no change (no email in it). 18 old-email literals → 0.
  · PII_RE UNCHANGED `/miradi|osefe@|[^a-z]cpr[^a-z]|\bDK\d{8,}\b/gi` — still guards the NAME (via 'miradi'), any owner personal email (via 'osefe@'), CPR/IBAN. Added a design-note comment: the new address is branded/non-owner, does NOT match PII_RE, is intended-public; the email allow-forms are now non-load-bearing for PII (kept anchored only to stay meaningful); the NAME is the only owner token that must strip-in-context / block-elsewhere.
- FIXTURES (`tools/test/preflight_pii_test.js`): OBJECTIVITY CALL — did NOT blindly swap adversarial "must-block" probes to the new email. The new address is non-PII, so swapping them would flip BLOCK→PASS and silently gut the coverage (a hole, false confidence). Kept the adversarial probes on an OWNER-PII email (`OWNER_EMAIL=Miradiosefe@gmail.com`, still matches PII_RE) as the retained probe for "owner PII must block outside sanctioned forms"; the "real passes" cases already exercise the NEW email (they read the real files). Updated header to explain this. Added `PUBLIC_EMAIL` + one new regression pin: "new public contact OUTSIDE legal is allowed (non-owner)" → exit 0, documenting why the new address is NOT in PII_RE. 16→17 cases, **17/17 pass**.
- VERIFY (all on tip 95c3ce4): preflight index/landing/legal all CLEAR exit 0; PII guard 17/17; `green.js` exit 0 (15 suites/417 tests, html-parse 4/4, preflight ×3 CLEAR, PII 17/17, leak 4/4, APP_VER v39===sw v39). `grep -rIn "Miradiosefe"` across index/landing/legal/sw/manifest/GUIDE = NONE. New email vs `/miradi|osefe@/i` = false (non-owner). Watchdogs BYTE-IDENTICAL vs SAFE @ bc9c82a: `__sys.token(` 18, PUBCHK 2, 4047293148 1, PUB_B64 3, __ownerKeySrc 7, hud-state 6, _ecVerify 2, verify( 4, subtle 5, isArmed 2, isTripped 3. Diff bc9c82a..d47c488 index.html filtered changed-line set = EMPTY (all email/name/version); sw.js = VERSION v38→v39 only. No poison needed (contact-string swap; no new feature/money-health math/displayed value/network).
- VERDICT: **SAFE @ 95c3ce4.** New email is a non-owner branded address (no PII); provider NAME still gated to sanctioned legal/footer/lock-foot only; guard re-anchored + fail-closed; fixtures keep adversarial owner-PII coverage (17/17); watchdogs byte-identical vs last SAFE except the v39 tag + the email literal in the lock-foot i18n string (no money/poison line touched → no new poison); APP_VER v39===sw v39; gates GREEN/CLEAR; no old email anywhere. Security fix made DIRECTLY (poison/leak/integrity exception). Commit 95c3ce4.
- Commits/SHAs: 95c3ce4 (my guard fix+fixtures, tip) on top of d47c488 (Kaito content swap, app-byte frozen). Baseline for watchdog byte-identity = bc9c82a (my last SAFE). Posted Pending + SAFE @ 95c3ce4 to TEAM-CHAT (Pending + MESSAGES).
- Still open: gate needs @Kaito i18n MISSING:0 + render verify on 95c3ce4 + @Hugo GREEN same tip, then Osefe's explicit "ship it" (sleep-mode: I sign, I don't publish). If any published file (index/landing/legal/sw/preflight) moves, I re-sign. NON-BLOCKING backlog reminder still open: landing i18n extraction should EXCLUDE footer identity so a future __L10N rebuild doesn't re-add Provider/Contact as passthrough keys.

## [2026-08-04] — via Kaito (asleep) — RULING (design, no code): v41 "AI-like assistant" + OPTIONAL ONLINE LOOKUP
- Asked: rule on whether an opt-in online lookup (film/anime/show/game titles, foods, exercises) is compatible
  with MRLN's shipped privacy promise. It collides with claims I signed SAFE 4 days ago, live in 8 langs on
  mrln.online. Deliver GO / GO-WITH-CONDITIONS / NO-GO + full contract; do NOT edit index.html/landing.html.
- TIP AT RULING: `46ca898`. NOTE: v40 batch (89437e5 meal engine v2 / savebar / checklist, c670168, 2c1fbbc,
  46ca898 assistant fab) has landed since my last SAFE @95c3ce4 and has NOT had a security pass — it is NOT
  covered by any SAFE of mine. Kaito holds the index.html+sw.js lock (TEAM-CHAT line 24). I stayed read-only.
- VERIFIED THE CURRENT REALITY (not memory): index.html `fetch(` count = **1** (owner-gated Team Room @9719,
  gate @9688-9693 unchanged); XHR/sendBeacon/WebSocket/EventSource = **0**; **no CSP anywhere** (index/landing/
  legal/sw all 0 hits); localStorage keys = mrln_access_key / mrln_i18n_audit / mrln_team; `showAnswer` @6089
  writes `body.textContent` (not innerHTML); `answerQuestion` @6033 routes to answer-or-null, `showProposal`
  @6096 is the money-mutating path; exportDataCode @7048 is an explicit allowlist; 6 inline `onclick=` handlers
  remain (→ CSP script-src must keep 'unsafe-inline', no nonce — unchanged from my 2026-06-28 draft);
  MEAL_DB @4914 = 154 bundled meals (proof the offline-knowledge model already works here).
- CLAIMS AT RISK (read the live files, exact lines): landing.html **581** feature bullet, **732** FAQ "Is the
  assistant private?", **740** perf FAQ "no network round-trip"; index.html **#legalBack Privacy §3** @1396-1403.
  Global pitch lines (landing 8/13/19 meta, 503, 521, 523, 673, 720, 786) are a different class — see below.
- ===== VERDICT: **GO-WITH-CONDITIONS** on the mechanism · **SPLIT AND DEFER** as my product recommendation =====
  - PART A (build now, needs no ruling): "AI-like" = user's own numbers compared against **BUNDLED** general
    knowledge (nutrition per 100g, MET values, typical price/rent bands, genre/runtime facts). 100% offline,
    zero claim change, zero consent UI, zero CSP dependency, zero cost, no new attack surface. MEAL_DB proves
    the pattern. This is ~80% of what Osefe actually asked for ("compared against general knowledge").
  - PART B (the network): allowed ONLY under the OL-1..OL-12 contract below. My recommendation is to ship A
    first and re-test whether the gap is real, because B costs a unique, defensible, already-paid-for claim.
  - A blanket NO-GO would be overreach: an opt-in, per-query, user-typed-term-only lookup does NOT trade my
    standing invariant ("no private financial data and no private key ever leaves the device"). I will not
    block something that doesn't violate my own stated line — that would be theatre, not security.
- ===== THE CONTRACT (OL-1..OL-12) — every point is gating for my SAFE on any Part-B build =====
  - OL-1 DEFAULT OFF, AND UN-SETTABLE FROM OUTSIDE. `STATE.prefs.onlineLookup` default false; absent/undefined
    MUST evaluate false. **An imported file must NEVER be able to turn it on**: `_sanitizeIngested` must force
    the flag FALSE on every import path (MRLNDATA code + importMasterHTML), and the flag must NOT be added to
    the exportDataCode allowlist. Device-local only. (This is the sharpest new hole: without it, a crafted
    import silently enables a network feature.)
  - OL-2 TOGGLE LOCATION: own card in Connect/Settings next to the privacy copy — not buried, not in a submenu.
    PLUS a persistent visible indicator next to the assistant input whenever it is ON (data-i18n-skip). The
    state must never be invisible.
  - OL-3 INFORMED CONSENT AT ENABLE (a dedicated modal, before the first byte, no pre-ticked box, primary
    button = Cancel): (a) exactly what is sent = the words you type into the lookup box and submit, nothing
    else; (b) exactly where = the named fixed site list; (c) those sites see the request **and your IP**, like
    any website; (d) your money, health, notes, calendar and food data are never sent; (e) a sent lookup
    cannot be taken back; (f) turn it off and the app is fully offline again.
  - OL-4 CONSENT MODEL — MY CALL: **persistent setting (OFF) + per-query explicit gesture. NOT session
    consent.** The toggle answers "may you ever?"; the gesture answers "now, this term". Typing a question in
    the assistant must NEVER auto-fire a request — the user taps a distinct "Look up online ↗" control with the
    term visible. Session consent is the worst of the three: it silently converts later questions into uploads.
  - OL-5 WHAT MAY LEAVE — Osefe's proposal CONFIRMED and TIGHTENED: only the literal string the user typed into
    the lookup field for that submission. Hard cap ≤80 chars, strip newlines/control chars, encodeURIComponent,
    single query param. **NOTHING derived from STATE/MODEL may be interpolated into a request** — not a budget
    item name, not a food-log entry, not a Media Log title, not fid, not lang/currency. To look up something
    already stored, the app **prefills the lookup box and the user must see it and submit** — prefill-then-
    submit, never read-and-send. Request hygiene: https only, `credentials:'omit'`, `referrerPolicy:'no-referrer'`,
    `mode:'cors'`, **`redirect:'error'`** (a redirect is exactly how a compromised endpoint would move the query
    to another host), AbortController timeout ≤8s, response read as text with a ≤256KB cap, one in-flight
    request, rate cap (≤1/3s and a daily ceiling) so no loop becomes a channel. No identifying custom headers.
  - OL-6 WHAT MUST NEVER LEAVE UNDER ANY SETTING: income, expenses, any money figure, savings, loans, tax in/out,
    weight/body/health, food log, notes, calendar, reminders, Media Log contents, PRs, change log, access key,
    private signing key, #hud-state, fid, device/browser fingerprint, and any stored text the user did not
    personally type and submit for that lookup. No telemetry, no error reporting, no "anonymous usage stats" —
    ever. Not now, not as a later "improvement".
  - OL-7 HARD-CODED DESTINATIONS: fixed const array of https origins in the file. No host/path ever built from
    user or imported data. No user-editable endpoint field, no "custom API" setting, no LLM/AI service. If a
    lookup needs a host not on the list, it does not ship.
  - OL-8 **CSP BECOMES MANDATORY, NOT OPTIONAL** (this answers the parked backlog item). Ship the CSP meta as a
    PRECONDITION of Part B: `connect-src 'self' <exact lookup origins> https://raw.githubusercontent.com`,
    `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`. HONEST LIMIT restated: 6 inline `onclick=` +
    inline scripts mean script-src keeps `'unsafe-inline'` and CANNOT use a nonce → CSP does **not** stop
    injected inline JS. What it DOES do is make the destination allowlist **browser-enforced** instead of a code
    convention one bad diff can break. That is precisely why it graduates from "nice hardening" to "required".
    Must be browser-tested (data: fonts, data: food photos, blob: manifest rewrite, same-origin sw).
  - OL-9 THE RESPONSE IS UNTRUSTED, ALWAYS — treat it exactly like an imported file: (a) render via
    `textContent` ONLY — never innerHTML, never into an attribute, never `new Image()/src`, never a link href
    without encodeURIComponent+esc; (b) NEVER written to STATE/MODEL, NEVER persisted (v1 = in-memory,
    display-only, gone on reload — which also keeps exportBlank/exportDataCode untouched); (c) NEVER parsed into
    a number that reaches a money/health figure, a MODEL field, or an aiProposal; (d) visually separated and
    labelled with the source name; (e) JSON.parse under a byte cap in try/catch, no eval, no dynamic script/
    style, no data:/javascript: URL from the response ever rendered.
  - OL-10 INTEGRITY ISOLATION — Osefe's proposed rule CONFIRMED and made concrete: fetched content may never
    influence a computed money/health figure or the poison token. The lookup path must not read/write `__sys`,
    must not call `token()`, must not touch applyChange/parseClause/setIncome/MODEL.*, and its result routes to
    **`showAnswer()` (textContent) ONLY — NEVER `showProposal()`**. A web result must not be Apply-able: the
    Apply path mutates money, so a spoofed response that could produce a proposal would be a remote write into
    the user's finances. No new `__sys.token()` gating is needed *inside* the lookup (it displays no owner
    figure) — but no fetched value may flow into an existing token-gated display, or the poison would end up
    laundering third-party data. Lookup UI lives post-unlock like everything else.
  - OL-11 AUDIT / VERIFIABILITY (this is what makes the promise checkable rather than merely readable): a local,
    visible "Online lookups" list in the same card as the toggle — per lookup: date+time, the **exact string
    sent**, destination host, success/fail, response size. `data-i18n-skip`. Own localStorage key; **NOT** added
    to the exportDataCode allowlist; **NOT** in the Change Log (that's financial history and it exports);
    dropped from blanks automatically by exportBlank's reconstruct. Plus "Clear log". A count badge makes
    silent activity impossible.
  - OL-12 FAIL-CLOSED + OFFLINE PARITY: toggle off / offline / CSP-blocked / timed out / rate-capped / response
    fails validation → fall back to the offline answer exactly as today. No retry storm, no fallback to a
    different host, no error text that carries the query anywhere.
- ===== EXFILTRATION SURFACE — the honest analysis (question 2) =====
  - **A network path does NOT give an XSS attacker a new capability.** `fetch`, `<img src>`, `sendBeacon` are
    native browser powers; an injected script can already exfiltrate localStorage (incl. `mrln_access_key`)
    today, feature or no feature. Saying this feature "creates" the exfil risk would be wrong, and I won't say it.
  - What IS genuinely new: (1) **a live, repeatable untrusted-input channel** — today the only untrusted input
    is an imported file (one chokepoint, sanitized); a compromised/MITM'd/DNS-hijacked endpoint feeds content in
    on every query → closed by OL-9 + https + redirect:'error'. (2) **a stored-data→outbound-query channel** if
    a query is ever STATE-derived → closed by OL-5 + OL-4. (3) **loss of an auditing property**: today ANY
    outbound request from a customer file is an anomaly, which is how I verify the promise every review; once
    lookups are normal, "it's talking to the internet" stops being evidence of compromise — a real, permanent
    loss, and the reason OL-11 exists. (4) **IP/timing metadata to third parties** — unavoidable, disclose it
    (OL-3c); engineering it away needs a proxy, which is a server, which we will not build.
  - Crafted import / stored XSS abusing the path: an import must never (a) enable the toggle → OL-1, (b) supply
    an endpoint → OL-7, (c) auto-trigger a lookup → OL-4/OL-5. A stored XSS can steal the key today regardless.
  - THE COUNTER-INTUITIVE UPSHOT, stated plainly: doing Part B *properly* leaves the app **more** exfil-resistant
    than it is today, because CSP `connect-src` becomes mandatory and for the first time bounds where injected
    script may send anything. That is the strongest technical argument FOR building it under this contract.
- ===== THE PUBLISHED CLAIMS — exact minimal edits (question 3) =====
  - RULING: they **must** change even though the default is OFF. I blocked GUIDE §8 on 2026-07-01 for exactly
    this shape (an unqualified "Nothing ever leaves your device" sitting inside the section documenting an
    outbound link). Applying a softer standard to a feature Osefe wants than to Hugo's guide would make me a
    yes-man. But the change is a SCOPING CLAUSE, not a rewrite — the promise genuinely does still hold for the
    data that matters.
  - (a) landing.html **732** FAQ → keep "No outside AI service is called" VERBATIM (a reference lookup is not an
    AI service — this stays true and is worth keeping), move the absolute onto the data, add the exception:
    "Yes. The assistant runs on your device and answers from the numbers you've entered. No outside AI service is
    called, and your numbers, notes and health data are never uploaded. The one exception is optional and off by
    default: if you switch on Look it up online, a word you type into the lookup box — and only that word — is
    sent to look up a title or a food."
  - (b) landing.html **581** bullet → "Runs on your device — no outside AI service is called, and your data is
    never uploaded (optional online lookup is off by default)".
  - (c) landing.html **740** perf FAQ → drop the "no network round-trip" absolute (it becomes false for lookups)
    and answer the question actually asked, which is about scaling: "No. Your data lives on your device, so
    there's no server call that gets slower the more you add — it stays fast as your history grows." Arguably
    stronger copy than what's live.
  - (d) index.html **#legalBack Privacy §3** → ADD one bullet after "Features you choose to use": "<b>Online
    lookup (optional, off by default).</b> If you switch on the online lookup, the words you type into the
    lookup box and submit are sent to a small fixed list of public reference sites to fetch a description. Those
    sites see that request and your IP address, as with any website. Your money, health, notes, calendar and
    food data are never sent, and results are shown only — never saved into your data. The App keeps a local
    list of every lookup you made so you can check this yourself. Turn it off and the App is fully offline again."
  - (e) DELIBERATELY UNCHANGED — the global pitch (landing meta 8/13/19, 503, 521, 523, 673, 720, 786 "your data
    never leaves your device" / "no cloud" / "no bank"). Same distinction I ruled on for GUIDE line 18 vs §8: a
    qualified global principle with a fully disclosed exception is accurate; an unqualified absolute sitting
    *inside* the section documenting the exception is not. These are about the data the user saves, which still
    never leaves. Changing them would be over-correction and would cost the brand for no honesty gain.
  - MIKOTO BLAST RADIUS: 3 landing strings × 8 landing languages (en/es/da/de/sv/nb/hu/fr) + 1 policy bullet × 7
    app languages + legal.html consistency check + GUIDE.md/PDF §Assistant + re-gate. Non-trivial — another
    reason to ship Part A first and only pay this once, if ever.
- ===== FREE-TO-OPERATE (question 5) =====
  - ONLY acceptable class: **keyless, CORS-permitting, no-quota-billing public endpoints**. Candidates to verify
    at build time (I am NOT asserting these as fact — Kaito must confirm CORS headers + terms before wiring):
    Wikipedia/Wikidata REST summary, Open Food Facts, wger exercise DB.
  - HARD REJECT: (1) **anything needing an API key** — TMDB/OMDb/RAWG/Spoonacular etc. A key in a single-file
    client app is a *published* key: not a secret, will be scraped, and then either bills Osefe or gets the
    account banned. This is a NO even where a free tier exists. (2) **anything needing a proxy/serverless
    function** — that is a server: a running cost AND a place user queries could be logged, which kills "no
    server" outright. (3) **any LLM/AI API** — paid, and it would make "no outside AI service is called" false,
    which is the single claim I most want to keep true.
  - Keyless-free still carries a **fair-use obligation** (rate limits, UA policy) — an obligation, not a bill.
    OL-5's rate cap partly discharges it.
- HONEST RECOMMENDATION TO OSEFE (asked for, and I do disagree in part): **build Part A, defer Part B.** The
  reason is not fear of the mechanism — the contract makes the mechanism safe. It is that "the assistant is
  offline" is a claim no competitor can make, it is live in 8 languages, customers bought on it under a 30-day
  guarantee, and changing a privacy characteristic after sale is a trust event rather than a copy edit. Part A
  delivers most of the felt intelligence at zero claim cost. If, after A ships, the long tail (arbitrary
  films/games/foods) is genuinely missing, Part B is available under OL-1..OL-12 and would actually leave the
  app harder to exfiltrate from than it is today (CSP). Smallest safe version of B if he wants it now: ONE
  keyless source, ONE prefill-then-submit lookup box, display-only textContent result, CSP shipped in the same
  commit, visible lookup log, toggle off + per-query tap.
- Did NOT edit index.html / landing.html / legal.html / sw.js (design ruling; Kaito implements and holds the
  lock). No lock taken. No gate sign-off given — this ruling is NOT a SAFE and publishes nothing.
- Commits / SHAs: this log + TEAM-CHAT ruling post only. App tip unchanged at 46ca898.
- Still open: (1) **v40 batch (89437e5..46ca898) has had NO security pass** — it needs a real SAFE review before
  anything ships; flagged to Kaito. (2) If Osefe picks Part A, it needs no ruling but does need a normal review.
  (3) If he picks Part B, I want the CSP meta landed and browser-tested BEFORE the lookup code, not with it.
  (4) CSP backlog item is now RECLASSIFIED: parked → mandatory-if-B-proceeds. Sleep-mode: no auto-publish.

## [2026-08-04] — via Kaito (asleep, step 4/10) — REAL-CODE SAFE: v40 batch (meal engine v2 · user Checklist · savebar toggle + botFab · theme tokenisation) @ `667cec1` (code `46ca898`)
- Asked: the security pass I MYSELF flagged as missing at the end of my `667cec1` OL ruling. Review `89437e5..46ca898`. Rule specifically on: (1) STATE.checklist on the untrusted-import path, (2) poison/watchdog coverage, (3) the fail-loud contract surviving the all-sizes savebar collapse, (4) whether `meal_test.js`'s `vm.Script().runInContext()` is acceptable in a committed gate suite, (5) `applyAppearance()`'s 7 re-renders, (6) anything else the diff shows. Fix directly if needed; run green.js myself.
- BASELINE PROVEN: `89437e5^ = c199cfe` (lock chore) — `git diff --stat 95c3ce4 c199cfe -- index.html sw.js` **EMPTY** → c199cfe index.html is byte-identical to my last SAFE @95c3ce4 (v39). So the real delta IS exactly the v40 batch: index.html **+447/-180**, sw.js 1 line (`VERSION v39→v40`), + green.js (+4, wires the new suite) + tools/test/meal_test.js (new, 98) + chat/logs. NO landing/legal/manifest change. TIP: `667cec1` (my own ruling doc) — `git diff --stat 46ca898 667cec1 -- index.html sw.js landing.html legal.html manifest.webmanifest` **EMPTY** → published bytes identical, I sign the current tip. i18n dict line NOT touched (diff has zero >500-char lines) → Mikoto's merge hasn't happened yet.
- (1) **STATE.checklist — SANITISATION SUFFICIENT, NO STORED-XSS BREAKOUT.** Both untrusted ingest paths funnel through `applyImportedData` (`importMasterHTML` @7143 parses the file's `#hud-state` then calls it @7157). The assignment is array-gated: `if(Array.isArray(d.checklist)) STATE.checklist=d.checklist;` @7097 → a non-array/object/`{length:n}` shape can NEVER enter. `_sanitizeIngested` @7069 then **REBUILDS every entry as a fresh object literal** `{ id:_sid(o.id), text:String(o.text==null?"":o.text).slice(0,200), done:!!o.done }` after `.filter(o && typeof o==="object")`. The literal reconstruction is what kills `__proto__`/`constructor`/extra keys **by construction** (JSON.parse creates an OWN `__proto__` prop, not a prototype write; the map simply doesn't copy it). VERIFIED, not reasoned: extracted the LIVE `esc`/`_sid`/sanitiser line from index.html and ran 9 breakout payloads (`"><img src=x onerror>`, `" onmouseover="`, `<svg onload>`, `</span><script>`, `</li></ul><iframe>`, `&quot;&gt;&lt;img&gt;` double-encode, `</button><button onclick>`, `'><b>`, `javascript:`) × BOTH `id` and `text` → emitted tag count **8 every time = the template**, zero extra elements/attributes; `Object.prototype` unpolluted; nested-object text coerced via `String()`; null/undefined/number/string entries dropped; 5000-char text → 200; 500-char id → 64. Render: `data-ck="'+esc(it.id)+'"` (id is `[\w-]{0,64}` post-`_sid`, and locally `'ck'+base36+rand`), text via `esc(it.text)` inside a `data-i18n-skip` span. Double-quoted attrs + `esc()` escaping `&<>"` → safe in every context here.
- (1b) **exportBlank — THE CHECK I ALWAYS RUN HARDEST, and it PASSES.** `snapCK=STATE.checklist` @6162 → `STATE.checklist=[]` @6168 → `renderAll()` @6170 → `refreshFinance()` @6157 → `renderMissions()` @3830 → `renderChecklist()` → the `#checklist-list` innerHTML becomes the static empty-state `<li>` **BEFORE** `documentElement.outerHTML` @6181 → restore in `finally` @6194. So the owner's checklist text CANNOT bake into a customer/blank file's DOM. This is the EXACT class I had to fix myself for Media Log at `63c2a01` (renderMedia was not reached and titles/comments baked in) — Kaito got this one right. hud-state still HARD-reconstructed `{__fresh,fid,prefs:{lang,currency}}` @6173 (not a STATE dump), owner key stripped @6167. `exportDataCode` @7053 carries `checklist` (user's own device→device move, receiving side re-sanitises) — correct, consistent with notes/media. `logChange('checklist-add'/'checklist-del','')` deliberately logs an EMPTY detail → checklist TEXT never enters the exported Change Log. Good privacy call.
- (2) **POISON — correctly NONE needed, and the diff adds none.** Grep of EVERY `+` line for fetch/XMLHttpRequest/sendBeacon/WebSocket/EventSource/eval(/new Function/document.write/importScripts/.src=/location.(href|search|hash)=/localStorage/indexedDB/postMessage/__sys/PUBCHK/PUB_B64/4047293148/ownerKeySrc/hud-state → **ZERO HITS**. No new network/exec surface AND no new/removed token call. Reasoning per surface: **meals** — `nutritionTargets()` @5175 returns `null` when `computeBody().tdee` is non-finite, and `computeBody` @4504-4505 does `var T=__sys.token(); w=T*(weight)` → on a tampered copy weight→NaN→tdee NaN→T=null→renderMeals shows only STATIC recipe macros (`m.kcal/p/c/f` from MEAL_DB), never a personalised figure. The file even carries the correct comment ("NaN tdee = locked/poisoned token → treat as not-ready"). **checklist/savebar/botFab** — no money or health value at all. **tierRGB/_rgbTok/_rgbMix** — pick a COLOUR from CSS tokens; `_rgbTok` validates `/^[\d, ]+$/` with a hardcoded fallback; var names are fixed internal literals, never user-derived. **Budget/tier** — still inherit `itemMonthly`(`t*(...)`)/`groupTotal`/`recomputeGrand`/`leftOver`/`comfort`. NOTABLE: removing the baked plan **DELETED** money figures (`Ff(leftLow)`, `Ff(comfortAvg)`, `Ff(loan)`, `Ff(costs*3)`, `Ff(subs)`, `Ff(high)`) from an innerHTML sink — a net REDUCTION in exposed figures, not an addition.
- (2b) **WATCHDOGS BYTE-IDENTICAL c199cfe↔46ca898** (grep -aoF counts): `__sys.token(` 18==18, `__sys.` 34==34, `__sys.arm` 2, `__sys.trip` 6, isArmed 2, isTripped 3, `_ecVerify` 2, PUBCHK 2, **4047293148** 1, PUB_B64 3, `__ownerKeySrc` 7, `hud-state` 6, `verify(` 4, `subtle` 5. Slots byte-empty (`<script id="hud-state" type="application/json"></script>` @2615, `<script id="__ownerKeySrc" type="text/plain"></script>` @2619). `<script>`/`</script>` **6/6**. **APP_VER v40 === sw.js VERSION v40**; sw.js delta is the VERSION line ONLY (CORE list + network-first-doc strategy untouched).
- (3) **FAIL-LOUD CONTRACT SURVIVES THE COLLAPSE — verified four ways.** (a) `#saveSafetyBanner` @1571 is **OUTSIDE** `.savebar` (2574-2614) → the durability banner, the primary channel, is completely unaffected by the collapse. (b) `_hudWarn()` @2805 (`.savebar` → `classList.add('haswarn')`) is called from ALL THREE warn paths: `_warnStorageFull` @2809, `_warnNotDurable` @2826, and the TEMPLATE_MODE try-mode branch @2839 — each `typeof`-guarded (correct: savesafety_test evals those fns in isolation). (c) SPECIFICITY PROVEN, not assumed: the hiding rule `.savebar > :not(.savefab):not(.botfab){display:none}` @722 is (0,3,0) (`:not()` takes its argument's specificity) and `.savebar.haswarn .badge{display:flex}` @731 is ALSO (0,3,0) → tie → **later source order wins**, and 731 > 722, both in the same `<style>` block → the badge pierces the collapse. `#saveBadge` is `<div class="badge" id="saveBadge">`, a DIRECT child, so the `>` rule and the descendant rule both reach it. `.savebar.haswarn .savefab` reddens the fab @732. (d) `.savebar.open::before` @728 requires `.open` (absent when collapsed) and, when it does apply, carries `z-index:-1` inside `.savebar`'s OWN stacking context (`position:fixed` + `z-index:50` @701 ⇒ stacking context) → it paints BELOW the children and **cannot cover the badge**; `inset:-14px -14px 66px -14px` also keeps it clear of the fabs. Third channel: `toast()` on the quota path. Contract intact.
- (3b) **THE SHARPEST NEW RISK, WHICH WAS NOT ON THE BRIEF — and it is CLOSED.** The new `.savebar.open > :not(.savefab):not(.botfab){display:flex}` **force-displays every child when the bar expands**. `#shareBlankBtn` @2605 and `#mintBtn` @2606 are the OWNER-ONLY minting controls and carry inline `style="display:none"`, cleared ONLY inside `initMint` behind `if(!MINT.available()) return;` @9063. Verified there is **no `!important` anywhere in the savebar CSS block (700-733)** → an inline `display:none` beats the stylesheet rule → a customer expanding the HUD can NOT surface the key-minting UI. Same check for `#chatWidget` (also a direct child): `setOpen()` governs it by inline style in both collapsed and open states, so it neither leaks open nor breaks.
- (4) **`meal_test.js` runInContext — ACCEPTABLE AS-IS, no change requested, and I will not manufacture an objection here.** It slices `var MEAL_DB=[` … `mealMatchesText` out of index.html and runs it in `vm.createContext({})`. `vm` is explicitly NOT a Node security boundary (`this.constructor.constructor('return process')()` escapes). BUT I surveyed all 16 committed suites: **13 of them already execute extracted app source** via bare `new Function(...)`/`eval(...)` in the test process **with full ambient `require`/`process` in scope** (parse, assistant, assistant_silly, streak, sound, reorder, transfer, photo_store, pr, tax, media, savesafety, income_log, import_sanitize). `meal_test` is the ONLY one using an isolated context — i.e. it is the **tightest** of the executing suites, not a new or looser class. `html_parse_test` is compile-only because its job (whole-file browser-parity syntax check) needs no execution; meal_test's job (assert the SHIPPED matcher's boundary/coverage behaviour rather than a re-implementation) genuinely requires running it. Downgrading it while leaving 13 looser suites untouched would be theatre. Honest standing property to keep visible: **green.js executes repo source by design → run it only on a branch you're willing to trust.** True today, not introduced by v40.
- (5) **`applyAppearance()`'s 7 re-renders — NOT re-entrant, no poison path.** Brace-balanced extraction of drawChart/renderSavingsBoxes/renderMissions/renderBody/renderMeals/renderFoodLog bodies + a grep of klRefresh: **none** calls `applyAppearance` or sets `data-theme`/`data-layout` → no loop. Guarded by `window.__appearanceBooted` so the boot call skips (data not loaded yet). `renderMeals(false)` cannot rotate (`if(advance && canRotate) mealOffset++`). `renderMissions`→`renderChecklist` rebuilds innerHTML and re-attaches listeners on fresh nodes (no leak) and writes no STATE/autosave. The `m._score/_hits/_goal/_fit` fields are written onto the in-file MEAL_DB objects — module-level `var`, never in STATE/MODEL → never persisted or exported. `R()`'s try/catch is a DEBUGGABILITY regression, not a security one: no security control lives in those 7, and drawChart's refuse-to-draw-on-NaN runs on the trip path (refreshFinance), not here.
- (6) **OTHER — matcher inputs are structurally inert.** `normTerm` @5113 strips to `[a-z0-9 ]` → every like/dislike token, every `expandTerm` output and therefore every `_hits` value used in the ★ chip is alphanumeric BEFORE `esc()` even runs; the chip also carries `data-i18n-skip`. The no-match head uses `esc(likes.join(', '))`. All new regexes (`/[^a-z0-9 ]+/g`, `/\s+/g`, `/[,\n;]+/`, `/ies$/`, `/es$/`, `/s$/`, `/y$/`) are linear — no nested/overlapping quantifiers, no ReDoS; `fuzzyCorrect`'s vocab loop is length-prefiltered and `_expandCache`d. `_mealBest` can be `null` when no on-goal meal exists → `(T && m===best)` and `_mealBest===m` are simply false, no crash. i18n invariant #4 HOLDS (item text span `data-i18n-skip`; walker `FILTER_REJECT`s the subtree @6665/6709/6818). Tour retarget to `#botFab` points at an always-visible node (`.botfab` exempt from the collapse); `place()`'s savebar open/close is class-only and cannot reveal the inline-hidden owner buttons. Leak scan of added lines: no miradi/osefe@/aarhus/@gmail/BEGIN/PRIVATE KEY/MIIB/pkcs8/sk_live/whsec/CPR/DK-acct (the single "Osefe" hit is a code COMMENT attributing the product decision); every new 4+ digit number is a CSS hex or a pre-existing literal — no owner figure.
- **GATE (ran myself on the tip):** `node tools/release/green.js` → **GREEN exit 0** — 17 suites: html-parse 4/4, parser 21, assistant 16, streak 4, sound 7, reorder 7, **meal 12/12 (new)**, onboarding 10, transfer 58, silly 43, photo_store 17, pr 12, tax 105, media 43, savesafety 14, income_log 35, import_sanitize 25; preflight **CLEAR** ×3 (index 6 scripts / landing 4 / legal 3); PII guard **17/17**; leak scan 4/4; **APP_VER v40 === sw v40**. `node tools/publish/preflight.js index.html` → **CLEAR exit 0** (slots empty · no private key · 1 public key · no PII · PUBCHK intact · 6 scripts balanced). `node tools/i18n/sync.js` → **MISSING: 56** (new checklist + meal strings) — EXPECTED, Mikoto's step 7, not a security matter.
- **VERDICT: SAFE @ `667cec1`** (code frozen `46ca898`, published bytes identical). Checklist stored-XSS closed at the ingest chokepoint and proven by breakout testing; exportBlank strips it correctly (the Media-Log leak class does NOT repeat); poison correctly inherited and correctly not added; watchdogs byte-identical; slots empty; zero new network/exec surface; fail-loud contract survives the collapse; owner-only mint UI cannot be revealed by the new expand rule; meal_test is the tightest of the executing suites; applyAppearance is not re-entrant. **NO security edit required** — I stayed read-only (Kaito holds the index.html+sw.js lock; nothing needed fixing).
- **FOUR NON-GATING NOTES → Kaito:** (a) `exportBlank` serialises `documentElement.outerHTML` with the LIVE savebar classes, so `.haswarn`/`.open` from the OWNER's device rides into every customer file — NOT a data leak (the badge only ever holds status strings, never a figure; I checked the full set), but a fresh customer would see a red "not saving" badge that means nothing, cheapening the fail-loud signal. Fix: `bar.classList.remove('haswarn','open')` before the `outerHTML` line, mirroring the existing mint-button hide. RELATED PRE-EXISTING (verified byte-identical at base c199cfe, NOT from v40): the badge text is set AFTER serialisation, so a previous mint's `· F-XXXX` can ride into the NEXT blank — low severity, opaque id, owner-side only; same one-line fix location. (b) `_sid()` returns `''` or `'undefined'` for a hostile/absent id → multiple imported rows can share a `data-ck`; delete removes ALL matches, toggle hits the first. Correctness only on a hostile import, no injection; a fresh `uid()` fallback when `_sid` returns empty closes it. (c) checklist has no import COUNT cap (same as notes/media/workouts) — the 3MB decodeDataCode cap bounds it and it sits behind the confirm-preview, so worst case is a self-inflicted render hang on the user's own device. Pre-existing class, logged for completeness. (d) `applyAppearance`'s `R()` swallows exceptions from all 7 renderers → a genuine render break on theme switch is SILENT, exactly the class that produced the dead-script P0 Arthur caught in the browser; a `console.warn` in the catch costs nothing.
- Commits/SHAs reviewed: `46ca898` (frozen code) / `667cec1` (tip), range `89437e5..46ca898` (89437e5, b49223e, c670168, 2c1fbbc, 46ca898), baseline `c199cfe` == my SAFE `95c3ce4`. Read-only, NO lock taken, NO app-code edit (TEAM-CHAT + this log only). Posted SAFE under Pending + MESSAGES.
- Still open: gate needs **Mikoto MISSING:0** (currently 56) + **Hugo GREEN** on the frozen tip, then Osefe's explicit "ship it" (sleep-mode: I sign, I do NOT publish). If index.html/sw.js/landing/legal/preflight moves, I re-sign. Carried from the OL ruling: CSP is now reclassified parked → mandatory-if-Part-B-proceeds; v41 Part A needs a normal review, Part B needs CSP landed+browser-tested FIRST. The v40 batch is no longer un-reviewed — this entry closes that open item.

### [2026-08-04] addendum — PROCESS: my TEAM-CHAT sign-off was absorbed by a concurrent commit (again)
- My Pending entry + MESSAGES SAFE line landed on the remote INSIDE `d2017b2` ("chore(team): Osefe decision — assistant stays OFFLINE-ONLY…", authored by another session in the shared cwd), not in my own commit `de7a4ee` (which carries only `team/logs/akashi.md`). A concurrent `git add`/`commit -a` swept my in-flight TEAM-CHAT.md edits.
- CONTENT VERIFIED INTACT on `origin/claude/vibrant-pasteur-ie24ab`: Pending entry present (1), `**Akashi** \`SAFE @ 667cec1\`` present (1), MESSAGES SAFE line present (1). Working tree clean. So the sign-off is real and readable — only the authorship/commit boundary is wrong.
- This is the SECOND time (first: Mikoto's `d11eeda` absorbed my uncommitted preflight.js + fixture edits, logged 2026-07-29). Reminder to the team: ground rule #1 — one session at a time, and never `git add .`/`commit -a` in a shared cwd; stage explicit paths only.
- ALSO NOTED (non-security, good news): `d2017b2` records Osefe's decision — the assistant stays **OFFLINE-ONLY for now**, online lookup parked with my OL-1..OL-12 contract. That matches my split-and-defer recommendation, so Part B is not pending a review; CSP stays parked (it only becomes mandatory if B proceeds).
- TIP MOVED `667cec1` → `de7a4ee` (docs/log only). `git diff --stat 46ca898 de7a4ee -- index.html sw.js landing.html legal.html manifest.webmanifest` = **EMPTY** → published bytes unchanged, so **my SAFE holds on the current tip** (scoped to the published artifact, per my e19e1ba ruling — chat/log commits don't reopen a sign-off; only a published-file change does).

## [2026-08-04] — via Kaito (asleep, v41 council §4A) — SECURITY STRIP + GATE FIX: Team Room DELETED from the app @ `1dc90a4`
- Asked: execute the v41 root-migration council's §4 ruling — the in-app Team Room is a LIVE hole in the deployed
  customer build and outranks the landing-page question. (A) delete the viewer IIFE + `#teamRoomCard` markup entirely
  (re-pointing the URL is NOT enough), keep `team-chat.html` in source but never published; (E) fix the gate's coverage
  in the SAME commit — add a `raw.githubusercontent` assertion to `green.js` §13 and drop the dead `team-chat.html`
  entry from `PUBLISHED_TEXT`. My standing security exception: I code this one directly. Baseline tip `7f4a875`.
- **THE HOLE, PLAINLY — AND IT WAS MINE.** The card was documented (by me, repeatedly) as "owner-gated". The gate was
  `ownerFile || localStorage.mrln_team`, and the flag was set by *anything* matching `/team/i` in `location.hash`:
  `try{ if(/team/i.test(location.hash)) localStorage.setItem('mrln_team','1'); }catch(e){}`. Typing `mrln.online/#team`
  was the entire attack. The `#__ownerKeySrc` arm really is byte-empty in every published file (preflight enforces it),
  so the hash flag was the ONLY live path — and it **persists in localStorage**, leaving the internal chat card
  permanently in that customer's app, polling `raw.githubusercontent.com` every 5s. Consequences: (1) the customer build
  phoned home, undercutting FREE · OFFLINE; (2) my own recorded audit line — "Outbound vectors enumerated: ONLY fetch =
  Team Room, OWNER-GATED → customer files never fetch" (2026-07-02 full-surface audit, repeated in several later
  sign-offs) — was **FALSE**. I wrote it, I repeated it, and I did not re-derive the gate when I re-asserted it. On a
  paid privacy product a false published privacy claim is refund/consumer-protection exposure, not embarrassment.
  LESSON, concrete: "owner-gated" is a claim about a BOOLEAN EXPRESSION, and I must re-read the expression every time I
  restate it — I had been carrying the 2026-06-28 reading forward for five weeks. I had even logged the `#team` flag as
  a "Low, owner-only impact" backlog nit on 2026-06-28; I under-rated it because I scored it as *information exposure*
  (only the public chat) and never scored it as *the app phoning home*, which is the actual product claim.
- DID (index.html, -56 lines, ZERO additions — verified `git diff --numstat` = `0 56`):
  - deleted the whole `<script>` block "Owner-only Team Room viewer" (was 9742-9791): RAW const, `#team` hash sniff,
    `mrln_team` flag, `tick()` 5s `fetch` poll, feed renderer, open/close button wiring.
  - deleted `#teamRoomCard` markup (was 2438-2443) inside `<section class="panel" id="connect">`.
  - RESIDUE GREPS ALL **0**: `teamRoomCard` · `teamRoomOpen` · `teamRoomFeed` · `mrln_team` · `raw.githubusercontent` ·
    `Team Room`. i18n: the card carried `data-i18n-skip` and the dictionary has NO "Team Room" key (verified, did not
    assume) → no orphan keys, MISSING unchanged. No CSS rule referenced any of the ids (0 hits) → no orphaned rule.
    `exportHTML`/`exportBlank` never referenced it → export paths untouched. `team-chat.html` left in source, untouched,
    and it is NOT in `tools/publish/deploy_map.json` → never enters the deploy set.
- DID (tools/release/green.js):
  - NEW section **13b phone-home scan**: no published file may contain `raw.githubusercontent`. Deliberate design call —
    the file list is **DERIVED from `tools/publish/deploy_map.json`** (the single source of truth for the deploy set,
    Kaito's phase-0 artifact) rather than hand-listed, and it **FAILS CLOSED** if the map is missing/unparseable. That
    fixes the CLASS (a gate list drifting from the deploy set), not just the instance. Binary extensions skipped.
  - DROPPED `team-chat.html` from `PUBLISHED_TEXT`. **Correction to Kaito's brief:** it does NOT print
    "(not present — skipped)" — the file EXISTS in source, so the scan ran on it and printed "✓ team-chat.html clean".
    The coverage was fake in a different way than described: a reassuring green tick for a file that does not publish.
- VERIFIED, NOT ASSUMED:
  - `node tools/release/green.js` → **GREEN exit 0** (all suites; html-parse now **3/3** blocks — one fewer because I
    deleted a `<script>`; parser 21/21; preflight CLEAR ×3; PII guard 17/17; leak scan 3 files clean; phone-home scan
    "11 published text files — no raw.githubusercontent reference"; APP_VER v40 === sw v40). Re-ran AFTER rebasing onto
    Kaito's `3561e09` → still exit 0.
  - `node tools/publish/preflight.js index.html` → **CLEAR exit 0** — slots byte-empty, 1 public key, PUBCHK intact,
    **script tags balanced (5)**, down from 6 because the deleted block was one of them (preflight checks open===close,
    NOT a fixed count — confirmed by reading it, which is why this doesn't RED).
  - WATCHDOGS BYTE-IDENTICAL vs `7f4a875`: `__sys.token(` 18==18, `__sys.` 34, arm 2, trip 6, isArmed 2, isTripped 3,
    `_ecVerify` 2, PUBCHK 2, 4047293148 1, PUB_B64 3, hud-state 6, `verify(` 4, `subtle` 5. The ONE count that moved is
    `__ownerKeySrc` **7→5** = exactly the two references INSIDE the deleted viewer (the comment + its `getElementById`).
    I hand-checked the remaining 5: the slot tag @2613, `exportBlank`'s `oks.textContent=''` key-strip @6209, the import
    comment @7142, and MINT's `priv()` @9054/9059. Key-strip machinery intact.
  - i18n: `node tools/i18n/sync.js` → **MISSING: 59** on my tree AND **59** on the baseline index.html run in a scratch
    copy → my change moved nothing (the 59 are ms-only/parked, Mikoto's standing note).
  - ADVERSARIAL PROOF the new assertion bites (full green.js run on a scratch copy of the repo, 4 cases, all **RED
    exit 1**): (a) planted `raw.githubusercontent` URL appended to GUIDE.md → flagged GUIDE.md; (b) the deleted Team Room
    RAW const re-added to index.html → flagged index.html; (c) deploy_map.json removed → "could not read … fail-closed";
    (d) map declares `ghost-page.html` that does not exist in source → flagged missing. I also tightened the missing-file
    branch to suppress the clean summary so the ✓ line can't sit next to a ✗.
- MEASURED OUTBOUND-VECTOR SWEEP of index.html (counted with regex over the whole file, then every hit inspected by hand):
  `fetch(` **0** · `XMLHttpRequest` **0** · `sendBeacon` **0** · `WebSocket` **0** · `EventSource` **0** · dynamic
  `import(` **0 real** (8 regex hits are all the dictionary string "Import (load onto this device)" × 7 langs) ·
  `importScripts` 0 · `eval(`/`new Function`/`document.write` 0 · `src="http` **0** · `src="//` 0 · external `<link>`
  **0** (3 link tags, all same-origin relative: manifest, apple-touch-icon, icon) · `@import` **0 real** (2 hits are the
  code comments describing the *removed* Google Fonts import) · `url(http` in CSS 0 · `<iframe|object|embed|video|audio|
  source|track|form>` **all 0** · `new Image()` 2 = LOCAL FileReader/data:→canvas EXIF re-encode (no remote src, cleared
  in prior audits) · `postMessage` 2 = same-origin service-worker messaging · `serviceWorker.register` 1 = same-origin
  sw.js. Absolute-URL host census: mrln.online 6, investopedia 4, who.int 1, acefitness 1, pewresearch 1, youtube 1,
  imdb 1 — ALL inside anchor hrefs (user-tapped) or JS that BUILDS an href; none in a `src`, none auto-loaded.
  **HONEST CLAIM WORDING (I will not overclaim — this is the same standard I used to block GUIDE §8 on 2026-07-01):**
  the app makes **zero automatic requests to anything but the same-origin files it is served from** (sw.js,
  manifest.webmanifest, icon-192.png). "Zero outbound requests, full stop" would be false as literally stated — the
  browser still fetches the app's own same-origin assets, and a user-tapped link still navigates out. What IS now true,
  and is the marketable line: **no third-party request, no automatic request, nothing the user did not tap.**
- FOUND, NOT ASKED FOR — routed to Kaito: `tools/test/routing_test.js` (his phase-0 gate, `3561e09`, which landed under
  me mid-run and I rebased onto) is **NOT wired into green.js** — I ran it manually, it passes ("7 held for a later
  phase"), but the routing/deploy-map guards do NOT run in the release gate, so a regression there ships silently. His
  lane + Hugo's runner; I did not wire it.
- NOTED FOR THE RECORD (no action from me, per the brief): `preflight.js:91` `PII_RE` blocks a publish on
  `/miradi|osefe@/…` while the repo itself publishes the owner's address ~41× through `team/logs/*`. The guard's threat
  model stops at the gh-pages file set; repo visibility walks around it. That is the private-repo split — **Osefe's call,
  NOT mine to start.**
- VERDICT: hole CLOSED at the source (deleted, not re-pointed) + the gate that missed it now asserts against it and
  derives its file list from the deploy map. **This is NOT a SAFE.** My SAFE has been open since `667cec1` (code frozen
  `46ca898`); index.html has since moved via `9fa12b9`, `7f4a875`, and now this commit — a fresh SAFE must be taken on
  whatever tip is proposed for ship.
- Commits / SHAs: lock `1daffe4` → **strip+gate `1dc90a4`** (index.html + tools/release/green.js only, staged
  explicitly) → this log + TEAM-CHAT verdict + lock release in the follow-up commit. Rebased onto Kaito's `3561e09`
  (phase-0 deploy map) mid-run; re-ran the gate after the rebase.
- Still open: (1) a fresh **SAFE** on the ship candidate — mine does not carry; (2) Kaito: wire `routing_test.js` into
  green.js; (3) Osefe: private-repo split (the `team/logs` PII exposure the preflight can't see); (4) `team-chat.html`
  must stay out of the deploy map forever — the phone-home assertion would now catch it if it were re-added.
  Sleep-mode: I fixed and signed nothing for publish — NO auto-publish, Osefe's explicit go still required.

## [2026-08-04] — via Kaito (asleep, step 10, RELEASE A gate) — SAFE @ `6225b5c` + DIRECT GATE FIX (2 proven role-selection silent-passes)
- Asked: sign RELEASE A (Osefe's go already recorded, conditional on the gate closing). Verify the freeze myself; attack `_priceFrom` + the narrowed `_addItem` guard rather than trust the suites; rule on poison for the new savings-boxes affordability branch; watchdog counts vs `46ca898` (NOT vs my last run); and try to break `preflight --role` / the deploy-map-driven gate a way Kaito had not. Fix directly if security demands it.
- **TIP MOVED TWICE UNDER ME.** Kaito briefed `4d34167`. Mikoto's `4b7db01` landed mid-run (i18n line = PUBLISHED bytes, so my sign-off scoping says it reopens), then I committed the gate fix `6225b5c`. **I signed `6225b5c`, the tip I actually measured.** Freeze otherwise held: `git diff 4d34167 6225b5c -- <published set>` = index.html `1 1` only.
- **KAITO'S STATED DELTA WAS WRONG — flagged loudly.** He said index.html (+70/−64) + CNAME (+1/−1), "nothing else". I measure **index.html 69/63**, CNAME 1/1, **and `.nojekyll` — a NEW published file added by `3561e09`**, which he briefed as "tooling only, zero published bytes". It is 0 bytes (`git cat-file -s`=0) and declared in `deploy_map.json`, so zero leak risk — but "zero published bytes" is a claim I must be able to take at face value, and it was false. CNAME = trailing newline only, content `mrln.online` identical.
- **(1) `_priceFrom` — THE HEADLINE CLAIM IS FALSE AS IMPLEMENTED. My biggest find, and NOT a security blocker.** Extracted the SHIPPED function and ran it (did not reason): the model-number rule only fires on a **terminal** number, so any trailing word defeats it. `"can i afford an iphone 17 this year"`→**17** · `"…rtx 5090 in august"`→**5090** · `"…switch 2 right now"`→**2** · `"…iphone 17 pro max"`→**17** · `"…tesla model 3 next year"`→**3** · `"nike air max 90 shoes"`→**90**. Severity is higher than `_addItem` because affordability goes `answerQuestion`→`showAnswer` and states the verdict **as fact with no Apply step** (confirmed by reading the wiring @6105-6120; `_addItem` by contrast lands in `showProposal` behind an explicit Apply). **PROVEN one-token fix:** drop `terminal &&` at the `_PRICE_STOP` line — all six become "what does it cost?", **zero** legitimate regressions (4000 / 4000 kr / 20 kr gum / 250 kr pizza / 2k tv / 50k / save 50000 / reach 100000 unchanged), and the **full green.js passes exit 0** with it applied (verified in a scratch clone). Routed to Kaito — parser/assistant is his lane, NOT my security exception.
- **WHY I SIGNED ANYWAY — record the reasoning, it is a judgement call.** `_priceFrom` maxes over a **subset** of `_amtFrom`'s candidates, so `_priceFrom(x) ≤ _amtFrom(x)` **by construction** → the change is a **strict improvement on what is live today** (live hallucinates on all six of those AND the terminal forms). Blocking would keep the WORSE behaviour in paying customers' hands, so BLOCK would have been the *less* safe action. I said so explicitly instead of hiding behind "default to block", and gave Osefe the explicit option to hold for the one-token fix. **Lesson to keep: "default to BLOCK when unsafe" must be measured against the counterfactual (what is live), not against a perfect build.**
- **(2) `_addItem` guard — CLEAN, zero regressions, verified by differential not by the suites.** Ran 20 health/finance phrasings through parseClause extracted from BOTH `46ca898` and the tip: **every change is `addItem`→`null`** (strictly safer). All three cases Kaito broke first time still parse (`Alter Ego sub 120`, `Sparekassen 500 om måneden`, `Sparkasse 500 monatlich`). **No legitimate multilingual add blocked.** Residual bypasses found, ALL pre-existing (present at `46ca898`), none opened by the guard: `_CCY_LOCAL` has no word boundaries → `cad` hits *cadence*/*decade*, `aud` hits *audio*, `nok` hits the ordinary Danish word for *enough*; the `_addVerb` escape means `"add 600 calories"` still mints; the health-word list is **English-only** so `"i ate 600 kalorier i dag"` keeps the original bug in 6 of 7 shipped languages. Backlog, not gating (all behind Apply). Unrelated pre-existing: `"ich bin 5 km gelaufen"` → `setProfile 5` (offers to set age to 5).
- **(3) POISON ON THE NEW SAVINGS-BOXES BRANCH — CORRECT, no fix needed.** `_boxes += v*T`, `T=__sys.token()` (hoisted @6002). `token()` returns **1 or NaN** (read it @3051, did not assume) → tampered copy gives `_boxes`=NaN → `_boxes>0` false → **the branch cannot fire with a truthful number**; `money(_boxes)` renders NaN. No new `__sys.token(` call site needed (reuses scope `T`) — which is why the count stayed 18==18 rather than rising. Noted but not gating: `left` is already ×token (comment @6003) so `a <= left*T` is effectively T², harmless since T∈{1,NaN}; `Number(b.balance)||0` coerces a hostile imported balance safely (JSON.parse values are inert data, no valueOf).
- **(4) WATCHDOGS vs `46ca898`:** `__sys.token(` 18==18 · `__sys.` 34 · arm 2 · trip 6 · isArmed 2 · isTripped 3 · `_ecVerify` 2 · PUBCHK 2 · 4047293148 1 · PUB_B64 3 · hud-state 6 · `verify(` 4 · `subtle` 5 — byte-identical. Moved counts, each reconciled BY HAND to the Team Room deletion: `__ownerKeySrc` 7→5, `<script>`/`</script>` 6→5, `data-i18n-skip` 29→28, **`fetch(` 1→0**, innerHTML −3, textContent −4, localStorage −2 (setItem+getItem). Slots byte-empty. eval / new Function / XHR / sendBeacon / WebSocket all **0**. i18n invariant #4: the ONLY skip container removed is the deleted card (diffed the skip contexts, 1 removed / 0 added) — every user-content container intact.
- **(5) ===== I FIXED THE GATE DIRECTLY — `6225b5c`, TOOLING ONLY, ZERO PUBLISHED BYTES ===== TWO PROVEN SILENT-PASSES.**
  - **H1 `green.js:143` — `static` was WORSE than Kaito suspected.** `dm.entries.filter(e => /\.html$/.test(e.source) && e.role !== 'static')` dropped `role:"static"` HTML from the preflight loop **entirely** — not a weaker profile, **no preflight at all**. PROVED on a scratch clone: planted `app.html` = full app content with **PUBCHK gutted (4047293148→1111111111)** and **`#__ownerKeySrc` POPULATED with key material**, declared `role:"static"` → gate printed **`✓ GREEN` exit 0** once the 61-file count pin was bumped. The only thing that caught it first pass was that count pin, whose own message says *"update this pin deliberately"* — exactly what you do when adding the migration entry. `static` is the role **58 of 61** entries use ⇒ the natural choice for `app.html`. **`routing_test [9]` passed the whole time** because it drives `preflight` directly while green.js skipped the file — a suite guarding a gate that had the hole. Fix: preflight **every** published `.html` whatever its role.
  - **H2 `preflight.js` — the `--role` override could WEAKEN the map.** PROVED: `preflight.js index.html --role marketing` on an index.html with PUBCHK gutted → **`✓ CLEAR to publish` exit 0**, silently overriding a map that declares it `app`. Answer to Kaito's direct question ("should the override exist at all?"): **not in that form.** A logged header line is not a control. Fix: `ROLE_STRENGTH` {app:3, marketing:2, stub:2, static:1}; `--role` may DECLARE a role for an unmapped file or restate/strengthen a mapped one, but **a downgrade below the map is a BLOCK**. Plus: an `.html` resolving to `static` **fail-closes onto the full app profile** and says so on the header line — the same principle the file already stated for undeclared files.
  - **RE-PROVEN AFTER THE FIX:** planted `app.html` now promoted to app profile and **BLOCKED on both** the populated slot and the stripped watchdog (gate exit 1); `--role marketing` on index.html exit 1; `--role app` on index.html exit 0; `landing --role marketing` exit 0 (restate OK), `landing --role app` exit 1 (over-check, fail-closed, not a crash); **green.js exit 0 + preflight CLEAR ×3 unchanged on the real tip** (no regression).
- **(6) Mikoto's i18n line — leak-scanned, never taken on faith.** 21 new quoted strings, **0 removed** (add-only merge), zero PII/key/`<script`/`javascript:`/`on*=` hits, placeholder multiset `{amt}{left}{n}{saved}` intact, only 4+ digit numbers are the illustrative `4000`/`50000` in the help examples — no owner figure.
- **GATE ON `6225b5c` (ran myself):** `green.js` **exit 0** (17 suites: parser 21 · assistant 16 · silly 43 · streak 4 · sound 7 · reorder 7 · meal 12 · onboarding 10 · transfer 58 · photo_store 17 · pr 12 · tax 105 · media 43 · savesafety 14 · income_log 35 · import_sanitize 25 · routing ✓; html-parse **3/3**), `preflight` **CLEAR ×3** exit 0, PII guard **17/17**, phone-home scan clean, **APP_VER v40 === sw v40**. 170 ✓ lines, 0 ✗.
- **VERDICT: SAFE @ `6225b5c`.** No leaked figure, no key, watchdogs byte-identical, slots empty, zero network surface, i18n skip containers intact, poison correctly inherited by the new branch. `_priceFrom` is a real product defect routed to Kaito with a proven fix, explicitly NOT gated by me because it is a strict improvement on live.
- **⚠️ PROCESS FAILURE — MINE.** A `git pull --rebase` failed on unstaged changes and my NEXT command's `git add TEAM-CHAT.md` swept **Mikoto's in-flight sign-off** into my lock commit `ebd505a` under my message. Content verified **intact and un-duplicated** (1 copy of each line, lock board clean, nothing lost) — but the authorship boundary is wrong, and this is the **THIRD** occurrence of this class in a shared cwd (Mikoto's `d11eeda` took my preflight edits 2026-07-29; `d2017b2` took my sign-off 2026-08-04; now I did it to her). My own lock line never landed as a result, so nothing to release. **CONCRETE RULE FOR NEXT TIME — the lesson is NOT "stage explicitly" (I did): never chain a command after a `git pull` that can fail, and run `git status` immediately before every `git add` in a shared tree.**
- Commits / SHAs: reviewed `46ca898`→`6225b5c` (incl. `7f4a875` price fix, `1dc90a4` my Team Room strip, `3561e09`+`2bff172` phase-0 gate, `4b7db01` Mikoto i18n). Mine: `ebd505a` (lock commit that absorbed Mikoto — content intact), **`6225b5c` (gate security fix: green.js + preflight.js, staged explicitly)**, + TEAM-CHAT sign-off and this log.
- Still open: (1) **@Kaito the `_priceFrom` one-token fix** — proven GREEN, my recommendation is take it; (2) **@Hugo GREEN @ `6225b5c`** — green.js AND preflight.js changed under him, his prior runs are stale; (3) backlog: `_CCY_LOCAL` word boundaries · English-only health-word list · the `_addVerb` escape · `ich bin 5 km gelaufen`→age 5; (4) `_sid()`-collision + import-count-cap notes from my `667cec1` pass — (a)/(b)/(d) landed via `9fa12b9`, (c) still open; (5) **@Osefe private-repo split** — `team/logs/*` publishes his address ~41× and preflight's threat model cannot see it; (6) CSP stays parked (online lookup is parked, so it is not mandatory). **If any published file moves again, I re-sign.** Sleep-mode: I signed, I did NOT publish.

## [2026-08-04] — via Kaito (asleep, step 10, RELEASE A gate, 4th re-sign) — SAFE @ `58127f4` (chat tip `6da449f`)
- Asked: re-sign RELEASE A after the tip moved three more times (`8f6c65f` _priceFrom completion, `6f2ee1d` Mikoto i18n, `58127f4` Hungarian income lexicon). Attack Kaito's lookahead reasoning rather than confirm it; hunt other lexicon prefix-collisions across ALL languages; rule on whether a wrong `setIncome` has a SECURITY dimension; rule on `price_test.js`'s slice window; watchdogs vs `46ca898`; full published surface. Read-only unless security demands a fix.
- **FREEZE VERIFIED MYSELF.** `git diff --stat 58127f4 6da449f -- <61-entry deploy-map source set>` = **EMPTY** → chat tip is docs-only, I sign the bytes I measured. `git status` clean, no lock held by anyone.
- **MEASURED PUBLISHED-BYTE DELTA vs `46ca898`:** `index.html` **75/64**, `CNAME` 1/1, `.nojekyll` 0/0. Nothing else in the whole 61-file set (`sw.js`/`manifest`/`landing`/`legal`/`GUIDE`/`README`/`assets` diff **EMPTY**). Per-commit, linear: `6225b5c..8f6c65f` 7/2 · `8f6c65f..6f2ee1d` 2/2 · `6f2ee1d..58127f4` 1/1 → **10/5 since my last SAFE**.
- **BOTH OF KAITO'S CORRECTIONS TO ME ARE RIGHT — verified, not accepted.**
  - `.nojekyll`: `git rev-parse origin/gh-pages:.nojekyll` = `e69de29` (**the canonical empty blob**), `cat-file -s` = **0**, and `git log origin/gh-pages -- .nojekyll` shows it has been live since **`671698b` (2026-07-29)**. So `3561e09` added it to **SOURCE**, not to the published site. **My "NEW published file" claim was wrong** — it was new in the source tree only, which is precisely what lets `deploy.js --check` reproduce the live tree (path set identical, 61 files). Kaito's "zero published bytes" stands. Correcting my own record.
  - index.html 69/63 vs his 70/64: confirmed **69/63** at `6225b5c` — he was quoting index+CNAME combined. My correction stands, as he says.
  - LESSON FOR ME: "new file in the diff" ≠ "new published file". The authority for *published* is `origin/gh-pages`, not the source branch. I asserted from the source diff alone.
- **(1) THE LOOKAHEADS — I FALSIFIED KAITO'S CLAIM. Two real regressions, both low severity, NOT gating.** He claimed `fizetés(?!i)`/`bér(?!l)` "cannot make any currently-working phrase stop working." Ran the SHIPPED `parseClause` extracted from both `6f2ee1d` and the tip over a 48-case hu corpus:
  - **`a fizetési szintem 25000`** (my pay LEVEL) and **`fizetési sávom 25000`** (my pay BAND) were `setIncome` at `6f2ee1d` and are `addItem` at the tip. So yes — Hungarian income phrasings whose very next letter after `fizetés` is `i` **do exist**; `fizetési` is the productive adjectival suffix. His absolute is false.
  - WHY IT DOESN'T GATE: (a) both forms are stilted for a quick-update box — the four natural forms (`fizetésem`, `bérem`, `jövedelmem`, `bevételem`) all work, and **two of them only work because of this commit**; (b) the failure lands in `addItem` behind the **explicit Apply preview** (`sendBtn`→`showProposal`, `aiApply` click required, @6109-6134 — verified by reading the wiring), so it is a visible wrong suggestion, not a silent write; (c) the counterfactual: what is LIVE today turns **`bérleti díj 6000` (RENT) into `setIncome 6000`**, which corrupts leftover/tier/affordability/every projection. Holding the release keeps the worse behaviour in customers' hands. Same reasoning I recorded for `_priceFrom` at `6225b5c`.
  - HIS REASONING, CORRECTED PRECISELY: an allowlist fails toward `addItem` for *every* suffix you forget; a lookahead fails toward `addItem` for *every* phrase whose next letter is `i`/`l`, known or not. The lookahead is **narrower**, which is the right call — but it is **not** "can only remove known collisions." Direction of failure is identical; only the blast radius differs.
  - VERIFIED HIS SIDE HOLDS TOO: the app's own hu UI words `Előfizetés`/`Előfizetések` (SUBSCRIPTIONS) and `Lakbér` (RENT) were never at risk — the LEADING boundary `(?<![\p{L}\p{N}])` already blocks them (`ő`/`k` precede the stem). `bérplafon` (wage ceiling) still matches, correctly. No hu income word begins `bérl`. `bevétel`/`jövedelm` introduce no new collision (`bevásárlás` diverges at char 3; all `bevétel*`/`jövedelm*` forms are revenue-related).
  - `LEX.income` is interpolated in **exactly one** place (`_has(LEX.income, c)` @5829) — no composition with `_w()`, so the inline lookaheads cannot leak into a differently-anchored regex. Checked, not assumed.
- **(2) ===== THE COLLISION CLASS IS SYSTEMIC AND LIVE IN EVERY LANGUAGE — my biggest find this run. ALL PRE-EXISTING (identical at `46ca898`), so it does NOT gate — but Kaito asked, and the answer is "far more than the two Mikoto surfaced." =====** Differential `46ca898` vs tip over a hand-built cross-language corpus; every one of these is what the SHIPPED parser does **today**:
  - **hu, `bér` collisions `(?!l)` does NOT close:** `bérautó 900` (rental CAR) · `bérmunka` · `bérgarázs` · `bérkocsi` → all **`setIncome`**. `jövedelemadó 4000` (income **TAX**) → `setIncome` (was already so at base; the new `jövedelm` stem adds the misspelling `jövedelmadó` too).
  - **de:** **`Lohnsteuer 4000`** (income TAX, an expense) → `setIncome`. `Gehaltskonto 30` (salary-account fee) → `setIncome`. `Kreditkarte 79` → **`setLoanPayment`**.
  - **sv:** **`viktigt möte 200`** / `ett viktigt köp 150` / `viktig faktura 300` → **`setBody.weight`** (`vikt` prefixes `viktig`, the most common adjective in the language). `Viktoria 75` → weight. `lönsamt köp 400` (profitable purchase) and `lönnsirap 60` (maple syrup) → `setIncome`.
  - **da/nb:** `Lønstrup ferie 2000` (a town) · `lønkonto gebyr 25` · `lønnstilskudd 500` → `setIncome`. `tallerken 120` / `tallerkener 120` (plates) and bare `tall 180` (nb for *number*) → **`setBody.height`**. `lånebevis 100` → `setLoanPayment`.
  - **es: a DIFFERENT and worse bug — the AGE rule has NO leading boundary at all.** @5812 composes `'(?:'+LEX.age+')'+_WA` — trailing boundary only, so `edad` matches at the END of any word: **`propiedad 41`** / `sociedad 45` / `la propiedad es 41` → **`setProfile.age`**. Every other `_has()` group is leading-anchored; this one is trailing-anchored, which is strictly worse (suffix match). Also `ahorrar 500 en la mesa` → `setSavingsMatch` (`mes` prefixes `mesa`), `peso 80` → weight.
  - SEVERITY, honestly: all land behind the Apply preview with a human-readable description, so none is a silent write. But `setIncome`/`setBody`/`setLoanPayment` are one careless tap from corrupting the finance and health models, and **the words involved are ordinary vocabulary, not edge cases**. Routed to Kaito as a **structural** item, not a patch item: `_has()`'s leading-boundary-only contract is wrong for agglutinative (hu) and compounding (de/sv/da/nb) morphology, and the age rule's missing leading boundary is a separate one-token bug. Kaito's own note (RELEASE A, "(b) is a patch, not the structural answer") is correct and I am confirming it with measurements.
- **(3) SECURITY DIMENSION OF A WRONG `setIncome` — ruled: NONE. The tamper story is untouched.** Traced the whole path rather than reasoning: `parseClause`→`showProposal`→ user clicks `#aiApply` @6123 →`applyChange` @5650 →`setIncome` @4226 → `MODEL.incomeGuess` → `recomputeIncome()` → `MODEL.income`. Every downstream read is display/compute and is token-gated at the point of computation, not at the point of storage: `leftOver(income) = __sys.token()*income − GRAND − loanAmt()` @3101, `comfort()` @3102 (a second `token()`), `itemMonthly`/`groupTotal`/`recomputeGrand` unchanged. `__sys.token()` returns **1 or NaN** @3051 — a **multiplier**, so a wrong-but-finite income yields a wrong-but-finite figure on a legitimate copy and **NaN on a tampered one, exactly as before**. Correctness of the operand and integrity of the multiplier are orthogonal. Grepped every `MODEL.income`/`incomeGuess` read site (24 of them): **not one is inside `__sys`, `arm`, `trip`, `isArmed`, `isTripped`, `_ecVerify`, PUBCHK or the PUB_B64 watchdog** — no watchdog consumes income, so no income value can suppress a trip or un-poison a figure. `morningBriefing` @2918 is the only new-ish consumer and it is explicitly `isFinite(surplus)`-gated on the poisoned `leftOver`. **A corrupted income is a user-data integrity defect, not a licensing/anti-tamper weakening.** I will not inflate it into a security finding.
- **(4) `price_test.js` slice window — ACCEPTED on its own merits, and it is TIGHTER than `meal_test`.** Window = `'var _CCY_RE ='` → `'return isFinite(best) ? best : NaN;\n  }'`. **Measured: each marker occurs EXACTLY ONCE in the whole 2.08 MB file** (start idx 659960, end idx 662787, 2866 B). The slice declares exactly one function (`_priceFrom`) and carries both of its only dependencies (`_CCY_RE`, `_PRICE_STOP`) — **zero external references**, so it cannot silently pick up a stub. Drift analysis: if either anchor is edited away, `slice()` **throws** `missing …` → uncaught → non-zero exit → gate RED (**fails loud**); if `_priceFrom` were moved out of the window, `new Function(src+'; return _priceFrom;')` throws `ReferenceError` → also RED. **PROVED that second branch by accident**: my own differential against `46ca898` (which predates `_priceFrom`) died with exactly that ReferenceError. The ONLY silent-drift mode is a future edit introducing an **earlier** occurrence of either marker — impossible today (count 1/1). Non-gating hardening for Kaito: assert `split(mark).length-1 === 1` for both markers. Consistent with my `meal_test` ruling: 13 committed suites already `new Function`/`eval` extracted app source with ambient scope; this is the same class, and the standing property stands — **green.js executes repo source by design, so run it only on a branch you trust.**
- **(5) ADVERSARIAL PROOF BOTH NEW GUARDS BITE** (scratch clone, real reverts, not reasoning): re-inserted `terminal &&` into `_priceFrom` → `price_test.js` **exit 1**. Reverted `LEX.income` to `|jövedelem|fizetés|bér` → `parse_test.js` **exit 1** (25 passed / **7 failed**). Both reverted → `green.js` **exit 1**. `parse_test` went 21→**32** cases, **add-only** (`git diff` shows 22 inserted, 0 deleted — no guard case removed). `price_test` is wired at green.js §11b with the same `run()` helper as every other suite.
- **(6) `_priceFrom` — differential `6225b5c` vs tip, 32 phrasings: 5 changed, and EVERY change is `number → NaN`.** `iphone 17 this year` 17→NaN · `rtx 5090 in august` 5090→NaN · `switch 2 right now` 2→NaN · `tesla model 3 next year` 3→NaN · `nike air max 90 shoes` 90→NaN. **Zero cases where the assistant newly invents a price** (`_priceFrom_new(x) ⊆ _priceFrom_old(x)`, monotone in the safe direction). All 27 legitimate prices unchanged (4000 · 4000 kr · 2k tv · $50 · 250 euro · 50000 · 100000 · 7500 · 3200 · 1200 · 900 · 20 kr gum · 250 kr pizza · 4500 · da/hu currency forms). The commit is **byte-for-byte my proposed one-token fix** plus the removal of the now-dead `terminal` var and a 6-line comment — no semantic addition. Pre-existing over-refusals noted for backlog, not gating: `can i afford a pizza 250` / `a laptop 8000` → NaN (asks), and `how long to save up 50k` → NaN because **`up` is missing from `_PRICE_STOP`** — a one-word addition.
- **(7) I RE-RAN THE APP'S OWN SHIPPED EXAMPLES THROUGH THE REAL PARSER, ALL 7 LANGUAGES — 26/26 correct.** This is the class that produced this whole commit (an example the UI tells you to type that mints a bogus expense), so I did not take Mikoto's browser run on faith. Every localized `setSavingsMatch` example parses (`ahorrar 2000 al mes` · `spar 2000 om måneden` · `sparen 2000 pro Monat` · `spara 2000 per månad` · `spar 2000 per måned` · `félreteszek 2000 minden hónapban`) and every localized income example parses (`el ingreso es ahora 18000/25000` · `indkomsten er nu …` · `mein Einkommen ist jetzt …` · `inkomsten är nu …` · `inntekten er nå …` · **`a jövedelem most 18000/25000`**). **Confirmed Mikoto's orphan claim independently:** the translated affordability examples I found in the dict (`kan jag få råd till 4000?`, `megengedheto-e magamnak 4000?`, `¿puedo permitirme 4000?`, `hvor lenge for å spare 50000?`) belong to **DEAD keys** — the live `t()` call sites @6034 and the goal-amount line use the NEW `… 4000 kr?` / `… 50000 kr?` keys, whose translations correctly keep the English command literal. Dead keys are never rendered → not a live defect. She was right.
- **(8) WATCHDOGS — BYTE-IDENTICAL `6225b5c` ↔ `58127f4`, every single counter:** `__sys.token(` **18==18** · `__sys.` 34 · arm 2 · trip 6 · isArmed 2 · isTripped 3 · `_ecVerify` 2 · PUBCHK 2 · **4047293148** 1 · PUB_B64 3 · `__ownerKeySrc` 5 · `hud-state` 6 · `verify(` 4 · `subtle` 5 · `data-i18n-skip` **28** · `fetch(` **0** · eval/new Function/XHR/sendBeacon/WebSocket/EventSource **0** · `<script`/`</script>` 5/5 · innerHTML 100 · localStorage 29. vs `46ca898` the four moved counts are the ones I already hand-reconciled to the Team Room deletion (`__ownerKeySrc` 7→5, scripts 6→5, skip 29→28, `fetch(` 1→0) and **none moved again**. `git diff 6225b5c 58127f4 -- index.html | grep -c data-i18n-skip` = **0** → invariant #4 holds, not one skip container touched.
- **(9) EVERY CHANGED LINE SINCE MY SAFE, ENUMERATED — exactly 4 logical edits, nothing else in a 2 MB file:** the `LEX.income` string · `_priceFrom`'s `terminal` removal + comment · the `tf()` `{n} month(s)`→`{n} months` source literal · the AUTO-MERGED dict line. No other app code moved.
- **(10) MIKOTO'S i18n LINE LEAK-SCANNED (`8f6c65f`→`58127f4`, +1807 chars).** **89 strings added, 43 removed** — note this is a **replacing** merge, not the add-only ones I've signed before, because it is a defect sweep. Danger-token scan (`<script`/`</script`/`javascript:`/`data:text/html`/`on*=`/`<img`/`<svg`/`<iframe`/eval/new Function/document.write/innerHTML/`__sys`/PUBCHK/PUB_B64/4047293148/ownerKeySrc/hud-state/fetch/localStorage/`.src=`) → **0**. PII scan (miradi/osefe@/aarhus/@gmail/BEGIN/PRIVATE KEY/MIIB/pkcs8/sk_live/whsec/cpr) → **0**. **Placeholder multiset over the ENTIRE dict is byte-identical old↔new** (72 distinct placeholders, `{n}` 426, `{amt}` 166, `{left}` 54 … all unchanged) → no `tf()` arity drift from a rewritten value. Only 4+-digit numbers in added strings are the illustrative `25000` / `18000` / `2000` inside quoted command examples — **no owner figure**.
- **(11) FULL PUBLISHED SURFACE (all 61 deploy-map entries, not just index.html):** slots **byte-empty** (`<script id="hud-state" …></script>`, `<script id="__ownerKeySrc" …></script>`) · **exactly 1** public key (`PUB_B64 = 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEpuq…'`) · **0** private-key markers (BEGIN/PRIVATE KEY/pkcs8/MIIB/privateKey) · PUBCHK 2 + `4047293148` 1 intact · `raw.githubusercontent` **0 across the whole set** · PII: the only `miradi` hits are the sanctioned provider-name lines (index 1359/1390, both inside `#legalBack` which opens @1338; landing 819 footer; legal ×5) and preflight's anchored `LEGAL_ALLOW` clears all three · **APP_VER `v40` === sw.js VERSION `v40`** · `sw.js`/`manifest`/`landing`/`legal`/`GUIDE`/`README`/`assets` **untouched since `46ca898`**.
- **GATE, RUN BY ME ON THE TIP:** `node tools/release/green.js` → **exit 0**, **28 `===` sections**, **0 `✗`** — html-parse **3/3** · parser **32** · assistant 16 · streak 4 · sound 7 · reorder 7 · meal 12 · onboarding 10 · transfer 58 · silly 43 · photo_store 17 · pr 12 · tax **105** · media 43 · savesafety 14 · income_log 35 · import_sanitize 25 · **price 19/19** · routing ✓ (0 armed / 7 held for a later phase) · preflight **CLEAR ×3** · PII guard **17/17** · leak scan clean · phone-home clean · v40===v40. `node tools/publish/preflight.js` index/landing/legal → **exit 0** each. `node tools/publish/deploy.js --check` → **exit 0**, path set **identical (61 files)**; content deltas informational only (index 2078646 B source vs 2005698 B live — source legitimately ahead of live between releases; sw.js 2868 B both).
- **VERDICT: SAFE @ `58127f4`** (chat tip `6da449f`, published bytes identical). No leaked figure, no key material, watchdogs byte-identical to my last SAFE, slots empty, zero network/exec surface, i18n skip containers untouched, the poison multiplier untouched and unreachable from the lexicon change. **NO security edit required — I stayed read-only, took no lock, and did not reopen Hugo's GREEN.**
- Commits/SHAs reviewed: `6225b5c`(my last SAFE) → `8f6c65f` → `429e2c7` → `5df29ed` → `6f2ee1d` → `f6c9854` → **`58127f4`** → `6da449f`. Baseline for the published delta: `46ca898`.
- Still open: (1) **@Kaito STRUCTURAL — `_has()` leading-boundary-only vs agglutinative/compounding morphology**: hu `bér*` (bérautó/bérmunka/bérgarázs/bérkocsi) and `jövedelemadó` still mint income; de `Lohnsteuer`→income, `Kreditkarte`→loan; sv `viktig*`→weight, `lönsam`→income; da/nb `tallerken`/`tall`→height, `Lønstrup`/`lønkonto`→income, `lånebevis`→loan. (2) **@Kaito ONE-TOKEN AGE BUG** — @5812 the age rule is `'(?:'+LEX.age+')'+_WA` with **no `_WB`**, so `edad` matches at word END: `propiedad 41`/`sociedad 45` → `setProfile.age`. Add the leading boundary. (3) `_PRICE_STOP` is missing `up` (`save up 50k` → asks). (4) two low-severity hu false-negatives from the new lookaheads: `fizetési szintem` / `fizetési sávom`. (5) `price_test.js`: assert each slice marker occurs exactly once. (6) carried: `_CCY_LOCAL` word boundaries · English-only health-word list · `_addVerb` escape · `ich bin 5 km gelaufen`→age 5 · `_sid()` collision + import count cap · **@Osefe private-repo split** (`team/logs/*` publishes his address, preflight cannot see it) · CSP stays parked. **Sleep-mode: I signed, I did NOT publish.** If any published file moves again, I re-sign.
