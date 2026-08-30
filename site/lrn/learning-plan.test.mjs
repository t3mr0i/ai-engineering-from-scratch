// Deterministic personal learning-plan engine tests.
//
// Run: node --test site/lrn/learning-plan.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const { buildPlan } = require("./learning-plan.js");

function course(id, sequence, title, overrides = {}) {
  return {
    id,
    sequence,
    title,
    roleIds: ["tc"],
    dimensions: [],
    interests: [],
    levels: ["Deepen"],
    summary: "",
    outcomes: [],
    modules: [title],
    ...overrides,
  };
}

function catalog(courses, capabilities = []) {
  return {
    roles: [{ id: "tc", label: "Technology Consulting" }, { id: "bsc", label: "Business Consulting" }],
    capabilities,
    courses,
  };
}

function planFor(courses, learner = {}, options = {}) {
  return buildPlan({
    catalog: catalog(courses, options.capabilities || []),
    learner,
    durationWeeks: options.durationWeeks || 8,
    sessionsPerWeek: options.sessionsPerWeek || 2,
  });
}

test("exports the same browser API through the UMD wrapper", () => {
  const sandbox = { window: {}, globalThis: {} };
  sandbox.globalThis = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(new URL("./learning-plan.js", import.meta.url), "utf8"), sandbox);
  assert.equal(typeof sandbox.window.LrnLearningPlan.buildPlan, "function");
  assert.equal(sandbox.window.LrnLearningPlan.SCHEMA_VERSION, 1);
});

test("returns a versioned plan with bounded, evenly ordered target weeks", () => {
  const courses = Array.from({ length: 7 }, (_, index) => course(`C-${index + 1}`, index + 1, `Course ${index + 1}`));
  const plan = planFor(courses, { roleId: "tc", currentLevel: "Deepen" }, { durationWeeks: 8, sessionsPerWeek: 2 });

  assert.equal(plan.schemaVersion, 1);
  assert.equal(plan.algorithmVersion, "deterministic-priority-v1");
  assert.equal(plan.capacity.availableSessionSlots, 16);
  assert.equal(plan.capacity.focusCourseSlots, 4);
  assert.equal(plan.steps.length, 4);
  assert.deepEqual(plan.steps.map((step) => step.targetWeek), [1, 3, 5, 7]);
  assert.ok(plan.steps.every((step) => step.sources[0].type === "catalog_course"));
});

test("excludes completed courses and puts an in-progress course first", () => {
  const courses = [
    course("DONE", 1, "Completed foundation"),
    course("NEW", 2, "New work"),
    course("ACTIVE", 3, "Active work"),
  ];
  const plan = planFor(courses, {
    roleId: "tc",
    progress: { completed: ["DONE"], inProgress: ["ACTIVE"] },
  });

  assert.ok(!plan.steps.some((step) => step.courseId === "DONE"));
  assert.equal(plan.steps[0].courseId, "ACTIVE");
  assert.equal(plan.steps[0].status, "in_progress");
  assert.deepEqual(plan.evidence.excludedCompletedCourseIds, ["DONE"]);
  assert.ok(plan.steps[0].sources.some((source) => source.type === "learner_progress"));
});

test("goal terms materially change ranking and remain explainable", () => {
  const courses = [
    course("AGENT", 1, "Agentic Software Development", { summary: "Build tool-using agents." }),
    course("GOV", 2, "Responsible Governance", { summary: "Privacy controls, GDPR, and model governance." }),
  ];
  const baseline = planFor(courses, { roleId: "tc" });
  const goalPlan = planFor(courses, { roleId: "tc", goal: "Improve privacy governance" });

  assert.equal(baseline.steps[0].courseId, "AGENT");
  assert.equal(goalPlan.steps[0].courseId, "GOV");
  const goalSignal = goalPlan.steps[0].signals.find((signal) => signal.type === "goal_match");
  assert.deepEqual(goalSignal.terms, ["governance", "privacy"]);
  assert.ok(goalPlan.steps[0].sources.some((source) => source.type === "learner_goal"));
});

test("a role-specific assessment gap raises a relevant course", () => {
  const capabilities = [{
    id: 6,
    cluster: "Engineering",
    title: "Agentic Software Development",
    targets: { tc: "Create", all: "n. a." },
  }];
  const courses = [
    course("GENERAL", 1, "General overview", { interests: ["foundation"] }),
    course("AGENT", 2, "Agentic Software Development", { interests: ["engineering"] }),
  ];
  const baseline = planFor(courses, { roleId: "tc" }, { capabilities });
  const assessed = planFor(courses, {
    roleId: "tc",
    assessment: { ratings: { 6: "Basic" } },
  }, { capabilities });

  assert.equal(baseline.steps[0].courseId, "GENERAL");
  assert.equal(assessed.steps[0].courseId, "AGENT");
  assert.equal(assessed.evidence.assessmentGaps[0].gap, 2);
  assert.ok(assessed.steps[0].signals.some((signal) => signal.type === "assessment_gap" && signal.capabilityId === 6));
  assert.ok(assessed.steps[0].sources.some((source) => source.type === "assessment" && source.capabilityId === 6));
});

