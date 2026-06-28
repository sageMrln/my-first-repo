# MRLN — The Complete Guide

**Finance & Health HUD · free · offline · private**
Live app: `https://sagemrln.github.io/my-first-repo/`

---

## 1. What MRLN is (and why it exists)

MRLN is a personal **command center for your money and your body** — one cyberpunk dashboard that turns your real numbers into a plan you can actually follow.

It was built around four hard rules:

| Principle | What it means for you |
|---|---|
| **Free** | No subscriptions, no paid APIs, no accounts. Ever. |
| **Offline** | Everything runs in your browser. Once loaded it works with the plane on airplane mode. |
| **Private** | Your data **never leaves your device**. Nothing is uploaded, tracked, or sold. |
| **Single file** | The whole app is one self-contained HTML file — nothing to install, easy to back up. |

The purpose: most finance/fitness apps want your data and your money. MRLN wants neither. It gives you the math, the projections, and the honest verdicts — and keeps all of it on your phone.

---

## 2. Getting in — the access key

MRLN opens **locked**. You unlock it once with an **access key** (a code that looks like `MRLN-…`).

- The key is **cryptographically signed** — it can't be faked or guessed.
- It's **time-limited** (a tester key might last a week; a personal key, years). When it expires, the app re-locks — even mid-session — and asks for a new one.
- Once entered, it's **remembered on that device**, so you don't retype it every time.
- Keys are tied to access, **not** to your data. Renewing a key never touches your numbers.

**Three ways a key can be scoped:**
- **File-bound** — works only on one specific file/link (its "File ID", e.g. `#F-AB12CD`).
- **Universal** — works on any link or installed copy (used for testers and the owner).

---

## 3. Languages & currencies

Top of the screen is the **locale bar**: 🌐 Language · Currency · Country.

**Languages (7):** English, Español, Dansk, Deutsch, Svenska, Norsk, **Magyar**.
Switching translates **the entire interface** instantly — tabs, headings, buttons, help text, the setup wizard, everything. A built-in **language watchdog** runs constantly: it re-checks every screen — including text that only appears in certain situations (your plan, tax breakdown, calendar, logs) — and keeps it all in your chosen language, with nothing left in English.

**Currencies (11):** USD, EUR, GBP, DKK, SEK, NOK, CHF, CAD, AUD, JPY, **HUF**.
Currency is a **real conversion**, not just a relabel. Switch from kr to € and `8,000 kr` becomes `~1,070 €` at the bundled offline exchange rate. Every stored figure — income, expenses, loan, savings — converts together, and switching back returns the original amount. (Rates are an offline snapshot; no server needed.)

---

## 4. First-time setup (the wizard)

On first unlock, a short wizard sets you up in under a minute:

1. **Welcome** — language, currency, country (or tap *"show me a filled example"*).
2. **About you** — name (optional age/work/birthday/ethnicity*, phone & main device).
3. **Your income** — typical monthly take-home, plus optional slow/good months, debt payment, savings target.
4. **Your expenses** — quick-add chips or type your own.
5. **Sports & hobbies** — added to your calendar as weekly repeats.
6. **Getting around** — transport costs; mark anything *financed* and it drops off your budget automatically once it's paid off.
7. **Install** — tailored guide to add MRLN to your home screen (iPhone / Android / PC).
8. **Review** — your starting picture.

\* Ethnicity is used **only** to set accurate WHO health thresholds (BMI/body-fat). It never changes calorie targets.

You can re-run setup anytime with **⚙ Setup**, or skip it and fill things in yourself.

---

## 5. The Money side

### Overview — *Mission Briefing*
Your headline: left-over money in a typical month, comfort margin, and worst-case month. The single glance that tells you if the plan holds.

### Income
Your monthly take-home across **slow / typical / good** months. The **typical** month is the baseline every simulator uses.
→ To change income, use **💬 Assistant MRLN** (e.g. *"I earn 18000 a month"*).

#### 🧾 Tax Helper (inside Income)
An offline **estimate** of your income tax, adapting to your country/region:
- What you'll pay, what to expect back.
- **Denmark:** full model — AM-bidrag, personfradrag, beskæftigelsesfradrag, bund/kommune/kirke/topskat — plus **forskudsopgørelse** suggestions (trækprocent + monthly fradrag) and an **over/under-estimate simulator** (set your expected annual vs. actual → refund or owe).
- Models for every country whose language we support (DK/US/GB/DE/ES/SE/NO) + a generic fallback.
- Always unofficial — verify with your tax authority. Numbers stay on your device.

### Expenses — *Expense Breakdown*
A read-only, grouped view of every recurring cost (with monthly/yearly totals). "Varies" items are left out of the total.
→ The **"Edit items →"** button jumps you to **Subscriptions**, where editing lives.

### Subscriptions — *where you edit everything*
- **Add a Subscription / Recurring Cost** — add any cost to any category.
- **Manage Items & Categories** — edit a price, change billing frequency, or delete **any** item (base or added), and add/remove whole categories. Live numbers recompute instantly.
- **Subscription Ledger** — every recurring cost with what it is and why you keep it.

