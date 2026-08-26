# Anonymous Progress Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the LRN cockpit anonymously report each learner's profile, level, and completed courses to the server, and give admins an aggregated stats view of company-wide progress.

**Architecture:** Client generates a random per-browser id (`crypto.randomUUID()`, `localStorage`-only) and POSTs its current profile/level/completed-courses snapshot to a new `/api/lrn/report` endpoint whenever it changes. The server overwrites one JSON file per anonymous id under `.admin-data/lrn-reports/` (reusing the existing `admin-data` PVC — no new OpenShift volume needed). A new `/api/admin/lrn-stats` endpoint aggregates those files into counts by profile, by level, and by course-completion; a new "Statistik" view in the existing admin SPA (`site/admin.js`/`admin.html`) renders them as tables.

**Tech Stack:** Plain Node.js (`http`, `node:fs`, `node:crypto`), zero npm deps, `node --test` for server tests, `node:vm`-sandboxed `node --test` for client-side tests — matches the existing codebase exactly.

**Spec:** `docs/superpowers/specs/2026-08-26-anonymous-progress-reporting-design.md`

## Global Constraints

- No new npm dependencies (`server/package.json` has none besides the built-in test runner; `package.json` at repo root only lists `pyodide`).
- No Klarnamen/IP/Zeitreihen — only `anonId` (random UUID), `profileId`, `externalLevel`, `completedCourses` are ever stored server-side (see spec §3).
- Report data persists at `.admin-data/lrn-reports/` — a subdirectory of the existing `ADMIN_DATA_DIR` volume, **not** a new `.lrn-data` directory as drafted in the spec's prose (the spec's *intent* — file-backed, `admin-store.js`-style — is unchanged; this plan reuses the already-provisioned PVC instead of requesting a new one, since `ADMIN_DATA_DIR` already resolves to a persistent mount in `openshift/deployment.yaml`).
- `/api/admin/lrn-stats` is protected exactly like every other `/api/admin/*` route (`server/admin-auth.js`'s `resolveAdmin`) — no separate auth mechanism.
- `/api/lrn/report` sits behind the same passcode gate as the rest of the site (`server/gate-core.js`) — no special-cased bypass like the LLM proxy.
- Server-side validation rejects anything that isn't a known `profileId`/`externalLevel`/`courseId` from `site/lrn/manifests/catalog.json` (loaded via the existing `loadBaseCurriculum()` in `server/admin-curriculum.js`).

---

### Task 1: Server-side report store

**Files:**
- Create: `server/lrn-report-store.js`
- Test: `server/tests/lrn-report.test.js`

**Interfaces:**
- Produces: `class LrnReportStore { constructor({ dataDir, webRoot }); save(payload): record; aggregate(): stats }`, `class ReportError extends Error { code, message, status }`. `record` shape: `{ anonId, profileId, externalLevel, completedCourses: string[], updatedAt }`. `stats` shape: `{ totalLearners: number, byProfile: {[profileId]: number}, byLevel: {[level]: number}, courseCompletions: {[courseId]: number} }`.
- Consumes: `loadBaseCurriculum(webRoot)` from `./admin-curriculum` (already used by `server/admin-store.js`), returning `{ catalog, curriculumMap }` where `catalog.profiles`/`catalog.levels`/`catalog.courses` are arrays of `{ id, ... }`.

- [ ] **Step 1: Write `server/lrn-report-store.js`**

```js
/**
 * File-backed anonymous progress-report store. One JSON file per anonymous
 * id, overwritten on every sync — a snapshot of "where this learner
 * currently stands", not an event log. See
 * docs/superpowers/specs/2026-08-26-anonymous-progress-reporting-design.md.
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { loadBaseCurriculum } = require("./admin-curriculum");

const ANON_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class ReportError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, file);
}

class LrnReportStore {
  constructor({ dataDir, webRoot }) {
    this.reportsDir = path.join(dataDir, "reports");
    this.webRoot = webRoot;
  }

  catalog() {
    return loadBaseCurriculum(this.webRoot).catalog;
  }

  validate(payload) {
    payload = payload && typeof payload === "object" ? payload : {};
    const catalog = this.catalog();
    const profileIds = new Set((catalog.profiles || []).map((item) => item.id));
    const levelIds = new Set((catalog.levels || []).map((item) => item.id));
    const courseIds = new Set((catalog.courses || []).map((item) => item.id));

    if (typeof payload.anonId !== "string" || !ANON_ID_RE.test(payload.anonId)) {
      throw new ReportError("report.anonId.invalid", "Die anonyme ID ist ungültig.", 400);
    }
    if (!profileIds.has(payload.profileId)) {
      throw new ReportError("report.profileId.invalid", "Das Profil ist unbekannt.", 400);
    }
    const externalLevel = Number(payload.externalLevel);
    if (!levelIds.has(externalLevel)) {
      throw new ReportError("report.externalLevel.invalid", "Das Level ist unbekannt.", 400);
    }
    const completedCourses = Array.isArray(payload.completedCourses)
      ? [...new Set(payload.completedCourses.filter((id) => courseIds.has(id)))]
      : [];
    return { anonId: payload.anonId, profileId: payload.profileId, externalLevel, completedCourses };
  }

  save(payload) {
    const clean = this.validate(payload);
    const record = { ...clean, updatedAt: new Date().toISOString() };
    atomicJson(path.join(this.reportsDir, `${clean.anonId}.json`), record);
    return record;
  }

  aggregate() {
    fs.mkdirSync(this.reportsDir, { recursive: true });
    const files = fs.readdirSync(this.reportsDir).filter((name) => name.endsWith(".json"));
    const reports = files.map((name) => JSON.parse(fs.readFileSync(path.join(this.reportsDir, name), "utf8")));

    const byProfile = {};
    const byLevel = {};
    const courseCompletions = {};
    for (const report of reports) {
      byProfile[report.profileId] = (byProfile[report.profileId] || 0) + 1;
      byLevel[report.externalLevel] = (byLevel[report.externalLevel] || 0) + 1;
      for (const courseId of report.completedCourses) {
        courseCompletions[courseId] = (courseCompletions[courseId] || 0) + 1;
      }
    }
    return { totalLearners: reports.length, byProfile, byLevel, courseCompletions };
  }
}

module.exports = { LrnReportStore, ReportError };
```

- [ ] **Step 2: Write `server/tests/lrn-report.test.js`**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { LrnReportStore, ReportError } = require("../lrn-report-store");

const ROOT = path.resolve(__dirname, "..", "..");
const SITE = path.join(ROOT, "site");
const VALID_ANON_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ANON_ID = "22222222-2222-4222-8222-222222222222";

function makeStore() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "lrn-report-"));
  return new LrnReportStore({ dataDir, webRoot: SITE });
}

