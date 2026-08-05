# CHAIRMAN'S RULING — Baked Colour Literals (Topic A) & Singapore Support (Topic B)

**Chairman:** Council seat, read-only. **Tip measured:** `874d709`. **Baseline:** `node tools/release/green.js` → **exit 0, VERDICT ✓ GREEN, 28 sections** (re-run by me, not taken on faith). **File:** `/home/user/my-first-repo/index.html`, 9,742 lines, 2,080,224 bytes (2,032.6 KB).

Everything below was re-measured by me from the file. Where an advisor was wrong I name them and give the number.

---

## (0) WHERE THE ADVISORS WERE WRONG — corrected numbers, on the record

| Claim | By | Verdict | Correct number (my measurement) |
|---|---|---|---|
| "34 colour literals outside the palette blocks, ~14 genuinely hardcoded" | **Kaito** | **WRONG, 2.2× low** | **74** literal occurrences on 54 lines (90 raw regex hits − 16 `#1234` handle-placeholder false positives at `index.html:1472` and its translations inside `:6620`). Excluding lines 52–125 and the 11 base64 font lines. |
| "roughly 20 of those are already `rgba(var(--accent-rgb),…)` tokens" | **Kaito** | **CATEGORY ERROR** | Token form never matches a colour-literal regex, so it was never in the 74. `var(--…)` colour references number **383** across `--cyan` 147, `--lime` 90, `--amber` 68, `--cyan-dim` 41, `--red` 37; `rgba(var(--…))` alone appears **80** times. |
| The hardcoded set is `#06121a`×3, `#08121f`×2, … | **Kaito** | **INCOMPLETE** | Omits `#08131f`×2 (`:7655`, `:7665`) — a near-twin hex a value-exact grep misses; omits `#eaffff`, `#021019`×2, `#0c1c2e`/`#081320`, `rgba(120,200,255,.1)`, `rgba(2,8,16,.78)`, `rgba(3,7,14,.86)`, `rgba(3,7,14,.92)`, `rgba(0,229,255,.12)`, and `#03070e`×3. |
| "#medCompare is the specific defect" | **Osefe** | **REAL, BUT NOT WORST** | `#medCompare` measures `--txt` at **1.36 iceblue / 1.41 kawaii / 2.10 landing**. The guide modal at `:8889` measures **1.01 / 1.04 / 1.01**. `.catsw.sel` measures **1.06 / 1.20 / 1.09**. Osefe reported a genuine WCAG failure; two others are worse. |
| "`#eaffff` → `var(--bright)`" at `:8377` | **Arthur (Design Specialist)** | **WRONG — would regress** | `--bright` on `--cyan-dim` = **3.16 landing, 3.21 iceblue, 3.59 kawaii, 3.62 green** — *worse* than the `#eaffff` it replaces (5.20 / 4.98 / 4.55 / 3.67). Correct fix in §1.4. |
| "`:473 .catsw` → `var(--bright)`/`var(--txt)` resolved per-surface" | **Recon** | **NOT IMPLEMENTABLE** | One CSS declaration cannot resolve per-surface. Arthur's `.catsw.none` companion class is the only working answer, and I adopt it. |
| "three scrims" / "four tinted scrims" | **Arthur** / **First Principles** | **BOTH UNDERCOUNT** | **Five**: `:979`, `:1113`, `:1185` (tour spotlight — named by neither seat), `:8887`, `:9263`. |
| "37/60 allergen terms fail open (62%)" | **Contrarian** | **DIRECTIONALLY RIGHT** | My own harness (extracted `index.html:4908`→`:5162`, 155 meals, 530-word vocab, smoke-tested `pork`=4): **38/60 fail open (63.3%)**, **48/60 hide fewer (80%)**. Matches the Verifier exactly. The standing ruling's 39/60 and the Contrarian's 37/60 differ only by wordlist. |
| "if CPF cannot be represented, a translated UI over a wrong model is worse" | **The brief's own premise** | **PREMISE FALSE — does not fire** | CPF **is** modelled: `index.html:7539` `sg_cpf=0.20*Math.min(gross, taxAdv('sg_cpfcap',88800))`, relief at `:7540`, breakdown line at `:7542`, user-editable ceiling at `:7615`, disclosed limits at `:7545`, and `tools/test/tax_test.js:117-124` asserts it (6 assertions, `eff ≈ 22.7%`). See §2.3. |
| "SGD absent → mixed-currency output" | **Contrarian** | **RIGHT ON THE FACT, WRONG ON THE CAUSE** | `index.html:7428` forces `ccy=TAX_CCY[c]` for **every** country, so a DKK-preference user picking US tax already sees `$`. Mixed-currency is by design app-wide; SG/KR are special only because the matching currency is **unreachable**. Adding SGD does not fix mixed output — it makes alignment *possible*. |

Two things multiple seats measured independently and converged on, which I reproduced and confirm: the **74/80 literal counts**, and the **1.01/1.04/1.01 guide-modal ratios**. That convergence is evidence, not an echo, because the methods differed.

---

## (1) TOPIC A — THE RULING

### 1.1 Is the colour work worth doing now? **Yes — and the scope Osefe reported is a third of it.**

This is not taste. Nine tokens are defined in all 10 palette blocks (`index.html:53-125`; I parsed and diffed every block — `--bg, --panel, --panel2, --line, --cyan, --cyan-dim, --lime, --amber, --red, --txt, --txt-dim, --bright, --field-bg, --accent-rgb, --pos-rgb, --line-rgb, --warn-rgb, --bad-rgb, --accent-2, --on-accent, --accent-text, --glow-strength` are **10/10**; only `--glow` is `:root`-only and that is correct because its value is a lazy token stream resolved at the use site). The literals are the bug; the token system is sound.

**The defect is a WCAG failure on the three light themes**, and in two places it is *functional*, not cosmetic: on `landing`/`iceblue`/`kawaii` the user cannot see **which colour swatch is selected** (`:475`, ratio 1.06–1.20) and cannot read **the first screen after setup** (`:8889`, ratio 1.01–1.04).

**Scope: 23 edit sites in `index.html` + 1 static file.** Not 4, not 14, not 18.

