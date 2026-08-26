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
    const profileIds = new Set((catalog.profiles || []).map((item) => item.id));
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
    return { anonId: payload.anonId, profileId: payload.profileId, externalLevel, completedCourses };
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
    for (const report of reports) {
      byProfile[report.profileId] = (byProfile[report.profileId] || 0) + 1;
      byLevel[report.externalLevel] = (byLevel[report.externalLevel] || 0) + 1;
      for (const courseId of report.completedCourses) {
        courseCompletions[courseId] = (courseCompletions[courseId] || 0) + 1;
      }
    }
    return { totalLearners: reports.length, byProfile, byLevel, courseCompletions };
  }
}

module.exports = { LrnReportStore, ReportError };
