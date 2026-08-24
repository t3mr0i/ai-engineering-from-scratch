import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { hasAdminAccess } = require("./admin-entry.js");

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
