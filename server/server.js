/**
 * Passcode-gated static server for the LHIND AI learning catalog.
 *
 * Replaces Azure Static Web Apps. SWA served files straight off its CDN without
 * ever running our gate, so every byte leaked. Here a single Node process sees
 * every request and runs the HMAC check (server/gate-core.js) before returning
 * any file. "No byte without passcode" — including data.js, /phases/*, and the
 * Pyodide/JupyterLite WASM — because every fetch goes through this gate.
 *
 * Unauthenticated whitelist (the only things a logged-out visitor may load):
 *   GET  /gate.html      the self-contained passcode form (inline CSS, no assets)
 *   POST /api/gate       verifies the passcode, sets the signed cookie
 * Everything else requires a valid `ase_gate` cookie.
 *
 * Config (App Service application settings):
 *   SITE_PASSCODE  the shared passcode
 *   GATE_SECRET    HMAC secret for the cookie
 *   PORT           injected by App Service; defaults to 8080 locally
 *   WEB_ROOT       static root; defaults to ../site
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const {
  COOKIE_NAME,
  TTL_MS,
  timingSafeEqual,
  validToken,
  issueToken,
  cookieFromRequest,
} = require('./gate-core');

const PORT = process.env.PORT || 8080;
const WEB_ROOT = path.resolve(process.env.WEB_ROOT || path.join(__dirname, '..', 'site'));
const SITE_PASSCODE = process.env.SITE_PASSCODE;
const GATE_SECRET = process.env.GATE_SECRET;

// Paths a logged-out visitor may reach. Keep this minimal — gate.html is
// self-contained, so the passcode page needs nothing else.
const PUBLIC_PATHS = new Set(['/gate.html']);

// Phase folders marked `hidden: true` in site/data.js (TC-only catalog scope).
// The hidden flag there is client-side only (catalog rendering + search
// index); mirror it here so the raw lesson content is actually unreachable,
// even with a valid gate cookie. Keep in sync if the hidden set ever changes.
const HIDDEN_PHASE_DIRS = [
  '01-math-foundations',
  '02-ml-fundamentals',
  '03-deep-learning-core',
  '04-computer-vision',
  '06-speech-and-audio',
  '09-reinforcement-learning',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.whl': 'application/octet-stream',
  '.data': 'application/octet-stream',
};

function mimeFor(p) {
  return MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';
}

// Resolve a URL path to a file inside WEB_ROOT, blocking traversal. Returns the
// absolute path or null if it escapes the root or doesn't resolve to a file.
function resolveFile(urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  const abs = path.normalize(path.join(WEB_ROOT, rel));
  if (abs !== WEB_ROOT && !abs.startsWith(WEB_ROOT + path.sep)) return null; // traversal
  return abs;
}

function sendFile(res, abs, status = 200) {
  fs.stat(abs, (err, st) => {
    if (err || !st.isFile()) {
      // SPA-ish fallback: unknown path under root -> 404 (gate already passed).
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(status, {
      'Content-Type': mimeFor(abs),
      'Content-Length': st.size,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(abs).pipe(res);
  });
}

function redirectToGate(res, originalUrl) {
  const r = encodeURIComponent(originalUrl || '/');
  res.writeHead(302, { Location: `/gate.html?r=${r}` });
  res.end();
}

function handleGatePost(req, res) {
  if (!SITE_PASSCODE || !GATE_SECRET) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'gate not configured' }));
    return;
  }
  let body = '';
  let tooBig = false;
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 4096) { tooBig = true; req.destroy(); } // tiny JSON only
  });
  req.on('end', () => {
    if (tooBig) return;
    let passcode;
    try { passcode = JSON.parse(body).passcode; } catch (_) { passcode = undefined; }
    if (typeof passcode !== 'string' || !timingSafeEqual(passcode, SITE_PASSCODE)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false }));
      return;
    }
    const token = issueToken(GATE_SECRET);
    const maxAge = Math.floor(TTL_MS / 1000);
    // Secure flag: on locally over plain HTTP the browser would drop a Secure
    // cookie, so only set it when the request arrived over HTTPS (App Service
    // terminates TLS and sets x-forwarded-proto).
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const secure = proto === 'https' ? ' Secure;' : '';
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': `${COOKIE_NAME}=${token}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${maxAge}`,
    });
    res.end(JSON.stringify({ ok: true }));
  });
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  const pathOnly = url.split('?')[0];

  // 1. Passcode submission (unauthenticated).
  if (pathOnly === '/api/gate') {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }
    handleGatePost(req, res);
    return;
  }

  // 2. Cookie-check endpoint kept for compatibility with gate-guard.js.
  if (pathOnly === '/api/check') {
    const ok = Boolean(GATE_SECRET) && validToken(cookieFromRequest(req), GATE_SECRET);
    res.writeHead(ok ? 200 : 401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok }));
    return;
  }

  // 3. Public whitelist (the passcode page itself).
  if (PUBLIC_PATHS.has(pathOnly)) {
    const abs = resolveFile(pathOnly);
    if (abs) return sendFile(res, abs);
  }

  // 4. THE GATE: everything else requires a valid signed cookie.
  if (!GATE_SECRET || !validToken(cookieFromRequest(req), GATE_SECRET)) {
    // HTML navigations get a friendly redirect; asset/data fetches get a hard
    // 401 so nothing renders and nothing leaks.
    const accept = req.headers.accept || '';
    if (req.method === 'GET' && accept.includes('text/html')) {
      return redirectToGate(res, url);
    }
    res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Unauthorized');
    return;
  }

  // 5. Authenticated: serve the static file.
  const abs = resolveFile(pathOnly);
  if (!abs) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad request');
    return;
  }
  if (HIDDEN_PHASE_DIRS.some((dir) => pathOnly.startsWith(`/phases/${dir}/`))) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  sendFile(res, abs);
});

server.listen(PORT, () => {
  const ok = SITE_PASSCODE && GATE_SECRET;
  console.log(`gated server on :${PORT}  root=${WEB_ROOT}  configured=${Boolean(ok)}`);
  if (!ok) console.warn('WARNING: SITE_PASSCODE / GATE_SECRET not set — gate will 500 on submit.');
});
