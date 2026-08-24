import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { loadPyodide } from "pyodide";

const require = createRequire(import.meta.url);
const LessonPythonRuntime = require("./python-runtime.js");
const lessonHtml = readFileSync(new URL("./lesson.html", import.meta.url), "utf8");

test("lesson page loads the shared Python runtime before its inline code", () => {
  const runtimeScript = lessonHtml.indexOf('src="python-runtime.js');
  const inlineScript = lessonHtml.indexOf("function loadPyodide_()");

  assert.ok(runtimeScript >= 0, "lesson.html must load python-runtime.js");
  assert.ok(inlineScript > runtimeScript, "the runtime must load before lesson code uses it");
});

test("initialization makes lrn_llm available without running a setup cell", async () => {
  const pyodide = await loadPyodide();
  await LessonPythonRuntime.initialize(pyodide);

  assert.equal(pyodide.runPython("lrn_llm.DEFAULT_MODEL"), "azure/gpt-5.4-mini");
  assert.equal(pyodide.runPython("callable(lrn_llm.call)"), true);
  assert.equal(pyodide.runPython("callable(lrn_llm.text)"), true);
});

test("initialization is idempotent for one Python session", async () => {
  const calls = [];
  const fakePyodide = {
    runPythonAsync(code) {
      calls.push(code);
      return Promise.resolve();
    }
  };

  await LessonPythonRuntime.initialize(fakePyodide);
  await LessonPythonRuntime.initialize(fakePyodide);

  assert.equal(calls.length, 1);
});

test("captured Pyodide batches preserve terminal line breaks", () => {
  let stdout;
  let stderr;
  const fakePyodide = {
    setStdout(options) { stdout = options.batched; },
    setStderr(options) { stderr = options.batched; }
  };

  const output = LessonPythonRuntime.captureOutput(fakePyodide);
  stdout("first line");
  stdout("second line");
  stderr("warning");

  assert.equal(output.text(), "first line\nsecond line\nwarning");
});
