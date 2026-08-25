import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { hasAdminAccess, mount } = require("./admin-entry.js");

function makeElement(tagName) {
  return {
    tagName,
    attributes: {},
    children: [],
    dataset: {},
    hidden: false,
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    append(...children) {
      this.children.push(...children);
    },
  };
}

test("admin entry accepts every curriculum role", () => {
  for (const role of ["editor", "reviewer", "publisher"]) {
    assert.equal(hasAdminAccess({ actor: { roles: [role] } }), true);
  }
});

test("admin entry stays unavailable without a curriculum role", () => {
  assert.equal(hasAdminAccess({ actor: { roles: [] } }), false);
  assert.equal(hasAdminAccess({ actor: { roles: ["learner"] } }), false);
  assert.equal(hasAdminAccess({}), false);
  assert.equal(hasAdminAccess(null), false);
});

test("admin entry is the final top-right navigation action", async () => {
  const themeToggle = makeElement("button");
  const languageToggle = makeElement("a");
  const nav = {
    children: [themeToggle, languageToggle],
    querySelector() {
      return null;
    },
    append(child) {
      this.children = this.children.filter((candidate) => candidate !== child);
      this.children.push(child);
    },
  };
  const documentRef = {
    querySelector(selector) {
      return selector === ".nav-edge" ? nav : null;
    },
    createElement: makeElement,
    createElementNS(_namespace, tagName) {
      return makeElement(tagName);
    },
  };
  const fetchFn = async () => ({
    ok: true,
    async json() {
      return { actor: { roles: ["editor"] } };
    },
  });

  assert.equal(await mount(documentRef, fetchFn), true);
  const entry = nav.children.at(-1);
  assert.equal(entry.className, "nav-admin-entry");
  assert.equal(entry.href, "/admin.html");
  assert.equal(entry.hidden, false);
  assert.equal(entry.dataset.adminReady, "true");
});