test("save rejects an anonId that is not a UUID", () => {
  const store = makeStore();
  assert.throws(
    () => store.save({ anonId: "not-a-uuid", profileId: "tc", externalLevel: 1, completedCourses: [] }),
    ReportError,
  );
});

test("save rejects an unknown profileId", () => {
  const store = makeStore();
  assert.throws(
    () => store.save({ anonId: VALID_ANON_ID, profileId: "not-a-real-profile", externalLevel: 1, completedCourses: [] }),
    ReportError,
  );
});

test("save rejects an unknown externalLevel", () => {
  const store = makeStore();
  assert.throws(
    () => store.save({ anonId: VALID_ANON_ID, profileId: "tc", externalLevel: 99, completedCourses: [] }),
    ReportError,
  );
});

test("save drops unknown course ids instead of rejecting the whole report", () => {
  const store = makeStore();
  const record = store.save({
    anonId: VALID_ANON_ID,
    profileId: "tc",
    externalLevel: 1,
    completedCourses: ["LRN-01", "NOT-A-COURSE"],
  });
  assert.deepEqual(record.completedCourses, ["LRN-01"]);
});

test("save overwrites the previous snapshot for the same anonId", () => {
  const store = makeStore();
  store.save({ anonId: VALID_ANON_ID, profileId: "tc", externalLevel: 1, completedCourses: ["LRN-01"] });
  store.save({ anonId: VALID_ANON_ID, profileId: "tc", externalLevel: 2, completedCourses: ["LRN-01", "LRN-02"] });
  const stats = store.aggregate();
  assert.equal(stats.totalLearners, 1);
  assert.equal(stats.byLevel[2], 1);
  assert.equal(stats.courseCompletions["LRN-02"], 1);
});

