# CHAIRMAN'S RULING — Multilingual Assistant MRLN

**Measured against the working tree at HEAD `7a5d43b` + Mikoto's uncommitted index.html edits, 2026-08-04. Every number below I ran myself.** Harness: `/tmp/claude-0/-home-user-my-first-repo/e030d617-b115-5fc0-91bc-2cc1fcd777ae/scratchpad/h.js` (extracts all three live slices), `en.js` (published 40-case English battery). Read-only; no repo file touched.

---

## (1) CORE TENSION

The hard thing is not translating a lexicon — that is 140 bytes per concept per seven languages, measured off the live `LEX` block (3,504 B / 25 groups / 414 alternates, index.html:5685–5711), and the file is 2,080,224 B raw / 742,368 B gzipped, so the entire job is well under 1% and size is a dead argument. The hard thing is that **this codebase has no mechanism for being confidently wrong on purpose.** The Quick-Update parser is permissive *because* every parse is shown to the user before it mutates anything (`showProposal`, index.html:6117/6144, Apply handler at 6124); the Q&A path has no such gate (`showAnswer`, index.html:6136, terminal). So the same permissiveness that made the parser scale to 7 languages becomes a wrong-answer generator when copied into Q&A. Layered on top: three *disjoint, contiguous* test slice windows (meal 4908–5162, parser 5671–5854, assistant 5878–6095) mean the two lexicons physically cannot see each other, and `I18N` (6614) is inside none of them — so the "obvious" architectures (one shared union lexicon; put question words in the dictionary) are not merely inelegant, they throw `ReferenceError` and turn the gate red. And the highest-severity defect on the table is not in the Q&A at all: `normTerm` (index.html:5107) deletes every non-ASCII letter, and it sits under the allergy filter at index.html:5269.

---

## (2) THE RULING — the goal, restated so it can be tested

**"Fluent" is the wrong word and I will not adopt it.** A rule engine bounded by 27 intents (19 `MRLN_HELP` + 8 `answerData`) is not fluent, cannot become fluent without an LLM, and an LLM is forbidden by a published privacy claim that is worth more than the feature. Osefe is right that the assistant must *feel* alive; he is wrong that "fluent" is the achievable form of that, and telling him so is the point of this seat.

**The goal is PARITY, plus an honest failure mode.** Whatever MRLN can do in English it does identically in all seven, it never states a wrong fact confidently, and when it does not understand it *asks* instead of dead-ending.

### The MRLN Parity Bar v1 — five machine-checked numbers Hugo signs

