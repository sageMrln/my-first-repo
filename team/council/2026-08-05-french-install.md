All measured. Writing the binding ruling.

---

# COUNCIL RULING — 2026-08-05 — FRENCH AS LANGUAGE #7
**Chairman. Binding. Kaito and Mikoto build from this.**
**Measured tip: `8e5605d`** (not `5b600c2` — the tip moved twice under the seats; every number below is re-measured by me at `8e5605d`, and where a seat was wrong I name them).

**Baseline I verified myself:** `node tools/release/green.js` → **exit 0, 32 sections**. `node tools/test/parse_test.js` → **85 passed, 0 failed**. `node tools/i18n/sync.js` → **MISSING: 0** (794 keys). The lock board is **empty** — Mikoto released. French dictionary cost **+123,868 B = +6.34%** (1,952,616 → 2,076,484), against the brief's estimate of 152–166 KB / 7.5–8.2%. **The brief's size estimate was 23–34% too high; French is cheaper than the council assumed.**

---

## (1) THE RULING

**SHIP FRENCH. Do not remove Français from the landing page.** But "shipped" means something narrower than what the pipeline currently implies, and the ruling defines it precisely.

**First, the premise this council was convened on has expired, and I will not let it buy urgency it no longer deserves.** The brief says the app has "ZERO French" and the landing claim is "a false factual claim at the point of sale." That was true at `5b600c2`. It is **not true at `8e5605d`**: Mikoto shipped 1,436 French keys at `5ca9e01`, and Kaito shipped period-word parser fixes at `8e5605d`. The emergency is over. What remains is a punch list, and a punch list must not be rushed on the emotional energy of an emergency that has already been fixed. **The Contrarian's R1/R2 split was correct reasoning applied to a state of the world that no longer exists.**

**Removal is dead, and the honest cost of it is why.** Removing Français costs 4 edits (landing.html:415 option block, :924 note branch, :957 auto-detect map, :958 whitelist) but discards 190 keys of French sales copy already authored and measured good, and permanently routes French-locale traffic — auto-detected at landing.html:956 — to an English page. In a product with **zero telemetry** (green.js phone-home scan: 11 published files, no external reference) that loss is unmeasurable and unrecoverable. Against that, French is already **the app's fifth-largest modelled tax country** (`index.html:7422` `['FR','🇫🇷 France']`, engine at 7526–7533 with barème, déduction forfaitaire, quotient familial, CSG/CRDS). We would be deleting the front door to a market whose finance engine we already built.

### "SHIPPED" MEANS, PRECISELY:
French ships as a **fully-translated INTERFACE language with an English-only command assistant, and the product says so in French.** That last clause is not a footnote — it is the condition that makes the whole thing honest.

Three things must be true before publish, and nothing else blocks:
1. **`langOpts()` offers French** (index.html:8684 — still 7 languages at this tip).
2. **`Connect` is not `Connexion`** — it currently tells French users the data-transfer tab is a login screen.
3. **The landing sentence stops claiming what we do not deliver**, and the app carries one new French key disclosing that assistant commands are English.

Everything else in this document is a ratchet, not a gate. I am deliberately refusing to let this become a 30-item pre-ship checklist, because a gate that expensive gets routed around within a week — which is worse than no gate.

---

## (2) DEFINITION OF DONE — what a language actually is

The First Principles seat's closure-property framing is right and I adopt it, with corrected assertions. **A language is not a dictionary plus a picker.** Measured, it is **fifteen sites**. This section is written so that language #9 is cheap.

| # | Property | Committed assertion | Status for fr |
|---|---|---|---|
| **P1** | **Selectable everywhere** | Assert every `<select>` and every generated option list contains all of `LANGS` | ❌ `langOpts()` |
| **P2** | **Dictionary parity over LIVE keys** | For each L: every key present in ≥1 other language **and present in app source** must exist in L | ❌ 4 keys |
| **P3** | **Numbers/dates read as L** | Currency locale derives from language, not currency | ❌ EUR→`de-DE` |
| **P4** | **Commands are safe** | An L sentence does the right thing **or nothing** — never a silent wrong write | ❌ (ruled: disclose, §4) |
| **P5** | **Questions reach the refusal** | `_Q_WORDS` covers L | ❌ no French |
| **P6** | **Period words are complete** | monthly **and quarterly and yearly** for L | ❌ quarterly |
| **P7** | **Claims are entailed** | Published language counts derive from `LANGS.length` | ❌ 4 sites say 7 |
| **P8** | **Typography renders** | Every codepoint in L's dictionary is in some inlined cmap | ✅ verified |
| **P9** | **No contamination** | Adding L changes nothing another language renders | ✅ differential |

**P4 and P6 are the only two that are destructive.** Everything else makes a French user read English words. P4 and P6 silently rewrite a paying customer's money. Rank them accordingly and never treat them as the same class of item again.

