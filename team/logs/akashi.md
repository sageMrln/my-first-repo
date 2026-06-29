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
