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
  assert.ok(earnedHtml.includes("First Steps"));
});

test("byId returns null for an unknown id", () => {
  assert.equal(B.byId("does-not-exist"), null);
});

// ── Streak / daily badge tests ───────────────────────────────────────────
// day keys are "YYYY-MM-DD"; ctx.now is a ts so we can fix the clock.
function t(day, hour) { return new Date(day + 'T' + (hour || '12:00:00')).getTime(); }
function streakState(days, completionsByPath) {
  const lessons = {};
  let i = 0;
  for (const p of (completionsByPath || [])) { lessons[p] = lp({ completedAt: t(days[days.length - 1] || '2026-01-01'), visitedAt: 1 }); i++; }
  return { lessons: lessons, streak: { days: days.slice().sort(), current: 0, best: 0, lastDay: days.length ? days[days.length - 1] : '' } };
}

test("CATALOG includes the five streak/daily badges", () => {
  const ids = B.CATALOG.map((b) => b.id);
  for (const id of ['daily-sprint','warmed-up','steady-spirit','discipline','iron-routine']) {
    assert.ok(ids.includes(id), 'missing streak badge: ' + id);
  }
});

test("streakInfo reports current=best=0 on empty state", () => {
  const st = B.streakInfo({ lessons: {}, streak: { days: [], current: 0, best: 0, lastDay: '' } }, { now: t('2026-01-10') });
  assert.equal(st.current, 0);
  assert.equal(st.best, 0);
  assert.equal(st.activeToday, false);
});

test("three consecutive days yields best=3 and warmed-up is earned", () => {
  const state = streakState(['2026-01-01','2026-01-02','2026-01-03']);
  const res = B.evaluate(state, { now: t('2026-01-03'), phases: fakePhases() });
  assert.ok(res.earned.includes('warmed-up'));
  assert.ok(!res.earned.includes('steady-spirit'));
  const st = B.streakInfo(state, { now: t('2026-01-03') });
  assert.equal(st.best, 3);
});

test("a gap of one day breaks the current streak but keeps best", () => {
  const state = streakState(['2026-01-01','2026-01-02','2026-01-04']);
  const st = B.streakInfo(state, { now: t('2026-01-04') });
  // 01->02 (streak 2), gap to 04 (reset to 1) -> current=1, best=2
  assert.equal(st.best, 2);
  assert.equal(st.current, 1);
});

test("seven consecutive days earns steady-spirit but not discipline", () => {
  const days = ['2026-01-01','2026-01-02','2026-01-03','2026-01-04','2026-01-05','2026-01-06','2026-01-07'];
  const state = streakState(days);
  const res = B.evaluate(state, { now: t('2026-01-07'), phases: fakePhases() });
  assert.ok(res.earned.includes('warmed-up'));
  assert.ok(res.earned.includes('steady-spirit'));
  assert.ok(!res.earned.includes('discipline'));
});

test("daily-sprint earned when 3 completions share one calendar day", () => {
  const lessons = {
    'phases/01-math/01-linear': lp({ completedAt: t('2026-01-05','09:00:00'), visitedAt: 1 }),
    'phases/01-math/02-calc': lp({ completedAt: t('2026-01-05','10:00:00'), visitedAt: 1 }),
    'phases/02-nn/01-perceptron': lp({ completedAt: t('2026-01-05','11:00:00'), visitedAt: 1 })
  };
  const state = { lessons: lessons, streak: { days: ['2026-01-05'], current: 1, best: 1, lastDay: '2026-01-05' } };
  const res = B.evaluate(state, { now: t('2026-01-05'), phases: fakePhases() });
  assert.ok(res.earned.includes('daily-sprint'));
});

test("daily-sprint NOT earned when completions span two days", () => {
  const lessons = {
    'phases/01-math/01-linear': lp({ completedAt: t('2026-01-05','09:00:00'), visitedAt: 1 }),
    'phases/01-math/02-calc': lp({ completedAt: t('2026-01-05','10:00:00'), visitedAt: 1 }),
    'phases/02-nn/01-perceptron': lp({ completedAt: t('2026-01-06','09:00:00'), visitedAt: 1 })
  };
  const state = { lessons: lessons, streak: { days: ['2026-01-05','2026-01-06'], current: 2, best: 2, lastDay: '2026-01-06' } };
  const res = B.evaluate(state, { now: t('2026-01-06'), phases: fakePhases() });
  assert.ok(!res.earned.includes('daily-sprint'));
});

test("iron-routine requires activeToday AND best>=14", () => {
  const days = []; for (let i = 1; i <= 14; i++) days.push('2026-01-' + String(i).padStart(2,'0'));
  const active = streakState(days);
  const resActive = B.evaluate(active, { now: t('2026-01-14'), phases: fakePhases() });
  assert.ok(resActive.earned.includes('iron-routine'), 'should earn with today active + best 14');
  // same best but the clock has moved two days past the last active day -> not active today
  const resInactive = B.evaluate(active, { now: t('2026-01-16'), phases: fakePhases() });
  assert.ok(!resInactive.earned.includes('iron-routine'), 'should NOT earn when not active today');
});

test("evaluate with streak state but no streak field does not throw", () => {
  const state = { lessons: { 'phases/01-math/01-linear': lp({ visitedAt: 1 }) } };
  const res = B.evaluate(state, { now: t('2026-01-01'), phases: fakePhases() });
  assert.equal(res.details['warmed-up'].earned, false);
});

// ── LHG tone alignment ───────────────────────────────────────────────────
test("every tier maps to an LHG Badge tone", () => {
  const allowed = ['neutral','blue','success','warning','error','teal','purple'];
  for (const t of Object.keys(B.TIERS)) {
    assert.ok(allowed.includes(B.TIERS[t].tone), 'tier ' + t + ' has non-LHG tone ' + B.TIERS[t].tone);
    assert.ok(B.TIERS[t].ring && B.TIERS[t].glow && B.TIERS[t].label, 'tier ' + t + ' incomplete');
  }
});

test("renderBadgeHTML emits an LHG tone pill for the tier label", () => {
  const badge = B.byId('curriculum-master'); // platinum -> teal tone
  const html = B.renderBadgeHTML(badge, { earned: true, cur: 1, total: 1 });
  assert.ok(html.includes('aifs-pill aifs-pill--teal'), 'platinum tier should use the teal LHG pill');
  const goldBadge = B.byId('fifty-lessons'); // gold -> warning tone
  const goldHtml = B.renderBadgeHTML(goldBadge, { earned: true, cur: 50, total: 50 });
  assert.ok(goldHtml.includes('aifs-pill aifs-pill--warning'), 'gold tier should use the warning LHG pill');
});

test("renderStreakHTML shows current streak and best", () => {
  const html = B.renderStreakHTML({ current: 5, best: 9, activeToday: true });
  assert.ok(html.includes('aifs-streak--active'));
  assert.ok(html.includes('<strong>5</strong>'));
  assert.ok(html.includes('Best streak: 9'));
  assert.ok(html.includes('active today'));
});
