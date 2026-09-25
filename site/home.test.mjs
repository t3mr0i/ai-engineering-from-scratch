import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync("site/index.html", "utf8");
const css = readFileSync("site/home.css", "utf8");
const sharedCss = readFileSync("site/lrn/lrn.css", "utf8");
const lrn = readFileSync("site/lrn/lrn.js", "utf8");
const readiness = readFileSync("site/lrn/readiness-home.js", "utf8");

test("home separates first-time setup from returning learner paths", () => {
  const setup = html.indexOf('id="readinessSetup"');
  const dashboard = html.indexOf('id="readinessDashboard"');
  const next = html.indexOf('id="readinessNext"');
  const map = html.indexOf('id="readinessMap"');
  const catalog = html.indexOf('class="training-catalog"');
  assert.ok(setup > 0 && setup < dashboard);
  assert.ok(dashboard < next && next < map && map < catalog);
  assert.equal((html.match(/id="roleSelect"/g) || []).length, 1);
  assert.match(html, /id="setupAssessmentLink" href="assessment-v2\.html"/);
  assert.doesNotMatch(html, /readiness-setup__alternate/);
  assert.doesNotMatch(html, /href="assessment\.html"/);
  assert.equal((html.match(/href="assessment-v2\.html"/g) || []).length, 1);
  assert.doesNotMatch(html, /data-assessment-prompt|src="lrn\/assessment-prompt\.js/);
  assert.match(html, /id="readinessDashboard"[^>]*hidden/);
});

test("secondary planning tools open the shared plan and progress workspace", () => {
  assert.match(html, /<a href="personal-plan\.html" class="learning-nav__item"/);
  assert.doesNotMatch(html, /href="personal-plan\.html#progress"/,
    "progress should have one destination in the sidebar workspace");
  assert.doesNotMatch(html, /href="skills\.html"/);
  assert.doesNotMatch(html, /id="personalPlan"|id="teamLearning"/,
    "editable workspaces should remain on the shared plan page");
  assert.doesNotMatch(html, /src="lrn\/(?:plan-builder|team-learning)\.js/,
    "homepage should not load scripts for tools that live on separate pages");
  assert.doesNotMatch(html, /class="upskilling-journey"/,
    "duplicated five-step journey should not compete with the actual learning path");
});

test("trainer access is in the header rather than the learning sidebar", () => {
  const header = html.slice(html.indexOf('<header class="nav-edge'), html.indexOf('</header>'));
  const sidebar = html.slice(html.indexOf('<aside class="learning-sidebar">'), html.indexOf('</aside>'));
  assert.match(header, /id="trainerNav"[^>]*href="trainer\.html"|href="trainer\.html"[^>]*id="trainerNav"/);
  assert.doesNotMatch(sidebar, /trainerNav|trainer\.html/);
});

test("profile editing is a distinct route with a whitelisted return target", () => {
  assert.match(html, /id="profileNav" hidden/);
  assert.match(html, /id="profileBack"[^>]*hidden/);
  assert.match(html, /href="index\.html\?view=profile&amp;from=learning"/);
  assert.match(readiness, /params\.get\("view"\) === "profile"/);
  assert.match(readiness, /params\.get\("from"\) === "plan"/);
  assert.match(readiness, /returnToPlan \? "personal-plan\.html" : "index\.html#readinessMap"/);
  assert.match(readiness, /if \(profilePage\) \{ root\.location\.assign\(returnHref\); return; \}/);
  assert.match(readiness, /doc\.querySelector\("\.training-catalog"\)\.hidden = profilePage/);
});

test("home has an isolated responsive composition layer", () => {
  assert.match(html, /pan\.css[^>]*>[\s\S]*home\.css/,
    "homepage CSS must load after shared component styles");
  assert.match(css, /^\/\* Hallmark ·[^\n]*macrostructure: Index-First/m);
  assert.match(css, /@media \(max-width: 40rem\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(html, /lrn\/readiness-home\.css/);
  assert.match(html, /lrn\/readiness-map\.js/);
});

test("default Academy view stays focused to role recommendations", () => {
  assert.match(lrn, /var visiblePaths = state\.academyAll \? allPaths : primaryRecommendations;/);
  assert.match(lrn, /activePath = primaryRecommendations\[0\] \|\| foundationPaths\[0\];/);
});

test("catalog cards keep a stable pointer target while hovered", () => {
  const hoverRule = sharedCss.match(
    /@media \(hover: hover\) and \(pointer: fine\) \{\s*\.interactive-card:hover \{([^}]*)\}/,
  );
  assert.ok(hoverRule, "shared interactive-card hover rule is missing");
  assert.doesNotMatch(
    hoverRule[1],
    /transform\s*:/,
    "moving the card under the pointer causes hover oscillation and dropped clicks",
  );
  assert.match(hoverRule[1], /box-shadow:\s*var\(--card-hover-shadow\)/);
  assert.match(lrn, /var card = document\.createElement\("a"\);[\s\S]*?card\.href = courseHref\(course\.id\);/);
});