test("aggregate counts learners per profile, level, and course completion", () => {
  const store = makeStore();
  store.save({ anonId: VALID_ANON_ID, profileId: "tc", externalLevel: 2, completedCourses: ["LRN-01"] });
  store.save({ anonId: OTHER_ANON_ID, profileId: "bsc", externalLevel: 1, completedCourses: ["LRN-01", "LRN-02"] });
  const stats = store.aggregate();
  assert.equal(stats.totalLearners, 2);
  assert.deepEqual(stats.byProfile, { tc: 1, bsc: 1 });
  assert.deepEqual(stats.byLevel, { 2: 1, 1: 1 });
  assert.deepEqual(stats.courseCompletions, { "LRN-01": 2, "LRN-02": 1 });
});

test("aggregate returns zero totals when no reports exist yet", () => {
  const store = makeStore();
  assert.deepEqual(store.aggregate(), { totalLearners: 0, byProfile: {}, byLevel: {}, courseCompletions: {} });
});
```

- [ ] **Step 3: Run the tests**

Run: `cd server && node --test tests/lrn-report.test.js`
Expected: all 7 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add server/lrn-report-store.js server/tests/lrn-report.test.js
git commit -m "Add file-backed store for anonymous LRN progress reports"
```

---

### Task 2: Learner-facing `POST /api/lrn/report` endpoint

**Files:**
- Modify: `server/server.js:25-57` (requires + store construction), `server/server.js:279-291` (route dispatch)

**Interfaces:**
- Consumes: `LrnReportStore`, `ReportError` from `./lrn-report-store` (Task 1); `readJson`, `sendJson` from `./admin-api` (already exported at `server/admin-api.js:321`); `StoreError` from `./admin-store` (already exported at `server/admin-store.js:572`).
- Produces: nothing new consumed elsewhere — this is a leaf route.

- [ ] **Step 1: Add requires and a shared store instance near the top of `server/server.js`**

Insert after the existing `const { createAdminApi } = require('./admin-api');` (line 36):

```js
const { readJson, sendJson } = require('./admin-api');
const { StoreError } = require('./admin-store');
const { LrnReportStore, ReportError } = require('./lrn-report-store');
```

Insert after `const handleAdminApi = createAdminApi({ webRoot: WEB_ROOT });` (line 47):

```js
// Same persistent volume as the curriculum admin store (see openshift/
// deployment.yaml's `admin-data` PVC) — reports live in a subdirectory of it
// so no new OpenShift volume is needed.
const ADMIN_DATA_DIR = path.resolve(process.env.ADMIN_DATA_DIR || path.join(__dirname, '..', '.admin-data'));
const lrnReportStore = new LrnReportStore({ dataDir: path.join(ADMIN_DATA_DIR, 'lrn-reports'), webRoot: WEB_ROOT });
```

- [ ] **Step 2: Add the `handleLrnReport` function**

Insert after `handleLlmProxy` (after line 234, before `const server = http.createServer(...)`):

```js
// Accepts an anonymous learner's current profile/level/completed-courses
// snapshot. Runs behind the passcode gate like the rest of the site — see
// the dispatch block below.
async function handleLrnReport(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }
  try {
    const body = await readJson(req);
    const record = lrnReportStore.save(body);
    sendJson(res, 200, { ok: true, updatedAt: record.updatedAt });
  } catch (error) {
    const known = error instanceof ReportError || error instanceof StoreError;
    sendJson(res, known ? error.status : 400, {
      ok: false,
      error: { code: known ? error.code : 'report.invalid', message: known ? error.message : 'Der Report konnte nicht verarbeitet werden.' },
    });
  }
}
```

- [ ] **Step 3: Dispatch the route after the gate check**

In the `server` request handler, insert a new step between "// 4. THE GATE" (ends at line 290) and "// 5. Authenticated: serve the static file." (line 292):

```js
  // 4b. Anonymous learner progress reports — the gate check above already
  // passed, so only actual visitors to the gated site can report.
  if (pathOnly === '/api/lrn/report') {
    handleLrnReport(req, res);
    return;
  }

```

- [ ] **Step 4: Manual verification**

Run: `WEB_ROOT=site GATE_DISABLED=true node server/server.js &` then:

