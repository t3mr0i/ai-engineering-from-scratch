# LRN Role/Key Area/Ausprägung Taxonomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the LRN cockpit's `profiles` taxonomy layer to `roles`, and add two new generic layers underneath it — `keyAreas` and `specializations` (Ausprägung) — folding the existing Technology-Consulting-only `aseRoles` special case into the generic shape, then wire both the cockpit UI and the admin curriculum editor to the new layers.

**Architecture:** `catalog.json` is the single source of truth; `scripts/build_lrn_manifests.js` is a pure JSON passthrough into `site/lrn/data.js`/`curriculum-map.js` (no script changes needed — just re-run it). `site/lrn/lrn.js` renders three cascading `<select>` elements (Role → Key Area → Ausprägung, the latter two collapse to nothing for roles without data) and extends its existing course-ranking functions to score on the new tags. `site/admin.js` generalizes its ASE-only matrix view to any key area with specializations.

**Tech Stack:** Vanilla JS (no framework, no build step beyond the manifest script), `node:test` for `site/lrn/test.mjs`.

**Spec:** `docs/superpowers/specs/2026-08-26-lrn-role-keyarea-ausprägung-taxonomy-design.md`

## Global Constraints

- Role/specialization **ids** never change (`bsc`, `pvs`, `tc`, `am`, `pma`, `corp`, `lead`; `spec`, `orch`, `verify`, `integrate`, `operate`). Only container/field *names* change.
- Persisted localStorage shapes are NOT touched: the cockpit's `STORE = "lhind:lrn-cockpit:v3"` object keeps the property name `profileId` (in `site/lrn/lrn.js`), and `site/progress.js`'s saved learning-path choice keeps its `profileId` field. Do not rename these — only the catalog-sourced data (`data.profiles` → `data.roles`, lookup helpers, DOM ids, i18n labels) is renamed. This avoids any migration of already-saved learner data.
- No new Key Area/Ausprägung content is invented for the 6 non-TC roles — their `keyAreas` stay absent/empty, and the cockpit must degrade to today's Role-only behavior for them (no Key Area/Ausprägung select shown).
- `aseLevelReference` in `catalog.json` is untouched — out of scope (orthogonal seniority axis, already documented as UI-unwired).
- Keep the existing `?profile=` URL param working as an alias for the canonical `?role=` param (already partially aliased today).

---

### Task 1: Update `site/lrn/test.mjs` to expect the renamed/extended data shape

**Files:**
- Modify: `site/lrn/test.mjs`

**Interfaces:**
- Consumes: `window.LrnData` loaded from `site/lrn/data.js` via `loadData()` (already defined in the file).
- Produces: nothing new — this task only changes assertions to match the Task 2 data shape, so it goes red first.

- [ ] **Step 1: Rename `data.profiles`/`course.profileIds` assertions to `data.roles`/`course.roleIds`**

Replace these existing tests (keep the rest of the file untouched):

```js
// was: test("every Course has the required fields", ...) — line 93
test("every Course has the required fields", () => {
  const required = ["id", "title", "roleIds", "dimensions", "levels", "modules"];
  for (const c of data.courses) {
    for (const f of required) {
      assert.ok(c[f] !== undefined, `Course ${c.id} missing field ${f}`);
    }
    assert.ok(Array.isArray(c.roleIds), `Course ${c.id}.roleIds must be array`);
    assert.ok(Array.isArray(c.dimensions), `Course ${c.id}.dimensions must be array`);
    assert.ok(Array.isArray(c.levels), `Course ${c.id}.levels must be array`);
    assert.ok(Array.isArray(c.modules) && c.modules.length > 0, `Course ${c.id}.modules must be non-empty array`);
  }
});
```

```js
// was: test("Harness Engineering course is scoped to the Technology Consulting profile", ...) — line 161
test("Harness Engineering course is scoped to the Technology Consulting role", () => {
  const course = data.courses.find((c) => c.id === "LRN-26");
  assert.ok(course, "HARNESS-TC-01 missing from data.js");
  assert.deepEqual([...course.roleIds], ["tc"]);
  assert.ok(course.interests.includes("consulting"), "course must support the Consulting interest");
  assert.ok(course.interests.includes("engineering"), "course may also support the Engineering interest");
  assert.deepEqual([...course.levels], ["Deepen", "Create"]);
  assert.equal(course.modules.length, 8, "course must expose eight course units as modules");
  assert.equal(course.outcomes.length, 4, "course should have four authored outcomes");
  const tc = data.roles.find((role) => role.id === "tc");
  assert.ok(tc && tc.code === "R03-TC", "Technology Consulting role must retain code R03-TC");
});
```

```js
// was: test("the learner model exposes all seven AI Literacy roles", ...) — line 174
test("the learner model exposes all seven AI Literacy roles", () => {
  assert.deepEqual(
    [...data.roles.map((role) => role.id)],
    ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
  );
  assert.equal(new Set(data.roles.map((role) => role.code)).size, 7);
});
```

Then run: `grep -n "data\.profiles\|\.profileIds\b" site/lrn/test.mjs` and fix every remaining hit the same way (rename `data.profiles` → `data.roles`, `.profileIds` → `.roleIds`, `profile` loop-variable names → `role` for readability). Do **not** touch any assertion that reads `state.profileId`/`saved.profileId` from the compiled `lrn.js` source (e.g. the existing regex tests around `/state\.profileId\s*=\s*["']([a-z]+)["']/` and `/saved && saved\.profileId === profileId/`) — those stay exactly as-is per the Global Constraints (persisted field name unchanged).

