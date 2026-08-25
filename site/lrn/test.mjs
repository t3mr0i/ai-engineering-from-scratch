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

function loadSchedule(data) {
  const sandbox = { window: { LrnData: data }, console };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync("site/lrn/schedule.js", "utf8"), sandbox, { filename: "schedule.js" });
  if (!sandbox.window.LrnSchedule) throw new Error("schedule.js did not assign window.LrnSchedule");
  return sandbox.window.LrnSchedule;
}

function loadCourseFormats() {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  const src = readFileSync("site/lrn/course-formats.js", "utf8");
  vm.runInContext(src, sandbox, { filename: "course-formats.js" });
  if (!sandbox.window.LrnCourseFormats) throw new Error("course-formats.js did not assign window.LrnCourseFormats");
  return sandbox.window.LrnCourseFormats;
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
const courseFormats = loadCourseFormats();
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

test("every Course resolves to a labeled learning format with an icon", () => {
  const supported = new Set(["experiment", "deck", "elearning", "workshop", "lab", "toolkit"]);
  for (const course of data.courses) {
    const format = courseFormats.resolve(course);
    assert.ok(supported.has(format.id), `Course ${course.id} has unsupported format ${format.id}`);
    assert.ok(format.icon, `Course ${course.id} format is missing an icon`);
    assert.ok(format.labelKey, `Course ${course.id} format is missing an i18n key`);
    assert.ok(format.label, `Course ${course.id} format is missing a fallback label`);
  }
});

test("learning format exemplars stay semantically distinct", () => {
  const byId = new Map(data.courses.map((course) => [course.id, course]));
  const expected = {
    "PRIMER-01": "experiment",
    "LRN-25": "deck",
    "LRN-01": "elearning",
    "LRN-22": "workshop",
    "LRN-06": "lab",
    "LRN-04": "toolkit",
  };
  for (const [id, formatId] of Object.entries(expected)) {
    assert.equal(courseFormats.resolve(byId.get(id)).id, formatId, `${id} format drifted`);
  }
});

// The TOP12 are the flagship TC courses (see .tc-rewrite-shared.mjs).
// They must have outcomes authored (3-5 verbs each) — that is the table-stakes
// capability we closed. Other courses may carry an empty outcomes: [] placeholder.
const TOP12_IDS = [
  "LRN-01", "LRN-02", "LRN-03", "LRN-22", "LRN-23",
  "LRN-28", "LRN-18", "LRN-15", "LRN-36", "LRN-40", "LRN-41", "LRN-39",
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
  const course = data.courses.find((c) => c.id === "LRN-26");
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

test("the learner model exposes all seven AI Literacy roles", () => {
  assert.deepEqual(
    [...data.profiles.map((profile) => profile.id)],
    ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
  );
  assert.equal(new Set(data.profiles.map((profile) => profile.code)).size, 7);
});

test("capability targets match the supplied role-depth matrix", () => {
  const byId = new Map(data.capabilities.map((capability) => [capability.id, capability]));
  const roles = ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"];
  const na = "n. a.";
  const expected = {
    1: ["Deepen", "Deepen", "Create", "Deepen", "Deepen", "Deepen", "Deepen"],
    2: ["Create", "Create", "Create", "Deepen", "Deepen", "Deepen", "Deepen"],
    3: ["Create", "Create", "Create", "Acquire", "Create", "Deepen", "Create"],
    4: ["Deepen", "Deepen", "Create", "Create", "Deepen", "Deepen", "Create"],
    5: [na, "Acquire", "Create", na, na, na, na],
    6: ["Acquire", "Acquire", "Create", "Acquire", na, na, na],
    7: [na, "Acquire", "Create", "Deepen", na, na, na],
    8: ["Acquire", "Acquire", "Create", "Create", na, na, na],
    9: ["Deepen", "Deepen", "Create", "Create", na, "Deepen", "Acquire"],
    10: ["Deepen", "Deepen", "Deepen", "Acquire", na, na, "Acquire"],
    11: ["Create", "Create", "Deepen", "Acquire", "Acquire", "Acquire", "Acquire"],
    12: ["Create", "Create", "Acquire", na, "Acquire", "Acquire", "Acquire"],
    13: ["Create", "Deepen", "Deepen", "Acquire", "Create", "Acquire", "Deepen"],
    14: ["Create", "Deepen", "Deepen", "Acquire", "Deepen", "Acquire", "Create"],
    15: ["Create", "Deepen", "Deepen", "Deepen", "Create", "Acquire", "Create"],
    16: ["Create", "Deepen", "Create", "Acquire", "Acquire", "Acquire", "Deepen"],
    17: ["Create", "Deepen", "Acquire", "Acquire", "Create", "Acquire", "Deepen"],
    18: ["Deepen", "Acquire", "Acquire", "Acquire", "Acquire", "Create", "Create"],
    19: ["Deepen", "Deepen", "Acquire", "Acquire", "Deepen", "Deepen", "Create"],
  };
  for (const [id, row] of Object.entries(expected)) {
    assert.deepEqual(roles.map((role) => byId.get(Number(id)).targets[role]), row, `capability ${id} target row drifted`);
  }
  assert.equal(data.capabilityGroups.length, 5);
  assert.deepEqual(Array.from(data.capabilityGroups, (group) => group.cluster), [
    "Foundation",
    "Engineering",
    "Product and Process",
    "Advisory and Business Consulting",
    "Leadership and Strategy",
  ]);
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
  const lp03Stages = lp03.stages.filter((stage) => stage.courses.includes("LRN-26"));
  assert.deepEqual([...lp03Stages.map((stage) => stage.label)], ["Deepen", "Create"]);
  assert.equal(lp02.stages.some((stage) => stage.courses.includes("LRN-26")), false);
  assert.ok(lp03.profileIds.includes("tc"), "LP03 must serve Technology Consulting");
});

test("Academy learning paths cover every imported AI course exactly once", () => {
  assert.ok(Array.isArray(data.academyPaths), "LrnData.academyPaths must be an array");
  const actual = data.academyPaths.map((path) => path.academyCourse).sort();
  const expected = ["AI-01", "AI-02", "AI-03", "AI-04", "AI-06", "AI-07", "AI-08", "AI-09", "AI-10", "AI-12"];
  assert.deepEqual([...actual], expected);
  assert.equal(new Set(data.academyPaths.map((path) => path.id)).size, data.academyPaths.length,
    "Academy path ids must be unique");
});

test("Academy paths separate shared foundations from explicit profile recommendations", () => {
  const profileIds = new Set(data.profiles.map((profile) => profile.id));
  const categories = new Set(["foundation", "role", "technical"]);

  for (const path of data.academyPaths) {
    assert.ok(categories.has(path.category),
      `Academy path ${path.id} has invalid category ${path.category}`);
    assert.ok(path.recommendationRanks && typeof path.recommendationRanks === "object" && !Array.isArray(path.recommendationRanks),
      `Academy path ${path.id} needs recommendationRanks`);

    const recommendations = Object.entries(path.recommendationRanks);
    if (path.category === "foundation") {
      assert.equal(recommendations.length, 0,
        `Foundation ${path.id} must be shared rather than role-ranked`);
      assert.ok(Number.isInteger(path.foundationRank) && path.foundationRank > 0,
        `Foundation ${path.id} needs a positive foundationRank`);
    } else {
      assert.ok(recommendations.length > 0,
        `Academy path ${path.id} needs at least one explicit profile recommendation`);
    }

    for (const [profileId, rank] of recommendations) {
      assert.ok(profileIds.has(profileId),
        `Academy path ${path.id} recommends unknown profile ${profileId}`);
      assert.ok(Number.isInteger(rank) && rank > 0,
        `Academy path ${path.id} has invalid rank ${rank} for ${profileId}`);
    }
  }
});

test("Academy recommendations stay focused to three ordered trainings per profile", () => {
  const expected = {
    bsc: ["AI-04", "AI-07", "AI-10"],
    pvs: ["AI-04", "AI-07", "AI-10"],
    tc: ["AI-01", "AI-02", "AI-03"],
    am: ["AI-02", "AI-01"],
    pma: ["AI-04", "AI-07", "AI-08"],
    corp: ["AI-08", "AI-07"],
    lead: ["AI-08", "AI-07", "AI-10"],
  };

  for (const [profileId, academyCourses] of Object.entries(expected)) {
    const actual = data.academyPaths
      .filter((path) => Number.isInteger(path.recommendationRanks[profileId]))
      .sort((a, b) => a.recommendationRanks[profileId] - b.recommendationRanks[profileId])
      .slice(0, 3)
      .map((path) => path.academyCourse);
    assert.deepEqual([...actual], academyCourses, `unexpected recommendations for ${profileId}`);
  }
});

test("every Academy learning path is an ordered, resolvable Course journey", () => {
  const courseIds = new Set(data.courses.map((course) => course.id));
  const trackCodes = new Set(data.tracks.map((track) => track.code));
  const stageOrder = { Acquire: 1, Deepen: 2, Create: 3 };
  for (const path of data.academyPaths) {
    for (const field of ["id", "academyCourse", "title", "format", "audience", "prerequisites", "summary"]) {
      assert.ok(typeof path[field] === "string" && path[field].trim(),
        `Academy path ${path.id || "<unknown>"} missing ${field}`);
    }
    assert.ok(Array.isArray(path.trackCodes) && path.trackCodes.length > 0,
      `Academy path ${path.id} must name at least one LP track`);
    for (const code of path.trackCodes) {
      assert.ok(trackCodes.has(code), `Academy path ${path.id} references missing track ${code}`);
    }
    assert.ok(Array.isArray(path.stages) && path.stages.length >= 2,
      `Academy path ${path.id} must contain at least two stages`);
    let previous = 0;
    for (const stage of path.stages) {
      assert.ok(stageOrder[stage.label], `Academy path ${path.id} has invalid stage ${stage.label}`);
      assert.ok(stageOrder[stage.label] > previous,
        `Academy path ${path.id} stages must stay in Acquire/Deepen/Create order`);
      previous = stageOrder[stage.label];
      assert.ok(typeof stage.focus === "string" && stage.focus.trim(),
        `Academy path ${path.id} stage ${stage.label} needs a focus`);
      assert.ok(Array.isArray(stage.courses) && stage.courses.length > 0,
        `Academy path ${path.id} stage ${stage.label} has no Courses`);
      for (const courseId of stage.courses) {
        assert.ok(courseIds.has(courseId),
          `Academy path ${path.id} stage ${stage.label} references missing Course ${courseId}`);
        assert.ok(Array.isArray(cmap.courseMaps[courseId]) && cmap.courseMaps[courseId].length > 0,
          `Academy path ${path.id} references Course ${courseId} without a curriculum map`);
      }
    }
  }
});

test("the learner catalog exposes the Academy paths with current browser data", () => {
  const html = readFileSync("site/index.html", "utf8");
  const lrn = readFileSync("site/lrn/lrn.js", "utf8");
  const courseDetail = readFileSync("site/lrn/course.js", "utf8");
  assert.match(html, /id="academyPathList"/,
    "catalog needs a learner-visible Academy path container");
  assert.match(html, /id="myLearningPathContent"/,
    "catalog needs a persistent learner-path summary and next-step surface");
  assert.match(html, /lrn\/data\.js\?v=20260825a/,
    "catalog must cache-bust the browser data that contains Academy paths");
  assert.match(lrn, /function renderAcademyPaths\(context\)/,
    "catalog needs to render Academy paths from LrnData");
  assert.match(lrn, /function academyPathGroup\(kind, titleText, introText, paths, context\)/,
    "catalog needs grouped Academy sections instead of a flat card list");
  assert.match(lrn, /ACADEMY_RECOMMEND_CAP = 3/,
    "catalog recommendations must stay focused to three trainings");
  assert.match(lrn, /saved && saved\.profileId === profileId/,
    "switching profiles must not retain an unrelated saved Academy path");
  assert.doesNotMatch(lrn, /relevantTrackCodes/,
    "Academy recommendations must not be inferred from broad LP track membership");
  assert.match(lrn, /progressApi\.saveLearningPath/,
    "catalog must save the learner's selected Academy path locally");
  assert.match(lrn, /function academyPathProgress\(path\)/,
    "catalog must derive the active stage and next course from real progress");
  assert.match(lrn, /link\.href = academyPathHref\(path\.academyCourse\)/,
    "Academy cards must open a dedicated intermediate page instead of expanding inline");
  assert.doesNotMatch(lrn, /createElement\("details"\)/,
    "Academy cards must not use inline disclosure widgets");
  assert.match(courseDetail, /params\.get\("academy"\)/,
    "course detail must resolve Academy deep links");
  assert.match(courseDetail, /function renderAcademyPath\(path\)/,
    "course detail must render the Academy intermediate page");
  assert.match(courseDetail, /function persistAcademyPath\(path\)/,
    "Academy deep links must restore the selected path in local progress storage");
  assert.match(courseDetail, /courseDetailHref\(courseItem\.id\)/,
    "Academy stages must link onward into supporting LRN course details");
});

test("composite learning links use the shared interactive-surface contract", () => {
  const lrn = readFileSync("site/lrn/lrn.js", "utf8");
  const course = readFileSync("site/lrn/course.js", "utf8");
  const skills = readFileSync("site/skills-progress.js", "utf8");
  const css = readFileSync("site/lrn/lrn.css", "utf8");
  const tokens = readFileSync("site/lrn/tokens.css", "utf8");

  assert.match(lrn, /link\.className = "interactive-surface interactive-card academy-card"/,
    "Academy cards must opt into the shared card interaction contract");
  assert.match(lrn, /card\.className = "interactive-surface interactive-card course-card"/,
    "Course cards must opt into the shared card interaction contract");
  assert.match(lrn, /interactive-card__icon academy-card__icon/,
    "Academy cards must use the shared icon slot");
  assert.match(lrn, /interactive-card__icon course-card__tile/,
    "Course cards must use the shared icon slot");
  assert.match(lrn, /interactive-card__action academy-card__chevron/,
    "Academy cards must use the shared action slot");
  assert.match(lrn, /interactive-card__action course-card__open/,
    "Course cards must use the shared action slot");
  assert.match(course, /link\.className = "interactive-surface activity-link academy-course-link"/,
    "Academy course rows must opt into the shared surface contract");
  assert.match(course, /a\.className = "interactive-surface activity-link"/,
    "Activity rows must opt into the shared surface contract");
  assert.match(skills, /element\("a", "interactive-surface skill-course__link"\)/,
    "Capability course rows must opt into the shared surface contract");

  assert.match(css,
    /\.interactive-surface:hover,\s*\.interactive-surface:focus-visible\s*\{[^}]*text-decoration:\s*none;/s,
    "Composite surfaces must suppress text decoration in every interactive state");
  assert.match(css, /:where\(a:not\(\[class\]\), \.text-link\):hover/,
    "Underline affordance must be opt-in for text links instead of applying to every anchor");
  assert.match(css, /translateY\(var\(--card-hover-lift\)\)/,
    "Shared cards must consume the central hover-lift token");
  for (const token of [
    "--card-hover-lift",
    "--card-hover-border",
    "--card-hover-shadow",
    "--card-hover-wash-strong",
    "--card-hover-wash-soft",
  ]) {
    assert.ok(tokens.includes(token), `tokens.css must define ${token}`);
  }
});

test("AI-06, AI-07, and AI-08 extend their existing Courses with source-specific units", () => {
  const expectedUnitCounts = { "LRN-02": 4, "LRN-40": 4, "LRN-16": 4, "LRN-25": 4 };
  for (const [courseId, count] of Object.entries(expectedUnitCounts)) {
    assert.equal(cmap.courseMaps[courseId].length, count,
      `${courseId} must retain the imported source-specific unit structure`);
  }
  const quantitativePaths = new Set(cmap.courseMaps["LRN-40"].flatMap((unit) => unit.lessons).map((lesson) => lesson.path));
  for (const required of [
    "phases/02-ml-fundamentals/07-unsupervised-learning",
    "phases/02-ml-fundamentals/15-time-series",
    "phases/09-reinforcement-learning/03-monte-carlo-methods",
    "phases/01-math-foundations/08-optimization",
  ]) {
    assert.ok(quantitativePaths.has(required), `AI-07 path missing ${required}`);
  }
});

test("AI-10 and AI-12 have dedicated Course containers and mapped Activities", () => {
  const sales = data.courses.find((course) => course.id === "LRN-45");
  const infrastructure = data.courses.find((course) => course.id === "LRN-46");
  assert.equal(sales && sales.academyCourse, "AI-10");
  assert.equal(infrastructure && infrastructure.academyCourse, "AI-12");
  assert.equal(cmap.courseMaps["LRN-45"].length, 4);
  assert.equal(cmap.courseMaps["LRN-46"].length, 5);
  const salesPaths = new Set(cmap.courseMaps["LRN-45"].flatMap((unit) => unit.lessons).map((lesson) => lesson.path));
  const infraPaths = new Set(cmap.courseMaps["LRN-46"].flatMap((unit) => unit.lessons).map((lesson) => lesson.path));
  assert.ok(salesPaths.has("phases/11-llm-engineering/44-ai-for-sales-product-consulting"));
  assert.ok(infraPaths.has("phases/13-tools-and-protocols/07-building-an-mcp-server"));
  assert.ok(infraPaths.has("phases/17-infrastructure-and-production/13-llm-observability"));
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
  const units = cmap.courseMaps["LRN-26"];
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

test("Harness Engineering distinguishes 14 lessons from 8 project labs", () => {
  const units = cmap.courseMaps["LRN-26"];
  const activities = units.flatMap((unit) => unit.lessons);
  assert.equal(activities.filter((activity) => activity.activityType === "lesson").length, 14);
  assert.equal(activities.filter((activity) => activity.activityType === "lab").length, 8);
  for (const unit of units) {
    assert.equal(unit.lessons.at(-1).activityType, "lab",
      `Harness unit ${unit.title} must end in its project lab`);
    assert.ok(unit.lessons.slice(0, -1).every((activity) => activity.activityType === "lesson"),
      `Harness unit ${unit.title} must put lecture activities before its project lab`);
  }
});

test("HARNESS-TC-01 quiz lesson ids match activity directory basenames", () => {
  const units = cmap.courseMaps["LRN-26"];
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

test("course detail uses the current server-backed access guard", () => {
  const html = readFileSync("site/lrn/course.html", "utf8");
  assert.match(html, /<script src=["']\/gate-guard\.js["']><\/script>/,
    "course detail must load the same server-backed access guard as the rest of the site");
  assert.doesNotMatch(html, /<script src=["'](?:\.\.\/)?gate\.js["']><\/script>/,
    "course detail must not reference the removed client-side gate.js");
  assert.ok(existsSync("site/gate-guard.js"), "site/gate-guard.js missing");
});

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


test("data.js carries the trainer roster and the course calendar", () => {
  const data = loadData();
  assert.ok(Array.isArray(data.trainers), "trainers[] fehlt");
  assert.ok(Array.isArray(data.sessions), "sessions[] fehlt");
});

test("the schedule helper sorts dates and skips cancelled or finished ones", () => {
  const past = new Date(Date.now() - 86400000 * 30).toISOString().slice(0, 16);
  const soon = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16);
  const later = new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 16);
  const schedule = loadSchedule({
    trainers: [{ id: "TR-01", name: "Ada Lovelace", languages: ["de"] }],
    sessions: [
      { id: "SES-2026-003", courseId: "LRN-01", start: later, end: later, trainerIds: ["TR-01"], status: "planned" },
      { id: "SES-2026-002", courseId: "LRN-01", start: soon, end: soon, trainerIds: ["TR-01"], status: "confirmed" },
      { id: "SES-2026-001", courseId: "LRN-01", start: past, end: past, trainerIds: ["TR-01"], status: "done" },
      { id: "SES-2026-004", courseId: "LRN-01", start: soon, end: soon, trainerIds: ["TR-01"], status: "cancelled" },
      { id: "SES-2026-005", courseId: "LRN-02", start: soon, end: soon, trainerIds: [], status: "planned" },
    ],
  });
  assert.deepEqual(schedule.sessions("LRN-01").map((item) => item.id), ["SES-2026-001", "SES-2026-002", "SES-2026-004", "SES-2026-003"]);
  assert.deepEqual(schedule.upcoming("LRN-01").map((item) => item.id), ["SES-2026-002", "SES-2026-003"]);
  assert.equal(schedule.next("LRN-01").id, "SES-2026-002");
  assert.equal(schedule.next("LRN-42"), null);
  assert.deepEqual(schedule.trainerNames(schedule.next("LRN-01")), ["Ada Lovelace"]);
});

test("the schedule helper reports free seats and a readable date range", () => {
  const schedule = loadSchedule({
    trainers: [],
    sessions: [{ id: "SES-2026-001", courseId: "LRN-01", start: "2026-10-12T09:00", end: "2026-10-13T17:00" }],
  });
  const session = schedule.sessions("LRN-01")[0];
  assert.equal(schedule.formatRange(session, "de-DE"), "12.10.2026 – 13.10.2026");
  assert.equal(schedule.formatShort(session, "de-DE"), "12.10.");
  assert.equal(schedule.seatsFree(session), null);
  assert.equal(schedule.seatsFree({ seats: 20, seatsTaken: 18 }), 2);
  assert.equal(schedule.seatsFree({ seats: 20, seatsTaken: 25 }), 0);
  assert.equal(schedule.formatRange({ start: "2026-10-12", end: "2026-10-12" }, "de-DE"), "12.10.2026");
});
