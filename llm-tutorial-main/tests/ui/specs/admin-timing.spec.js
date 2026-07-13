// Admin pacing: live timer, chapter distribution (badges on the unlock pills),
// frontier display ("X/N durch") and the "ready to unlock" hint.
//
// Setup via the API: create a journey in the lobby → several players join
// (in the lobby = approved) → start the journey → each reports chapter 2.
// Then the moderation opens the dashboard in the browser and checks the displays.
const { test, expect } = require("@playwright/test");
const { resetStore, apiAdmin } = require("./helpers");

test.beforeEach(() => resetStore());

async function loginDashboard(page) {
  await page.goto("/");
  await page.locator("#adminBtn").click();
  await page.locator("#admUser").fill("admin");
  await page.locator("#admPass").fill("secret");
  await page.locator("#admGo").click();
  await expect(page.getByText("Admin-Dashboard")).toBeVisible();
}

test("live journey shows timer, distribution badges, frontier + unlock nudge", async ({ page, request, playwright, baseURL }) => {
  // 1) Create a journey in the lobby (admin context = request).
  await apiAdmin(request, { create: "Timing-Test" });

  // 2) Three players join in the lobby (own cookie contexts → approved).
  const players = [];
  for (let i = 0; i < 3; i++) {
    const ctx = await playwright.request.newContext({ baseURL });
    await ctx.post("/api?action=join");
    players.push(ctx);
  }

  // 3) Start the journey (sets started_at + unlocked_at).
  await apiAdmin(request, { start: true });

  // 4) All report chapter 2 (i.e. beyond the unlocked chapter 0).
  for (const ctx of players) {
    await ctx.post("/api?action=pos", { data: { chapter: 2 } });
  }

  // 5) Open the dashboard and check the pacing displays.
  await loginDashboard(page);

  await expect(page.locator(".adm-timer")).toContainText("läuft seit");
  // Distribution: the badge on the pill for chapter 3 (index 2) shows 3 people.
  await expect(page.locator('.unlock-pill[data-ch="2"] .pill-badge')).toHaveText("3");
  // Frontier: all 3 are beyond the currently unlocked chapter.
  await expect(page.locator(".frontier-info")).toContainText("3/3 durch");
  // Enough are through → hint to unlock the next chapter.
  await expect(page.locator(".unlock-nudge")).toBeVisible();

  for (const ctx of players) await ctx.dispose();
});

test("timer counts up over time", async ({ page, request, playwright, baseURL }) => {
  await apiAdmin(request, { create: "Tick-Test" });
  const ctx = await playwright.request.newContext({ baseURL });
  await ctx.post("/api?action=join");
  await apiAdmin(request, { start: true });

  await loginDashboard(page);
  const timer = page.locator(".adm-timer");
  await expect(timer).toContainText("läuft seit");
  const first = await timer.textContent();
  await page.waitForTimeout(2200); // the 1-second ticker keeps running
  const second = await timer.textContent();
  expect(second).not.toBe(first);

  await ctx.dispose();
});
