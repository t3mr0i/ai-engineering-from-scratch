import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PAN = require("./pan.js");

test("safeHref accepts same-origin learner destinations", () => {
  const location = { origin: "https://learning.test", href: "https://learning.test/index.html" };
  assert.equal(PAN.safeHref("lesson.html?path=phases%2F11-x%2F01-y", location), "/lesson.html?path=phases%2F11-x%2F01-y");
  assert.equal(PAN.safeHref("/lrn/course.html?id=LRN-01#modules", location), "/lrn/course.html?id=LRN-01#modules");
  assert.equal(PAN.safeHref("index.html#personalPlan", location), "/index.html#personalPlan");
});

test("safeHref blocks external and executable links", () => {
  const location = { origin: "https://learning.test", href: "https://learning.test/index.html" };
  assert.equal(PAN.safeHref("https://example.com/course", location), "");
  assert.equal(PAN.safeHref("javascript:alert(1)", location), "");
  assert.equal(PAN.safeHref("/admin.html", location), "");
});

test("courseProgressSnapshot distinguishes complete and in-progress courses", () => {
  const previousData = globalThis.LrnData;
  const previousMap = globalThis.LrnCurriculumMap;
  const previousProgress = globalThis.AIFSProgress;
  globalThis.LrnData = { courses: [{ id: "A" }, { id: "B" }, { id: "C" }] };
  globalThis.LrnCurriculumMap = { courseMaps: {
    A: [{ lessons: [{ path: "a/1" }, { path: "a/2" }] }],
    B: [{ lessons: [{ path: "b/1" }] }],
    C: []
  } };
  globalThis.AIFSProgress = { getState: () => ({ lessons: {
    "a/1": { completedAt: 1 }, "a/2": { completedAt: 2 }, "b/1": { visitedAt: 3, answers: {} }
  } }) };
  assert.deepEqual(PAN.courseProgressSnapshot(), { completedCourseIds: ["A"], inProgressCourseIds: ["B"] });
  globalThis.LrnData = previousData;
  globalThis.LrnCurriculumMap = previousMap;
  globalThis.AIFSProgress = previousProgress;
});
