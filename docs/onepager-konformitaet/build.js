/**
 * Baut den Konformitäts-Onepager aus source.html.
 *
 * source.html trägt Platzhalter statt Schriftdaten, damit die Quelle lesbar
 * und diffbar bleibt. Dieses Skript ersetzt sie durch die Lufthansa-Group-
 * Webfonts aus site/lrn/assets/fonts/ als data:-URIs — die veröffentlichte
 * Seite läuft auf claude.ai und kann nicht auf Dateien dieses Repos zugreifen,
 * also muss alles in einer Datei stecken.
 *
 *   node docs/onepager-konformitaet/build.js
 *
 * Ergebnis: docs/onepager-konformitaet/onepager.html (~300 KB, .gitignore'd).
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const repo = path.resolve(dir, '..', '..');
const fontsDir = path.join(repo, 'site', 'lrn', 'assets', 'fonts');

const FACES = {
  HEAD_MEDIUM: 'LHGHeadWEB-Medium.woff2',
  HEAD_BOLD: 'LHGHeadWEB-Bold.woff2',
  TEXT_REGULAR: 'LHGTextWEB-Regular.woff2',
  TEXT_BOLD: 'LHGTextWEB-Bold.woff2',
};

let html = fs.readFileSync(path.join(dir, 'source.html'), 'utf8');
for (const [key, file] of Object.entries(FACES)) {
  const b64 = fs.readFileSync(path.join(fontsDir, file)).toString('base64');
  html = html.replace(`__${key}__`, `data:font/woff2;base64,${b64}`);
}

const out = path.join(dir, 'onepager.html');
fs.writeFileSync(out, html);
console.log(`${path.relative(repo, out)} — ${(html.length / 1024).toFixed(0)} KB`);