test("filters role-ineligible courses before goal ranking", () => {
  const courses = [
    course("BSC-ONLY", 1, "Perfect privacy goal", { roleIds: ["bsc"], summary: "privacy governance privacy" }),
    course("TC", 2, "Technology foundations", { roleIds: ["tc"] }),
    course("ALL", 3, "Shared foundations", { roleIds: ["all"] }),
  ];
  const plan = planFor(courses, { roleId: "tc", goal: "privacy governance" });

  assert.deepEqual(plan.steps.map((step) => step.courseId), ["TC", "ALL"]);
  assert.deepEqual(plan.evidence.excludedRoleCourseIds, ["BSC-ONLY"]);
});

test("uses course sequence and then id as deterministic score tie-breaks", () => {
  const courses = [
    course("Z", 2, "Same"),
    course("B", 1, "Same"),
    course("A", 1, "Same"),
  ];
  const first = planFor(courses, {});
  const second = planFor([courses[2], courses[0], courses[1]], {});

  assert.deepEqual(first.steps.map((step) => step.courseId), ["A", "B", "Z"]);
  assert.deepEqual(second.steps.map((step) => step.courseId), ["A", "B", "Z"]);
  assert.deepEqual(first.evidence.tieBreak, ["rankScore desc", "course sequence asc", "course id asc"]);
});

test("capacity is based on declared sessions and explicitly avoids duration claims", () => {
  const courses = Array.from({ length: 12 }, (_, index) => course(`C${index}`, index, `Course ${index}`));
  const plan = planFor(courses, {}, { durationWeeks: 52, sessionsPerWeek: 7 });

  assert.equal(plan.capacity.focusCourseSlots, 8);
  assert.equal(plan.steps.length, 8);
  assert.equal(plan.capacity.courseDurationDataAvailable, false);
  assert.match(plan.capacity.note, /durations are unavailable/i);
  assert.doesNotMatch(JSON.stringify(plan.capacity), /hours?/i);
});

test("accepts the repository manifest without schema adaptation", () => {
  const realCatalog = require("./manifests/catalog.json");
  const plan = buildPlan({
    catalog: realCatalog,
    learner: {
      roleId: "tc",
      currentLevel: 2,
      goal: "testing and quality assurance",
      assessmentRatings: { 7: "Basic" },
      progress: { completedCourseIds: ["PRIMER-01"], inProgressCourseIds: ["LRN-22"] },
    },
    durationWeeks: "8",
    sessionsPerWeek: "2",
  });

  assert.ok(plan.steps.length > 0);
  assert.ok(plan.steps.every((step) => step.courseId !== "PRIMER-01"));
  assert.ok(plan.steps.every((step) => realCatalog.courses.some((courseItem) => courseItem.id === step.courseId)));
  assert.equal(plan.learner.currentLevel, "Deepen");
});

test("rejects malformed inputs with actionable validation errors", () => {
  assert.throws(() => buildPlan({}), /catalog\.courses/);
  assert.throws(() => planFor([course("A", 1, "A"), course("A", 2, "B")]), /duplicate course id/);
  assert.throws(() => planFor([course("A", 1, "A")], { roleId: "unknown" }), /unknown learner\.roleId/);
  assert.throws(() => planFor([course("A", 1, "A")], { currentLevel: "Wizard" }), /learner\.currentLevel/);
  assert.throws(() => buildPlan({ catalog: catalog([course("A", 1, "A")]), learner: {}, durationWeeks: 0, sessionsPerWeek: 2 }), /durationWeeks/);
  assert.throws(() => buildPlan({ catalog: catalog([course("A", 1, "A")]), learner: {}, durationWeeks: 8, sessionsPerWeek: 8 }), /sessionsPerWeek/);
});

test("ignores stale progress ids but records a deterministic warning", () => {
  const plan = planFor([course("A", 1, "A")], {
    progress: { completed: ["OLD-B", "OLD-A"], inProgress: { "OLD-C": true } },
  });

  assert.equal(plan.steps[0].courseId, "A");
  assert.equal(plan.warnings[0], "Ignored unknown progress course ids: OLD-A, OLD-B, OLD-C");
});