```bash
curl -s -X POST http://localhost:8080/api/lrn/report \
  -H 'Content-Type: application/json' \
  -d '{"anonId":"11111111-1111-4111-8111-111111111111","profileId":"tc","externalLevel":1,"completedCourses":["LRN-01"]}'
```

Expected: `{"ok":true,"updatedAt":"..."}`, and `.admin-data/lrn-reports/reports/11111111-1111-4111-8111-111111111111.json` exists with that content. Stop the server afterward (`kill %1`).

- [ ] **Step 5: Run the full server test suite to confirm nothing else broke**

Run: `cd server && npm test`
Expected: all tests PASS (existing `admin.test.js` plus the new `lrn-report.test.js`).

- [ ] **Step 6: Commit**

```bash
git add server/server.js
git commit -m "Wire POST /api/lrn/report into the gated server"
```

---

### Task 3: Admin-facing `GET /api/admin/lrn-stats` endpoint

**Files:**
- Modify: `server/admin-api.js:1-72` (requires + store construction), `server/admin-api.js:81-96` (route dispatch, alongside `/api/admin/me`)

**Interfaces:**
- Consumes: `LrnReportStore` from `./lrn-report-store` (Task 1); reuses the `dataDir` and `webRoot` already computed in `createAdminApi` (`server/admin-api.js:66,65`).
- Produces: `GET /api/admin/lrn-stats` → `{ ok: true, stats }` where `stats` is `LrnReportStore#aggregate()`'s return shape (Task 1).

- [ ] **Step 1: Require the store**

In `server/admin-api.js`, add after the existing `const { AdminStore, StoreError } = require("./admin-store");` (line 11):

```js
const { LrnReportStore } = require("./lrn-report-store");
```

- [ ] **Step 2: Construct a `reportStore` alongside the existing `store`**

After `const store = options.store || new AdminStore({ dataDir, webRoot });` (line 67):

```js
const reportStore = options.reportStore || new LrnReportStore({ dataDir: path.join(dataDir, "lrn-reports"), webRoot });
```

- [ ] **Step 3: Add the route**

In the `handleAdminApi` function, after the existing `/api/admin/me` block (`server/admin-api.js:81-85`):

```js
      if (pathOnly === "/api/admin/lrn-stats") {
        requireMethod(req, "GET");
        sendJson(res, 200, { ok: true, stats: reportStore.aggregate() });
        return true;
      }

```

- [ ] **Step 4: Manual verification**

Run: `ADMIN_DEV_MODE=true WEB_ROOT=site node server/server.js &` then:

```bash
curl -s http://localhost:8080/api/admin/lrn-stats
```

