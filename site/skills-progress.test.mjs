import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const skills = require("./skills-progress.js");
const realEvidence = require("./skills-progress-evidence.js");

const capability = {
  id: 11,
  cluster: "Product and Process",
  title: "AI-Augmented Requirement Engineering",
  targets: { tc: "Deepen" }
};

const detail = {
  id: 11,
  description: "Turn business needs into testable requirements.",
  levels: {
    Basic: "Draft clear requirements.",
    Advanced: "Interrogate requirements.",
    Expert: "Manage the requirements ecosystem."
  }
};

const courses = [
  { id: "A", title: "Drafting" },
  { id: "B", title: "Analysis" },
  { id: "C", title: "Governance" },
  { id: "OTHER", title: "Unrelated" }
];

const maps = {
  A: [{ lessons: [{ path: "a1" }, { path: "a2" }] }],
  B: [{ lessons: [{ path: "b1" }, { path: "b2" }, { path: "b3" }, { path: "b4" }] }],
  C: [{ lessons: [{ path: "c1" }] }],
  OTHER: [{ lessons: [{ path: "other1" }] }]
};

function model(overrides = {}) {
  return skills.createModel({
    catalogCapabilities: [capability],
    detailedCapabilities: [detail],
    evidence: { 11: { Acquire: ["A"], Deepen: ["B"], Create: ["C"] } },
    courses,
    courseMaps: maps,
    progressState: { lessons: {} },
    profileId: "tc",
    ...overrides
  });
}

function loadRealData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(new URL("./lrn/data.js", import.meta.url), "utf8"), context);
  vm.runInContext(fs.readFileSync(new URL("./lrn/curriculum-map.js", import.meta.url), "utf8"), context);
  vm.runInContext(
    fs.readFileSync(new URL("./capabilities.js", import.meta.url), "utf8")
      .replace("const CAPABILITIES =", "globalThis.CAPABILITIES ="),
    context
  );
  return {
    data: context.window.LrnData,
    curriculum: context.window.LrnCurriculumMap,
    detailed: context.CAPABILITIES
  };
}

test("builds capability, level, and course evidence in one view model", () => {
  const result = model();
  const item = result.items[0];

  assert.equal(item.description, detail.description);
  assert.equal(item.target, "Deepen");
  assert.equal(item.stages[0].description, detail.levels.Basic);
  assert.deepEqual(item.stages[1].courses.map((course) => course.title), ["Analysis"]);
  assert.equal(item.targetCourseCount, 2);
  assert.equal(item.fullyMapped, true);
});

test("uses partial reading and completion to calculate course progress", () => {
  const result = model({
    progressState: { lessons: {
      a1: { readPct: 0.5 },
      a2: { completedAt: 1 },
      b1: { readPct: 0.25 }
    } }
  });
  const item = result.items[0];

  assert.equal(item.stages[0].percent, 75);
  assert.equal(item.stages[1].percent, 6);
  assert.equal(item.stages[2].percent, 0);
  assert.equal(item.percent, 41, "only Acquire and Deepen count towards the role target");
});

test("weights contributing courses equally instead of weighting by lesson count", () => {
  const result = model({
    evidence: { 11: { Acquire: ["A"], Deepen: ["B", "C"], Create: [] } },
    progressState: { lessons: {
      b1: { completedAt: 1 },
      b2: { completedAt: 1 },
      b3: { completedAt: 1 },
      b4: { completedAt: 1 }
    } }
  });

  assert.equal(result.items[0].stages[1].percent, 50);
});

test("missing target-level evidence is visible and counts as zero", () => {
  const result = model({
    evidence: { 11: { Acquire: ["A"] } },
    progressState: { lessons: { a1: { completedAt: 1 }, a2: { completedAt: 1 } } }
  });
  const item = result.items[0];

  assert.equal(item.percent, 50);
  assert.equal(item.fullyMapped, false);
  assert.equal(result.trackedCount, 0);
  assert.equal(result.unmappedCount, 1);
});

test("an unrelated completed lesson cannot move capability progress", () => {
  const result = model({
    progressState: { lessons: { other1: { completedAt: 1 } } }
  });

  assert.equal(result.items[0].percent, 0);
  assert.equal(result.totalPercent, 0);
});

test("90 percent read counts as fully read, matching progress.js", () => {
  const result = model({
    progressState: { lessons: {
      a1: { readPct: 0.9 },
      a2: { readPct: 0.89 }
    } }
  });

  assert.equal(result.items[0].stages[0].percent, 95);
});

test("the curated matrix covers every capability with real catalog courses", () => {
  const { data, curriculum } = loadRealData();
  const courseIds = new Set(data.courses.map((course) => course.id));

  for (const capabilityEntry of data.capabilities) {
    const stages = realEvidence[capabilityEntry.id];
    assert.ok(stages, `capability ${capabilityEntry.id} has evidence`);
    const seen = new Set();
    for (const stage of ["Acquire", "Deepen", "Create"]) {
      assert.ok(stages[stage]?.length, `capability ${capabilityEntry.id} has ${stage} evidence`);
      for (const courseId of stages[stage]) {
        assert.ok(courseIds.has(courseId), `${courseId} exists in the catalog`);
        assert.ok(curriculum.courseMaps[courseId]?.length, `${courseId} has mapped lessons`);
        assert.ok(!seen.has(courseId), `${courseId} proves only one level of capability ${capabilityEntry.id}`);
        seen.add(courseId);
      }
    }
  }
});

test("a real foundation lesson no longer fans out into unrelated capabilities", () => {
  const { data, curriculum, detailed } = loadRealData();
  const result = skills.createModel({
    catalogCapabilities: data.capabilities,
    detailedCapabilities: detailed,
    evidence: realEvidence,
    courses: data.courses,
    courseMaps: curriculum.courseMaps,
    progressState: { lessons: {
      "phases/11-llm-engineering/73-ai-fundamentals": { completedAt: 1 }
    } },
    profileId: "tc"
  });
  const moved = Array.from(result.items.filter((item) => item.percent > 0), (item) => item.id);

  assert.deepEqual(moved, [1]);
});
