/**
 * Reproducible PAN tutor evaluation harness.
 * Offline mode regression-tests the evaluator against labeled fixtures;
 * live mode calls the configured gateway and enforces product budgets.
 */

const fs = require("node:fs");
const path = require("node:path");
const { createLearnerAi, responseSafety } = require("./learner-ai");

const DEFAULT_FIXTURE = path.join(__dirname, "evals", "pan-golden.json");

function patterns(values) {
  return (values || []).map((value) => new RegExp(value, "i"));
}

function evaluateCase(fixture, response, diagnostics = {}) {
  const answer = String(response && response.answer || "");
  const sources = Array.isArray(response && response.sources) ? response.sources : [];
  const sourceIds = sources.map((source) => `${source.type}:${source.id}`);
  const expectedSources = fixture.expectedSourceIds || [];
  const required = patterns(fixture.requiredAnswerPatterns);
  const forbidden = patterns(fixture.forbiddenAnswerPatterns);
  const safetyIssues = responseSafety(answer);
  const checks = {
    answerPresent: answer.trim().length >= 8,
    citationsPresent: sources.length >= (fixture.minimumSources == null ? 2 : fixture.minimumSources),
    citationsExpected: !expectedSources.length || expectedSources.some((id) => sourceIds.includes(id)),
    pedagogy: required.every((pattern) => pattern.test(answer)),
    forbiddenAbsent: forbidden.every((pattern) => !pattern.test(answer)),
    safety: safetyIssues.length === 0,
    latency: !fixture.maxLatencyMs || (Number(diagnostics.latencyMs) || 0) <= fixture.maxLatencyMs,
    tokens: !fixture.maxTotalTokens || !diagnostics.usage || diagnostics.usage.totalTokens <= fixture.maxTotalTokens,
  };
  const passed = Object.values(checks).every(Boolean);
  return {
    id: fixture.id,
    category: fixture.category,
    passed,
    checks,
    safetyIssues,
    latencyMs: Number(diagnostics.latencyMs) || 0,
    totalTokens: diagnostics.usage && diagnostics.usage.totalTokens || 0,
  };
}

function loadFixtures(file = DEFAULT_FIXTURE) {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!parsed || !Array.isArray(parsed.cases) || !parsed.cases.length) throw new Error("PAN eval fixture must contain cases");
  return parsed;
}

function summarize(results) {
  const byCategory = {};
  results.forEach((result) => {
    if (!byCategory[result.category]) byCategory[result.category] = { passed: 0, total: 0 };
    byCategory[result.category].total += 1;
    if (result.passed) byCategory[result.category].passed += 1;
  });
  return {
    passed: results.filter((result) => result.passed).length,
    total: results.length,
    passRate: Math.round(results.filter((result) => result.passed).length / results.length * 100),
    byCategory,
  };
}

function runOffline(file = DEFAULT_FIXTURE) {
  const fixture = loadFixtures(file);
  const results = fixture.cases.map((item) => {
    const evaluation = evaluateCase(item, item.candidate, item.diagnostics || {});
    return { ...evaluation, expectedPass: item.expectedPass, classifiedCorrectly: evaluation.passed === item.expectedPass };
  });
  return { mode: "offline", version: fixture.version, results, summary: summarize(results.map((result) => ({ ...result, passed: result.classifiedCorrectly }))) };
}

async function runLive(file = DEFAULT_FIXTURE, options = {}) {
  const fixture = loadFixtures(file);
  const ai = createLearnerAi(options);
  const results = [];
  for (const item of fixture.cases.filter((row) => row.runLive !== false && row.input)) {
    try {
      const response = await ai.run(item.input);
      results.push(evaluateCase(item, response, response._eval || {}));
    } catch (error) {
      results.push({ id: item.id, category: item.category, passed: false, checks: { request: false }, error: error.code || error.message });
    }
  }
  return { mode: "live", version: fixture.version, results, summary: summarize(results) };
}

function printReport(report) {
  process.stdout.write(`PAN eval · ${report.mode} · ${report.summary.passed}/${report.summary.total} · ${report.summary.passRate}%\n`);
  report.results.forEach((result) => {
    process.stdout.write(`${result.passed || result.classifiedCorrectly ? "PASS" : "FAIL"} ${result.id} [${result.category}]\n`);
  });
}

if (require.main === module) {
  const live = process.argv.includes("--live");
  (live ? runLive() : Promise.resolve(runOffline())).then((report) => {
    printReport(report);
    const success = live ? report.summary.passed === report.summary.total : report.results.every((result) => result.classifiedCorrectly);
    process.exitCode = success ? 0 : 1;
  }).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { DEFAULT_FIXTURE, evaluateCase, loadFixtures, summarize, runOffline, runLive };
