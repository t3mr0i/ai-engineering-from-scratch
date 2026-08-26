// Progress export/import — pure-logic tests.
//
// Run: node --test site/progress-transfer.test.mjs
//
// Loads site/progress-transfer.js in a node:vm sandbox with a fake
// localStorage (no real browser needed), mirroring the approach used in
// site/progress.test.mjs.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadTransfer(seed) {
  const values = new Map();
  if (seed) for (const [k, v] of Object.entries(seed)) values.set(k, JSON.stringify(v));
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
  const sandbox = { window: {}, localStorage, btoa, atob, TextEncoder, TextDecoder, console };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync("site/progress-transfer.js", "utf8"), sandbox, { filename: "progress-transfer.js" });
  return {
    api: sandbox.window.AIFSProgressTransfer,
    raw(key) { return values.has(key) ? JSON.parse(values.get(key)) : null; },
    has(key) { return values.has(key); },
  };
}

const SAMPLE_PROGRESS = {
  lessons: { "phases/00/01": { answers: {}, completedAt: 123, visitedAt: 100, readPct: 1 } },
  snippets: [{ id: "snip_1", path: "phases/00/01", text: "Ünïcödé note", savedAt: 200 }],
  streak: { days: ["2026-08-25"], current: 1, best: 1, lastDay: "2026-08-25" },
  learningPath: { academyCourse: "AI-01", profileId: "tc", targetLevel: "Acquire", source: "choice", selectedAt: 1, updatedAt: 1 },
  updatedAt: 300,
};
const SAMPLE_COCKPIT = { profileId: "tc", externalLevel: 2, filter: "recommended", activeCourseId: null, academyAll: false };
const SAMPLE_BADGES = { seen: { "first-lesson": true }, updatedAt: 400 };

test("exportCode round-trips progress, cockpit, and badges exactly", () => {
  const { api } = loadTransfer({
    "aifs:progress:v1": SAMPLE_PROGRESS,
    "lhind:lrn-cockpit:v3": SAMPLE_COCKPIT,
    "aifs:badges:v1": SAMPLE_BADGES,
  });
  const code = api.exportCode();
  assert.match(code, /^AIFS1:/);

  const { api: importer, raw } = loadTransfer();
  importer.importCode(code);
  assert.deepEqual(raw("aifs:progress:v1"), SAMPLE_PROGRESS);
  assert.deepEqual(raw("lhind:lrn-cockpit:v3"), SAMPLE_COCKPIT);
  assert.deepEqual(raw("aifs:badges:v1"), SAMPLE_BADGES);
});

test("importCode derives the learning-path mirror key from progress.learningPath", () => {
  const { api } = loadTransfer({ "aifs:progress:v1": SAMPLE_PROGRESS });
  const code = api.exportCode();
  const { api: importer, raw } = loadTransfer();
  importer.importCode(code);
  assert.deepEqual(raw("aifs:learning-path:v1"), SAMPLE_PROGRESS.learningPath);
});

test("importCode clears the learning-path mirror when there is no active path", () => {
  const noPath = { ...SAMPLE_PROGRESS, learningPath: null };
  const { api } = loadTransfer({ "aifs:progress:v1": noPath });
  const code = api.exportCode();
  const { api: importer, raw, has } = loadTransfer({ "aifs:learning-path:v1": SAMPLE_PROGRESS.learningPath });
  importer.importCode(code);
  assert.equal(has("aifs:learning-path:v1"), false);
  assert.equal(raw("aifs:progress:v1").learningPath, null);
});

test("exportCode never includes the anonymous telemetry id", () => {
  const { api } = loadTransfer({
    "aifs:progress:v1": SAMPLE_PROGRESS,
    "aifs:anon-id:v1": "should-not-leak",
  });
  const code = api.exportCode();
  const decoded = Buffer.from(code.slice("AIFS1:".length), "base64").toString("utf8");
  assert.doesNotMatch(decoded, /should-not-leak/);
});

test("importCode never touches the anonymous telemetry id on the importing device", () => {
  const { api } = loadTransfer({ "aifs:progress:v1": SAMPLE_PROGRESS });
  const code = api.exportCode();
  const { api: importer, raw } = loadTransfer({ "aifs:anon-id:v1": "device-own-id" });
  importer.importCode(code);
  assert.equal(raw("aifs:anon-id:v1"), "device-own-id");
});

test("importCode rejects a string missing the AIFS1: prefix", () => {
  const { api } = loadTransfer();
  assert.throws(() => api.importCode("not-a-real-code"), /Präfix/);
});

test("importCode rejects a prefixed but corrupt base64 payload", () => {
  const { api } = loadTransfer();
  assert.throws(() => api.importCode("AIFS1:not-valid-base64!!!"), /beschädigt/);
});

test("importCode rejects an unsupported schema version", () => {
  const { api } = loadTransfer();
  const badCode = "AIFS1:" + Buffer.from(JSON.stringify({ schemaVersion: 99 }), "utf8").toString("base64");
  assert.throws(() => api.importCode(badCode), /Version/);
});

test("importCode leaves existing storage untouched when parsing fails", () => {
  const { api, raw } = loadTransfer({ "aifs:progress:v1": SAMPLE_PROGRESS });
  assert.throws(() => api.importCode("garbage"));
  assert.deepEqual(raw("aifs:progress:v1"), SAMPLE_PROGRESS);
});
