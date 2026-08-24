/**
 * File-backed curriculum change-set store. The directory is local during
 * development and mounted from a PVC in production. Writes are atomic and
 * every revision is retained for audit and conflict recovery.
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { clone, loadBaseCurriculum, curriculumStats } = require("./admin-curriculum");

class StoreError extends Error {
  constructor(code, message, status = 400, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function safeId(value) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{5,80}$/.test(value);
}

function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, file);
}

function makeId() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `change-${stamp}-${crypto.randomBytes(4).toString("hex")}`;
}

class AdminStore {
  constructor({ dataDir, webRoot }) {
    this.dataDir = dataDir;
    this.webRoot = webRoot;
    this.changeDir = path.join(dataDir, "changesets");
    this.historyDir = path.join(dataDir, "history");
    fs.mkdirSync(this.changeDir, { recursive: true });
    fs.mkdirSync(this.historyDir, { recursive: true });
  }

  baseSnapshot() {
    return loadBaseCurriculum(this.webRoot);
  }

  list() {
    return fs.readdirSync(this.changeDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => JSON.parse(fs.readFileSync(path.join(this.changeDir, file), "utf8")))
      .map(({ snapshot, chat, ...summary }) => ({ ...summary, stats: curriculumStats(snapshot) }))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  get(id) {
    if (!safeId(id)) throw new StoreError("changeset.invalid", "Ungültige Änderungssatz-ID.", 400);
    const file = path.join(this.changeDir, `${id}.json`);
    if (!fs.existsSync(file)) throw new StoreError("changeset.not_found", "Änderungssatz nicht gefunden.", 404);
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  create(actor, input = {}) {
    const now = new Date().toISOString();
    const id = makeId();
    const record = {
      id,
      title: String(input.title || "Neuer Curriculum-Entwurf").trim().slice(0, 120),
      description: String(input.description || "").trim().slice(0, 1000),
      status: "draft",
      version: 1,
      branch: `curriculum/${id}`,
      createdAt: now,
      createdBy: actor.username,
      updatedAt: now,
      updatedBy: actor.username,
      snapshot: clone(this.baseSnapshot()),
      chat: [],
      audit: [{ at: now, by: actor.username, action: "changeset.created" }],
    };
    this.writeRevision(record);
    return record;
  }

  save(id, actor, input) {
    const current = this.get(id);
    if (!Number.isInteger(input.expectedVersion)) {
      throw new StoreError("version.required", "Die erwartete Version fehlt.", 428);
    }
    if (input.expectedVersion !== current.version) {
      throw new StoreError("version.conflict", "Der Änderungssatz wurde zwischenzeitlich bearbeitet.", 409, {
        expectedVersion: input.expectedVersion,
        currentVersion: current.version,
        current,
      });
    }
    const now = new Date().toISOString();
    const next = {
      ...current,
      title: input.title == null ? current.title : String(input.title).trim().slice(0, 120),
      description: input.description == null ? current.description : String(input.description).trim().slice(0, 1000),
      snapshot: input.snapshot == null ? current.snapshot : clone(input.snapshot),
      version: current.version + 1,
      updatedAt: now,
      updatedBy: actor.username,
      audit: [
        ...current.audit,
        { at: now, by: actor.username, action: "changeset.saved", version: current.version + 1 },
      ],
    };
    this.writeRevision(next);
    return next;
  }

  transition(id, actor, input) {
    const current = this.get(id);
    if (input.expectedVersion !== current.version) {
      throw new StoreError("version.conflict", "Der Änderungssatz wurde zwischenzeitlich bearbeitet.", 409, {
        expectedVersion: input.expectedVersion,
        currentVersion: current.version,
        current,
      });
    }
    const allowed = {
      draft: ["review"],
      review: ["draft", "approved"],
      approved: ["review", "published"],
      published: ["archived"],
      archived: [],
    };
    const status = String(input.status || "");
    if (!(allowed[current.status] || []).includes(status)) {
      throw new StoreError("status.invalid", `Statuswechsel ${current.status} → ${status} ist nicht erlaubt.`, 409);
    }
    const now = new Date().toISOString();
    const next = {
      ...current,
      status,
      version: current.version + 1,
      updatedAt: now,
      updatedBy: actor.username,
      audit: [
        ...current.audit,
        {
          at: now,
          by: actor.username,
          action: `changeset.${status}`,
          version: current.version + 1,
          reason: String(input.reason || "").trim().slice(0, 1000),
        },
      ],
    };
    this.writeRevision(next);
    return next;
  }

  writeRevision(record) {
    atomicJson(path.join(this.historyDir, record.id, `${record.version}.json`), record);
    atomicJson(path.join(this.changeDir, `${record.id}.json`), record);
  }
}

module.exports = { AdminStore, StoreError, safeId };
