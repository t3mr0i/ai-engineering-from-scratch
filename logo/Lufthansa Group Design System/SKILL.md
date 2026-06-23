---
name: lufthansa-group-design
description: Use this skill to generate well-branded interfaces and assets for the Lufthansa Group corporate identity (the new LHG brand) — for production or throwaway prototypes, mocks, slides and documents. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc.), copy
assets out of `assets/` and create static HTML files for the user to view, linking
`styles.css` for tokens. If working on production code, copy assets and read the
rules here to become an expert in designing with this brand.

Quick start:
- **Tokens / colors / type:** link `styles.css`; use the `--lhg-*` and semantic
  aliases. Core Blue `#05164d` is the anchor; Blue 500 `#2d5fe4` carries
  interaction. Headlines are *thin* with tight tracking, sentence case.
- **Components:** load `_ds_bundle.js`, then read primitives from
  `window.LufthansaGroupDesignSystem_70bbed` (Button, Input, Card, Badge, Stat,
  Tabs, Alert, …). See each component's `.prompt.md`.
- **Voice:** confident, calm, sustainable; "we"/"you"; no emoji; headlines end
  with a full stop.
- **Logos:** `assets/logos/lh-crane.svg` + `lhg-lockup.svg` (navy; reverse to
  white with `filter: brightness(0) invert(1)`).

If the user invokes this skill without other guidance, ask them what they want to
build or design, ask a few questions, and act as an expert designer who outputs
HTML artifacts or production code, depending on the need.

Note: brand icons are substituted (Phosphor Light) — see the note in `readme.md`.
The authentic Lufthansa Head / Text / Serif webfonts are embedded.
