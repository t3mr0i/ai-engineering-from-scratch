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
 *   SITE_PASSCODE    the shared passcode
 *   GATE_SECRET      HMAC secret for the cookie
 *   GATE_DISABLED    'true' to skip the passcode gate entirely
 *   PORT             injected by App Service; defaults to 8080 locally
 *   WEB_ROOT         static root; defaults to ../site
 *   LLM_GATEWAY_KEY  Bifrost gateway key, injected server-side by
 *                    POST /api/llm/chat/completions — see handleLlmProxy
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('node:crypto');
const {
  COOKIE_NAME,
  TTL_MS,
  timingSafeEqual,
  validToken,
  issueToken,
  cookieFromRequest,
} = require('./gate-core');
const { createAdminApi } = require('./admin-api');
const { readJson, sendJson } = require('./admin-api');
const { StoreError } = require('./admin-store');
const { LrnReportStore, ReportError } = require('./lrn-report-store');
const { createLearnerAi, LearnerAiError } = require('./learner-ai');

const PORT = process.env.PORT || 8080;
const BIND_HOST = process.env.BIND_HOST || undefined;
const WEB_ROOT = path.resolve(process.env.WEB_ROOT || path.join(__dirname, '..', 'site'));
const SITE_PASSCODE = process.env.SITE_PASSCODE;
const GATE_SECRET = process.env.GATE_SECRET;
// Escape hatch for deployments that are already access-restricted at the
// network layer (e.g. an internal-only OpenShift route reachable only over
// VPN) and don't need the passcode gate on top.
const GATE_DISABLED = process.env.GATE_DISABLED === 'true';
const handleAdminApi = createAdminApi({ webRoot: WEB_ROOT });
const learnerAi = createLearnerAi({ webRoot: WEB_ROOT });

// Same persistent volume as the curriculum admin store (see openshift/
// deployment.yaml's `admin-data` PVC) — reports live in a subdirectory of it
// so no new OpenShift volume is needed.
const ADMIN_DATA_DIR = path.resolve(process.env.ADMIN_DATA_DIR || path.join(__dirname, '..', '.admin-data'));
const lrnReportStore = new LrnReportStore({ dataDir: path.join(ADMIN_DATA_DIR, 'lrn-reports'), webRoot: WEB_ROOT });

// Server-side proxy for the LHIND LLM gateway (Bifrost). The key lives only
// here — notebooks call this same-origin endpoint instead of gateway.lhind.ai
// directly, so no per-user key ever needs to reach the browser.
const LLM_GATEWAY_URL = 'https://gateway.lhind.ai/v1/chat/completions';
const LLM_GATEWAY_KEY = process.env.LLM_GATEWAY_KEY;
// Per-IP request cap, independent of the passcode gate (which may be
// disabled) — keeps one client from burning the shared gateway budget.
const LLM_RATE_LIMIT_PER_MIN = 20;
const llmRateState = new Map(); // ip -> { count, windowStart }

// Separate, smaller budget for the anonymous progress-report endpoint — one
// learner's browser syncs at most once every few seconds, so this cap is
// only meant to blunt abuse, not accommodate legitimate bursts.
const LRN_REPORT_RATE_LIMIT_PER_MIN = 10;
const lrnReportRateState = new Map(); // ip -> { count, windowStart }

// PAN has a deliberately smaller budget than the raw notebook proxy. The
// learner endpoint retrieves curriculum context and calls the shared model.
const LEARNER_AI_RATE_LIMIT_PER_MIN = 12;
const learnerAiRateState = new Map(); // ip -> { count, windowStart }

// Paths a logged-out visitor may reach. Keep this minimal — gate.html is
// self-contained, so the passcode page needs nothing else.
const PUBLIC_PATHS = new Set(['/gate.html']);

// Phase folders marked `hidden: true` in site/data.js (TC-only catalog scope).
// The hidden flag there is client-side only (catalog rendering + search
// index); mirror it here so the raw lesson content is actually unreachable,
// even with a valid gate cookie. Keep in sync if the hidden set ever changes.
const HIDDEN_PHASE_DIRS = [
  '01-math-foundations',
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

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function llmRateLimited(ip) {
  const now = Date.now();
  const entry = llmRateState.get(ip);
  if (!entry || now - entry.windowStart > 60000) {
    llmRateState.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > LLM_RATE_LIMIT_PER_MIN;
}

function lrnReportRateLimited(ip) {
  const now = Date.now();
  const entry = lrnReportRateState.get(ip);
  if (!entry || now - entry.windowStart > 60000) {
    lrnReportRateState.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > LRN_REPORT_RATE_LIMIT_PER_MIN;
}

function learnerAiRateLimited(ip) {
  const now = Date.now();
  const entry = learnerAiRateState.get(ip);
  if (!entry || now - entry.windowStart > 60000) {
    learnerAiRateState.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > LEARNER_AI_RATE_LIMIT_PER_MIN;
}

function readLearnerAiJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    let tooLarge = false;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 64_000) {
        tooLarge = true;
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      if (tooLarge) {
        reject(new LearnerAiError('ai.request.too_large', 'Die PAN-Anfrage ist zu groß.', 413));
        return;
      }
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_) {
        reject(new LearnerAiError('ai.request.invalid_json', 'Die PAN-Anfrage enthält ungültiges JSON.', 400));
      }
    });
    req.on('error', reject);
  });
}

