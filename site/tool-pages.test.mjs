import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const plan = readFileSync("site/personal-plan.html", "utf8");
const css = readFileSync("site/tool-page.css", "utf8");
const i18n = readFileSync("site/i18n.js", "utf8");

test("standalone tools preserve the shared learner shell", () => {
  [plan].forEach((page) => {
    assert.match(page, /class="skip-link"/);
    assert.match(page, /class="nav-edge"/);
    assert.match(page, /href="lrn\/lrn\.css\?v=[^"]+"/);
    assert.match(page, /href="pan\.css\?v=[^"]+"/);
    assert.match(page, /href="tool-page\.css\?v=[^"]+"/);
    assert.match(page, /src="theme-toggle\.js"/);
    assert.doesNotMatch(page, /src="pan\.js(?:\?[^"]*)?"/);
  });
});

test("each tool page has one page title and a direct way back", () => {
  assert.match(plan, /<h1 id="personalPlanPageTitle"[^>]*>/);
  [plan].forEach((page) => {
    assert.equal((page.match(/<h1\b/g) || []).length, 1);
    assert.match(page, /class="tool-page__back" href="index\.html#learningToolsTitle"/);
  });
});

test("tool-page copy is available in English and German", () => {
  [
    "title_personal_plan",
    "personal_plan_page_title",
    "tool_page_back",
  ].forEach((key) => {
    assert.match(i18n, new RegExp(`${key}: \\{ en: ".+", de: ".+" \\}`));
  });
});

test("standalone composition adapts without hiding core functionality", () => {
  assert.match(css, /@media \(max-width: 52rem\)/);
  assert.match(css, /@media \(max-width: 40rem\)/);
  assert.doesNotMatch(css, /display:\s*none/);
});

