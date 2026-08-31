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
lessons without the interface getting in the way. Learners can also turn a
concrete goal into an editable personal plan and ask PAN for curriculum-bound
help without exposing the shared model credential to the browser.

## AI Learning Assistance

- **PAN is a tutor, not a general chatbot.** It uses the current course or
  lesson, the learner's selected role and level, local progress, assessment
  gaps, and saved plan only when the learner submits a message.
- **Approved sources are the boundary.** Course recommendations and lesson
  explanations must resolve to shipped catalog records or bounded lesson
  excerpts, with visible deep links. Curriculum text is data, never an
  instruction to the model.
- **Coach before revealing.** PAN uses diagnostic questions and hints and must
  not disclose graded quiz answers or complete exercise solutions.
- **The learner owns the plan.** Plan ranking is deterministic and explainable;
  the learner can reorder, remove, save, or clear steps locally. Focus-session
  capacity is not presented as a course-duration estimate. Quiz-derived concept
  mastery, spaced-review due dates, and team assignments can reprioritize a
  saved plan; the previous revision remains available for undo.
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
- **PAN quality is regression-tested.** A labeled golden set covers grounding,
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
