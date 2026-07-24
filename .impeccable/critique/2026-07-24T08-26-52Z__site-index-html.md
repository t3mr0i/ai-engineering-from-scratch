---
target: site/index.html (LHIND Learning Catalog dashboard)
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-07-24T08-26-52Z
slug: site-index-html
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Progress bars at 2%/13% fills are nearly indistinguishable from empty |
| 2 | Match System / Real World | 3 | "LV2 · Foundation" / "on-path tasks" are unexplained internal jargon |
| 3 | User Control and Freedom | 3 | "Reset" link scope is ambiguous (chips only, or status tab too?) |
| 4 | Consistency and Standards | 2 | EN locale shows German "Glossar"; two equal-weight navy CTAs compete |
| 5 | Error Prevention | 3 | No destructive actions visible; empty-state class exists as a net |
| 6 | Recognition Rather Than Recall | 3 | Filter state stays visible, but "Reset" scope still requires recall |
| 7 | Flexibility and Efficiency | 2 | No search/sort for the catalog; no shortcuts for repeat visitors |
| 8 | Aesthetic and Minimalist Design | 3 | Clean grid, but two CTAs + two pill rows front-load the page |
| 9 | Error Recovery | 3 | No error states observed either way; no negative evidence |
| 10 | Help and Documentation | 3 | Glossary link exists (mislabeled) but no inline help on level codes |
| **Total** | | **28/40** | **Good** |

## Design Specificity Verdict

**LLM assessment**: Competently built but generic-feeling. The hero greeting and resume mechanism follow the exact pattern of Duolingo/LinkedIn Learning/Coursera dashboards. The underlying resume feature is genuinely specific (reads the real last-visited lesson from storage and names it), but the surface language never cashes in on that — it could greet a user of any SaaS product. The LHIND-specific taxonomy (profiles, LV-levels, on-path tasks) is present only as unexplained jargon, not an authored voice.

**Deterministic scan**: `detect.mjs --json site/index.html` ran clean but returned `[]` — inconclusive, not a clean bill of health. `index.html` is a thin shell; the real DOM (course cards, chips) is built at runtime by `lrn/lrn.js` from `lrn/data.js`, so a static markup scan sees empty containers only.

**Visual overlays**: Not available. No live URL was provided — only two static screenshots — so no browser injection/overlay was attempted or shown. Findings below come from direct visual inspection plus source grep (`site/lrn/lrn.css`, `site/i18n.js`).

## Overall Impression

The warm, personalized opening ("Good morning! Ready to continue?" naming your actual last lesson) is real craft undercut immediately by three unforced errors: a shipped locale bug (German word in the English UI), two equal-weight primary buttons fighting for the same click, and a six-category color-coding system that's wired into the CSS but never turned on, leaving every course icon the same pale blue. Fix those three and the score jumps a full band.

## What's Working

1. **Card alignment engineering** — `min-height` + `margin-block-start: auto` on card footers keep every progress bar aligned across a row regardless of title length. Deliberate CSS, not luck.
2. **Real resume personalization** — "Continue Prompt Engineering" reads the actual last-visited lesson from storage rather than a generic "Continue learning."
3. **Card hover micro-interaction** — the circular arrow fills solid and nudges right on hover, reinforcing the click target.

## Priority Issues

**[P0] Locale bug: English UI shows the German word "Glossar"**
- **Why it matters**: `i18n.js` maps `nav_glossary: { en: "Glossar", de: "Glossar" }` — both screenshots show "Glossar" with the language toggle set to "EN". A shipped, verifiable defect, not a matter of taste; it reads as untested localization on every page load.
- **Fix**: correct the `en` value to `"Glossary"`.
- **Suggested command**: `/impeccable harden`

**[P1] Two competing primary CTAs above the fold**
- **Why it matters**: "Continue Prompt Engineering" (hero) and "Open 11 on-path tasks" (selector card) are both solid-navy, same-size pills ~150px apart. Violates Hick's Law — the single highest-frequency action now requires comparing two equal-weight buttons instead of acting immediately.
- **Fix**: demote one to a secondary/outline style, or fold it into the selector card as a smaller text link, so there's one unambiguous default action.
- **Suggested command**: `/impeccable layout`

