# Lufthansa Group Design System

A recreation of the **new Lufthansa Group corporate identity** (the unified "LHG"
brand applied across Lufthansa Group corporate communications, brand portal,
reports and presentations). Built for generating well-branded interfaces,
slides, documents and prototypes.

> **Scope note.** This is the *Lufthansa Group corporate* identity (deep-blue,
> calm, editorial), not the consumer **Lufthansa airline** booking product
> (which adds the yellow/midnight-blue livery treatment). The crane mark is
> shared; the system here is the corporate expression.

## Sources

All material was supplied as uploads (no live codebase / Figma):

- **LHG Brand Guidelines** (Frontify export, brand.lufthansagroup-style.com): pages
  *Typography*, *Layout Principles*, *Expressions*, *Digital Design Principles*
  — provided as saved HTML in `uploads/`. The authoritative theme CSS variables
  (`--lhg-color-*`, type ramp, button styles) were lifted from these.
- **Brand assets**: crane logo + "LUFTHANSA GROUP" lockup (SVG), the Expressions
  accent-colour specimen, the line-icon sheet, and brand photography — all in
  `uploads/`, the keepers copied into `assets/`.
- **`LH - Design Patterns.zip`** — supplied but not unpacked (12 MB, layout
  reference only).

The proprietary webfonts (Lufthansa Head / Text / Serif) live behind Frontify's
authenticated font API and **could not be downloaded** — see *Typography* below.

---

## Brand at a glance

Lufthansa Group is one of the world's largest aviation groups (Lufthansa, SWISS,
Austrian, Brussels, Eurowings, plus cargo, MRO and catering). The corporate brand
voice is **confident, forward-looking and sustainable** — "Shaping the future of
aviation." The visual world is **deep blue, spacious, and quiet**: thin elegant
headlines, generous white space, restrained accents, and a single iconic crane.

---

## CONTENT FUNDAMENTALS

**Voice.** Aspirational but grounded; premium without being loud. Statements are
short, declarative and outcome-oriented. Headlines read like promises:
*"Shaping the future of aviation."*, *"Taking travel to new heights."*,
*"Trust at every altitude."*, *"Discover the world, one detail at a time."*

