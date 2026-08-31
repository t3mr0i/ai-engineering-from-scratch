// Local progress and learning-path persistence tests.
//
// Run: node --test site/progress.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadProgress(seed) {
  const values = new Map();
  let writes = 0;
  if (seed) values.set("aifs:progress:v1", JSON.stringify(seed));
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { writes += 1; values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
  const window = { addEventListener() {} };
  const sandbox = { window, localStorage, navigator: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync("site/progress.js", "utf8"), sandbox, { filename: "progress.js" });
  return {
    api: sandbox.window.AIFSProgress,
    stored() { return JSON.parse(values.get("aifs:progress:v1") || "null"); },
    storedPath() { return JSON.parse(values.get("aifs:learning-path:v1") || "null"); },
    writes() { return writes; },
  };
}

test("new progress state starts without a selected learning path", () => {
  const { api } = loadProgress();
  assert.equal(api.getLearningPath(), null);
});

test("selected Academy path persists with role, level, and source context", () => {
  const { api, stored, storedPath } = loadProgress();
  const saved = api.saveLearningPath({
    academyCourse: "AI-01",
    profileId: "tc",
    targetLevel: "Deepen",
    source: "choice",
  });

  assert.equal(saved.academyCourse, "AI-01");
  assert.equal(saved.profileId, "tc");
  assert.equal(saved.targetLevel, "Deepen");
  assert.equal(saved.source, "choice");
  assert.ok(saved.selectedAt > 0);
  assert.equal(JSON.stringify(stored().learningPath), JSON.stringify(saved));
  assert.equal(JSON.stringify(storedPath()), JSON.stringify(saved));
});

test("saving the identical path context does not create a redundant write", () => {
  const fixture = loadProgress();
  const choice = { academyCourse: "AI-03", profileId: "tc", targetLevel: "Acquire", source: "recommendation" };
  fixture.api.saveLearningPath(choice);
  const writesAfterFirstSave = fixture.writes();
  fixture.api.saveLearningPath(choice);
  assert.equal(fixture.writes(), writesAfterFirstSave);
});

test("choosing another path replaces only the active path selection", () => {
  const fixture = loadProgress();
  fixture.api.recordVisit("phases/00-setup/01-start");
  fixture.api.saveLearningPath({ academyCourse: "AI-01", profileId: "tc", targetLevel: "Acquire", source: "choice" });
  fixture.api.saveLearningPath({ academyCourse: "AI-09", profileId: "corp", targetLevel: "Acquire", source: "choice" });

  assert.equal(fixture.api.getLearningPath().academyCourse, "AI-09");
  assert.ok(fixture.stored().lessons["phases/00-setup/01-start"], "lesson progress must remain intact");
});

test("legacy and malformed states migrate to a safe empty path", () => {
  const { api } = loadProgress({ lessons: {}, learningPath: { academyCourse: "" }, updatedAt: 1 });
  assert.equal(api.getLearningPath(), null);
});

test("a learner can clear the saved path without clearing course progress", () => {
  const fixture = loadProgress();
  fixture.api.recordVisit("phases/00-setup/01-start");
  fixture.api.saveLearningPath({ academyCourse: "AI-06", profileId: "bsc", targetLevel: "Acquire", source: "choice" });
  fixture.api.clearLearningPath();

  assert.equal(fixture.api.getLearningPath(), null);
  assert.ok(fixture.stored().lessons["phases/00-setup/01-start"]);
});

test("quiz answers retain a bounded attempt history for mastery updates", () => {
  const fixture = loadProgress();
  fixture.api.recordAnswer("phases/00-setup/01-start", "check-q0", 1, false);
  fixture.api.recordAnswer("phases/00-setup/01-start", "check-q0", 2, true);
  const answer = fixture.stored().lessons["phases/00-setup/01-start"].answers["check-q0"];
  assert.equal(answer.correct, true);
  assert.equal(answer.attempts.length, 2);
  assert.deepEqual(answer.attempts.map((row) => row.correct), [false, true]);
});

test("only passed runnable self-checks become applied evidence", () => {
  const fixture = loadProgress();
  fixture.api.recordAppliedEvidence("phases/00-setup/01-start", "fillin-abc", false);
  assert.equal(fixture.stored(), null);
  fixture.api.recordAppliedEvidence("phases/00-setup/01-start", "fillin-abc", true);
  const evidence = fixture.stored().lessons["phases/00-setup/01-start"].appliedEvidence["fillin-abc"];
  assert.equal(evidence.passed, true);
  assert.equal(evidence.source, "runnable-self-check");
});
