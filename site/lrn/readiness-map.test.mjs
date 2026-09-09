import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("./readiness-map.js", import.meta.url), "utf8");

class Element {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this.className = "";
    this.open = false;
    this.hidden = false;
    this._text = "";
  }

  append(...nodes) {
    nodes.filter(Boolean).forEach((node) => {
      if (typeof node === "string") node = new TextNode(node);
      node.parentElement = this;
      this.children.push(node);
    });
  }

  appendChild(node) {
    this.append(node);
    return node;
  }

  prepend(...nodes) {
    const added = nodes.filter(Boolean).map((node) => typeof node === "string" ? new TextNode(node) : node);
    added.forEach((node) => { node.parentElement = this; });
    this.children.unshift(...added);
  }

  replaceChildren(...nodes) {
    this.children = [];
    this._text = "";
    this.append(...nodes.flat());
  }

  set textContent(value) {
    this.children = [];
    this._text = String(value ?? "");
  }

  get textContent() {
    return this._text + this.children.map((child) => child.textContent).join("");
  }

  set innerHTML(value) {
    this.replaceChildren();
    this._text = String(value ?? "") === "" ? "" : String(value);
  }

  get innerHTML() {
    return this.textContent;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === "class") this.className = String(value);
    if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value);
  }

  getAttribute(name) {
    if (name in this.attributes) return this.attributes[name];
    if (name === "open") return this.open ? "" : null;
    if (name.startsWith("data-")) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      return this.dataset[key] ?? null;
    }
    return null;
  }

  addEventListener(type, listener) {
    (this.listeners[type] ||= []).push(listener);
  }

  click() {
    (this.listeners.click || []).forEach((listener) => listener({ target: this, preventDefault() {} }));
  }

  closest(selector) {
    let node = this;
    while (node) {
      if (matches(node, selector)) return node;
      node = node.parentElement;
    }
    return null;
  }
}

class TextNode {
  constructor(text) {
    this._text = text;
    this.parentElement = null;
  }

  get textContent() { return this._text; }
}

function descendants(root) {
  return root.children.flatMap((child) => child instanceof Element ? [child, ...descendants(child)] : []);
}

