import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { create, key } = require('./readiness-setup-state.js');
function storage(value = null) {
  return { getItem: () => value, setItem: (_, next) => { value = next; } };
}
test('a reviewed role stays configured after reload; other roles need confirmation', () => {
  const disk = storage();
  const setup = create(disk);
  assert.equal(setup.isComplete('tc'), false);
  assert.equal(setup.complete('tc'), true);
  assert.equal(create(disk).isComplete('tc'), true);
  assert.equal(create(disk).isComplete('corp'), false);
});
test('reading a role never completes setup or writes to storage', () => {
  const disk = { getItem: () => null, setItem: () => { throw Error('unexpected write'); } };
  assert.equal(create(disk).isComplete('tc'), false);
});
test('malformed, foreign-version and incomplete records reopen setup', () => {
  for (const value of ['{', '{}', '{"version":2,"roleId":"tc","completedAt":1}', '{"version":1,"roleId":"tc"}']) {
    assert.equal(create(storage(value)).isComplete('tc'), false);
  }
});
test('denied storage still allows the current session to finish', () => {
  const setup = create({ getItem: () => { throw Error('denied'); }, setItem: () => { throw Error('denied'); } });
  assert.equal(setup.complete('corp'), false);
  assert.equal(setup.isComplete('corp'), true);
  assert.equal(setup.isComplete('tc'), false);
});
test('invalid role values cannot be persisted', () => {
  const disk = storage();
  const setup = create(disk);
  for (const role of ['', null, {}, 'invalid role', 'x'.repeat(41)]) assert.equal(setup.complete(role), false);
  assert.equal(disk.getItem(key), null);
});
