import test from 'node:test';
import assert from 'node:assert/strict';
import output from './lesson-output.js';
test('formats complete JSON without changing values', () => {
  const raw = '{"items":[1,{"ok":true}],"text":"<script>"}';
  assert.deepEqual(JSON.parse(output.formatOutput(raw)), JSON.parse(raw));
  assert.ok(output.formatOutput(raw).includes('\n  "items"'));
});
test('preserves tracebacks and mixed console output', () => {
  for (const text of ['naive: []\nPASS', 'Traceback:\n  line 1\nValueError: bad input', '{invalid}', '']) assert.equal(output.formatOutput(text), text);
});
