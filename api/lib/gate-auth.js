/**
 * Shared HMAC session-cookie logic for the `ase_gate` passcode gate.
 *
 * Used by both /api/check (the UI's "should I show the page" probe) and
 * /api/content (the actual protected-content gate). Factored out so the two
 * can never drift apart — the cookie format, signing, and expiry rules must
 * be byte-for-byte identical or one endpoint would trust tokens the other
 * rejects.
 *
 * Cookie payload is `<expiryEpochMs>.<hmac>` (see api/gate/index.js, which
 * mints it) so validation needs no server-side session store.
 */

const crypto = require('crypto');

const COOKIE_NAME = 'ase_gate';

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
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

function isValidToken(token, secret) {
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

module.exports = { COOKIE_NAME, sign, readCookie, isValidToken };
