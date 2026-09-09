import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

const source = readFileSync(new URL("./lrn/learning-workspace.js", import.meta.url), "utf8");

class FakeNode {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.attributes = new Map();
    this.listeners = new Map();
    this.hidden = false;
    this.textContent = "";
    this.children = [];
    this.open = false;
  }

  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) || null; }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  replaceChildren(...children) { this.children = children; }
}

function boot(hash = "") {
  const icon = new FakeNode({ learningIcon: "calendar" });
  const title = new FakeNode({ workspaceCopy: "title" });
  const navHome = new FakeNode({ workspaceCopy: "navHome" });
  const progressCopy = new FakeNode({ workspaceCopy: "progress" });
  const workspaceLabel = new FakeNode({ workspaceLabel: "progress" });
  const role = new FakeNode();
  const courseProgress = new FakeNode();
  const assessmentSettings = new FakeNode();
  const nodes = new Map([
    ["learningNav", new FakeNode()],
    ["workspaceRole", role],
    ["workspaceCourseProgress", courseProgress],
    ["assessmentSettings", assessmentSettings]
  ]);
  const query = new Map([
    ["[data-learning-icon]", [icon]],
    ["[data-workspace-copy]", [title, navHome, progressCopy]],
    ["[data-workspace-label]", [workspaceLabel]]
  ]);
  const document = {
    readyState: "complete",
    title: "",
    listeners: new Map(),
    querySelectorAll(selector) { return query.get(selector) || []; },
    getElementById(id) { return nodes.get(id) || null; },
    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) || [];
      listeners.push(listener);
      this.listeners.set(type, listeners);
    },
    dispatchEvent(event) { (this.listeners.get(event.type) || []).forEach((listener) => listener(event)); }
  };
  const listeners = new Map();
  const root = {
    document,
    location: { hash },
    listeners,
    addEventListener(type, listener) {
      const current = listeners.get(type) || [];
      current.push(listener);
      listeners.set(type, current);
    },
    SiteLang: { get: () => root.language },
    language: "en",
    LrnLearningIcons: { create: (name) => new FakeNode({ icon: name }) },
    LrnJourneyState: { snapshot: () => ({ roleSelected: true, role: { label: "AI engineer" } }) },
    LrnCurriculumMap: { courseMaps: {
      A: [{ lessons: [{ path: "a/1" }, { path: "a/2" }] }],
      B: [{ lessons: [{ path: "b/1" }] }],
      C: [{ lessons: [{ path: "c/1" }] }]
    } },
    AIFSProgress: {
      getState: () => ({ lessons: {
        "a/1": { completedAt: 1 }, "a/2": { completedAt: 2 }, "b/1": { visitedAt: 3 }
      } }),
      onChange: (listener) => { root.progressListener = listener; }
    }
  };
  root.window = root;
  vm.createContext(root);
  vm.runInContext(source, root, { filename: "learning-workspace.js" });
  return { root, document, role, courseProgress, assessmentSettings, workspaceLabel, progressCopy, icon };
}

test("progress workspace counts completed and started courses from curriculum lessons", () => {
  const state = boot();

  assert.equal(state.role.textContent, "AI engineer");
  assert.equal(state.courseProgress.textContent, "1 courses completed · 1 courses started · 2 lessons completed");
  assert.equal(state.document.title, "My progress · LHIND AI Learning Catalog");
  assert.equal(state.icon.children.length, 1);
  assert.doesNotMatch(source, /AIFSPersonalPlan/);
});

test("assessment deep links open the collapsed assessment settings", () => {
  const state = boot("#assessmentSettings");
  assert.equal(state.assessmentSettings.open, true);
});

test("workspace labels re-render in German without replacing the progress summary", () => {
  const state = boot();
  state.root.language = "de";
  state.document.dispatchEvent({ type: "sitelang:change" });

  assert.equal(state.document.title, "Mein Fortschritt · LHIND AI Learning Catalog");
  assert.equal(state.progressCopy.textContent, "Mein Fortschritt");
  assert.equal(state.workspaceLabel.getAttribute("aria-label"), "Mein Fortschritt");
  assert.equal(state.courseProgress.textContent, "1 Kurse abgeschlossen · 1 Kurse begonnen · 2 Lektionen abgeschlossen");
});
