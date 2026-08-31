/**
 * File-backed anonymous progress-report store. One JSON file per anonymous
 * id, overwritten on every sync — a snapshot of "where this learner
 * currently stands", not an event log. See
 * docs/superpowers/specs/2026-08-26-anonymous-progress-reporting-design.md.
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { loadBaseCurriculum } = require("./admin-curriculum");

const ANON_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Upper bound on distinct anonymous learners tracked at once — protects disk
// and aggregate() cost against unbounded pseudonym cardinality. Updating an
// existing anonId's snapshot is never blocked by this cap.
const MAX_REPORTS = 50000;

class ReportError extends Error {
  constructor(code, message, status = 400) {
    super(message);
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

class LrnReportStore {
  constructor({ dataDir, webRoot }) {
    this.reportsDir = path.join(dataDir, "reports");
    this.webRoot = webRoot;
  }

  catalog() {
    if (!this._catalog) {
      this._catalog = loadBaseCurriculum(this.webRoot).catalog;
    }
    return this._catalog;
  }

  validate(payload) {
    payload = payload && typeof payload === "object" ? payload : {};
    const catalog = this.catalog();
    const profileIds = new Set((catalog.roles || []).map((item) => item.id));
    const levelIds = new Set((catalog.levels || []).map((item) => item.id));
    const courseIds = new Set((catalog.courses || []).map((item) => item.id));

    if (typeof payload.anonId !== "string" || !ANON_ID_RE.test(payload.anonId)) {
      throw new ReportError("report.anonId.invalid", "Die anonyme ID ist ungültig.", 400);
    }
    if (!profileIds.has(payload.profileId)) {
      throw new ReportError("report.profileId.invalid", "Das Profil ist unbekannt.", 400);
    }
    const externalLevel = Number(payload.externalLevel);
    if (!levelIds.has(externalLevel)) {
      throw new ReportError("report.externalLevel.invalid", "Das Level ist unbekannt.", 400);
    }
    const completedCourses = Array.isArray(payload.completedCourses)
      ? [...new Set(payload.completedCourses.filter((id) => courseIds.has(id)))]
      : [];
    const assignmentIds = Array.isArray(payload.assignmentIds)
      ? [...new Set(payload.assignmentIds.map(String).filter((id) => /^team-[0-9a-f-]{36}$/.test(id)))].slice(0, 16)
      : [];
    const capabilityIds = new Set((catalog.capabilities || []).map((item) => Number(item.id)));
    const capabilityMastery = Array.isArray(payload.capabilityMastery)
      ? payload.capabilityMastery.slice(0, 64).map((row) => {
        if (!row || !capabilityIds.has(Number(row.capabilityId))) return null;
        return {
          capabilityId: Number(row.capabilityId),
          percent: Math.max(0, Math.min(100, Math.round(Number(row.percent) || 0))),
          evidenceCount: Math.max(0, Math.min(10_000, Math.floor(Number(row.evidenceCount) || 0))),
          appliedEvidenceCount: Math.max(0, Math.min(1_000, Math.floor(Number(row.appliedEvidenceCount) || 0))),
        };
      }).filter(Boolean)
      : [];
    return { anonId: payload.anonId, profileId: payload.profileId, externalLevel, completedCourses, assignmentIds, capabilityMastery };
  }

  get(anonId) {
    if (typeof anonId !== "string" || !ANON_ID_RE.test(anonId)) return null;
    try { return JSON.parse(fs.readFileSync(path.join(this.reportsDir, `${anonId}.json`), "utf8")); }
    catch (_) { return null; }
  }

  save(payload) {
    const clean = this.validate(payload);
    const file = path.join(this.reportsDir, `${clean.anonId}.json`);
    if (!fs.existsSync(file)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
      const count = fs.readdirSync(this.reportsDir).filter((name) => name.endsWith(".json")).length;
      if (count >= MAX_REPORTS) {
        throw new ReportError("report.capacity.exceeded", "Die maximale Anzahl an Lernenden-Reports ist erreicht.", 429);
      }
    }
    const record = { ...clean, updatedAt: new Date().toISOString() };
    atomicJson(file, record);
    return record;
  }

  aggregate() {
    fs.mkdirSync(this.reportsDir, { recursive: true });
    const files = fs.readdirSync(this.reportsDir).filter((name) => name.endsWith(".json"));
    const reports = [];
    for (const name of files) {
      try {
        reports.push(JSON.parse(fs.readFileSync(path.join(this.reportsDir, name), "utf8")));
      } catch (error) {
        continue; // a corrupt/partial report file is best-effort telemetry, not fatal
      }
    }

    const byProfile = {};
    const byLevel = {};
    const courseCompletions = {};
    const assignmentProgress = {};
    for (const report of reports) {
      byProfile[report.profileId] = (byProfile[report.profileId] || 0) + 1;
      byLevel[report.externalLevel] = (byLevel[report.externalLevel] || 0) + 1;
      for (const courseId of report.completedCourses) {
        courseCompletions[courseId] = (courseCompletions[courseId] || 0) + 1;
      }
      for (const assignmentId of report.assignmentIds || []) {
        if (!assignmentProgress[assignmentId]) assignmentProgress[assignmentId] = { learners: 0, courseCompletions: {}, masteryTotal: 0, masterySignals: 0 };
        const team = assignmentProgress[assignmentId];
        team.learners += 1;
        for (const courseId of report.completedCourses) team.courseCompletions[courseId] = (team.courseCompletions[courseId] || 0) + 1;
        for (const row of report.capabilityMastery || []) {
          team.masteryTotal += row.percent;
          team.masterySignals += 1;
        }
      }
    }
    Object.values(assignmentProgress).forEach((team) => {
      team.averageMastery = team.masterySignals ? Math.round(team.masteryTotal / team.masterySignals) : 0;
      delete team.masteryTotal;
    });
    return { totalLearners: reports.length, byProfile, byLevel, courseCompletions, assignmentProgress };
  }
}

module.exports = { LrnReportStore, ReportError };
