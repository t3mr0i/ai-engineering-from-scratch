import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync("site/index.html", "utf8");
const css = readFileSync("site/home.css", "utf8");
const lrn = readFileSync("site/lrn/lrn.js", "utf8");

test("home presents one current path before recommendations and tools", () => {
  const path = html.indexOf('id="myLearningPath"');
  const recommendations = html.indexOf('id="academyPathsTitle"');
  const tools = html.indexOf('class="learning-tools"');
  const catalog = html.indexOf('class="training-catalog"');

  assert.ok(path > 0, "current learning path is required");
  assert.ok(path < recommendations, "current path must lead the page");
  assert.ok(recommendations < tools, "focused recommendations must precede optional tools");
  assert.ok(tools < catalog, "full catalog must be the last discovery surface");
});

test("secondary planning tools use progressive disclosure", () => {
  assert.equal((html.match(/<details class="learning-tool">/g) || []).length, 2);
  assert.match(html, /<details class="recommendation-settings">/,
    "profile controls should not compete with the recommendation list by default");
  assert.match(html, /<details class="learning-tool">[\s\S]*id="personalPlan"/);
  assert.match(html, /<details class="learning-tool">[\s\S]*id="teamLearning"/);
  assert.doesNotMatch(html, /class="upskilling-journey"/,
    "duplicated five-step journey should not compete with the actual learning path");
});

test("home has an isolated responsive composition layer", () => {
  assert.match(html, /pan\.css[^>]*>[\s\S]*home\.css/,
    "homepage CSS must load after shared component styles");
  assert.match(css, /^\/\* Hallmark ·[^\n]*macrostructure: Index-First/m);
  assert.match(css, /@media \(max-width: 40rem\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("default Academy view stays focused to role recommendations", () => {
  assert.match(lrn, /var visiblePaths = state\.academyAll \? allPaths : primaryRecommendations;/);
  assert.match(lrn, /activePath = primaryRecommendations\[0\] \|\| foundationPaths\[0\];/);
});