function matches(node, selector) {
  if (!(node instanceof Element)) return false;
  const parts = selector.trim().split(/(?=\.|\[|#)/);
  const tag = parts[0] && !parts[0].startsWith(".") && !parts[0].startsWith("[") && !parts[0].startsWith("#") ? parts[0] : null;
  if (tag && node.tagName.toLowerCase() !== tag.toLowerCase()) return false;
  for (const part of parts.slice(tag ? 1 : 0)) {
    if (part.startsWith(".")) {
      if (!node.className.split(/\s+/).includes(part.slice(1))) return false;
    } else if (part.startsWith("#")) {
      if (node.getAttribute("id") !== part.slice(1)) return false;
    } else {
      const attr = part.match(/^\[([^=\]]+)(?:=["']?([^\]"']+)["']?)?\]$/);
      if (!attr) continue;
      const name = attr[1];
      if (name === "open" && node.open === true) continue;
      const value = node.getAttribute(name);
      if (value == null) return false;
      if (attr[2] != null && value !== attr[2]) return false;
    }
  }
  if (selector.endsWith("[open]")) return node.open === true;
  return true;
}

function addQueryMethods(node) {
  node.querySelectorAll = (selector) => {
    const tokens = selector.trim().split(/\s+/);
    let scope = [node];
    for (const token of tokens) {
      scope = scope.flatMap((candidate) => descendants(candidate).filter((child) => matches(child, token)));
    }
    return scope;
  };
  node.querySelector = (selector) => node.querySelectorAll(selector)[0] || null;
  node.children.forEach(addQueryMethods);
  return node;
}

function render(model, options = {}) {
  const document = {
    createElement(tagName) {
      const node = new Element(tagName);
      addQueryMethods(node);
      return node;
    },
    location: { href: "https://learning.example/index.html" },
  };
  const sandbox = {
    document,
    location: document.location,
    SiteLang: { get: () => "en" },
    LrnLearningIcons: { create: () => document.createElement("span") },
    LrnJourneyState: { setFocus: (id) => { options.stateFocus = id; } },
    URL,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Math,
    console,
  };
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox);
  return sandbox.LrnReadinessMap.render(model, options);
}

function fixture(overrides = {}) {
  const shared = {
    courseId: "shared",
    title: "Shared AI Foundations",
    href: "lrn/course.html?id=shared",
    status: "ready",
    matches: [
      { dimensionId: "engineering", dimension: "Engineering Literacy", capability: "Prompt design", targetLevel: "Acquire", rank: 1 },
      { dimensionId: "advisory", dimension: "Advisory Literacy", capability: "Decision framing", targetLevel: "Deepen", rank: 2 },
    ],
  };
  const engineeringPractice = {
    courseId: "practice",
    title: "Engineering in Practice",
    href: "lrn/course.html?id=practice",
    activityHref: "lesson.html?path=practice-start&course=practice",
    status: "in-progress",
    matches: [{ dimensionId: "engineering", dimension: "Engineering Literacy", capability: "Evaluation", targetLevel: "Deepen", rank: 2 }],
  };
  const createSystems = {
    courseId: "systems",
    title: "Create AI Systems",
    href: "lrn/course.html?id=systems",
    status: "ready",
    prerequisiteCourseIds: ["shared"],
    matches: [{ dimensionId: "engineering", dimension: "Engineering Literacy", capability: "Architecture", targetLevel: "Create", rank: 3 }],
  };
  const crossAreaPrep = {
    courseId: "advisory-prep",
    title: "Advisory Preparation",
    href: "lrn/course.html?id=advisory-prep",
    status: "ready",
    matches: [{ dimensionId: "advisory", dimension: "Advisory Literacy", capability: "Decision framing", targetLevel: "Acquire", rank: 1 }],
  };
  const blocked = {
    courseId: "blocked",
    title: "Blocked Engineering Project",
    href: "lrn/course.html?id=blocked",
    status: "prerequisite-open",
    prerequisiteCourseIds: ["advisory-prep"],
    matches: [{ dimensionId: "engineering", dimension: "Engineering Literacy", capability: "Architecture", targetLevel: "Create", rank: 3 }],
  };
  return {
    focusDimensionId: "engineering",
    dimensions: [
      { id: "engineering", name: "Engineering Literacy", currentLevel: null, targetLevel: "Create", status: "unknown" },
      { id: "foundation", name: "Foundation", currentLevel: "None", targetLevel: "Acquire", status: "gap" },
      { id: "advisory", name: "Advisory Literacy", currentLevel: "Acquire", targetLevel: "Deepen", status: "gap" },
    ],
    branches: [
      { id: "engineering", name: "Engineering Literacy", currentLevel: null, targetLevel: "Create", status: "unknown", steps: [shared, engineeringPractice, createSystems, blocked], stages: [
        { level: "Acquire", status: "available", steps: [shared] },
        { level: "Deepen", status: "available", steps: [engineeringPractice] },
        { level: "Create", status: "blocked", steps: [createSystems, blocked] },
      ] },
      { id: "advisory", name: "Advisory Literacy", currentLevel: "Acquire", targetLevel: "Deepen", status: "gap", steps: [shared, crossAreaPrep], stages: [
        { level: "Acquire", status: "available", steps: [shared, crossAreaPrep] },
      ] },
    ],
    steps: [shared, engineeringPractice, createSystems, crossAreaPrep, blocked],
    ...overrides,
  };
}

function track(root, id) {
  return root.querySelector(`[data-dimension="${id}"]`) || root.querySelector(".readiness-map__route") || root;
}

function areaButton(root, id) {
  return root.querySelector(`[data-focus="${id}"]`);
}

function courseNode(root, title) {
  return nodesWithClass(root, "readiness-map__course").find((node) => descendants(node).some((child) => child.tagName === "H5" && child.textContent === title));
}

function nodesWithClass(root, className) {
  return [root, ...descendants(root)].filter((node) => node instanceof Element && node.className.split(/\s+/).includes(className));
}

function links(root) {
  return [root, ...descendants(root)].filter((node) => node instanceof Element && node.tagName === "A");
}

test("selected competency branch exposes grouped course titles, prerequisites, and shared contributions", () => {
  const root = render(fixture(), { activeDimensionId: "engineering", onSelect() {} });
  const selected = track(root, "engineering");
  assert.ok(selected);
  assert.match(selected.textContent, /Acquire/);
  assert.match(selected.textContent, /Deepen/);
  assert.match(selected.textContent, /Create/);
  for (const title of ["Shared AI Foundations", "Engineering in Practice", "Create AI Systems"]) assert.match(selected.textContent, new RegExp(title));
  assert.match(selected.textContent, /Advisory Literacy/);
  assert.match(selected.textContent, /Shared AI Foundations/);
});

test("choosing an area reports the selected dimension id", () => {
  let selectedId = null;
  const root = render(fixture(), { activeDimensionId: "engineering", onSelect: (id) => { selectedId = id; } });
  const button = areaButton(root, "foundation");
  assert.ok(button);
  button.click();
  assert.equal(selectedId, "foundation");
});

test("unknown competence remains distinct from an explicit zero level", () => {
  const root = render(fixture(), { activeDimensionId: "engineering", onSelect() {} });
  assert.match(track(root, "engineering").textContent, /Not assessed/);
  assert.match(areaButton(root, "foundation").textContent, /None/);
  assert.doesNotMatch(track(root, "engineering").textContent, /Your level: Acquire/);
});

test("ready and in-progress courses expose real course or activity links", () => {
  const root = render(fixture(), { activeDimensionId: "engineering", onSelect() {} });
  const hrefs = links(track(root, "engineering")).map((link) => link.href);
  assert.ok(hrefs.some((href) => href.endsWith("/lrn/course.html?id=shared")));
  assert.ok(hrefs.some((href) => href.endsWith("/lesson.html?path=practice-start&course=practice")) || hrefs.some((href) => href.endsWith("/lrn/course.html?id=practice")));
  assert.ok(hrefs.every((href) => href && !href.endsWith("#")));
});

test("optional course maps expose real unit and lesson links", () => {
  const root = render(fixture(), {
    activeDimensionId: "engineering",
    onSelect() {},
    courseMaps: {
      practice: [{ title: "Evaluation in practice", lessons: [{ title: "Compare two outputs", path: "engineering/compare-outputs" }] }],
    },
  });
  const practice = courseNode(root, "Engineering in Practice");
  assert.match(practice.textContent, /Evaluation in practice/);
  const lesson = links(practice).find((link) => link.textContent === "Compare two outputs");
  assert.ok(lesson);
  assert.ok(lesson.href.endsWith("lesson.html?path=engineering%2Fcompare-outputs&course=practice"));
});

test("blocked courses show a prerequisite link and no start link", () => {
  const root = render(fixture(), { activeDimensionId: "engineering", onSelect() {} });
  const blockedNode = courseNode(root, "Blocked Engineering Project");
  assert.ok(blockedNode);
  assert.match(blockedNode.textContent, /Advisory Preparation/);
  const blockedLinks = links(blockedNode);
  assert.ok(blockedLinks.some((link) => link.textContent === "Advisory Preparation"));
  assert.ok(blockedLinks.every((link) => !String(link.href).includes("id=blocked")));
});

test("cross-area prerequisites resolve to their course title and href", () => {
  const root = render(fixture(), { activeDimensionId: "engineering", onSelect() {} });
  const prerequisite = links(courseNode(root, "Blocked Engineering Project")).find((link) => link.textContent === "Advisory Preparation");
  assert.ok(prerequisite);
  assert.ok(prerequisite.href.endsWith("/lrn/course.html?id=advisory-prep"));
});

test("an achieved target with no courses is reported honestly", () => {
  const model = fixture({
    focusDimensionId: "foundation",
    branches: [{ id: "foundation", name: "Foundation", currentLevel: "Deepen", targetLevel: "Deepen", status: "self-assessed", steps: [], stages: [{ level: "Deepen", status: "self-assessed", isTarget: true, steps: [] }] }],
    dimensions: [{ id: "foundation", name: "Foundation", currentLevel: "Deepen", targetLevel: "Deepen", status: "self-assessed" }],
    steps: [],
  });
  const root = render(model, { activeDimensionId: "foundation", onSelect() {} });
  const selected = track(root, "foundation");
  assert.match(selected.textContent, /Target reached/);
  assert.doesNotMatch(selected.textContent, /0 courses/);
  assert.equal(links(selected).length, 0);
});

test("a shared course is rendered once per active path", () => {
  const model = fixture();
  model.branches[0].stages[0].steps = [model.steps[0], model.steps[0]];
  model.branches[0].stages[1].steps = [model.steps[1]];
  const root = render(model, { activeDimensionId: "engineering", onSelect() {} });
  const sharedCards = nodesWithClass(root, "readiness-map__course").filter((node) => descendants(node).some((child) => child.tagName === "H5" && child.textContent === "Shared AI Foundations"));
  assert.equal(sharedCards.length, 1);
});

test("coverage gaps and evidence guidance stay behind a collapsed path disclosure", () => {
  const model = fixture();
  model.branches[0].coverageGaps = [{ capability: "Architecture", targetLevel: "Create" }];
  const root = render(model, { activeDimensionId: "engineering", onSelect() {} });
  const details = nodesWithClass(root, "readiness-map__path-details")[0];
  assert.ok(details);
  assert.equal(details.open, false);
  assert.equal(details.children[0].tagName, "SUMMARY");
  assert.match(details.textContent, /About this learning path/);
  assert.match(details.textContent, /More course coverage is needed/);
  assert.match(details.textContent, /Architecture · Create/);
  assert.match(details.textContent, /Course completion records learning activity/);
  const route = nodesWithClass(root, "readiness-map__route")[0];
  assert.doesNotMatch(route.textContent, /Course completion records learning activity/);
});
