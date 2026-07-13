// AIFS Achievement Badges — pure-logic tests.
//
// Run: node site/badges.test.mjs
//
// Loads site/badges.js in a node:vm sandbox with a fake window (no DOM,
// no localStorage) so the pure functions (evaluate, CATALOG,
// renderBadgeHTML) can be asserted without a browser. Mirrors the
// approach used in site/lrn/test.mjs.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadBadges() {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  const src = readFileSync("site/badges.js", "utf8");
  vm.runInContext(src, sandbox, { filename: "badges.js" });
  if (!sandbox.window.AIFSBadges) throw new Error("badges.js did not assign window.AIFSBadges");
  return sandbox.window.AIFSBadges;
}

const B = loadBadges();

// Fake catalog: two visible phases (2 lessons each -> 4 total) + one hidden phase.
function fakePhases() {
  return [
    { id: 1, name: "Math", hidden: false, lessons: [
      { url: "https://x/phases/01-math/01-linear/" },
      { url: "https://x/phases/01-math/02-calc/" }
    ]},
    { id: 2, name: "NN", hidden: false, lessons: [
      { url: "https://x/phases/02-nn/01-perceptron/" },
      { url: "https://x/phases/02-nn/02-mlp/" }
    ]},
    { id: 3, name: "Hidden", hidden: true, lessons: [
      { url: "https://x/phases/03-h/01-ghost/" }
    ]}
  ];
}
function lp(opts) { return Object.assign({ answers: {}, completedAt: null, visitedAt: 0, readPct: 0 }, opts || {}); }
function answered(correct) { return { picked: 0, correct: !!correct, t: 1 }; }

test("CATALOG has at least 12 badges with unique ids and required fields", () => {
  assert.ok(Array.isArray(B.CATALOG) && B.CATALOG.length >= 12, "need >=12 badges");
  const ids = B.CATALOG.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate badge ids");
  for (const b of B.CATALOG) {
    assert.ok(typeof b.id === "string" && b.title && b.desc && b.tier && b.icon, "badge missing fields: " + JSON.stringify(b));
    assert.ok(typeof b.check === "function", "badge missing check: " + b.id);
  }
});

test("empty state earns nothing", () => {
  const res = B.evaluate({ lessons: {} }, { phases: fakePhases() });
  assert.equal(res.earned.length, 0);
  for (const id of Object.keys(res.details)) assert.equal(res.details[id].earned, false, id + " should be locked");
});

test("visiting one lesson earns first-steps but not explorer", () => {
  const state = { lessons: { "phases/01-math/01-linear": lp({ visitedAt: 1 }) } };
  const res = B.evaluate(state, { phases: fakePhases() });
  assert.ok(res.earned.includes("first-steps"), "first-steps should be earned");
  assert.ok(!res.earned.includes("explorer"), "explorer should not be earned");
});

test("one completed lesson with a perfect 6-question quiz earns first-quiz, perfect-quiz, first-complete", () => {
  const answers = {};
  for (let i = 0; i < 6; i++) answers["q" + i] = answered(true);
  const state = { lessons: { "phases/01-math/01-linear": lp({ completedAt: 1, visitedAt: 1, answers }) } };
  const res = B.evaluate(state, { phases: fakePhases() });
  assert.ok(res.earned.includes("first-quiz"));
  assert.ok(res.earned.includes("perfect-quiz"));
  assert.ok(res.earned.includes("first-complete"));
});

test("perfect-quiz requires every answer to be correct", () => {
  const answers = {};
  for (let i = 0; i < 6; i++) answers["q" + i] = answered(i !== 0);
  const state = { lessons: { "phases/01-math/01-linear": lp({ completedAt: 1, answers }) } };
  const res = B.evaluate(state, { phases: fakePhases() });
  assert.ok(!res.earned.includes("perfect-quiz"));
});

test("5 completions earns consistent but not ten-milestone", () => {
  const lessons = {};
  const paths = [
    "phases/01-math/01-linear", "phases/01-math/02-calc",
    "phases/02-nn/01-perceptron", "phases/02-nn/02-mlp",
    "phases/01-math/03-extra"
  ];
  for (const p of paths) lessons[p] = lp({ completedAt: 1, visitedAt: 1 });
  const res = B.evaluate({ lessons }, { phases: fakePhases() });
  assert.ok(res.earned.includes("consistent"));
  assert.ok(!res.earned.includes("ten-milestone"));
});

test("completing every lesson of a phase earns phase-master", () => {
  const lessons = {
    "phases/01-math/01-linear": lp({ completedAt: 1, visitedAt: 1 }),
    "phases/01-math/02-calc": lp({ completedAt: 1, visitedAt: 1 })
  };
  const res = B.evaluate({ lessons }, { phases: fakePhases() });
  assert.ok(res.earned.includes("phase-master"));
});

test("half of the visible catalog earns halfway", () => {
  const lessons = {
    "phases/01-math/01-linear": lp({ completedAt: 1, visitedAt: 1 }),
    "phases/02-nn/01-perceptron": lp({ completedAt: 1, visitedAt: 1 })
  };
  const res = B.evaluate({ lessons }, { phases: fakePhases() });
  assert.ok(res.earned.includes("halfway"));
});

test("all visible lessons earns curriculum-master", () => {
  const lessons = {
    "phases/01-math/01-linear": lp({ completedAt: 1, visitedAt: 1 }),
    "phases/01-math/02-calc": lp({ completedAt: 1, visitedAt: 1 }),
    "phases/02-nn/01-perceptron": lp({ completedAt: 1, visitedAt: 1 }),
    "phases/02-nn/02-mlp": lp({ completedAt: 1, visitedAt: 1 })
  };
  const res = B.evaluate({ lessons }, { phases: fakePhases() });
  assert.ok(res.earned.includes("curriculum-master"));
});

test("hidden phases do not count toward the catalog total", () => {
  const lessons = { "phases/03-h/01-ghost": lp({ completedAt: 1, visitedAt: 1 }) };
  const res = B.evaluate({ lessons }, { phases: fakePhases() });
  assert.ok(!res.earned.includes("curriculum-master"));
  assert.ok(!res.earned.includes("halfway"));
});

test("evaluate details expose numeric cur/total for locked badges", () => {
  const res = B.evaluate({ lessons: {} }, { phases: fakePhases() });
  const d = res.details["explorer"];
  assert.ok(d && typeof d.cur === "number" && typeof d.total === "number");
  assert.equal(d.earned, false);
  assert.equal(d.total, 10);
});

test("renderBadgeHTML marks earned vs locked correctly", () => {
  const badge = B.byId("first-steps");
  const earnedHtml = B.renderBadgeHTML(badge, { earned: true, cur: 1, total: 1 });
  const lockedHtml = B.renderBadgeHTML(badge, { earned: false, cur: 0, total: 1 });
  assert.ok(earnedHtml.includes("aifs-badge--earned"));
  assert.ok(!earnedHtml.includes("ph-lock"));
  assert.ok(lockedHtml.includes("aifs-badge--locked"));
  assert.ok(lockedHtml.includes("ph-lock"));
  assert.ok(earnedHtml.includes("Erste Schritte"));
});

test("byId returns null for an unknown id", () => {
  assert.equal(B.byId("does-not-exist"), null);
});
