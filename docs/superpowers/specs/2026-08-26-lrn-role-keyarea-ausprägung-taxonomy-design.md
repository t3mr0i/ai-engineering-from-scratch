# LRN taxonomy: Role → Key Area → Ausprägung

## Problem

The LRN cockpit's taxonomy (CLAUDE.md §3) is `Profile -> External level -> Learning
path -> Course -> Unit -> Activity`. "Profile" is the wrong name for what it
actually represents (a Role, e.g. `R03-TC` Technology Consulting) — the `Rxx`
codes already imply this. Below Role, there is no modeled layer for the
Lufthansa `#MyCompetence` concepts of **Key Area** (e.g. "Agentic Software
Engineering" under Technology Consulting) and **Ausprägung** (a specialization
within a Key Area, e.g. "Spec Owner", "Frontend Developer"). Today this exists
only as a Technology-Consulting-specific special case (`aseRoles`,
`aseParentProfileId`) hardcoded to one role, rather than a generic layer any
role can use.

Source grounding: `260810 - ASE Roles Sounding AC.pdf` and
`TC2-Software Dev und Architecture_Überarbeitung 2026_for Review_v3.xlsx`
(repo root) document the real Lufthansa hierarchy for Technology Consulting:

```
Role "Technology Consulting" (R03-TC)
 └─ Key Area "Agentic Software Engineering" (ASE)
 │    └─ Ausprägungen (5, = today's aseRoles):
 │         Spezifizieren, Orchestrieren, Verifizieren, Integrieren, Betreiben
 ├─ Key Area "Software Engineering" (Cloud-Native Dev) — no Ausprägungen defined
 └─ Key Area "AI Automation" — no Ausprägungen defined
```

A course can be tagged to more than one Ausprägung (many-to-many), not owned
by exactly one. The 1–4 seniority axis (`aseLevelReference`) is orthogonal to
this tree and stays out of scope (already documented as UI-unwired reference
data).

The other 6 roles (BSC, PVS, AM, PMA, CF, Leadership) have no Key
Area/Ausprägung data in any source available — this pass does not invent
placeholder data for them.

## Goals

- Rename `profiles` → `roles` throughout the data model, cockpit, and admin
  editor (ids/codes unchanged: `bsc`, `pvs`, `tc`, `am`, `pma`, `corp`, `lead`
  / `R01-BSC`...`R07-LEAD`).
- Add a generic **Key Area** layer under Role, and a generic **Ausprägung**
  (`specialization`) layer under Key Area, usable by any role — not
  TC-specific.
- Fold the existing ASE-specific `aseRoles`/`aseParentProfileId` into this
  generic shape: ASE becomes one Key Area under `tc` using the new
  `specializations` array (same 5 entries, same fields, no content change).
- Extend course/track tagging so a course can be recommended by Role, Key
  Area, and/or Ausprägung, with a course allowed to tag multiple
  Ausprägungen.
- Wire the cockpit UI (`site/lrn/lrn.js`, `course.html`) and the admin
  curriculum editor (`site/admin.js`) to the new layers.

## Non-goals