### Loan & Debt
Track a loan payment, amount, and (optional) interest rate; toggle whether it counts in your monthly math.

### Cash Flow — *Cash-Flow Simulator*
Drag the income slider to see any month play out: income − costs − loan − savings = what's left. The range auto-fits your real income. Below it, an **8-year savings-growth projection** charts your pooled savings across low/typical/good scenarios with 1/3/8-year milestones.

### Savings — *rules + boxes*
The "**Savings**" tab opens with the short list of **wealth-building rules** (pay yourself first, build a buffer, make it earn, clear pricey debt first, bank your good months) — the habits that do almost all the work.

Below the rules are your **Savings Boxes** — Lunar-style pots. Make a box for each thing you're saving for (a holiday, a new phone, an emergency cushion). Tell it what it **holds now**, what you **add** (monthly / quarterly / yearly, or top up by hand any time), and an optional **interest rate** and **target**. A slider projects every box **X years ahead** — what it becomes, what you put in, and exactly **how much the interest earns you** — with a progress bar and an honest "reach it in ~N years." All boxes total up, and every figure converts with your currency.

### *Your Life Tier* + *Your Personalized Plan* (Checklist)
An honest, S→F **tier rating of your money life**, built **only from your own numbers**, with a ranked, realistic action plan that updates as your numbers change.

### Checklist — *Action Checklist*
Concrete next actions (build a cushion, automate savings, etc.).

### Klarna Float *(master-only tab)*
A clear, honest breakdown of interest-free pay-in-2 as a **zero-cost liquidity bridge** — with a safe-size rule, a cash-flow simulator sized to your surplus, and an honest verdict (GOOD / OK / TIGHT / BAD). Shown only on the owner's master (or after importing it).

---

## 6. The Health side

### Gym Plan
- **Body Stats** — sex, age, height, weight, activity, body-fat. Feeds everything below.
- **Body Grade & Shape** — an S→F physique grade, body-fat/muscle read, and a visual silhouette.
- **Body Measurements** — track measurements over time.
- **Calorie Simulator** — your BMR/TDEE and a slider for cut / maintain / bulk, with honest verdicts ("aggressive deficit", "lean surplus", etc.).
- **Meal Ideas** — suggests the **healthiest tasty meals for your goal**, respects likes/dislikes (typo-tolerant — "avoid chesse" still works), pins favourites, rotates fresh ideas, and surfaces the healthiest pick.
- **Personal Records (PRs)** and **Workouts / Training Split** — log lifts and your weekly plan.

### Food Log
- **Log a meal** by **typing** ("2 eggs and rice") — an offline estimator reads quantities/units and returns calories + macros — and/or attach a **photo**.
- **Today** total, **History**, delete — your daily food diary, fully offline.

---

## 7. Organize & track

### Calendar
Add dated events and notes; one-off, weekly, monthly, or yearly repeats (birthdays 🎂 included). Hobbies and transport from setup land here automatically. **Reminders 🔔** included.

### Stats & Grades
A roll-up of your grades and key stats across money and body.

### Notebook
A built-in notes app (like iPhone Notes) — title + body, autosaved, private.

---

## 8. Installing the app

Installing is **front and centre**, not buried in a menu:

- **Lock screen** — before you even sign in, short **"Add to Home Screen"** guides for iPhone and Android sit beside the unlock card.
- **"Get the app" banner** — a bright banner across the top of the dashboard. Tap **Install** and it either installs in **one tap** (Android / Chrome / Edge) or opens a **step-by-step** card for your exact device (iPhone Safari, Android, or desktop).
- It **removes itself automatically** the moment the app is installed — no clutter once you're set up.

## 9. Connect — move data between devices

The hub for everything that crosses devices (all **on-device**, nothing uploaded):

- **🔒 Backup & restore** — make a private **data code** of everything and paste it onto another device; or **📦 Import my master file (.html)** to load an entire saved file in one tap (data + Klarna tab; never the owner key).
- **📥 Import from another app** — bank/card **CSV** → income & expenses; **.ics** → calendar; Apple Health/CSV → weight; MyFitnessPal CSV → food log.
- **📤 Export to other apps** — your calendar as **.ics**, expenses/food as **CSV**, or the native **Share** sheet.
- **📱 QR transfer** — move your link/data by scanning a QR code (generated fully offline).
- **⚖️ Bluetooth scale** (in Gym) — read your weight straight from a compatible scale.

---

## 10. 💬 Assistant MRLN — offline Q&A + plain-language commands

Your personal finance & health assistant. Tap **💬 Assistant MRLN** to ask questions about **any feature** (how does savings work? what is the food log?) or **change your data** with plain-language commands (one per line). Everything runs **free, offline, in your browser** — nothing changes until you confirm. 

**Questions:** Ask anything about the app in **any of 7 languages** (English, Español, Dansk, Deutsch, Svenska, Norsk, Magyar). The assistant answers from a complete knowledge base covering every tab and feature.

