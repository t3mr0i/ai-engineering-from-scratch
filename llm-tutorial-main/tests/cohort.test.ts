/** Cohort dashboard: solo + all journeys, selection, controllability. (port of cohort_test.php) */
import { describe, it, expect } from "vitest";
import { fresh } from "./helpers.js";

describe("cohorts", () => {
  it("console lists solo plus every journey", async () => {
    const c = fresh();
    c.seedAdmin();
    await c.loginAdmin();
    await c.call("admin_create", { name: "Alt" });
    await c.call("admin_start");
    await c.call("admin_archive");
    await c.call("admin_create", { name: "Neu" });

    const b = await c.body("admin_console");
    const keys = b.cohorts.map((x: any) => x.key);
    expect(keys).toContain("solo");
    expect(b.cohorts.length).toBe(3);
    expect(b.journey.name).toBe("Neu");
    expect(b.controls).toBe("active");
  });

  it("selecting the solo cohort shows journey-less players", async () => {
    const c = fresh();
    c.seedAdmin();
    await c.loginAdmin();
    await c.call("solo", { chapter: 1 });
    c.resetRequest();
    await c.loginAdmin();

    const b = await c.body("admin_console", {}, { journey: "solo" });
    expect(b.selected).toBe("solo");
    expect(b.journey).toBeNull();
    expect(b.controls).toBe("readonly");
    expect(b.players.length).toBe(1);
  });

  it("archived journey is read-only, active journey is controllable", async () => {
    const c = fresh();
    c.seedAdmin();
    await c.loginAdmin();
    await c.call("admin_create", { name: "Alt" });
    await c.call("admin_start");
    await c.call("admin_archive");
    const archivedId = (await c.store.listJourneys()).find((j) => j.name === "Alt")!.id;
    await c.call("admin_create", { name: "Aktiv" });
    const activeId = (await c.store.listJourneys()).find((j) => j.name === "Aktiv")!.id;

    expect((await c.body("admin_console", {}, { journey: archivedId })).controls).toBe("readonly");
    expect((await c.body("admin_console", {}, { journey: activeId })).controls).toBe("active");
  });

  it("counts players per cohort", async () => {
    const c = fresh();
    c.seedAdmin();
    await c.loginAdmin();
    await c.call("admin_create", { name: "Reise" });
    await c.call("admin_start");
    c.resetRequest();
    c.cookieSet(null);
    await c.body("join");
    c.cookieSet(null);
    await c.body("join");
    c.resetRequest();
    await c.loginAdmin();

    const b = await c.body("admin_console");
    const journeyCohort = b.cohorts.filter((x: any) => x.key !== "solo").pop();
    expect(journeyCohort.total).toBe(2);
    expect(b.players.length).toBe(2);
  });
});
