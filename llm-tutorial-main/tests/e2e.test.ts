/** End-to-end flow across all roles. (port of e2e_flow_test.php) */
import { describe, it, expect } from "vitest";
import { fresh } from "./helpers.js";

describe("e2e journey", () => {
  it("full multiplayer playthrough", async () => {
    const c = fresh();
    c.seedAdmin("mod", "pw");

    // Admin logs in and creates a journey.
    await c.loginAdmin("mod", "pw");
    expect((await c.body("admin_create", { name: "Workshop" })).ok).toBe(true);
    const adminSession = c.saveSession();

    // Player A joins the lobby.
    c.resetRequest();
    c.cookieSet(null);
    const a = await c.body("join");
    const tokenA = c.cookieGet();
    expect(a.player.approved).toBe(true);
    expect(a.journey.status).toBe("lobby");

    // Player B joins the lobby.
    c.cookieSet(null);
    await c.body("join");
    const tokenB = c.cookieGet();
    expect(tokenA).not.toBe(tokenB);

    // Admin sees two people and starts.
    c.resetRequest();
    c.restoreSession(adminSession);
    const console1 = await c.body("admin_console");
    expect(console1.players.length).toBe(2);
    await c.call("admin_start");

    // Player A polls: the journey is now live.
    c.resetRequest();
    c.cookieSet(tokenA);
    expect((await c.body("state")).journey.status).toBe("live");

    // Admin unlocks step by step; A reports progress.
    c.resetRequest();
    c.restoreSession(adminSession);
    expect((await c.body("admin_console")).journey.unlocked).toBe(0);
    await c.body("admin_unlock", { chapter: 1 });

    c.resetRequest();
    c.cookieSet(tokenA);
    expect((await c.body("state")).journey.unlocked).toBe(1);
    await c.call("pos", { chapter: 1 });

    // Admin sees A's progress in the dashboard.
    c.resetRequest();
    c.restoreSession(adminSession);
    const players = (await c.body("admin_console")).players;
    const maxChapter = Math.max(...players.map((p: any) => p.chapter));
    expect(maxChapter).toBe(1);

    // Admin ends the journey → back to solo mode.
    await c.call("admin_archive");
    c.resetRequest();
    c.cookieSet(tokenA);
    expect((await c.body("state")).mode).toBe("solo");
  });

  it("solo users are visible after the journey ends", async () => {
    const c = fresh();
    c.seedAdmin();

    // One person plays solo (no journey active).
    c.cookieSet(null);
    await c.call("solo", { chapter: 5 });

    // Admin sees them in the solo cohort.
    c.resetRequest();
    await c.loginAdmin();
    const b = await c.body("admin_console", {}, { journey: "solo" });
    expect(b.players.length).toBe(1);
    expect(b.players[0].chapter).toBe(5);
  });
});
