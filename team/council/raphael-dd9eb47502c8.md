# Raphael five-advisor design ruling

Actual seats: five independent Claude Haiku calls plus available Council and Claude chair. Not impersonating historical team members.

{
  "text": "Design Read: a privacy-first consumer product landing for people consolidating intimate life data, with a cinematic editorial / physical-instrument language\u2014an asymmetric ivory-and-carbon \u2018Personal Orbit\u2019 world, not SaaS cards, neon mesh, glassmorphism, or the incumbent staged OS aesthetic. Dials: variance 8, motion 7, density 4.\n\nBuild spec:\n1. Preserve landing.html\u2019s factual copy, eight-language dictionaries, purchase/CTA URLs, IDs, semantic landmarks, accessibility hooks, and immutable-test contracts. Scope remains landing.html and genuinely necessary bundled/code-generated assets only; app code is untouched.\n2. Replace the current visual world with a coherent orbital editorial composition: warm mineral paper, near-black ink, vermilion signal color, hairline technical annotation, oversized humanist typography, asymmetric whitespace, and hard-edged panels. Avoid generic equal card grids, colored glow, decorative pills, emoji, and constant motion.\n3. Hero becomes a legible two-column \u2018private life instrument\u2019: copy and primary purchase action remain immediately available, while the other side contains a meaningful locally code-generated 3D object representing five connected life areas around a sealed local core. Implement with an inline canvas/WebGL renderer using primitive geometry and deterministic shaders only\u2014no CDN, fonts, fetch, textures, telemetry, or runtime requests. Pointer/keyboard focus changes the inspected life-area layer; scroll changes camera framing only where it reveals information. If WebGL is absent, show an equivalent static CSS/SVG exploded-orbit diagram with the same labels and meaning.\n4. Recompose existing sections as an editorial journey: fragmentation \u2192 convergence; privacy architecture shown as a sealed local-core cutaway; five life areas presented as one continuous indexed field rather than cards; product imagery treated as evidence in offset frames; purchase section made unmistakable and calm. Retain every required factual disclaimer and conversion route.\n5. Motion is purposeful and bounded: hero model responds gently to pointer/focus; depth changes reveal relationships; section transitions establish hierarchy. No autoplay spectacle, infinite ornamental loops, scroll hijacking, boot delay, or content hidden pending JS. Under prefers-reduced-motion the entire page is static and complete. Without JS all copy, navigation, evidence imagery, fallback diagram, price, and purchase CTA are visible and usable.\n6. Accessibility: semantic headings/order, skip link, strong visible focus, keyboard-operable model layer selector, 44px touch targets, AA contrast, no color-only meaning, descriptive canvas fallback, responsive layouts at 320/390/768/1440, and no horizontal overflow. Mobile disables expensive 3D detail, caps DPR and geometry, pauses rendering offscreen/hidden, and retains the static fallback if performance or context creation fails.\n7. Localization: reuse existing English source strings wherever possible. Any unavoidable new visible string must receive en/es/da/de/sv/nb/hu/fr entries in the same candidate; verify switching all eight languages and localized accessible names.\n8. Verification sequence: implement in small hash-checked replacements; commit atomically to the owned branch; run the local Impeccable detector and fix concrete contrast/slop/accessibility findings; run isolated Playwright desktop/mobile screenshots plus keyboard, language, reduced-motion, no-JS, WebGL-failure, CTA, overflow, page-error and zero-external-request checks; request independent source review and address concrete findings; freeze exact SHA; run immutable release gate with real Chromium and no skipped checks; then open the verified candidate through mrln_work.preview in the owner\u2019s Opera. Do not publish until the owner explicitly approves that exact candidate SHA; publication later must preserve rollback and be followed by public byte/status and live Opera verification.\n\nExplicitly not building: a decorative spinning logo, an image-reconstruction task without a supplied reference, external Three.js/fonts/assets, unverified marketing claims, app changes, scroll-jacking, or publication without exact-SHA owner approval.",
  "verdict": {
    "ok": true,
    "feedback": "Proposal is strategically sound: minimal, reversible, addresses all user requirements (eight-language preservation, accessible 3D with static fallback, no-JS readability, zero external runtime, immutable verification gates, owner approval). Scope bounded to landing.html; existing functionality preserved. Pre-implementation must establish: (1) WebGL failure detection and SVG fallback trigger mechanism (verified by explicit 'WebGL-failure' test in sequence), (2) reference design validating orbital metaphor, (3) keyboard 3D interaction model. All three are resolvable during detailed specification phase. Verification sequence is rigorous and gates publication to owner SHA approval.",
    "auditor": "council + claude minor",
    "council_voices": 4,
    "sent_to": [
      "gemini",
      "openrouter"
    ]
  },
  "advisors": [
    {
      "role": "Contrarian",
      "verdict": {
        "ok": false,
        "feedback": "Detailed and disciplined, but carries unmitigated risks. (1) Orbital metaphor elegant but untested; beautiful-but-opaque UX risk. (2) Keyboard 3D navigation underspecified; 'focus changes layer' describes output but not interaction discoverability or mental model for multi-layer navigation. (3) Mobile: static SVG fallback thoughtful but 'radically different' for 50%+ of traffic may remain unrealized. (4) Recomposition strategy ('fragmentation\u2192convergence') conflicts with copy-preservation claim; new hierarchy and microcopy will emerge\u2014scope creep. (5) Release-gate multi-checkpoint approval becomes bottleneck if owner iterates or unavailable. (6) Eight-language verification cost per iteration not quantified. (7) Custom WebGL + immutable gates = heavyweight operational model; future changes slow. (8) 'Meaningful' 3D undefined; no user validation plan. Recommend user research on orbital metaphor, keyboard UX, and mobile radical delivery before green-light.",
        "not_building": "External Three.js, CDN fonts/assets, decorative logos, image-reconstruction, unverified marketing, app code changes, scroll-jacking, publication without owner SHA approval."
      }
    },
    {
      "role": "First Principles / Strategist",
      "verdict": {
        "ok": true,
        "feedback": "Strategically sound direction with strong privacy and accessibility posture. BUT critical gaps require resolution before build: (1) 'Meaningful 3D' is asserted without evidence\u2014validate the orbital metaphor via reference work or research; (2) Custom WebGL needs assigned designer/shader artist\u2014no in-engine iteration; (3) Localization chain is unowned\u2014define who translates, reviews, and verifies eight-language parity; (4) Scope boundary of 'genuinely necessary' is undefined\u2014establish explicit asset and feature checklist; (5) Verify fallback parity through design work, not assumption. Verification and approval discipline is exemplary. Resolve ownership and validation gaps before code begins.",
        "not_building": "3D elements without demonstrated user-value justification, unverified localization, unowned translation/shader work, scope expansion beyond initial checklist, publication before design lock and role assignment."
      }
    },
    {
      "role": "Expansionist",
      "verdict": {
        "ok": true,
        "feedback": "Scope discipline and privacy-first architecture are solid. Attack: (1) WebGL + CSS fallback 'equivalence' is unspecified\u2014if design parity spec doesn't exist pre-build, this becomes hidden rework. (2) 'Deterministic shaders' is vague; unclear if it means reproducibility, no-external-includes, or shader-only math. Approach is sound but untested. (3) Mobile performance 'caps' (DPR, pause rendering offscreen) lack specifics; no device baseline or profiling harness mentioned. (4) 'Genuinely necessary bundled assets' is a scope loophole; needs pre-approved manifest. (5) Release gate depends on 'local Impeccable detector'\u2014verify tooling exists and works on this codebase. (6) Sequential verify \u2192 owner-approve creates deployment bottleneck and timeline risk. Recommendation: Pre-freeze fallback design spec with wireframes, define mobile perf budget with test matrix, pre-whitelist assets, confirm verification tooling, clarify owner-approval SLA before build start.",
        "not_building": "Decorative spinning logo, image reconstruction without reference, external Three.js/fonts/assets, unverified marketing claims, app changes, scroll-jacking, or publication without exact-SHA owner approval."
      }
    },
    {
      "role": "Outsider",
      "verdict": {
        "ok": true,
        "feedback": "Strong, constraint-respecting proposal. Design direction (orbital editorial, privacy-first) is coherent and differentiated. Build spec is precise: landing.html scope preserved, eight languages reused, fallback strategy explicit (CSS/SVG orbit if WebGL fails), verification sequence rigorous (hash-checked commits, Playwright tests, reduced-motion/no-JS coverage, owner SHA approval before publish). Accessibility well-specified (semantic markup, keyboard navigation of 3D layers, 44px targets, AA contrast, mobile performance caps). Zero external runtime enforced. Minor gaps: (1) Font strategy for 'zero external' undefined\u2014clarify system fonts vs. bundled subset impact; (2) Keyboard UX for 3D layer selection requires UX proof-of-concept before build (interaction model clear, implementation risk manageable); (3) WebGL complexity non-trivial\u2014confirm team experience. Fallback mitigates all risks. No overscope. Immutable release gate is disciplined.",
        "not_building": "Excluded: decorative spinning logo, external Three.js/CDN assets/fonts, unverified marketing claims, app code changes, scroll-jacking, publication without exact-SHA owner approval, image-reconstruction tasks."
      }
    },
    {
      "role": "Executor / Operator",
      "verdict": {
        "ok": false,
        "feedback": "Proposal demonstrates strong architectural discipline: bounded scope, eight-language preservation, deterministic local-only 3D with CSS/SVG fallback, comprehensive accessibility, and owner-approval gating are well-reasoned. Ready for pre-flight de-risking: (1) Verify team WebGL/shader capability; (2) Prototype 'five life areas' orbit concept to confirm clarity before build; (3) Define 'bundled assets' policy (fonts, SVG, JSON); (4) Set explicit Lighthouse/CWV targets for mobile; (5) Estimate timeline with 8-language QA and dual-review overhead. Critical: 'Personal Orbit' semantics must reinforce data-consolidation message, not confuse it. Design validation required before code starts. Once gaps closed, this has low technical risk.",
        "not_building": "Decorative spinning logo, image-reconstruction without supplied reference, external Three.js/fonts/CDN runtime assets, unverified marketing claims, app code changes, scroll-jacking, or publication without exact-SHA owner approval."
      }
    }
  ]
}