### 1.2 The elevation question, settled

The brief's premise that "modal elevation is achieved with a hardcoded darker navy" is **false of the app's actual modal system**. `index.html:982` `.modal{background:linear-gradient(180deg,var(--panel2),var(--panel))}` is byte-identical to `.card` at `:490`; modals separate by scrim + `0 20px 60px` shadow, which is correct and rethemes perfectly. **No new elevation token. `--elev`/`--surface-raised` are not built.** The guide modal at `:8889` is a rogue modal that failed to reuse the committed recipe. Arthur is right and I adopt his finding.

Arthur also tested a derived self-inverting fill `rgba(var(--line-rgb),.4)` against `var(--field-bg)` and reported that his preferred design **lost** on text (8.12 vs 8.98 worst-case) and decisively on border contrast (1.84 vs 2.68). Reporting the loss of the idea you liked is the standard this council is for. `var(--field-bg)` wins.

### 1.3 The complete replacement table

**STAGE 1 — CSS only, cannot break the JS parse.**

| # | file:line | literal | → replacement | element | measured today → after |
|---|---|---|---|---|---|
| 1 | `index.html:475` | `outline:2px solid #fff` | `var(--bright)` | `.catsw.sel` selection ring | 1.06/1.20/1.09 light → **13.77–19.32 all 9** |
| 2 | `index.html:473` | `color:#06121a` | **KEEP** + `/* THEME-EXEMPT: sits on the PALETTE swatch fill, not a theme surface */` and add `.catsw.none{color:var(--txt)}` | swatch glyph | ✕ glyph on Default swatch 1.03–1.37 on 6 dark themes → **8.84–14.83**. Wire at `index.html:3212-3218`: `class="catsw'+(c[1]?'':' none')+(sel?' sel':'')+'"` |
| 3 | `index.html:539` | `rgba(255,255,255,.055)` | `rgba(var(--line-rgb),.5)` | `.item-row` divider — primary list structure app-wide | **1.000 on all 3 light themes** (invisible) → 1.114–1.272 |
| 4 | `index.html:997` | `rgba(255,255,255,.06)` | `rgba(var(--line-rgb),.55)` | `.panel-legal` top rule | same class |
| 5 | `index.html:798` | `background:rgba(8,19,31,.5)` | `rgba(var(--line-rgb),.4)` | `.ss-zone` — **translucent by design**, keep translucent | self-inverts correctly |
| 6 | `index.html:819` | `background:rgba(8,19,31,.66)` | `rgba(var(--line-rgb),.5)` | `.lk-guide` install card | same |
| 7 | `index.html:2424` | `background:#08121f` | `var(--field-bg)` | **`#medCompare` — the reported defect**; border `var(--cyan-dim)` unchanged | `--txt` 1.36/1.41/2.10 → **13.38–15.21 all 9**; `--lime` (the `<b>` at `:8397`) 2.98 → **6.32–15.15** |
| 8 | `index.html:2495` | `background:#08121f` | `var(--field-bg)` | `#deviceTip` — identical defect | identical |
| 9 | `index.html:979` | `rgba(3,7,14,.78)` | `rgba(0,0,0,.78)` + `THEME-EXEMPT: neutral scrim` | `.modal-back` | max Δ 11/255 on the darkest theme, 0 elsewhere. **Alphas unchanged.** |
| 10 | `index.html:1113` | `rgba(3,7,14,.92)` | `rgba(0,0,0,.92)` + marker | `#onboard` | max Δ 13/255 |
| 11 | `index.html:1185` | `rgba(3,7,14,.78)` | `rgba(0,0,0,.78)` + marker | `#tourRing` spotlight — **named by no seat** | as above |

**STAGE 2 — JS string concatenation. Isolated so a red `html_parse_test` points at exactly one commit.**

| # | file:line | literal | → replacement | element | measured today → after |
|---|---|---|---|---|---|
| 12 | `index.html:8889` | `linear-gradient(160deg,#0c1c2e,#081320)` | `linear-gradient(160deg,var(--panel2),var(--panel))` | **guide modal — worst defect in the app**, fires at `:8843` immediately after setup | heading 1.01/1.04/1.01 → **10.49–17.04**; body 3.02–3.15 → **5.73–7.21 all 9** |
| 13 | `index.html:8888` | `rgba(120,200,255,.1)` | `rgba(var(--line-rgb),.55)` | guide row divider | tinted ice-blue → tokenised |
| 14 | `index.html:8887` | `rgba(2,8,16,.78)` | `rgba(0,0,0,.78)` + marker | guide backdrop | neutral |
| 15 | `index.html:8893` | `color:#021019` | `var(--on-accent)` | `#guideDone` on `var(--cyan)` | 3.04/3.25/3.83 light (**fails AA**) → **5.03–12.34 all 9** |
| 16 | `index.html:8866` | `color:#021019` | `var(--on-accent)` | `#nagGo` on `var(--cyan)` | identical |
| 17 | `index.html:8377` | `background:var(--cyan-dim);border-color:var(--cyan);color:#eaffff` | `background:var(--cyan);border-color:var(--cyan);color:var(--on-accent)` | selected media rating chip | **Arthur's `--bright` would have regressed it to 3.16.** `#eaffff` today: 3.67–6.91. After: **5.03–12.34 all 9.** |
| 18 | `index.html:7655` | `background:#08131f;border:1px solid var(--line)` | `background:var(--field-bg);border:1px solid var(--cyan-dim)` | DK Forskudsopgørelse card | `--line` on `--field-bg` is 1.26–1.92 (below the 3:1 non-text floor on **every** theme); `--cyan-dim` gives 2.68–5.40. Magenta stays at 2.68 — that is a `magenta --cyan-dim` palette issue (`#AE0849`), **not a regression**, since today it is 2.62. |
| 19 | `index.html:7665` | same | same | over/under-estimate simulator — **fires for every country except `XX`, not DK-only** | identical |
| 20 | `index.html:9263` | `rgba(3,7,14,.86)` | `rgba(0,0,0,.86)` + marker | `#bdayPop` backdrop | neutral |
| 21 | `index.html:9264` | `rgba(0,229,255,.12)` | `rgba(var(--accent-rgb),.12)` | birthday card gradient — literal is cyber's `--cyan` verbatim | rethemes |

