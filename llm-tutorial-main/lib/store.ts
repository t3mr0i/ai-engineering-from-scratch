/**
 * Production Store implementation: Vercel Blob (source of truth for journeys +
 * players) plus a Vercel Edge Config projection of the active journey (the fast,
 * fresh read path every player polls).
 *
 * Blob content reads/writes go through @vercel/blob. The Edge Config `journey`
 * key is READ via @vercel/edge-config and WRITTEN via the Vercel REST API
 * (Edge Config has no write SDK). The app degrades gracefully: if a store is
 * unavailable, reads return null/[], so the client falls back to solo mode.
 */
import { get as blobGet, put as blobPut, del as blobDel, list as blobList } from "@vercel/blob";
import { get as edgeGet } from "@vercel/edge-config";
import type { JourneyProjection, JourneyRecord, PlayerRecord, Store } from "./types.js";
import { createFileStore } from "./file-store.js";

const JOURNEY_PREFIX = "journeys/";
const PLAYER_PREFIX = "players/";
const PROJECTION_KEY = "journey";
// Blob's cache floor is 60s; fine — the real-time path is Edge Config, not Blob.
const BLOB_CACHE_SECONDS = 60;

/** Tiny per-instance TTL cache for the two `list` scans (collapses poll bursts). */
class TtlCache<T> {
  private value: T | null = null;
  private at = 0;
  constructor(private ttlMs: number) {}
  async get(load: () => Promise<T>, nowMs: number): Promise<T> {
    if (this.value !== null && nowMs - this.at < this.ttlMs) return this.value;
    this.value = await load();
    this.at = nowMs;
    return this.value;
  }
  clear(): void {
    this.value = null;
    this.at = 0;
  }
}

async function readJson<T>(pathname: string): Promise<T | null> {
  try {
    const res = await blobGet(pathname, { access: "private" });
    if (!res || res.statusCode !== 200) return null;
    const text = await new Response(res.stream).text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function writeJson(pathname: string, data: unknown): Promise<void> {
  await blobPut(pathname, JSON.stringify(data), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: BLOB_CACHE_SECONDS,
  });
}

async function listPathnames(prefix: string): Promise<string[]> {
  const out: string[] = [];
  let cursor: string | undefined;
  do {
    const res = await blobList({ prefix, cursor, limit: 1000 });
    for (const b of res.blobs) out.push(b.pathname);
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);
  return out;
}

/**
 * The Store for this environment. Production/preview → Blob + Edge Config.
 * Local dev + Playwright → a file-backed store (set `LOCAL_STORE_DIR`), which —
 * unlike an in-memory store — is shared across the separate `render` and `api`
 * function processes that `vercel dev` runs.
 */
export function createStore(): Store {
  const localDir = process.env.LOCAL_STORE_DIR;
  if (localDir) return createFileStore(localDir);
  return createBlobStore();
}

function createBlobStore(): Store {
  const journeysCache = new TtlCache<JourneyRecord[]>(3000);
  const playersCache = new TtlCache<PlayerRecord[]>(3000);

  async function loadJourneys(): Promise<JourneyRecord[]> {
    const paths = await listPathnames(JOURNEY_PREFIX);
    const recs = await Promise.all(paths.map((p) => readJson<JourneyRecord>(p)));
    return recs.filter((r): r is JourneyRecord => r !== null);
  }
  async function loadPlayers(): Promise<PlayerRecord[]> {
    const paths = await listPathnames(PLAYER_PREFIX);
    const recs = await Promise.all(paths.map((p) => readJson<PlayerRecord>(p)));
    return recs.filter((r): r is PlayerRecord => r !== null);
  }

  return {
    async getJourney(id) {
      return readJson<JourneyRecord>(`${JOURNEY_PREFIX}${id}.json`);
    },
    async putJourney(j) {
      await writeJson(`${JOURNEY_PREFIX}${j.id}.json`, j);
      journeysCache.clear();
    },
    async listJourneys() {
      return journeysCache.get(loadJourneys, Date.now());
    },
    async deleteJourney(id) {
      await blobDel(`${JOURNEY_PREFIX}${id}.json`).catch(() => {});
      journeysCache.clear();
    },

    async getActiveProjection() {
      try {
        const v = await edgeGet(PROJECTION_KEY);
        return (v as JourneyProjection | null | undefined) ?? null;
      } catch {
        return null;
      }
    },
    async setActiveProjection(p) {
      await writeEdgeConfig(PROJECTION_KEY, p);
    },

    async getPlayer(token) {
      if (!token) return null;
      return readJson<PlayerRecord>(`${PLAYER_PREFIX}${token}.json`);
    },
    async putPlayer(p) {
      await writeJson(`${PLAYER_PREFIX}${p.token}.json`, p);
      playersCache.clear();
    },
    async listPlayers() {
      return playersCache.get(loadPlayers, Date.now());
    },
    async deletePlayer(token) {
      await blobDel(`${PLAYER_PREFIX}${token}.json`).catch(() => {});
      playersCache.clear();
    },
  };
}

/** Write (upsert) a single Edge Config item via the Vercel REST API. */
async function writeEdgeConfig(key: string, value: unknown): Promise<void> {
  const id = process.env.EDGE_CONFIG_ID;
  const token = process.env.VERCEL_API_TOKEN;
  if (!id || !token) throw new Error("edge-config-write-not-configured");
  const team = process.env.VERCEL_TEAM_ID;
  const url =
    `https://api.vercel.com/v1/edge-config/${id}/items` + (team ? `?teamId=${team}` : "");
  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ operation: "upsert", key, value }] }),
  });
  if (!res.ok) {
    throw new Error(`edge-config-write-failed:${res.status}`);
  }
}
