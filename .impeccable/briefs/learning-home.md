# Learning home

**Mode:** Operate  
**Primary surface:** `site/index.html`  
**Related implementation:** `site/lrn/readiness-home.js`,
`site/lrn/readiness-home.css`, `site/lrn/readiness-map.js`,
`site/lrn/readiness-map.css`, `site/lrn/readiness-setup-state.js`,
`site/lrn/learning-journey.js`, `site/lrn/learning-icons.js`  
**Authority:** User-approved learning-home concept; existing `DESIGN.md`
and `site/lrn/tokens.css` retain visual authority.

## Task and audience

An LHIND employee arrives during a workday to decide what to learn next for
their role. Setup establishes a personal starting point; repeat visits open a
role-specific syllabus across parallel competency areas. Success means seeing
the current level, recommended destination, preparation, and next useful
course in its actual course sequence without interpreting internal curriculum
identifiers.

## Direction contract

**THESIS:** A welcoming learning workspace presents the chosen area's full
course sequence while keeping all parallel competence targets visible. The
user requested Codecademy's clear enrolled-skill-path structure while
preserving the existing brand.

**OWN-WORLD:** Preserve the Flight Deck identity: Lufthansa typography, Core
Blue actions, neutral surfaces, pill controls, and precise hairline separation.
Use a compact neutral welcome and the existing medium heading weight. Small
authored SVG icons support orientation without introducing new imagery.

**STORY:** Connect an assessment, confirm the role, compare starting points
with recommended targets, then save. Return directly to the confirmed role's
path, choose an area, and continue from the marked actionable course.

**FIRST VIEWPORT:** A persistent left navigation frames a compact welcome on
the neutral page surface. Setup places the upload and its actions in the main
column, with a level guide alongside. Returning home places the selected role,
an edit-path action, all five area targets, and the beginning of the selected
area's white, aligned syllabus in one view. The marked next course appears as
one row in that sequence, not as a separate recommendation card.

**FORM:** User-selected setup followed by a selected-area syllabus and visible
parallel targets. Direction position and seed key are not applicable: the user
explicitly approved this form, with the incumbent visual identity preserved.

**DELIVERY SCOPE:** This iteration is desktop-only. Preserve existing narrow
screen behavior; no mobile redesign or review is part of this delivery.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Setup and return visits

The three steps are “Dein Wissen,” “Deine Rolle,” and “Dein Lernweg” in German.
Apply the supportive voice defined in `PRODUCT.md`: build on what the learner
knows and explain the next action in familiar words.

1. Prominently offer the shared assessment prompt before the path. It provides
   “Start official assessment,” upload, and skip actions. Explain Acquire,
   Deepen, and Create before asking the learner to interpret targets. An
   existing import can lead directly to role confirmation. Opening the external
   SharePoint assessment does not hide this prompt.
2. Confirm the inferred or selected role. Show the recommended level for each
   area and identify whether targets come from the role reference or import.
3. Review current versus recommended levels, including unknown values and
   differences between imported and reference targets. Save explicitly with
   “Use these learning paths.”

Ordinary return visits with a confirmed current role bypass setup. “Role &
assessment” opens `index.html?view=profile` with `from=progress` or
`from=learning`; only those origins are accepted. This dedicated view has its
own “Role & Assessment” heading, active sidebar state, backlink, and hidden
catalog. Applying a change returns to the allowed origin. Normal home behavior
is unchanged. Confirmation is local to the browser and tied to the current
role. If storage fails, the learner can continue for the session with a visible
notice.

Returning home leads directly to the confirmed role's path. Its top line names
the role and provides “Edit path” for role or assessment changes. A compact
five-area selector shows each area's current level or “Not assessed” alongside
its named role target. Selecting an area reveals a full, ordered syllabus:
Acquire, Deepen, and Create stage headers and every matching course title stay
visible. The first ready or in-progress course in that area is labelled as the
next useful step and has the primary action; the remaining usable courses have
quiet outlined actions in their own rows.

