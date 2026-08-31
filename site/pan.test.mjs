import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const PAN = require("./pan.js");
const panSource = readFileSync(new URL("./pan.js", import.meta.url), "utf8");

test("learner surfaces load the shared PAN assets", () => {
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

test("the cockpit wires the editable personal-plan engine", () => {
  const index = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const planBuilder = readFileSync(new URL("./lrn/plan-builder.js", import.meta.url), "utf8");
  assert.match(index, /id="personalPlan"[^>]+aria-labelledby="personalPlanTitle"/);
  assert.match(index, /src="lrn\/learning-plan\.js\?v=[^"]+"/);
  assert.match(index, /src="lrn\/plan-builder\.js\?v=[^"]+"/);
  assert.match(planBuilder, /addEventListener\("aifs:personal-plan-change"/);
});

test("the curriculum admin accepts a validated courses deep link", () => {
  const admin = readFileSync(new URL("./admin.js", import.meta.url), "utf8");
  assert.match(admin, /new URLSearchParams\(window\.location\.search\)\.get\("view"\)/);
  assert.match(admin, /allowedViews\.includes\(requestedView\)/);
});

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

test("PAN uses the deployed OpenAI-compatible gateway route", () => {
  assert.match(panSource, /GATEWAY_PATH = "\/api\/llm\/chat\/completions"/);
  assert.match(panSource, /fetch\(GATEWAY_PATH/);
  assert.doesNotMatch(panSource, /\/api\/lrn\/ai\/chat/);
  assert.match(panSource, /azure\/gpt-5\.6-luna/);
});

test("PAN sends an OpenAI-compatible, curriculum-grounded request", () => {
  const previousData = globalThis.LrnData;
  const previousMap = globalThis.LrnCurriculumMap;
  globalThis.LrnData = { courses: [{ id: "PRIMER-01", title: "LLM Primer", summary: "Tokens and context" }] };
  globalThis.LrnCurriculumMap = { courseMaps: {} };
  try {
    const request = PAN.gatewayRequest("What next?", "en", [], { plannedCourses: [] });
    assert.equal(request.model, "azure/gpt-5.6-luna");
    assert.equal(request.temperature, undefined);
    assert.equal(request.messages[0].role, "system");
    assert.match(request.messages[0].content, /Markdown/);
    assert.match(request.messages[0].content, /complete user messages in the first person/i);
    assert.match(request.messages[0].content, /add-course-to-plan/);
    assert.match(request.messages[1].content, /PRIMER-01/);
    assert.deepEqual(request.messages.at(-1), { role: "user", content: "What next?" });
  } finally {
    globalThis.LrnData = previousData;
    globalThis.LrnCurriculumMap = previousMap;
  }
});

test("assistant-perspective suggestions become user utterances", () => {
  assert.equal(
    PAN.followUpAsUserMessage("Do you want a path for testing, agents, or production controls?", "en"),
    "I want a path for testing, agents, or production controls."
  );
  assert.equal(
    PAN.followUpAsUserMessage("Should I suggest a course that matches your current in-progress items?", "en"),
    "Show me a course that matches my current in-progress items."
  );
  assert.equal(
    PAN.followUpAsUserMessage("Soll ich einen passenden Kurs vorschlagen?", "de"),
    "Bitte schlage einen passenden Kurs vor."
  );
  assert.equal(PAN.followUpAsUserMessage("What should I learn next?", "en"), "What should I learn next?");
});

test("Markdown is parsed into a constrained block model without interpreting HTML", () => {
  assert.deepEqual(PAN.parseMarkdownBlocks("## Next step\n\n- **Open** the course\n- Try `main.py`\n\n<script>alert(1)</script>"), [
    { type: "heading", level: 2, text: "Next step" },
    { type: "list", ordered: false, items: ["**Open** the course", "Try `main.py`"] },
    { type: "paragraph", text: "<script>alert(1)</script>" }
  ]);
  assert.doesNotMatch(panSource, /\.innerHTML\s*=/);
});

test("course references receive validated open and add-to-plan tools", () => {
  const previousData = globalThis.LrnData;
  const previousMap = globalThis.LrnCurriculumMap;
  globalThis.LrnData = { courses: [{ id: "PRIMER-01", title: "LLM Primer" }] };
  globalThis.LrnCurriculumMap = { courseMaps: {} };
  try {
    const result = PAN.normalizeGatewayResult({
      answer: "Start with **LLM Primer**.",
      sources: [{ type: "course", id: "PRIMER-01" }, { type: "course", id: "MADE-UP" }],
      actions: [
        { type: "open-course", target: "MADE-UP", label: "Open fake" },
        { type: "open-course-creator", label: "Create a course draft" }
      ]
    }, "en");
    assert.deepEqual(result.sources.map((source) => source.id), ["PRIMER-01"]);
    assert.deepEqual(result.actions.map((action) => [action.type, action.target || ""]), [
      ["open-course-creator", ""],
      ["open-course", "PRIMER-01"],
      ["add-course-to-plan", "PRIMER-01"]
    ]);
    assert.equal(result.actions[0].label, "Create a course draft");
    assert.equal(result.actions[1].label, "Open course: LLM Primer");
  } finally {
    globalThis.LrnData = previousData;
    globalThis.LrnCurriculumMap = previousMap;
  }
});

test("adding a course preserves the plan and never creates duplicates", () => {
  const plan = { schemaVersion: 1, cadence: { durationWeeks: 6, sessionsPerWeek: 2 }, capacity: { selectedCourses: 1 }, steps: [{ position: 1, courseId: "A", title: "A" }] };
  const course = { id: "B", title: "Course B" };
  const next = PAN.planWithCourse(plan, course, 1234);
  assert.deepEqual(next.steps.map((step) => step.courseId), ["A", "B"]);
  assert.equal(next.steps[1].position, 2);
  assert.equal(next.steps[1].targetWeek, 6);
  assert.equal(next.updatedAt, 1234);
  assert.equal(next.capacity.selectedCourses, 2);
  assert.equal(PAN.planWithCourse(next, course, 2000), null);
});

test("PAN normalizes a structured gateway completion", () => {
  const payload = {
    choices: [{
      message: {
        content: JSON.stringify({
          answer: "Start with the primer.",
          sources: [{ type: "course", id: "PRIMER-01" }],
          followups: ["Why this course?"],
          nextAction: { type: "open-course", target: "PRIMER-01", label: "Open primer" }
        })
      }
    }]
  };

  assert.deepEqual(PAN.responseObject(payload), {
    answer: "Start with the primer.",
    sources: [{ type: "course", id: "PRIMER-01" }],
    followups: ["Why this course?"],
    nextAction: { type: "open-course", target: "PRIMER-01", label: "Open primer" }
  });
});
