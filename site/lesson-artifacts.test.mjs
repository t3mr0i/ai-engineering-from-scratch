import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const contentApi = require("../api/content/index.js");
const lessonHtml = readFileSync(new URL("./lesson.html", import.meta.url), "utf8");
const serveScript = readFileSync(new URL("../serve.sh", import.meta.url), "utf8");
const dockerfile = readFileSync(new URL("../openshift/Dockerfile", import.meta.url), "utf8");

test("lesson output references open an internal disclosure instead of a repository link", () => {
  assert.match(lessonHtml, /class="inline-artifact-trigger"/);
  assert.match(lessonHtml, /data-output-file=/);
  assert.match(lessonHtml, /fetch\(contentUrl\(artifactPath\)\)/);
  assert.doesNotMatch(lessonHtml, /git02\.lhind\.app/);
  assert.doesNotMatch(lessonHtml, /View on (?:GitHub|GitLab)/);
});

test("the lesson output panel is built from the internal artifact index", () => {
  assert.match(lessonHtml, /typeof ARTIFACTS !== 'undefined'/);
  assert.match(lessonHtml, /artifact-disclosure/);
  assert.doesNotMatch(lessonHtml, /file\.html_url/);
  assert.doesNotMatch(lessonHtml, /file\.download_url/);
});

test("the gated content endpoint allows safe top-level output files only", () => {
  const valid = contentApi.validatePath(
    "phases/14-agent-engineering/06-tool-use-and-function-calling/outputs/skill-tool-registry.md"
  );

  assert.ok(valid);
  assert.equal(valid.type, "text/plain; charset=utf-8");
  assert.equal(
    contentApi.validatePath("phases/14-agent-engineering/06-tool-use-and-function-calling/outputs/result.json")?.type,
    "text/plain; charset=utf-8"
  );
  assert.equal(
    contentApi.validatePath("phases/14-agent-engineering/06-tool-use-and-function-calling/outputs/nested/file.md"),
    null
  );
  assert.equal(
    contentApi.validatePath("phases/14-agent-engineering/06-tool-use-and-function-calling/outputs/../../docs/en.md"),
    null
  );
  assert.equal(
    contentApi.validatePath("phases/14-agent-engineering/06-tool-use-and-function-calling/outputs/tool.exe"),
    null
  );
});

test("local and container builds stage output files for internal previews", () => {
  assert.match(serveScript, /--include='outputs\/\*'/);
  assert.match(dockerfile, /const outputsSrc = path\.join\(lessonDir, 'outputs'\)/);
  assert.match(dockerfile, /fs\.copyFileSync\(outputSrc, outputDst\)/);
});
