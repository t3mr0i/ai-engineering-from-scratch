// Playwright configuration for the UI tests.
// Serves the ported TypeScript app via a local Node server (tests/ui/server.ts,
// run with tsx) backed by a file store — no cloud (Blob/Edge Config) needed.
// The admin (admin / secret) comes from env; journeys are created by the specs
// themselves through the API.
//
// The app defaults to English; these specs assert the German copy, so the
// default browser context carries a `lang=de` cookie (see de-state.json). Extra
// contexts created inside a spec (browser.newContext) render in English.
const path = require("path");
const { defineConfig, devices } = require("@playwright/test");
const bcrypt = require("bcryptjs");

const PORT = 8799;
const STORE_DIR = path.join(__dirname, ".tmp", "store");
const APP_ROOT = path.join(__dirname, "..", "..");

const serverEnv = {
  ...process.env,
  PORT: String(PORT),
  LOCAL_STORE_DIR: STORE_DIR,
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD_HASH: bcrypt.hashSync("secret", 10),
  SESSION_SECRET: "ui-test-secret",
};

module.exports = defineConfig({
  testDir: "./specs",
  timeout: 30000,
  expect: { timeout: 8000 },
  fullyParallel: false, // one server + one file store → sequential
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: require.resolve("./global-setup.js"),
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    storageState: path.join(__dirname, "de-state.json"), // force the German UI
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx tsx ${path.join(__dirname, "server.ts")}`,
    url: `http://127.0.0.1:${PORT}/`,
    cwd: APP_ROOT,
    reuseExistingServer: false,
    env: serverEnv,
    timeout: 30000,
  },
});
