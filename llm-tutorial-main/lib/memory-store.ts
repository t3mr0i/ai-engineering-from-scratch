/**
 * In-memory Store for tests (and offline local dev). Mirrors the Blob + Edge
 * Config behaviour synchronously: a map of journey records, a map of player
 * records, and a single active-journey projection value.
 */
import type { JourneyProjection, JourneyRecord, PlayerRecord, Store } from "./types.js";

export class MemoryStore implements Store {
  journeys = new Map<string, JourneyRecord>();
  players = new Map<string, PlayerRecord>();
  projection: JourneyProjection | null = null;

  async getJourney(id: string) {
    return this.journeys.get(id) ?? null;
  }
  async putJourney(j: JourneyRecord) {
    this.journeys.set(j.id, { ...j });
  }
  async listJourneys() {
    return [...this.journeys.values()].map((j) => ({ ...j }));
  }
  async deleteJourney(id: string) {
    this.journeys.delete(id);
  }

  async getActiveProjection() {
    return this.projection ? { ...this.projection } : null;
  }
  async setActiveProjection(p: JourneyProjection | null) {
    this.projection = p ? { ...p } : null;
  }

  async getPlayer(token: string) {
    return this.players.get(token) ?? null;
  }
  async putPlayer(p: PlayerRecord) {
    this.players.set(p.token, { ...p });
  }
  async listPlayers() {
    return [...this.players.values()].map((p) => ({ ...p }));
  }
  async deletePlayer(token: string) {
    this.players.delete(token);
  }
}
