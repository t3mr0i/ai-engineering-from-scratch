// LRN cockpit wiring tests.
//
// Run: node site/lrn/test.mjs
//
// These tests assert structural invariants between data.js (window.LrnData)
// and curriculum-map.js (window.LrnCurriculumMap). They are pure: no
// network, no DOM, no localStorage. Failures block the SWA deploy job in the
// GitHub Actions workflow.
//
// Why node:vm: data.js and curriculum-map.js are browser-only assignments
// (window.LrnData = ...). The simplest way to evaluate them server-side is
// to run the script body inside a vm sandbox with a fake window.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { basename } from "node:path";
import vm from "node:vm";

function loadData() {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  const src = readFileSync("site/lrn/data.js", "utf8");
  vm.runInContext(src, sandbox, { filename: "data.js" });
  if (!sandbox.window.LrnData) throw new Error("data.js did not assign window.LrnData");
  return sandbox.window.LrnData;
}

function loadMap() {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  const src = readFileSync("site/lrn/curriculum-map.js", "utf8");
  vm.runInContext(src, sandbox, { filename: "curriculum-map.js" });
  if (!sandbox.window.LrnCurriculumMap) throw new Error("curriculum-map.js did not assign window.LrnCurriculumMap");
  return sandbox.window.LrnCurriculumMap;
}