### THE THREE ASSERTIONS THAT LAND IN CODE

**A1 — Live-key parity (replaces the Contrarian's ≤6% byte-identical gate, which is broken as specified).**

The Contrarian proposed "every language ≤6% byte-identical to source." **Measured at `8e5605d`, French sits at 4.9% and PASSES — it gates nothing.** The Specialist caught this and was right. But the Specialist's own fix — "change the denominator to the union" — is **also wrong**, and this is the single most consequential correction in this ruling:

```
union keys:                 1,747
LIVE in app source:         1,397
DEAD (stale, no source):      350   ← 20.0% of the shipped dictionary
```

**350 of the union keys are dead weight** — English source strings that no longer exist anywhere in `index.html`, left behind in the other six dictionaries by earlier builds. A union-denominator gate would permanently flag French for failing to translate strings **that cannot be displayed**.

The correct assertion is over **live keys only**:
> For every `L` in `LANGS`: every dictionary key that (a) exists in at least one other language and (b) occurs as a literal in `index.html` outside the dictionary regions, must exist in `L`.

**A2 — Period-word matrix.** For each `L`, assert `_freq()` returns `monthly`, `quarterly` and `yearly` for that language's three period forms. This is a 24-cell table, and it is red today (§3).

**A3 — Picker parity.** Assert every language-selection control — `#lkLangSel`, `#langSel`, and the string returned by `langOpts()` — contains exactly `LANGS`. Three lines; catches P1 forever.

**What CANNOT be asserted, recorded honestly:** semantic correctness. `Connexion` is perfect French, in the dictionary, byte-different from English, on a live key — it passes every mechanical check ever proposed here and it is **wrong**. That is §8's problem, not §2's.

---

## (3) WHAT KAITO MISSED — every site, file:line

Kaito wired 2 pickers, `langLocale()`, and `sync.js LANGS`. He expected to be checked. He should be: **he missed nine sites, and two of them are money bugs he introduced or walked past in a function he was editing that same commit.**

### 🔴 MONEY — the two he walked past

**M1 — French quarterly is a 3× error. `index.html:5726`.** Kaito's `8e5605d` fixed the yearly line and did not look one line down.
```
if(/quarter|\/\s?q\b|kvartal|trimestral|vierteljähr|negyedév/iu.test(s)) return 'quarterly';
```
`trimestral` is **Spanish**. French is `trimestriel` / `trimestrielle` / `par trimestre` — none match. Measured on the live `_freq`:
```
fr "1200 trimestriel"     -> monthly   ✗ (should be quarterly — 3× overcount)
fr "1200 par trimestre"   -> monthly   ✗
fr "1200 trimestrielle"   -> monthly   ✗
```
This is the *identical class* of bug to the 12× error he just fixed and wrote three paragraphs of commit message about. Same function, same commit, one line apart.

**M2 — German and Hungarian quarterly are ALREADY BROKEN IN SHIPPED CODE, and the guard words are dead code.** The yearly test runs **first** and shadows the quarterly test:
```
de "1200 vierteljährlich" -> yearly    ✗  (yearly regex `jähr` matches first)
hu "1200 negyedévente"    -> yearly    ✗  (yearly regex `évent` matches first)
```
`vierteljähr` and `negyedév` sit in the quarterly regex and **can never be reached**. A German user logging a €1,200 quarterly bill (€400/mo) has it booked as €100/mo — a **4× undercount** feeding leftover, life tier, affordability and every savings projection. **This is not a French defect. It is a live money bug in two shipped languages, found only because we did French properly, and it is the single most valuable thing this council produced.**

### 🟠 WIRING — the seven he missed

| Site | What breaks if unfixed |
|---|---|
| **`index.html:8684` `langOpts()`** — 7 hardcoded pairs, no `fr`. Sole caller **`index.html:8541`**, the Smart Onboarding wizard | A brand-new French user meets this picker **before** Settings. At the one moment they choose a language, French is absent. Recon and the Contrarian both found this; **it is still unfixed at the tip.** |
| **`index.html:6090` `_Q_WORDS`** — no French question words | Verified live: `comment ça marche`, `pourquoi…`, `où…`, `aide`, `explique…`, `quel est mon surplus` all return `isQ=false`; da/de/es/hu/en controls all `true`. Worst case measured: **`combien je dépense 500` → `addItem "combien je dépense" @ 500 €/mo`. A French question creates a fake bill.** |
| **`index.html:2671`** `EUR:{sym:'€', before:true, loc:'de-DE'}` | A French user on EUR reads **German** grouping with the symbol **before**: `€2.600`. French is `2 600 €`. Note this is already wrong for de and es (€ is postposed in both) — French makes it 3 of 3, it does not cause it. |
| **applyLang has no `[aria-label]` pass** (`setAttribute('aria-label'` = **0 hits**) | 9 distinct aria-labels are **permanently English in all 7 languages**, regardless of dictionary. 5 have no entry in any dictionary at all. Accessibility, not cosmetics. |
| **`tools/test/allergen_i18n_test.js:107`** `LANGS = ['es','da','de','sv','nb','hu']` | Adding an 8th language adds **zero** test coverage. French silently widens an already-ratcheted failure without the ratchet noticing. |
| **`index.html:9013`** `APP_BUILD = '2026-06-27.1'`, gate at **`:9045`** | `if(STATE.lastSeenBuild===APP_BUILD) return;` — ship French without bumping this and **no existing user is ever told it exists.** |
| **`tools/i18n/sync.js:15`** — doc comment still reads "es, da, de, sv, nb, hu" | Next person to read the tool is told French isn't supported. Trivial, but it is the file that defines the gate. |

### 🟡 STRUCTURAL — pre-existing, French did not cause it, French does not fix it
- **`title=`: 25 distinct, 10 with no entry in ANY language** — incl. `index.html:1245 title="Language / Idioma / Sprache / Nyelv"` (four language names, no French), "Days in a row you've used MRLN", "Move earlier/later", "Sound on/off".
- **`placeholder=`: 45 distinct, 12 with no entry in ANY language** — incl. the assistant textarea's English command examples.
- **Apostrophe key drift**: source uses `What it’s for…` (U+2019); the dictionaries carry `What it's for…` (U+0027). The key never matches. Silent orphan in all 7.
- **Mikoto's own routed find** (`applyLang` fragment pass runs before the prose pass, so `pristine=(curN===key)` always fails and the prose path is permanently dead). **Kaito owns this. Do not fix it while the French composites are absent** — Mikoto is right that it would `innerHTML=__enHTML` and revert 23 French blocks to English.

---

## (4) THE FRENCH-SPECIFIC RULINGS

### 4.1 — **VOUS. Binding.**
Measured across all 1,436 French values: **335 vous/votre/vos, 0 genuine tu.** (A naive `/\btes\b/` reports 6 — all false positives, because JS `\b` is ASCII-based and matches inside `vous ê|tes`. The Specialist caught this and reported it against his own first number; that is exactly the discipline this council is for.)

The "the other six use informal, so French should" argument is **the weakest available** and I reject it. Informality is *unmarked* in Scandinavian and German consumer software; in French finance it is *marked-casual*. `CLAUDE.md`'s standing product-voice directive — "serious, not warm" — **is** `vous` in French; `tu` is precisely the warm register it forbids.

**Recorded because reversal is expensive:** 130 French strings carry a vous-imperative (`Ajoutez`, `Enregistrez`, `Choisissez`) which do not survive find-replace, plus 335 carrying `votre`→`ton`/`ta` where the choice depends on the gender of the following noun. **Reversal is ~380 strings re-translated — roughly a second full French pass.** Write the rule into `CLAUDE.md`; do not leave it implicit.

### 4.2 — Register DO / DON'T
The predicted "French drifts polite/commercial" risk **did not materialise**, and I say so because the evidence says so, not to be generous. Scanned all 1,436 values: `n'hésitez` **0**, `profitez` **0**, `bravo` **0**, `félicitations` **0**, `génial` **0**, `super` **0**. Exclamation marks: **2**, both inherited from English sources (`Nice!`, `Copied!`). One `Découvrez`.

| DON'T | DO |
|---|---|
| « N'hésitez pas à… » | bare imperative: « Ajoutez vos dépenses. » |
| « Profitez de… » / « Découvrez… » | « Voir », « Ouvrir », « Consulter » |
| « Bravo ! » « Continuez comme ça ! » | state the fact: « 12 jours d'affilée. » « Objectif atteint. » |
| « Oups ! Quelque chose s'est mal passé » | « Échec de l'enregistrement. » |
| exclamation marks; « on va… » chumminess | period; vouvoiement throughout |

Three fixes, not a register problem: `Découvrez` → `Voir`; `Bien!` → `Bien`; `✓ Copié!` → `✓ Copié` (and the English sources `Nice!` / `Copied!` should lose their bangs for all 7 — that is a product-voice fix Kaito owns).

### 4.3 — Domain terminology
**Verified native, not calqued** — this is the evidence talking: `leftover`→**reste** (not the calque *restant*), `Cut`→**Sèche**, `Bulk`→**Prise de masse**, `Maintain`→**Maintien**, `Cash Flow`→**Trésorerie**, `Savings`→**Épargne**, `streak`→**Série de jours**. These are the real French gym and finance terms. **Nothing of the Malay `blnnth` class is present; I looked for it specifically.**

| English | Ruling | Note |
|---|---|---|
| **Connect** | **`Transfert`** — NOT `Connexion` | 🔴 **Severity 1.** `Connexion` means **log in**. The tab moves data between devices (`📦 Déplacer mes données`). Compounded by `🔒 Verrouiller / Déconnexion` — we ship a *Connexion* tab and a *Déconnexion* button. A French user reads it as a login page and never opens it, so **the migration path that makes a single-file product survive a new phone is invisible to them.** `Appareils` is the other defensible choice; `Connexion` is not. |
| Checklist | `Liste de contrôle` | `Check-list` is off-register for paid finance |
| "une petite perte aide" | `perdre un peu de gras aide` | `perte` alone is vague |
| BMI "18.5 et 24.9" | `18,5 et 24,9` | but **do NOT** decimal-comma the 9 tax-rate hints (`par ex. 0.2506`) — those describe what to type into a field that expects a dot |

### 4.4 — Typography
- **Space before `? ! : ;` — 120 occurrences currently missing** (I measure 120; Specialist 117; the verifier 119 — a file in flux, all three are snapshots). Use **U+00A0 NO-BREAK SPACE**.
- **NEVER U+202F.** All 10 inlined woff2 faces lack it. This also blocks the naive EUR fix — flipping `loc` to `fr-FR` injects U+202F into **every money figure in the app**, because `(2600).toLocaleString('fr-FR')` emits it as the thousands separator.
- **Guillemets: the font risk does not fire.** Measured: **0** French values use `« »`, **47** use `“ ”`. Mikoto already avoided them unprompted. **Recon's Orbitron finding is factually correct and operationally moot** — do not "fix" this toward `« »`; it would need a font re-subset for zero user benefit.
- **Apostrophes: 275 of 1,436 French values use ASCII `'`, 1 uses `’`.** Every other language: **0 straight** (da 5). French is apostrophe-dense (`l'`, `d'`, `c'est`), so this is visible on nearly every screen and is the file's most systematic non-native tell. Normalise to `’`. *(Note the live landing sentence exhibits both defects: `anglais;` with no space, and `d'écran`/`l'app` straight.)*

### 4.5 — **THE PARSER: French command support does NOT ship in v1.**

**Measured at `8e5605d`, my own harness, EUR/fr-FR context: 19 of 20 ordinary French commands wrong. 12 of 12 controls (de/nb/da/es/hu/en) correct.**
```
mon revenu est 2600          -> addItem "mon revenu est"      2600 €/mo EXPENSE
je gagne 2600                -> addItem "je gagne"            2600 €/mo EXPENSE
je pèse 82 kg                -> addItem "je pèse kg"            82 €/mo EXPENSE
j'ai 41 ans                  -> addItem "j'ai ans"              41 €/mo EXPENSE
ajoute Gym 29 par mois       -> addItem "ajoute Gym"      (name corrupted)
supprime / annule / résilie  -> (null)  silent no-op
```
`LEX` (index.html:5691–5716, 25 groups) contains **zero** French. Kaito's `8e5605d` added French *period* vocabulary only.

**I rule AGAINST building a French LEX now, and the reason is not effort — it is that a LEX cannot work on top of the number parser we have.** Measured on the live `_num()`:
```
"1 200"     -> 1        "2 600,50" -> 2
"1200,50"   -> 120050   ← a €1,200.50 rent becomes €120,050/month
```
French is space-grouped and comma-decimal. **A perfect French lexicon sitting on this `_num()` buys a correctly-classified wrong number instead of a wrongly-classified wrong number.** That is not an improvement; it is a more convincing failure. `_num` is language-blind, so this equally affects da/de/es/sv/nb/hu today — **pre-existing, and French did not cause it.**

**So the ruling is: disclose, don't half-build.**

**Mikoto already made the correct call, unprompted, before any council seat did.** All 9 quoted assistant command examples in the French dictionary are kept in **English** (`“income is now 18000”`, `“add Spotify 99/mo”`, `“cancel Netflix”`), inside fluent French prose. Every other language translates all 18 of theirs. She found the parser hole by *running* it — the exact discipline the brief demands — and documented it in TEAM-CHAT before this council convened.

**What the UI must honestly say.** The current French text reads « Tapez un changement **en langage courant** » next to English examples. "Plain language" invites French input. **One new key closes it:**

> **« L'assistant comprend les commandes en anglais uniquement. Posez vos questions dans n'importe quelle langue. »**

That converts an apparent bug into a stated capability, costs one key and 0 KB, and is the only honest option available this week.

---

## (5) THE CLAIMS — every false or soon-false statement

| Site | Text | Status | Ruling |
|---|---|---|---|
| **`landing.html:924`** (fr branch only) | « …l'app elle-même est **entièrement traduite**. » | ⚠️ **Was flatly false at `5b600c2`; now overclaims in one specific, provable way** | **Must change.** The interface *is* now translated to Danish's standard. But a Danish buyer gets Danish commands and a French buyer does not, and this sentence sits **immediately above the price**, shown to someone **auto-targeted** by `navigator.language` (landing.html:956), not self-selected. Replace with: « Les captures d'écran sont en anglais. L'interface de l'app est entièrement traduite en français ; les commandes de l'assistant sont en anglais. » |
| `GUIDE.md:47` | "**Languages (7):** …" | ❌ on ship | → 8, add **Français** |
| `GUIDE.md:233` | "any of **7 languages**" (Q&A) | ❌ on ship | → 8 |
| **`GUIDE.md:240`** | "It **understands commands in all 7 languages**" | 🔴 **This one is a capability promise, not a count** | **My parser run disproves it for French.** Do **not** bump to 8. Rewrite: "…in English, Dansk, Deutsch, Español, Svenska, Norsk and Magyar. French command support is not yet available; the French interface is complete." |
| **`index.html:9019`** WHATS_NEW | "…now including Magyar (Hungarian), **7 languages total**." | ❌ **and worse** | This is a `sync.js`-tracked key, so **Mikoto has faithfully translated the wrong number into French.** Fix the English source; all 7 re-translate. |
| `index.html:1245` | `title="Language / Idioma / Sprache / Nyelv"` | ⚠️ | Add `/ Langue`, or drop the enumeration |
| `landing.html:914` `LOCSHOTS` | no `fr` → English screenshots | ✅ correct & disclosed | Leave. Line 915 says so explicitly. |
| `landing.html` "12 countries" | | ✅ **correct — leave alone** | `TAX_COUNTRIES` = 13 entries incl. `XX Other/generic` → 12 real. Recon checked this and was right. |

**Interim decision on the live sentence:** it is **no longer the emergency the brief describes** — the app is French now. It ships corrected **in the same release as French**, not as a separate hotfix. Splitting it into an R1 would reopen Akashi SAFE + Hugo GREEN across the whole publish set for a sentence that is currently *imprecise* rather than *false*. **The Contrarian's R1/R2 split was right at `5b600c2` and is wrong at `8e5605d`.**

---

## (6) WHAT WE ARE NOT BUILDING, AND WHY

- **A French command lexicon (`LEX`).** Not effort — arithmetic. `_num()` cannot read French money (§4.5). A LEX on top of it produces confidently-wrong numbers. Revisit only after `_num` is locale-aware.
- **French Q&A intents in `answerQuestion()`.** The standing ruling `team/council/2026-08-04-multilingual-assistant.md` measured non-English recall at 0%. Not re-litigated. But **French is currently strictly worse than the other six** — it doesn't reach the polite refusal at all, it reaches the *parser*. **Adding French to `_Q_WORDS` is in scope (§7 Stage 3) and is not the same thing as adding French intents.** One is a safety net; the other is a feature.
- **Translating `MEAL_DB`** (155 names / 212 tags / 559 ingredients). **0 of 926 are translated in *any* of the seven languages.** Counting it as a French defect would be dishonest and I will not.
- **A font re-subset for `« »`.** Zero user benefit — Mikoto used 0 guillemets and 47 curly quotes.
- **The Contrarian's ≤6% byte-identical gate as specified.** It passes French at 4.9% today. Replaced by A1.
- **The Specialist's union-denominator fix.** 20% of the union is dead keys; it would permanently flag French for not translating strings that cannot be displayed. Replaced by A1.
- **Localized French screenshots.** Real time cost, no money cost; the English fallback is disclosed. Osefe's call (§9), not a blocker.
- **Removing Français from the landing page.** §1.

**And one thing Osefe asked for that should not be built as asked.** Osefe said *"install french in the app."* Taken literally — dictionary in, picker on, done — that is exactly the model that produced the Danish-RENT-as-INCOME bug, the de/nb/hu corrupted examples, and the allergen filter that only works in English. **We are deliberately shipping French as a *partial* language with a written disclosure, rather than the complete one the instruction implies.** Shipping it as "installed" without §4.5's disclosure key would be the fifth time in 24 hours this team shipped a language feature that reads complete and silently corrupts money.

**And one about the process, which is Kaito's to answer, not mine to excuse.** `team/council/2026-08-05-theming-and-singapore.md:179` ruled: *"we do not ship a language we cannot proofread, cannot typeset, and have no demand evidence for."* French was added the next day. **Scored honestly: 1.5 of 3.**
- **Typeset — FULLY ESCAPED (1.0).** Verified, not taken: all 10 `@font-face` blocks declare `unicode-range: U+0000-00FF, U+0131, U+0152-0153…`. Latin-1 covers every French accent; U+0152-0153 covers `Œ/œ`. **French costs 0 KB in fonts.** Kaito genuinely cleared this ground.
- **Proofread — PARTIALLY escaped (0.5), and better than the ruling assumed.** The ruling's premise was "we cannot check." We *can*, in Latin script, and the Specialist did: no non-words, native domain terms, 100% register consistency. But it fired anyway — 120 punctuation errors and 275 apostrophe inconsistencies are unmistakably-unproofread text that `MISSING: 0` and `GREEN` cannot see. **That is the Malay lesson in French dress.**
- **Demand evidence — NOT escaped (0.0).** "The sales page already sells in French" is **supply** — our own prior decision — not demand. French has a *different and better* argument (a claim we made at point of sale), but that is not the ground the ruling named.

**I retire ground (ii) — demand evidence — outright, and I do it against the pro-French case, not for it.** Hungarian and Norwegian shipped under identical zero-telemetry conditions. A ground the team does not actually apply is not a standard; it is a weapon available to whoever wants to block something. **Strike it rather than enforce it selectively.** Grounds (i) and (iii) stand and are now backed by A1/A2/A3 and §8.

**This ruling is the amendment.** Record it as such. A standing ruling quietly overridden within 24 hours is worse than no ruling — and Kaito overrode it without saying he was. That is a process finding, and it is the correct outcome reached by the wrong route.

---

## (7) BUILD ORDER

**Does French ride RELEASE B or block it?** Neither, precisely: **French is already in the tree at the tip.** The question is whether the current tip is shippable, and it is not — for three small reasons. So: **French rides RELEASE B. Stage 1 is a ship blocker; Stages 2–4 are not.**

Each stage is independently revertible, green alone, and lands its test **in the same commit**.

### STAGE 0 — 🔴 MONEY, ships first, independent of French entirely
**Owner: Kaito.** `index.html:5726` — add French quarterly (`trimestriel|trimestrielle|par trimestre|/trim`) **and** reorder so the quarterly test runs **before** yearly, un-shadowing `vierteljähr` and `negyedév`.
**Test in the same commit:** `parse_test.js` gains the full 24-cell period matrix (8 languages × monthly/quarterly/yearly) — A2. Must include the guard case `add an item 500` → **monthly** (bare "an" is an English article), which Kaito already correctly protected.
**Differential required, not fresh assertions:** diff `_freq()` output over all 85 existing cases vs the prior tip. This fixes a **live 4× money error for German and Hungarian users** and should ship even if every other stage is abandoned.

### STAGE 1 — 🔴 THE SHIP BLOCKERS (three items)
1. **Kaito:** `langOpts()` `index.html:8684` — add `['fr','Français']`. **Test: A3**, asserting all three pickers against `LANGS`.
2. **Mikoto:** `Connect` → **`Transfert`**.
3. **Kaito + Mikoto:** the landing sentence (§5) + the one new French disclosure key (§4.5).
**Gate:** green.js exit 0; A3 green.

### STAGE 2 — 🟠 PARITY & HONESTY (same release, after Stage 1 green)
- **Kaito:** implement **A1** (live-key parity). It goes red on 4 French keys — arm it *after* Mikoto closes them, or it blocks its own landing commit.
- **Mikoto:** the 4 French-only live keys — `"e.g. Chest & Triceps"`, `"save & backup tips"`, `"Sports & hobbies 🏀"`, `"Total tax & contributions"`. **All four contain `&`; that is not coincidence, it is an HTML-entity escaping miss and the root cause should be found, not just the four keys patched.**
- **Kaito:** `GUIDE.md:47/233/240`, `index.html:9019`, `index.html:1245`, `sync.js:15`, **and bump `APP_BUILD`** — otherwise no existing user is ever told French exists.
- **Kaito:** add `'fr'` to `allergen_i18n_test.js:107` (expect the ratchet baseline to move; that is the point).

### STAGE 3 — 🟡 SAFETY NET (may ship after)
- **Kaito:** French question words into `_Q_WORDS` (`comment|pourquoi|combien|où|quel|quelle|explique|aide|est-ce que`). This does **not** add French intents — it routes French questions to the existing polite refusal instead of to the parser. **Test: assert `isQ=true` for 8 French probes and that none reaches `parseClause`.**
- **Mikoto:** the NBSP pass (120 sites) + apostrophe normalisation (275 values) + the four §4.3 terminology fixes.

### STAGE 4 — 🟢 DEFERRED, NAMED, OWNED (so nobody "discovers" it later)
Kaito owns all of these; none blocks French: the `EUR` locale (`index.html:2671` — fixes fr, de **and** es in one line, but **verify U+202F renders on a real device first**); the 13 hardcoded `'en-GB'` call sites; the `[aria-label]` pass in `applyLang`; the dead prose path Mikoto routed; the 350 dead dictionary keys (**a 20% cleanup opportunity in a file whose size is the product**).

**Sequencing against the rest of the board:** Stage 0 is orthogonal to task #23 (allergen fail-open) and the 4-phase root migration and should not wait for either. **Do not begin the root migration mid-French** — it touches every published artifact and would reopen every sign-off in this document.

---

## (8) EVIDENCE PLAN

### AUTOMATED (lands in `green.js`)
| Check | Catches |
|---|---|
| **A1** live-key parity | a language shipping with English holes |
| **A2** 24-cell period matrix | the 12× and 4× money errors |
| **A3** picker parity | `langOpts`-class misses |
| `_Q_WORDS` coverage per `LANGS` | questions falling into the parser |
| Existing `sync.js` MISSING gate | **keep, but relabel** |

**`MISSING: 0` must stop being quoted as coverage.** Measured: `sync.js` tracks **794** keys; the live dictionary is **1,397** keys. **MISSING: 0 certifies 57% of the translatable surface.** Kaito's own `green.js` comment says this; the sign-off ritual does not. **Mikoto's report is the proof it matters: she found the 794 was really 1,436 and translated the other 642 herself, unprompted. Had she trusted the gate, French would have shipped with English section headings and a truthful `MISSING: 0`.** Rename the section to `i18n coverage (gated subset — 794 of 1,397 live keys)`.

### CANNOT BE AUTOMATED — recorded human checks
No assertion catches `Connexion`. It is fluent, correct, byte-different, on a live key. **Semantic correctness is not mechanically decidable and we must stop pretending the gate approximates it.**

**How we catch a Malay-class failure in a language we cannot natively proofread — the four checks, in cost order:**

1. **The reverse-translation spot check (highest value, ~30 min).** Sample **40 keys stratified by surface**: 10 nav/tab labels, 10 button/action labels, 10 money/health figures, 10 destructive-action confirmations. Translate each French value **back to English blind** — without seeing the source key — then diff against the real key. **`Connexion` → "Login" ≠ "Connect" fails instantly.** This is the only check in this document that would have caught the Severity-1 defect, and it is cheap. **Make it mandatory for every new language.**
2. **Destructive-path render walk (mandatory, human, recorded).** Every string that gates an irreversible action — delete, import-overwrite, reset, lock-out — read in French **in a browser**. A mistranslated confirmation is the one class where a wrong word costs a customer their data. Mikoto already did the 320px layout walk and reported real numbers (badge 100.0px, nav 1574→1817px, tab heights unchanged); **that is the standard, extend it to semantics.**
3. **The Malay 95.8% detector.** The first Malay build shipped `blnnth` and `dalamside`; the *redo* was worse — `team/logs/mikoto.md:735-740` records 124 keys hand-translated, **652 left as English**, "render-check passed", parked a month at 95.8% byte-identical before deletion at `5d9fda4`. **A1 over live keys catches exactly that**, and unlike the ≤6% proposal it cannot be passed by a language that is 20% absent. French today: 4 live keys short.
4. **What we still cannot catch, stated plainly.** Fluent, plausible, *semantically wrong* French on a key outside the 40-key sample. There is no mechanical defence. The mitigation is that French is Latin-script and Osefe can read enough of it to sanity-check a rendered screen — which is precisely why ground (i) of the Singapore ruling scores 0.5 for French and stayed 0.0 for Malay.

---

## (9) DECISIONS THAT ARE GENUINELY OSEFE'S

1. **`vous` or `tu`?** — **Recommend `vous`**, binding unless he overrides. *Cost of reversing: ~380 strings re-translated (130 imperatives + 335 vous/votre carriers), roughly a second full French pass. **The window to change this is before Stage 3, not after.*** If the target market is under-30 French consumers rather than serious personal finance, `tu` is defensible — but say so now.
2. **Ship French with English-only commands, or hold until French commands work?** — **Recommend ship.** *Cost of holding: French users keep an English app (which works) for an unscoped multi-cycle period, because fixing it honestly means making `_num()` locale-aware first, which I have not priced. **NOT VERIFIED — nobody scoped it.*** Cost of shipping: the disclosure key must be exactly right, and the landing sentence must be corrected in the same release.
3. **Localized French screenshots (`LOCSHOTS`)?** — **Recommend no, for now.** *Cost: French buyers see English screenshots on the sales page with a French note explaining it — a real conversion cost we cannot measure with zero telemetry. Building them costs Mikoto/Arthur time and 0 money; the other six languages have them.*
4. **Keep auto-switching French visitors on the landing page?** — **Recommend keep.** *Cost of keeping: French buyers are auto-targeted rather than self-selected, so every claim on that page is held to a higher standard — which is why §5 is a ship blocker. Cost of removing: we own 190 keys of good French sales copy and would show it to nobody.*

---

## (10) OWNERSHIP & GATE SEQUENCING

| Owner | Scope | Items |
|---|---|---|
| **Kaito** | codes everything | Stage 0; `langOpts`; A1/A2/A3; `_Q_WORDS`; all count claims; `APP_BUILD`; `sync.js:15`; allergen `LANGS`; all Stage 4 |
| **Mikoto** | i18n exception, direct | `Transfert`; the 4 `&` keys; the disclosure key; NBSP ×120; apostrophes ×275; §4.3 terms |
| **Akashi** | security only | poison/watchdog coverage over any new French-touching code; confirm no French dictionary value breaks a slice-extract-`new Function()` suite (**NOT VERIFIED by any seat — untested ground**) |
| **Arthur** | director, no code | redline the corrected landing sentence and the disclosure key for product voice |
| **Hugo** | gate, no app logic | `GREEN` on the tip; rebuild GUIDE + PDF after §5 |
| **All council seats** | **read-only — including me** | This ruling is a spec. No seat implements it. |

**Freeze/gate sequencing.** Stages 0 and 1 both move `index.html`; **they are separate commits but ONE freeze candidate** — signing Stage 0 and then landing Stage 1 reopens the gate anyway (this has bitten the parser ~4×). Land 0 and 1, *then* open Pending. **Only one lock at a time:** Kaito holds `index.html` for Stage 0+1, releases, Mikoto takes it for her items, releases, Kaito takes it back for Stage 2. **Mikoto's Stage 2 keys must land before A1 is armed, or A1 fails on the commit that introduces it.**

**Sign-off order is the standing pipeline, steps 7–11:** Mikoto `MISSING: 0` → Kaito spot-checks meaning (**not coverage** — run the 40-key reverse-translation of §8.1, and check `Transfert` specifically) → Hugo `GREEN` → Akashi `SAFE` → **Osefe's explicit go.** Sleep-mode rules hold: nothing publishes without it, every time.

---

### SCOREBOARD — who was wrong, and the correct number

| Who | Claim | Correct |
|---|---|---|
| **Specialist (French)** | French is **305 keys** short; "131 short-chrome keys a French user sees on first paint" | ❌ **4.** The French-only live gap is 4 keys. |
| **Executor** | **343** keys | ❌ **4.** |
| **Outsider** | **352** keys | ❌ **4.** |
| **All three** | counted the union (1,747) | **350 union keys (20%) are DEAD** — no source string exists. **Mikoto deliberately excluded them and was right**; her TEAM-CHAT note calls them "the 352 orphans." The seats measured her correct judgement as her defect. |
| **Contrarian** | "the assistant-example key that will print French commands is in Mikoto's queue **right now**" | ❌ **Refuted.** All 9 quoted examples kept English; `need_translate.json` is empty. |
| **Contrarian** | dictionary-without-lexicon is "**measurably** worse than shipping nothing" | ⚠️ **Overstated.** `parseClause` never reads `prefs.lang` — the 19/20 failure rate is identical with or without the dictionary. The *exposure* argument stands; "measurably" is unearned in a zero-telemetry product. |
| **Contrarian** | ≤6% byte-identical gate | ❌ **Passes French at 4.9% with keys missing.** Gates nothing — same failure as the contrast guard. |
| **Specialist** | fix it with the **union** denominator | ❌ Would permanently flag French over 350 undisplayable keys. **Live keys.** |
| **Recon** | Orbitron lacks `« »` — a French typography risk | ✅ **Fact correct, conclusion moot.** 0 guillemets used, 47 curly quotes. |
| **Recon / Contrarian** | `langOpts()` missing `fr` | ✅ **Both right, and it is STILL unfixed at `8e5605d`.** |
| **Kaito** | "dictionary + 2 pickers + `langLocale` + `LANGS`" | ❌ **15 sites.** Missed a third picker, `_Q_WORDS`, the whole `LEX`, `aria-label`, `APP_BUILD`, the allergen ratchet, 4 published claims. |
| **Kaito** | fixed `_freq` yearly at `8e5605d` | ❌ **Missed quarterly one line below** — and walked past a live **4× money error in German and Hungarian** in the function he was editing. |
| **Kaito** | "French escapes all three grounds" of the Singapore ruling | ❌ **1.5 of 3.** Typeset 1.0, proofread 0.5, demand 0.0. |
| **Mikoto** | — | ✅ **Right on every load-bearing call, and first to each.** Found the parser hole by *running* it; kept command examples English unprompted; ruled `vous` on landing-page evidence; excluded the 352 dead keys; measured 320px with real numbers; came in at **+123.9 KB, 23–34% under** the council's own estimate. **She was ahead of this council on its central question.** |
| **The brief** | a full language costs 152–166 KB / +7.5–8.2% | ❌ **+123,868 B = +123.9 KB = +6.34%.** |

**The answer to the central question.** No — a complete language is not a dictionary plus a picker. It is **fifteen sites**, of which the dictionary is one and the two that can destroy customer data (`LEX`/`_freq`, `_Q_WORDS`) are not gated by anything that says `MISSING: 0` or `GREEN`. And **the proof that this council was necessary is not French at all** — it is the German and Hungarian quarterly bug, live in shipped code, invisible to 32 green sections, found only because we stopped reading the file and started running it.