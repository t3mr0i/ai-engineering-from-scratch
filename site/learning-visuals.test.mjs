import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import visuals from "./learning-visuals.js";

test("selectMilestones keeps first and last items", () => {
  const source = Array.from({ length: 12 }, (_, index) => index + 1);
  const result = visuals._test.selectMilestones(source, 6);
  assert.equal(result.length, 6);
  assert.equal(result[0], 1);
  assert.equal(result.at(-1), 12);
});

test("selectMilestones does not duplicate short routes", () => {
  assert.deepEqual(visuals._test.selectMilestones(["a", "b", "c"], 6), ["a", "b", "c"]);
});

test("lesson route keeps useful sections and removes supporting sections", () => {
  const heading = (id, textContent) => ({ id, textContent, closest: () => null });
  const result = visuals._test.lessonSections({
    querySelectorAll: () => [
      heading("problem", "The Problem"),
      heading("concept", "The Concept"),
      heading("build-it", "Build It"),
      heading("further-reading", "Further Reading")
    ]
  });
  assert.deepEqual(result.map((section) => section.id), ["problem", "concept", "build-it"]);
});

test("phaseStats aggregates totals and visible matches", () => {
  const all = [
    { phase: 1, phaseName: "Math" },
    { phase: 1, phaseName: "Math" },
    { phase: 2, phaseName: "Models" }
  ];
  const visible = [{ phase: 1, phaseName: "Math" }];
  assert.deepEqual(visuals._test.phaseStats(all, visible), [
    { id: 1, name: "Math", total: 2, visible: 1 },
    { id: 2, name: "Models", total: 1, visible: 0 }
  ]);
});

test("phaseStats sorts numeric phase ids", () => {
  const result = visuals._test.phaseStats([{ phase: 10 }, { phase: 2 }], []);
  assert.deepEqual(result.map((entry) => entry.id), [2, 10]);
});

test("capabilityClusters counts met targets without averaging ordinal levels", () => {
  const result = visuals._test.capabilityClusters([
    { cluster: "Engineering", current: 1, target: 3 },
    { cluster: "Engineering", current: 2, target: 2 },
    { cluster: "Delivery", current: 3, target: 3 }
  ]);
  assert.deepEqual(result, [
    { name: "Engineering", met: 1, percent: 50, count: 2 },
    { name: "Delivery", met: 1, percent: 100, count: 1 }
  ]);
});

test("all learning surfaces with visualizations load the shared visualization layer", async () => {
  const pages = ["lesson.html", "catalog.html", "lrn/course.html"];
  for (const page of pages) {
    const html = await readFile(new URL(page, import.meta.url), "utf8");
    assert.match(html, /learning-visuals\.css/);
    assert.match(html, /learning-visuals\.js/);
  }
});

test("assessment page stays import-only and links the official SharePoint assessment", async () => {
  const html = await readFile(new URL("assessment.html", import.meta.url), "utf8");
  assert.match(html, /lufthansagroup\.sharepoint\.com\/sites\/LHIND_APP_AISelfAssessment/);
  assert.match(html, /data-assessment-import/);
  assert.match(html, /assessmentJourney/);
  assert.doesNotMatch(html, /capForm/);
  assert.doesNotMatch(html, /step-rate/);
  assert.doesNotMatch(html, /learning-visuals\.js/);
});

test("visualization integrations preserve state, focus, and reduced motion", async () => {
  const [visualSource, visualStyles, catalog, lesson] = await Promise.all([
    readFile(new URL("learning-visuals.js", import.meta.url), "utf8"),
    readFile(new URL("learning-visuals.css", import.meta.url), "utf8"),
    readFile(new URL("catalog.html", import.meta.url), "utf8"),
    readFile(new URL("lesson.html", import.meta.url), "utf8")
  ]);
  assert.match(visualSource, /setAttribute\("aria-current", "step"\)/);
  assert.doesNotMatch(visualSource, /viz_lesson_desc|learning-route__purpose/,
    "lesson navigation should not explain an interaction that is already self-evident");
  assert.doesNotMatch(visualStyles, /\.learning-route::before/,
    "lesson index should not fall back to a decorative timeline connector");
  assert.match(visualSource, /dataset\.phaseId/);
  assert.match(catalog, /phaseButtons\[buttonIndex\]\.focus\(\)/);
  assert.match(lesson, /<dl class="lesson-meta">/);
  assert.match(lesson, /<dt class="lesson-meta-label">/);
  assert.match(lesson, /prefers-reduced-motion: reduce/);
});
