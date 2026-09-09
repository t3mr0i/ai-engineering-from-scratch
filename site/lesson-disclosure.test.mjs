import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('./lesson.html', import.meta.url), 'utf8');
const start = html.indexOf('      function wrapCollapsible(');
const end = html.indexOf('      function renderCodeBlock(', start);
const wrap = vm.runInNewContext('(' + html.slice(start, end).trim() + ')', {escapeHtml: s => s});
test('Python and ordinary lesson blocks start expanded', () => {
  for (const lang of ['python', 'typescript', 'rust', 'text', '']) assert.match(wrap('<pre>example</pre>', lang, 4), /class="code-collapse" open/);
});
test('JSON payloads remain collapsed', () => {
  for (const lang of ['json', 'JSON', 'jsonc', 'jsonl']) assert.doesNotMatch(wrap('<pre>{}</pre>', lang, 4), / open/);
});
