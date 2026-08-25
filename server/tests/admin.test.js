const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

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
const { createGitLabPublisher, filesForSnapshot, lessonCommitMessage } = require("../admin-gitlab");
const { listLessons, loadLesson, validateLessonDraft } = require("../admin-lessons");

const ROOT = path.resolve(__dirname, "..", "..");
const SITE = path.join(ROOT, "site");

test("role inheritance grants every lower role", () => {
  assert.deepEqual(normalizeRoles(["publisher"]), ["editor", "reviewer", "publisher"]);
  assert.deepEqual(normalizeRoles(["reviewer"]), ["editor", "reviewer"]);
  assert.deepEqual(normalizeRoles(["unknown"]), []);
});

test("trusted identity resolves configured user and group roles", () => {
  const req = { headers: { "x-forwarded-user": "ada", "x-forwarded-groups": "curriculum-reviewers", "x-admin-proxy-token": "proxy-secret" } };
  const actor = resolveAdmin(req, {
    ADMIN_TRUSTED_PROXY_TOKEN: "proxy-secret",
    ADMIN_ROLES_JSON: JSON.stringify({
      users: { ada: ["editor"] },
      groups: { "curriculum-reviewers": ["reviewer"] },
    }),
  });
  assert.equal(actor.username, "ada");
  assert.deepEqual(actor.roles, ["editor", "reviewer"]);
});

test("production identity headers fail closed without proxy verification", () => {
  const config = {
    ADMIN_TRUSTED_PROXY_TOKEN: "proxy-secret",
    ADMIN_ROLES_JSON: JSON.stringify({ users: { ada: ["publisher"] } }),
  };
  assert.equal(resolveAdmin({ headers: { "x-forwarded-user": "ada" } }, config), null);
  assert.equal(resolveAdmin({ headers: { "x-forwarded-user": "ada", "x-admin-proxy-token": "wrong" } }, config), null);
});

test("development identity is explicit and receives publisher capabilities", () => {
  assert.equal(resolveAdmin({ headers: {} }, {}), null);
  const actor = resolveAdmin({ headers: {} }, { ADMIN_DEV_MODE: "true" });
  assert.equal(actor.username, "local-admin");
  assert.deepEqual(actor.roles, ["editor", "reviewer", "publisher"]);
  assert.equal(actor.isDevelopment, true);
});

test("local launcher uses the API-capable admin server", () => {
  const launcher = fs.readFileSync(path.join(ROOT, "serve.sh"), "utf8");
  assert.match(launcher, /ADMIN_DEV_MODE=true/);
  assert.match(launcher, /server\/server\.js/);
  assert.doesNotMatch(launcher, /python3 -m http\.server/);
});

test("local launcher fails clearly before opening a browser when its port is occupied", async () => {
  const blocker = net.createServer();
  await new Promise((resolve, reject) => {
    blocker.once("error", reject);
    blocker.listen(0, "127.0.0.1", resolve);
  });

  const port = blocker.address().port;
  const result = await new Promise((resolve, reject) => {
    const child = spawn(path.join(ROOT, "serve.sh"), [String(port)], {
      cwd: ROOT,
      env: { ...process.env, LOCAL_SERVER_NO_OPEN: "1" },
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, output }));
  });
  await new Promise((resolve) => blocker.close(resolve));

  assert.notEqual(result.code, 0);
  assert.match(result.output, new RegExp(`Port ${port} ist bereits belegt`));
  assert.doesNotMatch(result.output, /LHIND AI Lernkatalog läuft/);
});

