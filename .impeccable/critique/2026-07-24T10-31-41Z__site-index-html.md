---
target: site/index.html
total_score: 31
max_score: 36
na_heuristics: 5
p0_count: 1
p1_count: 1
timestamp: 2026-07-24T10-31-41Z
slug: site-index-html
---
Method: dual-agent (A: design-reviewer · B: general-purpose)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Progress bars/active pills are clear, but the primary "Continue" CTA visually disappears into the hero at rest |
| 2 | Match System / Real World | 4 | "LV2 · Foundation" is a sanctioned external-assessment code per this project's own taxonomy, not raw jargon leakage |
| 3 | User Control and Freedom | 4 | Reset link, deselectable chips, no traps observed |
| 4 | Consistency and Standards | 3 | `.course-card` hover is defined twice with conflicting values — one calm, one `!important`-forced |
| 5 | Error Prevention | n/a | No destructive/form actions on this surface |
| 6 | Recognition Rather Than Recall | 4 | Active filters/progress persist visibly |
| 7 | Flexibility and Efficiency | 3 | No accelerators, but task complexity doesn't obviously need any |
| 8 | Aesthetic and Minimalist Design | 3 | Category-color leak + rotate-on-hover flourish dilute the "calm enterprise" aesthetic |
| 9 | Error Recovery | 4 | An empty state exists in CSS, just not visible in this screenshot |
| 10 | Help and Documentation | 3 | Glossary link is good; no inline context for "LV2" for less-oriented users |
| **Total** | | **31/36** | **Good (86%)** |

*(Error Prevention scored n/a — no destructive or form actions on this catalog surface.)*

#### Design Specificity Verdict

**LLM assessment**: This isn't generic SaaS-slop at the structural level — the token spine is genuinely authored: Core Blue `#05164d`, embedded Lufthansa Head/Text at weight 300, pill radii, blue-tinted ambient shadows, a correctly-scoped overline-label exception. The IA (Profile → Level → Interests → Status filter → Grid) is a defensible model for a role-based enterprise catalog, not a templated dashboard.

Two things undercut the "authored for this product" read:
1. `site/lrn/lrn.css:610–615` assigns teal/purple/sand to course-card category tiles — directly contradicting DESIGN.md's rule that those hues exist *only* for badge-tier tints. Five of six visible interest categories leak an off-brand color into UI chrome.
2. A block titled "Antigravity SOTA Micro-animations & Premium UI polish" (`lrn.css:1180+`) bolts on `!important` hover flourishes — card lift 5px + scale 1.01, tile `rotate(1deg)` on hover — that duplicate and override an earlier, calmer definition. This is exactly the "second, competing motion-token vocabulary" DESIGN.md already calls out as drift to reconcile, not a feature. The 1° tile rotation in particular reads as consumer-gamified, which the brief explicitly wants avoided.

**Deterministic scan**: `detect.mjs --json site/index.html` ran clean — exit code 0, zero findings. No detector-flagged anti-patterns, no false positives to adjudicate.

**Visual overlays**: Not run — no dev server was available in this task, so this was a static source + screenshot review, not a live-page injection pass. Any purely runtime-only issues (post-JS layout shifts, actual hover states, `i18n.js` behavior) aren't covered here.

#### Overall Impression

The bones are right and the brand system is real, not decorative. The two things actually wrong are both self-inflicted regressions from add-on edits, not the original design: a color rule violated in the course grid, and a motion patch layered on top instead of replacing what it was meant to replace. Fix those two and this is a genuinely calm, well-specified enterprise surface — the biggest opportunity is just reconciling `lrn.css` back to its own stated rules.

#### What's Working

- **The selector card** (Profile/Level/CTA overlap on the hero): correct nested-radius discipline — 12px card containing a pill CTA — and soft shadow, not a hard drop shadow.
- **Course-card progress meters**: length-encoded (bar position, not color-only) with `tabular-nums` on the percentage — a genuinely careful, Cleveland-McGill-compliant detail most teams skip.
- **Overline labels** ("PROFILE", "LEVEL", "INTERESTS"): correctly the one sanctioned uppercase exception (12px, 0.14em tracking) — not a slop tell, matches DESIGN.md §3 exactly.

#### Priority Issues

**[P0] The one CTA users return for is nearly invisible.**
- **Why it matters**: "Continue Prompt Engineering" is the single most important action on the page — it's the resume-where-I-left-off button for a workday tool. Its background (`--lhg-core-blue`, `#05164d`) is the *same color* the hero gradient bottoms out to (`lrn.css:216`). At rest it reads as a thin white outline floating on a same-color field; it only separates on hover. A user scanning quickly can miss it entirely.
- **Fix**: Give the button a lighter fill at rest — Blue 500 (`#2d5fe4`) solid, or a translucent white fill — so it separates from the hero band without needing a hover state to prove it exists.
- **Suggested command**: `/impeccable polish`

