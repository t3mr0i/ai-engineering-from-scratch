// Contract and executable-behavior tests for this lesson demo.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const testsDir = dirname(fileURLToPath(import.meta.url));
const codeDir = resolve(testsDir, "..");
const mainPath = resolve(codeDir, "main.ts");
const source = readFileSync(mainPath, "utf8");
const allowed = new Set(["hono", "zod", "ws", "@hono/node-server"]);

function packageImports() {
  const specs = [...source.matchAll(/(?:from\s+|import\s*\()?["']([^"']+)["']/g)].map((m) => m[1]);
  return specs.filter((s) => !s.startsWith(".") && !s.startsWith("node:") && !s.match(/^[a-z]+$/)).filter((s) => !allowed.has(s));
}

function runDemo(t) {
  const probe = spawnSync("npx", ["--no-install", "tsx", "--version"], { cwd: codeDir, encoding: "utf8" });
  if (probe.status !== 0) t.skip("tsx is not installed in this environment");
  return spawnSync("npx", ["--no-install", "tsx", mainPath], { cwd: codeDir, encoding: "utf8", timeout: 45_000, env: { ...process.env, OPENAI_API_KEY: "", ANTHROPIC_API_KEY: "" } });
}

test("source is a non-empty TypeScript entrypoint", () => {
  assert.ok(source.trim().length > 0);
  assert.match(source, /(?:function|class|const|let)\s+/);
});

test("dependencies follow the TypeScript allowlist", () => {
  assert.deepEqual(packageImports(), []);
});

test("demo exits successfully", (t) => {
  const result = runDemo(t);
  if (result) assert.equal(result.status, 0, result.stderr);
});

test("demo emits bounded output", (t) => {
  const result = runDemo(t);
  if (result) assert.ok((result.stdout + result.stderr).trim().length > 0 && (result.stdout.length + result.stderr.length) < 1_000_000);
});

test("demo reports no uncaught error", (t) => {
  const result = runDemo(t);
  if (result) assert.doesNotMatch(result.stderr, /(?:uncaught|error:)/i);
});
