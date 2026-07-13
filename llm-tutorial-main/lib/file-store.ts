/**
 * File-backed Store for local development and Playwright. Persists to plain JSON
 * files under a directory, so state is shared across the separate function
 * processes `vercel dev` spawns (an in-memory store would not be). Not for
 * production — production uses Blob + Edge Config (see store.ts).
 */
import { mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { JourneyProjection, JourneyRecord, PlayerRecord, Store } from "./types.js";

function readJsonFile<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function writeJsonFile(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data), "utf8");
}

export function createFileStore(dir: string): Store {
  const journeysDir = join(dir, "journeys");
  const playersDir = join(dir, "players");
  const projectionFile = join(dir, "projection.json");
  mkdirSync(journeysDir, { recursive: true });
  mkdirSync(playersDir, { recursive: true });

  function listDir<T>(d: string): T[] {
    if (!existsSync(d)) return [];
    const out: T[] = [];
    for (const f of readdirSync(d)) {
      if (!f.endsWith(".json")) continue;
      const rec = readJsonFile<T>(join(d, f));
      if (rec) out.push(rec);
    }
    return out;
  }

  return {
    async getJourney(id) {
      return readJsonFile<JourneyRecord>(join(journeysDir, `${id}.json`));
    },
    async putJourney(j) {
      writeJsonFile(join(journeysDir, `${j.id}.json`), j);
    },
    async listJourneys() {
      return listDir<JourneyRecord>(journeysDir);
    },
    async deleteJourney(id) {
      rmSync(join(journeysDir, `${id}.json`), { force: true });
    },

    async getActiveProjection() {
      return readJsonFile<JourneyProjection>(projectionFile);
    },
    async setActiveProjection(p) {
      if (p) writeJsonFile(projectionFile, p);
      else rmSync(projectionFile, { force: true });
    },

    async getPlayer(token) {
      if (!token) return null;
      return readJsonFile<PlayerRecord>(join(playersDir, `${token}.json`));
    },
    async putPlayer(p) {
      writeJsonFile(join(playersDir, `${p.token}.json`), p);
    },
    async listPlayers() {
      return listDir<PlayerRecord>(playersDir);
    },
    async deletePlayer(token) {
      rmSync(join(playersDir, `${token}.json`), { force: true });
    },
  };
}
