/**
 * Server-rendered HTML shell (port of index.php). Loads the language packs,
 * computes the journey bootstrap (active journey from the fast Edge Config
 * projection), and inlines APP_URL / APP_LANG / APP_DATA / APP_I18N / APP_SYNC
 * for assets/app.js. Never fatal: any store error → solo mode (APP_SYNC = null).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createStore } from "../lib/store.js";
import { clientState } from "../lib/sync.js";
import { first, makeCtx } from "../lib/http.js";
import { pack } from "../lang/index.js";

const store = createStore();
const VER = "20";

/** HTML-escape for attribute/text contexts (like htmlspecialchars, ENT_QUOTES). */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** JSON safe to inline inside a <script> tag (prevents a </script> breakout). */
function jsonForScript(v: unknown): string {
  return JSON.stringify(v).replace(/</g, "\\u003c");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { lang, playerToken } = makeCtx(req);
  const data = pack("content", lang);
  const ui = pack("ui", lang);

  // Journey bootstrap — solo mode unless a journey is active. Never fatal.
  let sync: Record<string, any> | null = null;
  try {
    const state = await clientState(store, playerToken);
    sync = state.mode === "journey" ? state : null;
  } catch {
    sync = null;
  }

  // Current URL (for the QR code so phones can open the app).
  const proto = first(req.headers["x-forwarded-proto"]).split(",")[0].trim() || "https";
  const host = first(req.headers["host"]) || "localhost";
  const path = (req.url || "/").split("?")[0];
  const appUrl = `${proto}://${host}${path}`;

  const html = `<!DOCTYPE html>
<html lang="${esc(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1">
<meta name="theme-color" content="#0b1020">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>${esc(String(data.meta?.title ?? "Understanding LLMs"))}</title>
<link rel="stylesheet" href="assets/style.css?v=${VER}">
</head>
<body>
<a class="gh-ribbon" href="https://github.com/nachtgold/llm-tutorial" target="_blank" rel="noopener" aria-label="Fork me on GitHub">Fork me on GitHub</a>
<div id="app" class="app"><!-- filled by app.js --></div>

<script>
  window.APP_URL  = ${jsonForScript(appUrl)};
  window.APP_LANG = ${jsonForScript(lang)};
  window.APP_DATA = ${jsonForScript(data)};
  window.APP_I18N = ${jsonForScript(ui)};
  window.APP_SYNC = ${jsonForScript(sync)};
</script>
<script src="assets/qrcode.min.js?v=${VER}"></script>
<script src="assets/gpt-tokenizer.cl100k.js?v=${VER}"></script>
<script src="assets/app.js?v=${VER}"></script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(html);
}
