// Shared helpers for the UI specs.
const path = require("path");
const fs = require("fs");

const STORE_DIR = path.join(__dirname, "..", ".tmp", "store");
const STORE_KEY = "llmgame_v1";

/**
 * Clean state per test: wipe the file store and recreate the `journeys/` and
 * `players/` subdirs the running server writes into (it only creates them once,
 * at startup — see lib/file-store.ts). The admin comes from env, so there is no
 * database to seed. Mirrors global-setup.js, which resets once before the run.
 */
function resetStore() {
  fs.rmSync(STORE_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(STORE_DIR, "journeys"), { recursive: true });
  fs.mkdirSync(path.join(STORE_DIR, "players"), { recursive: true });
}

/** Logs in as admin via the API and optionally creates a journey. */
async function apiAdmin(request, { create = null, start = false } = {}) {
  await request.post("/api?action=admin_login", {
    data: { username: "admin", password: "secret" },
  });
  if (create !== null) {
    await request.post("/api?action=admin_create", { data: { name: create } });
  }
  if (start) {
    await request.post("/api?action=admin_start");
  }
}

/**
 * Sets the localStorage progress BEFORE the page loads (via addInitScript),
 * so you land directly on a specific flow position. Then `page.goto("/")`.
 */
async function seedState(page, state) {
  await page.addInitScript(
    ([key, s]) => { try { localStorage.setItem(key, JSON.stringify(s)); } catch (e) {} },
    [STORE_KEY, state]
  );
}

/** Closes the (new) on-device consent dialog if it is open. */
async function dismissConsent(page) {
  const no = page.locator("#aicNo");
  if (await no.count()) {
    try { await no.click({ timeout: 2000 }); } catch (e) { /* already gone */ }
  }
}

/** Solo base state on a flow position (aiOptIn:false → no consent popup). */
function soloAt(pos, extra) {
  return Object.assign({ pos, quiz: {}, doneChapters: {}, aiOptIn: false }, extra || {});
}

// Flow positions (cover=0; chapter i: Lecture=1+2i, Game=2+2i).
const POS = {
  tokenizer: 4, embedding: 6, semantic: 8, attention: 12, temperature: 14,
  cost: 26, injection: 30, ondevice: 32, results: 52,
};

module.exports = { resetStore, apiAdmin, seedState, dismissConsent, soloAt, POS };
