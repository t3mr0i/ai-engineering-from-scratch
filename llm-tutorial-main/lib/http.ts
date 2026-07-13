/**
 * HTTP glue shared by api/index.ts and api/render.ts: cookie parsing/writing,
 * env-based admin resolution, and building the per-request Ctx (translating
 * cookies + query + session into the framework-free context apiDispatch wants).
 */
import type { AdminCred, Ctx } from "./types.js";
import { resolveLang } from "./i18n.js";
import { SESSION_COOKIE, sign, verify } from "./session.js";

export const PLAYER_COOKIE = "llm_pid";
export const LANG_COOKIE = "lang";

/** Minimal request shape we depend on (satisfied by VercelRequest). */
export interface ReqLike {
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: any;
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

/** First value of a possibly-array query/header field. */
export function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

/** Admins from env: a JSON `ADMINS` array, or a single ADMIN_USERNAME/HASH pair. */
export function resolveAdmins(): AdminCred[] {
  const raw = process.env.ADMINS;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr
          .filter((a) => a && typeof a.username === "string" && typeof a.password_hash === "string")
          .map((a) => ({ username: a.username, password_hash: a.password_hash }));
      }
    } catch {
      /* fall through */
    }
  }
  const username = process.env.ADMIN_USERNAME;
  const password_hash = process.env.ADMIN_PASSWORD_HASH;
  return username && password_hash ? [{ username, password_hash }] : [];
}

function isSecure(req: ReqLike): boolean {
  return first(req.headers["x-forwarded-proto"]).split(",")[0].trim() === "https";
}

function cookie(name: string, value: string, secure: boolean, maxAgeSec: number, httpOnly = true): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`,
  ];
  if (httpOnly) parts.push("HttpOnly");
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export interface CtxBundle {
  ctx: Ctx;
  /** Set-Cookie header values accumulated during dispatch. */
  cookies: string[];
  lang: string;
  playerToken: string;
}

/** Build a Ctx from an incoming request. `cookies` collects Set-Cookie values. */
export function makeCtx(req: ReqLike): CtxBundle {
  const now = Date.now();
  const secure = isSecure(req);
  const jar = parseCookies(first(req.headers["cookie"]));
  const lang = resolveLang(jar[LANG_COOKIE]);
  const secret = process.env.SESSION_SECRET ?? "";
  const admin = verify(jar[SESSION_COOKIE], secret, now);

  const cookies: string[] = [];
  const query: Record<string, string> = {};
  if (req.query) for (const k of Object.keys(req.query)) query[k] = first(req.query[k]);

  const ctx: Ctx = {
    query,
    lang,
    playerToken: jar[PLAYER_COOKIE] ?? "",
    admin,
    admins: resolveAdmins(),
    now,
    setPlayerToken(token: string) {
      this.playerToken = token;
      cookies.push(cookie(PLAYER_COOKIE, token, secure, 31536000)); // 1 year
    },
    login(username: string) {
      this.admin = username;
      cookies.push(cookie(SESSION_COOKIE, sign(username, secret, now), secure, 12 * 3600));
    },
    logout() {
      this.admin = null;
      cookies.push(cookie(SESSION_COOKIE, "", secure, 0));
    },
  };

  return { ctx, cookies, lang, playerToken: ctx.playerToken };
}
