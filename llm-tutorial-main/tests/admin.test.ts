/** Admin authentication and journey lifecycle. (port of admin_test.php) */
import { describe, it, expect } from "vitest";
import { fresh } from "./helpers.js";
import { chapterCount } from "../lib/sync.js";

describe("admin auth", () => {
  it("rejects wrong credentials", async () => {
    const c = fresh();
    c.seedAdmin("admin", "secret");
    const r = await c.call("admin_login", { username: "admin", password: "nope" });
    expect(r.code).toBe(401);
    expect(r.body.error).toBe("invalid-credentials");
  });

  it("accepts correct credentials and reports me", async () => {
    const c = fresh();
    c.seedAdmin("mod", "pw123");
    const r = await c.call("admin_login", { username: "mod", password: "pw123" });
    expect(r.body.ok).toBe(true);
    expect((await c.body("admin_me")).admin.username).toBe("mod");
  });

  it("me is null when not logged in", async () => {
    const c = fresh();
    expect((await c.body("admin_me")).admin).toBeNull();
  });

  it("logout clears the session", async () => {
    const c = fresh();
    c.seedAdmin();
    await c.loginAdmin();
    await c.call("admin_logout");
    expect((await c.body("admin_me")).admin).toBeNull();
  });

  it("protected endpoints require auth", async () => {
    const c = fresh();
    for (const a of ["admin_console", "admin_create", "admin_start", "admin_unlock", "admin_archive", "admin_delete"]) {
      expect((await c.call(a)).code).toBe(401);
    }
  });
});

describe("journey lifecycle", () => {
  it("create → start → unlock → archive", async () => {
    const c = fresh();
    c.seedAdmin();
    await c.loginAdmin();

    expect((await c.body("admin_create", { name: "Reise A" })).ok).toBe(true);
    expect((await c.store.listJourneys())[0].status).toBe("lobby");

    await c.call("admin_start");
    expect((await c.store.listJourneys())[0].status).toBe("live");

    await c.body("admin_unlock", { chapter: 2 });
    expect((await c.store.listJourneys())[0].unlocked_chapter).toBe(2);

    await c.call("admin_archive");
    expect((await c.store.listJourneys())[0].status).toBe("archived");
  });

  it("only one active journey at a time", async () => {
    const c = fresh();
    c.seedAdmin();
    await c.loginAdmin();
    await c.call("admin_create", { name: "A" });
    expect((await c.call("admin_create", { name: "B" })).code).toBe(409);
  });

  it("can create a new journey after archiving the old one", async () => {
    const c = fresh();
    c.seedAdmin();
    await c.loginAdmin();
    await c.call("admin_create", { name: "A" });
    await c.call("admin_start");
    await c.call("admin_archive");
    expect((await c.body("admin_create", { name: "B" })).ok).toBe(true);
    expect((await c.store.listJourneys()).length).toBe(2);
  });

  it("cancels a not-started lobby by deleting it (with its waiting players)", async () => {
    const c = fresh();
    c.seedAdmin();
    await c.loginAdmin();
    await c.call("admin_create", { name: "Reise" });
    const jid = (await c.store.listJourneys())[0].id;
    c.resetRequest();
    c.cookieSet(null);
    await c.body("join");
    expect((await c.store.listPlayers()).length).toBe(1);

    await c.loginAdmin();
    expect((await c.body("admin_delete", { id: jid })).ok).toBe(true);
    expect((await c.store.listJourneys()).length).toBe(0);
    expect((await c.store.listPlayers()).length).toBe(0);
    expect((await c.body("state")).mode).toBe("solo");
  });

  it("deletes a past (archived) journey", async () => {
    const c = fresh();
    c.seedAdmin();
    await c.loginAdmin();
    await c.call("admin_create", { name: "Alt" });
    await c.call("admin_start");
    await c.call("admin_archive");
    const jid = (await c.store.listJourneys())[0].id;
    expect((await c.body("admin_delete", { id: jid })).ok).toBe(true);
    expect((await c.store.listJourneys()).length).toBe(0);
  });

  it("refuses to delete a running (live) journey", async () => {
    const c = fresh();
    c.seedAdmin();
    await c.loginAdmin();
    await c.call("admin_create", { name: "Läuft" });
    await c.call("admin_start");
    const jid = (await c.store.listJourneys())[0].id;
    const r = await c.call("admin_delete", { id: jid });
    expect(r.code).toBe(409);
    expect(r.body.error).toBe("journey-live");
    expect((await c.store.listJourneys()).length).toBe(1);
  });

  it("delete validates the journey id", async () => {
    const c = fresh();
    c.seedAdmin();
    await c.loginAdmin();
    expect((await c.call("admin_delete", {})).code).toBe(400);
    expect((await c.call("admin_delete", { id: 999 })).code).toBe(404);
  });

  it("unlock is clamped to the chapter range", async () => {
    const c = fresh();
    c.seedAdmin();
    await c.loginAdmin();
    await c.call("admin_create");
    await c.call("admin_start");
    const max = chapterCount() - 1;
    expect((await c.body("admin_unlock", { chapter: 999 })).unlocked).toBe(max);
    expect((await c.body("admin_unlock", { chapter: -5 })).unlocked).toBe(0);
  });
});
