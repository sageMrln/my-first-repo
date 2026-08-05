# MRLN OS-Redesign — Osefe's design brief (2026-08-05, verbatim)

> Status: OWNER DIRECTIVE. This is the governing spec for the full-app redesign
> (task #25). The Council ruling must implement this brief; where a council
> finding contradicts it, the contradiction is surfaced to Osefe, not silently
> resolved. Referenced by SHA per council rules.

---

Think like a Senior Product Designer at Apple, Linear or Arc Browser.
Your responsibility is to make MRLN feel like a premium desktop/mobile operating system.
You are not creating pretty mockups.
You are creating an interface people will use every day.
Every screen should answer:

* What is most important?
* What action should the user take next?
* How can this information be understood in under two seconds?

## Overall Design Philosophy
The application should feel like one unified operating system.
Not ten separate applications living inside tabs.
The transition from Finance → Health → Calendar → Notes should feel seamless.
Cards, typography, spacing, colours, shadows, buttons, icons and navigation should all belong to one design language.
Nothing should feel copied from another app.

## Visual Identity
The current colour palette should remain.

* Deep navy backgrounds
* Cyan highlights
* Soft teal accents
* Bright green success colours

Keep the cyber aesthetic.
However, mature it.
Think:
"A professional command center"
rather than
"A gaming interface."
Avoid excessive glow.
Avoid visual clutter.
Avoid unnecessary borders.
Avoid decorative elements that don't communicate information.

## Typography
Headings may use the futuristic font.
Everything else should use an extremely readable font such as Inter.
Numbers should be large.
Labels should be subtle.
Hierarchy should always be obvious.

## Layout Principles
Every page should follow similar structure.
Header ↓ Important summary ↓ Primary content ↓ Supporting information ↓ Actions
Avoid giant empty hero sections.
Use whitespace intentionally.

## Information Density
MRLN contains a large number of features.
Do not hide them.
Instead:
Use progressive disclosure.
Show summaries first.
Expand details naturally.
Allow users to understand an entire module at a glance.

## Dashboard Philosophy
The Overview page should become the user's command center.
Instead of looking like a landing page, it should answer:
How am I doing?
What changed today?
What requires attention?
How healthy am I?
How much money is left?
What should I do next?
What reminders exist?
What streaks are active?
Everything important should be visible immediately.

## Finance Module
The Finance module should feel like mission control.
Income · Expenses · Cash Flow · Savings · Debt · Subscriptions · Tax · Checklist · Financial Grade
Prioritize understanding over decoration.

## Health Module
The Health section should immediately communicate:
Calories · Macros · Weight · Workout · Body Grade · Progress
Avoid overwhelming users with raw numbers.
Use clean visual hierarchy.

## Life Module
Media · Notebook · Calendar · Morning Briefing · Streaks · Change Log · Life Grade
Everything should feel personal rather than corporate.

## Assistant
The assistant should feel integrated into MRLN.
It is not ChatGPT.
It is a local assistant that understands MRLN.
It proposes changes.
Users confirm them.
It never edits data automatically.

## Privacy
Privacy should not be hidden inside Settings.
The interface should naturally reinforce:
Running Locally · Offline Ready · Saved on this Device · Backups Available · Export Anytime · No Account Required · No Tracking
Without constantly repeating these messages.

## Mobile Design
The mobile application should feel native.
Large touch targets.
Smooth scrolling.
Consistent spacing.
Bottom navigation.
Cards should be glanceable.
Information should never require horizontal scrolling.

## Desktop Design
Desktop should not simply stretch the mobile layout.
Use the extra space intelligently.
Introduce multiple columns where appropriate.
Allow users to monitor finance, health and life simultaneously.
Think of it as a professional dashboard rather than an enlarged phone screen.

## Animation
Animations should communicate state.
Not decoration.
Fast.
Subtle.
Responsive.
Never distracting.

## Objective
Redesign every screen so that MRLN feels like software someone would happily use every day for years.
Do not change the architecture.
Do not change the features.
Do not remove functionality.
Improve only the presentation, hierarchy, usability and visual polish while maintaining a consistent design system throughout the entire application.

---

## Kaito's reading notes (not part of the directive)
- Accompanying phone mock (same day): Overview as stacked KPI cards
  (Balance/Calories/Weight/Workouts/Macros, each with mini-viz), 4-item bottom
  nav Home · Money · Health · Diary. The brief's module grouping
  (Finance/Health/Life) is the desktop-truth of the same idea.
- "Do not change the architecture" = code architecture & features. The
  module-grouped navigation IS requested (bottom nav, module pages) — that is
  presentation/IA, and explicitly in scope per the Mobile/Module sections.
- Verified 2026-08-05: every feature the brief names already exists in the app
  (morningBriefing, computeBodyGrade, Finance grade/tier, Subscriptions,
  streaks, Change Log) — no hidden feature-work inside the redesign.
- Fact-check against current app: 16 tabs (overview income expenses loan flow
  rule checklist klarna gym food calendar stats notebook media connect log);
  5 opt-in layouts + 9 themes exist; default = Cyberpunk/Command.

---

## Owner addendum (2026-08-05, later same day — verbatim intent)
> "Instead of having 16 tabs, combine them into less tabs with sub-categories
> inside of it. Make it very easy for a consumer to consume."

Ruling effect: the grouped-navigation question is CLOSED — Osefe orders
consolidation (few top-level tabs, sub-categories within each). Open for the
Chairman under this directive: exact group count (mock showed 4; standing
blueprint ruling `a8abee4` decided 5 incl. MORE), group names ("Diary" flagged
as unpredictable by the Outsider seat), and where connect/log/settings live.
Consumer-ease is the deciding criterion Osefe named.

## Owner addendum 2 (2026-08-05 — verbatim)
> "Think of this as a complete reskin"

Ruling effect: scope = the ENTIRE app gets the new design language — every
screen, not just Overview + hub landings. Features, data models and logic
untouched (consistent with the brief's "improve only the presentation").
Reads on the seats' debate: the Expansionist/Executor suggestion to limit the
new card vocabulary to Overview+hubs is now bounded — leaf pages are IN scope
for the reskin (palette/type/spacing/card chrome), while forcing KPI-card
anatomy onto dense data-entry tools remains a Chairman judgment call about
hierarchy, not an excuse to leave pages visually stale. Where a mock element
has no honest backing data (balance series, weight history), the reskin adapts
the presentation to real data rather than inventing series — flagged to Osefe
in the ruling, not silently resolved.
