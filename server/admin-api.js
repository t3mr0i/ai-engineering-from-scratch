/**
 * Same-origin HTTP API for the curriculum admin. It keeps authorization,
 * validation, optimistic concurrency, and error envelopes consistent while
 * delegating curriculum and persistence logic to small testable modules.
 */

const path = require("node:path");
const crypto = require("node:crypto");
const fs = require("node:fs");
const { resolveAdmin, can } = require("./admin-auth");
const { AdminStore, StoreError } = require("./admin-store");
const { LrnReportStore } = require("./lrn-report-store");
const { TeamLearningStore, TeamLearningError } = require("./team-learning-store");
const { validateCurriculum, curriculumStats } = require("./admin-curriculum");
const { createAdminAi, AdminAiError } = require("./admin-ai");
const { createGitLabPublisher, GitLabError } = require("./admin-gitlab");
const { LessonError, listLessons, loadLesson, validateLessonDraft } = require("./admin-lessons");

const MAX_BODY_BYTES = 5_000_000;

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(data);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new StoreError("request.too_large", "Die Anfrage ist zu groß.", 413));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (_) {
        reject(new StoreError("request.invalid_json", "Die Anfrage enthält ungültiges JSON.", 400));
      }
    });
    req.on("error", reject);
  });
}

function requireMethod(req, method) {
  if (req.method !== method) throw new StoreError("method.not_allowed", "Methode nicht erlaubt.", 405);
}

function requireRole(actor, role) {
  if (!can(actor, role)) throw new StoreError("admin.forbidden", `Die Rolle ${role} ist erforderlich.`, 403);
}