async function handleLearnerAi(req, res) {
  const errorId = crypto.randomBytes(5).toString('hex');
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: { code: 'method.not_allowed', message: 'Methode nicht erlaubt.' } });
    return;
  }
  if (learnerAiRateLimited(clientIp(req))) {
    sendJson(res, 429, { ok: false, error: { code: 'ai.rate_limited', message: 'Zu viele PAN-Anfragen, bitte kurz warten.' } });
    return;
  }
  try {
    const body = await readLearnerAiJson(req);
    const response = await learnerAi.run(body);
    sendJson(res, 200, { ok: true, response });
  } catch (error) {
    const known = error instanceof LearnerAiError;
    if (!known) console.error(`[learner-ai:${errorId}]`, error);
    sendJson(res, known ? error.status : 500, {
      ok: false,
      error: {
        code: known ? error.code : 'ai.internal',
        message: known ? error.message : 'PAN konnte die Anfrage nicht verarbeiten.',
        id: errorId,
      },
    });
  }
}

// Proxies notebook LLM calls to the Bifrost gateway, injecting the shared key
// server-side. Any Authorization header the client sends is ignored — the
// key never needs to exist in the browser.
function handleLlmProxy(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }
  if (!LLM_GATEWAY_KEY) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'LLM gateway not configured' } }));
    return;
  }
  if (llmRateLimited(clientIp(req))) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'rate limit exceeded, try again shortly' } }));
    return;
  }
  let body = '';
  let tooBig = false;
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1_000_000) { tooBig = true; req.destroy(); } // 1MB cap
  });
  req.on('end', async () => {
    if (tooBig) return;
    try {
      const upstream = await fetch(LLM_GATEWAY_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${LLM_GATEWAY_KEY}`,
        },
        body,
      });
      const text = await upstream.text();
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
      res.end(text);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'upstream request failed' } }));
    }
  });
}

// Accepts an anonymous learner's current profile/level/completed-courses
// snapshot. Runs behind the passcode gate like the rest of the site — see
// the dispatch block below.
async function handleLrnReport(req, res) {
  const errorId = crypto.randomBytes(5).toString('hex');
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }
  if (lrnReportRateLimited(clientIp(req))) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: { code: 'report.rate_limited', message: 'Zu viele Anfragen, bitte kurz warten.' } }));
    return;
  }
  try {
    const body = await readJson(req);
    const record = lrnReportStore.save(body);
    sendJson(res, 200, { ok: true, updatedAt: record.updatedAt });
  } catch (error) {
    const known = error instanceof ReportError || error instanceof StoreError;
    if (!known) console.error(`[lrn-report:${errorId}]`, error);
    sendJson(res, known ? error.status : 400, {
      ok: false,
      error: {
        code: known ? error.code : 'report.invalid',
        message: known ? error.message : 'Der Report konnte nicht verarbeitet werden.',
        id: errorId,
      },
    });
  }
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  const pathOnly = url.split('?')[0];

  // Curriculum administration has its own trusted-proxy identity and role
  // checks. The API handler always produces a response for this namespace.
  if (pathOnly.startsWith('/api/admin/')) {
    handleAdminApi(req, res, pathOnly);
    return;
  }

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
    const ok = GATE_DISABLED || (Boolean(GATE_SECRET) && validToken(cookieFromRequest(req), GATE_SECRET));
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
  if (!GATE_DISABLED && (!GATE_SECRET || !validToken(cookieFromRequest(req), GATE_SECRET))) {
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

  // 4b. Learner APIs — the gate check above already passed. PAN has its own
  // validated contract; the raw proxy remains available for lesson notebooks.
  if (pathOnly === '/api/lrn/ai/chat') {
    handleLearnerAi(req, res);
    return;
  }

  if (pathOnly === '/api/llm/chat/completions') {
    handleLlmProxy(req, res);
    return;
  }

  // 4c. Anonymous learner progress reports — the gate check above already
  // passed, so only actual visitors to the gated site can report.
  if (pathOnly === '/api/lrn/report') {
    handleLrnReport(req, res);
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

server.listen(PORT, BIND_HOST, () => {
  const ok = SITE_PASSCODE && GATE_SECRET;
  console.log(`gated server on ${BIND_HOST || '0.0.0.0'}:${PORT}  root=${WEB_ROOT}  configured=${Boolean(ok)}  gateDisabled=${GATE_DISABLED}`);
  if (!GATE_DISABLED && !ok) console.warn('WARNING: SITE_PASSCODE / GATE_SECRET not set — gate will 500 on submit.');
});
