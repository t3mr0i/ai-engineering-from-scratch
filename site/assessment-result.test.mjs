import assert from 'node:assert/strict';
import test from 'node:test';
import result from './assessment-result.js';

test('read-only result stars retain half-step averages from two questions', () => {
  assert.deepEqual(result.fills(3.5), [1, 1, 1, 0.5, 0]);
  assert.deepEqual(result.fills(1), [1, 0, 0, 0, 0]);
  assert.deepEqual(result.fills(5), [1, 1, 1, 1, 1]);
});

test('unrated areas do not look like a zero-star result', () => {
  assert.equal(result.fills(null), null);
});
