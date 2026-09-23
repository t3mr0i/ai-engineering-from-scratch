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

test("missing assessment shows a prominent route to the native flow", () => {
  const state = boot({ model: { roleSelected: true, roleId: "tc", assessmentAvailable: false } });
  assert.equal(state.host.hidden, false);
  assert.match(state.host.textContent, /Find your starting point with the AI self-assessment/);
  assert.equal(descendants(state.host).find((node) => node.textContent === "Start assessment" && node.href).href, "assessment.html");
});

test("a previous dismissal does not hide the entry", () => {
  const state = boot({ model: { roleSelected: true, roleId: "tc", assessmentAvailable: false }, storage: { "aifs:assessment-prompt-skipped:v1": '{"tc":true}' } });
  assert.equal(state.host.hidden, false);
});

test("a completed assessment keeps a retake route visible", () => {
  const state = boot({ model: { roleSelected: true, roleId: "tc", assessmentAvailable: true } });
  assert.equal(state.host.hidden, false);
  assert.equal(descendants(state.host).find((node) => node.textContent === "Retake assessment" && node.href).href, "assessment.html");
});

test("profile editing hides the separate assessment banner", () => {
  const state = boot({ model: { roleSelected: true, roleId: "tc", assessmentAvailable: true }, search: "?view=profile" });
  assert.equal(state.host.hidden, true);
});
