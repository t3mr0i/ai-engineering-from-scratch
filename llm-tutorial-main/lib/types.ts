/**
 * Shared data types. These replace the four MySQL tables (admins, journeys,
 * players, events) — `events` is dropped (it was declared in the old schema but
 * never read or written). Timestamps are ISO-8601 UTC strings.
 */

export type JourneyStatus = "lobby" | "live" | "done" | "archived";

/** Full journey record — the Blob source of truth (`journeys/{id}.json`). */
export interface JourneyRecord {
  id: string;
  name: string;
  status: JourneyStatus;
  unlocked_chapter: number;
  created_at: string;
  started_at: string | null;
  unlocked_at: string | null;
}

/**
 * The active-journey projection stored in Edge Config under the `journey` key —
 * the tiny, read-hot subset every player polls. `null` when nothing is live.
 */
export interface JourneyProjection {
  id: string;
  name: string;
  status: "lobby" | "live";
  unlocked_chapter: number;
}

/** Player record — one Blob key per player (`players/{token}.json`). */
export interface PlayerRecord {
  journey_id: string | null;
  token: string;
  name: string;
  approved: boolean;
  current_chapter: number;
  joined_at: string;
  last_seen: string | null;
}

/** An admin credential (from env, not the store). */
export interface AdminCred {
  username: string;
  password_hash: string;
}

/**
 * The storage facade the API dispatch talks to. Real impl = Blob + Edge Config
 * (`lib/store.ts`); tests inject `MemoryStore` (`lib/memory-store.ts`).
 *
 * Blob is the source of truth for journeys + players; the active-journey
 * projection (get/setActiveProjection) is the fast Edge Config read path.
 */
export interface Store {
  // Journeys — Blob source of truth.
  getJourney(id: string): Promise<JourneyRecord | null>;
  putJourney(j: JourneyRecord): Promise<void>;
  listJourneys(): Promise<JourneyRecord[]>;
  deleteJourney(id: string): Promise<void>;

  // Active-journey projection — Edge Config fast read path.
  getActiveProjection(): Promise<JourneyProjection | null>;
  setActiveProjection(p: JourneyProjection | null): Promise<void>;

  // Players — Blob, one key each.
  getPlayer(token: string): Promise<PlayerRecord | null>;
  putPlayer(p: PlayerRecord): Promise<void>;
  listPlayers(): Promise<PlayerRecord[]>;
  deletePlayer(token: string): Promise<void>;
}

/**
 * Per-request context passed to apiDispatch(). Built from the HTTP request by
 * `api/index.ts`; constructed directly by tests. Keeps the dispatch pure and
 * free of framework globals (the PHP version reached into $_GET/$_COOKIE/$_SESSION).
 */
export interface Ctx {
  /** Query params (e.g. { journey: "solo" }). */
  query: Record<string, string>;
  /** Active language for admin-facing strings (from the `lang` cookie). */
  lang: string;
  /** Player token from the `llm_pid` cookie ("" if none). */
  playerToken: string;
  /** Verified admin username from the session cookie, or null. */
  admin: string | null;
  /** Configured admins (resolved from env by the HTTP layer). */
  admins: AdminCred[];
  /** Current time in epoch ms (injectable for deterministic tests). */
  now: number;

  /** Set the player token cookie (join/solo). */
  setPlayerToken(token: string): void;
  /** Issue the admin session cookie. */
  login(username: string): void;
  /** Clear the admin session cookie. */
  logout(): void;
}

/** Result of an API action: HTTP status + JSON body (mirrors api_result()). */
export interface ApiResult {
  code: number;
  body: Record<string, any>;
}