test("canonical curriculum loads with the expected inventory", () => {
  const snapshot = loadBaseCurriculum(SITE);
  const stats = curriculumStats(snapshot);
  assert.ok(stats.courses >= 45);
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

test("an empty or remounted change-set directory is a valid clean state", () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "curriculum-admin-empty-"));
  const store = new AdminStore({ dataDir, webRoot: SITE });
  fs.rmSync(path.join(dataDir, "changesets"), { recursive: true });
  assert.deepEqual(store.list(), []);
  assert.ok(fs.existsSync(path.join(dataDir, "changesets")));
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

test("publishing files exactly match canonical manifests and compatibility globals", () => {
  const snapshot = loadBaseCurriculum(SITE);
  const files = Object.fromEntries(filesForSnapshot(snapshot).map((file) => [file.filePath, file.content]));
  assert.equal(files["site/lrn/manifests/catalog.json"], fs.readFileSync(path.join(SITE, "lrn", "manifests", "catalog.json"), "utf8"));
  assert.equal(files["site/lrn/manifests/curriculum-map.json"], fs.readFileSync(path.join(SITE, "lrn", "manifests", "curriculum-map.json"), "utf8"));
  assert.match(files["site/lrn/data.js"], /^\/\/ Generated by scripts\/build_lrn_manifests\.js/);
  assert.match(files["site/lrn/data.js"], /window\.LrnData =/);
  assert.match(files["site/lrn/curriculum-map.js"], /window\.LrnCurriculumMap =/);
});

test("GitLab publisher creates a branch, atomic manifest commit, and merge request", async () => {
  const calls = [];
  const replies = [
    [404, { message: "404 Branch Not Found" }],
    [201, { name: "curriculum/change-20260824-abcdef12" }],
    [201, { id: "0123456789abcdef" }],
    [201, { iid: 17, state: "opened", web_url: "https://gitlab.example/mr/17", title: "Curriculum update" }],
    [200, { iid: 17, state: "merged", merged_at: "2026-08-24T12:00:00Z", web_url: "https://gitlab.example/mr/17", title: "Curriculum update" }],
  ];
  const publisher = createGitLabPublisher({
    env: {
      ADMIN_GITLAB_URL: "https://gitlab.example",
      ADMIN_GITLAB_PROJECT_ID: "curriculum/project",
      ADMIN_GITLAB_TOKEN: "secret-token",
      ADMIN_GITLAB_TARGET_BRANCH: "main",
    },
    fetchFn: async (url, options) => {
      calls.push({ url, options });
      const [status, body] = replies.shift();
      return { status, text: async () => JSON.stringify(body) };
    },
  });
  const publication = await publisher.publish({
    id: "change-20260824-abcdef12",
    branch: "curriculum/change-20260824-abcdef12",
    title: "Curriculum update",
    description: "Improve the learning path.",
    snapshot: loadBaseCurriculum(SITE),
  });
  assert.equal(publication.mergeRequest.iid, 17);
  assert.equal(calls.length, 4);
  const commitBody = JSON.parse(calls[2].options.body);
  assert.equal(commitBody.actions.length, 4);
  assert.deepEqual(commitBody.actions.map((action) => action.file_path), [
    "site/lrn/manifests/catalog.json",
    "site/lrn/manifests/curriculum-map.json",
    "site/lrn/data.js",
    "site/lrn/curriculum-map.js",
  ]);
  assert.equal(calls[0].options.headers["private-token"], "secret-token");
  const merged = await publisher.refresh(publication);
  assert.equal(merged.state, "merged");
  assert.equal(merged.mergedAt, "2026-08-24T12:00:00Z");
});

test("change set becomes published only after GitLab reports a merge", () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "curriculum-admin-publication-"));
  const store = new AdminStore({ dataDir, webRoot: SITE });
  const actor = { username: "publisher" };
  const created = store.create(actor, {});
  const review = store.transition(created.id, actor, { expectedVersion: created.version, status: "review", reason: "Ready" });
  const approved = store.transition(created.id, actor, { expectedVersion: review.version, status: "approved", reason: "Reviewed" });
  const submitted = store.setPublication(created.id, actor, { expectedVersion: approved.version }, {
    provider: "gitlab",
    state: "opened",
    branch: approved.branch,
    targetBranch: "main",
    commitId: "abc",
    mergeRequest: { iid: 17, url: "https://gitlab.example/mr/17" },
  });
  assert.equal(submitted.status, "approved");
  const published = store.syncPublication(created.id, actor, { expectedVersion: submitted.version }, {
    ...submitted.publication,
    state: "merged",
    mergedAt: "2026-08-24T12:00:00Z",
  });
  assert.equal(published.status, "published");
  assert.equal(published.audit.at(-1).action, "publication.merged");
});

test("lesson repository inventory and full source files are available read-only", () => {
  const lessons = listLessons(ROOT);
  assert.ok(lessons.length >= 500);
  const lesson = loadLesson(ROOT, lessons[0].path);
  assert.ok(lesson.files["docs/en.md"]);
  assert.ok(lesson.files["quiz.json"]);
  assert.ok(Object.keys(lesson.files).some((file) => /^code\/main\./.test(file)));
});

test("lesson drafts enforce docs, quiz, code, and five-test contracts", () => {
  const questions = ["pre", "check", "check", "check", "post", "post"].map((stage, index) => ({
    stage,
    question: `Question ${index + 1}`,
    options: ["a", "b", "c", "d"],
    correct: index % 4,
    explanation: "Explained.",
  }));
  const draft = {
    path: "phases/20-agentic-engineering/99-admin-test-lesson",
    mode: "create",
    files: {
      "docs/en.md": "# Admin Test\n\n> Hook\n\n**Type:** Build\n**Languages:** Python\n**Prerequisites:** None\n**Time:** ~30 minutes\n\n## Learning Objectives\n- Explain the model\n- Build the operation\n- Compare the result\n- Validate the artifact\n",
      "quiz.json": JSON.stringify({ lesson: "99-admin-test-lesson", title: "Admin Test", questions }),
      "code/main.py": "# header 1\n# header 2\n# header 3\n# header 4\n# header 5\n",
      "code/tests/test_main.py": [1, 2, 3, 4, 5].map((index) => `def test_${index}():\n    assert True\n`).join("\n"),
    },
  };
  assert.deepEqual(validateLessonDraft(draft), []);
  const invalid = clone(draft);
  invalid.files["docs/en.md"] += "\n[TODO]\n";
  invalid.files["code/tests/test_main.py"] = "def test_one():\n    assert True\n";
  const codes = new Set(validateLessonDraft(invalid).map((item) => item.code));
  assert.ok(codes.has("lesson.todo"));
  assert.ok(codes.has("lesson.tests.count"));
});

