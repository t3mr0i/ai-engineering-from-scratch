const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { normalizeRoles, resolveAdmin } = require("../admin-auth");
const {
  loadBaseCurriculum,
  validateCurriculum,
  curriculumStats,
  clone,
  requiresCurriculumGrill,
} = require("../admin-curriculum");
const { AdminStore, StoreError } = require("../admin-store");
const { createAdminAi, AdminAiError, normalizeResult } = require("../admin-ai");

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

test("major structure changes require a fresh curriculum grill", () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "curriculum-admin-grill-"));
  const store = new AdminStore({ dataDir, webRoot: SITE });
  const actor = { username: "ada" };
  const created = store.create(actor, {});
  const snapshot = clone(created.snapshot);
  snapshot.catalog.tracks[0].stages[0].courses.reverse();
  assert.equal(requiresCurriculumGrill(created.snapshot, snapshot), true);
  const changed = store.save(created.id, actor, { expectedVersion: created.version, snapshot });
  assert.equal(changed.grill.required, true);
  assert.equal(changed.grill.status, "pending");

  const response = normalizeResult(JSON.stringify({
    answer: "Die Struktur ist tragfähig.",
    findings: [],
    proposals: [],
    gate: { status: "passed", summary: "Voraussetzungen und Reihenfolge geprüft." },
  }), "curriculum-grill", "test-model", { type: "curriculum" });
  const grilled = store.appendChat(created.id, actor, {
    expectedVersion: changed.version,
    message: "Grill abschließen",
    skillId: "curriculum-grill",
  }, response);
  assert.equal(grilled.grill.status, "passed");

  const changedAgain = clone(grilled.snapshot);
  changedAgain.catalog.tracks[0].stages[1].courses.reverse();
  const reset = store.save(created.id, actor, { expectedVersion: grilled.version, snapshot: changedAgain });
  assert.equal(reset.grill.status, "pending");
});

test("AI proposals are individually accepted and audited", () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "curriculum-admin-proposal-"));
  const store = new AdminStore({ dataDir, webRoot: SITE });
  const actor = { username: "grace" };
  const created = store.create(actor, {});
  const response = normalizeResult(JSON.stringify({
    answer: "Ein präziserer Titel hilft.",
    proposals: [{
      id: "proposal-title",
      label: "Kurstitel präzisieren",
      operation: "replace",
      path: "/catalog/courses/0/title",
      value: "Interactive LLM Primer",
      rationale: "Makes the outcome explicit.",
    }],
  }), "curriculum-designer", "test-model", { type: "course", id: "PRIMER-01" });
  const chatted = store.appendChat(created.id, actor, {
    expectedVersion: created.version,
    message: "Verbessere den Titel",
    skillId: "curriculum-designer",
  }, response);
  const decided = store.decideProposal(created.id, actor, {
    expectedVersion: chatted.version,
    messageId: response.id,
    proposalId: "proposal-title",
    decision: "accepted",
  });
  assert.equal(decided.snapshot.catalog.courses[0].title, "Interactive LLM Primer");
  assert.equal(decided.chat[0].response.proposals[0].status, "accepted");
  assert.equal(decided.audit.at(-1).action, "ai.proposal.accepted");
});

test("AI normalization discards proposal paths outside curriculum manifests", () => {
  const result = normalizeResult(JSON.stringify({
    answer: "Test",
    proposals: [
      { operation: "replace", path: "/secrets/key", value: "leak" },
      { operation: "replace", path: "/catalog/courses/0/title", value: "Safe", label: "Safe change" },
    ],
  }), "quality-review", "test-model", { type: "curriculum" });
  assert.equal(result.proposals.length, 1);
  assert.equal(result.proposals[0].path, "/catalog/courses/0/title");
});

test("AI orchestration uses the configured internal model and structured contract", async () => {
  let requestBody;
  const ai = createAdminAi({
    env: { LLM_GATEWAY_KEY: "test-key", ADMIN_LLM_MODEL: "azure/test-model" },
    fetchFn: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          choices: [{ message: { content: JSON.stringify({
            answer: "Zwei Voraussetzungen fehlen.",
            questions: ["Welche Python-Erfahrung ist vorhanden?"],
            findings: [{ severity: "warning", title: "Python", detail: "Baseline unklar." }],
            proposals: [],
            gate: { status: "in_progress", summary: "Eine Frage offen." },
          }) } }],
        }),
      };
    },
  });
  const snapshot = loadBaseCurriculum(SITE);
  const result = await ai.run({
    changeset: { snapshot, chat: [] },
    message: "Prüfe die Voraussetzungen",
    skillId: "curriculum-grill",
    scope: { type: "course", id: snapshot.catalog.courses[0].id },
    glossary: "Tokenizer: maps text to tokens.",
  });
  assert.equal(requestBody.model, "azure/test-model");
  assert.match(requestBody.messages[0].content, /Return one JSON object only/);
  assert.equal(result.gate.status, "in_progress");
  assert.equal(result.toolTrace.at(-1).detail, "azure/test-model");
});

test("AI orchestration fails closed when the internal gateway is not configured", async () => {
  const ai = createAdminAi({ env: {} });
  await assert.rejects(
    ai.run({
      changeset: { snapshot: loadBaseCurriculum(SITE), chat: [] },
      message: "Prüfen",
      skillId: "quality-review",
    }),
    (error) => error instanceof AdminAiError && error.code === "ai.not_configured" && error.status === 503,
  );
});
