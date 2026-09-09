---
name: LHIND AI Learning Catalog
description: Role-based AI training cockpit for LHIND, skinned in the Lufthansa Group Design System
colors:
  core-blue: "#05164d"
  blue-500: "#2d5fe4"
  blue-600: "#243f9b"
  blue-100: "#e5f1ff"
  slate-700: "#52617c"
  slate-500: "#657898"
  grey-100: "#f6f8fc"
  grey-200: "#eef2f8"
  grey-300: "#dde4ef"
  grey-400: "#c7d1df"
  cool blue-grey: "#627087"
  white: "#ffffff"
  sand: "#857461"
  teal: "#368089"
  purple: "#a82e61"
  red: "#bc0a1d"
  success: "#1b8a5a"
  warning: "#e2974b"
  error: "#e22743"
typography:
  display:
    fontFamily: "Lufthansa Head, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(48px, 6vw, 88px)"
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Lufthansa Head, Helvetica Neue, Arial, sans-serif"
    fontSize: "44px"
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Lufthansa Head, Helvetica Neue, Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Lufthansa Text, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "Lufthansa Text, Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.14em"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  pill: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "24px"
  6: "32px"
  7: "48px"
  8: "64px"
components:
  button-primary:
    backgroundColor: "{colors.core-blue}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.blue-600}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.core-blue}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.core-blue}"
    rounded: "{rounded.md}"
    padding: "24px"
  chip-neutral:
    backgroundColor: "{colors.grey-200}"
    textColor: "{colors.slate-700}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"
---

# Design System: LHIND AI Learning Catalog

## 1. Overview

**Creative North Star: "The Flight Deck"**

Calm cockpit instrumentation, not a marketing surface: deep Core Blue, thin
precise display type, hairline dividers, and shadows that sit close to the
surface like cabin lighting rather than dramatic drop shadows. The system
already names its home screen `.cockpit` and its product the "LRN cockpit"
— this file makes that metaphor explicit as the design language, not just a
class name.

This explicitly rejects generic SaaS/AI-slop (gradient text, cream/sand body
backgrounds, tiny uppercase eyebrows on every section, identical card grids),
playful consumer-app gamification, and dense legacy-enterprise dashboard
clutter. It also rejects the site's own dead ends: an earlier
uppercase-mono-terminal button style and a later "SOTA micro-animations"
patch introduced a second, competing motion-token vocabulary — both are
drift to reconcile, not features to preserve.

**Key Characteristics:**
- One brand palette (Lufthansa Group: Core Blue, cool blue-greys, slate) expressed
  identically everywhere — never redefined per page.
- Thin/light display type paired with light/regular body type; weight
  contrast carries hierarchy, not size alone.
- Soft, blue-tinted ambient shadows; never hard-offset or neon.
- Pill buttons and chips, 12px-radius cards, 1px hairline borders throughout.
- Calm density: technical content (lessons, catalogs, notebooks) stays
  legible without decoration.

## 2. Colors

A single-hue-family, low-saturation palette: one deep blue carries authority,
cool blue-greys carry structure, and a small set of muted expression tones (teal,
purple, sand, red) exist only for badge/tier labeling, never as UI chrome.

### Primary
- **Core Blue** (`#05164d`): primary text (`--ink` / `--text-primary`),
  primary buttons, links, focus rings, the one color that reads as "brand"
  on the page.

### Secondary
- **Blue 500** (`#2d5fe4`): interactive accent — links, active states, focus
  outlines. Distinct from Core Blue so interactive elements are
  discoverable against static ink-blue text.
- **Blue 600** (`#243f9b`): hover state for both Core Blue and Blue 500
  actions.

### Tertiary
- **Teal** (`#368089`), **Purple** (`#a82e61`), **Sand** (`#857461`): badge
  tier / expression tones only. Never used for buttons, links, or body chrome.

### Neutral
- **Grey 100** (`#f6f8fc`): page background. A true cool blue-grey, not a
  cream/sand tone — do not drift it toward parchment.