**STAGE 3 — DEFERRED, separate commit. Platform chrome; no CSS reaches it.**

| # | file:line | literal | ruling |
|---|---|---|---|
| 22 | `index.html:17` | `<meta name="theme-color" content="#03070e">` | Add one line inside `applyAppearance()` (`index.html:6914-6938`, before `window.__appearanceBooted=true`) writing `cssVar('--bg')` into the meta tag. `cssVar()` already exists at `:2627`. I confirmed `applyAppearance()` touches neither the meta tag nor the manifest — grep for `theme-color|themeColor` returns line 17 only. |
| 23 | `index.html:9658` | `background_color:'#03070e', theme_color:'#03070e'` | Generated webmanifest — derive from `cssVar('--bg')` at generation time. |
| 24 | `manifest.webmanifest:8-9` | `#03070e` ×2 | **Static file. It cannot follow a runtime theme and must not pretend to.** Ruling: change both to a **neutral, theme-agnostic** value, not a cyberpunk navy. This is a *published file* — editing it reopens Akashi's SAFE and Hugo's GREEN across the whole publish set (`green.js` leak-scans it at `tools/release/green.js:181`). That is why Stage 3 is separate. |

### 1.4 PERMANENTLY EXEMPT — tokenising these ships new bugs

Each gets an inline `/* THEME-EXEMPT: <reason> */` (or `<!-- -->` in an HTML attribute; ~70 bytes × 6 hard cases ≈ **0.4 KB on 2,032.6 KB = 0.02%**). First Principles is right that the marker must be **inline**, not an allowlist file keyed by line number — line numbers drift on every edit and an external list is dead on arrival. I adopt that mechanism.

- **`index.html:468, :469`** `#06121a` on `var(--tabtint)` — `--tabtint` is set inline per-tab at `:3150` from `PALETTE` (`:3144-3145`), **not a theme colour**. Measured: `#06121a` on the 8 swatches = **6.38–15.15**; `--on-accent` (which is `#FFFFFF` on the three light themes) on the Lime swatch `#7CFFB2` = **1.25**. A naive sweep ships a 1.25:1 tab label.
- **`index.html:473`** — see table row 2.
- **`index.html:2531`, `:7775`** `#fff`/`#000` — QR scanability. A themed QR code is an unscannable QR code.
- **`index.html:3058, :3060, :3062, :3065`** `rgba(8,0,3,.97)`, `#ff3b5c`, `#ff003c`, `#ff8aa0`, `#7a2233` — `__sys` tamper `banner()` (function at `:3054`, poison at `:3051`). Must render against a **stripped or tampered stylesheet**; hardcoding is the security-correct choice. **This is Akashi's code, not Kaito's — Kaito does not touch it, he only adds the marker if Akashi signs off.**
- **`index.html:991`** `#fff` on a `var(--red)` gradient — correct on all nine `--red` values.
- **`index.html:309, :310, :845, :846`** `#000` inside `mask-image:radial-gradient()` — alpha stops, not visible colour.
- **`index.html:136`** `rgba(14,28,51,.05)/.07` — inside the LIGHT-MODE FX GATE block, scoped to `landing`/`iceblue`/`kawaii` only. **Correct by scoping.**
- **`index.html:181, :471, :730, :736, :762, :1116, :1187`** — neutral `rgba(0,0,0,…)` shadows and one `drop-shadow(… #000)`. Theme-agnostic by construction.
- **`index.html:2627`** `'#888'` — `cssVar()` fallback. **`index.html:2932, :8864, :8865, :8867, :8891`** — `var(--x, fallback)` form, correct CSS.
- **`index.html:3144-3145`** `PALETTE` — content data, not style.
- **`index.html:6895`** `#ff5c7c` — i18n audit outline behind `auditMode` (`:6893`), dev-only.

### 1.5 THE ENFORCEMENT MECHANISM — `tools/test/theme_contrast_test.js`

**No committed test touches colour today.** I grepped all 243 lines of `tools/release/green.js` for `colou?r|#[0-9a-f]{6}|hex|palette|theme` — **zero hits**; across `tools/`, only `tools/guide/build-guide-pdf.js` matches. A prior pass tokenised ~150 literals and **74 survived**. Without a guard this recurs a third time.

New file `tools/test/theme_contrast_test.js`, wired into `green.js` as a new section. Four assertion groups:

1. **Token completeness.** Parse the 10 palette blocks (`index.html` between `/* ===== PALETTES` and `/* ===== LIGHT-MODE FX GATE`). Assert all 22 tokens present in 10/10. `--glow` is the single named exemption with its reason in the test. *(Currently passes — this pins it.)*
2. **Property-aware literal scan.** For every line outside the palette block and outside base64 font lines, walk back from each colour literal to the nearest `;`/`{`/`cssText=` boundary. If the owning property is a **surface** property (`color`, `background`, `background-color`, `border*`, `outline`, `fill`, `stroke`, `caret-color`, `text-decoration-color`), the line must carry `THEME-EXEMPT:`. Otherwise **RED**. Depth properties (`box-shadow`, `text-shadow`, `filter`, `drop-shadow`, `mask-image`) pass only if the literal is neutral (`#000`/`#fff`/`rgba(0,0,0,a)`/`rgba(255,255,255,a)`) — a *tinted* shadow or scrim is a theme surface in a costume. This is First Principles' rule and it is why the property test drops all 16 `#1234` false positives **naturally**, with no value-based hack.
3. **The pinned contrast table.** For each `(element, foreground token, background token)` pair listed in §1.3, compute WCAG across all 9 themes and assert **≥ 4.5 for text, ≥ 3.0 for non-text**. This is the part the property scan cannot do: it catches a substitution that is *legal but wrong* — exactly the `--bright`-on-`--cyan-dim` = 3.16 error Arthur made.
4. **The exemption's assumption, machine-checked.** Assert every `PALETTE` swatch at `index.html:3144-3145` gives **≥ 4.5** against `#06121a`. Today: 6.38–15.15. The day someone adds a dark swatch, this goes RED instead of shipping an invisible tab label.

