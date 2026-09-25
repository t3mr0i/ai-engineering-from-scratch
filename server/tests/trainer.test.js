const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { validServiceUrl } = require("../trainer-api");

const root = path.resolve(__dirname, "..", "..");

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

test("service links accept complete HTTPS URLs or clearing, never active or credential-bearing URLs", () => {
  assert.equal(validServiceUrl("https://service.example.org/course?id=12"), true);
  assert.equal(validServiceUrl(""), true);
  assert.equal(validServiceUrl("javascript:alert(1)"), false);
  assert.equal(validServiceUrl("http://service.example.org/course"), false);
  assert.equal(validServiceUrl("https://user:pass@service.example.org/course"), false);
});

test("every catalog visitor can maintain links without an SSO identity", async (t) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "trainer-links-"));
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(root, "server", "server.js")], {
    cwd: root,
    env: {
      ...process.env, PORT: String(port), BIND_HOST: "127.0.0.1", GATE_DISABLED: "true",
      ADMIN_DEV_MODE: "false", ADMIN_DATA_DIR: dataDir,
    },
  });
  t.after(() => { child.kill(); fs.rmSync(dataDir, { recursive: true, force: true }); });
  await new Promise((resolve, reject) => {
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; if (output.includes("gated server on")) resolve(); });
    child.once("error", reject);
    child.once("exit", () => reject(new Error("server exited before ready")));
  });
  const base = `http://127.0.0.1:${port}`;
  assert.equal((await fetch(`${base}/trainer.html`)).status, 200);
  assert.equal((await fetch(`${base}/trainer.js`)).status, 200);
  assert.equal((await fetch(`${base}/api/admin/curriculum`)).status, 401);
  const response = await fetch(`${base}/api/trainer/modules`);
  assert.equal(response.status, 200);
  const modules = (await response.json()).modules;
  assert.ok(modules.length >= 45);
  const id = modules[0].id;
  assert.equal(modules[0].servicePortalUrl, "");
  const saved = await fetch(`${base}/api/trainer/modules/${id}`, {
    method: "PUT", headers: { "content-type": "application/json" },
    body: JSON.stringify({ servicePortalUrl: "https://service.example.org/training/12", expectedUrl: "" }),
  });
  assert.equal(saved.status, 200);
  const updated = (await (await fetch(`${base}/api/trainer/modules`)).json()).modules;
  assert.equal(updated.find((module) => module.id === id).servicePortalUrl, "https://service.example.org/training/12");
  assert.equal((await fetch(`${base}/api/trainer/modules/${id}`, {
    method: "PUT", headers: { "content-type": "application/json" },
    body: JSON.stringify({ servicePortalUrl: "https://service.example.org/stale", expectedUrl: "" }),
  })).status, 409);
  assert.equal((await fetch(`${base}/api/trainer/modules/${id}`, {
    method: "PUT", headers: { "content-type": "application/json" },
    body: JSON.stringify({ servicePortalUrl: "javascript:alert(1)" }),
  })).status, 400);
  assert.equal((await fetch(`${base}/api/trainer/modules/LRN-99`, {
    method: "PUT", headers: { "content-type": "application/json" },
    body: JSON.stringify({ servicePortalUrl: "https://service.example.org/unknown" }),
  })).status, 404);
  assert.equal((await fetch(`${base}/api/trainer/modules/${id}`, {
    method: "PUT", headers: { "content-type": "application/json" },
    body: JSON.stringify({ servicePortalUrl: "", expectedUrl: "https://service.example.org/training/12" }),
  })).status, 200);
  assert.equal((await (await fetch(`${base}/api/trainer/modules`)).json()).modules[0].servicePortalUrl, "");
  fs.writeFileSync(path.join(dataDir, "trainer-service-links.json"), "{broken json");
  assert.equal((await fetch(`${base}/api/trainer/modules`)).status, 500);
});

test("trainer API stays behind the existing site gate", async (t) => {
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(root, "server", "server.js")], {
    cwd: root,
    env: { ...process.env, PORT: String(port), BIND_HOST: "127.0.0.1", GATE_DISABLED: "false", GATE_SECRET: "test-gate-secret", SITE_PASSCODE: "test-passcode" },
  });
  t.after(() => child.kill());
  await new Promise((resolve, reject) => {
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; if (output.includes("gated server on")) resolve(); });
    child.once("error", reject);
    child.once("exit", () => reject(new Error("server exited before ready")));
  });
  const base = `http://127.0.0.1:${port}`;
  assert.equal((await fetch(`${base}/api/trainer/modules`)).status, 401);
  assert.equal((await fetch(`${base}/trainer.html`, { headers: { Accept: "text/html" }, redirect: "manual" })).status, 302);
});