Expected: `{"ok":true,"stats":{"totalLearners":0,"byProfile":{},"byLevel":{},"courseCompletions":{}}}` (or non-zero if Task 2's manual test data is still on disk). Stop the server afterward.

- [ ] **Step 5: Run the full server test suite**

Run: `cd server && npm test`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add server/admin-api.js
git commit -m "Add GET /api/admin/lrn-stats aggregation endpoint"
```

---

### Task 4: Client-side report-sync module

**Files:**
- Create: `site/lrn/report-sync.js`
- Test: `site/lrn/report-sync.test.mjs`

**Interfaces:**
- Consumes (at runtime, all already global on `site/index.html` and `site/lrn/course.html`): `window.localStorage`, bare `fetch`, bare `crypto.randomUUID`, `window.AIFSProgress` (from `site/progress.js`, exposing `getState()` and `onChange(fn)`), `window.LrnData.courses` (array of `{ id }>`, from `site/lrn/data.js`), `window.LrnCurriculumMap.courseMaps` (`{[courseId]: [{ lessons: [{ path }] }]}`, from `site/lrn/curriculum-map.js`). Reads the same `localStorage` key `lhind:lrn-cockpit:v3` that `site/lrn/lrn.js:4` writes (`{ profileId, externalLevel, ... }`).
- Produces: `window.LrnReportSync = { sync(), computeCompletedCourseIds(courses, courseMaps, progressState), buildPayload(anonId, selection, completedCourseIds), readLrnSelection(storage), getOrCreateAnonId(storage, randomUuidFn) }`. Task 5 calls `window.LrnReportSync.sync()`.

- [ ] **Step 1: Write `site/lrn/report-sync.js`**

```js
/**
 * Anonymous progress reporting for the LRN cockpit. Sends the current
 * profile/level selection and completed-course list to /api/lrn/report,
 * keyed by a random per-browser id — never a login. See
 * docs/superpowers/specs/2026-08-26-anonymous-progress-reporting-design.md.
 */
(function () {
  "use strict";

  var ANON_ID_KEY = "aifs:anon-id:v1";
  var LRN_STORE_KEY = "lhind:lrn-cockpit:v3";
  var REPORT_ENDPOINT = "/api/lrn/report";
  var DEBOUNCE_MS = 2000;

  function readLrnSelection(storage) {
    try {
      var saved = JSON.parse(storage.getItem(LRN_STORE_KEY));
      if (!saved || typeof saved.profileId !== "string" || typeof saved.externalLevel !== "number") return null;
      return { profileId: saved.profileId, externalLevel: saved.externalLevel };
    } catch (error) {
      return null;
    }
  }

  function getOrCreateAnonId(storage, randomUuid) {
    var existing = storage.getItem(ANON_ID_KEY);
    if (typeof existing === "string" && existing) return existing;
    var id = randomUuid();
    try { storage.setItem(ANON_ID_KEY, id); } catch (error) { /* best effort */ }
    return id;
  }

  function courseLessonPaths(courseMaps, courseId) {
    var units = (courseMaps && courseMaps[courseId]) || [];
    var seen = {};
    units.forEach(function (unit) {
      (unit.lessons || []).forEach(function (lesson) {
        if (lesson.path) seen[lesson.path] = true;
      });
    });
    return Object.keys(seen);
  }

  function isCourseComplete(courseMaps, courseId, progressState) {
    var paths = courseLessonPaths(courseMaps, courseId);
    if (!paths.length) return false;
    var lessons = (progressState && progressState.lessons) || {};
    return paths.every(function (path) {
      return Boolean(lessons[path] && lessons[path].completedAt);
    });
  }

  function computeCompletedCourseIds(courses, courseMaps, progressState) {
    return (courses || [])
      .map(function (course) { return course.id; })
      .filter(function (courseId) { return isCourseComplete(courseMaps, courseId, progressState); });
  }

  function buildPayload(anonId, selection, completedCourseIds) {
    return {
      anonId: anonId,
      profileId: selection.profileId,
      externalLevel: selection.externalLevel,
      completedCourses: completedCourseIds,
    };
  }

  function mount() {
    if (typeof window === "undefined" || !window.document || typeof fetch === "undefined") return;

    var timer = null;

    function sendNow(progressState) {
      var selection = readLrnSelection(window.localStorage);
      if (!selection) return; // learner has never opened the LRN cockpit yet
      var data = window.LrnData;
      var curriculum = window.LrnCurriculumMap;
      if (!data || !data.courses || !curriculum || !curriculum.courseMaps) return;
      var state = progressState || (window.AIFSProgress && window.AIFSProgress.getState());
      if (!state) return;
      var anonId = getOrCreateAnonId(window.localStorage, function () { return crypto.randomUUID(); });
      var completedCourseIds = computeCompletedCourseIds(data.courses, curriculum.courseMaps, state);
      var payload = buildPayload(anonId, selection, completedCourseIds);
      fetch(REPORT_ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(function () { /* best effort, no retry */ });
    }

    function scheduleSync(progressState) {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(function () { sendNow(progressState); }, DEBOUNCE_MS);
    }

    if (window.AIFSProgress && window.AIFSProgress.onChange) {
      window.AIFSProgress.onChange(function (state) { scheduleSync(state); });
    }

    window.LrnReportSync = {
      sync: function () { scheduleSync(); },
      computeCompletedCourseIds: computeCompletedCourseIds,
      buildPayload: buildPayload,
      readLrnSelection: readLrnSelection,
      getOrCreateAnonId: getOrCreateAnonId,
    };
  }

  mount();
})();
```

- [ ] **Step 2: Write `site/lrn/report-sync.test.mjs`**

```js
// Anonymous progress-report sync tests.
//
// Run: node --test site/lrn/report-sync.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadReportSync({ lrnSelection, progressState } = {}) {
  var storeMap = new Map();
  if (lrnSelection) storeMap.set("lhind:lrn-cockpit:v3", JSON.stringify(lrnSelection));
  const localStorage = {
    getItem(key) { return storeMap.has(key) ? storeMap.get(key) : null; },
    setItem(key, value) { storeMap.set(key, String(value)); },
  };
  const calls = [];
  const timers = [];
  const window = {
    document: {},
    localStorage,
    AIFSProgress: { getState: () => progressState || null, onChange() {} },
    LrnData: { courses: [{ id: "A" }] },
    LrnCurriculumMap: { courseMaps: { A: [{ lessons: [{ path: "a1" }] }] } },
    setTimeout(fn) { timers.push(fn); return timers.length; },
    clearTimeout() {},
  };
  const sandbox = {
    window,
    fetch: (url, options) => { calls.push({ url, options }); return Promise.resolve({ ok: true }); },
    crypto: { randomUUID: () => "generated-anon-id" },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync("site/lrn/report-sync.js", "utf8"), sandbox, { filename: "report-sync.js" });
  return { api: sandbox.window.LrnReportSync, calls, fireTimers: () => timers.forEach((fn) => fn()) };
}

test("computeCompletedCourseIds only counts courses whose every lesson is completed", () => {
  const { api } = loadReportSync();
  const courses = [{ id: "A" }, { id: "B" }];
  const courseMaps = {
    A: [{ lessons: [{ path: "a1" }, { path: "a2" }] }],
    B: [{ lessons: [{ path: "b1" }] }],
  };
  const progressState = { lessons: { a1: { completedAt: 1 }, a2: { completedAt: 2 }, b1: {} } };
  assert.deepEqual(api.computeCompletedCourseIds(courses, courseMaps, progressState), ["A"]);
});

test("readLrnSelection returns null without a stored selection", () => {
  const { api } = loadReportSync();
  assert.equal(api.readLrnSelection({ getItem: () => null }), null);
});

test("readLrnSelection returns profile and level from the lrn cockpit store", () => {
  const { api } = loadReportSync();
  const storage = { getItem: () => JSON.stringify({ profileId: "tc", externalLevel: 2 }) };
  assert.deepEqual(api.readLrnSelection(storage), { profileId: "tc", externalLevel: 2 });
});

test("getOrCreateAnonId generates once and reuses the stored id", () => {
  const { api } = loadReportSync();
  const values = new Map();
  const storage = { getItem: (k) => (values.has(k) ? values.get(k) : null), setItem: (k, v) => values.set(k, v) };
  const first = api.getOrCreateAnonId(storage, () => "generated-1");
  const second = api.getOrCreateAnonId(storage, () => "generated-2");
  assert.equal(first, "generated-1");
  assert.equal(second, "generated-1");
});

test("buildPayload shapes the request body", () => {
  const { api } = loadReportSync();
  assert.deepEqual(
    api.buildPayload("anon-1", { profileId: "tc", externalLevel: 2 }, ["LRN-01"]),
    { anonId: "anon-1", profileId: "tc", externalLevel: 2, completedCourses: ["LRN-01"] },
  );
});

test("sync sends nothing when the learner never opened the LRN cockpit", () => {
  const { api, calls, fireTimers } = loadReportSync();
  api.sync();
  fireTimers();
  assert.equal(calls.length, 0);
});

test("sync posts the current selection and completed courses after the debounce", () => {
  const { api, calls, fireTimers } = loadReportSync({
    lrnSelection: { profileId: "tc", externalLevel: 2 },
    progressState: { lessons: { a1: { completedAt: 1 } } },
  });
  api.sync();
  fireTimers();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/lrn/report");
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.anonId, "generated-anon-id");
  assert.equal(body.profileId, "tc");
  assert.deepEqual(body.completedCourses, ["A"]);
});
```

- [ ] **Step 3: Run the tests**

Run: `node --test site/lrn/report-sync.test.mjs`
Expected: all 7 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add site/lrn/report-sync.js site/lrn/report-sync.test.mjs
git commit -m "Add client-side anonymous progress-report sync module"
```