| ID | Assertion | Today (measured by me) | Ship bar |
|---|---|---|---|
| **B1 PARITY** | Committed matrix of 27 intents × 7 languages × 3 phrasings (567 probes) resolves to the **correct intent ID** | en 82.5%, es/da/de/sv/nb/hu **0%** | ≥95% overall, **≥90% per language individually** |
| **B2 NO-WRONG** | Probe returns a *different* intent than expected | en 15% (6/40), non-en 12% (5/41, all 5 wrong) | ≤2% overall; **exactly 0** for `privacy`, `keys`, and any allergen path |
| **B3 NO-DEAD-END** | Probes returning `'I am unable to answer that at the moment, please look it up on your browser then return.'` | 36/41 non-English | **0** |
| **B4 NO-STEAL** | Committed 7-language command battery (≥70 cases) where `answerQuestion()` returns `null` so the parser runs | 8/8 Spanish `mi …` commands **swallowed** | **100%** |
| **B5 TYPO-SAFETY** | Single-error mutations (insert/delete/substitute/**transpose**) of every committed lexicon word ≥5 chars either resolve to the right slot or refuse | `ost→oat`, `sajt→salt`, `tej→tea`, `belly→bell` all fire today | ≥85% resolve, remainder refuse, **cross-slot corrections = 0 (hard zero, not a target)** |

### What Osefe should be able to recognise, in three sentences

> Type a question in Danish, Spanish, German, Swedish, Norwegian or Hungarian — in your own words, with your own typos — and MRLN answers with **your** numbers, exactly as it does in English.
> When it isn't sure, it says so in your language and shows you the questions it *can* answer, instead of telling you to go look it up in your browser.
> It never guesses a number it isn't sure about, and it will never turn "loan" into "salary" or "cheese" into "oats" because you mistyped one letter.

### Does a cheaper design get most of the value? Partly — and I rule on it explicitly.

The Contrarian's chooser (localized chips for ~12 canonical questions, intent-ID routed, no regex) is **ruled IN and is mandatory** — because 43 of 43 `t()`/`tf()` answer literals in the assistant slice are already translated with **0 missing in all 6 gating languages** (I re-ran this: sync.js reports `MISSING: 61`, and all 61 are `ms`, which is parked). The expensive half is shipped and unreachable; a chooser is the cheapest reliable key.

But the chooser is **not a substitute** for the lexicon, and I reject that framing. The measured non-English number is **0% correct recall on 41 probes** — that is a lexicon gap, not a UX gap. Replacing free text with a menu would be a direct downgrade against Osefe's "more AI-like" order and would be visibly *less* capable than the Quick-Update parser sitting three lines away in the same widget. **Ruling: union lexicon for free text, chooser as the failure mode.** Both. The chooser is what B3 is measured against.

---

## (3) THE ARCHITECTURE — decided, final

### 3.1 The language boundary sits at OUTPUT ONLY

Input matching **never** reads `STATE.prefs.lang`. Three measured reasons, in order of weight:

1. **Users type across languages.** A Dane running the UI in Danish types `netflix`, `gym`, `salary`. A German with the app in English types `Einkommen`. Gating input on a UI preference breaks the commonest real case.
2. **The harness cannot supply it.** `tools/test/assistant_test.js:14` builds its sandbox as `function t(s){return s;} ${src.slice(a,b)}` — no `STATE`, no `MODEL`. Anything keyed on `prefs.lang` is untestable there, or falsely guarded.
3. **Maintenance.** 7 tables × 8 intents = 56 units vs 8 strings, and `sync.js` sees neither.

Output stays exactly as it is: `t('English source')` / `tf('English source', {vars})`, literal first argument, dictionary keyed by the English source string. **Not one answer string moves.**

### 3.2 Data structure for question lexicons: `QLEX`, authored per-language, compiled to a union

Authoring shape ≠ matching shape. `sync.js` (tools/i18n/sync.js:26,36) can only see `t()`/`tf()` literals, `data-i18n` attributes and `WHATS_NEW` — I verified an object literal is invisible to both regexes — so the authoring shape is *free*, and the only shape a coverage counter can check mechanically is per-language:

```js
var QLEX = {
  q_afford: { en:'afford|can i (?:buy|get|have)|enough for',
              es:'permitirme|puedo comprar|puedo pagar|me alcanza|alcanza para',
              da:'har jeg råd|råd til|kan jeg købe|rækker (?:mine )?penge',
              de:'leisten|kann ich mir|reicht (?:es|das|mein)',
              sv:'har jag råd|råd till|kan jag köpa|räcker (?:mina )?pengar',
              nb:'har jeg råd|råd til|kan jeg kjøpe|rekker (?:pengene|lønna)',
              hu:'megengedhetem|futja|van rá pénzem|meg tudom venni|telik' },
  q_spend:{…}, q_left:{…}, q_howlong:{…}, q_biggest:{…},
  q_income:{…}, q_savings:{…}, q_weight:{…}
};
var _QU = {};   // compiled once at load
Object.keys(QLEX).forEach(function(k){
  _QU[k] = Object.keys(QLEX[k]).map(function(L){ return QLEX[k][L]; }).join('|');
});
```

Matched with the existing leading-boundary semantics (`_WB` at index.html:5712, `_re` 5713, `_has` 5717). **Budget: 8 slots × ~148 B/slot (measured from live LEX: 3,504 B / 25 groups = 140 B, +~8 B/slot for the per-language object) ≈ 1.25 KB raw, 0.06% of the file.**

### 3.3 THE PLACEMENT RULING — and the correction that saves a red gate

**Specialist (typo tolerance) is wrong, and this is the single most expensive error in the advisory set.** The recommendation was "declare `_fold`/`_dl` above line 4908 so all three slices see them." The slices are **contiguous windows**, not a prefix scan. `meal_test.js:21` starts at `html.indexOf('  var MEAL_DB=[')` = byte 551180 = line 4908. Anything declared *above* 4908 is **outside** the meal slice. I verified membership for all three windows: no single declaration site is inside more than one.

| symbol | line | in meal slice (4908–5162) | in parser slice (5671–5854) | in assistant slice (5878–6095) |
|---|---|---|---|---|
| `normTerm` / `fuzzyCorrect` | 5107 / 5122 | ✅ | ❌ | ❌ |
| `LEX` / `_WB` / `_re` / `_has` | 5685 / 5712 / 5713 / 5717 | ❌ | ✅ | ❌ |
| `MRLN_HELP` / `answerData` / `_Q_WORDS` | 5878 / 6003 / 6079 | ❌ | ❌ | ✅ |
| `I18N` | 6614 | ❌ | ❌ | ❌ |

**Ruling — the shared-primitives block.** Declare the text primitives **once**, physically just above `MEAL_DB`, wrapped in explicit markers:

```
/* >>> MRLN-SHARED-TEXT >>> */   _fold, _fold2, _dl (Damerau), _slotIndex helpers   /* <<< MRLN-SHARED-TEXT <<< */
```

Every suite that needs them **extracts that block by marker and prepends it to its own slice** — a 3-line change to `meal_test.js`, `parse_test.js`, `assistant_test.js`, `assistant_silly_test.js`, `price_test.js`. Zero duplication in the product, zero widening of any slice window, no coupling between suites. This is the correct fix and it is cheap; the alternative (duplicating the primitive three times) guarantees drift.

**Ruling — `LEX` and `QLEX` stay separate.** The Strategist's "ONE language-agnostic union lexicon" is rejected on two measured grounds: (a) `LEX` is in the parser slice and `QLEX` must be in the assistant slice, and moving `LEX` breaks `parse_test.js`'s own anchors — that suite is now **62 cases** and is the most valuable committed asset we have; (b) I measured **8 existing cross-slot collisions** inside `LEX` (`new|neu|neue|neues|nuevo|nueva|új` between `add`/`newWord`; `to` between `to`/`chg`). A shared lexicon means a Q&A recall tweak can silently change how a Dane's loan command parses. Accept ~600 B of duplication; pay for it with a committed **drift test** that reads index.html as text and asserts every `QLEX` slot with a `LEX` counterpart is a superset of it.

### 3.4 The invariant that governs everything: **two signals or nothing**

> A single lexicon token may never be sufficient evidence for a decision. Every intent requires ≥2 independent signals (concept word + number/second concept/slot), or an exact anchored phrase.

This is not theory — it is the measured cause of the live `mi` bug. `_Q_WORDS` (index.html:6079) is `^`-anchored and gates on **one** token, so the Hungarian question word `mi` swallows Spanish possessives. I ran 8 Spanish commands: **8/8 swallowed by `answerQuestion`, 8/8 parse correctly in `parseClause`** (`mi salario es 30000`→`setIncome`, `mi coche 300 al mes`→`addItem`, `mi peso es 82`→`setBody`, `mi nombre es Osefe`→`setProfile`, …). A Spanish user cannot set their income with the most natural phrasing and is told to go use their browser.

### 3.5 Precision fixes in the KB matcher — these come first and cost ~0 bytes

`MRLN_HELP` is **19 intents / 139 keys (138 unique) / 29 keys under 5 characters**, matched by unbounded `s.indexOf(k)>=0` (index.html:6087) with a **strict** `sc>bestScore` tie-break (6088), so array order wins ties. Measured consequences:

| question | scores | returns | why |
|---|---|---|---|
| `is my data private?` | food[**ate**] idx 8 · privacy[private] idx 16 | **Food Log blurb** | no boundary + strict tie-break |
| `what is the weather tomorrow?` | food[**eat**] | **Food Log blurb** | the out-of-scope guard itself fails |
| `what happens if I lose this file?` | install[**app**] | **Install blurb** | " |
| `how do loan payments work?` | income[**pay**] idx 0 · loan[loan] idx 2 | **Income blurb** | strict tie-break, array order |
| de `sind meine Daten privat?` | food[**ate**] ⊂ D-**ate**-n | **Food Log blurb** | already exported to 4 languages |

**Three fixes, no new lexicon:** (a) word-bound the matcher with the existing `_WB`/`_WA` semantics; (b) replace the tie-break with **longest matched key wins**, never array order; (c) require `mi` in `_Q_WORDS` to be followed by a Hungarian continuation, or drop it.

### 3.6 Typo tolerance — where, and with what thresholds

**Applied at lexicon lookup only.** Never at string normalization (that is `_AI_TYPOS`, index.html:5981–5997, 20 hand-written English literals — scaling that to 7 languages means ~140 colliding rules), and never at sentence level.

```
L1  exact match on _fold(s)                     — the majority of the win, zero fuzzy cost
L2  exact match on the _fold2 alias index        — the lazy speller (lan→lån, lon→løn)
L3  bounded Damerau-Levenshtein, on failure only — len<4: no fuzzy. len 4–6: max 1. len ≥7: max 2.
L4  AMBIGUITY REFUSAL — if candidates within threshold span >1 semantic slot, RETURN NULL.
```

**The fold table is V2, digraph-FIRST.** I tested all three variants against every single-word alternate in the live `LEX`:

| fold | cross-slot collisions | new collisions introduced |
|---|---|---|
| raw (today) | 8 | — |
| **V1, NFD-first** (`ø→o`, then strip marks) — *the Strategist's stated table* | **10** | `lag` (add↔low), `ar` (years↔chg) |
| **V2, digraph-first** (`ß→ss, æ→ae, ø→oe, å→aa, ä→ae, ö→oe, ü→ue`, then NFD) | **8** | **none** |

**Strategist is wrong on the fold table; Specialist is right.** V1 collapses Swedish `är` (chg) into `år` (years) — a slot flip on every duration question. V2 also matches how users without the key actually type (Aarhus, Muenchen, Goeteborg). **Adopt V2. The `_fold2` collapse (aa→a, oe→o, ue→u) exists only as an alias index, and is safe only because L4 applies to it.**

**Damerau, not Levenshtein.** Shipped `lev()` (index.html:5114) has no transposition rule and `fuzzyCorrect` uses `thr = term.length<=7 ? 1 : 2` (5124). Measured: `lev('chikcen','chicken') = 2` → **rejected**; Damerau = 1 → accepted. `bannana→banana` works. So the shipped engine rejects the commonest typo class while accepting genuinely dangerous substitutions.

**L4 is the load-bearing line.** The committed `belly→bell` fix (index.html:5120–5121) encodes the lesson *positionally* ("sub-tokens never correct"), which is a proxy. I verified the single-word case still fires: `fuzzyCorrect('belly', true)` → `'bell'`, and `belly` matches **16 of 155 meals** (Egg-white veggie omelette, Stuffed bell peppers, …) with **zero guard cases in `meal_test.js`**, which passes 12/0. The real invariant is semantic, and one rule kills the whole family: `belly→bell`, `ost→oat`, `sajt→salt`, `tej→tea`, `lån↔løn`, `weight↔height`.

### 3.7 Anti-tamper coverage

`QLEX`, the fold ladder and the chooser routing touch **no figures**, so there is nothing new to poison in them. The invariant that does matter:

> **Every new answer string that emits a number multiplies through `__sys.token()` at the point of formatting, exactly as `answerData` does today** (`var T=__sys.token()` at index.html:6007; `money(groupTotal(hitCat)*T)`, `Math.round(w*T*10)/10`, `leftOver()` already ×token at 3101).

The chooser's one-field prompts feed `_priceFrom` → `answerData`, which is already inside the poisoned path — so the chooser inherits poison for free. **Akashi's gating check:** a committed assertion that with `__sys.token()` stubbed to `NaN`, every answer containing a digit renders `NaN` or refuses. That assertion does not exist today.

---

## (4) WHAT WE ARE NOT BUILDING, AND WHY

**Directed at Osefe's own orders first, because that is where agreement has to be earned:**

- **"Fluent in every single language."** Not building it, because it cannot be built by the mechanism we have and an LLM is off the table by his own (correct) ruling. The honest ceiling is 27 intents. He gets **parity + an honest failure mode**, measured by the five numbers in §2. If "fluent" appears in marketing copy at $9.99/mo it is a refund liability — see §7a.
- **"100x its knowledge… compare from general knowledge."** Not building baked-in general knowledge. It cannot be corrected offline, it goes stale in a file customers hold for months, and being confidently wrong about the world is exactly the failure mode we are trying to eliminate from the *finance* answers. What "100x" actually buys, measured: non-English recall 0% → target ≥90%, which is an infinite multiple of nothing.
- **"There must be no mistakes, no regression."** I am telling him plainly that we are currently at **15% confidently-wrong in English** and **0% correct in six languages**, with all four suites green. "No mistakes" is not the current baseline, so the honest promise is *fewer* mistakes with a hard zero on the three categories where a mistake is a trust event.

**Engineering paths ruled out:**

- **No LLM, online or local.** Online breaks the zero-request privacy claim, which is the product. Local is impossible in a 2.08 MB single file.
- **Do NOT translate the 139 `MRLN_HELP` keys before the boundary fix.** Adding six languages of keywords to an unbounded `indexOf` with 29 keys under 5 characters multiplies the false-positive surface. `ate ⊂ Daten` is already live in de/da/nb.
- **No `_AI_TYPOS` × 7.** ~140 hand-written literal rules that will collide with each other.
- **No shared parser/Q&A lexicon** (§3.3).
- **No per-language input tables keyed on `prefs.lang`** (§3.1).
- **No Soundex / Metaphone / keyboard-adjacency.** Rejected on definition: both are English-consonant-inventory algorithms and would split `sz`/`zs`/`cs`/`gy`; adjacency requires knowing QWERTY vs QWERTZ vs three Nordic variants, which we cannot know offline without asking.
- **No raising the fuzzy threshold to rescue Hungarian.** Any threshold loose enough to help is loose enough to merge `lån`/`løn`. Long words get `max 2` *only* because L4 refuses ambiguity.
- **No global `fuzzyCorrect` reuse.** It is a 530-token **ASCII-only** vocabulary (`normTerm` strips non-ASCII), reachable only from `expandTerm`→`termMatchWord` in the meal path, and never from the Q&A path at all.

---

## (5) BUILD ORDER — independently revertible, each green alone

Every stage lands its test **in the same commit**. Nothing here touches published bytes until §7d is answered.

| # | Change | Files | Committed test in the same commit |
|---|---|---|---|
| **S0** | **Make the allergen leak visible to the gate.** No `index.html` change → no lock needed, zero regression risk, and a later fix has something to prove itself against. | `tools/test/allergen_i18n_test.js` **(new)**, `tools/release/green.js` (wire it) | 10 allergens × 6 languages = 60 assertions, each `hides(local) >= hides(en)`. Ships **RED-listed as xfail** with the count printed (`39/60 hide ZERO`), so the number can only go down. |
| **S1** | **Precision, ~0 KB.** Word-bound the `MRLN_HELP` matcher (6087); longest-key tie-break (6088); resolve `mi` in `_Q_WORDS` (6079). | `index.html`, `tools/test/assistant_topic_test.js` **(new)** | Replaces truthiness with **expected-intent-ID**: 40 English + the 6 known wrong answers as guards + all 8 Spanish `mi …` commands must return `null`. Plus a **differential** vs the prior tip's output over all 40+41 probes (CLAUDE.md's "prefer a differential" rule) — word-bounding *will* lose some currently-lucky compound hits and every delta must be inspected. |
| **S2** | **The allergen fix.** `_fold` replaces `normTerm`'s ASCII strip in the food path; multilingual allergen aliases appended to `FOOD_SYN` (~40 terms × 6 ≈ 1.5–2 KB). | `index.html` (shared-text block + `FOOD_SYN`), `tools/test/meal_test.js`, `tools/test/allergen_i18n_test.js` | S0's 60 assertions flip xfail→pass. **Plus** the missing guard: `fuzzyCorrect('belly')` must not return `'bell'`; `ost`/`sajt`/`tej` must not correct. Harness change: extract `/* >>> MRLN-SHARED-TEXT >>> */` by marker and prepend (§3.3). |
| **S3** | **`QLEX` union lexicon**, 8 slots × 7 languages (~1.25 KB) + multilingual `_PRICE_STOP`. | `index.html`, `tools/test/qa_lang_test.js` **(new)** | The 567-probe matrix (§6). B1/B2 asserted per language. |
| **S4** | **The chooser** replaces the dead-end string. ~12 canonical questions as chips, intent-ID routed, `t()` literals so `sync.js` counts them; 4 of them open a one-field numeric prompt. | `index.html`, `tools/test/chooser_test.js` **(new)**; then Mikoto → `MISSING: 0` | B3 = 0 dead-ends across the full 567-probe matrix. Chip labels asserted present in all 6 dictionaries. |
| **S5** | **The typo ladder** L1–L4 (~1.9 KB, net ~+1 KB after replacing `lev`/`fuzzyCorrect`). | `index.html` (shared-text block), `tools/test/typo_test.js` **(new)** | B5. Every committed lexicon word ≥5 chars × 4 mutation classes; **cross-slot corrections asserted `=== 0`**. |
| **S6** | **`LEX-MISSING` counter** — brace-match `var QLEX = {` exactly as sync.js already brace-matches `var I18N = {` (sync.js:57–76), `new Function()` it, assert every slot has a non-empty entry for en + the 6 gating languages, and `new RegExp(alt,'iu')`-compile each so a stray paren fails the gate instead of a customer's browser. | `tools/i18n/sync.js` | Prints a second line; Mikoto's sign-off becomes `MISSING: 0` **+** `LEX-MISSING: 0`. `ms` stays non-gating, matching today. |
| **S7** | **Parser gaps found on the way** — `LEX.remove` += `avslutt` (nb); `LEX.month` += `havonta|havi` (hu). | `index.html`, `tools/test/parse_test.js` | The 3 real misses I measured, **plus the first Spanish cases the suite has ever had** (§6). |

**S0 and S1 are the highest value per byte in this entire document and should not wait on anything.**

---

## (6) MUST-NOT-BREAK + THE EVIDENCE PLAN

### Invariants (violating any = the stage is reverted, not patched)

1. **`answerQuestion()` returns `null` for every command in every language.** It runs *before* `parseInstructions` (index.html:6115–6117) and the fallback is non-null, so any recall gain that isn't paired with a must-NOT-hit battery trades a broken Q&A for a broken editor. Measured today: **0 of 41 non-English questions return null** — the parser never sees them.
2. **No answer string leaves `t()`/`tf()` with a literal first argument.** A computed key is invisible to `sync.js` and therefore to Mikoto's gate. 43/43 assistant literals are translated today with 0 missing in the 6 gating languages — that number must never regress.
3. **Cross-slot fuzzy corrections = 0.** Hard zero. `lån`/`løn`/`lön`, `loan`/`lohn`, `weight`/`height`, `age`/`wage`, `év`/`név` are a block list, not a distance decision.
4. **Every number in every answer multiplies through `__sys.token()`.**
5. **No new automatic network request.** Zero, verifiable in a customer's network tab.
6. **Committed guard cases are never deleted.** `parse_test.js` is at 62 and only goes up.
7. **Slice windows are not widened.** Shared code arrives via the marker block, not by moving anchors.

### The matrix — intent × language × typo (the new committed evidence)

- **`qa_lang_test.js`** — 27 intents × 7 languages × 3 phrasings = **567 probes**. Each asserts an **intent ID**, not truthiness. This is the direct fix for the gate blindness I confirmed: `assistant_test.js:21` is `const ok = wantAnswer ? !!r : !r`, and it passes 16/0 today while `is my data private?` returns the Food Log blurb and `how do loan payments work?` returns the Income blurb — a case that suite *explicitly asserts must answer*.
- **Command battery** — ≥70 cases, 7 languages, asserting `answerQuestion(x) === null`. Seeded with all 8 Spanish `mi …` cases.
- **`typo_test.js`** — every committed lexicon word ≥5 chars × {insert, delete, substitute, transpose} → resolves-to-correct-slot or refuses; cross-slot count asserted 0.
- **`allergen_i18n_test.js`** — 10 allergens × 6 languages, `hides(local) >= hides(en)`.
- **`parse_test.js`** — Spanish cases added. It has **62 cases, 20 Hungarian, and 0 Spanish**. Spanish is the only sold language with zero parser coverage, and it is the language with the live `mi` regression.

### Where the advisors were wrong — corrected numbers, on the record

- **Contrarian: "English classifier is 32% correct / 29% confidently wrong."** Refuted. My published 40-case battery on the live engine with `answerData` actually executing: **33 correct (82.5%), 6 confidently wrong (15%), 1 dead-end**. The likely artifact is that `answerData` self-disables outside a browser (index.html:6005 guards on `__sys`/`MODEL`/`leftOver`/`GRAND`), which is exactly the condition in `assistant_test.js`'s sandbox. **The six wrong answers are real and individually verifiable; the rate was not.**
- **Contrarian: "`_priceFrom` returns NaN in de/es/sv/hu, so the affordability trigger backfires."** Overstated. **With a currency token it returns 4000 in all seven**, including hu `4000 kr-t`. It returns `NaN` only for a *bare* number: de `kann ich mir 4000 leisten?`, es `puedo permitirme 4000?`, sv `har jag råd med 4000?`, hu `4000-et`. en and da work bare (because `til` is in `_PRICE_STOP`). The fix is multilingual `_PRICE_STOP` + a Hungarian numeral-suffix strip, and it must ship in the same commit as S3 — but the claim as written would have scared the council off a change that mostly works.
- **Contrarian: "non-English fails safely."** Refuted. **5 of 41 non-English probes get an answer and all 5 are wrong** — de/da/nb privacy questions all return the Food Log blurb via `ate ⊂ Daten/data`, and sv `hur mycket spenderar jag per månad?` returns the Expenses blurb via `spend ⊂ spenderar`. The wrong-answer machine is already in six markets.
- **Strategist: "NFD-first fold, `ø→o`, digraph collapse."** Wrong table, measured: **V1 introduces 2 new cross-slot collisions (`lag` add↔low, `ar` years↔chg); V2 digraph-first introduces 0.** Adopt V2.
- **Strategist: "ONE union lexicon shared by parser and Q&A."** Architecturally impossible without moving anchors (§3.3), and undesirable given 8 existing cross-slot collisions inside `LEX`.
- **Specialist: "declare `_fold`/`_dl` above line 4908 so all three slices see them."** Measurably wrong — above 4908 is *outside* the meal slice, which starts at 4908. This would have reddened `meal_test.js` on the first commit. Corrected in §3.3.
- **Recon: "hu `a jövedelmem 30000` mints a fake bill; `parse_test.js` has 21 cases, 0 hu."** Stale. `LEX.income` already carries the `jövedelm` stem (someone fixed it), that case now returns `setIncome`, and `parse_test.js` is at **62 cases with 20 Hungarian**, including `check('a jövedelmem 25000','setIncome')` at line 60. The two hu cases that *do* mint fake bills are `megtakarítok 2000 havonta` and `félreteszek 2000 havonta` → `addItem "Add megtakarítok — 2.000 kr/mo"`; cause is `LEX.month` having `hónap` but not `havonta|havi`, not the save verbs. Plus nb `avslutt Netflix` → `null` (`LEX.remove` has sv `avsluta`, not nb `avslutt`). **54/57 parser coverage across 7 languages.**
- **Specialist: 65% allergen fail-open.** **Confirmed exactly, and understated.** 10 allergens × 6 languages: **39/60 (65%) hide ZERO meals the English term hides; 48/60 (80%) hide fewer.** `æg`→`"g"`, `nüsse`→`"n sse"`, `tojás`→`"toj s"`, `mjölk`→`"mj lk"`. `ost`→`oat`, `sajt`→`salt`, `tej`→`tea` all confirmed live. `meal_test.js` passes 12/0 with the assertion *"no meal containing a category synonym escapes the category dislike"* — English synonyms only.

### What CANNOT be automated — recorded human checks, named owner, in TEAM-CHAT

1. **Native-speaker read of the chooser chips and all 43 answer strings, in context, on a phone, per language.** A machine can check presence, not naturalness. Mikoto cannot self-certify six languages as a native and must say so. — *Mikoto, recorded per language.*
2. **Hungarian layout at 320px.** hu is the longest-string language in the dictionary; the chip row must not blow the widget. — *Arthur spec, Kaito implements, human screenshot.*
3. **Physical allergen entry in a real browser** — type each of the 6 languages' term for all 10 allergens and confirm zero leak. The automated test calls the same `normTerm` the product does, so a shared bug hides in both. — *Hugo, recorded matrix.*
4. **Poisoned-copy check.** Tamper a copy, confirm every number in every new answer renders `NaN` or refuses. — *Akashi, recorded.*
5. **In-app-webview pass** (`IN_APP_BROWSER`, index.html:2813 — TikTok/IG/Messenger): chip tap targets and the one-field prompt keyboard. — *Hugo.*
6. **CPU on a real low-end Android.** The Specialist measured 13.7 µs/token on a Xeon and honestly declined to extrapolate. Neither will I. L3 is a fallback pass so a well-formed command never pays it, but this needs one real phone. — *Hugo, recorded device + number.*

---

## (7) DECISIONS THAT ARE GENUINELY OSEFE'S

**a. The word "fluent" in customer-facing copy.**
*Recommendation:* don't use it. Say **"MRLN answers questions about your money and your health in 7 languages, offline."** *Cost of the alternative:* "fluent" is falsifiable in one message by any customer who asks something outside 27 intents, at $9.99/mo, in a product whose entire pitch is honesty. If it is already drafted anywhere, pull it before ship, not after. — *Route to Maki via Kaito.*

**b. The refusal voice.** Today the dead-end reads *"I am unable to answer that at the moment, please look it up on your browser then return."* — it sends a paying customer to a competitor's search box.
*Recommendation:* replace with a factual clarifier + chips, in the serious register: **"I'm not certain what you meant. I can answer these:"**. *Cost of the alternative:* keeping it means B3 can never be 0 and the assistant's worst moment stays its most-seen string in six languages.

**c. Allergy disclaimer.** The Food Log dislike list is used as an allergen filter and today fails open 65% of the time in non-English.
*Recommendation:* fix it (S0+S2) **and** add one factual line — *"Dislikes filter suggestions; they are not a medical allergen check."* *Cost of the alternative:* fixing the leak without the line implies a guarantee we cannot make about a 155-meal database with free-text ingredients, in a paid product, in a health context.

**d. Ship S0+S1 as a hotfix ahead of RELEASE A, or hold and bundle.**
*Recommendation:* **hold.** RELEASE A is frozen at `58127f4` and root-migration phase 0 (`3561e09`/`2bff172`) has already armed the deploy map; the council's own ruling was that RELEASE A ships alone so a routing rollback stays attributable. Adding an assistant diff to that window re-opens the freeze and makes any bug report in it unattributable — the exact failure the migration ruling was written to prevent. *Cost of holding:* `is my data private?` keeps answering with a calorie blurb in en/de/da/nb for the length of RELEASE A. *Cost of not holding:* the most cache-sensitive change this product will ever make gets a confounded rollback. **This is his call and I will not make it for him — but I recommend holding, and I recommend RELEASE A ships promptly precisely so S0/S1 can follow immediately.**

---

## (8) OWNERSHIP AND SEQUENCING

### Find-xor-fix assignment

| Stage | Codes | Reviews / signs |
|---|---|---|
| S0 allergen test | **Hugo** (test-only, his area; no `index.html`, no lock) | Kaito verifies the 39/60 count himself |
| S1 precision + `mi` | **Kaito** | Arthur (does the tie-break change any *visible* answer the user was relying on?) → Akashi SAFE → Hugo GREEN |
| S2 allergen fix + `FOOD_SYN` aliases | **Kaito** | Mikoto supplies the 40 × 6 allergen terms **as data to Kaito** — this is vocabulary, not `data-i18n`/dictionary work, so it does **not** fall under her direct-edit exception. Kaito lands it. |
| S3 `QLEX` | **Kaito** | Mikoto authors the per-language alternate strings, hands them to Kaito |
| S4 chooser | **Kaito** codes; **Arthur** specs the chip layout, order and 320px/hu behaviour first; **Mikoto** translates the chip labels (these ARE `t()` literals → her lane, direct edit) |
| S5 typo ladder | **Kaito** | Akashi reviews the ambiguity refusal as an integrity property |
| S6 `sync.js` `LEX-MISSING` | **Mikoto** (her gate, her tool) | Kaito verifies it actually fails on a deliberately-broken `QLEX` |
| S7 parser gaps | **Kaito** | Hugo re-runs `parse_test.js` |

**Akashi's standing security exception applies to exactly two things here:** the `__sys.token()` coverage of any new number-emitting answer, and the poisoned-copy assertion. Everything else he routes to Kaito. **Arthur does not code.** **Mikoto's direct-edit lane is `t()`/`tf()` literals, `data-i18n` wiring and the dictionary — `QLEX` alternates and `FOOD_SYN` aliases are handed over, not committed by her.**

### Sequencing against work in flight — nothing may be destabilised

1. **Mikoto holds the `index.html` i18n-block lock right now** (`7a5d43b`, final RELEASE A string). **No stage in this document starts until that lock is released.** S0 is the only exception and only because it touches no `index.html`.
2. **RELEASE A is frozen at `58127f4`.** Per freeze-the-candidate, any `index.html` commit re-opens it and forces Akashi and Mikoto to re-sign the new tip. Nothing from S1–S7 lands until RELEASE A ships or Osefe explicitly re-scopes it (§7d).
3. **Root migration phases 1–3 own the deploy map and the service worker.** No stage here touches `tools/publish/deploy_map.json`, `deploy.js`, `preflight.js` or `routing_test.js`. S6 touches `tools/i18n/sync.js` only. Phase 3 will need `landing.html:608`/`:655` retranslated when `mrln.online` semantics change — that is Mikoto's, and it is **separate work**; do not let it be folded into this.
4. **One lock at a time, one live instance per role.** S0 (Hugo, tests) and an Arthur spec pass for S4 can run in parallel with each other because they are different roles and different files. **Nothing else parallelises** — S1 through S7 all touch `index.html`.
5. **Every stage gets its own sign-off round against an explicit SHA.** If the tip moves, the gate re-opens. Sleep-mode runs may reach Pending; **nothing publishes without Osefe's in-thread "ship it."**

---

**Chairman's closing note, on the record.** Osefe is right about the two things that mattered most and I want that stated as evidence, not courtesy: refusing the online LLM was correct — it would have made this trivially fluent and destroyed the zero-request privacy claim that *is* the product — and his instinct that the assistant is not good enough is correct, just aimed one layer too high. He is wrong that "fluent" is the target and wrong that "no mistakes" describes where we start from: **15% confidently wrong in English, 0% correct in six languages, 65% allergen fail-open, and four green suites that can see none of it.** The most valuable thing in this document is not the lexicon. It is that a `10 × 6` assertion file and a word boundary would have caught all of it, and nobody had written them.