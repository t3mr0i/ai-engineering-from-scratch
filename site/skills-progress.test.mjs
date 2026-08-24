import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const skills = require("./skills-progress.js");

const capability = {
  id: 11,
  cluster: "Product and Process",
  title: "AI-Augmented Requirement Engineering",
  targets: { tc: "Deepen" },
  phases: [11],
  levels: {
    Basic: "Draft clear requirements.",
    Advanced: "Interrogate requirements.",
    Expert: "Manage the requirements ecosystem."
  }
};

const courses = [
  { id: "A", levels: ["Acquire"] },
  { id: "B", levels: ["Deepen"] },
  { id: "C", levels: ["Create"] }
];

const maps = {
  A: [{ lessons: [
    { path: "phases/11-llm-engineering/01-a" },
    { path: "phases/11-llm-engineering/02-b" },
    { path: "phases/07-transformers/01-not-relevant" }
  ] }],
  B: [{ lessons: [
    { path: "phases/11-llm-engineering/03-c" },
    { path: "phases/11-llm-engineering/04-d" }
  ] }],
  C: [{ lessons: [
    { path: "phases/11-llm-engineering/05-e" }
  ] }]
};

test("phaseId extracts the numeric curriculum phase", () => {
  assert.equal(skills.phaseId("phases/11-llm-engineering/03-c"), 11);
  assert.equal(skills.phaseId("site/llm-primer"), null);
});

test("mergeCapabilities preserves role targets and adds detailed mappings", () => {
  const merged = skills.mergeCapabilities(
    [{ id: 11, cluster: "Product and Process", title: "Requirements", targets: { tc: "Deepen" } }],
    [{ id: 11, phases: [11], description: "Description", levels: { Basic: "Acquire copy" } }]
  );
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].phases, [11]);
  assert.equal(merged[0].targets.tc, "Deepen");
  assert.equal(merged[0].levels.Basic, "Acquire copy");
});

test("capability progress uses partial reading and full completion", () => {
  const state = { lessons: {
    "phases/11-llm-engineering/01-a": { readPct: 0.5, completedAt: null },
    "phases/11-llm-engineering/02-b": { readPct: 0, completedAt: 123 },
    "phases/11-llm-engineering/03-c": { readPct: 0.25, completedAt: null }
  } };
  const result = skills.capabilityProgress(capability, "tc", courses, maps, state);

  assert.equal(result.stages[0].lessonCount, 2);
  assert.equal(result.stages[0].percent, 75);
  assert.equal(result.stages[1].percent, 13);
  assert.equal(result.stages[2].percent, 0);
  assert.equal(result.stages[2].inTarget, false);
  assert.equal(result.percent, 44, "overall progress averages the two role-target stages");
});

test("90 percent read counts as fully read, matching progress.js", () => {
  assert.equal(skills.lessonFraction({ lessons: { x: { readPct: 0.9 } } }, "x"), 1);
  assert.equal(skills.lessonFraction({ lessons: { x: { readPct: 0.89 } } }, "x"), 0.89);
});

test("unmapped capabilities stay visible but do not dilute the total", () => {
  const unmapped = { ...capability, id: 18, phases: [] };
  const mappedResult = skills.capabilityProgress(capability, "tc", courses, maps, {
    lessons: {
      "phases/11-llm-engineering/01-a": { completedAt: 1 },
      "phases/11-llm-engineering/02-b": { completedAt: 1 },
      "phases/11-llm-engineering/03-c": { completedAt: 1 },
      "phases/11-llm-engineering/04-d": { completedAt: 1 }
    }
  });
  const unmappedResult = skills.capabilityProgress(unmapped, "tc", courses, maps, { lessons: {} });

  assert.equal(mappedResult.percent, 100);
  assert.equal(unmappedResult.tracked, false);
  assert.equal(skills.overallProgress([mappedResult, unmappedResult]), 100);
});

test("progress sorting keeps tracked capabilities before curriculum gaps", () => {
  const items = [
    { id: 1, title: "A", tracked: true, percent: 20 },
    { id: 2, title: "B", tracked: false, percent: 0 },
    { id: 3, title: "C", tracked: true, percent: 80 }
  ];
  assert.deepEqual(skills.sortProgress(items, "progress").map((item) => item.id), [3, 1, 2]);
  assert.deepEqual(skills.sortProgress(items, "order").map((item) => item.id), [1, 2, 3]);
});