---

### Task 5: Wire the client module into both LRN pages

**Files:**
- Modify: `site/index.html:216` (script include, after `lrn/lrn.js`)
- Modify: `site/lrn/course.html:70` (script include, after `course.js`)
- Modify: `site/lrn/lrn.js:148-154` (`saveState` hook)

**Interfaces:**
- Consumes: `window.LrnReportSync.sync()` from Task 4.

- [ ] **Step 1: Include the script on `site/index.html`**

After line 216 (`<script src="lrn/lrn.js?v=20260825d"></script>`), add:

```html
  <script src="lrn/report-sync.js?v=20260826a"></script>
```

- [ ] **Step 2: Include the script on `site/lrn/course.html`**

After line 70 (`<script src="course.js?v=20260825d"></script>`), add:

```html
  <script src="report-sync.js?v=20260826a"></script>
```

- [ ] **Step 3: Hook profile/level changes in `site/lrn/lrn.js`**

Change (`site/lrn/lrn.js:148-154`):

```js
  function saveState() {
    try {
      localStorage.setItem(STORE, JSON.stringify(state));
    } catch (error) {
      // Selection persistence is a convenience only. Lesson progress is owned by progress.js / LRN.
    }
  }
```

To:

```js
  function saveState() {
    try {
      localStorage.setItem(STORE, JSON.stringify(state));
      if (window.LrnReportSync) window.LrnReportSync.sync();
    } catch (error) {
      // Selection persistence is a convenience only. Lesson progress is owned by progress.js / LRN.
    }
  }
```