**[P1] Category color-coding is wired up but disabled**
- **Why it matters**: `lrn.css` defines six `data-theme` variants (foundation/productivity/consulting/engineering/governance/leadership) but all six set the identical `--tile-ink`/`--tile-bg` pair. Every icon tile renders the same pale blue, losing a pre-attentive scanning cue exactly when a user is scanning 11 cards by category. Reads as an unfinished/reverted feature since the plumbing still exists.
- **Fix**: restore differentiated tints per category, or delete the unused per-theme selectors so the code doesn't imply a feature that isn't there.
- **Suggested command**: `/impeccable colorize`

**[P2] Progress bars illegible at low percentages**
- **Why it matters**: a ~4px bar with 2%/13% fills is visually near-identical to empty. Undermines visibility of system status — scanning "which course did I barely touch" only works by reading the numeral, defeating the point of a bar.
- **Fix**: enforce a minimum visible fill width below some threshold, or increase bar height slightly.
- **Suggested command**: `/impeccable polish`

**[P2] Redundant-looking pill filter rows**
- **Why it matters**: the Interests chip row (multi-select) and the status tab row (Recommended/Optional/Started/Completed/All, single-select) share nearly identical styling — same `min-height: 36px`, same pill radius, same solid-navy active fill. Confirmed in code (`.chip` vs `.seg-btn`). Two adjacent rows with different selection semantics but identical "selected" visual language risk being read as one confusing control, and make the "Reset" link's scope ambiguous.
- **Fix**: give the two rows a stronger structural distinction (e.g. sunken track for the exclusive tab row vs. flat pills for multi-select tags), and label or scope "Reset" explicitly.
- **Suggested command**: `/impeccable layout`

**[P2] Muted text sits at the AA contrast floor**
- **Why it matters**: `--text-muted: #7a7673` on white computes to ≈4.5:1 — the exact WCAG AA cutoff with zero margin — used repeatedly for "N lessons" meta and percentage labels at small caption size.
- **Fix**: darken `--text-muted` slightly for a safety margin (~4.8–5:1).
- **Suggested command**: `/impeccable audit`

## Persona Red Flags

**Alex (Power User)**: Every return visit costs an extra comparison between two equal-weight CTAs — friction on the exact task Alex does most, every time. Flattened progress bars also cost time scanning many in-flight courses, since bar length can't be trusted and each card must be read individually. No search/sort for an 11+ course catalog either.

**Jordan (First-Timer)**: The pre-selected "Technology Consulting" / "LV2 · Foundation" appears with no visible explanation of what determined it or what the LV1-LV5 scale means — no way to self-diagnose whether the assignment is correct. Both screenshots already show mid-progress data, so the true first-time zero state (no resume button, empty grid) is unverified from this evidence and worth checking directly.

## Minor Observations

- `hero h1 { white-space: nowrap }` risks overflow on narrow viewports or longer localized (DE) strings.
- "11 courses" (result line) and "Open 11 on-path tasks" (CTA) show the same number twice on one screen — consistent, but redundant.
- The two captured screenshots differ only in viewport/zoom (2048×1075 vs 2054×1004) and capture timing (~53s apart) — no actual layout regression between them, so they don't exercise a real responsive breakpoint.
- Course-card titles have a fixed two-line height budget with no visible line-clamp/ellipsis fallback — a longer localized (DE) title could overflow silently; worth a regression check.

## Questions to Consider

- If every category tile renders the same shade of blue, was that an intentional simplification or an accidental regression — and does anyone on the team know?
- If you deleted either the hero "Continue X" button or the "Open N on-path tasks" button, would any user complete their task less successfully? If not, why do both exist?
- What would it take for the hero copy to sound unmistakably like an internal Lufthansa AI-training tool rather than a generic SaaS dashboard, given the resume mechanism underneath is already genuinely well-built?
