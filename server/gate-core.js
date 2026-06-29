/**
 * Shared passcode-gate primitives.
 *
 * Single source of truth for the HMAC cookie used by both the passcode issuer
 * (POST /api/gate) and the per-request guard. The cookie payload is
 * `<expiryEpochMs>.<hmac>` so the server verifies integrity and freshness
 * without any server-side session store.
 *
 * SITE_PASSCODE and GATE_SECRET come from environment (App Service settings).
 * Neither the passcode nor the secret ever reaches the client.
 */

const crypto = require('crypto');

const COOKIE_NAME = 'ase_gate';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}

// True only when the token is present, correctly signed, and not expired.
function validToken(token, secret) {
  if (!token) return false;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return false;
  const expiry = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(expiry, secret);
  if (mac.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return false;
  return Number(expiry) > Date.now();
}

// Mint a fresh signed cookie value for a successful passcode entry.
function issueToken(secret) {
  const expiry = String(Date.now() + TTL_MS);
  return `${expiry}.${sign(expiry, secret)}`;
}

function cookieFromRequest(req) {
  return readCookie(req.headers && req.headers.cookie, COOKIE_NAME);
}

module.exports = {
  COOKIE_NAME,
  TTL_MS,
  sign,
  timingSafeEqual,
  readCookie,
  validToken,
  issueToken,
  cookieFromRequest,
};