- [ ] **Step 4: Run the existing LRN wiring tests to confirm nothing broke**

Run: `node --test site/lrn/test.mjs site/lrn/report-sync.test.mjs`
Expected: all tests PASS.

- [ ] **Step 5: Manual browser verification**

Start the local server (`./serve.sh` per `server/tests/admin.test.js:61-66`, or `WEB_ROOT=site GATE_DISABLED=true node server/server.js`), open `/index.html` in a browser, open DevTools → Network, change the profile or level dropdown in the LRN cockpit. Expected: a `POST /api/lrn/report` request fires ~2s later with the new `profileId`/`externalLevel`. Complete a lesson (mark it read to 100%) and confirm a second `POST` includes the course in `completedCourses` once every lesson in that course is done.

- [ ] **Step 6: Commit**

```bash
git add site/index.html site/lrn/course.html site/lrn/lrn.js
git commit -m "Wire anonymous progress-report sync into the LRN cockpit"
```

---

### Task 6: Admin "Statistik" view

**Files:**
- Modify: `site/admin.html:38-72` (nav button), `site/admin.html:118-126` (view panel)
- Modify: `site/admin.js` (state field, `boot()` API call, views map, `renderStats()`)

**Interfaces:**
- Consumes: `GET /api/admin/lrn-stats` (Task 3) via the existing `api()` helper (`site/admin.js:196`); `state.snapshot.catalog.profiles`/`.courses` (already loaded into `state.snapshot` by the existing `boot()`, see `site/admin.js:2099-2100`) to label profile and course ids with human-readable titles.
- Produces: nothing consumed elsewhere — this is the final UI leaf.

- [ ] **Step 1: Add the nav button**

In `site/admin.html`, after the `history` nav button (ends at line 71, before `</nav>` at line 72):

```html
        <button class="admin-nav__item" type="button" data-view="stats" aria-label="Statistik" title="Statistik">
          <i class="ph-light ph-chart-bar" aria-hidden="true"></i><span>Statistik</span>
        </button>
```

- [ ] **Step 2: Add the view panel**

In `site/admin.html`, after the `history` panel (line 126):

```html
        <section class="admin-view" id="view-stats" data-view-panel="stats" aria-labelledby="statsTitle" hidden></section>
```

- [ ] **Step 3: Load stats during boot in `site/admin.js`**

In the `state` object (`site/admin.js:4-46`), add a field:

```js
    lrnStats: null,
```

In `boot()` (`site/admin.js:2093-2124`), change the `Promise.all` call to also fetch stats:

```js
      const [me, curriculum, changesets, aiSkills, publishConfig, lessons, lrnStats] = await Promise.all([
        api("/api/admin/me"), api("/api/admin/curriculum"), api("/api/admin/changesets"), api("/api/admin/ai/skills"), api("/api/admin/publish/config"), api("/api/admin/lessons"), api("/api/admin/lrn-stats"),
      ]);
```

And after `state.lessons = lessons.lessons;`:

```js
      state.lrnStats = lrnStats.stats;
```

- [ ] **Step 4: Register the view**

In `renderCurrentView`'s map (`site/admin.js:361-371`), add:

```js
      stats: renderStats,
```

