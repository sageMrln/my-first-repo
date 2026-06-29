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