Each row uses the active area's capability as its reason. A blocked course
names and links its required preparation directly; the displayed sequence is a
suggested reading order and must not imply extra prerequisites. Expanding a
course reveals its shared-area contributions, preparation, and only authored
curriculum units and lesson titles. Direct lesson links appear only for an
actionable or completed course. Shared courses retain one underlying progress
and prerequisite state across areas. Coverage and evidence notes stay in the
path-details disclosure, and the active-area focus reason stays in course
details. Keep the catalog, personal plan, and capability evidence within reach.

## My progress

Only authored, prepared learning paths define the default journey. Learners do
not build custom plans; existing saved custom plans remain stored but do not
affect recommendations or path order. `personal-plan.html` is the desktop
progress-only compatibility URL for the selected role, with no plan builder or
tabs. It separates actual course and lesson counts from capability evidence and
uses one shared assessment-import disclosure. `skills.html` redirects here;
the sidebar exposes one “My progress” item.

Show the assessment prompt prominently at the top of both home and progress
until `model.assessmentAvailable` is true or the learner explicitly skips.
Store a skip for a selected role per role; before role selection, store it globally.
The prompt contains official-assessment, upload, and skip actions; opening the
external SharePoint assessment alone never hides it.

## Navigation and orientation

Keep “My learning,” “Learning areas,” and “Explore courses” together in the
desktop sidebar, followed by one “My progress” link. Show the areas link once
setup is complete and mark the active in-page location. At scroll positions
below 120px, “My learning” is active rather than “Learning areas.” Do not add
duplicate progress shortcuts to the global header on home, progress, course,
or lesson routes, and do not add a sidebar tagline.

Use the authored line icons for navigation and the five learning areas. Icons
are decorative companions to visible labels; their SVGs stay outside the
accessibility reading order. The welcome uses the page's neutral surface. The
returning path is one aligned white surface with repeated course-row rhythm and
hairline separation, not unequal gray cards. Course and profile details remain
optional disclosures so the primary learning action stays easy to find.

## Evidence and important states

- Unknown is “Not assessed,” never zero or an inferred Acquire level.
  Recommendations without assessment are visibly provisional.
- Show target provenance and distinguish self-assessment from demonstrated
  evidence. Reading or completing courses does not establish competence.
- A role may stop at Acquire or Deepen. Mark later stages as beyond the role
  target; keep areas without a role target separately discoverable.
- Distinguish available, in-progress, completed, preparation-open, unavailable,
  target-reached, and courses-completed-but-assessment-needed states. Expose
  missing course coverage rather than manufacturing a course or completion.
- When no course is immediately available, keep its stage visible and explain
  whether it contains an achieved target, preparation, or a coverage gap.
- Use semantic tables, lists, native disclosure controls, named states,
  keyboard focus, and English/German copy. Color alone cannot convey standing.

## Documentation boundary and verification

This brief records route behavior; `PRODUCT.md` owns durable purpose and
`DESIGN.md` owns visual rules. The existing design and sidecar remain intact.
No new imagery is required by this concept. Final visual and functional
verification belongs to the implementation finish review; this documentation
pass does not assert browser-test results.

The profile return origin also accepts `from=progress`, returning directly to
`personal-plan.html#progress`; unknown origins return to the learning path.

## Compact level overview

Area selectors show current and target in a full-width text row with an arrow
and a three-segment ordinal rail. Filled segments indicate the current level; an
outline marks the target. The rail is decorative and the named values remain
accessible. Unknown is never converted to Acquire. Profile confirmation omits
the target-difference and browser-storage prose and the action divider. Its
compact desktop layout fits the verified 1280 × 720 viewport without scrolling.

Reached stages remain collapsed, inspectable course groups with a checked
competency marker. Review courses come from the authored capability mappings
and do not become new recommendations or imply course completion. Course rows
use one divider, a course icon, and a chevron disclosure; curriculum units have
named, consistently spaced lesson rows instead of nested numbered lists.

Course icons use the central 12-topic mapping in `learning-icons.js`, covering
all 47 courses with one consistent SVG family. Books represent knowledge and
reference topics; other courses use their topic's symbol.


My learning owns role targets, the five dimensions, and the next useful course.
My progress owns started/completed courses, per-course reading percentages,
completed lesson counts, and confirmed practical self-checks. Capability evidence
stays in a disclosure; notes and assessment settings remain reachable. Do not
repeat the five dimension cards or a global focus selector on the progress page.
The home retains discoverable Academy learning paths and their preparation.
