import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const siteDir = path.dirname(fileURLToPath(import.meta.url));
const read = (relativePath) => fs.readFileSync(path.join(siteDir, relativePath), "utf8");

test("every catalog navigation surface loads the role-aware admin entry", () => {
  const surfaces = [
    "about.html",
    "ai-coding-dictionary.html",
    "assessment.html",
    "badges.html",
    "catalog.html",
    "glossary.html",
    "index.html",
    "lesson.html",
    "notes.html",
    "prereqs.html",
    "skills.html",
    "lrn/course.html",
  ];

  for (const surface of surfaces) {
    assert.match(read(surface), /<script src="\/admin-entry\.js\?v=20260825b" defer><\/script>/, surface);
  }
});

test("collapsed admin navigation keeps explicit accessible names", () => {
  const html = read("admin.html");
  const buttons = html.match(/<button class="admin-nav__item[\s\S]*?<\/button>/g) || [];
  assert.equal(buttons.length, 7);
  for (const button of buttons) assert.match(button, /aria-label="[^"]+"/);
});

test("admin shell exposes theme and dismissible mobile navigation controls", () => {
  const html = read("admin.html");
  const runtime = read("admin.js");
  assert.match(html, /id="adminThemeButton"/);
  assert.match(html, /id="adminSidebarBackdrop"[^>]+aria-label="Navigation schließen"/);
  assert.match(runtime, /function toggleAdminTheme\(\)/);
  assert.match(runtime, /function setSidebarOpen\(open\)/);
});