**[P1] Category tile colors violate the One Blue Rule.**
- **Why it matters**: `lrn.css:610–615` hands teal/purple/sand to course-card category icons. DESIGN.md is explicit that those three tones exist *only* for badge-tier tints and "must never leak into buttons, nav, or links." Five of six visible category tiles now leak brand-reserved color into everyday chrome, which is exactly the "identical card grids" vs. "confident single-hue system" distinction the brief cares about — right now it reads like the badge palette bled into the wrong screen.
- **Fix**: Replace category tint with tone/shade variation within the blue family (e.g. Blue-100 tile bg with Core Blue icon); reserve teal/purple/sand exclusively for the badges surface they were designed for.
- **Suggested command**: `/impeccable colorize`

**[P2] Two conflicting hover-motion systems on the same component.**
- **Why it matters**: `.course-card` hover is defined once calmly (~line 592–639) and again later with `!important` (line 1180–1330 block, labeled "Antigravity SOTA Micro-animations") — `translateY(-2px)` vs. `translateY(-5px) scale(1.01)` plus an added `rotate(1deg)` on the icon tile. This is DESIGN.md's own documented anti-pattern ("Don't run two motion-token systems side by side") reappearing in the exact file it warns about. The rotation specifically reads as playful/consumer, which contradicts the "enterprise trust over consumer flourish" principle.
- **Fix**: Delete the later `!important` block; keep one hover spec. Drop the tile rotation.
- **Suggested command**: `/impeccable animate`

**[P3] Pre-applied filter chips give no reason for being pre-applied.**
- **Why it matters**: "Foundations" and "Productivity" chips arrive active by default with no visible explanation that they're inferred from profile/level rather than user-chosen. A returning user has to notice and mentally reconcile state they didn't set — a small but real trust/transparency cost.
- **Fix**: A short inline note ("based on your profile") or a distinct visual treatment for system-suggested vs. user-picked chips.
- **Suggested command**: `/impeccable clarify`

**[P3] Hardcoded shadow values drift from the documented scale.**
- **Why it matters**: `lrn.css:244, 251, 312, 1191, 1254` use one-off shadow values (e.g. `0 15px 35px -10px rgba(5,22,77,0.45)`) that don't match any of the four named steps in `tokens.css` (`xs` 0.05 / `sm` 0.06 / `md` 0.08 / `lg` 0.12). The hue is correct (Core Blue, per rule) but the opacities are ad hoc — this is the low-grade token drift DESIGN.md flags elsewhere as debt, appearing again in a newer file.
- **Fix**: Consolidate onto the named `--shadow-*` tokens, or explicitly document these as an intentional 5th "elevated hover" tier if the extra punch is wanted.
- **Suggested command**: `/impeccable audit`

#### Persona Red Flags

**Alex (Power User)**: No keyboard shortcuts detected for filter/interest selection. Nothing blocks Alex, but nothing accelerates them either — every session starts from the same six-chip, five-tab scan even for someone who always filters the same way. Low risk on this surface, but worth noting if usage data shows repeat-filter behavior.

**Sam (Accessibility-Dependent User)**: The `.theme-toggle` "EN" control uses `font-mono` + uppercase — a small echo of the explicitly-banned "terminal button" pattern (low severity, but a screen reader user gets no special benefit from it, and it's the one place mono/uppercase survived into an otherwise-compliant button system). The P0 CTA-visibility issue above compounds for low-vision users specifically: white-outline-on-same-color-fill likely fails a comfortable contrast margin at rest, not just an aesthetic near-miss.

#### Minor Observations

- 11 courses total, only 8 tiles rendered above the fold with a plain "11 courses" count — fine functionally, but no loading/skeleton state visible for slower connections.
- Hero `h1` sits under `white-space: nowrap` below a breakpoint (`lrn.css:263–272`) — a long localized greeting or long course name in "Continue X" could clip at mid-viewport widths; worth a truncation or dynamic sizing check.
- Stylesheet loading: `index.html` intentionally loads only `lrn.css` (not `style.css`, unlike every other page) — confirmed intentional per `lrn.css`'s own comment that cockpit-surface classes were migrated there. Flagging only because it's an easy thing to break by copy-pasting a `<head>` from another page later.

#### Questions to Consider

- If teal/purple/sand are reserved for the one badge screen, why is the course grid — the highest-traffic surface on the site — the one spending all three of them?
- Was the hero CTA's dark-on-dark fill at rest an intentional "quiet" choice, or a gradient-endpoint collision nobody checked outside of hover state?
- The pre-selected chips are inferred personalization — is that worth the trust cost of looking like leftover state from a prior session?