// Cockpit default profile — must match the constant in site/lrn/lrn.js
// (state.profileId fallback and the "tc" reset in render()). If lrn.js
// switches the default, update this constant in the same commit.
function loadActiveProfileId() {
  const lrn = readFileSync("site/lrn/lrn.js", "utf8");
  // Look for an explicit reset like state.profileId = "tc" inside render()
  // or a profileId:"tc" default object. We accept the first well-formed
  // match and refuse to guess if none is present.
  const candidates = [
    /state\.profileId\s*=\s*["']([a-z]+)["']/,
    /profileId:\s*["']([a-z]+)["']/,
  ];
  for (const re of candidates) {
    const m = lrn.match(re);
    if (m) return m[1];
  }
  throw new Error("could not derive active profile id from site/lrn/lrn.js");
}

const data = loadData();
const cmap = loadMap();
const activeProfileId = loadActiveProfileId();

// ───────────────────────────────────────────────────────────────────────────
// data.js shape
// ───────────────────────────────────────────────────────────────────────────

test("data.js exports a courses[] array with >=12 entries", () => {
  assert.ok(Array.isArray(data.courses), "LrnData.courses must be an array");
  assert.ok(data.courses.length >= 12, `expected >=12 courses, got ${data.courses.length}`);
});

test("every Course has a unique id", () => {
  const ids = data.courses.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate Course.id");
});

test("every Course has the required fields", () => {
  const required = ["id", "title", "profileIds", "dimensions", "levels", "modules"];
  for (const c of data.courses) {
    for (const f of required) {
      assert.ok(c[f] !== undefined, `Course ${c.id} missing field ${f}`);
    }
    assert.ok(Array.isArray(c.profileIds), `Course ${c.id}.profileIds must be array`);
    assert.ok(Array.isArray(c.dimensions), `Course ${c.id}.dimensions must be array`);
    assert.ok(Array.isArray(c.levels), `Course ${c.id}.levels must be array`);
    assert.ok(Array.isArray(c.modules) && c.modules.length > 0, `Course ${c.id}.modules must be non-empty array`);
  }
});

// The TOP12 are the flagship TC courses (see .tc-rewrite-shared.mjs).
// They must have outcomes authored (3-5 verbs each) — that is the table-stakes
// capability we closed. Other courses may carry an empty outcomes: [] placeholder.
const TOP12_IDS = [
  "AI-09", "AI-06", "RESP-01", "PROMPT-01", "USECASE-01",
  "AI-23", "AI-24", "AI-19", "AI-26", "AI-21", "AI-25", "AI-39",
];

test("every TOP12 flagship course has 3-5 outcomes", () => {
  const byId = new Map(data.courses.map((c) => [c.id, c]));
  for (const id of TOP12_IDS) {
    const c = byId.get(id);
    assert.ok(c, `TOP12 course ${id} missing from data.js`);
    assert.ok(Array.isArray(c.outcomes), `Course ${id} must have an outcomes: field (use [] if not yet authored)`);
    assert.ok(c.outcomes.length >= 3 && c.outcomes.length <= 5,
      `Course ${id} must have 3-5 outcomes, got ${c.outcomes.length}`);
    for (const o of c.outcomes) {
      assert.equal(typeof o, "string", `Course ${id} outcome must be a string`);
      assert.ok(o.trim().length >= 24, `Course ${id} outcome too short: ${JSON.stringify(o)}`);
    }
  }
});

test("every Course has an outcomes: field (empty array is allowed)", () => {
  for (const c of data.courses) {
    assert.ok(Array.isArray(c.outcomes), `Course ${c.id} missing outcomes: field (use [] if not yet authored)`);
  }
});

test("Harness Engineering course is scoped to the Technology Consulting profile", () => {
  const course = data.courses.find((c) => c.id === "HARNESS-TC-01");
  assert.ok(course, "HARNESS-TC-01 missing from data.js");
  assert.deepEqual([...course.profileIds], ["tc"]);
  assert.ok(course.interests.includes("consulting"), "course must support the Consulting interest");
  assert.ok(course.interests.includes("engineering"), "course may also support the Engineering interest");
  assert.deepEqual([...course.levels], ["Deepen", "Create"]);
  assert.equal(course.modules.length, 8, "course must expose eight course units as modules");
  assert.equal(course.outcomes.length, 4, "course should have four authored outcomes");
  const tc = data.profiles.find((profile) => profile.id === "tc");
  assert.ok(tc && tc.code === "R03-TC", "Technology Consulting profile must retain code R03-TC");
});

// ───────────────────────────────────────────────────────────────────────────
// tracks / paths shape
// ───────────────────────────────────────────────────────────────────────────

test("data.js exports tracks[] with LP01..LP05 paths", () => {
  assert.ok(Array.isArray(data.tracks), "LrnData.tracks must be an array");
  const codes = data.tracks.map((t) => t.code).sort();
  for (const want of ["LP01", "LP02", "LP03", "LP04", "LP05"]) {
    assert.ok(codes.includes(want), `expected track ${want}, got ${codes.join(",")}`);
  }
});

test("every track references Course ids that exist in courses[]", () => {
  const courseIds = new Set(data.courses.map((c) => c.id));
  for (const track of data.tracks) {
    for (const stage of track.stages || []) {
      for (const cid of stage.courses || []) {
        assert.ok(courseIds.has(cid),
          `track ${track.code} stage ${stage.label} references missing course ${cid}`);
      }
    }
  }
});

test("every track has at least one Course across its stages", () => {
  for (const track of data.tracks) {
    const n = (track.stages || []).reduce((acc, s) => acc + (s.courses || []).length, 0);
    assert.ok(n >= 1, `track ${track.code} has no courses at all`);
  }
});

test("Harness Engineering is staged in LP03 and not broadened through LP02", () => {
  const lp03 = data.tracks.find((track) => track.code === "LP03");
  const lp02 = data.tracks.find((track) => track.code === "LP02");
  assert.ok(lp03 && lp02, "LP02 and LP03 must exist");
  const lp03Stages = lp03.stages.filter((stage) => stage.courses.includes("HARNESS-TC-01"));
  assert.deepEqual([...lp03Stages.map((stage) => stage.label)], ["Deepen", "Create"]);
  assert.equal(lp02.stages.some((stage) => stage.courses.includes("HARNESS-TC-01")), false);
  assert.ok(lp03.profileIds.includes("tc"), "LP03 must serve Technology Consulting");
});

// ───────────────────────────────────────────────────────────────────────────
// curriculum-map.js ↔ data.js cross-consistency
// ───────────────────────────────────────────────────────────────────────────

test("curriculum-map.js exports courseMaps keyed by Course id", () => {
  assert.ok(cmap.courseMaps, "LrnCurriculumMap.courseMaps missing");
  const courseIds = new Set(data.courses.map((c) => c.id));
  for (const cid of Object.keys(cmap.courseMaps)) {
    assert.ok(courseIds.has(cid), `curriculum-map has entry for unknown course ${cid}`);
    const units = cmap.courseMaps[cid];
    assert.ok(Array.isArray(units) && units.length > 0,
      `courseMap for ${cid} must have a non-empty units array`);
    for (const u of units) {
      assert.ok(Array.isArray(u.lessons) && u.lessons.length > 0,
        `unit in course ${cid} must have a non-empty lessons array`);
    }
  }
});

test("every Course referenced by curriculum-map is visible in the active cockpit profile", () => {
  // The LRN cockpit filters Course.profileIds through state.profileId
  // (see lrn.js render → courseFilter / trackFilter). curriculum-map
  // entries for courses outside the active profile would be dead links
  // in the cockpit UI — flag them so they get fixed or removed.
  const visibleIds = new Set(
    data.courses
      .filter((c) => Array.isArray(c.profileIds) && c.profileIds.includes(activeProfileId))
      .map((c) => c.id)
  );
  for (const cid of Object.keys(cmap.courseMaps)) {
    assert.ok(visibleIds.has(cid),
      `curriculum-map has course ${cid} but it is not visible in the active cockpit profile '${activeProfileId}'`);
  }
});

test("Harness Engineering map preserves 8 units and 22 activities", () => {
  const units = cmap.courseMaps["HARNESS-TC-01"];
  assert.ok(Array.isArray(units), "HARNESS-TC-01 course map missing");
  assert.equal(units.length, 8);
  assert.deepEqual([...units.map((unit) => unit.lessons.length)], [3, 3, 3, 3, 3, 3, 2, 2]);
  const activities = units.flatMap((unit) => unit.lessons);
  assert.equal(activities.length, 22);
  assert.equal(new Set(activities.map((lesson) => lesson.path)).size, 22, "activities must not duplicate paths");
  const paths = new Set(activities.map((lesson) => lesson.path));
  for (const lessonNumber of Array.from({ length: 14 }, (_, index) => index + 31)) {
    assert.ok([...paths].some((path) => path.startsWith(`phases/14-agent-engineering/${String(lessonNumber).padStart(2, "0")}-`)),
      `missing lecture activity ${lessonNumber}`);
  }
  for (const lessonNumber of Array.from({ length: 8 }, (_, index) => index + 45)) {
    assert.ok([...paths].some((path) => path.startsWith(`phases/14-agent-engineering/${lessonNumber}-`)),
      `missing project activity ${lessonNumber}`);
  }
});

test("HARNESS-TC-01 quiz lesson ids match activity directory basenames", () => {
  const units = cmap.courseMaps["HARNESS-TC-01"];
  assert.ok(Array.isArray(units), "HARNESS-TC-01 course map missing");
  const activities = units.flatMap((unit) => unit.lessons || []);
  assert.equal(activities.length, 22, "HARNESS-TC-01 must keep 22 activities");
  for (const lesson of activities) {
    const quizPath = `${lesson.path}/quiz.json`;
    if (!existsSync(quizPath)) continue;
    const quiz = JSON.parse(readFileSync(quizPath, "utf8"));
    assert.equal(quiz.lesson, basename(lesson.path),
      `quiz.lesson mismatch for ${lesson.path}`);
  }
});

// ───────────────────────────────────────────────────────────────────────────
// Curriculum files actually exist on disk
// ───────────────────────────────────────────────────────────────────────────

test("every lesson.path under curriculum-map points to a real lesson source", () => {
  // The interactive primer is intentionally outside phases/: lesson.html
  // recognizes this exact path and embeds site/llm-primer/index.html.
  const interactiveSources = { "llm-primer": "site/llm-primer/index.html" };
  for (const [cid, units] of Object.entries(cmap.courseMaps)) {
    for (const u of units) {
      for (const lesson of u.lessons || []) {
        const interactiveSource = interactiveSources[lesson.path];
        if (interactiveSource) {
          assert.ok(existsSync(interactiveSource),
            `courseMap ${cid} interactive lesson source does not exist: ${interactiveSource}`);
          continue;
        }
        assert.ok(typeof lesson.path === "string" && lesson.path.startsWith("phases/"),
          `courseMap ${cid} lesson has invalid path: ${JSON.stringify(lesson)}`);
        assert.ok(existsSync(lesson.path) && statSync(lesson.path).isDirectory(),
          `courseMap ${cid} lesson path does not exist as a directory: ${lesson.path}`);
      }
    }
  }
});

// ───────────────────────────────────────────────────────────────────────────
// Build inputs the site relies on
// ───────────────────────────────────────────────────────────────────────────

test("package.json depends on pyodide (browser IDE requirement)", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.ok(pkg.dependencies && pkg.dependencies.pyodide,
    "package.json must declare pyodide dependency for site/jupyterlite/ to load");
});

test("GitHub Actions workflow deploys the site to Azure Static Web Apps", () => {
  const workflowPath = ".github/workflows/azure-static-web-apps.yml";
  assert.ok(existsSync(workflowPath), `${workflowPath} missing`);
  const yml = readFileSync(workflowPath, "utf8");
  assert.match(yml, /Azure\/static-web-apps-deploy@v1/i,
    `${workflowPath} does not use the Azure Static Web Apps deploy action`);
  assert.match(yml, /app_location:\s*["']site["']/i,
    `${workflowPath} must deploy the site/ directory`);
});
