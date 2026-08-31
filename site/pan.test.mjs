import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const Navigator = require("./pan.js");

test("learner surfaces load the shared Learning Navigator assets", () => {
  const index = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const lesson = readFileSync(new URL("./lesson.html", import.meta.url), "utf8");
  const course = readFileSync(new URL("./lrn/course.html", import.meta.url), "utf8");
  assert.match(index, /href="pan\.css\?v=[^"]+"/);
  assert.match(index, /src="pan\.js\?v=[^"]+"/);
  assert.match(lesson, /href="pan\.css\?v=[^"]+"/);
  assert.match(lesson, /src="pan\.js\?v=[^"]+"/);
  assert.match(course, /href="\.\.\/pan\.css\?v=[^"]+"/);
  assert.match(course, /src="\.\.\/pan\.js\?v=[^"]+"/);
});

test("Learning Navigator has consistent visible and accessible naming", () => {
  const source = readFileSync(new URL("./pan.js", import.meta.url), "utf8");
  assert.match(source, /open: "Open Learning Navigator"/);
  assert.match(source, /open: "Learning Navigator öffnen"/);
  assert.match(source, /title: "Learning Navigator"/);
  assert.match(source, /pan-nav-trigger__label", "Navigator"/);
  assert.doesNotMatch(source, /Open PAN|PAN-Lernhilfe|title: "PAN"|>PAN</);
});

test("the personal-plan page wires the editable planning engine", () => {
  const page = readFileSync(new URL("./personal-plan.html", import.meta.url), "utf8");
  assert.match(page, /id="personalPlan"[^>]+aria-label="Personal learning plan"/);
  assert.match(page, /src="lrn\/learning-plan\.js\?v=[^"]+"/);
  assert.match(page, /src="lrn\/plan-builder\.js\?v=[^"]+"/);
});

test("the team-learning page wires assignments and evidence", () => {
  const page = readFileSync(new URL("./team-learning.html", import.meta.url), "utf8");
  assert.match(page, /id="teamLearning"[^>]+aria-label="Team learning and skill evidence"/);
  assert.match(page, /src="lrn\/report-sync\.js\?v=[^"]+"/);
  assert.match(page, /src="lrn\/team-learning\.js\?v=[^"]+"/);
});

test("safeHref accepts same-origin learner destinations", () => {
  const location = { origin: "https://learning.test", href: "https://learning.test/index.html" };
  assert.equal(Navigator.safeHref("lesson.html?path=phases%2F11-x%2F01-y", location), "/lesson.html?path=phases%2F11-x%2F01-y");
  assert.equal(Navigator.safeHref("/lrn/course.html?id=LRN-01#modules", location), "/lrn/course.html?id=LRN-01#modules");
  assert.equal(Navigator.safeHref("personal-plan.html", location), "/personal-plan.html");
});

test("safeHref blocks external and executable links", () => {
  const location = { origin: "https://learning.test", href: "https://learning.test/index.html" };
  assert.equal(Navigator.safeHref("https://example.com/course", location), "");
  assert.equal(Navigator.safeHref("javascript:alert(1)", location), "");
  assert.equal(Navigator.safeHref("/admin.html", location), "");
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
  assert.deepEqual(Navigator.courseProgressSnapshot(), { completedCourseIds: ["A"], inProgressCourseIds: ["B"] });
  globalThis.LrnData = previousData;
  globalThis.LrnCurriculumMap = previousMap;
  globalThis.AIFSProgress = previousProgress;
});
