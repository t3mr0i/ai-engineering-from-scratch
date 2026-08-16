/**
 * Gate check — verifies the signed session cookie.
 *
 * The front-end calls this on page load. Returns { ok: true } only when the
 * `ase_gate` cookie is present, correctly signed with GATE_SECRET, and not
 * expired. No body, no secrets leave the server.
 */

const { COOKIE_NAME, readCookie, isValidToken } = require('../lib/gate-auth');

module.exports = async function (context, req) {
  const secret = process.env.GATE_SECRET;
  const token = readCookie(req.headers && req.headers.cookie, COOKIE_NAME);
  const ok = Boolean(secret) && isValidToken(token, secret);
  context.res = { status: ok ? 200 : 401, body: { ok } };
};