**On sequencing the guard — I rule against Recon and partly with the Contrarian.** Recon put the guard **last**, as step (7). A guard authored after the fix is authored to pass the fix, and the surviving-74 count is what that approach already produced. The Contrarian wants guard-first-RED, which costs a whole release cycle. **My ruling splits it:** group **3** is authored *first*, run against `874d709`, and **its failing output is recorded in TEAM-CHAT as the work order** — it is not permitted to be written after the diff. Groups **2** and **4** land in the **same commit as Stage 1** and are green at that commit. This buys the Contrarian's guarantee without buying an extra cycle.

### 1.6 RULING ON THE LEGACY NAMES `--cyan` / `--lime` / `--amber` / `--red`

**Do not rename. Not now, not later, unless a customer-visible reason appears — and there is none.**

Measured: `var(--cyan)` 147, `var(--lime)` 90, `var(--amber)` 68, `var(--cyan-dim)` 41, `var(--red)` 37 = **383 use sites**, plus 50 palette declarations = **433**. The brief already confirms, and I re-verified by parsing all 10 blocks, that **the values retheme correctly** — `--cyan` is `#00e5ff` on cyber and `#255BBE` on landing and `#C43C63` on kawaii. The names are legacy; the behaviour is not broken.

A 433-site rename delivers **zero** customer benefit, produces a diff no reviewer can meaningfully read, and would collide with every other queued change to `index.html`. The semantic vocabulary that a rename would create **already exists**: `--accent-rgb` (50 uses), `--pos-rgb` (16), `--warn-rgb` (8), `--bad-rgb` (5), `--on-accent` (19), `--accent-text` (1). The correct move is to **complete** that vocabulary, not to churn the old one: add four alias declarations to `:root` only —

```
--accent:var(--cyan); --pos:var(--lime); --warn:var(--amber); --bad:var(--red);
```

— which cost ~90 bytes, inherit correctly into all nine `[data-theme]` blocks (the aliases live in `:root`, the values are overridden per theme), and let **new** code be written semantically while existing code stays untouched. **This is optional and is NOT part of Stage 1 or 2.** If Kaito judges it noise, skip it; nothing in this ruling depends on it.

---

## (2) TOPIC B — THE RULING

### 2.1 "Singaporean" is not a language. Stated plainly, because Osefe asked for it and the honest answer is that the request cannot be built as written.

Singapore has **four official languages**: **English** (the working language of government, business, law and education), **Mandarin Chinese**, **Malay** (the *national* language, used ceremonially and in the anthem), and **Tamil**. There is no "Singaporean" language. Singlish is an English-lexified creole, not a UI locale, and shipping a finance product's tax and legal copy in Singlish would read as a joke, not a localisation.

I have **NOT VERIFIED** any household-language statistic — no census data, no bilingualism rate. **NOT VERIFIED.** Everything I rule below rests on repo-internal measurement only.

### 2.2 What MRLN ships to support Singapore

**Ship: SGD and KRW added to the currency system. Nothing else. No new UI language. The parked Malay is not completed — it is deleted.**

**(a) The currency gap is real and it is the only measurable Singapore defect.**

- `index.html:2665-2671` `CURRENCIES` — 11 entries: USD EUR GBP DKK SEK NOK CHF CAD AUD JPY HUF. **No SGD. No KRW.**
- `index.html:2676` `FX_RATES.perUSD` — same 11. **No SGD. No KRW.**
- `index.html:1630-1642` `#curSel` — same 11 `<option>`s.
- `index.html:8674` `curOpts()` — same 11, hardcoded a second time.
- Meanwhile `index.html:7403` `TAX_CCY` maps `SG:'SGD'` and `KR:'KRW'`; `:7411` `TAX_COUNTRIES` lists both; `:7591` `txMoney` renders `S$` and `₩`; `tools/test/tax_test.js:117-124` asserts SG at 105 total assertions.
- **Dead branch:** `index.html:7594` `defCountry()` maps `SGD:'SG'` and `KRW:'KR'` — branches that **can never fire**, because neither can ever be `STATE.prefs.currency`. A Singaporean's tax panel silently defaults to **Denmark**.
- **Default currency is DKK** (`index.html:2681`, `:2792`) and there is **no locale detection anywhere** — I grepped: zero occurrences of `navigator.language`/`navigator.languages`.

**Correcting the Contrarian on the cause:** `index.html:7428` `var ccy=TAX_CCY[c]||…` forces the tax panel to the *country's* currency for **every** country. A DKK-preference user selecting US tax already sees `$`. Mixed-currency output is app-wide behaviour by design; **SG and KR are special only because the matching currency is unreachable.** Adding SGD does not fix mixed output — it makes alignment *possible*. That is still the right fix, but it must be described accurately.

**The edit set is 4 sites per currency, 8 total** (the Contrarian said "~3 lines"; it is 4 sites, and the Verifier is right):
`CURRENCIES` (`:2665`) · `FX_RATES.perUSD` (`:2676`) · `#curSel` (`:1630`) · `curOpts()` (`:8674`).

**Byte cost, decided:** `SGD:{sym:'S$', before:true, loc:'en-SG'}` ≈ 41 B; `KRW:{sym:'₩', before:true, loc:'ko-KR'}` ≈ 41 B; two FX entries ≈ 20 B; two `<option>` lines ≈ 88 B; two `curOpts` strings ≈ 12 B. **≈ 0.2 KB total = 0.010% of the 2,032.6 KB file.** Zero i18n cost — currency `<option>`s carry no `data-i18n` (verified: none of the existing 11 do), so `MISSING: 0` is unaffected. No new network call, no money cost, no new `new Function()` slice surface.

**⚠️ The FX rate is load-bearing and I will not invent one.** `index.html:2681` `convertAllMoney()` **converts every stored monetary figure** when the user switches currency. A wrong SGD rate silently corrupts a real user's data on a single dropdown change. The rate must be sourced by a human, recorded with its source, and carry the existing `asOf:'2026-01'` staleness caveat. **NOT VERIFIED — I have no SGD or KRW rate and will not supply a guess.** If nobody sources them, this item does not ship; it does not ship with a placeholder.

