/**
 * Stateless admin session (replaces PHP $_SESSION). The session is an
 * HMAC-signed cookie carrying the admin username + expiry — verified on every
 * request, so no server-side session store is needed (functions are stateless).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "llm_admin";
const TTL_SECONDS = 12 * 3600;

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

function hmac(secret: string, data: string): Buffer {
  return createHmac("sha256", secret).update(data).digest();
}

/** Issue a signed session token for an admin username. */
export function sign(username: string, secret: string, nowMs: number): string {
  const exp = Math.floor(nowMs / 1000) + TTL_SECONDS;
  const payload = b64url(JSON.stringify({ u: username, exp }));
  const sig = b64url(hmac(secret, payload));
  return `${payload}.${sig}`;
}

/** Verify a session token; returns the username or null (bad sig / expired). */
export function verify(token: string | undefined | null, secret: string, nowMs: number): string | null {
  if (!token || !secret) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = b64url(hmac(secret, payload));
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { u, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof u !== "string" || typeof exp !== "number") return null;
    if (Math.floor(nowMs / 1000) >= exp) return null;
    return u;
  } catch {
    return null;
  }
}
