---
target: site/index.html (LHIND Learning Catalog dashboard)
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-07-24T09-01-38Z
slug: site-index-html
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live-region announcements ("Profile set: X.") stay English-only regardless of active language |
| 2 | Match System / Real World | 3 | `LV1 · Basic` follows the required convention, but filter/level labels never translate to German |
| 3 | User Control and Freedom | 3 | Reset clears profile/level/interests/filter in one click with no undo (low risk, still a gap) |
| 4 | Consistency and Standards | 2 | A second `!important`-laden animation block duplicates `.course-card`/`.seg-btn`/`.chip`/`.selector-cta` rules on top of the original, calmer ones; i18n coverage is inconsistent (chrome translated, filters/levels/empty-states not) |
| 5 | Error Prevention | 3 | Reasonable input guards before writes; no confirm on Reset |
| 6 | Recognition Rather Than Recall | 3 | Chips/segmented control are recognition-first; icon tiles now help scanning post-fix |
| 7 | Flexibility and Efficiency | 2 | Fully-styled `.hero-search` exists in CSS with no markup — a built-then-abandoned search path, leaving only click filtering for 30+ courses |
| 8 | Aesthetic and Minimalist Design | 3 | Disciplined card composition undermined by a stacked hover animation (rotate + scale + lift + icon shift simultaneously) |
| 9 | Error Recovery | 3 | Empty-state copy is genuinely helpful, but English-only |
| 10 | Help and Documentation | 2 | No onboarding/tooltip explaining Profile/Level/Interests → Recommended relationship for first-time users |
| **Total** | | **27/40** | **Acceptable** |

*Note: this is not a straight regression from the fixes — it's a deeper pass. This run's Assessment A read the full source (not just screenshots) and surfaced structural issues (broken i18n on the primary filter surface, a duplicate animation rule block) that the first critique's screenshot-based review didn't reach. All 6 previously-flagged issues are independently confirmed fixed by Assessment B below.*

## Design Specificity Verdict

**LLM assessment**: Reads as genuinely authored at the token/layout level (Lufthansa navy hero, brand-blue chips, `LV1 · Basic` nomenclature, a real on-path/optional recommendation model, comments showing real product reasoning). But the implementation layer betrays AI-assisted churn: a second CSS block titled "Antigravity SOTA Micro-animations & Premium UI polish" re-declares `.course-card`, `.seg-btn`, `.chip`, `.selector-cta` with `!important` on top of earlier, calmer rules for the same selectors — bolted-on effects instead of edited originals. Combined with hardcoded, never-localized UI strings across the filter/status system despite a working EN/DE toggle, the surface is authored in outline but unfinished in execution.

**Deterministic scan**: `detect.mjs site/index.html` — exit 0, `[]`, clean. `detect.mjs site/lrn/lrn.css` — exit 2, 17 advisory findings: 6× `design-system-color` (undocumented hex at lines 130/142/158/174/1194/1242), 11× `design-system-font-size` (off type-ramp values at lines 239/267/298/372/502/625/702/799/949/1021/1041). All pre-existing, none newly introduced by the fix pass. The five new category-tile tint hex values (`#dcecee`, `#f3e1ea`, `#e8edfc`, `#eef0f3`, `#f2ede7`) are off-palette by the same rule but weren't flagged by this scan pass — worth formally adding to DESIGN.md rather than leaving as literal one-offs.

**Visual overlays**: Not available — no live URL/dev server this run; findings are from direct source reads, cross-checked against the code (not just screenshots).

## Overall Impression

The 6 fixes from the last pass all landed cleanly and are independently confirmed: the locale bug, the competing CTA, the disabled category colors, the identical chip/tab selected-states, the illegible progress bars, and the borderline text contrast are all resolved. But going deeper into the source this pass surfaced a more serious problem underneath: the language toggle is only a partial translation — the entire filter/status/level vocabulary a returning user interacts with every visit stays English-only even in German mode, which undercuts the toggle's own promise. There's also a duplicate, over-decorated animation layer stacked on top of the original component styles.

## What's Working