**Commands:** Update your numbers using natural language — type the way you'd naturally say it. It understands commands in all 7 languages (e.g. *"jeg sparer 400 om måneden"*, *"min alder er 41"*). Your item, employer and note names are always kept exactly as you typed them. It understands:

- Income — *"income is now 2600"*, *"good month income is 22000"*
- Costs — *"add Gym 29/mo to Other"*, *"rent is now 1200"*, *"cancel Netflix"*
- Loan / savings — *"loan payment is 1500"*, *"save 400 per month"*
- Categories — *"add category Pets 🐾"*
- Profile — *"name is Alex"*, *"work is now Acme Ltd"*, *"I'm 24"*
- Body — *"I weigh 82kg"*, *"height is 180"*
- Calendar — *"note 2026-07-15 Mum's birthday"*
- Workouts — *"workout Monday: push day"*

---

## 11. Daily Habits — engagement & motivation

Three mechanics keep you coming back:

**🔥 Streak Counter** — Track consecutive days you've logged income or expenses. The header shows a flame 🔥 pill with your count — green when you logged something today, amber when it's been a day or two. Breaking a streak resets you to 1, so dailies become a ritual. It's the oldest retention mechanic in apps like Duolingo and Habitica — and it works.

**☀️ Morning Briefing** — Once per day on app load, you see a time-aware greeting by name. *"Good morning, Ingrid 👋 — 7 days in a row — keep it going! 🔥 · on track to keep €2,140 this month 🔥"* The greeting changes by time of day (Good morning/afternoon/evening); combines your streak count and your **monthly surplus** (the amount you're on track to have left over after expenses and loan payments). **Offline-only, local-only** — never leaves your device. It's your app saying *"I see what you're doing, and I'm proud of you"* once a day.

**✨ Apply Feedback** — When you apply a command or confirm an edit, a 2-second toast pops up: *"nice! 7-second parse"* or *"saved ✓"*. It's a tiny score (how fast you wrote it) and an emoji, giving instant proof that the app heard you and the numbers updated. Keeps your hands engaged and the app *feeling alive*.

All three are **per-device, never synced** (they reset if you import to a new phone) and are **stripped from any file you share** — so a customer file or a test upload stays clean, and the habit counters don't follow your export.

---

## 12. Updates — how new features reach you

- **On the hosted link / installed app:** updates are **automatic**. Open it online and the newest version loads itself (network-first service worker); offline still works from cache. Your data is preserved across every update — no migration, no re-login.
- **On a downloaded file:** that file is frozen. To get new features, open the hosted app (or a newer file) and **import your data** across.

**Tip:** running your master *on the installed app* gives you the best of both — your data + auto-updates.

---

## 13. Privacy & anti-tamper (the security model)

- **Your data is yours.** It lives in your browser's local storage (and embedded in your saved file). It is never uploaded — there's no server to upload to.
- **Unforgeable access.** Keys are signed with a private key that exists **only** in the owner's master file. The public app holds just the public half — enough to verify keys, never to make them.
- **Tamper = poison.** Three independent watchdogs detect a bypassed lock (overlay removed, public key swapped, verifier neutered). If anyone defeats the lock, an integrity token flips and **poisons every number** — finance, body/calories, tax, and food all become `NaN` — and a full-screen warning appears. A broken app is worthless to a thief.
- **Clean shares.** Any blank/customer copy is **hard-stripped** of all personal data and of the owner key, so nothing private can leak into a file you hand out.

---

## 14. For the owner — running the show

These tools appear only on **your master file** (where the private key lives):

- **🔑 New / renew key** — mint a key for anyone: pick a name and duration (minutes → years). Optionally bind it to a specific File ID, or leave it universal.
- **📤 New file + key** — birth a fresh, blank customer file **and** the single key that unlocks it, together. (Never share your master — only the file+key it creates.)
- **Klarna Float** tab is visible here (and on any copy that imported your master).

**Releasing updates:** edit `index.html`, push to `gh-pages`. Everyone on the hosted link/app gets it on next online open. Only bump the service-worker version when you add/rename a static asset (icons, etc.).

**Your master file** auto-unlocks on your devices, holds your real data, and can mint keys. Keep it private; back it up; never hand it out.

---

## 15. Quick troubleshooting

| Symptom | Fix |
|---|---|
| "This key expired" | Get/mint a new key. Keys are time-based by design. |
| "This key belongs to a different file" | You're using a file-bound key on the wrong file. Use the key that came with **this** file, or a universal key. |
| Installed app asks for a key again | Installed apps have separate storage from the browser tab. Enter your key once in the installed app; a universal key avoids file-ID mismatches. |
| Opened the link and it's blank with no key prompt | A bare link (no `#F-…`) opens a fresh empty app, and/or your browser already had a saved key. Your data lives in your file — import it from Connect. |
| Can't find where to edit expenses | Expenses is read-only; edit in the **Subscriptions** tab (use the "Edit items →" button). |
| Numbers show as NaN + a red warning | The tamper guard tripped. Use the original, unmodified app with a valid key. |

---

*MRLN — your money and your body, on your terms, on your device.*
