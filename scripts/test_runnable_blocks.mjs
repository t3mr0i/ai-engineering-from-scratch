/**
 * Find which Python code blocks in lesson docs actually run in Pyodide — the
 * SAME runtime the lesson page uses. Testing in bare python3 was wrong: blocks
 * importing libs that are installed locally but have no Pyodide wheel (torch,
 * umap, …) passed there yet fail in the browser. Pyodide is the source of truth.
 *
 * Walks phases/<phase>/<lesson>/docs/en.md, extracts each ```python block, runs
 * it in a fresh Pyodide global namespace with stdout/stderr captured and a wall
 * timeout. Blocks that finish without error get their hash written to
 * site/runnable-blocks.json. The hash mirrors blockHash() in lesson.html.
 *
 * Run: node scripts/test_runnable_blocks.mjs   (needs: npm i pyodide@0.27.2)
 */
import { loadPyodide } from "pyodide";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(REPO, "site", "runnable-blocks.json");
const FENCE = /```python\r?\n([\s\S]*?)```/g;
const TIMEOUT_MS = 15000;

function blockHash(code) {
  let h = 5381;
  for (let i = 0; i < code.length; i++) h = ((h * 33) + code.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

const files = execSync("grep -rl '```python' phases --include=en.md", { cwd: REPO })
  .toString().trim().split("\n").filter(Boolean);

const py = await loadPyodide();
const runnable = new Set();
let total = 0, clean = 0;

for (const rel of files) {
  const text = readFileSync(path.join(REPO, rel), "utf8");
  let m;
  while ((m = FENCE.exec(text))) {
    const code = m[1];
    total++;
    // Fresh namespace per block so blocks don't leak state into each other.
    const ns = py.toPy({});
    try {
      py.setStdout({ batched: () => {} });
      py.setStderr({ batched: () => {} });
      await py.loadPackagesFromImports(code).catch(() => {});
      await withTimeout(py.runPythonAsync(code, { globals: ns }), TIMEOUT_MS);
      runnable.add(blockHash(code));
      clean++;
    } catch (_e) {
      /* fragment / missing lib / async snippet / error → Copy only */
    } finally {
      ns.destroy();
    }
  }
}

writeFileSync(OUT, JSON.stringify([...runnable].sort()));
console.log(`python blocks scanned: ${total}`);
console.log(`run cleanly in Pyodide: ${clean}`);
console.log(`wrote site/runnable-blocks.json (${runnable.size} hashes)`);
