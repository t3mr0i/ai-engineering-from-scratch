/**
 * Trainer links for every catalog visitor. Course names come from the
 * published catalog; only Serviceportal URLs are stored outside the web root.
 */
const fs = require("node:fs");
const path = require("node:path");
const { readJson, sendJson } = require("./admin-api");

function validServiceUrl(value) {
  if (value === "") return true;
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch (_) {
    return false;
  }
}

function createTrainerApi({ webRoot, dataDir }) {
  const catalogPath = path.join(webRoot, "lrn", "manifests", "catalog.json");
  const linksPath = path.join(dataDir, "trainer-service-links.json");
  const modules = () => JSON.parse(fs.readFileSync(catalogPath, "utf8")).courses
    .map(({ id, title, sequence, status, format }) => ({ id, title, sequence, status, format }))
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const links = () => fs.existsSync(linksPath) ? JSON.parse(fs.readFileSync(linksPath, "utf8")) : {};

  return async function handleTrainerApi(req, res, pathOnly) {
    if (!pathOnly.startsWith("/api/trainer/")) return false;
    try {
      if (pathOnly === "/api/trainer/modules" && req.method === "GET") {
        const saved = links();
        sendJson(res, 200, { ok: true, modules: modules().map((item) => ({ ...item, servicePortalUrl: saved[item.id] || "" })) });
        return true;
      }
      const match = pathOnly.match(/^\/api\/trainer\/modules\/([A-Z0-9-]+)$/);
      if (!match || req.method !== "PUT") {
        sendJson(res, 404, { ok: false, error: { code: "trainer.route", message: "Trainerroute nicht gefunden." } });
        return true;
      }
      const id = match[1];
      if (!modules().some((item) => item.id === id)) {
        sendJson(res, 404, { ok: false, error: { code: "trainer.module", message: "Modul nicht gefunden." } });
        return true;
      }
      let body;
      try { body = await readJson(req); } catch (_) {
        sendJson(res, 400, { ok: false, error: { code: "trainer.body", message: "Ungültige Anfrage." } });
        return true;
      }
      const url = body && body.servicePortalUrl;
      if (!validServiceUrl(url)) {
        sendJson(res, 400, { ok: false, error: { code: "trainer.url", message: "Bitte eine vollständige HTTPS-URL ohne Zugangsdaten eingeben." } });
        return true;
      }
      const next = links();
      if (Object.prototype.hasOwnProperty.call(body, "expectedUrl") && body.expectedUrl !== (next[id] || "")) {
        sendJson(res, 409, { ok: false, error: { code: "trainer.conflict", message: "Der Link wurde inzwischen geändert. Bitte den aktuellen Stand laden und erneut prüfen." } });
        return true;
      }
      if (url) next[id] = url;
      else delete next[id];
      fs.mkdirSync(dataDir, { recursive: true });
      const temporary = `${linksPath}.${process.pid}.tmp`;
      fs.writeFileSync(temporary, JSON.stringify(next, null, 2) + "\n", { mode: 0o600 });
      fs.renameSync(temporary, linksPath);
      sendJson(res, 200, { ok: true, id, servicePortalUrl: url });
      return true;
    } catch (error) {
      console.error("Trainer link store failed:", error);
      sendJson(res, 500, { ok: false, error: { code: "trainer.storage", message: "Trainerdaten konnten nicht geladen oder gespeichert werden." } });
      return true;
    }
  };
}

module.exports = { createTrainerApi, validServiceUrl };