**Tense & pronoun.** Collective first person — **"we"** ("We are connecting
people, cultures and economies in a sustainable way.") for corporate voice, and
**"you"** when addressing a customer/reader directly ("Is your luggage delayed?").

**Casing.** **Sentence case** everywhere — headlines, buttons, nav. The only
uppercase is the wordmark **LUFTHANSA GROUP** and small tracked overlines/labels.
Never Title Case headlines.

**Punctuation.** Headlines often end with a full stop — it gives the calm,
finished tone. Em dashes and commas for rhythm; minimal exclamation.

**Length.** Headlines 2–6 words. Sub-heads one sentence. Body kept tight; bullet
points are short noun phrases, not paragraphs.

**Numbers & data.** Plain, factual, metric-first ("CO₂ emissions reduced by up to
30 percent", "Ergebnis in Mio €  1.673", "Wachstum in %  85"). Figures are a hero
element in reports — large, thin, paired with a fine ring/arc chart.

**Emoji.** None. Ever. The tone is corporate-premium.

**Vibe.** Optimistic, responsible, engineered. Sustainability and connection are
the recurring themes. Avoid hype words and slang.

Example copy lifted from the brand world:
- "Shaping the future of aviation."
- "We are connecting people, cultures and economies in a sustainable way."
- "Aviation revolutionized by innovative technology."
- "Fly more sustainable today."
- "We are trained to the highest standards in emergency, first aid, and keeping
  our passengers happy with our inflight service."

---

## VISUAL FOUNDATIONS

**Colour.** A deep navy **Core Blue `#05164d`** is the brand anchor — it is the
text colour, the dark surface, and the logo. A bright **Blue 500 `#2d5fe4`**
carries all interaction (links, primary accents, focus). Neutrals are a **warm
grey** family (`#f9f8f8` page, `#f1f0ef` sunken, `#e3e1de` hairline). The
**Expressions** accent set — **Red `#bc0a1d`, Teal `#368089`, Purple `#a82e61`,
Sand `#857461`** — is used sparingly for data viz, category coding and campaign
moments, never as UI chrome. Overall feeling: blue-on-white, cool, trustworthy,
with the occasional warm accent.

**Typography.** Two-face system from one calm grotesque world. **Lufthansa Head**
(display) is set **thin/light with tight negative tracking** — the signature look
of the refreshed CI: big, airy, almost weightless headlines. **Lufthansa Text**
(body) is a humanist sans in light. A **Lufthansa Serif** exists for editorial
pull-quotes. Headlines are thin; nothing shouts in bold. (The authentic licensed
faces are embedded — see Typography note.)

**Backgrounds.** Predominantly **flat white / warm-grey**. The hero device is a
**deep-blue field** (solid `#05164d`) or a **subtle blue-to-blue gradient with a
faint arc/curve motif** (the "horizon" — a thin light line sweeping across the
blue, evoking flight paths). No noisy textures, no photographic clutter behind
text. Full-bleed **photography** appears as standalone blocks, not as text beds.

**Photography.** Human, warm, optimistic — real people (crew, travellers) shot in
natural light, often a single subject against sky or a coloured wash. Tones range
from warm golden (sky portraits) to cool teal and saturated magenta washes that
echo the accent palette. Never stocky or busy.

**Motion.** Calm and functional. Gentle fades and short slides on a standard ease
(`cubic-bezier(0.4,0,0.2,1)`); a slower `ease-out` for entrances. **No bounce, no
spring, no decorative looping.** Durations 140–420 ms.

**Hover / press.** Hover **darkens** (Core Blue → `#243f9b`) or reveals an
underline on links; secondary/ghost controls fill with a faint blue tint. Press
is a subtle darken, no aggressive scale. Nav icons shift from navy to Blue 500 on
hover.

**Borders & corners.** **Hairline 1px** borders in `#e3e1de`. Corners are softly
rounded: inputs/cards `12px`, large panels `20px`, and **buttons are full pill**
(`999px`). Nothing sharp, nothing heavily rounded-blobby.

**Shadows.** Low, soft, **blue-tinted** (`rgba(5,22,77,…)`), used to lift cards a
little off the warm-grey page (`0 5px 15px / 0.08`). No hard drop shadows. Elev­
ation is gentle; the system prefers borders + background contrast over heavy
shadow.

**Cards.** White surface, hairline border *or* soft shadow (rarely both), 12–20px
radius, generous internal padding (24–32px). Quiet.

**Transparency & blur.** Used in the navigation rail on hover (a white→transparent
gradient with backdrop-blur) and for scrims over photography. Sparingly elsewhere.

**Layout.** Generous margins, a calm grid, lots of breathing room. A fixed slim
**left navigation rail** (~120px) is the brand-portal pattern. Content respects a
~1200px max width with fluid side padding. Text columns stay narrow for
readability. Alignment is left, ragged-right.

---

## ICONOGRAPHY

Lufthansa Group uses a **single-weight, thin line-icon** set: outline only, ~1.5px
stroke, rounded joins, simple geometric forms (aircraft, suitcase, boarding pass,
people, checklist, devices). Icons are monochrome — Core Blue on light, white on
the accent chips shown in the brand sheet (`assets/brand/icon-sheet.jpg`). No
filled icons, no duotone, no emoji, no unicode-as-icon.

**We were not given the individual icon SVGs** (only the printed sheet). This
system therefore uses **[Phosphor Icons](https://phosphoricons.com/)** at *light*
weight as the closest free match (thin stroke, rounded terminals, same geometric
character). Load from CDN:

```html
<script src="https://unpkg.com/@phosphor-icons/web@2.1/src/light/index.js"></script>
<!-- usage: <i class="ph-light ph-airplane-tilt"></i> -->
```

⚠️ **Substitution flagged** — replace with the official LHG icon set when the SVGs
are available. The crane mark and wordmark lockup ARE authentic (`assets/logos/`).

---

## CONTENT INDEX

- `styles.css` — global entry (link this). Imports everything below.
- `tokens/` — `colors.css`, `fonts.css`, `typography.css`, `spacing.css`, `base.css`
- `assets/logos/` — crane (`lh-crane.svg`), `lhg-lockup.svg`, navy logo card
- `assets/brand/` — icon sheet, blue gradient field
- `assets/photography/` — brand portraits (sky / turquoise / magenta / devices)
- `guidelines/` — 15 foundation specimen cards (Design System tab)

**Components** (`window.LufthansaGroupDesignSystem_70bbed.*`) — 30 primitives
- `components/core/` — `Button`, `IconButton`, `Badge`, `Card`, `Stat`, `SegmentedControl`, `Divider`, `Stepper`
- `components/forms/` — `Input`, `Select`, `Textarea`, `SearchBar`, `Checkbox`, `RadioGroup`, `Switch`
- `components/navigation/` — `Tabs`, `Breadcrumb`, `Pagination`, `Accordion`, `NavRail`
- `components/feedback/` — `Alert`, `Toast`, `ProgressBar`, `Tooltip`
- `components/overlay/` — `Dialog`
- `components/data/` — `Avatar`, `Table`, `List`
- `components/travel/` — `FlightCard`, `FareCard`
- Each has a `.d.ts` (props) and `.prompt.md` (what/when + usage).

**UI kits**
- `ui_kits/corporate/` — Lufthansa Group corporate homepage (interactive).
- `ui_kits/booking/` — multi-step flight booking flow (search → results →
  checkout → confirmation), composing the travel + form components.

**Slides** (`slides/`) — five 1280×720 deck templates: `title`, `section`,
`stats`, `quote`, `image-text`.

**Templates** (copy-to-start, for consuming projects)
- `templates/landing/` — corporate landing one-pager (`Landing.dc.html`).

**Other**
- `SKILL.md` — portable skill manifest (Agent Skills compatible).

### ⚠️ Open items / substitutions
- **Fonts** — ✅ the authentic licensed **Lufthansa Head / Text / Serif** webfonts
  are embedded (`assets/fonts/*.woff2`, declared in `tokens/fonts.css`).
- **Icons** — official LHG line-icon SVGs were not provided (only a printed
  sheet). Using **Phosphor Icons, Light weight** as the closest free match.
- **`LH - Design Patterns.zip`** was provided but not unpacked.
