const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const { LrnReportStore, ReportError } = require("../lrn-report-store");

const ROOT = path.resolve(__dirname, "..", "..");
const SITE = path.join(ROOT, "site");
const VALID_ANON_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ANON_ID = "22222222-2222-4222-8222-222222222222";

function makeStore() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "lrn-report-"));
  return new LrnReportStore({ dataDir, webRoot: SITE });
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

// Spawns the real server and waits for its startup log line before resolving,
// so tests hit real HTTP dispatch instead of exercising modules in isolation.
function spawnServer(env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(ROOT, "server", "server.js")], {
      cwd: ROOT,
      env: { ...process.env, ...env },
    });
    let output = "";
    const onData = (chunk) => {
      output += chunk;
      if (/gated server on/.test(output)) {
        child.stdout.off("data", onData);
        resolve(child);
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (!/gated server on/.test(output)) {
        reject(new Error(`server exited before starting (code ${code}): ${output}`));
      }
    });
  });
}

test("save rejects an anonId that is not a UUID", () => {
  const store = makeStore();
  assert.throws(
    () => store.save({ anonId: "not-a-uuid", profileId: "tc", externalLevel: 1, completedCourses: [] }),
    ReportError,
  );
});

test("save rejects an unknown profileId", () => {
  const store = makeStore();
  assert.throws(
    () => store.save({ anonId: VALID_ANON_ID, profileId: "not-a-real-profile", externalLevel: 1, completedCourses: [] }),
    ReportError,
  );
});

test("save rejects an unknown externalLevel", () => {
  const store = makeStore();
  assert.throws(
    () => store.save({ anonId: VALID_ANON_ID, profileId: "tc", externalLevel: 99, completedCourses: [] }),
    ReportError,
  );
});

test("save drops unknown course ids instead of rejecting the whole report", () => {
  const store = makeStore();
  const record = store.save({
    anonId: VALID_ANON_ID,
    profileId: "tc",
    externalLevel: 1,
    completedCourses: ["LRN-01", "NOT-A-COURSE"],
  });
  assert.deepEqual(record.completedCourses, ["LRN-01"]);
});

test("save overwrites the previous snapshot for the same anonId", () => {
  const store = makeStore();
  store.save({ anonId: VALID_ANON_ID, profileId: "tc", externalLevel: 1, completedCourses: ["LRN-01"] });
  store.save({ anonId: VALID_ANON_ID, profileId: "tc", externalLevel: 2, completedCourses: ["LRN-01", "LRN-02"] });
  const stats = store.aggregate();
  assert.equal(stats.totalLearners, 1);
  assert.equal(stats.byLevel[2], 1);
  assert.equal(stats.courseCompletions["LRN-02"], 1);
});

test("aggregate counts learners per profile, level, and course completion", () => {
  const store = makeStore();
  store.save({ anonId: VALID_ANON_ID, profileId: "tc", externalLevel: 2, completedCourses: ["LRN-01"] });
  store.save({ anonId: OTHER_ANON_ID, profileId: "bsc", externalLevel: 1, completedCourses: ["LRN-01", "LRN-02"] });
  const stats = store.aggregate();
  assert.equal(stats.totalLearners, 2);
  assert.deepEqual(stats.byProfile, { tc: 1, bsc: 1 });
  assert.deepEqual(stats.byLevel, { 2: 1, 1: 1 });
  assert.deepEqual(stats.courseCompletions, { "LRN-01": 2, "LRN-02": 1 });
});

test("aggregate returns zero totals when no reports exist yet", () => {
  const store = makeStore();
  assert.deepEqual(store.aggregate(), { totalLearners: 0, byProfile: {}, byLevel: {}, courseCompletions: {} });
});

test("POST /api/lrn/report returns 401 without a valid gate cookie when the gate is enabled", async (t) => {
  const port = await findFreePort();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "lrn-report-http-"));
  const child = await spawnServer({
    WEB_ROOT: SITE,
    ADMIN_DATA_DIR: dataDir,
    PORT: String(port),
    SITE_PASSCODE: "test-passcode",
    GATE_SECRET: "test-gate-secret",
  });
  t.after(() => child.kill());

  const response = await fetch(`http://127.0.0.1:${port}/api/lrn/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anonId: VALID_ANON_ID, profileId: "tc", externalLevel: 1, completedCourses: [] }),
  });
  assert.equal(response.status, 401);
});

test("GET /api/admin/lrn-stats returns 401 without an admin identity", async (t) => {
  const port = await findFreePort();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "lrn-report-http-"));
  const child = await spawnServer({
    WEB_ROOT: SITE,
    ADMIN_DATA_DIR: dataDir,
    PORT: String(port),
    GATE_DISABLED: "true",
  });
  t.after(() => child.kill());

  const response = await fetch(`http://127.0.0.1:${port}/api/admin/lrn-stats`);
  assert.equal(response.status, 401);
});
