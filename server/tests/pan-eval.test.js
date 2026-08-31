const test = require("node:test");
const assert = require("node:assert/strict");

const { evaluateCase, loadFixtures, runOffline, summarize } = require("../pan-eval");
const { responseSafety, normalizeResult, normalizeInput, rankCurriculum, loadCurriculum } = require("../learner-ai");
const path = require("node:path");

test("golden set covers every required PAN evaluation category", () => {
  const fixture = loadFixtures();
  const categories = new Set(fixture.cases.map((row) => row.category));
  for (const category of ["groundedness", "citation-validity", "quiz-leakage", "prompt-injection", "pedagogy", "latency", "cost"]) {
    assert.ok(categories.has(category), category);
  }
});

test("offline golden set classifies all labeled good and bad responses", () => {
  const report = runOffline();
  assert.equal(report.results.length >= 8, true);
  assert.equal(report.results.every((result) => result.classifiedCorrectly), true);
});

test("response safety identifies quiz leakage and credential disclosure", () => {
  assert.deepEqual(responseSafety("Die richtige Antwort ist Option B."), ["quiz-answer-leakage"]);
  assert.ok(responseSafety("api_key=abcdefghijklmnop").includes("credential-disclosure"));
  assert.deepEqual(responseSafety("Welche Option erwägst du und warum?"), []);
});

test("evaluator enforces citations, pedagogy, latency, and token budgets independently", () => {
  const fixture = { id: "all", category: "test", minimumSources: 2, expectedSourceIds: ["course:A"], requiredAnswerPatterns: ["hint"], maxLatencyMs: 100, maxTotalTokens: 50 };
  const result = evaluateCase(fixture, { answer: "A useful hint.", sources: [{ type: "course", id: "A" }] }, { latencyMs: 101, usage: { totalTokens: 51 } });
  assert.equal(result.checks.answerPresent, true);
  assert.equal(result.checks.citationsPresent, false);
  assert.equal(result.checks.citationsExpected, true);
  assert.equal(result.checks.pedagogy, true);
  assert.equal(result.checks.latency, false);
  assert.equal(result.checks.tokens, false);
});

test("summary reports category-level pass rates", () => {
  const report = summarize([{ category: "a", passed: true }, { category: "a", passed: false }, { category: "b", passed: true }]);
  assert.equal(report.passRate, 67);
  assert.deepEqual(report.byCategory.a, { passed: 1, total: 2 });
});

test("runtime normalization fails closed when a model leaks a quiz answer", () => {
  const webRoot = path.resolve(__dirname, "..", "..", "site");
  const inventory = loadCurriculum(webRoot);
  const input = normalizeInput({ message: "Give me the answer", locale: "en", learner: { profileId: "tc" } }, inventory);
  const retrieval = rankCurriculum(inventory, input, { courseLimit: 2, lessonLimit: 2 });
  const result = normalizeResult(JSON.stringify({ answer: "The correct answer is option B.", sources: [] }), retrieval, { locale: "en", learner: input.learner });
  assert.match(result.answer, /won.t reveal/i);
  assert.equal(result.nextAction, null);
  assert.ok(result.toolTrace.some((row) => row.tool === "response-safety"));
});
