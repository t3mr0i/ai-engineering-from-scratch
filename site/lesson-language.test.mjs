import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const LessonLanguage = require("./lesson-language.js");
const lessonHtml = readFileSync(new URL("./lesson.html", import.meta.url), "utf8");

function response(text, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(text)
  };
}

test("English is the canonical and only fallback for an English selection", () => {
  assert.deepEqual(LessonLanguage.candidates("en"), ["en"]);
  assert.deepEqual(LessonLanguage.candidates("fr"), ["en"]);
  assert.deepEqual(LessonLanguage.candidates(), ["en"]);
});

test("German selection prefers German and then falls back to English", () => {
  assert.deepEqual(LessonLanguage.candidates("de"), ["de", "en"]);
  assert.deepEqual(
    LessonLanguage.contentPaths("phases/02-ml/01-intro/", "de"),
    [
      { lang: "de", path: "phases/02-ml/01-intro/docs/de.md" },
      { lang: "en", path: "phases/02-ml/01-intro/docs/en.md" }
    ]
  );
});

test("German content is used when it is available", async () => {
  const requests = [];
  const loaded = await LessonLanguage.load("phases/02-ml/01-intro", "de", (path) => {
    requests.push(path);
    return Promise.resolve(response("# Was ist ML?"));
  });

  assert.deepEqual(requests, ["phases/02-ml/01-intro/docs/de.md"]);
  assert.deepEqual(loaded, {
    lang: "de",
    path: "phases/02-ml/01-intro/docs/de.md",
    text: "# Was ist ML?"
  });
});

test("missing German content falls back to English", async () => {
  const requests = [];
  const loaded = await LessonLanguage.load("phases/02-ml/01-intro", "de", (path) => {
    requests.push(path);
    return Promise.resolve(path.endsWith("/de.md")
      ? response("", 404)
      : response("# What is ML?"));
  });

  assert.deepEqual(requests, [
    "phases/02-ml/01-intro/docs/de.md",
    "phases/02-ml/01-intro/docs/en.md"
  ]);
  assert.equal(loaded.lang, "en");
  assert.equal(loaded.text, "# What is ML?");
});

test("a German request error still falls back to English", async () => {
  const requests = [];
  const loaded = await LessonLanguage.load("phases/02-ml/01-intro", "de", (path) => {
    requests.push(path);
    if (path.endsWith("/de.md")) return Promise.reject(new Error("network error"));
    return Promise.resolve(response("# What is ML?"));
  });

  assert.equal(loaded.lang, "en");
  assert.equal(requests.length, 2);
});

test("an English selection never silently serves German", async () => {
  const requests = [];

  await assert.rejects(
    LessonLanguage.load("phases/02-ml/01-intro", "en", (path) => {
      requests.push(path);
      return Promise.resolve(response("", 404));
    }),
    /docs\/en\.md/
  );

  assert.deepEqual(requests, ["phases/02-ml/01-intro/docs/en.md"]);
});

test("lesson page wires the resolver to initial load and language changes", () => {
  assert.match(lessonHtml, /src="lesson-language\.js/);
  assert.match(lessonHtml, /var loadSequence = \+\+lessonLoadSequence/);
  assert.match(lessonHtml, /fetchLesson\(lessonPath, preferred, loadSequence\)/);
  assert.match(lessonHtml, /LessonLanguage\.load\(path, preferredLang/);
  assert.match(lessonHtml, /addEventListener\('sitelang:change', requestLessonContent\)/);
  assert.match(lessonHtml, /currentLessonLang = loaded\.lang/);
  assert.match(lessonHtml, /inLanguage: currentLessonLang/);
  assert.match(lessonHtml, /if \(!href \|\| href === '#'\) return/);
});