- [ ] **Step 2: Add invariant tests for the new `keyAreas`/`specializations` arrays**

Append to the end of the test file:

```js
test("every keyArea references an existing role", () => {
  const roleIds = new Set(data.roles.map((role) => role.id));
  for (const keyArea of data.keyAreas || []) {
    assert.ok(roleIds.has(keyArea.roleId), `keyArea ${keyArea.id} references unknown role ${keyArea.roleId}`);
  }
});

test("every specialization references an existing keyArea", () => {
  const keyAreaIds = new Set((data.keyAreas || []).map((keyArea) => keyArea.id));
  for (const specialization of data.specializations || []) {
    assert.ok(keyAreaIds.has(specialization.keyAreaId),
      `specialization ${specialization.id} references unknown keyArea ${specialization.keyAreaId}`);
  }
});

test("the ASE key area retains its five specializations", () => {
  const ase = (data.specializations || []).filter((s) => s.keyAreaId === "ase");
  assert.deepEqual(
    [...ase.map((s) => s.id)].sort(),
    ["integrate", "operate", "orch", "spec", "verify"],
  );
  const byId = new Map(ase.map((s) => [s.id, s]));
  assert.equal(byId.get("spec").code, "ASE-SPEC");
  assert.equal(byId.get("spec").labelDe, "Spezifizieren");
});

test("the ase key area belongs to the Technology Consulting role", () => {
  const aseKeyArea = (data.keyAreas || []).find((k) => k.id === "ase");
  assert.ok(aseKeyArea, "ase keyArea missing from data.js");
  assert.equal(aseKeyArea.roleId, "tc");
});
```

- [ ] **Step 3: Run the test file and confirm it fails**

Run: `node site/lrn/test.mjs`
Expected: FAIL — `data.roles`/`course.roleIds`/`data.keyAreas`/`data.specializations` are all `undefined` because `catalog.json`/`data.js` haven't been updated yet (Task 2).

- [ ] **Step 4: Commit**

```bash
git add site/lrn/test.mjs
git commit -m "Update LRN tests for the Role/Key Area/Ausprägung taxonomy"
```

---

### Task 2: Update `catalog.json` and regenerate the manifests

**Files:**
- Modify: `site/lrn/manifests/catalog.json`
- Modify (generated, do not hand-edit): `site/lrn/data.js`, `site/lrn/curriculum-map.js`

**Interfaces:**
- Produces: `data.roles`, `data.keyAreas`, `data.specializations`, `course.roleIds`, `course.specializationDepths`, `course.keyAreaIds` (optional), `course.specializationIds` (optional), `track.roleIds`, `path.recommendationRanks` (unchanged shape, keys are role ids) — all consumed by Task 3/4/5.

- [ ] **Step 1: Rename `profiles` → `roles`**

In `site/lrn/manifests/catalog.json`, rename the top-level key `"profiles"` (currently at line 155) to `"roles"`. Do not change any of the 7 entries' content (`id`, `code`, `label`, `segment`, `description`, `targets`).

- [ ] **Step 2: Add `keyAreas` and generalize `aseRoles` into `specializations`**

Immediately after the `roles` array, replace the existing `aseParentProfileId` + `aseRoles` block:

```jsonc
  "aseParentProfileId": "tc",
  "aseRoles": [
    { "id": "spec", "code": "ASE-SPEC", "label": "Spec Owner", "labelDe": "Spezifizieren", "capability": 11 },
    { "id": "orch", "code": "ASE-ORCH", "label": "Agent Orchestrator", "labelDe": "Orchestrieren", "capability": 6, "tracks": ["build", "ax"] },
    { "id": "verify", "code": "ASE-VER", "label": "Verification Lead", "labelDe": "Verifizieren", "capability": 7 },
    { "id": "integrate", "code": "ASE-INT", "label": "Integration Engineer", "labelDe": "Integrieren", "capability": 5 },
    { "id": "operate", "code": "ASE-OPS", "label": "Operations & Reliability Lead", "labelDe": "Betreiben", "capability": null }
  ],
```

with:

```jsonc
  "keyAreas": [
    { "id": "software-engineering", "roleId": "tc",
      "label": "Software Engineering", "labelDe": "Software Engineering" },
    { "id": "ai-automation", "roleId": "tc",
      "label": "AI Automation", "labelDe": "AI Automation" },
    { "id": "ase", "roleId": "tc",
      "label": "Agentic Software Engineering", "labelDe": "Agentic Software Engineering" }
  ],
  "specializations": [
    { "id": "spec", "keyAreaId": "ase", "code": "ASE-SPEC", "label": "Spec Owner", "labelDe": "Spezifizieren", "capability": 11 },
    { "id": "orch", "keyAreaId": "ase", "code": "ASE-ORCH", "label": "Agent Orchestrator", "labelDe": "Orchestrieren", "capability": 6, "tracks": ["build", "ax"] },
    { "id": "verify", "keyAreaId": "ase", "code": "ASE-VER", "label": "Verification Lead", "labelDe": "Verifizieren", "capability": 7 },
    { "id": "integrate", "keyAreaId": "ase", "code": "ASE-INT", "label": "Integration Engineer", "labelDe": "Integrieren", "capability": 5 },
    { "id": "operate", "keyAreaId": "ase", "code": "ASE-OPS", "label": "Operations & Reliability Lead", "labelDe": "Betreiben", "capability": null }
  ],
```

