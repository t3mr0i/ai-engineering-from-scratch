import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

const source = readFileSync(new URL("./lrn/assessment-prompt.js", import.meta.url), "utf8");

class Element {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.children = [];
    this.listeners = {};
    this.hidden = false;
    this._text = "";
    this.className = "";
    this.href = "";
    this.attributes = {};
  }
  set textContent(value) { this.children = []; this._text = String(value ?? ""); }
  get textContent() { return this._text + this.children.map((child) => child.textContent || "").join(""); }
  append(...nodes) { this.children.push(...nodes.filter(Boolean)); }
  appendChild(node) { this.append(node); return node; }
  replaceChildren(...nodes) { this.children = nodes.filter(Boolean); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  click() { (this.listeners.click || []).forEach((listener) => listener({ target: this })); }
}

function descendants(node) {
  return node.children.flatMap((child) => child instanceof Element ? [child, ...descendants(child)] : []);
}

function boot({ model, storage = {}, search = "" } = {}) {
  const host = new Element({ assessmentPrompt: "" });
  const setupSkip = new Element();
  const nodes = { assessmentPrompt: [host], setupSkip };
  const document = {
    readyState: "complete",
    listeners: {},
    createElement: () => new Element(),
    querySelectorAll(selector) { return selector === "[data-assessment-prompt]" ? nodes.assessmentPrompt : []; },
    querySelector() { return null; },
    getElementById(id) { return nodes[id] || null; },
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); },
    dispatchEvent(event) { (this.listeners[event.type] || []).forEach((listener) => listener(event)); }
  };
  const localStorage = {
    values: { ...storage },
    getItem(key) { return this.values[key] ?? null; },
    setItem(key, value) { this.values[key] = String(value); }
  };
  const root = {
    document,
    location: { search, hash: "" },
    localStorage,
    URLSearchParams,
    SiteLang: { get: () => "en" },
    LrnJourneyState: { snapshot: () => model },
    addEventListener() {}
  };
  root.window = root;
  vm.createContext(root);
  vm.runInContext(source, root, { filename: "assessment-prompt.js" });
  return { host, setupSkip, localStorage };
}

test("missing assessment shows a prompt with an explicit skip action", () => {
  const state = boot({ model: { roleSelected: true, roleId: "tc", assessmentAvailable: false } });
  assert.equal(state.host.hidden, false);
  assert.match(state.host.textContent, /Find your starting point with the AI assessment/);
  const skip = descendants(state.host).find((node) => node.tagName === "BUTTON" || node.textContent === "Skip for now");
  assert.ok(skip);
});

test("skipping persists per role and hides the prompt", () => {
  const state = boot({ model: { roleSelected: true, roleId: "tc", assessmentAvailable: false } });
  const skip = descendants(state.host).find((node) => node.textContent === "Skip for now");
  skip.click();
  assert.equal(state.host.hidden, true);
  assert.deepEqual(JSON.parse(state.localStorage.getItem("aifs:assessment-prompt-skipped:v1")), { tc: true });

  const restored = boot({ model: { roleSelected: true, roleId: "tc", assessmentAvailable: false }, storage: state.localStorage.values });
  assert.equal(restored.host.hidden, true);
});

test("a completed assessment suppresses the prompt without a skip record", () => {
  const state = boot({ model: { roleSelected: true, roleId: "tc", assessmentAvailable: true } });
  assert.equal(state.host.hidden, true);
  assert.equal(state.localStorage.getItem("aifs:assessment-prompt-skipped:v1"), null);
});

test("before role selection, skipping stores an explicit wildcard dismissal", () => {
  const state = boot({ model: { roleSelected: false, roleId: null, assessmentAvailable: false } });
  state.setupSkip.click();
  assert.deepEqual(JSON.parse(state.localStorage.getItem("aifs:assessment-prompt-skipped:v1")), { "*": true });
  assert.equal(state.host.hidden, true);
});
