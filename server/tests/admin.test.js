const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { normalizeRoles, resolveAdmin } = require("../admin-auth");
const { loadBaseCurriculum, validateCurriculum, curriculumStats, clone } = require("../admin-curriculum");
const { AdminStore, StoreError } = require("../admin-store");

const ROOT = path.resolve(__dirname, "..", "..");
const SITE = path.join(ROOT, "site");

test("role inheritance grants every lower role", () => {
  assert.deepEqual(normalizeRoles(["publisher"]), ["editor", "reviewer", "publisher"]);
  assert.deepEqual(normalizeRoles(["reviewer"]), ["editor", "reviewer"]);
  assert.deepEqual(normalizeRoles(["unknown"]), []);
});

test("trusted identity resolves configured user and group roles", () => {
  const req = { headers: { "x-forwarded-user": "ada", "x-forwarded-groups": "curriculum-reviewers" } };
  const actor = resolveAdmin(req, {
    ADMIN_ROLES_JSON: JSON.stringify({
      users: { ada: ["editor"] },
      groups: { "curriculum-reviewers": ["reviewer"] },
    }),
  });
  assert.equal(actor.username, "ada");
  assert.deepEqual(actor.roles, ["editor", "reviewer"]);
});

test("development identity is explicit and receives publisher capabilities", () => {
  assert.equal(resolveAdmin({ headers: {} }, {}), null);
  const actor = resolveAdmin({ headers: {} }, { ADMIN_DEV_MODE: "true" });
  assert.equal(actor.username, "local-admin");
  assert.deepEqual(actor.roles, ["editor", "reviewer", "publisher"]);
  assert.equal(actor.isDevelopment, true);
});

test("canonical curriculum loads with the expected inventory", () => {
  const snapshot = loadBaseCurriculum(SITE);
  const stats = curriculumStats(snapshot);
  assert.equal(stats.courses, 45);
  assert.equal(stats.tracks, 5);
  assert.ok(stats.units >= 130);
  assert.ok(stats.activities >= 400);
  assert.equal(validateCurriculum(snapshot).filter((item) => item.severity === "error").length, 0);
});

test("validator catches unknown course references and duplicate course ids", () => {
  const snapshot = clone(loadBaseCurriculum(SITE));
  snapshot.catalog.courses.push(clone(snapshot.catalog.courses[0]));
  snapshot.catalog.tracks[0].stages[0].courses.push("LRN-99");
  const codes = new Set(validateCurriculum(snapshot).map((item) => item.code));
  assert.ok(codes.has("course.duplicate"));
  assert.ok(codes.has("track.course.unknown"));
});

test("change sets retain revisions and reject stale writes", () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "curriculum-admin-"));
  const store = new AdminStore({ dataDir, webRoot: SITE });
  const actor = { username: "ada" };
  const created = store.create(actor, { title: "Neue Lernstrecke" });
  assert.equal(created.version, 1);
  assert.equal(store.list().length, 1);

  const snapshot = clone(created.snapshot);
  snapshot.catalog.courses[0].title = "Überarbeiteter Titel";
  const saved = store.save(created.id, actor, { expectedVersion: 1, snapshot });
  assert.equal(saved.version, 2);
  assert.equal(store.get(created.id).snapshot.catalog.courses[0].title, "Überarbeiteter Titel");
  assert.ok(fs.existsSync(path.join(dataDir, "history", created.id, "1.json")));
  assert.ok(fs.existsSync(path.join(dataDir, "history", created.id, "2.json")));

  assert.throws(
    () => store.save(created.id, actor, { expectedVersion: 1, snapshot }),
    (error) => error instanceof StoreError && error.code === "version.conflict" && error.status === 409,
  );
});

test("status transitions preserve an audit reason", () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "curriculum-admin-status-"));
  const store = new AdminStore({ dataDir, webRoot: SITE });
  const actor = { username: "grace" };
  const created = store.create(actor, {});
  const review = store.transition(created.id, actor, {
    expectedVersion: created.version,
    status: "review",
    reason: "Bereit für Curriculum-Grill",
  });
  assert.equal(review.status, "review");
  assert.equal(review.audit.at(-1).reason, "Bereit für Curriculum-Grill");
});