**(b) No new UI language. Not Malay, not Mandarin, not Tamil.**

*The evidence, measured by me:*

- The app ships **7** UI languages (`index.html:1596-1604`): en, es, da, de, sv, nb, hu. `ms` is **not** in `#langSel`.
- `ms` is not in `langLocale()` either (`index.html:4027` — 7 entries), so even if selected it would fall back to `en-GB` number and date formatting.
- I parsed the AUTO-MERGED dictionary directly (`index.html:6620`, 1,084,676 bytes total): **`ms` has 1,636 keys of which 1,567 — 95.8% — are byte-identical to their English key.** Malay is **4.2% translated**. Controls: es 4.2% *un*translated, da 5.0%, de 5.4%, sv 4.3%, nb 4.7%, hu 4.0%.
- `node tools/i18n/sync.js` → 732 fully translated, **MISSING: 61, every one `✗ ms`**.
- **`ms` costs 140.7 KB serialized = 6.9% of every mobile download, for a language no user can select and that is 95.8% English.**

*The history, which is decisive.* `team/logs/mikoto.md:728-730` records that Kaito's step-8 render check on a shipped Malay build **failed** with "corrupted words, half-English sentences, ~30% still 100% English," root-caused to blind substring replacement producing `inside`→`dalamside`, `Update`→`Upddie`, `month`→`blnnth`. **`sync.js` said `MISSING: 0` and the gate said GREEN throughout.** The only thing that caught it was a human who could read enough Latin script to know `blnnth` is not a word. **In Tamil script or Han characters that entire failure class is invisible to every reviewer on this team, and the gate would ship it.**

*Cost, decided.* A fully translated language measures **151.9–166.1 KB** in this dictionary (da 152.0, nb 152.2, sv 154.2, es 156.3, de 160.7, hu 166.1). That is **+7.5% to +8.2% of the file per language**. Chinese + Tamil + a real Malay ≈ **+460 KB ≈ +22%** on a file mobile users download.

*Font and glyph cost, decided.* All **10** `@font-face` blocks in `index.html` are **Latin-only subsets** (`unicode-range: U+0000-00FF, …`), totalling **134.4 KB** of woff2 — Orbitron 500 (11.5 KB), Rajdhani 400/500/600/700 (two subsets each, 12.1–15.4 KB), Share Tech Mono 400 (13.2 KB). There is **no CJK and no Tamil coverage in the file at all**. Two honest options, both bad:
  - **Embed.** A ~3,500-glyph Simplified Chinese woff2 subset is **roughly 700 KB–1.2 MB** — *industry figure, **NOT VERIFIED** in this repo, no such font is present to measure.* Tamil is far cheaper, ~40–80 KB. Embedding Chinese would grow a 2,032.6 KB file by **35–60%**.
  - **System fallback.** **0 KB.** Every device with a Chinese or Tamil locale ships a system font. But then Orbitron / Rajdhani / Share Tech Mono — the product's entire typographic identity — **do not exist** in those languages; headings render in a system UI font while the rest of the app renders in Rajdhani. That is not a localisation, it is two products in one file.

**Ruling: neither. We do not ship a language we cannot proofread, cannot typeset, and have no demand evidence for.** And there *structurally cannot be* demand evidence: the Contrarian verified — and I accept, because it is consistent with `green.js`'s phone-home scan passing over all 11 published files — that the app has zero telemetry. The privacy claim that **is** the product forbids the measurement that would justify the feature. `team/maki-first-10k-proof.md:67` puts the GTM target at "lead in English, aim US/UK/global"; Singapore appears nowhere in the plan.

**(c) Delete the parked `ms` dictionary.** It is 140.7 KB (6.9% of the file) of an English dictionary wearing a Malay label. Keeping it costs every mobile user 6.9% of their download for a feature that does not exist. Deleting it also takes `sync.js` from `MISSING: 61` to `MISSING: 0` outright, removing a permanent false-red from the i18n report. The loss if Malay is ever wanted is **69 real translations** (4.2% of 1,636). **This is a genuine Osefe decision — see §6 — because it is a product-direction call, not an engineering one.**

### 2.3 CPF — the brief's conditional does not fire, and I say so plainly

The brief asks me to rule that "if Singaporean personal finance is dominated by a compulsory contribution our model cannot represent, then a translated UI over a wrong finance model is worse than English over a right one." **The antecedent is false. CPF is modelled.**

- `index.html:7539` `var sg_cpf = 0.20*Math.min(gross, taxAdv('sg_cpfcap', 88800));` — the 20% employee share up to the Ordinary Wage annual ceiling.
- `index.html:7540` `sg_taxable = max(0, gross − 1000 − sg_cpf)` — earned-income relief + CPF relief.
- `index.html:7542` breakdown line `CPF (20%)` shown to the user alongside income tax.
- `index.html:7615` the ceiling is a **user-editable Advanced field**, so the figure is not frozen in the build.
- `index.html:7545` an honest limitations note ships with it: *"Resident IRAS rates; CPF is the 20% employee share up to the wage ceiling (citizens/PRs). Most personal reliefs and the annual rebate are not modelled."*
- `tools/test/tax_test.js:117-124` asserts `sg.ccy==='SGD'`, finite total, `0 ≤ total ≤ gross`, and `eff ≈ 22.7% ±2`.

**So the general principle stands and I affirm it — a translated UI over a wrong finance model is worse than English over a right one — but it does not apply here, and it would have been dishonest to let it decide the ruling.**