- [ ] **Step 5: Write `renderStats()`**

Add near `renderOverview` (after it, following the same structure — `h`, `pageHeading`, `emptyState`, and the `admin-table`/`admin-table-wrap` classes already used by `renderChangesetTable`, `site/admin.js:426-438`):

```js
  function renderStats() {
    const panel = $("#view-stats");
    panel.replaceChildren(pageHeading(
      "statsTitle",
      "Statistik",
      "Firmenweiter Lernfortschritt",
      "Anonym erhoben — jeder Datenpunkt ist ein zufälliges Browser-Pseudonym, kein Klarname.",
    ));

    const stats = state.lrnStats || { totalLearners: 0, byProfile: {}, byLevel: {}, courseCompletions: {} };
    if (!stats.totalLearners) {
      panel.append(emptyState("chart-bar", "Noch keine Daten", "Sobald Lernende die LRN-Kachel öffnen, erscheinen hier aggregierte Zahlen."));
      return;
    }

    const profileTitle = (id) => {
      const profile = (state.snapshot.catalog.profiles || []).find((item) => item.id === id);
      return profile ? profile.label : id;
    };
    const courseTitle = (id) => {
      const course = (state.snapshot.catalog.courses || []).find((item) => item.id === id);
      return course ? course.title : id;
    };

    const dashboard = h("div", { class: "admin-dashboard" });
    dashboard.append(h("dl", { class: "admin-inventory", "aria-label": "Lernende gesamt" }, [
      h("div", { class: "admin-inventory__item" }, [
        h("dt", { text: "Lernende (anonym)" }),
        h("dd", { text: stats.totalLearners }),
        h("small", { text: "Ein Eintrag pro Browser-Pseudonym" }),
      ]),
    ]));

    const profileRows = Object.entries(stats.byProfile).sort((a, b) => b[1] - a[1]);
    const profilePanel = h("article", { class: "admin-panel admin-dashboard__wide" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Nach Profil" })]),
      h("div", { class: "admin-table-wrap" }, h("table", { class: "admin-table" }, [
        h("thead", {}, h("tr", {}, [h("th", { text: "Profil" }), h("th", { text: "Lernende" })])),
        h("tbody", {}, profileRows.map(([id, count]) => h("tr", {}, [h("td", { text: profileTitle(id) }), h("td", { text: count })]))),
      ])),
    ]);

    const levelRows = Object.entries(stats.byLevel).sort((a, b) => Number(a[0]) - Number(b[0]));
    const levelPanel = h("aside", { class: "admin-panel admin-dashboard__side" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Nach Level" })]),
      h("div", { class: "admin-table-wrap" }, h("table", { class: "admin-table" }, [
        h("thead", {}, h("tr", {}, [h("th", { text: "Level" }), h("th", { text: "Lernende" })])),
        h("tbody", {}, levelRows.map(([level, count]) => h("tr", {}, [h("td", { text: level }), h("td", { text: count })]))),
      ])),
    ]);

    const courseRows = Object.entries(stats.courseCompletions).sort((a, b) => b[1] - a[1]);
    const coursePanel = h("article", { class: "admin-panel admin-dashboard__wide" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Kursabschlüsse" })]),
      h("div", { class: "admin-table-wrap" }, h("table", { class: "admin-table" }, [
        h("thead", {}, h("tr", {}, [h("th", { text: "Kurs" }), h("th", { text: "Abschlüsse" })])),
        h("tbody", {}, courseRows.map(([id, count]) => h("tr", {}, [h("td", { text: courseTitle(id) }), h("td", { text: count })]))),
      ])),
    ]);

    dashboard.append(profilePanel, levelPanel, coursePanel);
    panel.append(dashboard);
  }
```

- [ ] **Step 6: Manual browser verification**

Start the local server with `ADMIN_DEV_MODE=true` (see `server/tests/admin.test.js:53-59` for the dev-mode convention), open `/admin.html`, click "Statistik" in the sidebar. Expected: the panel renders without a console error, showing either the empty state or tables matching whatever `.admin-data/lrn-reports/reports/*.json` files exist locally (e.g. the one from Task 2's curl test).

- [ ] **Step 7: Commit**

```bash
git add site/admin.html site/admin.js
git commit -m "Add anonymous progress statistics view to the curriculum admin"
```
