import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const api = require('./assessment.js');
const catalog = JSON.parse(readFileSync(new URL('./lrn/manifests/catalog.json', import.meta.url)));
const answers = { q1: 5, q2: 5, q3: 4, q4: 4, q5: 2, q6: 2, q7: 2, q8: 2, q9: 2, q10: 3 };

function storage() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
}

test('the supplied ten questions are bilingual and paired across five areas', () => {
  assert.equal(catalog.questions.length, 10);
  assert.deepEqual(catalog.questions.map(q => q.id), Object.keys(answers));
  assert.ok(catalog.questions.every(q => q.text && q.textDe));
  assert.deepEqual(api.DIMENSIONS.map(d => d.questionIds.length), [2, 2, 2, 2, 2]);
});

test('native answers produce role-specific levels and scores', () => {
  const record = api.evaluate('tc', 'markets', answers, '2026-09-23T12:00:00.000Z');
  assert.equal(record.source, 'native');
  assert.equal(record.dimensions.Foundation.currentLevel, 'Create');
  assert.equal(record.dimensions['Engineering Literacy'].currentLevel, 'Deepen');
  assert.equal(record.dimensions['Engineering Literacy'].targetLevel, 'Create');
  assert.equal(record.dimensions['Leadership Strategy'].score, 2.5);
});

test('not relevant is excluded and two such answers leave a dimension unknown', () => {
  const record = api.evaluate('tc', 'markets', { ...answers, q1: 'na', q3: 'na', q4: 'na' });
  assert.equal(record.dimensions.Foundation.score, 5);
  assert.equal(record.dimensions['Engineering Literacy'].score, null);
  assert.equal(record.dimensions['Engineering Literacy'].currentLevel, null);
});

test('each of the six assessment roles has its own target vector', () => {
  assert.equal(api.PROFILES.length, 6);
  for (const profile of api.PROFILES) {
    const record = api.evaluate(profile.id, 'markets', answers);
    assert.deepEqual(Object.values(record.dimensions).map(row => row.targetLevel), profile.targets);
  }
});

test('the organigram divisions are fixed and saved with the result', () => {
  assert.deepEqual(api.DIVISIONS.map(d => d.label), [
    'Aviation Commerce', 'Delivery', 'Digitalization', 'Finance, Controlling & Legal',
    'Markets', 'People Management', 'Technology'
  ]);
  const record = api.evaluate('tc', 'markets', answers);
  assert.equal(record.divisionId, 'markets');
  assert.equal(record.division, 'Markets');
  assert.throws(() => api.evaluate('tc', 'unknown', answers), /valid division/);
});

test('incomplete and out-of-range answers cannot be submitted', () => {
  const incomplete = { ...answers }; delete incomplete.q10;
  assert.throws(() => api.evaluate('tc', 'markets', incomplete), /Answer all ten/);
  assert.throws(() => api.evaluate('tc', 'markets', { ...answers, q10: 6 }), /Answer all ten/);
  assert.throws(() => api.evaluate('unknown', 'markets', answers), /valid role/);
});

test('saved results omit individual answers, validate levels and remain removable', () => {
  const local = storage();
  const result = api.save(api.evaluate('tc', 'markets', answers), local);
  assert.equal(local.values.size, 1);
  assert.equal(local.getItem(api.STORE_KEY).includes('answers'), false);
  assert.equal(api.load(local).dimensions.Foundation.score, 5);
  const tampered = JSON.parse(local.getItem(api.STORE_KEY));
  tampered.dimensions.Foundation.currentLevel = 'Acquire';
  local.setItem(api.STORE_KEY, JSON.stringify(tampered));
  assert.equal(api.load(local), null);
  tampered.dimensions.Foundation.currentLevel = 'Create';
  tampered.division = 'Technology';
  local.setItem(api.STORE_KEY, JSON.stringify(tampered));
  assert.equal(api.load(local), null);
  local.setItem(api.STORE_KEY, JSON.stringify(result));
  api.clear(local);
  assert.equal(api.load(local), null);
});
