/** Player actions: join, heartbeat, position, solo, late join. (port of player_test.php) */
import { describe, it, expect } from "vitest";
import { Client, fresh } from "./helpers.js";

/** Admin creates a journey and optionally starts it, then hands back a fresh client. */
async function setupJourney(c: Client, start = false): Promise<void> {
  c.seedAdmin();
  await c.loginAdmin();
  await c.call("admin_create", { name: "Testreise" });
  if (start) await c.call("admin_start");
  c.resetRequest();
}

describe("player", () => {
  it("cannot join when no journey is active", async () => {
    const c = fresh();
    const r = await c.call("join");
    expect(r.code).toBe(409);
    expect(r.body.error).toBe("no-active-journey");
  });

  it("joins a lobby and receives a random identity", async () => {
    const c = fresh();
    await setupJourney(c);
    const b = await c.body("join");
    expect(b.ok).toBe(true);
    expect(b.mode).toBe("journey");
    expect(b.player.name).toBeTruthy();
    expect(b.player.approved).toBe(true);
    expect(c.cookieGet()).not.toBeNull();
  });

  it("resumes the same player on repeated join (same cookie)", async () => {
    const c = fresh();
    await setupJourney(c);
    const first = (await c.body("join")).player.name;
    const again = (await c.body("join")).player.name;
    expect(again).toBe(first);
    expect((await c.store.listPlayers()).length).toBe(1);
  });

  it("late joiner (after start) is not approved yet", async () => {
    const c = fresh();
    await setupJourney(c, true);
    const b = await c.body("join");
    expect(b.player.approved).toBe(false);
  });

  it("state acts as heartbeat and returns journey status", async () => {
    const c = fresh();
    await setupJourney(c);
    await c.body("join");
    const b = await c.body("state");
    expect(b.journey.status).toBe("lobby");
    expect((await c.store.listPlayers())[0].last_seen).not.toBeNull();
  });

  it("pos updates the reported chapter", async () => {
    const c = fresh();
    await setupJourney(c, true);
    await c.body("join");
    await c.call("pos", { chapter: 3 });
    expect((await c.store.listPlayers())[0].current_chapter).toBe(3);
  });

  // Regression: a leftover solo/pre-journey profile must NOT count as joined.
  it("a leftover profile is not treated as joined to the active journey", async () => {
    const c = fresh();
    await c.call("solo", { chapter: 1 });
    const soloToken = c.cookieGet();
    expect(soloToken).not.toBeNull();

    c.seedAdmin();
    await c.loginAdmin();
    await c.call("admin_create", { name: "Reise" });
    c.resetRequest();

    c.cookieSet(soloToken);
    const b = await c.body("state");
    expect(b.mode).toBe("journey");
    expect(b.player).toBeNull();
    expect(b.players).toBe(0);
  });

  it("joining from a leftover profile creates a real journey row", async () => {
    const c = fresh();
    await c.call("solo", { chapter: 1 });
    const soloToken = c.cookieGet();
    c.seedAdmin();
    await c.loginAdmin();
    await c.call("admin_create", { name: "Reise" });
    const jid = (await c.store.listJourneys()).find((j) => j.name === "Reise")!.id;
    c.resetRequest();

    c.cookieSet(soloToken);
    const j = await c.body("join");
    expect(j.ok).toBe(true);
    expect(j.player).not.toBeNull();
    expect(j.players).toBe(1);
    const players = await c.store.listPlayers();
    expect(players.filter((p) => p.journey_id === jid).length).toBe(1);
    expect(players.filter((p) => p.journey_id === null).length).toBe(1);
  });
});

describe("solo", () => {
  it("solo report creates a journey-less player", async () => {
    const c = fresh();
    const r = await c.call("solo", { chapter: 2 });
    expect(r.body.ok).toBe(true);
    const row = (await c.store.listPlayers())[0];
    expect(row.journey_id).toBeNull();
    expect(row.current_chapter).toBe(2);
    expect(c.cookieGet()).not.toBeNull();
  });

  it("repeated solo report updates the same player", async () => {
    const c = fresh();
    await c.call("solo", { chapter: 1 });
    await c.call("solo", { chapter: 4 });
    const players = await c.store.listPlayers();
    expect(players.length).toBe(1);
    expect(players[0].current_chapter).toBe(4);
  });

  it("solo is a no-op while a journey is active", async () => {
    const c = fresh();
    await setupJourney(c, true);
    const b = await c.body("solo", { chapter: 1 });
    expect(b.mode).toBe("journey-active");
    expect((await c.store.listPlayers()).length).toBe(0);
  });
});