test("staged lesson edits are versioned and require a new grill", () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "curriculum-admin-lesson-"));
  const store = new AdminStore({ dataDir, webRoot: SITE });
  const actor = { username: "editor" };
  const created = store.create(actor, {});
  const baseLesson = loadLesson(ROOT, listLessons(ROOT)[0].path);
  const staged = store.stageLesson(created.id, actor, {
    expectedVersion: created.version,
    ...baseLesson,
    existingFiles: Object.keys(baseLesson.files),
  });
  assert.equal(staged.version, created.version + 1);
  assert.equal(Object.keys(staged.lessons).length, 1);
  assert.equal(staged.grill.required, true);
  assert.equal(staged.grill.status, "pending");
  assert.equal(staged.audit.at(-1).action, "lesson.saved");
});

test("lesson publishing subjects obey the atomic conventional-commit contract", () => {
  assert.equal(lessonCommitMessage({ path: "phases/14-agent-engineering/33-instructions-as-executable-constraints", mode: "edit" }), "feat(phase-14/33): update instructions-as-executable-constraints");
  assert.equal(lessonCommitMessage({ path: "phases/20-capstones/09-new-capstone", mode: "create" }), "feat(phase-20/09): add new-capstone");
});

test("restoring history creates a new auditable draft revision", () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "curriculum-admin-restore-"));
  const store = new AdminStore({ dataDir, webRoot: SITE });
  const actor = { username: "editor" };
  const created = store.create(actor, { title: "Original" });
  const edited = store.save(created.id, actor, { expectedVersion: created.version, title: "Edited", snapshot: created.snapshot });
  const restored = store.restore(created.id, actor, { expectedVersion: edited.version, version: created.version });
  assert.equal(restored.title, "Original");
  assert.equal(restored.version, edited.version + 1);
  assert.equal(restored.status, "draft");
  assert.equal(restored.audit.at(-1).action, "history.restored");
  assert.equal(store.history(created.id)[0].version, restored.version);
});

test("base rebase preserves independent edits and reports overlapping changes", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "curriculum-admin-base-"));
  const webRoot = path.join(root, "site");
  const manifests = path.join(webRoot, "lrn", "manifests");
  fs.mkdirSync(manifests, { recursive: true });
  for (const file of ["catalog.json", "curriculum-map.json"]) fs.copyFileSync(path.join(SITE, "lrn", "manifests", file), path.join(manifests, file));
  const store = new AdminStore({ dataDir: path.join(root, "data"), webRoot });
  const actor = { username: "editor" };
  const created = store.create(actor, {});
  const local = clone(created.snapshot);
  local.catalog.courses[0].title = "Local title";
  const edited = store.save(created.id, actor, { expectedVersion: created.version, snapshot: local });

  const remoteCatalog = JSON.parse(fs.readFileSync(path.join(manifests, "catalog.json"), "utf8"));
  const added = clone(remoteCatalog.courses.at(-1));
  added.id = "LRN-99";
  added.title = "Remote course";
  remoteCatalog.courses.push(added);
  fs.writeFileSync(path.join(manifests, "catalog.json"), `${JSON.stringify(remoteCatalog, null, 2)}\n`);
  const rebased = store.rebase(created.id, actor, { expectedVersion: edited.version });
  assert.equal(rebased.snapshot.catalog.courses[0].title, "Local title");
  assert.ok(rebased.snapshot.catalog.courses.some((course) => course.id === "LRN-99"));
  assert.equal(store.baseCurrent(rebased), true);

  const nextLocal = clone(rebased.snapshot);
  nextLocal.catalog.courses[0].summary = "Local summary";
  const saved = store.save(created.id, actor, { expectedVersion: rebased.version, snapshot: nextLocal });
  remoteCatalog.courses[0].summary = "Remote summary";
  fs.writeFileSync(path.join(manifests, "catalog.json"), `${JSON.stringify(remoteCatalog, null, 2)}\n`);
  assert.throws(
    () => store.rebase(created.id, actor, { expectedVersion: saved.version }),
    (error) => error instanceof StoreError && error.code === "base.rebase.conflict" && error.details.conflicts.some((item) => item.path.includes("summary")),
  );
});