What the model honestly does **not** do, recorded so nobody overstates it: it does not model the ~17% **employer** contribution, does not allocate across Ordinary/Special/MediSave accounts, does not **age-band** the employee rate (20% is the ≤55 band; it steps down above 55, and the app *does* hold the user's age), and does not apply the separate Additional Wage ceiling for bonuses. Those are refinements to a disclosed approximation, not a broken model. One trivial gap: `'CPF (20%)'` at `index.html:7542` is a **raw literal, not passed through `t()`**, unlike `t('Income tax')` beside it — a one-string i18n leak for Mikoto whenever the tax panel is next opened.

**What a Singaporean gets today, verified:** a complete English UI, a Singapore tax engine with CPF and a user-adjustable ceiling covered by 6 committed assertions, and **no way to select SGD** — so their money reads in Danish kroner everywhere except the tax panel, which reads `S$`, while `defCountry()` silently defaults them to Denmark. **That last item is the whole of the real Singapore defect, and it costs 0.2 KB to close.**

---

## (3) WHAT WE ARE NOT BUILDING, AND WHY

Written to Osefe's standing directive. Agreement is earned; so is refusal.

1. **"Singaporean" as a UI language — refused, because it does not exist.** The correct response to the request is the fact, not a workaround. Building "Singaporean English" as a distinct locale from `en` would ship a second near-identical 155 KB dictionary for spelling variants nobody will notice.
2. **Malay in `#langSel` — refused.** It is **95.8% byte-identical English**, measured. Unparking it ships a language that is 4.2% translated to a paying customer.
3. **Mandarin and Tamil — refused.** Nobody on this team can proofread either; the gate cannot detect the failure (`MISSING: 0` and `GREEN` were *both true* during the corrupted-Malay incident); and there is no demand evidence and structurally cannot be, in a zero-telemetry product. Cost would be +7.5–8.2% file size each in dictionary alone, plus either +35–60% for an embedded Han subset or the abandonment of the product's typography for those scripts.
4. **A blanket find-and-replace of the 74 literals — refused.** `:468/:469`, `:2531`, `:7775`, `:3058-3065`, `:991`, `:136`, and the `mask-image` `#000` at `:309/:310/:845/:846` are **correct as literals**, and at least one of them ships a **1.25:1** tab label if tokenised. Work the per-site table, or do not work it.
5. **A new elevation token (`--elev`, `--surface-raised`) — refused.** `.modal` at `:982` is already byte-identical to `.card` at `:490` and separates by scrim + shadow. The codebase does not have the problem the brief assumed.
6. **Renaming `--cyan`/`--lime`/`--amber`/`--red` — refused.** 433 sites, zero customer benefit, guaranteed collision with every queued `index.html` change. The semantic vocabulary already exists in `--accent-rgb`/`--pos-rgb`/`--warn-rgb`/`--bad-rgb`/`--on-accent`.
7. **Changing any scrim's alpha — refused.** Tokenise the *value* to neutral; leave `.78`/`.86`/`.92` alone. First Principles called `#onboard` "a missed bug"; it is a missed hardcode. I measured the tinted-vs-neutral delta at **≤ 13/255 on the darkest theme and effectively zero elsewhere** — and the heavy scrim is *helping* on light themes (modal fill vs composited scrim = 10.20–17.39 on landing/iceblue/kawaii vs 1.16 on cyber). "Fixing" the alpha would degrade the themes it currently serves best.
8. **Fixing `iceblue`'s `--field-bg`** (`#FFFFFF`, identical to its `--panel`, separation exactly **1.000**) — **not in this pass.** Real, one line, and I measured safe candidates (`#F7FBFD` → separation 1.041, `--txt` 13.30, `--cyan-dim` border 4.96). But `--field-bg` paints **every input** on that theme, so the blast radius far exceeds the four inset sites this ruling covers. Backlog it with the number attached. Note also `landing` 1.015, `kawaii` 1.024, `cyber` 1.025 — four of nine themes rely entirely on the border, which is why row 18/19's border change matters.
9. **Fixing the app-wide mixed-currency behaviour at `index.html:7428` — not in this pass.** It is deliberate (the tax panel shows the country's real currency) and changing it touches all 13 countries and `tax_test.js`'s 105 assertions. Adding SGD/KRW closes the *reachability* hole; the design question is separate and unowned.

---

## (4) BUILD ORDER

**Ruling on priority, against the standing queue.** The Contrarian argues the allergen fail-open outranks everything and should ship first. **On severity he is right and I affirm it — 38/60 allergen terms hide zero meals in six languages, against `GUIDE.md:143`'s "a dislike is never suggested," in a health product. That is worse in kind than any colour.** But he draws the wrong scheduling conclusion, and here I rule against him:

**S2 — the actual allergen fix — is not buildable tonight.** Per `team/council/2026-08-04-multilingual-assistant.md` §S2 it requires Mikoto to author ~40 allergen terms × 6 languages *as data handed to Kaito*, plus a harness change to extract `/* >>> MRLN-SHARED-TEXT >>> */` by marker. **S0 alone changes nothing for the customer.** Sequencing by severity while ignoring readiness leaves *both* defects live for another cycle.

**Therefore: parallelise across roles, serialise the gate.** Mikoto authors allergen vocabulary (data, no `index.html` lock) while Kaito runs the colour pass (`index.html`, one lock). Hugo builds S0 (`tools/test/`, no lock). Three roles, three files, no collision under GROUND RULE #1. Then S2 lands in the very next release with its data already in hand.

| Stage | What | Files | Committed test **in the same commit** | Owner |
|---|---|---|---|---|
| **A0** | **S0 allergen visibility.** Chartered; needs no new ruling, needs a slot. My measured baseline: **38/60 fail open, 48/60 hide fewer.** **I ADD to the chartered spec:** assert `fuzzyCorrect` does **not** map `ost→oat`, `sajt→salt`, `tej→tea`, `sopp→soup`, `soja→soba`, `dió→dip`, `hal→ham` — all seven verified live by me. These are *wrong-food substitutions*, strictly worse than a miss: the real allergen is not excluded **and** unrelated meals are. | `tools/test/allergen_i18n_test.js` (new), `tools/release/green.js` | itself, ships **xfail with the live count printed** so the number can only go down | **Hugo** |
| **A1** | Contrast table authored against the **broken** tip `874d709`; failing output recorded in TEAM-CHAT as the work order. No `index.html`. | `tools/test/theme_contrast_test.js` (new) | itself, **RED** | **Hugo** (Arthur reviews the pinned pairs) |
| **B1** | **Colour Stage 1** — table rows 1–11. CSS + one HTML class wiring at `:3212-3218`. Cannot break the JS parse. | `index.html` | `theme_contrast_test.js` groups 2 + 4 wired into `green.js`, **green at this commit** | **Kaito** |
| **B2** | **Colour Stage 2** — table rows 12–21. JS string concatenation, isolated so a red `html_parse_test` points at one commit. | `index.html` | `theme_contrast_test.js` group 3 flips **RED → green** | **Kaito** |
| **B3** | **SGD + KRW** — 4 sites each. **Blocked on a sourced FX rate.** | `index.html` | `tools/test/currency_parity_test.js` (new): every value in `TAX_CCY` must be a key in `CURRENCIES`, in `FX_RATES.perUSD`, in the `#curSel` option list, and in `curOpts()`. **Currently RED on 2 of 12.** ~20 lines, permanently closes the class. | **Kaito** |
| **— RELEASE B gate —** | Akashi SAFE · Mikoto MISSING:0 · Hugo GREEN, all on one tip · Osefe's go | | | |
| **C1** | **S2 allergen fix** — `_fold` replaces `normTerm`'s ASCII strip in the food path; multilingual aliases into `FOOD_SYN` (~1.5–2 KB). A0's assertions flip xfail→pass. | `index.html`, `tools/test/meal_test.js`, `allergen_i18n_test.js` | A0's suite, now required green | **Kaito** (Mikoto supplies vocabulary as data) |
| **C2** | **`showSetupGuide()` + `showPersonalizeReminder()` i18n.** Neither Kaito nor Recon caught this and the Contrarian found only half of it. **I verified both:** `index.html:8861-8871` and `:8876-8896` contain **zero `t()`, zero `tf()`, zero `data-i18n`**, and I confirmed by direct dictionary parse that `'Finish personalizing'`, `'Finish setup'`, `'Income & Cash Flow'`, `'A quick tour of each section so you know where everything lives.'` and `'Got it — show me around'` are **all ABSENT from the `da` dictionary**. ~22 strings ship raw English to six languages on the **first screen after setup**. `sync.js` cannot see them, so `MISSING: 0` is true and misleading. Must land in the same lock as B2, which already edits `:8866/:8888/:8889/:8893`. | `index.html` (Kaito wraps in `t()`), then dictionary (Mikoto) | `sync.js` source-key count rises by ~22 and reports MISSING: 0 | **Kaito** then **Mikoto** |
| **C3** | **`APP_BUILD` / what's-new.** Frozen at `'2026-06-27.1'` since June (`index.html:9002`) through ~16 releases; `APP_VER='v40'` at `:1226`. v40 **removed** a feature and the app's only channel for saying so is dead, while the "Latest update" card's button serves June content advertising a renamed feature. Rides with C because it needs Mikoto anyway. | `index.html`, dictionary | assert `APP_BUILD` changed whenever `APP_VER` changes — add to the version-tag section of `green.js` | **Kaito** + **Mikoto** |
| **— RELEASE C gate —** | | | | |
| **D** | **Root migration phases 1–3.** **AFTER B and C.** It is the most cache-sensitive change this product will ever make and needs an **uncontaminated rollback window** — the standing ruling (`team/council/2026-08-04-multilingual-assistant.md` §7d) already says this and I affirm it. Phase 0 (`3561e09`/`2bff172`) has armed the deploy map; `routing_test` correctly HELDs 7 groups at phase 0. | | | **Kaito** + **Hugo** |
| **E** | **Multilingual assistant S1/S3.** Chartered, unchanged, after D. | | | per that ruling |
| **F** | **Colour Stage 3** — table rows 22–24 (`meta theme-color`, generated manifest, `manifest.webmanifest`). Deferred deliberately: it is the only JS-behaviour change in Topic A, and it edits a **second published file**, which reopens the whole publish-set signature. | `index.html`, `manifest.webmanifest` | extend `theme_contrast_test.js` to assert the meta tag is written from `--bg` | **Kaito**, **Akashi** re-signs all published files |

**Both of tonight's requests rank below the allergen work on severity — and I say that plainly. Osefe's colour report ships first anyway, and only because S2's inputs do not exist yet.** If Mikoto's vocabulary lands before Kaito finishes B2, **C1 jumps the queue** and the colour pass waits one gate. That is the correct trade and I authorise it in advance.

---

## (5) MUST-NOT-BREAK + EVIDENCE PLAN

**Invariants. Violating any means the stage is reverted, not patched.**

1. `node tools/release/green.js` exits **0**. Baseline `874d709`: 28 sections, VERDICT ✓ GREEN, re-run by me.
2. `tools/test/html_parse_test.js` compiles every `<script>` body with `vm.Script`. **This is the guard that protects every Stage-2 edit** — `:7655`, `:7665`, `:8377`, `:8866`, `:8887`, `:8888`, `:8889`, `:8893`, `:9263`, `:9264` are all JS string concatenation, and a single unbalanced quote is a dead page. It caught exactly this class before (the minified-i18n stray brace incident documented in its own header).
3. **`new Function()` slice safety.** `tools/test/media_test.js:20-45` extracts by brace-matching on named functions: `clamp(r)`, `fmtR(r)`, `items()`, `watched()`, `ranked()`, `typeOf(m)`, `matchType(m)`, `imdb(m)`, `esc(s)`. **`showCompare()` (`:8393`) and `buildChips()` (`:8372`) are NOT extracted** — verified — so rows 7 and 17 cannot throw `ReferenceError`. **Do not touch `esc()`.**
4. **i18n literals.** No stage touches a `t()`/`tf()` **first argument**. C2 *adds* `t()` wrappers — new literals only, which `sync.js` matches. `MISSING: 0` for the shipped six must hold at every gate.
5. **Anti-tamper.** No colour stage touches a money/health arithmetic path, so `__sys.token()` coverage is unaffected. **Exception: B3 does.** `convertAllMoney()` (`index.html:~2690`) and `convAmount()` run over every stored monetary figure; adding a currency puts new data on a poisoned path. **Akashi must confirm the poison and watchdog coverage still hold across the new rate entries** before B3 signs.
6. **`index.html:3058-3065` is Akashi's.** Kaito adds no marker there without Akashi's sign-off, and changes nothing.
7. **Published-file scope.** `manifest.webmanifest` is leak-scanned by `green.js:181`. Stage F edits it, and every sign-off covers **every** published file, not just the one changed.

**New committed suites, with their actual assertions:** `theme_contrast_test.js` (§1.5, four groups), `allergen_i18n_test.js` (60 grid assertions + 7 wrong-correction guards), `currency_parity_test.js` (`TAX_CCY` values ⊆ `CURRENCIES` ∩ `FX_RATES.perUSD` ∩ `#curSel` ∩ `curOpts()`; RED on SGD, KRW today).

**What CANNOT be automated — recorded human checks, named owner, posted in TEAM-CHAT:**

| Check | Why no test can do it | Owner |
|---|---|---|
| Real-device render of `#medCompare`, the guide modal, and the swatch picker on **landing, iceblue, kawaii** | Computed WCAG is not perceived legibility; sub-pixel rendering and OLED gamma are not in the model | **Hugo**, named themes in the post |
| The scrim change is visually indistinguishable | I *computed* ≤13/255 delta; nobody has *looked* | **Arthur** |
| **SGD and KRW FX rates are correct** | No offline test can validate a real-world exchange rate, and a wrong one silently corrupts stored money on a dropdown change | **Osefe or Kaito**, with the source recorded in the commit body |
| Meaning spot-check of Mikoto's 40×6 allergen vocabulary | Coverage ≠ correctness — `MISSING: 0` and GREEN were both true during the corrupted-Malay incident | **Kaito**, pipeline step 8 |
| Meaning spot-check of C2's ~22 newly translated setup-guide strings | same | **Kaito** |

---

## (6) DECISIONS THAT ARE GENUINELY OSEFE'S

1. **Ship the colour pass (RELEASE B) before the allergen fix (RELEASE C)?** *Recommend: yes*, on readiness — S2's vocabulary does not exist yet and the colour fix can be in a customer's hands tonight. *Cost of the alternative:* the allergen filter stays broken either way this cycle, and the defect **he reported and can see** waits a full gate.
2. **Delete the parked `ms` dictionary?** *Recommend: delete.* It is **140.7 KB = 6.9% of every mobile download** for a language no user can select and that is **95.8% English**. *Cost of the alternative:* keeping it costs that 6.9% indefinitely; deleting it discards **69 real translations** (4.2% of 1,636 keys).
3. **Does Singapore support end at SGD, or is a real Singapore push a business goal?** *Recommend: it ends at SGD.* *Cost of the alternative:* +7.5–8.2% file size per language, text this team cannot proofread, a gate that provably cannot detect the failure mode, and either +35–60% for an embedded Han font or the abandonment of MRLN's typography in that language.
4. **`GUIDE.md` §1 still says "Free · No subscriptions… Ever." while `landing.html` sells $9.99/mo · $69/yr.** Already live, flagged by Hugo at the RELEASE A gate, still unanswered. **Not an engineering choice, and it is the worst contradiction we ship.** *Recommend: fix the guide line.* *Cost of the alternative:* a paid privacy product whose own documentation calls itself free.
5. **The dislike-filter disclaimer** — *"Dislikes filter suggestions; they are not a medical allergen check."* Carried unanswered from `team/council/2026-08-04-multilingual-assistant.md` §7c. *Recommend: add it, in the same release as C1.* *Cost of the alternative:* fixing the leak without the line implies a guarantee we cannot make about a 155-meal database with free-text ingredients, in a paid product, in a health context.

---

## (7) OWNERSHIP UNDER FIND-XOR-FIX, AND SEQUENCING AGAINST THE GATE

| Work | Codes it | Reviews / verifies |
|---|---|---|
| A0 allergen test, A1 contrast test | **Hugo** (tests only, **no `index.html`, no lock**) | Kaito re-derives the 38/60 himself before accepting |
| B1, B2 colour stages | **Kaito** (file owner) | Arthur reviews the rendered result and the pinned-pair list; **Arthur does not code** |
| B3 SGD/KRW | **Kaito** | **Akashi** must confirm `__sys.token()`/watchdog coverage on the new `convertAllMoney` path; Hugo runs `currency_parity_test.js` |
| `index.html:3058-3065` kill-screen markers | **Akashi** (security exception; his code) | Kaito reviews per pipeline step 5 |
| C1 allergen fix | **Kaito** | **Mikoto** supplies 40×6 as **data** — this is vocabulary, not dictionary work, so it is **outside** her direct-edit exception; Kaito lands it |
| C2 setup-guide `t()` wrapping | **Kaito** (source strings, English first) | then **Mikoto** for the dictionary values (her exception applies), then Kaito spot-checks meaning |
| C3 `APP_BUILD` / `WHATS_NEW` | **Kaito** (English), **Mikoto** (6 values) | Hugo re-gates |
| Stage F published-file change | **Kaito** | **Akashi** re-signs the full publish set |

**Sequencing against freeze-the-candidate:**

- **One lock at a time on `index.html`.** A0 and A1 are `tools/test/` only and run in parallel with B — different roles, different files, no collision. Mikoto's vocabulary authoring is a data deliverable and also parallelises. **Nothing else does.** B1, B2, B3, C1, C2, C3 all touch `index.html` and serialise behind one claimed lock.
- **One live instance per role.** Kaito is the single dispatcher; no second Mikoto or Hugo while one is live.
- **Every sign-off names an explicit SHA. If the tip moves, the gate reopens** and the relevant owner re-signs the new tip. B1→B2→B3 are three commits inside one lock; **the gate runs once, on the tip after B3** — do not sign B1 and then move to B2.
- **Stage F reopens the *published-file* signature**, not just index.html's. That is the whole reason it is deferred out of RELEASE B.
- **Asleep runs never auto-publish.** Nothing reaches gh-pages without Osefe's explicit in-thread "ship it," every time.

**This ruling is the build spec. Save it and reference it by SHA; do not summarise it from memory later.**