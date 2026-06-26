/**
 * Passcode gate — issues a signed session cookie.
 *
 * Replaces the old Entra login: this is a shared-passcode gate for the trial.
 * The browser POSTs { passcode } here. We compare it (timing-safe) against the
 * SITE_PASSCODE app setting and, on success, set an HttpOnly cookie signed with
 * GATE_SECRET. The passcode itself never reaches the client and is never stored
 * in source — both values live in SWA application settings (Azure secrets).
 *
 * The cookie payload is `<expiryEpochMs>.<hmac>` so the server can verify both
 * integrity and freshness without any server-side session store.
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

module.exports = async function (context, req) {
  const passcode = req.body && req.body.passcode;
  const expected = process.env.SITE_PASSCODE;
  const secret = process.env.GATE_SECRET;

  if (!expected || !secret) {
    context.res = { status: 500, body: { error: 'gate not configured' } };
    return;
  }

  if (typeof passcode !== 'string' || !timingSafeEqual(passcode, expected)) {
    context.res = { status: 401, body: { ok: false } };
    return;
  }

  const expiry = String(Date.now() + TTL_MS);
  const token = `${expiry}.${sign(expiry, secret)}`;

  const maxAge = Math.floor(TTL_MS / 1000);
  context.res = {
    status: 200,
    headers: {
      'Set-Cookie': `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
    },
    body: { ok: true },
  };
};