1. All 6 previously-flagged issues are confirmed fixed in code, not just claimed — Assessment B quoted the exact current lines for each.
2. The resume-button personalization (real last-visited lesson, graceful degradation when there's no history) remains genuinely well-built product thinking.
3. Card-grid alignment discipline (two-line clamp + pinned footer) still holds up under the new category-color fix — nothing broke.

## Priority Issues

**[P0] Filter/status vocabulary is hardcoded English-only despite a working language toggle**
- **Why it matters**: `renderFilters()`, `levelDefinitions`, the CTA label builder, and the `announce(...)` live-region calls in `lrn.js` never route through the i18n mechanism that the hero/nav/selector labels already use. A German-speaking user gets a fully localized header and hero, then hits English-only status tabs, level names, interest chips, and empty-state copy — reads as broken, not as a design choice, and breaks trust exactly when the toggle sets an expectation of full localization.
- **Fix**: audit every user-facing string in `lrn.js` and route it through the same `data-i18n`/i18n.js mechanism already used elsewhere on the page.
- **Suggested command**: `/impeccable harden`

**[P1] Duplicate `!important`-laden animation block contradicts the existing, calmer rule set**
- **Why it matters**: a later CSS block re-declares `.course-card`, `.course-card__tile`, `.seg-btn`, `.chip`, `.selector-cta` with `!important`, stacking tile rotation + scale + lift + icon shift simultaneously on hover — reads as generic "SaaS delight" against the restrained tone the rest of the page establishes, and duplicate selectors are a maintainability trap for the next edit.
- **Fix**: consolidate into one rule per selector; keep one clear hover affordance instead of four simultaneous motions.
- **Suggested command**: `/impeccable quieter`

**[P1] `.hero h1 { white-space: nowrap }` risk with longer localized greeting**
- **Why it matters**: the German greeting variant runs longer than English; combined with the fluid `clamp()` font size, this risks clipping/overflow at viewport widths just above the breakpoint where wrapping is re-enabled — a broken-looking headline on the page's first-impression element.
- **Fix**: verify at 641–768px in German; loosen the clamp ceiling or allow wrap earlier for longer-string locales.
- **Suggested command**: `/impeccable adapt`

**[P2] Two vocabularies for the same "on-path" concept**
- **Why it matters**: the selector-card CTA says "Open N on-path tasks" while the equivalent segmented-control state is labeled "Recommended" — the user has to map two different terms to one underlying filter state.
- **Fix**: use one consistent term across both controls.
- **Suggested command**: `/impeccable clarify`

**[P3] Built-and-abandoned search affordance**
- **Why it matters**: `.hero-search` and related classes are fully styled in CSS with focus states and shadows, but no corresponding markup exists in `index.html` — dead CSS with no render path, and a catalog of 30+ courses has no search, only click-driven chip/tab filtering.
- **Fix**: re-wire the search input into the DOM, or remove the orphaned CSS.
- **Suggested command**: `/impeccable distill`

## Persona Red Flags

**Time-pressed practitioner (quick resume)**: relies entirely on the hero resume button; if localStorage is cleared (shared machine, private browsing, locked-down corporate browser policy) the button silently disappears with zero fallback messaging — dropped straight into the generic catalog with no bridge back to where they were.

**German-speaking learner (the exact persona the language toggle exists to serve)**: hits the P0 above hardest — flips to German expecting full localization (as the toggle promises via the translated hero/nav), and lands on English-only status tabs, level names, interest chips, and empty-state copy on every single visit.

## Minor Observations

- `courseCode()` derives display codes (`C01`, `C02`) from array index per the LRN taxonomy rules in CLAUDE.md — correct approach, not checked whether raw ids (`AI-09` etc.) ever leak elsewhere on this page.
- `badges-link__count` toggles via a `data-show` attribute rather than a class, inconsistent with the rest of the codebase's class/`aria-pressed` state pattern — harmless but worth normalizing.
- The five new category-tile tint colors are off-palette per DESIGN.md's documented scale — legitimate as a new design-system addition, but should be formally added to DESIGN.md rather than left as literal one-offs.

## Questions to Consider

- If the language toggle only fully localizes the hero and chrome but not the actual filtering vocabulary used every visit, is German really "supported," or a partial translation that will regress every time a new filter option is added?
- The animation layer was clearly added in a separate pass on top of an already-finished component system — was there a review gate before it shipped, or did "polish" get bolted on unreviewed?
- Is the built-but-unwired `.hero-search` coming back, or should it be deleted now rather than left as confusing dead code?
