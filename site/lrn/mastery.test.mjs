import test from "node:test";
import assert from "node:assert/strict";
import mastery from "./mastery.js";

const DAY = 86_400_000;

test("BKT probability rises with repeated correct evidence and falls after an error", () => {
  let probability = 0.2;
  probability = mastery.updateProbability(probability, true, { guess: 0.2, slip: 0.1, learn: 0.12 });
  const afterOne = probability;
  probability = mastery.updateProbability(probability, true, { guess: 0.2, slip: 0.1, learn: 0.12 });
  assert.ok(probability > afterOne);
  assert.ok(mastery.updateProbability(probability, false, { guess: 0.2, slip: 0.1, learn: 0.12 }) < probability);
});

test("legacy single-answer records remain valid evidence", () => {
  const row = mastery.conceptMastery({ picked: 1, correct: true, t: 1000 });
  assert.equal(row.attempts, 1);
  assert.equal(row.successes, 1);
  assert.ok(row.percent > 20);
});

test("two successful attempts can cross the mastery threshold", () => {
  const row = mastery.conceptMastery({ attempts: [
    { picked: 1, correct: true, t: 1000 },
    { picked: 1, correct: true, t: 2000 },
  ] });
  assert.equal(row.mastered, true);
  assert.ok(row.probability >= mastery.MASTERY_THRESHOLD);
});

test("summary emits due review concepts without treating reading as mastery", () => {
  const summary = mastery.summarize({
    now: 10 * DAY,
    progressState: { lessons: {
      "phases/02-ml/01-basics": {
        readPct: 1,
        completedAt: 3,
        answers: { "check-q0": { picked: 0, correct: false, t: DAY } },
      },
      "phases/02-ml/02-reading-only": { readPct: 1, completedAt: 4, answers: {} },
    } },
    curriculumMap: { courseMaps: { "LRN-01": [{ lessons: [
      { path: "phases/02-ml/01-basics", title: "AI basics" },
      { path: "phases/02-ml/02-reading-only", title: "Reading only" },
    ] }] } },
  });
  assert.equal(summary.concepts.length, 1);
  assert.equal(summary.dueReviews.length, 1);
  assert.equal(summary.courses[0].evidenceCount, 1);
});

test("capability credentials require enough evidence and observed mastery", () => {
  const result = mastery.capabilitySummary({ courses: [
    { courseId: "LRN-01", probability: 0.9, evidenceCount: 8, appliedEvidenceCount: 1 },
  ], appliedEvidence: [
    { lessonPath: "phases/02-ml/01-basics", evidenceId: "self-check-1", courseIds: ["LRN-01"] },
  ] }, { 7: { Acquire: ["LRN-01"] } });
  assert.equal(result[0].eligibleForCredential, true);
  assert.equal(result[0].percent, 90);
  assert.equal(result[0].appliedEvidenceCount, 1);
});

test("quiz mastery without an applied self-check cannot unlock a credential", () => {
  const result = mastery.capabilitySummary({ courses: [
    { courseId: "LRN-01", probability: 0.95, evidenceCount: 12, appliedEvidenceCount: 0 },
  ] }, { 7: { Acquire: ["LRN-01"] } });
  assert.equal(result[0].eligibleForCredential, false);
});

test("shared-course mappings do not double-count one applied artifact", () => {
  const result = mastery.capabilitySummary({ courses: [
    { courseId: "LRN-01", probability: 0.9, evidenceCount: 4, appliedEvidenceCount: 1 },
    { courseId: "LRN-02", probability: 0.9, evidenceCount: 4, appliedEvidenceCount: 1 },
  ], appliedEvidence: [
    { lessonPath: "phases/02-ml/01-basics", evidenceId: "self-check-1", courseIds: ["LRN-01", "LRN-02"] },
  ] }, { 7: { Acquire: ["LRN-01", "LRN-02"] } });
  assert.equal(result[0].appliedEvidenceCount, 1);
  assert.equal(result[0].eligibleForCredential, true);
});
