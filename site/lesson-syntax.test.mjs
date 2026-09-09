import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('./lesson.html', import.meta.url), 'utf8');
const start = html.indexOf('      function highlightSyntax(');
const end = html.indexOf('      function initCodeCopy()', start);
const highlight = vm.runInNewContext('(' + html.slice(start, end).trim() + ')');
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const paint = (s, lang = 'python') => highlight(escape(s), lang);
test('matching bracket pairs share depth colors across lines', () => {
  const result = paint('({\n"items": [1, (2)]\n})');
  assert.deepEqual([...result.matchAll(/syn-bracket-(\d)/g)].map(m => +m[1]), [0,1,2,3,3,2,1,0]);
});
test('strings and comments do not change bracket depth', () => {
  const result = paint('f("https://example/#([", 1) # [{');
  assert.equal((result.match(/syn-bracket-/g) || []).length, 2);
  assert.equal((result.match(/syn-comment/g) || []).length, 1);
  assert.match(result, /syn-string/);
});
test('escaped quotes remain inside a string', () => {
  const result = paint('x = "a\\"([b"\nf(1)');
  assert.equal((result.match(/syn-bracket-/g) || []).length, 2);
});
test('fill-in sentinels survive highlighting for input substitution', () => {
  assert.ok(paint('isinstance(value, \x00BLK0\x00)').includes('\x00BLK0\x00'));
});
test('highlighting preserves escaped source and does not introduce executable HTML', () => {
  const source = 'if x < 3: print("<script>alert(1)</script>")';
  const result = paint(source);
  assert.equal(result.replace(/<\/?span[^>]*>/g, ''), escape(source));
  assert.ok(!result.includes('<script>'));
});
test('JavaScript URLs remain strings and calls get function highlighting', () => {
  const result = paint('fetch("https://a.test/(1)"); // []', 'javascript');
  assert.match(result, /syn-function">fetch/);
  assert.equal((result.match(/syn-bracket-/g) || []).length, 2);
});
