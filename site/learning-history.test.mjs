import assert from 'node:assert/strict';
import test from 'node:test';
import history from './lrn/learning-history.js';
const maps = { A: [{ lessons: [{ path: 'one', title: 'One' }, { path: 'two' }, { path: 'one' }] }], B: [{ lessons: [{ path: 'one' }] }], C: [] };
const build = (lessons, extra = {}) => history.build({ courseMaps: maps, state: { lessons }, ...extra });
test('deduplicates curriculum paths and distinguishes partial from complete courses', () => {
  const model = build({ one: { completedAt: 1 } });
  assert.equal(model.started[0].totalLessons, 2);
  assert.equal(model.started[0].percent, 50);
  assert.equal(model.completed[0].id, 'B');
  assert.equal(model.completedLessons, 1);
});
test('a visit starts a course without inventing progress or completion', () => {
  const model = build({ one: { visitedAt: 1 } });
  assert.equal(model.started.length, 2);
  assert.equal(model.started[0].percent, 0);
  assert.equal(model.completed.length, 0);
});
test('uses the existing reading fraction without treating 100% read as completion', () => {
  const model = build({ one: { readPct: 1 }, two: { readPct: 1 } }, { readFraction: () => 1 });
  assert.equal(model.started[0].percent, 100);
  assert.equal(model.completed.length, 0);
});
test('only passed applied checks become evidence and shared courses do not duplicate it', () => {
  const model = build({ one: { appliedEvidence: { pass: { passed: true, t: 4 }, fail: { passed: false, t: 5 } }, answers: { quiz: { correct: true } } } });
  assert.equal(model.evidence.length, 1);
  assert.equal(model.evidence[0].id, 'pass');
});
test('empty activity and unmapped courses do not create history', () => {
  assert.deepEqual(build({}).started, []);
  assert.deepEqual(build({}).completed, []);
});
test('retains passed checks from lessons outside current course mappings', () => {
  assert.equal(build({ legacy: { appliedEvidence: { check: { passed: true } } } }).evidence.length, 1);
});
