/**
 * Test harness — the vitest equivalent of tests/bootstrap.php. A Client drives
 * apiDispatch() against a MemoryStore, carrying the player token + admin session
 * across calls (mirroring $_COOKIE / $_SESSION) so the ported tests read the same.
 */
import bcrypt from "bcryptjs";
import { apiDispatch } from "../lib/api.js";
import { MemoryStore } from "../lib/memory-store.js";
import type { AdminCred, ApiResult, Ctx } from "../lib/types.js";

const BASE_NOW = Date.parse("2026-07-03T12:00:00.000Z");

export class Client {
  playerToken = "";
  admin: string | null = null;
  now: number;
  admins: AdminCred[] = [];

  constructor(
    public store: MemoryStore,
    public lang = "en",
    now: number = BASE_NOW,
  ) {
    this.now = now;
  }

  /** Register an admin credential (env-based in production; in tests, in-memory). */
  seedAdmin(user = "admin", pass = "secret"): void {
    this.admins.push({ username: user, password_hash: bcrypt.hashSync(pass, 10) });
  }

  private ctx(query: Record<string, string>): Ctx {
    const self = this;
    return {
      query,
      lang: this.lang,
      playerToken: this.playerToken,
      admin: this.admin,
      admins: this.admins,
      now: this.now,
      setPlayerToken(token: string) {
        self.playerToken = token;
      },
      login(username: string) {
        self.admin = username;
      },
      logout() {
        self.admin = null;
      },
    };
  }

  call(action: string, input: Record<string, any> = {}, query: Record<string, string> = {}): Promise<ApiResult> {
    return apiDispatch(this.store, action, input, this.ctx(query));
  }

  async body(action: string, input: Record<string, any> = {}, query: Record<string, string> = {}): Promise<Record<string, any>> {
    return (await this.call(action, input, query)).body;
  }

  /** Fresh "request": drop player cookie + admin session (like reset_request()). */
  resetRequest(): void {
    this.playerToken = "";
    this.admin = null;
  }

  cookieGet(): string | null {
    return this.playerToken || null;
  }
  cookieSet(token: string | null): void {
    this.playerToken = token ?? "";
  }

  saveSession(): string | null {
    return this.admin;
  }
  restoreSession(s: string | null): void {
    this.admin = s;
  }

  async loginAdmin(user = "admin", pass = "secret"): Promise<void> {
    const r = await this.call("admin_login", { username: user, password: pass });
    if (r.body.ok !== true) throw new Error("loginAdmin failed");
  }

  /** Advance the injected clock (for presence/timing tests). */
  advance(seconds: number): void {
    this.now += seconds * 1000;
  }
}

/** Fresh in-memory store + a client bound to it. */
export function fresh(): Client {
  return new Client(new MemoryStore());
}