- [ ] **Step 3: Rename course/track tagging fields**

Run `grep -c '"profileIds"' site/lrn/manifests/catalog.json` to see how many `course.profileIds`/`track.profileIds` arrays exist, then rename every `"profileIds"` key to `"roleIds"` (values unchanged — same role id strings, e.g. `["tc"]`). Use a scoped find-and-replace (e.g. `sed -i '' 's/"profileIds"/"roleIds"/g' site/lrn/manifests/catalog.json`) since the key string `"profileIds"` does not collide with any other field name in this file — confirm with `grep -n '"profileIds"' site/lrn/manifests/catalog.json` before and `grep -n '"roleIds"' site/lrn/manifests/catalog.json` after to check the count matches.

- [ ] **Step 4: Rename `course.ase` depth-mapping field**

Find every course object's `"ase": [{"role": "...", "depths": [...]}, ...]` array (search `grep -n '"ase":' site/lrn/manifests/catalog.json`). Rename the key `"ase"` to `"specializationDepths"` and rename each entry's `"role"` field to `"specializationId"` (values unchanged — e.g. `"spec"`, `"orch"`, etc.). Example transform:

```jsonc
// before
"ase": [{ "role": "spec", "depths": ["Acquire", "Deepen"] }]
// after
"specializationDepths": [{ "specializationId": "spec", "depths": ["Acquire", "Deepen"] }]
```

Courses with no ASE depth data keep whatever they had (empty array or absent field) — just rename the key if present.

- [ ] **Step 5: Regenerate the manifests**

Run: `node scripts/build_lrn_manifests.js`
Expected: exits 0 and rewrites `site/lrn/data.js` and `site/lrn/curriculum-map.js` (pure JSON passthrough — confirm with `git diff --stat site/lrn/data.js site/lrn/curriculum-map.js` that both changed).

- [ ] **Step 6: Run the Task 1 tests and confirm they now pass**

Run: `node site/lrn/test.mjs`
Expected: PASS (all tests, including the new `keyAreas`/`specializations` invariants from Task 1).

- [ ] **Step 7: Commit**

```bash
git add site/lrn/manifests/catalog.json site/lrn/data.js site/lrn/curriculum-map.js
git commit -m "Rename profiles to roles and add Key Area/Ausprägung layers to catalog.json"
```

---

### Task 3: Update `site/lrn/lrn.js` — rename + wire Key Area/Ausprägung selects

**Files:**
- Modify: `site/lrn/lrn.js`

