/** Unit tests for the storage/session/sync primitives that back the API. */
import { describe, it, expect } from "vitest";
import { MemoryStore } from "../lib/memory-store.js";
import { sign, verify } from "../lib/session.js";
import { chapterCount, isOnline, projectionOf, randomName, secsSince } from "../lib/sync.js";
import type { JourneyRecord } from "../lib/types.js";

describe("MemoryStore", () => {
  it("round-trips journeys, players, and the projection", async () => {
    const s = new MemoryStore();
    const j: JourneyRecord = {
      id: "j1", name: "X", status: "lobby", unlocked_chapter: 0,
      created_at: "2026-07-03T12:00:00.000Z", started_at: null, unlocked_at: null,
    };
    await s.putJourney(j);
    expect((await s.getJourney("j1"))!.name).toBe("X");
    expect((await s.listJourneys()).length).toBe(1);

    await s.setActiveProjection(projectionOf(j));
    expect((await s.getActiveProjection())!.id).toBe("j1");
    await s.setActiveProjection(null);
    expect(await s.getActiveProjection()).toBeNull();

    await s.putPlayer({
      journey_id: "j1", token: "t1", name: "N", approved: true,
      current_chapter: 0, joined_at: "2026-07-03T12:00:00.000Z", last_seen: null,
    });
    expect((await s.getPlayer("t1"))!.name).toBe("N");
    await s.deletePlayer("t1");
    expect(await s.getPlayer("t1")).toBeNull();
  });
});

describe("session cookie", () => {
  const secret = "test-secret";
  const now = Date.parse("2026-07-03T12:00:00.000Z");

  it("signs and verifies a username", () => {
    const tok = sign("mod", secret, now);
    expect(verify(tok, secret, now)).toBe("mod");
  });
  it("rejects a tampered or wrong-secret token", () => {
    const tok = sign("mod", secret, now);
    expect(verify(tok + "x", secret, now)).toBeNull();
    expect(verify(tok, "other", now)).toBeNull();
  });
  it("rejects an expired token", () => {
    const tok = sign("mod", secret, now);
    expect(verify(tok, secret, now + 13 * 3600 * 1000)).toBeNull();
  });
  it("rejects empty input", () => {
    expect(verify("", secret, now)).toBeNull();
    expect(verify(sign("mod", secret, now), "", now)).toBeNull();
  });
});

describe("sync helpers", () => {
  it("counts the content chapters", () => {
    expect(chapterCount()).toBe(16);
  });
  it("computes presence within the 60s window", () => {
    const now = Date.parse("2026-07-03T12:00:00.000Z");
    expect(isOnline(new Date(now - 30_000).toISOString(), now)).toBe(true);
    expect(isOnline(new Date(now - 90_000).toISOString(), now)).toBe(false);
    expect(isOnline(null, now)).toBe(false);
  });
  it("secsSince returns whole seconds or null", () => {
    const now = Date.parse("2026-07-03T12:00:00.000Z");
    expect(secsSince(new Date(now - 5000).toISOString(), now)).toBe(5);
    expect(secsSince(null, now)).toBeNull();
  });
  it("randomName yields an adjective + animal", () => {
    expect(randomName("en").split(" ").length).toBe(2);
    expect(randomName("de").split(" ").length).toBe(2);
  });
});
