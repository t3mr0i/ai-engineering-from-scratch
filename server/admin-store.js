/**
 * File-backed curriculum change-set store. The directory is local during
 * development and mounted from a PVC in production. Writes are atomic and
 * every revision is retained for audit and conflict recovery.
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {
  clone,
  loadBaseCurriculum,
  curriculumStats,
  structuralSignature,
  requiresCurriculumGrill,
} = require("./admin-curriculum");
const { assertLessonPath } = require("./admin-lessons");

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

function snapshotFingerprint(snapshot) {
  return crypto.createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function mergeValues(base, local, remote, at = [], conflicts = []) {
  if (sameJson(local, base)) return remote;
  if (sameJson(remote, base) || sameJson(local, remote)) return local;
  if (Array.isArray(base) && Array.isArray(local) && Array.isArray(remote)) {
    const identified = [...base, ...local, ...remote].every((item) => item && typeof item === "object" && typeof item.id === "string");
    if (identified) {
      const baseMap = new Map(base.map((item) => [item.id, item]));
      const localMap = new Map(local.map((item) => [item.id, item]));
      const remoteMap = new Map(remote.map((item) => [item.id, item]));
      const order = [...remote.map((item) => item.id), ...local.map((item) => item.id).filter((id) => !remoteMap.has(id))];
      return order.map((id) => mergeValues(baseMap.get(id), localMap.get(id), remoteMap.get(id), [...at, id], conflicts)).filter((item) => item !== undefined);
    }
    if (base.length === local.length && base.length === remote.length) {
      return base.map((_, index) => mergeValues(base[index], local[index], remote[index], [...at, String(index)], conflicts));
    }
  }
  const plain = (value) => value && typeof value === "object" && !Array.isArray(value);
  if (plain(base) && plain(local) && plain(remote)) {
    const merged = {};
    for (const key of new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)])) {
      merged[key] = mergeValues(base[key], local[key], remote[key], [...at, key], conflicts);
    }
    return merged;
  }
  conflicts.push({ path: `/${at.join("/")}`, base, local, remote });
  return remote;
}

function defaultGrill() {
  return { required: false, status: "not_required", summary: "", runAt: null, runBy: null, override: null };
}

function normalizeRecord(record) {
  return {
    ...record,
    chat: Array.isArray(record.chat) ? record.chat : [],
    audit: Array.isArray(record.audit) ? record.audit : [],
    grill: record.grill && typeof record.grill === "object" ? { ...defaultGrill(), ...record.grill } : defaultGrill(),
    publication: record.publication && typeof record.publication === "object" ? record.publication : null,
    lessons: record.lessons && typeof record.lessons === "object" ? record.lessons : {},
  };
}

function decodePointer(pointer) {
  if (typeof pointer !== "string" || !/^\/(?:catalog|curriculumMap)(?:\/|$)/.test(pointer)) {
    throw new StoreError("proposal.path.invalid", "Der Änderungspfad liegt außerhalb des Curriculums.", 422);
  }
  const parts = pointer.slice(1).split("/").map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));
  if (parts.some((part) => ["__proto__", "prototype", "constructor"].includes(part))) {
    throw new StoreError("proposal.path.invalid", "Der Änderungspfad ist nicht zulässig.", 422);
  }
  return parts;
}

function applyJsonPointer(snapshot, proposal) {
  const next = clone(snapshot);
  const parts = decodePointer(proposal.path);
  const leaf = parts.pop();
  let parent = next;
  for (const part of parts) {
    if (parent == null || typeof parent !== "object" || !Object.prototype.hasOwnProperty.call(parent, part)) {
      throw new StoreError("proposal.path.missing", "Der vorgeschlagene Änderungspfad existiert nicht.", 422);
    }
    parent = parent[part];
  }
  if (parent == null || typeof parent !== "object") {
    throw new StoreError("proposal.path.missing", "Der vorgeschlagene Änderungspfad existiert nicht.", 422);
  }
  const arrayIndex = Array.isArray(parent) && leaf !== "-" ? Number(leaf) : null;
  if (Array.isArray(parent) && leaf !== "-" && (!Number.isInteger(arrayIndex) || arrayIndex < 0)) {
    throw new StoreError("proposal.path.invalid", "Der Array-Index des Vorschlags ist ungültig.", 422);
  }
  if (proposal.operation === "add") {
    if (Array.isArray(parent)) {
      const index = leaf === "-" ? parent.length : arrayIndex;
      if (index > parent.length) throw new StoreError("proposal.path.missing", "Der Array-Index liegt außerhalb des Curriculums.", 422);
      parent.splice(index, 0, clone(proposal.value));
    } else {
      parent[leaf] = clone(proposal.value);
    }
  } else if (proposal.operation === "replace") {
    if (!Object.prototype.hasOwnProperty.call(parent, leaf)) {
      throw new StoreError("proposal.path.missing", "Das zu ersetzende Curriculum-Feld existiert nicht.", 422);
    }
    parent[leaf] = clone(proposal.value);
  } else if (proposal.operation === "remove") {
    if (!Object.prototype.hasOwnProperty.call(parent, leaf)) {
      throw new StoreError("proposal.path.missing", "Das zu entfernende Curriculum-Feld existiert nicht.", 422);
    }
    if (Array.isArray(parent)) parent.splice(arrayIndex, 1); else delete parent[leaf];
  } else {
    throw new StoreError("proposal.operation.invalid", "Die vorgeschlagene Operation ist ungültig.", 422);
  }
  return next;
}

class AdminStore {
  constructor({ dataDir, webRoot }) {
    this.dataDir = dataDir;
    this.webRoot = webRoot;
    this.changeDir = path.join(dataDir, "changesets");
    this.historyDir = path.join(dataDir, "history");
    this.ensureDirectories();
  }

  ensureDirectories() {
    fs.mkdirSync(this.changeDir, { recursive: true });
    fs.mkdirSync(this.historyDir, { recursive: true });
  }

  baseSnapshot() {
    return loadBaseCurriculum(this.webRoot);
  }

  list() {
    this.ensureDirectories();
    const baseFingerprint = snapshotFingerprint(this.baseSnapshot());
    return fs.readdirSync(this.changeDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => normalizeRecord(JSON.parse(fs.readFileSync(path.join(this.changeDir, file), "utf8"))))
      .map(({ snapshot, chat, lessons, ...summary }) => ({ ...summary, baseCurrent: (summary.baseFingerprint || snapshotFingerprint(snapshot)) === baseFingerprint, lessonDrafts: Object.keys(lessons || {}).length, stats: curriculumStats(snapshot) }))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  get(id) {
    if (!safeId(id)) throw new StoreError("changeset.invalid", "Ungültige Änderungssatz-ID.", 400);
    const file = path.join(this.changeDir, `${id}.json`);
    if (!fs.existsSync(file)) throw new StoreError("changeset.not_found", "Änderungssatz nicht gefunden.", 404);
    const record = normalizeRecord(JSON.parse(fs.readFileSync(file, "utf8")));
    if (!record.baseFingerprint) record.baseFingerprint = snapshotFingerprint(record.snapshot);
    return record;
  }

  history(id) {
    if (!safeId(id)) throw new StoreError("changeset.invalid", "Ungültige Änderungssatz-ID.", 400);
    const directory = path.join(this.historyDir, id);
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory)
      .filter((file) => /^\d+\.json$/.test(file))
      .map((file) => normalizeRecord(JSON.parse(fs.readFileSync(path.join(directory, file), "utf8"))))
      .map(({ snapshot, chat, lessons, ...record }) => ({
        ...record,
        stats: curriculumStats(snapshot),
        lessonDrafts: Object.keys(lessons || {}).length,
      }))
      .sort((left, right) => right.version - left.version);
  }

  restore(id, actor, input) {
    const current = this.get(id);
    this.assertVersion(current, input.expectedVersion);
    const version = Number(input.version);
    if (!Number.isInteger(version) || version < 1) throw new StoreError("history.version.invalid", "Die Revision ist ungültig.", 400);
    const file = path.join(this.historyDir, id, `${version}.json`);
    if (!fs.existsSync(file)) throw new StoreError("history.version.missing", "Die Revision wurde nicht gefunden.", 404);
    const source = normalizeRecord(JSON.parse(fs.readFileSync(file, "utf8")));
    const now = new Date().toISOString();
    const next = {
      ...current,
      title: source.title,
      description: source.description,
      status: "draft",
      snapshot: clone(source.snapshot),
      baseFingerprint: source.baseFingerprint || snapshotFingerprint(source.snapshot),
      lessons: clone(source.lessons),
      grill: { ...defaultGrill(), required: true, status: "pending" },
      publication: null,
      version: current.version + 1,
      updatedAt: now,
      updatedBy: actor.username,
      audit: [...current.audit, { at: now, by: actor.username, action: "history.restored", version: current.version + 1, reason: `Revision ${version}` }],
    };
    this.writeRevision(next);
    return next;
  }

  baseCurrent(record) {
    return record.baseFingerprint === snapshotFingerprint(this.baseSnapshot());
  }

  rebase(id, actor, input) {
    const current = this.get(id);
    this.assertVersion(current, input.expectedVersion);
    const firstFile = path.join(this.historyDir, id, "1.json");
    if (!fs.existsSync(firstFile)) throw new StoreError("base.snapshot.missing", "Die ursprüngliche Basisrevision fehlt.", 409);
    const original = normalizeRecord(JSON.parse(fs.readFileSync(firstFile, "utf8"))).snapshot;
    const latest = this.baseSnapshot();
    const conflicts = [];
    const snapshot = mergeValues(original, current.snapshot, latest, [], conflicts);
    if (conflicts.length) {
      throw new StoreError("base.rebase.conflict", "Die neue veröffentlichte Basis überschneidet sich mit Entwurfsänderungen.", 409, { conflicts });
    }
    const now = new Date().toISOString();
    const next = {
      ...current,
      snapshot,
      baseFingerprint: snapshotFingerprint(latest),
      grill: requiresCurriculumGrill(latest, snapshot) ? { ...defaultGrill(), required: true, status: "pending" } : defaultGrill(),
      version: current.version + 1,
      updatedAt: now,
      updatedBy: actor.username,
      audit: [...current.audit, { at: now, by: actor.username, action: "base.rebased", version: current.version + 1 }],
    };
    this.writeRevision(next);
    return next;
  }

  create(actor, input = {}) {
    const now = new Date().toISOString();
    const id = makeId();
    const snapshot = clone(this.baseSnapshot());
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
      snapshot,
      baseFingerprint: snapshotFingerprint(snapshot),
      chat: [],
      grill: defaultGrill(),
      publication: null,
      lessons: {},
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
    const nextSnapshot = input.snapshot == null ? current.snapshot : clone(input.snapshot);
    const base = this.baseSnapshot();
    const grillRequired = requiresCurriculumGrill(base, nextSnapshot);
    const structureChanged = structuralSignature(current.snapshot) !== structuralSignature(nextSnapshot);
    const nextGrill = !grillRequired
      ? defaultGrill()
      : structureChanged
        ? { ...defaultGrill(), required: true, status: "pending" }
        : { ...current.grill, required: true, status: current.grill.status === "not_required" ? "pending" : current.grill.status };
    const next = {
      ...current,
      title: input.title == null ? current.title : String(input.title).trim().slice(0, 120),
      description: input.description == null ? current.description : String(input.description).trim().slice(0, 1000),
      snapshot: nextSnapshot,
      grill: nextGrill,
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

  appendChat(id, actor, input, response) {
    const current = this.get(id);
    this.assertVersion(current, input.expectedVersion);
    const now = new Date().toISOString();
    const turn = {
      id: response.id,
      at: now,
      by: actor.username,
      skillId: String(input.skillId || ""),
      message: String(input.message || "").trim().slice(0, 5000),
      scope: input.scope && typeof input.scope === "object" ? clone(input.scope) : { type: "curriculum" },
      response: clone(response),
    };
    let grill = current.grill;
    if (turn.skillId === "curriculum-grill" && response.gate) {
      grill = {
        ...current.grill,
        status: response.gate.status,
        summary: response.gate.summary || "",
        runAt: now,
        runBy: actor.username,
        override: null,
      };
    }
    const next = {
      ...current,
      chat: [...current.chat, turn],
      grill,
      version: current.version + 1,
      updatedAt: now,
      updatedBy: actor.username,
      audit: [...current.audit, { at: now, by: actor.username, action: `ai.${turn.skillId}`, version: current.version + 1 }],
    };
    this.writeRevision(next);
    return next;
  }

  stageLesson(id, actor, input) {
    const current = this.get(id);
    this.assertVersion(current, input.expectedVersion);
    if (current.status !== "draft") throw new StoreError("lesson.read_only", "Lessons können nur in Entwürfen bearbeitet werden.", 409);
    const lessonPath = assertLessonPath(input.path);
    const mode = input.mode === "create" ? "create" : "edit";
    const now = new Date().toISOString();
    const draft = {
      path: lessonPath,
      mode,
      files: clone(input.files || {}),
      existingFiles: Array.isArray(input.existingFiles) ? [...new Set(input.existingFiles.map(String))] : [],
      updatedAt: now,
      updatedBy: actor.username,
    };
    const next = {
      ...current,
      lessons: { ...current.lessons, [lessonPath]: draft },
      grill: { ...defaultGrill(), required: true, status: "pending" },
      version: current.version + 1,
      updatedAt: now,
      updatedBy: actor.username,
      audit: [...current.audit, {
        at: now,
        by: actor.username,
        action: mode === "create" ? "lesson.created" : "lesson.saved",
        version: current.version + 1,
        reason: lessonPath,
      }],
    };
    this.writeRevision(next);
    return next;
  }

  decideProposal(id, actor, input) {
    const current = this.get(id);
    this.assertVersion(current, input.expectedVersion);
    const decision = String(input.decision || "");
    if (!["accepted", "rejected"].includes(decision)) {
      throw new StoreError("proposal.decision.invalid", "Der Vorschlag muss angenommen oder abgelehnt werden.", 400);
    }
    const chat = clone(current.chat);
    const turn = chat.find((item) => item.id === input.messageId);
    const proposal = turn && turn.response && (turn.response.proposals || []).find((item) => item.id === input.proposalId);
    if (!proposal) throw new StoreError("proposal.not_found", "Der KI-Vorschlag wurde nicht gefunden.", 404);
    if (proposal.status !== "pending") throw new StoreError("proposal.decided", "Über diesen Vorschlag wurde bereits entschieden.", 409);
    proposal.status = decision;
    proposal.decidedAt = new Date().toISOString();
    proposal.decidedBy = actor.username;
    const snapshot = decision === "accepted" ? applyJsonPointer(current.snapshot, proposal) : current.snapshot;
    const grillRequired = requiresCurriculumGrill(this.baseSnapshot(), snapshot);
    const structureChanged = structuralSignature(current.snapshot) !== structuralSignature(snapshot);
    const now = new Date().toISOString();
    const next = {
      ...current,
      chat,
      snapshot,
      grill: !grillRequired
        ? defaultGrill()
        : structureChanged
          ? { ...defaultGrill(), required: true, status: "pending" }
          : current.grill,
      version: current.version + 1,
      updatedAt: now,
      updatedBy: actor.username,
      audit: [...current.audit, {
        at: now,
        by: actor.username,
        action: `ai.proposal.${decision}`,
        version: current.version + 1,
        reason: proposal.rationale || proposal.label,
      }],
    };
    this.writeRevision(next);
    return next;
  }

  overrideGrill(id, actor, input) {
    const current = this.get(id);
    this.assertVersion(current, input.expectedVersion);
    const reason = String(input.reason || "").trim().slice(0, 1000);
    if (!reason) throw new StoreError("grill.override.reason", "Eine Begründung für den Grill-Override ist erforderlich.", 422);
    const now = new Date().toISOString();
    const next = {
      ...current,
      grill: { ...current.grill, status: "overridden", override: { at: now, by: actor.username, reason } },
      version: current.version + 1,
      updatedAt: now,
      updatedBy: actor.username,
      audit: [...current.audit, { at: now, by: actor.username, action: "grill.overridden", version: current.version + 1, reason }],
    };
    this.writeRevision(next);
    return next;
  }

  setPublication(id, actor, input, publication) {
    const current = this.get(id);
    this.assertVersion(current, input.expectedVersion);
    if (current.publication) {
      throw new StoreError("publication.exists", "Für diesen Änderungssatz existiert bereits ein Publishing-Vorgang.", 409, { publication: current.publication });
    }
    const now = new Date().toISOString();
    const next = {
      ...current,
      publication: { ...clone(publication), createdAt: now, createdBy: actor.username, checkedAt: now },
      version: current.version + 1,
      updatedAt: now,
      updatedBy: actor.username,
      audit: [...current.audit, {
        at: now,
        by: actor.username,
        action: "publication.merge_request.created",
        version: current.version + 1,
        reason: publication.mergeRequest && publication.mergeRequest.url,
      }],
    };
    this.writeRevision(next);
    return next;
  }

  syncPublication(id, actor, input, publication) {
    const current = this.get(id);
    this.assertVersion(current, input.expectedVersion);
    if (!current.publication) throw new StoreError("publication.missing", "Für diesen Änderungssatz existiert kein Publishing-Vorgang.", 404);
    const merged = publication.state === "merged";
    if (merged && !["approved", "published"].includes(current.status)) {
      throw new StoreError("publication.status.invalid", "Nur ein freigegebener Änderungssatz kann veröffentlicht werden.", 409);
    }
    const now = new Date().toISOString();
    const next = {
      ...current,
      status: merged ? "published" : current.status,
      publication: { ...clone(publication), checkedAt: now },
      version: current.version + 1,
      updatedAt: now,
      updatedBy: actor.username,
      audit: [...current.audit, {
        at: now,
        by: actor.username,
        action: merged ? "publication.merged" : "publication.checked",
        version: current.version + 1,
        reason: publication.mergeRequest && publication.mergeRequest.url,
      }],
    };
    this.writeRevision(next);
    return next;
  }

  assertVersion(current, expectedVersion) {
    if (!Number.isInteger(expectedVersion)) {
      throw new StoreError("version.required", "Die erwartete Version fehlt.", 428);
    }
    if (expectedVersion !== current.version) {
      throw new StoreError("version.conflict", "Der Änderungssatz wurde zwischenzeitlich bearbeitet.", 409, {
        expectedVersion,
        currentVersion: current.version,
        current,
      });
    }
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

module.exports = { AdminStore, StoreError, safeId, applyJsonPointer, normalizeRecord, snapshotFingerprint, mergeValues };
