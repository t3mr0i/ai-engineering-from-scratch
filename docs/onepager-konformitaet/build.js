/**
 * Baut den Konformitäts-Onepager aus source.html.
 *
 * source.html trägt Platzhalter statt Schriftdaten, damit die Quelle lesbar
 * und diffbar bleibt. Dieses Skript ersetzt sie durch die Lufthansa-Group-
 * Webfonts aus site/lrn/assets/fonts/ als data:-URIs — die Seite muss überall
 * ohne Netz funktionieren, also steckt alles in einer Datei.
 *
 *   node docs/onepager-konformitaet/build.js
 *
 * Zwei Ergebnisse, beide .gitignore'd:
 *   onepager.html             nur der Seiteninhalt, für die Artifact-Ansicht,
 *                             die Doctype und <head> selbst beisteuert
 *   onepager-standalone.html  vollständiges Dokument mit Zeichensatz-Angabe,
 *                             zum Weitergeben und lokalen Öffnen
 *
 * Ohne <meta charset="utf-8"> rät ein lokal geöffneter Browser den Zeichensatz
 * und macht aus den Umlauten Buchstabensalat — deshalb die zweite Variante.
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

let body = fs.readFileSync(path.join(dir, 'source.html'), 'utf8');
for (const [key, file] of Object.entries(FACES)) {
  const b64 = fs.readFileSync(path.join(fontsDir, file)).toString('base64');
  body = body.replace(`__${key}__`, `data:font/woff2;base64,${b64}`);
}

const title = (body.match(/<title>([^<]*)<\/title>/) || [, 'Onepager'])[1];
const standalone = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>*, *::before, *::after { box-sizing: border-box; }</style>
</head>
<body>
${body}</body>
</html>
`;

for (const [name, content] of [['onepager.html', body], ['onepager-standalone.html', standalone]]) {
  const out = path.join(dir, name);
  fs.writeFileSync(out, content, 'utf8');
  console.log(`${path.relative(repo, out)} — ${(Buffer.byteLength(content) / 1024).toFixed(0)} KB`);
}
