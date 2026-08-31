/**
 * Persistent team assignments and evidence-backed skill credentials.
 * Assignments use join codes and anonymous browser ids; credentials prove
 * issuer integrity, not employee identity or proctored assessment status.
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { loadBaseCurriculum } = require("./admin-curriculum");

const CODE_RE = /^[A-Z2-9]{6,12}$/;
const ID_RE = /^[a-z0-9][a-z0-9-]{5,63}$/;
const ANON_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class TeamLearningError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = "TeamLearningError";
    this.code = code;
    this.status = status;
  }
}

function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, file);
}

function text(value, field, maximum, required = false) {
  if (value == null) value = "";
  if (typeof value !== "string") throw new TeamLearningError(`team.${field}.invalid`, `${field} muss Text sein.`);
  const clean = value.trim();
  if (required && !clean) throw new TeamLearningError(`team.${field}.required`, `${field} ist erforderlich.`);
  if (clean.length > maximum) throw new TeamLearningError(`team.${field}.too_long`, `${field} ist zu lang.`);
  return clean;
}

function dueDate(value) {
  const clean = text(value, "dueAt", 10);
  if (!clean) return "";
  const parsed = new Date(`${clean}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== clean) {
    throw new TeamLearningError("team.dueAt.invalid", "Das Fälligkeitsdatum ist ungültig.");
  }
  return clean;
}

class TeamLearningStore {
  constructor({ dataDir, webRoot, signingSecret }) {
    this.dataDir = path.resolve(dataDir);
    this.webRoot = path.resolve(webRoot);
    this.assignmentFile = path.join(this.dataDir, "assignments.json");
    this.credentialDir = path.join(this.dataDir, "credentials");
    this.signingSecret = String(signingSecret || "");
  }

  catalog() {
    if (!this._catalog) this._catalog = loadBaseCurriculum(this.webRoot).catalog;
    return this._catalog;
  }

  assignments() {
    try {
      const rows = JSON.parse(fs.readFileSync(this.assignmentFile, "utf8"));
      return Array.isArray(rows) ? rows : [];
    } catch (_) {
      return [];
    }
  }

  writeAssignments(rows) {
    atomicJson(this.assignmentFile, rows);
  }

  courseIds(value) {
    const known = new Set((this.catalog().courses || []).map((course) => course.id));
    if (!Array.isArray(value) || !value.length || value.length > 24) {
      throw new TeamLearningError("team.courseIds.invalid", "Wähle zwischen 1 und 24 Kursen.");
    }
    const unique = [...new Set(value.map(String).filter((id) => known.has(id)))];
    if (!unique.length) throw new TeamLearningError("team.courseIds.invalid", "Die Zuweisung enthält keine bekannten Kurse.");
    return unique;
  }

  newCode(rows) {
    const used = new Set(rows.map((row) => row.code));
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const code = crypto.randomBytes(6).toString("base64url").toUpperCase().replace(/[01_-]/g, "A").slice(0, 8);
      if (CODE_RE.test(code) && !used.has(code)) return code;
    }
    throw new TeamLearningError("team.code.unavailable", "Es konnte kein eindeutiger Beitrittscode erzeugt werden.", 503);
  }

  normalize(payload, current = null) {
    const status = ["draft", "active", "archived"].includes(payload.status) ? payload.status : current && current.status || "active";
    return {
      title: text(payload.title, "title", 120, true),
      objective: text(payload.objective, "objective", 600),
      dueAt: dueDate(payload.dueAt),
      courseIds: this.courseIds(payload.courseIds),
      status,
    };
  }

  create(payload, actor) {
    const rows = this.assignments();
    if (rows.length >= 500) throw new TeamLearningError("team.capacity.exceeded", "Es sind zu viele Team-Zuweisungen gespeichert.", 429);
    const now = new Date().toISOString();
    const record = {
      id: `team-${crypto.randomUUID()}`,
      code: this.newCode(rows),
      ...this.normalize(payload || {}),
      createdAt: now,
      createdBy: actor && actor.username || "unknown",
      updatedAt: now,
      updatedBy: actor && actor.username || "unknown",
    };
    rows.push(record);
    this.writeAssignments(rows);
    return record;
  }

  update(id, payload, actor) {
    if (!ID_RE.test(String(id || ""))) throw new TeamLearningError("team.id.invalid", "Die Zuweisungs-ID ist ungültig.");
    const rows = this.assignments();
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) throw new TeamLearningError("team.not_found", "Team-Zuweisung nicht gefunden.", 404);
    rows[index] = {
      ...rows[index],
      ...this.normalize(payload || {}, rows[index]),
      updatedAt: new Date().toISOString(),
      updatedBy: actor && actor.username || "unknown",
    };
    this.writeAssignments(rows);
    return rows[index];
  }

  findActiveByCode(value) {
    const code = String(value || "").trim().toUpperCase();
    if (!CODE_RE.test(code)) throw new TeamLearningError("team.code.invalid", "Der Beitrittscode ist ungültig.");
    const row = this.assignments().find((assignment) => assignment.code === code && assignment.status === "active");
    if (!row) throw new TeamLearningError("team.not_found", "Keine aktive Team-Zuweisung für diesen Code gefunden.", 404);
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      objective: row.objective,
      dueAt: row.dueAt,
      courseIds: row.courseIds,
    };
  }

  resolveActiveIds(codes) {
    const rows = this.assignments();
    const active = new Map(rows.filter((row) => row.status === "active").map((row) => [row.code, row.id]));
    return [...new Set((Array.isArray(codes) ? codes : []).slice(0, 16)
      .map((code) => String(code || "").trim().toUpperCase())
      .map((code) => active.get(code))
      .filter(Boolean))];
  }

  signingKey() {
    if (!this.signingSecret) throw new TeamLearningError("credential.not_configured", "Skill-Nachweise sind serverseitig nicht konfiguriert.", 503);
    return this.signingSecret;
  }

  proof(record) {
    const canonical = ["aifs-credential-v1", record.id, record.capabilityId, record.capabilityTitle, record.learnerRef, record.percent, record.evidenceCount, record.appliedEvidenceCount, record.evidenceType, record.assurance, record.issuedAt].join("\n");
    return crypto.createHmac("sha256", this.signingKey()).update(canonical).digest("base64url");
  }

  issueCredential(payload, reportStore) {
    if (!payload || !ANON_ID_RE.test(String(payload.anonId || ""))) {
      throw new TeamLearningError("credential.anonId.invalid", "Die anonyme Lernenden-ID ist ungültig.");
    }
    const capabilityId = Number(payload.capabilityId);
    const capability = (this.catalog().capabilities || []).find((row) => Number(row.id) === capabilityId);
    if (!capability) throw new TeamLearningError("credential.capability.invalid", "Die Capability ist unbekannt.");
    const report = reportStore.get(payload.anonId);
    if (!report) throw new TeamLearningError("credential.evidence.missing", "Es liegt noch keine synchronisierte Quiz-Evidenz vor.", 409);
    const evidence = (report.capabilityMastery || []).find((row) => Number(row.capabilityId) === capabilityId);
    if (!evidence || evidence.percent < 80 || evidence.evidenceCount < 6 || evidence.appliedEvidenceCount < 1) {
      throw new TeamLearningError("credential.evidence.insufficient", "Für diesen Nachweis werden mindestens 80 % Mastery, sechs Quizbeobachtungen und ein selbst gelöster ausführbarer Self-Check benötigt.", 409);
    }
    const record = {
      id: `cred-${crypto.randomUUID()}`,
      capabilityId,
      capabilityTitle: String(capability.title || `Capability ${capabilityId}`),
      learnerRef: crypto.createHash("sha256").update(String(payload.anonId)).digest("hex").slice(0, 12),
      percent: evidence.percent,
      evidenceCount: evidence.evidenceCount,
      appliedEvidenceCount: evidence.appliedEvidenceCount,
      evidenceType: "self-directed-quiz-mastery",
      assurance: "issuer-integrity-not-identity-or-proctoring",
      issuedAt: new Date().toISOString(),
    };
    const proof = this.proof(record);
    atomicJson(path.join(this.credentialDir, `${record.id}.json`), record);
    return { ...record, proof };
  }

  verifyCredential(id, proof) {
    if (!/^cred-[0-9a-f-]{36}$/.test(String(id || ""))) throw new TeamLearningError("credential.id.invalid", "Die Nachweis-ID ist ungültig.");
    let record;
    try { record = JSON.parse(fs.readFileSync(path.join(this.credentialDir, `${id}.json`), "utf8")); }
    catch (_) { throw new TeamLearningError("credential.not_found", "Skill-Nachweis nicht gefunden.", 404); }
    const expected = Buffer.from(this.proof(record));
    const supplied = Buffer.from(String(proof || ""));
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
      throw new TeamLearningError("credential.proof.invalid", "Der Skill-Nachweis konnte nicht verifiziert werden.", 400);
    }
    return { valid: true, credential: record };
  }
}

module.exports = { TeamLearningStore, TeamLearningError, CODE_RE };
