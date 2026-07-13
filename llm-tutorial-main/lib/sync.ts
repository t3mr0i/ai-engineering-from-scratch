/**
 * Journey-mode logic (port of sync.php). Pure over the Store interface, so it
 * runs identically against Blob+Edge Config (production) and MemoryStore (tests).
 */
import { randomBytes, randomInt } from "node:crypto";
import type { JourneyRecord, JourneyProjection, PlayerRecord, Store } from "./types.js";
import { chapterCount as packChapterCount, pack } from "../lang/index.js";

/** Seconds a player counts as "online" for the dashboard. */
export const PRESENCE_SECONDS = 60;
/** Heartbeat throttle: don't rewrite last_seen more often than this. */
export const HEARTBEAT_SECONDS = 30;

/** Number of chapters in the content — bounds the unlock. */
export function chapterCount(): number {
  return packChapterCount();
}

/** ISO-8601 UTC timestamp for an epoch-ms value. */
export function iso(nowMs: number): string {
  return new Date(nowMs).toISOString();
}

/** Whole seconds elapsed since an ISO timestamp, or null. Mirrors secsSince(). */
export function secsSince(ts: string | null | undefined, nowMs: number): number | null {
  if (!ts) return null;
  const t = Date.parse(ts);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((nowMs - t) / 1000));
}

/** True if a last_seen timestamp is within the presence window. */
export function isOnline(lastSeen: string | null, nowMs: number): boolean {
  if (!lastSeen) return false;
  const t = Date.parse(lastSeen);
  return !Number.isNaN(t) && nowMs - t <= PRESENCE_SECONDS * 1000;
}

/** A fresh, random player token (32 hex chars — matches the old CHAR(32)). */
export function newToken(): string {
  return randomBytes(16).toString("hex");
}

/** A fresh, random journey id (kept a string end-to-end; app.js compares with ===). */
export function newJourneyId(): string {
  return randomBytes(8).toString("hex");
}

const NAMES: Record<string, { adj: string[]; animal: string[] }> = {
  en: {
    adj: [
      "Nimble", "Brave", "Clever", "Cheerful", "Curious", "Calm", "Wild",
      "Golden", "Quiet", "Swift", "Gentle", "Bold", "Bright", "Cunning",
      "Valiant", "Dreamy", "Merry", "Witty", "Patient", "Sparkling",
    ],
    animal: [
      "Owl", "Otter", "Lynx", "Seal", "Badger", "Crow", "Fox", "Bee",
      "Gull", "Hedgehog", "Deer", "Whale", "Stork", "Marten", "Bumblebee",
      "Falcon", "Jellyfish", "Dragonfly", "Crane", "Starfish",
    ],
  },
  de: {
    adj: [
      "Flinke", "Mutige", "Kluge", "Heitere", "Neugierige", "Ruhige", "Wilde",
      "Goldene", "Stille", "Schnelle", "Sanfte", "Kühne", "Helle", "Listige",
      "Tapfere", "Verträumte", "Muntere", "Pfiffige", "Geduldige", "Funkelnde",
    ],
    animal: [
      "Eule", "Otter", "Luchs", "Robbe", "Dachs", "Krähe", "Fuchs", "Biene",
      "Möwe", "Igel", "Reh", "Wal", "Storch", "Marder", "Hummel", "Falke",
      "Qualle", "Libelle", "Kranich", "Seestern",
    ],
  },
};

/** Random friendly identity (adjective + animal), localized (English default). */
export function randomName(lang = "en"): string {
  const set = NAMES[lang] ?? NAMES.en;
  const a = set.adj[randomInt(0, set.adj.length)];
  const t = set.animal[randomInt(0, set.animal.length)];
  return `${a} ${t}`;
}

/** The active journey's full record (Blob source of truth), or null. */
export async function activeJourneyFull(store: Store): Promise<JourneyRecord | null> {
  const all = await store.listJourneys();
  const active = all.filter((j) => j.status === "lobby" || j.status === "live");
  // At most one is ever active; newest first as a defensive tiebreak.
  active.sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
  return active[0] ?? null;
}

/** Projection subset of a full journey record. */
export function projectionOf(j: JourneyRecord): JourneyProjection {
  return {
    id: j.id,
    name: j.name,
    status: j.status === "live" ? "live" : "lobby",
    unlocked_chapter: j.unlocked_chapter,
  };
}

/** Count of players belonging to a journey (total, incl. offline). */
export async function countJourneyPlayers(store: Store, journeyId: string): Promise<number> {
  const players = await store.listPlayers();
  return players.filter((p) => p.journey_id === journeyId).length;
}

/**
 * Compact client state (player view) — reads the active journey from the fast
 * Edge Config projection. Mirrors sync_client_state().
 *   journey: {id,status,unlocked,name} | null   player: {name,approved,chapter} | null
 */
export async function clientState(store: Store, playerToken: string): Promise<Record<string, any>> {
  const j = await store.getActiveProjection();
  if (!j) {
    return { mode: "solo", journey: null, player: null, players: 0 };
  }
  let player = playerToken ? await store.getPlayer(playerToken) : null;
  // A leftover solo/old-journey profile must NOT count as joined to THIS journey.
  if (player && player.journey_id !== j.id) {
    player = null;
  }
  const players = await countJourneyPlayers(store, j.id);
  return {
    mode: "journey",
    journey: { id: j.id, status: j.status, unlocked: j.unlocked_chapter, name: j.name },
    player: player
      ? { name: player.name, approved: player.approved, chapter: player.current_chapter }
      : null,
    players,
  };
}

/** Label for the solo cohort in the admin console, localized. */
export function soloCohortName(lang: string): string {
  return (pack("ui", lang).no_journey as string) ?? "No journey";
}

export type { PlayerRecord };
