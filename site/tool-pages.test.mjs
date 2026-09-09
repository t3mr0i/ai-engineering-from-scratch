import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const plan = readFileSync("site/personal-plan.html", "utf8");
const redirect = readFileSync("site/skills.html", "utf8");
const css = readFileSync("site/lrn/learning-workspace.css", "utf8");
const workspace = readFileSync("site/lrn/learning-workspace.js", "utf8");

test("the progress workspace keeps one sidebar and one focused view", () => {
  assert.match(plan, /class="learning-sidebar"/);
  assert.match(plan, /id="learningNav"/);
  assert.match(plan, /class="learning-content"/);
  assert.equal((plan.match(/class="workspace-panel"/g) || []).length, 1);
  assert.doesNotMatch(plan, /id="plan" class="workspace-panel"/);
  assert.match(plan, /id="progress" class="workspace-panel"/);
  assert.doesNotMatch(plan, /href="#plan"|data-workspace-view="plan"/);
  assert.match(plan, /href="index\.html\?view=profile&amp;from=progress"[^>]+data-workspace-copy="editRole"/);
  assert.doesNotMatch(plan, /id="personalPlanApp"/);
  assert.doesNotMatch(plan, /plan-builder\.js/);
  assert.match(plan, /id="skillsProgress"/);
  assert.match(plan, /src="lrn\/learning-workspace\.js\?v=[^"]+"/);
  assert.match(plan, /src="lrn\/assessment-prompt\.js\?v=[^"]+"/);
  assert.match(plan, /src="skills-progress\.js\?v=[^"]+"/);
  assert.match(plan, /href="pan\.css\?v=[^"]+"/);
  assert.match(plan, /href="lrn\/learning-workspace\.css\?v=[^"]+"/);
  assert.match(plan, /src="theme-toggle\.js"/);
  assert.doesNotMatch(plan, /href="tool-page\.css\?v=[^"]+"/);
  assert.doesNotMatch(plan, /src="pan\.js(?:\?[^\"]*)?"/);
});

test("the workspace has one page title and a direct home path", () => {
  assert.match(plan, /<h1 id="personalPlanPageTitle"[^>]*>/);
  assert.equal((plan.match(/<h1\b/g) || []).length, 1);
  assert.match(plan, /href="index\.html#heroTitle" class="learning-nav__item"/);
});

test("the legacy skills URL redirects to the shared progress view", () => {
  assert.match(redirect, /location\.replace\("personal-plan\.html" \+ location\.search \+ "#progress"\)/);
  assert.match(redirect, /href="personal-plan\.html#progress"/);
  assert.doesNotMatch(redirect, /id="skillsProgress"/);
  assert.doesNotMatch(redirect, /src="skills-progress\.js/);
});

test("shared workspace composition has responsive and reduced-motion rules", () => {
  assert.match(css, /\.workspace-panel\[hidden\]\s*\{\s*display:\s*none/);
  assert.match(css, /\.page--learning-workspace \.workspace-evidence/);
  assert.match(workspace, /LrnCurriculumMap/);
  assert.doesNotMatch(workspace, /AIFSPersonalPlan/);
  assert.match(workspace, /function render\(\)/);
});