- No new Key Area/Ausprägung data for the 6 non-TC roles (empty `keyAreas: []`
  for those roles; UI falls back to today's Role-level recommendation).
- No change to `aseLevelReference` or the 1–4 seniority axis.
- No change to stored role/ASE-role **ids** (`tc`, `spec`, `orch`, ...) — only
  field names and the containment hierarchy change, so no localStorage
  migration is needed (values stored under `state.profileId`/`STORE` are ids,
  unaffected).
- No change to Learning Path / Course / Unit / Activity numbering or content.

## Data model (`site/lrn/manifests/catalog.json`)

```jsonc
"roles": [ /* was "profiles", same 7 entries verbatim, key renamed only */ ],

"keyAreas": [
  { "id": "software-engineering", "roleId": "tc",
    "label": "Software Engineering", "labelDe": "Software Engineering" },
  { "id": "ai-automation", "roleId": "tc",
    "label": "AI Automation", "labelDe": "AI Automation" },
  { "id": "ase", "roleId": "tc",
    "label": "Agentic Software Engineering", "labelDe": "Agentic Software Engineering" }
  // no entries for bsc, pvs, am, pma, corp, lead in this pass
],

"specializations": [
  // = today's aseRoles, verbatim fields, + keyAreaId added
  { "id": "spec", "keyAreaId": "ase", "code": "ASE-SPEC", "label": "Spec Owner",
    "labelDe": "Spezifizieren", "capability": 11 },
  { "id": "orch", "keyAreaId": "ase", "code": "ASE-ORCH", "label": "Agent Orchestrator",
    "labelDe": "Orchestrieren", "capability": 6, "tracks": ["build", "ax"] },
  { "id": "verify", "keyAreaId": "ase", "code": "ASE-VER", "label": "Verification Lead",
    "labelDe": "Verifizieren", "capability": 7 },
  { "id": "integrate", "keyAreaId": "ase", "code": "ASE-INT", "label": "Integration Engineer",
    "labelDe": "Integrieren", "capability": 5 },
  { "id": "operate", "keyAreaId": "ase", "code": "ASE-OPS", "label": "Operations & Reliability Lead",
    "labelDe": "Betreiben", "capability": null }
]
```

`aseParentProfileId` is removed (redundant — `ase` key area now carries
`roleId: "tc"` directly). `aseLevelReference` is unchanged and unmoved.

### Course/track tagging

- `course.profileIds` → `course.roleIds` (rename only).
- `course.ase: [{role, depths}]` → `course.specializationDepths:
  [{specializationId, depths}]` (rename only, same shape).
- New optional `course.keyAreaIds: []` and `course.specializationIds: []` —
  lets a course tag itself to one or more Key Areas/Ausprägungen without
  needing per-depth data. A course may list multiple specialization ids.
- `track.profileIds` → `track.roleIds`.
- `path.recommendationRanks[profileId]` → same table, key renamed to role id.

## Cockpit UI (`site/lrn/lrn.js`, `site/lrn/course.html`)

- `data.profiles`/`profileById`/`resolveProfile()`/`els.profileSelect` renamed
  to `roles`/`roleById`/`resolveRole()`/`els.roleSelect`. `?profile=` URL
  param kept as an alias to `?role=` (already partially aliased today).
- After Role selection, populate a Key Area `<select>` from `keyAreas` filtered
  by `roleId`. Empty for the 6 roles without data — cockpit skips straight to
  course recommendation exactly as it works today for those roles.
- If the selected Key Area has entries in `specializations`, show a third
  select. Selecting an Ausprägung narrows `rankedCourses()`/
  `curatedCourseIds()` to prefer `specializationIds`/`specializationDepths`
  matches first, then Key Area tag matches, then falls back to Role `targets`
  scoring as today.
- Comment at `lrn.js:874` documenting the taxonomy updated to
  `Role -> Key Area -> Ausprägung -> Learning Path -> Course -> Unit -> Activity`.
- No localStorage migration: `state.profileId` continues to store a role id
  string; only the in-code field name may be renamed to `state.roleId`.

## Admin editor (`site/admin.js`, `site/i18n.js`)

- "Profile" comma-list field (line ~756) relabeled "Rolle".
- Rollen-/Level-Matrix (`renderPathMatrix`, `ase_matrix_heading` i18n string)
  generalizes from reading `catalog.aseRoles` to reading `specializations`
  filtered by the key area being edited, so it works for any key area that
  has specializations, not just ASE.
- `course.ase` field editing UI moves to the renamed `specializationDepths`
  schema.

## Docs (`CLAUDE.md` §3)

- Hierarchy line becomes:
  `Role -> Key Area -> Ausprägung -> Learning Path -> Course -> Unit -> Activity`
  `Rxx -> KAxx -> AUxx -> LPxx -> LRN-NN -> Uxx -> Axx`
- Note that Key Area/Ausprägung are optional per role and only populated for
  `R03-TC` today, sourced from the two documents above.
- Rename all "Profile" references in the section to "Role".

## Verification

- `node scripts/build_lrn_manifests.js` regenerates `site/lrn/data.js` and
  `site/lrn/curriculum-map.js` from the edited `catalog.json` — pure JSON
  passthrough (confirmed via prior investigation), no script changes needed
  beyond re-running it.
- Manual browser check (`run` skill / dev server): Role → Key Area →
  Ausprägung selects populate correctly for `tc` → `ase`; other 6 roles
  render unchanged (no Key Area select shown); admin curriculum editor still
  renders the Rollen-/Level-Matrix correctly for `ase` specializations.
