/**
 * Same-origin HTTP API for the curriculum admin. It keeps authorization,
 * validation, optimistic concurrency, and error envelopes consistent while
 * delegating curriculum and persistence logic to small testable modules.
 */

const path = require("node:path");
const crypto = require("node:crypto");
const { resolveAdmin, can } = require("./admin-auth");
const { AdminStore, StoreError } = require("./admin-store");
const { validateCurriculum, curriculumStats } = require("./admin-curriculum");

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

      const match = pathOnly.match(/^\/api\/admin\/changesets\/([a-z0-9-]+)(?:\/(status|validate))?$/);
      if (!match) throw new StoreError("route.not_found", "Admin-Route nicht gefunden.", 404);
      const [, id, action] = match;

      if (!action && req.method === "GET") {
        sendJson(res, 200, { ok: true, changeset: store.get(id) });
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
        const snapshot = body.snapshot || store.get(id).snapshot;
        const issues = validateCurriculum(snapshot);
        sendJson(res, 200, {
          ok: true,
          issues,
          stats: curriculumStats(snapshot),
          valid: !issues.some((item) => item.severity === "error"),
        });
        return true;
      }

      if (action === "status") {
        requireMethod(req, "POST");
        const current = store.get(id);
        if (body.status === "review") {
          const issues = validateCurriculum(current.snapshot);
          if (issues.some((item) => item.severity === "error")) {
            throw new StoreError("curriculum.invalid", "Blockierende Fehler verhindern das Review.", 422, { issues });
          }
        }
        if (body.status === "approved") requireRole(actor, "reviewer");
        if (["published", "archived"].includes(body.status)) requireRole(actor, "publisher");
        const changeset = store.transition(id, actor, body);
        sendJson(res, 200, { ok: true, changeset });
        return true;
      }

      throw new StoreError("method.not_allowed", "Methode nicht erlaubt.", 405);
    } catch (error) {
      const known = error instanceof StoreError;
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