**Interfaces:**
- Consumes: `data.roles`, `data.keyAreas`, `data.specializations`, `course.roleIds`, `course.keyAreaIds`, `course.specializationIds`, `course.specializationDepths`, `track.roleIds` (from Task 2).
- Consumes DOM ids: `roleSelect` (renamed from `profileSelect`), new `keyAreaSelect`, new `specializationSelect` (added to `site/index.html` in Task 4 — this task's `els` lookups will be `null` until Task 4 lands; guard every access with `if (els.keyAreaSelect) ...` so the file still runs standalone).
- Produces: `state.keyAreaId`, `state.specializationId` (new, in-memory + persisted under those exact property names — these are new keys so no migration concern), `roleById`, `resolveRole()`.

- [ ] **Step 1: Rename the core Role lookups**

In `site/lrn/lrn.js`:
- Line 15: `var profileById = indexBy(data.profiles, "id");` → `var roleById = indexBy(data.roles, "id");`
- Line 67: `profileSelect: document.getElementById("profileSelect"),` → `roleSelect: document.getElementById("roleSelect"),` and add two lines right after it:
  ```js
  keyAreaSelect: document.getElementById("keyAreaSelect"),
  specializationSelect: document.getElementById("specializationSelect"),
  ```
- Every remaining reference to `profileById` → `roleById`, `els.profileSelect` → `els.roleSelect`, `resolveProfile` → `resolveRole` (function defined at line 1128), `renderProfileSelect` → `renderRoleSelect` (defined at line 250). Confirm with `grep -n "profileById\|profileSelect\|resolveProfile\|renderProfileSelect" site/lrn/lrn.js` before and after — expect zero hits after.
- Line 118: `var rawProfile = params.get("profile") || params.get("role");` stays as-is (already reads both param names) — just rename the local var to `rawRole` for consistency and update its two remaining uses (`resolveProfile(rawProfile)` → `resolveRole(rawRole)`).
- Do **NOT** rename `state.profileId` or the `saved.profileId` reads/writes anywhere in this file (Global Constraint — persisted shape stays).
- Local variables/params named `profile`/`profileId` that refer to a *role* object/id (e.g. in `compute()`, `rankedCourses()`, `curatedCourseIds()`, `academyRecommendationRank()`, `saveAcademyPath()`, `computeAcademyContext()`) should be renamed to `role`/`roleId` for consistency, e.g.:
  ```js
  // compute() — line 920
  function compute() {
    var role = roleById[state.profileId];
    var level = levelDefinitions.find(function (item) {
      return item.value === Number(state.externalLevel);
    }) || levelDefinitions[0];
    var entries = rankedCourses(role, level);
    return { profile: role, level: level, entries: entries };
  }
  ```
  Keep the returned object's key as `profile` (line 926, `return { profile: profile, ... }`) since downstream code (`computed.profile`) is untouched by this task — only rename inside the function body, not the object key, to minimize blast radius. Apply the same "rename the local variable, keep any existing object key called `profile`" rule throughout this task.
- `course.profileIds` (line 937) → `course.roleIds`; `track.profileIds` (line 988) → `track.roleIds`.
- Comment at line 874 (`// LHIND LRN taxonomy: Profile → Level → Course → Unit → Activity).`) → `// LHIND LRN taxonomy: Role → Key Area → Ausprägung → Level → Course → Unit → Activity).`

- [ ] **Step 2: Extend `rankedCourses`/`curatedCourseIds` to score Key Area/Ausprägung matches**

Replace the body of `rankedCourses` (around line 929) to add a boost when the active Key Area/Ausprägung selection matches the course's tags:

```js
function rankedCourses(role, level) {
  var stageCoursesForLevel = curatedCourseIds(role, level.focusLevels);

  var entries = data.courses.filter(function (course) {
    return course.roleIds.indexOf(role.id) !== -1;
  }).map(function (course) {
    var onPath = stageCoursesForLevel.indexOf(course.id) !== -1;
    var roleTargetMatch = course.dimensions.some(function (dimensionId) {
      return Number(role.targets[dimensionId] || 0) > 0;
    });
    var keyAreaMatch = state.keyAreaId &&
      Array.isArray(course.keyAreaIds) && course.keyAreaIds.indexOf(state.keyAreaId) !== -1;
    var specializationMatch = state.specializationId && (
      (Array.isArray(course.specializationIds) && course.specializationIds.indexOf(state.specializationId) !== -1) ||
      (Array.isArray(course.specializationDepths) && course.specializationDepths.some(function (entry) {
        return entry.specializationId === state.specializationId;
      }))
    );
    var progress = courseProgress(course);
    var score = 10;
    if (onPath) score += 60;
    if (roleTargetMatch) score += 8;
    if (specializationMatch) score += 20;
    else if (keyAreaMatch) score += 10;
    if (progress.percent > 0 && progress.percent < 100) score += 12;
    if (progress.percent === 100 && progress.lessonCount > 0) score -= 20;
    return {
      course: course,
      score: score,
      kind: onPath ? "recommended" : "optional",
      onPath: onPath,
      progress: progress
    };
  }).sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return a.course.id.localeCompare(b.course.id);
  });

  var hasStrict = entries.some(function (entry) { return entry.kind === "recommended"; });
  if (!hasStrict) {
    entries.forEach(function (entry) { entry.kind = "recommended"; });
  }

  var shown = 0;
  entries.forEach(function (entry) {
    if (entry.kind !== "recommended") return;
    if (shown < RECOMMEND_CAP) shown += 1;
    else entry.kind = "optional";
  });

  return entries;
}

function curatedCourseIds(role, focusLevels) {
  var ids = [];
  (data.tracks || []).forEach(function (track) {
    if (track.roleIds.indexOf(role.id) === -1) return;
    (track.stages || []).forEach(function (stage) {
      if (focusLevels.indexOf(stage.label) === -1) return;
      stage.courses.forEach(function (id) {
        if (ids.indexOf(id) === -1) ids.push(id);
      });
    });
  });
  return ids;
}
```

- [ ] **Step 3: Add Key Area/Ausprägung state, select rendering, and cascading reset**

In `loadState()` (line 89), add the two new fields to `fallback` and the returned object:

```js
function loadState() {
  var fallback = {
    profileId: "tc",
    keyAreaId: null,
    specializationId: null,
    externalLevel: 1,
    filter: "recommended",
    activeCourseId: null,
    academyAll: false
  };

  try {
    var saved = JSON.parse(localStorage.getItem(STORE));
    if (!saved || !roleById[saved.profileId]) return fallback;
    return {
      profileId: saved.profileId,
      keyAreaId: saved.keyAreaId || null,
      specializationId: saved.specializationId || null,
      externalLevel: validDepthValue(saved.externalLevel) ? Number(saved.externalLevel) : fallback.externalLevel,
      filter: ["recommended", "optional", "inprogress", "completed", "all"].indexOf(saved.filter) !== -1 ? saved.filter : "recommended",
      activeCourseId: saved.activeCourseId || null,
      academyAll: Boolean(saved.academyAll)
    };
  } catch (error) {
    return fallback;
  }
}
```

Add two helper functions near `renderRoleSelect` (the renamed function from Step 1):

```js
function keyAreasForRole(roleId) {
  return (data.keyAreas || []).filter(function (keyArea) { return keyArea.roleId === roleId; });
}

function specializationsForKeyArea(keyAreaId) {
  return (data.specializations || []).filter(function (spec) { return spec.keyAreaId === keyAreaId; });
}

function renderKeyAreaSelect() {
  if (!els.keyAreaSelect) return;
  var options = keyAreasForRole(state.profileId);
  var wrapper = els.keyAreaSelect.closest(".selector-field");
  if (!options.length) {
    if (wrapper) wrapper.hidden = true;
    els.keyAreaSelect.innerHTML = "";
    return;
  }
  if (wrapper) wrapper.hidden = false;
  replaceChildren(els.keyAreaSelect, options.map(function (keyArea) {
    var option = document.createElement("option");
    option.value = keyArea.id;
    option.textContent = keyArea.label;
    return option;
  }));
  if (!options.some(function (k) { return k.id === state.keyAreaId; })) {
    state.keyAreaId = options[0].id;
  }
  els.keyAreaSelect.value = state.keyAreaId;
}

function renderSpecializationSelect() {
  if (!els.specializationSelect) return;
  var options = state.keyAreaId ? specializationsForKeyArea(state.keyAreaId) : [];
  var wrapper = els.specializationSelect.closest(".selector-field");
  if (!options.length) {
    if (wrapper) wrapper.hidden = true;
    els.specializationSelect.innerHTML = "";
    state.specializationId = null;
    return;
  }
  if (wrapper) wrapper.hidden = false;
  replaceChildren(els.specializationSelect, options.map(function (spec) {
    var option = document.createElement("option");
    option.value = spec.id;
    option.textContent = spec.labelDe || spec.label;
    return option;
  }));
  if (!options.some(function (s) { return s.id === state.specializationId; })) {
    state.specializationId = options[0].id;
  }
  els.specializationSelect.value = state.specializationId;
}
```

Wire them into `renderControls()` (line 234):

```js
function renderControls() {
  renderRoleSelect();
  renderKeyAreaSelect();
  renderSpecializationSelect();
  renderLevelSelect();
}
```

Add change listeners next to the existing `els.roleSelect.addEventListener("change", ...)` (renamed from `els.profileSelect...`, Step 1):

```js
if (els.keyAreaSelect) {
  els.keyAreaSelect.addEventListener("change", function () {
    if (state.keyAreaId === els.keyAreaSelect.value) return;
    state.keyAreaId = els.keyAreaSelect.value;
    state.specializationId = null;
    saveState();
    renderSpecializationSelect();
    render();
  });
}

if (els.specializationSelect) {
  els.specializationSelect.addEventListener("change", function () {
    if (state.specializationId === els.specializationSelect.value) return;
    state.specializationId = els.specializationSelect.value;
    saveState();
    render();
  });
}
```

And reset them whenever the Role changes — in the existing `els.roleSelect.addEventListener("change", ...)` handler (renamed from Step 1), after `state.profileId = role.id;` add:

```js
state.keyAreaId = null;
state.specializationId = null;
```

and in `wireActions()`'s reset-button handler (line 157), after `state.profileId = "tc";` add:

```js
state.keyAreaId = null;
state.specializationId = null;
```

- [ ] **Step 4: Manually smoke-test the rename didn't break syntax**

Run: `node --check site/lrn/lrn.js`
Expected: no output (valid syntax).

- [ ] **Step 5: Re-run the full LRN test suite**

Run: `node site/lrn/test.mjs`
Expected: PASS. If the `search.test.mjs`/`skills-progress.test.mjs` regex tests (in Task 5) haven't run yet, that's fine — this step only covers `site/lrn/test.mjs`.

- [ ] **Step 6: Commit**

```bash
git add site/lrn/lrn.js
git commit -m "Wire LRN cockpit to Role/Key Area/Ausprägung selects"
```

---

### Task 4: Update `site/index.html` and `site/i18n.js` markup/labels

**Files:**
- Modify: `site/index.html`
- Modify: `site/i18n.js`

**Interfaces:**
- Produces DOM ids `roleSelect`, `keyAreaSelect`, `specializationSelect` consumed by Task 3's `els` lookups.

- [ ] **Step 1: Rename the Role select and add the two new selects**

In `site/index.html`, replace:

```html
<label class="selector-field">
  <span class="selector-field__label"><i class="ph-light ph-user-circle" aria-hidden="true"></i> <span data-i18n="profile_label">Profile</span></span>
  <select id="profileSelect" aria-label="Choose profile" data-i18n-aria-label="profile_select_label"></select>
</label>
```

with:

```html
<label class="selector-field">
  <span class="selector-field__label"><i class="ph-light ph-user-circle" aria-hidden="true"></i> <span data-i18n="role_label">Role</span></span>
  <select id="roleSelect" aria-label="Choose role" data-i18n-aria-label="role_select_label"></select>
</label>
<label class="selector-field" hidden>
  <span class="selector-field__label"><i class="ph-light ph-squares-four" aria-hidden="true"></i> <span data-i18n="key_area_label">Key Area</span></span>
  <select id="keyAreaSelect" aria-label="Choose key area" data-i18n-aria-label="key_area_select_label"></select>
</label>
<label class="selector-field" hidden>
  <span class="selector-field__label"><i class="ph-light ph-identification-badge" aria-hidden="true"></i> <span data-i18n="specialization_label">Ausprägung</span></span>
  <select id="specializationSelect" aria-label="Choose specialization" data-i18n-aria-label="specialization_select_label"></select>
</label>
```

(The `hidden` attribute matches `renderKeyAreaSelect`/`renderSpecializationSelect` from Task 3, which toggle `wrapper.hidden` based on whether the active role/key area has any entries.)

- [ ] **Step 2: Update i18n strings**

In `site/i18n.js`, replace (line 229; `profile_select_label` sits a few lines below at line 232):

```js
profile_label: { en: "Profile", de: "Profil" },
```
```js
profile_select_label: { en: "Choose profile", de: "Profil auswählen" },
```

with:

```js
role_label: { en: "Role", de: "Rolle" },
role_select_label: { en: "Choose role", de: "Rolle auswählen" },
key_area_label: { en: "Key Area", de: "Key Area" },
key_area_select_label: { en: "Choose key area", de: "Key Area auswählen" },
specialization_label: { en: "Ausprägung", de: "Ausprägung" },
specialization_select_label: { en: "Choose specialization", de: "Ausprägung auswählen" },
```

(Note: `skills_page_profile_label` at line 62 is an unrelated string for a different page — do not touch it.)

Also update:

```js
lrn_announce_profile_set: { en: "Profile set: {profile}.", de: "Profil festgelegt: {profile}." },
```

to:

```js
lrn_announce_profile_set: { en: "Role set: {profile}.", de: "Rolle festgelegt: {profile}." },
```

(Leave the i18n *key* name `lrn_announce_profile_set` and the `{profile}` placeholder unchanged — `site/lrn/lrn.js`'s `i18n("lrn_announce_profile_set").replace("{profile}", ...)` call is untouched by this plan, only the display text changes.)

- [ ] **Step 3: Visually verify in a browser**

Serve the site locally (e.g. `python3 -m http.server 8080` from the repo root, or however this project's `run` skill launches it) and open `/index.html#cockpit`. Confirm: Role select shows "Rolle"/"Role" label; selecting "Technology Consulting" reveals a Key Area select with 3 options; selecting "Agentic Software Engineering" reveals an Ausprägung select with 5 options; selecting any other role hides both new selects.

- [ ] **Step 4: Commit**

```bash
git add site/index.html site/i18n.js
git commit -m "Add Key Area/Ausprägung selects to the LRN cockpit UI"
```

---

### Task 5: Update `site/skills-progress.js`, `site/catalog.html` comment, and `site/lrn/test.mjs` cross-file regex tests

**Files:**
- Modify: `site/skills-progress.js`
- Modify: `site/catalog.html`
- Modify: `site/lrn/test.mjs` (only if Step 3 finds regex tests referencing renamed lrn.js internals)

**Interfaces:**
- Consumes: `window.LrnData.roles` (renamed from `.profiles`, produced by Task 2).

- [ ] **Step 1: Rename `data.profiles` reads in `site/skills-progress.js`**

This file reads the same catalog data for its own capability-profile dropdown (`capabilityProfileSelect`, a separate DOM element from the cockpit's role select — do not rename this DOM id or its `profileId`/`storedProfileId`/`saveProfileId` names, since it shares the cockpit's `lhind:lrn-cockpit:v3` localStorage key, which per the Global Constraints keeps the `profileId` property name). Only change the four `data.profiles` reads to `data.roles`:

```js
// currentProfileId() — around line 229
function currentProfileId() {
  if (profileSelect && profileSelect.value) return profileSelect.value;
  return (data.roles || []).some(function (role) { return role.id === "tc"; }) ? "tc" : (data.roles[0] && data.roles[0].id || "tc");
}

// storedProfileId() — around line 236
function storedProfileId() {
  try {
    var saved = JSON.parse(window.localStorage.getItem(cockpitStore));
    if (saved && (data.roles || []).some(function (role) { return role.id === saved.profileId; })) {
      return saved.profileId;
    }
  } catch (error) {}
  return (data.roles || []).some(function (role) { return role.id === "tc"; }) ? "tc" : (data.roles[0] && data.roles[0].id || "tc");
}
```

```js
// populateProfileSelect() — around line 252
function populateProfileSelect() {
  if (!profileSelect) return;
  (data.roles || []).forEach(function (role) {
    var option = element("option", "", role.label);
    option.value = role.id;
    profileSelect.appendChild(option);
  });
  profileSelect.value = storedProfileId();
}
```

Run `grep -n "data\.profiles" site/skills-progress.js` afterward to confirm zero remaining hits.

- [ ] **Step 2: Fix the stale comment in `site/catalog.html`**

Replace:

```html
<!-- Technology Consulting scope: catalog only surfaces lessons that back
     at least one of the LRN cockpit's TC courses (curriculum-map.js).
     Every course in courseMaps carries "tc" in profileIds by construction
     (site/lrn/data.js), so no further profile filtering is needed here. -->
```

with:

```html
<!-- Technology Consulting scope: catalog only surfaces lessons that back
     at least one of the LRN cockpit's TC courses (curriculum-map.js).
     Every course in courseMaps carries "tc" in roleIds by construction
     (site/lrn/data.js), so no further role filtering is needed here. -->
```

(This is a comment only — verify with `grep -n "profileIds\|profile filtering" site/catalog.html` that no executable code in this file references `.profiles`/`.profileIds`, matching the earlier investigation.)

- [ ] **Step 3: Check whether `site/skills-progress.test.mjs` or `site/search.test.mjs` assert on `data.profiles`**

Run: `grep -n "data\.profiles\|\.profiles\b" site/skills-progress.test.mjs site/search.test.mjs`

If either file asserts on the catalog's `profiles` array shape (as opposed to just the opaque `profileId` string field, which stays unchanged), update those specific assertions from `data.profiles` to `data.roles` following the same pattern as Task 1. If the grep finds nothing beyond the unrelated `profileId` string field, no change is needed — do not edit these files.

- [ ] **Step 4: Run the affected test files**

Run: `node site/skills-progress.test.mjs && node site/search.test.mjs && node site/progress.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site/skills-progress.js site/catalog.html
git commit -m "Point skills-progress.js and catalog.html comment at renamed roles field"
```

---

### Task 6: Update `site/admin.js` curriculum editor

**Files:**
- Modify: `site/admin.js`

**Interfaces:**
- Consumes: `catalog.roles` (renamed from `catalog.profiles`, if referenced), `catalog.keyAreas`, `catalog.specializations` (renamed from `catalog.aseRoles`), `course.roleIds`, `course.specializationDepths`.

- [ ] **Step 1: Rename the course/track "Profile" field**

Line 503:

```js
field("Profile", inputFor((course.profileIds || []).join(", "), (value) => update("profileIds", splitList(value)), { disabled: !editable }), false, "Kommagetrennte Profil-IDs"),
```

→

```js
field("Rolle", inputFor((course.roleIds || []).join(", "), (value) => update("roleIds", splitList(value)), { disabled: !editable }), false, "Kommagetrennte Rollen-IDs"),
```

Line 756 (same pattern for tracks):

```js
field("Profile", inputFor((track.profileIds || []).join(", "), (value) => update("profileIds", splitList(value)), { disabled: !editable }), true, "Kommagetrennte Profil-IDs"),
```

→

```js
field("Rolle", inputFor((track.roleIds || []).join(", "), (value) => update("roleIds", splitList(value)), { disabled: !editable }), true, "Kommagetrennte Rollen-IDs"),
```

- [ ] **Step 2: Fix the CSV-import and new-course/new-track scaffolds**

Line 582 (new course from CSV import) — rename `profileIds: []` to `roleIds: []` and `ase: {}` to `specializationDepths: []` (the field is an array elsewhere, not `{}` — align the scaffold with the real shape):

```js
course = { id: row.id, sequence: snapshot.catalog.courses.length + 1, title: row.title || "Imported course", status: "draft", source: "CSV import", roleIds: [], dimensions: {}, interests: [], levels: [], specializationDepths: [], format: "self-paced", summary: "", outcomes: [], modules: [] };
```

Line 589:

```js
if (row.profileIds) course.profileIds = row.profileIds.split("|").map((item) => item.trim()).filter(Boolean);
```

→

```js
if (row.roleIds) course.roleIds = row.roleIds.split("|").map((item) => item.trim()).filter(Boolean);
```

Line 698-712 (the "new course" scaffold pushed when an admin adds a course):

```js
courses.push({
  id,
  sequence: Math.max(0, ...courses.map((course) => Number(course.sequence) || 0)) + 1,
  title: "Neuer Kurs",
  status: "draft",
  source: "Curriculum Admin",
  roleIds: [],
  dimensions: {},
  interests: [],
  levels: [],
  specializationDepths: [],
  format: "self-paced",
```

(keep every other field in that object literal exactly as it already is — only rename `profileIds` → `roleIds` and `ase` → `specializationDepths` on those two lines).

Line 1572 (new-track scaffold):

```js
const track = { id: `path-${String(next).padStart(2, "0")}`, code, label: "Neuer Lernpfad", roleIds: [], stages: [{ label: "Acquire", courses: [] }, { label: "Deepen", courses: [] }, { label: "Create", courses: [] }] };
```

- [ ] **Step 3: Generalize the Rollen-/Level-Matrix**

Replace `renderPathMatrix` (line 772):

```js
function renderPathMatrix(track) {
  const roles = state.snapshot.catalog.aseRoles || [];
  const coursesById = new Map((state.snapshot.catalog.courses || []).map((course) => [course.id, course]));
  const selectedIds = new Set((track.stages || []).flatMap((stage) => stage.courses || []));
  const depths = ["Acquire", "Deepen", "Create"];
  const tbody = h("tbody");
  for (const role of roles) {
    const counts = Object.fromEntries(depths.map((depth) => [depth, 0]));
    for (const courseId of selectedIds) {
      const course = coursesById.get(courseId);
      const assignment = course && (course.ase || []).find((item) => item.role === role.id);
      for (const depth of (assignment && assignment.depths) || []) if (depth in counts) counts[depth] += 1;
    }
    tbody.append(h("tr", {}, [h("th", { scope: "row" }, [h("strong", { text: role.labelDe || role.label }), h("small", { text: role.code })]), ...depths.map((depth) => h("td", { class: "coverage-cell", "data-covered": String(counts[depth] > 0), text: counts[depth] || "—" }))]));
  }
  return h("section", { class: "editor-section" }, [
    h("div", { class: "admin-panel__header" }, [h("h2", { text: "Rollen- und Level-Abdeckung" }), h("span", { text: `${selectedIds.size} eindeutige Kurse` })]),
    h("div", { class: "admin-table-wrap" }, h("table", { class: "admin-table coverage-matrix" }, [
      h("thead", {}, h("tr", {}, [h("th", { scope: "col", text: "ASE-Rolle" }), ...depths.map((depth) => h("th", { scope: "col", text: depth }))])),
      tbody,
    ])),
    h("p", { class: "admin-form-hint", text: "Zahlen zeigen, wie viele Kurse im Lernpfad die jeweilige Rolle auf diesem Vertiefungsniveau abdecken." }),
  ]);
}
```

with a version that reads the generic `specializations` array, scoped to the `ase` key area (the only key area with specializations today — this keeps today's matrix output identical, just sourced from the renamed generic arrays instead of the removed `aseRoles`):

```js
function renderPathMatrix(track) {
  const specializations = (state.snapshot.catalog.specializations || []).filter((s) => s.keyAreaId === "ase");
  const coursesById = new Map((state.snapshot.catalog.courses || []).map((course) => [course.id, course]));
  const selectedIds = new Set((track.stages || []).flatMap((stage) => stage.courses || []));
  const depths = ["Acquire", "Deepen", "Create"];
  const tbody = h("tbody");
  for (const specialization of specializations) {
    const counts = Object.fromEntries(depths.map((depth) => [depth, 0]));
    for (const courseId of selectedIds) {
      const course = coursesById.get(courseId);
      const assignment = course && (course.specializationDepths || []).find((item) => item.specializationId === specialization.id);
      for (const depth of (assignment && assignment.depths) || []) if (depth in counts) counts[depth] += 1;
    }
    tbody.append(h("tr", {}, [h("th", { scope: "row" }, [h("strong", { text: specialization.labelDe || specialization.label }), h("small", { text: specialization.code })]), ...depths.map((depth) => h("td", { class: "coverage-cell", "data-covered": String(counts[depth] > 0), text: counts[depth] || "—" }))]));
  }
  return h("section", { class: "editor-section" }, [
    h("div", { class: "admin-panel__header" }, [h("h2", { text: "Rollen- und Level-Abdeckung" }), h("span", { text: `${selectedIds.size} eindeutige Kurse` })]),
    h("div", { class: "admin-table-wrap" }, h("table", { class: "admin-table coverage-matrix" }, [
      h("thead", {}, h("tr", {}, [h("th", { scope: "col", text: "ASE-Rolle" }), ...depths.map((depth) => h("th", { scope: "col", text: depth }))])),
      tbody,
    ])),
    h("p", { class: "admin-form-hint", text: "Zahlen zeigen, wie viele Kurse im Lernpfad die jeweilige Rolle auf diesem Vertiefungsniveau abdecken." }),
  ]);
}
```

- [ ] **Step 4: Confirm no other `aseRoles`/`.profiles`/`course.ase` references remain**

Run: `grep -n "aseRoles\|catalog\.profiles\|course\.ase\b\|\.ase\[" site/admin.js`
Expected: no output.

- [ ] **Step 5: Syntax-check and commit**

Run: `node --check site/admin.js`
Expected: no output.

```bash
git add site/admin.js
git commit -m "Generalize admin curriculum editor to Role/Key Area/Ausprägung fields"
```

---

### Task 7: Update `CLAUDE.md` §3 documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the taxonomy hierarchy and stable-codes section**

In §3 ("LRN course taxonomy and numbering"), replace:

```text
Profile -> External level -> Learning path -> Course  -> Unit -> Activity
Rxx     -> LVx            -> LPxx          -> LRN-NN  -> Uxx  -> Axx
```

with:

```text
Role -> Key Area -> Ausprägung -> Learning path -> Course  -> Unit -> Activity
Rxx  -> KAxx      -> AUxx       -> LPxx          -> LRN-NN  -> Uxx  -> Axx
```

Add a paragraph after the existing "Stable codes" bullet list (which currently starts with "Profiles: `R01-BSC`, ...") — rename that bullet's lead-in from "Profiles:" to "Roles:", and add a new bullet directly after it:

```markdown
- Key Areas and Ausprägungen: optional layers under a Role, sourced from
  Lufthansa's `#MyCompetence` model (`260810 - ASE Roles Sounding AC.pdf`,
  `TC2-Software Dev und Architecture_Überarbeitung 2026_for Review_v3.xlsx`).
  Only `R03-TC` (Technology Consulting) has data today: Key Areas
  `software-engineering`, `ai-automation`, `ase` (Agentic Software
  Engineering); `ase` has 5 Ausprägungen (Spezifizieren, Orchestrieren,
  Verifizieren, Integrieren, Betreiben — same ids/codes as the former
  `aseRoles`). The other 6 roles have no Key Area data — the cockpit falls
  back to Role-level course recommendation for them. A course may tag
  multiple Ausprägungen (many-to-many, not strict containment).
```

Replace every remaining "Profile"/"profile" reference in §3's prose (e.g. "Use 'Learning Path', 'Course', 'Unit', and 'Activity' in LRN UI" bullet, any "profile" mentions in the numbering rules) with "Role"/"role". Run `grep -n -i "profile" CLAUDE.md` after editing to confirm only unrelated mentions remain (if any exist outside §3, leave them — out of scope).

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "Document the Role/Key Area/Ausprägung taxonomy in CLAUDE.md"
```

---

### Task 8: Final full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run every touched test file**

```bash
node site/lrn/test.mjs
node site/skills-progress.test.mjs
node site/search.test.mjs
node site/progress.test.mjs
```

Expected: all PASS.

- [ ] **Step 2: Syntax-check every modified JS file**

```bash
node --check site/lrn/lrn.js
node --check site/admin.js
node --check site/skills-progress.js
```

Expected: no output from any.

- [ ] **Step 3: Browser smoke test**

Serve `site/` locally and check: `/index.html#cockpit` role/key-area/ausprägung cascade (as in Task 4 Step 3); `/admin.html` curriculum editor opens a Technology Consulting learning path and the "Rollen- und Level-Abdeckung" matrix still renders 5 rows; switching to any non-TC learning path shows no Key Area/Ausprägung selects on the cockpit.

- [ ] **Step 4: Report status**

Summarize pass/fail for each check above. Do not commit anything in this task — it's verification only.
