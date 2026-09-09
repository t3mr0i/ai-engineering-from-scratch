# Product

## Register

product

## Users

LHIND employees on role-based AI learning tracks. Profiles `R01-BSC` through
`R07-LEAD`, mapped to external assessment levels `LV1`–`LV5` and learning
paths `LP01`–`LP05` (see `CLAUDE.md` §3 for the full taxonomy). Their context
is a workday tool: they arrive to pick a learning path or course, work
through lesson content and runnable notebooks, and check progress/badges —
not a leisure browse.

## Product Purpose

A role-based AI-training cockpit for LHIND: course selection scoped to a
person's role and level, lesson delivery (narrative + runnable code via
JupyterLite), progress tracking, and badges. Success looks like an employee
finding the right course for their role without confusion about internal
curriculum jargon (`Pxx`/`Lxx` phase/lesson numbers are implementation
details, never surfaced in this UI — see `CLAUDE.md` §3), and completing
lessons without the interface getting in the way. Learning Navigator offers
curriculum-bound help without exposing the shared model credential to the
browser.

The learning home helps employees develop AI readiness for their role across
parallel competency areas. Each area has its own recommended Acquire, Deepen,
or Create target; reaching Create everywhere is not the goal. Learners connect
an assessment, confirm their role, and review their starting points against
those targets before saving their setup. Returning learners open their
confirmed role's learning path directly and can edit that path at its top.
They select an area to see its full, ordered Acquire / Deepen / Create course
sequence, including named preparation and how shared courses support other
areas. The next actionable course is marked within that sequence, rather than
presented as an isolated recommendation. Course details may reveal only the
real curriculum units and lesson titles. Unknown starting levels stay unknown,
and course completion records activity without claiming mastery. The route's
setup and return-visit behavior is defined in
[the learning-home brief](.impeccable/briefs/learning-home.md).

Only authored, prepared learning paths guide the default journey; learners do
not create custom plans. Existing saved custom plans remain stored for
compatibility but do not change default recommendations or path order.
`personal-plan.html` is the progress-only compatibility URL. It answers what
has actually been done: started and completed courses, completed lesson counts,
and passed practical self-checks. Each course shows its own reading percentage
and explicit completion count; reading 100% is not a completed course. All
capability evidence remains under a disclosure. Notes and assessment management
stay reachable. No duplicated dimension selector, global focus control, or
aggregate ordinal percentage appears here. The role, current/target dimensions,
and next course belong to My learning. `skills.html` redirects to progress.
The home also exposes all Academy paths as optional learning offers.

Role and assessment edits use `index.html?view=profile&from=progress` or
`index.html?view=profile&from=learning`; only those origins are accepted. This
dedicated view has its own “Role & Assessment” heading, active sidebar state,
and backlink. Applying the change returns to the allowed origin; the catalog
is hidden while editing. Normal home behavior is unchanged. Global header
shortcuts do not duplicate progress navigation on home, workspace, course, or
lesson routes.

## AI Learning Assistance

- **Learning Navigator is a tutor, not a general chatbot.** It uses the current course or
  lesson, the learner's selected role and level, local progress, assessment
  gaps, and saved plan only when the learner submits a message.
- **Approved sources are the boundary.** Course recommendations and lesson
  explanations must resolve to shipped catalog records or bounded lesson
  excerpts, with visible deep links. Curriculum text is data, never an
  instruction to the model.
- **Coach before revealing.** Learning Navigator uses diagnostic questions and hints and must
  not disclose graded quiz answers or complete exercise solutions.
- **Authored paths remain authoritative.** Recommendation order comes from
  shipped curriculum and progress state. Legacy saved custom plans remain
  available as stored data but do not alter the default learning journey.
- **Mastery requires observed evidence.** Reading and completion inform course
  progress but never raise concept mastery. Capability receipts require enough
  quiz observations, at least 80% modeled mastery, and a passed runnable
  self-check completed without revealing the solution.
- **Team learning stays pseudonymous.** Managers assign allowlisted courses via
  join codes and see aggregate completion and mastery. Learner reports use a
  browser-generated anonymous identifier rather than a name.
- **Receipts make a narrow claim.** The signed verifier proves issuer and
  evidence integrity for a self-directed assessment; it does not prove identity
  or proctoring and must say so in the learner and verifier UI.
- **Learning Navigator quality is regression-tested.** A labeled golden set covers grounding,
  citation validity, pedagogy, quiz leakage, prompt injection, latency, and token
  budgets. Runtime response safety fails closed before unsafe model output
  reaches the learner.
- **AI failure never blocks learning.** Courses, progress, assessment, and the
  saved plan remain usable when the internal gateway is unavailable.

## Brand Personality

Professional / corporate, calm / uncluttered. This runs on the existing
Lufthansa Group brand system (Core Blue, LHG Head/Text webfonts, soft
blue-tinted shadows — see `site/style.css` and `site/lrn/tokens.css`) rather
than a from-scratch identity; personality here means applying that system
consistently, not inventing a new one. Precise and information-dense where
the content demands it (lesson pages, catalogs), without reading as busy or
cluttered.

The voice is friendly and supportive: acknowledge the learner's existing
knowledge, invite a useful next step, and leave room to explore at their own
pace. Use familiar language for learning and progress; explain assessment
limits without framing an unknown level as a personal shortcoming. Pair clear
labels with consistent icons where helpful. Do not use emojis in the interface.

## Anti-references

Generic SaaS/AI-slop: gradient text, cream/sand/parchment body backgrounds,
tiny uppercase tracked eyebrows above every section, identical card grids,
side-stripe borders, hero-metric templates. Also avoid: playful/gamified
consumer-app styling (this is an internal enterprise tool, not a consumer
product) and dense legacy-enterprise dashboard clutter (cramped tables,
overloaded chrome).

## Design Principles

- One token system, not several drifted ones. The site currently spans
  `style.css`, `badges.css`, `lrn/tokens.css`, and `lrn/lrn.css` — reconcile
  drift back to a single source of truth rather than letting each surface
  keep its own variant of the same color/spacing/type scale.
- Lufthansa Group brand fidelity first. The palette, type, and shadow
  language in `site/style.css`/`site/lrn/tokens.css` are deliberate choices,
  not a placeholder to redesign — extend them, don't replace them.
- Calm density. Technical/precise content (lesson pages, catalogs, notebooks)
  should stay legible and uncluttered; resist the urge to decorate.
- Enterprise trust over consumer flourish. Motion, color, and copy should
  read as a dependable internal tool, not a startup landing page.
- Hide curriculum internals. `Pxx`/`Lxx` phase/lesson numbering stays a
  source-link detail; LRN-facing UI always uses the
  Profile→Level→Path→Course→Unit→Activity vocabulary (`CLAUDE.md` §3).

## Accessibility & Inclusion

WCAG AA baseline: text contrast ratios (≥4.5:1 body, ≥3:1 large text), visible
keyboard focus states, and full keyboard navigation across cockpit, catalog,
and lesson flows. No specific additional user needs called out beyond that.