function createAdminApi(options = {}) {
  const env = options.env || process.env;
  const webRoot = options.webRoot || path.resolve(env.WEB_ROOT || path.join(__dirname, "..", "site"));
  const dataDir = options.dataDir || path.resolve(env.ADMIN_DATA_DIR || path.join(__dirname, "..", ".admin-data"));
  const store = options.store || new AdminStore({ dataDir, webRoot });
  const reportStore = options.reportStore || new LrnReportStore({ dataDir: path.join(dataDir, "lrn-reports"), webRoot });
  const teamStore = options.teamStore || new TeamLearningStore({ dataDir: path.join(dataDir, "team-learning"), webRoot, signingSecret: env.CREDENTIAL_SIGNING_SECRET || env.GATE_SECRET });
  const ai = options.ai || createAdminAi({ env, fetchFn: options.fetchFn });
  const publisher = options.publisher || createGitLabPublisher({ env, fetchFn: options.fetchFn });
  const repoRoot = options.repoRoot || path.resolve(webRoot, "..");
  const glossaryFile = path.join(repoRoot, "glossary", "terms.md");
  const glossary = fs.existsSync(glossaryFile) ? fs.readFileSync(glossaryFile, "utf8") : "";

  return async function handleAdminApi(req, res, pathOnly) {
    if (!pathOnly.startsWith("/api/admin/")) return false;
    const errorId = crypto.randomBytes(5).toString("hex");
    try {
      const actor = resolveAdmin(req, env);
      if (!actor) throw new StoreError("admin.unauthorized", "Keine Admin-Berechtigung vorhanden.", 401);

      if (pathOnly === "/api/admin/me") {
        requireMethod(req, "GET");
        sendJson(res, 200, { ok: true, actor });
        return true;
      }

      if (pathOnly === "/api/admin/lrn-stats") {
        requireMethod(req, "GET");
        sendJson(res, 200, { ok: true, stats: reportStore.aggregate() });
        return true;
      }

      if (pathOnly === "/api/admin/team-assignments") {
        if (req.method === "GET") {
          sendJson(res, 200, { ok: true, assignments: teamStore.assignments(), reporting: reportStore.aggregate().assignmentProgress });
          return true;
        }
        requireMethod(req, "POST");
        requireRole(actor, "editor");
        const body = await readJson(req);
        sendJson(res, 201, { ok: true, assignment: teamStore.create(body, actor) });
        return true;
      }

      const teamMatch = pathOnly.match(/^\/api\/admin\/team-assignments\/(team-[0-9a-f-]{36})$/);
      if (teamMatch) {
        requireMethod(req, "PUT");
        requireRole(actor, "editor");
        const body = await readJson(req);
        sendJson(res, 200, { ok: true, assignment: teamStore.update(teamMatch[1], body, actor) });
        return true;
      }

      if (pathOnly === "/api/admin/curriculum") {
        requireMethod(req, "GET");
        const snapshot = store.baseSnapshot();
        sendJson(res, 200, {
          ok: true,
          snapshot,
          stats: curriculumStats(snapshot),
          issues: validateCurriculum(snapshot),
        });
        return true;
      }

      if (pathOnly === "/api/admin/ai/skills") {
        requireMethod(req, "GET");
        sendJson(res, 200, { ok: true, skills: ai.skills() });
        return true;
      }

      if (pathOnly === "/api/admin/publish/config") {
        requireMethod(req, "GET");
        sendJson(res, 200, { ok: true, configured: publisher.configured() });
        return true;
      }

      if (pathOnly === "/api/admin/lessons") {
        requireMethod(req, "GET");
        const url = new URL(req.url, "http://admin.local");
        const lessonPath = url.searchParams.get("path");
        if (!lessonPath) {
          sendJson(res, 200, { ok: true, lessons: listLessons(repoRoot) });
          return true;
        }
        const changeId = url.searchParams.get("changeset");
        const changeset = changeId ? store.get(changeId) : null;
        const staged = changeset && changeset.lessons && changeset.lessons[lessonPath];
        const lesson = staged || loadLesson(repoRoot, lessonPath);
        sendJson(res, 200, { ok: true, lesson, issues: validateLessonDraft(lesson), staged: Boolean(staged) });
        return true;
      }

      if (pathOnly === "/api/admin/changesets") {
        if (req.method === "GET") {
          sendJson(res, 200, { ok: true, changesets: store.list() });
          return true;
        }
        requireMethod(req, "POST");
        requireRole(actor, "editor");
        const body = await readJson(req);
        const changeset = store.create(actor, body);
        sendJson(res, 201, { ok: true, changeset });
        return true;
      }

      const match = pathOnly.match(/^\/api\/admin\/changesets\/([a-z0-9-]+)(?:\/(status|validate|chat|proposals|grill-override|publish|publication|lessons|history|restore|rebase))?$/);
      if (!match) throw new StoreError("route.not_found", "Admin-Route nicht gefunden.", 404);
      const [, id, action] = match;

      if (!action && req.method === "GET") {
        const changeset = store.get(id);
        sendJson(res, 200, { ok: true, changeset, baseCurrent: store.baseCurrent(changeset) });
        return true;
      }
      if (action === "history" && req.method === "GET") {
        sendJson(res, 200, { ok: true, history: store.history(id) });
        return true;
      }
      requireRole(actor, "editor");
      const body = await readJson(req);

      if (!action && req.method === "PUT") {
        const issues = validateCurriculum(body.snapshot);
        const changeset = store.save(id, actor, body);
        sendJson(res, 200, { ok: true, changeset, issues });
        return true;
      }

      if (action === "validate") {
        requireMethod(req, "POST");
        const current = store.get(id);
        const snapshot = body.snapshot || current.snapshot;
        const lessonIssues = Object.values(current.lessons || {}).flatMap((draft) => validateLessonDraft(draft).map((item) => ({ ...item, path: `${draft.path}/${item.path}` })));
        const issues = [...validateCurriculum(snapshot), ...lessonIssues];
        sendJson(res, 200, {
          ok: true,
          issues,
          stats: curriculumStats(snapshot),
          valid: !issues.some((item) => item.severity === "error"),
        });
        return true;
      }

      if (action === "chat") {
        requireMethod(req, "POST");
        const current = store.get(id);
        const response = await ai.run({
          changeset: current,
          message: body.message,
          skillId: body.skillId,
          scope: body.scope,
          glossary,
        });
        const changeset = store.appendChat(id, actor, body, response);
        sendJson(res, 200, { ok: true, response, changeset });
        return true;
      }

      if (action === "proposals") {
        requireMethod(req, "POST");
        const current = store.get(id);
        if (current.status !== "draft") {
          throw new StoreError("proposal.read_only", "KI-Vorschläge können nur in Entwürfen entschieden werden.", 409);
        }
        const changeset = store.decideProposal(id, actor, body);
        const issues = validateCurriculum(changeset.snapshot);
        sendJson(res, 200, { ok: true, changeset, issues });
        return true;
      }

      if (action === "grill-override") {
        requireMethod(req, "POST");
        requireRole(actor, "reviewer");
        const changeset = store.overrideGrill(id, actor, body);
        sendJson(res, 200, { ok: true, changeset });
        return true;
      }

      if (action === "lessons") {
        requireMethod(req, "POST");
        const draft = { path: body.path, mode: body.mode, files: body.files };
        const issues = validateLessonDraft(draft);
        const existingFiles = body.mode === "create" ? [] : Object.keys(loadLesson(repoRoot, body.path).files);
        const changeset = store.stageLesson(id, actor, { ...body, existingFiles });
        sendJson(res, 200, { ok: true, changeset, lesson: changeset.lessons[body.path], issues });
        return true;
      }

      if (action === "restore") {
        requireMethod(req, "POST");
        const changeset = store.restore(id, actor, body);
        const issues = validateCurriculum(changeset.snapshot);
        sendJson(res, 200, { ok: true, changeset, issues });
        return true;
      }

      if (action === "rebase") {
        requireMethod(req, "POST");
        const changeset = store.rebase(id, actor, body);
        const issues = validateCurriculum(changeset.snapshot);
        sendJson(res, 200, { ok: true, changeset, issues, baseCurrent: true });
        return true;
      }

      if (action === "publish") {
        requireMethod(req, "POST");
        requireRole(actor, "publisher");
        const current = store.get(id);
        if (current.status !== "approved") {
          throw new StoreError("publication.status.invalid", "Nur ein freigegebener Änderungssatz kann einen Merge Request öffnen.", 409);
        }
        if (!store.baseCurrent(current)) {
          throw new StoreError("base.outdated", "Der veröffentlichte Curriculum-Stand hat sich geändert. Rebase den Änderungssatz vor dem Publishing.", 409);
        }
        const lessonIssues = Object.values(current.lessons || {}).flatMap(validateLessonDraft);
        if (lessonIssues.some((item) => item.severity === "error")) {
          throw new StoreError("publication.lessons.invalid", "Lesson-Entwürfe verletzen den Repository-Vertrag.", 422, { issues: lessonIssues });
        }
        store.assertVersion(current, body.expectedVersion);
        if (current.publication) {
          throw new StoreError("publication.exists", "Für diesen Änderungssatz existiert bereits ein Merge Request.", 409, { publication: current.publication });
        }
        const publication = await publisher.publish(current);
        const changeset = store.setPublication(id, actor, body, publication);
        sendJson(res, 201, { ok: true, changeset, publication: changeset.publication });
        return true;
      }

      if (action === "publication") {
        requireMethod(req, "POST");
        requireRole(actor, "publisher");
        const current = store.get(id);
        store.assertVersion(current, body.expectedVersion);
        const publication = await publisher.refresh(current.publication);
        const changeset = store.syncPublication(id, actor, body, publication);
        sendJson(res, 200, { ok: true, changeset, publication: changeset.publication });
        return true;
      }

      if (action === "status") {
        requireMethod(req, "POST");
        const current = store.get(id);
        if (body.status === "review") {
          if (!store.baseCurrent(current)) {
            throw new StoreError("base.outdated", "Der veröffentlichte Curriculum-Stand hat sich geändert. Rebase den Änderungssatz vor dem Review.", 409);
          }
          const issues = validateCurriculum(current.snapshot);
          if (issues.some((item) => item.severity === "error")) {
            throw new StoreError("curriculum.invalid", "Blockierende Fehler verhindern das Review.", 422, { issues });
          }
          const lessonIssues = Object.values(current.lessons || {}).flatMap(validateLessonDraft);
          if (lessonIssues.some((item) => item.severity === "error")) {
            throw new StoreError("lesson.invalid", "Blockierende Lesson-Fehler verhindern das Review.", 422, { issues: lessonIssues });
          }
          if (current.grill.required && !["passed", "overridden"].includes(current.grill.status)) {
            throw new StoreError("grill.required", "Der verpflichtende Curriculum-Grill muss abgeschlossen oder begründet übersteuert werden.", 422, { grill: current.grill });
          }
        }
        if (body.status === "approved") requireRole(actor, "reviewer");
        if (body.status === "published") {
          throw new StoreError("publication.merge_required", "Veröffentlichung ist nur über einen gemergten GitLab Merge Request möglich.", 409);
        }
        if (body.status === "archived") requireRole(actor, "publisher");
        const changeset = store.transition(id, actor, body);
        sendJson(res, 200, { ok: true, changeset });
        return true;
      }

      throw new StoreError("method.not_allowed", "Methode nicht erlaubt.", 405);
    } catch (error) {
      const known = error instanceof StoreError || error instanceof AdminAiError || error instanceof GitLabError || error instanceof LessonError || error instanceof TeamLearningError;
      if (!known) console.error(`[admin:${errorId}]`, error);
      sendJson(res, known ? error.status : 500, {
        ok: false,
        error: {
          code: known ? error.code : "admin.internal",
          message: known ? error.message : "Die Admin-Anfrage konnte nicht verarbeitet werden.",
          details: known ? error.details : undefined,
          id: errorId,
        },
      });
      return true;
    }
  };
}

module.exports = { createAdminApi, readJson, sendJson };
