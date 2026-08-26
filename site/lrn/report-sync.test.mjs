// Anonymous progress-report sync tests.
//
// Run: node --test site/lrn/report-sync.test.mjs

import test from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadReportSync({ lrnSelection, progressState } = {}) {
  var storeMap = new Map();
  if (lrnSelection) storeMap.set("lhind:lrn-cockpit:v3", JSON.stringify(lrnSelection));
  const localStorage = {
    getItem(key) { return storeMap.has(key) ? storeMap.get(key) : null; },
    setItem(key, value) { storeMap.set(key, String(value)); },
  };
  const calls = [];
  const timers = [];
  const window = {
    document: {},
    localStorage,
    AIFSProgress: { getState: () => progressState || null, onChange() {} },
    LrnData: { courses: [{ id: "A" }] },
    LrnCurriculumMap: { courseMaps: { A: [{ lessons: [{ path: "a1" }] }] } },
    setTimeout(fn) { timers.push(fn); return timers.length; },
    clearTimeout() {},
  };
  const sandbox = {
    window,
    fetch: (url, options) => { calls.push({ url, options }); return Promise.resolve({ ok: true }); },
    crypto: { randomUUID: () => "generated-anon-id" },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync("site/lrn/report-sync.js", "utf8"), sandbox, { filename: "report-sync.js" });
  return { api: sandbox.window.LrnReportSync, calls, fireTimers: () => timers.forEach((fn) => fn()) };
}

test("computeCompletedCourseIds only counts courses whose every lesson is completed", () => {
  const { api } = loadReportSync();
  const courses = [{ id: "A" }, { id: "B" }];
  const courseMaps = {
    A: [{ lessons: [{ path: "a1" }, { path: "a2" }] }],
    B: [{ lessons: [{ path: "b1" }] }],
  };
  const progressState = { lessons: { a1: { completedAt: 1 }, a2: { completedAt: 2 }, b1: {} } };
  assert.deepEqual(api.computeCompletedCourseIds(courses, courseMaps, progressState), ["A"]);
});

test("readLrnSelection returns null without a stored selection", () => {
  const { api } = loadReportSync();
  assert.equal(api.readLrnSelection({ getItem: () => null }), null);
});

test("readLrnSelection returns profile and level from the lrn cockpit store", () => {
  const { api } = loadReportSync();
  const storage = { getItem: () => JSON.stringify({ profileId: "tc", externalLevel: 2 }) };
  assert.deepEqual(api.readLrnSelection(storage), { profileId: "tc", externalLevel: 2 });
});

test("getOrCreateAnonId generates once and reuses the stored id", () => {
  const { api } = loadReportSync();
  const values = new Map();
  const storage = { getItem: (k) => (values.has(k) ? values.get(k) : null), setItem: (k, v) => values.set(k, v) };
  const first = api.getOrCreateAnonId(storage, () => "generated-1");
  const second = api.getOrCreateAnonId(storage, () => "generated-2");
  assert.equal(first, "generated-1");
  assert.equal(second, "generated-1");
});

test("buildPayload shapes the request body", () => {
  const { api } = loadReportSync();
  assert.deepEqual(
    api.buildPayload("anon-1", { profileId: "tc", externalLevel: 2 }, ["LRN-01"]),
    { anonId: "anon-1", profileId: "tc", externalLevel: 2, completedCourses: ["LRN-01"] },
  );
});

test("sync sends nothing when the learner never opened the LRN cockpit", () => {
  const { api, calls, fireTimers } = loadReportSync();
  api.sync();
  fireTimers();
  assert.equal(calls.length, 0);
});

test("sync posts the current selection and completed courses after the debounce", () => {
  const { api, calls, fireTimers } = loadReportSync({
    lrnSelection: { profileId: "tc", externalLevel: 2 },
    progressState: { lessons: { a1: { completedAt: 1 } } },
  });
  api.sync();
  fireTimers();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/lrn/report");
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.anonId, "generated-anon-id");
  assert.equal(body.profileId, "tc");
  assert.deepEqual(body.completedCourses, ["A"]);
});
