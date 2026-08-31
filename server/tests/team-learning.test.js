const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { TeamLearningStore, TeamLearningError } = require("../team-learning-store");
const { LrnReportStore } = require("../lrn-report-store");

const ROOT = path.resolve(__dirname, "..", "..");
const SITE = path.join(ROOT, "site");
const ANON_ID = "11111111-1111-4111-8111-111111111111";

function fixture() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "team-learning-"));
  const teamStore = new TeamLearningStore({ dataDir: path.join(dataDir, "team"), webRoot: SITE, signingSecret: "test-signing-secret" });
  const reportStore = new LrnReportStore({ dataDir: path.join(dataDir, "reports"), webRoot: SITE });
  return { dataDir, teamStore, reportStore };
}

test("creates an allowlisted assignment and resolves its active join code", () => {
  const { teamStore } = fixture();
  const assignment = teamStore.create({ title: "Agent readiness", objective: "Ship safe agents", dueAt: "2026-12-01", courseIds: ["LRN-01", "UNKNOWN"] }, { username: "manager" });
  assert.equal(assignment.courseIds.length, 1);
  assert.match(assignment.code, /^[A-Z2-9]{6,12}$/);
  assert.equal(teamStore.findActiveByCode(assignment.code).id, assignment.id);
  assert.deepEqual(teamStore.resolveActiveIds([assignment.code, "FORGED"]), [assignment.id]);
});

test("rejects calendar dates that JavaScript would otherwise roll forward", () => {
  const { teamStore } = fixture();
  assert.throws(
    () => teamStore.create({ title: "Impossible date", dueAt: "2026-02-31", courseIds: ["LRN-01"] }, { username: "manager" }),
    (error) => error instanceof TeamLearningError && error.code === "team.dueAt.invalid",
  );
});

test("archived assignments can no longer be joined", () => {
  const { teamStore } = fixture();
  const assignment = teamStore.create({ title: "Team plan", courseIds: ["LRN-01"] }, { username: "manager" });
  teamStore.update(assignment.id, { ...assignment, status: "archived" }, { username: "manager" });
  assert.throws(() => teamStore.findActiveByCode(assignment.code), (error) => error instanceof TeamLearningError && error.status === 404);
});

test("issues and verifies a credential only from sufficient synchronized evidence", () => {
  const { teamStore, reportStore } = fixture();
  reportStore.save({ anonId: ANON_ID, profileId: "tc", externalLevel: 2, completedCourses: [], capabilityMastery: [{ capabilityId: 1, percent: 88, evidenceCount: 9, appliedEvidenceCount: 1 }] });
  const credential = teamStore.issueCredential({ anonId: ANON_ID, capabilityId: 1 }, reportStore);
  const verified = teamStore.verifyCredential(credential.id, credential.proof);
  assert.equal(verified.valid, true);
  assert.equal(verified.credential.percent, 88);
  assert.equal(verified.credential.appliedEvidenceCount, 1);
  assert.equal(verified.credential.assurance, "issuer-integrity-not-identity-or-proctoring");
  assert.throws(() => teamStore.verifyCredential(credential.id, "forged"), TeamLearningError);
});

test("refuses a credential when quiz evidence is insufficient", () => {
  const { teamStore, reportStore } = fixture();
  reportStore.save({ anonId: ANON_ID, profileId: "tc", externalLevel: 1, completedCourses: [], capabilityMastery: [{ capabilityId: 1, percent: 79, evidenceCount: 20, appliedEvidenceCount: 2 }] });
  assert.throws(
    () => teamStore.issueCredential({ anonId: ANON_ID, capabilityId: 1 }, reportStore),
    (error) => error instanceof TeamLearningError && error.code === "credential.evidence.insufficient" && error.status === 409,
  );
});

test("refuses quiz-only mastery without an applied self-check", () => {
  const { teamStore, reportStore } = fixture();
  reportStore.save({ anonId: ANON_ID, profileId: "tc", externalLevel: 1, completedCourses: [], capabilityMastery: [{ capabilityId: 1, percent: 95, evidenceCount: 20, appliedEvidenceCount: 0 }] });
  assert.throws(
    () => teamStore.issueCredential({ anonId: ANON_ID, capabilityId: 1 }, reportStore),
    (error) => error instanceof TeamLearningError && error.code === "credential.evidence.insufficient",
  );
});
