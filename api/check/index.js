/**
 * Gate check — verifies the signed session cookie.
 *
 * The front-end calls this on page load. Returns { ok: true } only when the
 * `ase_gate` cookie is present, correctly signed with GATE_SECRET, and not
 * expired. No body, no secrets leave the server.
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

function valid(token, secret) {
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

module.exports = async function (context, req) {
  const secret = process.env.GATE_SECRET;
  const token = readCookie(req.headers && req.headers.cookie, COOKIE_NAME);
  const ok = Boolean(secret) && valid(token, secret);
  context.res = { status: ok ? 200 : 401, body: { ok } };
};