- **Grey 200** (`#eef2f8`): sunken surfaces, code blocks, hover backgrounds.
- **Grey 300 / Grey 400** (`#dde4ef` / `#c7d1df`): hairline borders (300) and
  stronger borders/dividers (400).
- **Warm Grey** (`#627087`): muted/tertiary text.
- **White** (`#ffffff`): card and modal surfaces.

### Named Rules
**The One Blue Rule.** Core Blue is the only color that reads as "this is
the brand." Blue 500 is reserved for interaction, not decoration. Teal,
purple, and sand exist solely as badge-tier tints and must never leak into
buttons, nav, or links.

## 3. Typography

**Display Font:** Lufthansa Head (with Helvetica Neue, Arial fallback)
**Body Font:** Lufthansa Text (with Helvetica Neue, Arial fallback)
**Label and code font:** Lufthansa Text, with Helvetica Neue and Arial fallbacks.
No monospace font is visible anywhere, including code, metadata, and diagrams.

**Character:** Thin display weight against light/regular body weight reads
as precise and unhurried — an instrument panel, not a poster. Weight and
scale carry hierarchy; letter-spacing stays close to normal except on
overline labels.

### Hierarchy
- **Display** (weight 300, `clamp(48px, 6vw, 88px)`, line-height 1.05):
  landing hero only.
- **Headline** (weight 300, 44px, line-height 1.2): page-level H1.
- **Title** (weight 500, 26px, line-height 1.2): section/card headings (H3).
- **Body** (weight 400, 17px, line-height 1.5): running prose, capped at
  65–75ch in lesson content.
- **Label** (weight 500, 12px, letter-spacing 0.14em, uppercase): overline
  labels and badge-tier pills only — short (≤4 words), never full sentences.

### Named Rules
**The No-Terminal Rule.** Buttons and nav never use the mono font, uppercase
text, or wide tracking — that was the pre-rebrand terminal skin. Any rule
still doing this in `style.css` is dead code to remove, not a variant to keep.

## 4. Elevation

Soft, ambient, blue-tinted shadows — never hard-offset blocks. Depth reads as
proximity to a softly lit instrument panel, not as a drawn border. The
`--shadow-hard` / `--shadow-hard-lg` variable names are a legacy naming
holdover from an earlier hard-shadow era; the values themselves are already
soft. Treat the names as debt, not as license to reintroduce hard shadows.

### Shadow Vocabulary
- **xs** (`0 1px 2px rgba(5, 22, 77, 0.05)`): hairline separation, e.g. tight
  inline controls.
- **sm** (`0 2px 8px rgba(5, 22, 77, 0.06)`): resting card/button state.
- **md** (`0 5px 15px rgba(5, 22, 77, 0.08)`): raised panels, popovers.
- **lg** (`0 14px 40px rgba(5, 22, 77, 0.12)`): modals, hover-lifted cards.
- **focus** (`0 0 0 3px rgba(45, 95, 228, 0.30)`): focus ring, Blue 500 at
  30% opacity.

### Named Rules
**The Ambient-Not-Structural Rule.** Shadows communicate gentle lift on
hover/focus; they never simulate a hard light source (no `6px 6px 0` offset
blocks — one such rule survives in `style.css` from the pre-rebrand terminal
design and should be deleted, not designed around).

## 5. Components

### Buttons — New LHIND Design System (aligned with Lufthansa Group DS)

We now use the official Lufthansa Group Design System Button component as the single source of truth:

- **Variants:**
  - `primary` (Core Blue #05164d bg, white text)
  - `secondary` (transparent, Core Blue text + border)
  - `ghost` (Blue-100 tint, Blue-600 text)
  - `tertiary` (inline text link, no padding, sentence-case only)
- **Shape:** always pill (`999px` radius)
- **Size:** `sm` / `md` / `lg` padding + font scaling
- **Hover:** darkens to Blue 600; soft blue-tinted ambient shadow lift
- **Usage:** Always sentence-case labels. Never mono font, never uppercase, never hard shadows. Use `full` for full-width. Pair with Phosphor icons via `iconLeft` / `iconRight` props in React contexts (otherwise plain CSS classes below).

See `site/lrn/tokens.css` for `--btn-*` tokens and `style.css` for `.btn*` classes.

### Chips / Badge-tier pills
- **Style:** pill shape, uppercase label type (12px, 0.08em tracking, ≤4
  words), tone-tinted background (neutral/blue/success/warning/error/teal/
  purple) matching the Named Rules in §2.
- **State:** tone is fixed per badge tier, not interactive — no hover state.

### Cards / Containers
- **Corner Style:** 12px radius.
- **Background:** white surface on Grey 100 page background.
- **Shadow Strategy:** `sm` at rest; `lg` on hover where the card is
  interactive.
- **Border:** 1px hairline in Grey 300, used alongside (not instead of)
  shadow — the two together read as "soft card," not "flat outlined box."
- **Internal Padding:** 24px.

### Learning visualizations

`site/learning-visuals.js` and `site/learning-visuals.css` are the shared,
zero-dependency visualization layer for structural and quantitative learning
views. Lesson routes derive from real section headings, course routes derive
from curriculum units and reading progress, catalog bars derive from the
active lesson result set, and assessment bars use the same target-met ratio as
the published score. Never invent illustrative progress or average ordinal
Basic / Advanced / Expert levels as if their intervals were numeric.

### Learning-home course path

The returning learning home uses one aligned white syllabus surface rather
than a recommendation card beside a separate map. Its compact header names
the selected role and keeps the path-edit action within reach. A five-area
selector always exposes each area's current level or “Not assessed” and its
named role target. Selecting an area reveals the complete ordered course
sequence under Acquire, Deepen, and Create headers. The next actionable course
is a labelled row in that sequence; it may receive the primary action styling,
while every other row keeps a quiet outlined action. Stage headers name current
and target states in text, so a marker never carries meaning by color alone.

The course sequence is a suggested reading order, not a claim that adjacent
courses are prerequisites. Actual preparation is named and linked from the
blocked course. Course details expand to authored curriculum units and lesson
titles; direct lesson links appear only when that course is actionable or
complete. Shared-course contributions, unavailable coverage, completed
coursework awaiting assessment, and beyond-target stages remain explicit.
This desktop surface uses one repeated row rhythm and hairline separation;
avoid tall gray panels, unequal card heights, and isolated next-step cards.
Keep coverage and evidence notes in the path-details disclosure, and keep a
course's active-area focus reason in its own details rather than repeating
microcopy in every row.

### My progress

`personal-plan.html` is the desktop progress-only compatibility route for the
same role journey. It has no custom-plan builder or tabs: authored curriculum
paths remain the sole route structure. Course and lesson counts describe
activity; capability evidence makes the separate, narrower competence claim.
`skills.html` redirects here. Use one shared assessment-import disclosure and
the same aligned white surface and hairline row rhythm as the learning home;
do not introduce a second visual system or token set.

Profile editing is a dedicated home view with its own heading, active sidebar
state, and a backlink to the whitelisted learning or progress origin. Hide the
catalog only in that view. Keep global headers limited to identity and utility
controls; progress shortcuts do not repeat across home, workspace, course, or
lesson routes. The sidebar has no descriptive tagline.

- **Authored concepts:** Mermaid or SVG only, following the repository rule.
  Use Mermaid for relationships and flows; use the existing figure registry
  for reusable interactive technical diagrams.
- **Derived orientation:** render as semantic lists, links, buttons, headings,
  and labelled chart roles first. Connector lines and bars are a visual layer,
  not the sole carrier of meaning.
- **Responsive behavior:** horizontal routes become vertical below 760px.
  Dense phase distributions may scroll horizontally rather than compressing
  labels below legibility.
- **Color and state:** Core Blue communicates the active or matching value;
  neutral tracks show the available whole. Complete/current states must remain
  named for assistive technology and cannot rely on color alone.
- **Motion:** visualization values update without animating layout properties.
  Honor `prefers-reduced-motion` for any future explanatory motion.

**The Source-of-Truth Visuals Rule.** Every structural or quantitative view is
derived from authored headings, curriculum maps, filters, or published scoring
logic. Never invent illustrative progress and never turn unknown data into a
zero value.

### Navigation
- **Style:** fixed `nav-edge` header, wordmark left, pill-shaped icon buttons
  right (badges, language/theme toggle). Hairline bottom border, translucent
  background over blur on scroll.
- **Typography:** body font, no uppercase, no mono — this is a common
  regression point (see §3 No-Terminal Rule).

## 6. Do's and Don'ts

### Do:
- **Do** treat `site/lrn/tokens.css` as the single source of truth for every
  color, spacing, radius, shadow, and motion value. Other stylesheets should
  reference it, not redeclare the same hex values under different names.
- **Do** keep buttons pill-shaped (999px), cards at 12px radius, and borders
  at 1px hairline everywhere, on every page.
- **Do** keep shadows soft and blue-tinted (`rgba(5, 22, 77, …)`), scaling
  from `xs` to `lg` by context, never by inventing a new one-off value.
- **Do** put every composite learning link on the `.interactive-surface`
  contract; cards additionally use `.interactive-card`. Card variants own
  layout only; shared hover/focus behavior and the `__icon`/`__action` slots
  are controlled centrally by card tokens. Underlines are reserved for
  unclassed prose links and `.text-link`, never patched per component family.
- **Do** load the same stylesheet composition on every page. Right now
  `index.html` loads only `lrn.css`+`badges.css`, `about.html`/`catalog.html`/
  `glossary.html`/`assessment.html`/`prereqs.html` load only `style.css`,
  `lesson.html` loads `style.css`+`badges.css`, and `badges.html` loads all
  three — reconcile to one deliberate composition.

### Don't:
- **Don't** hand-duplicate the LHG palette in `style.css`'s own `:root`
  (`--bg: #f6f8fc`, `--ink: #05164d`, etc.) as a second, independently
  maintained copy of what `lrn/tokens.css` already defines under different
  names (`--color-bg`, `--text-primary`). Two copies of one palette is how
  it silently drifts.
- **Don't** run two motion-token systems side by side. `lrn/tokens.css`
  already defines `--ease-standard`/`--dur-base`; `style.css`'s later
  "Antigravity SOTA Micro-animations" block invents a parallel
  `--sota-ease`/`--sota-duration` and layers `!important` transitions on top
  of the earlier `.btn` rule instead of replacing it.
- **Don't** leave superseded rules in place when a new visual direction
  replaces one. `style.css` still carries an uppercase-mono-terminal `.btn`
  definition (font-mono, uppercase, square corners, invert-on-hover) below
  the pill-button rule that overrides it — dead weight, not a fallback.
- **Don't** use gradient text, cream/sand/parchment backgrounds, tiny
  uppercase eyebrows on every section, identical card grids, or side-stripe
  borders — the standing anti-references from PRODUCT.md.
- **Don't** reintroduce hard-offset shadows (`box-shadow: 6px 6px 0 var(--ink)`
  still exists at one call site in `style.css`) — soft/blue-tinted only.

User-approved neutral palette: light surfaces and borders use cool blue-grey
values from the shared tokens; legacy token names remain for compatibility.

Learning-area selectors use a full-width current → target text row and an
ordinal three-stage rail. Stages stay on one line, outside narrow chips. The
current stage is bold; the target is secondary. Labels remain accessible.

Course rows use a single separator and an icon beside the title. Course details
use a chevron disclosure; unit groups reuse the cool sunken-surface token.
Reached competency stages have a decorative checked-square marker and retain
a collapsed course list. Course completion remains a separate state.

Course icons come from the central topic mapping in `site/lrn/learning-icons.js`.
Use the matching topic symbol across the 47 courses, with consistent SVG size
and stroke weight. Reserve the book symbol for knowledge and reference topics.

Lesson navigation uses sentence-case Lufthansa Text, grouped unit headers, and
equal-height section links in a three-column desktop grid. Outcome cards have
24px padding and no extra top margin on their heading.

The progress page is an activity history, without the home dimension selector
or a global focus dropdown. Started/completed courses use one aligned list:
topic icon, title, completed lesson count, reading percentage, and course link.
Keep practical self-checks and capability evidence in separate disclosures.
Never imply that reading or course completion automatically proves competence.
