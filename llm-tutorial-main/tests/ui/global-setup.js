// Resets the file store before the UI test run (always start fresh).
// The admin (admin / secret) is provided via env by playwright.config.js —
// no database seeding needed anymore.
const path = require("path");
const fs = require("fs");

module.exports = async () => {
  const storeDir = path.join(__dirname, ".tmp", "store");
  fs.rmSync(storeDir, { recursive: true, force: true });
  fs.mkdirSync(storeDir, { recursive: true });
};
