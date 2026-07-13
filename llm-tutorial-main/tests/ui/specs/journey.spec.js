// Journey play style: a player joins, waits in the lobby and is advanced
// on start (by the moderation) without a reload.
const { test, expect } = require("@playwright/test");
const { resetStore, apiAdmin } = require("./helpers");

test.beforeEach(() => resetStore());

test("player sees join button when a journey is in the lobby", async ({ page, request }) => {
  await apiAdmin(request, { create: "Lobby-Test" });
  await page.goto("/");
  await expect(page.locator("#joinBtn")).toBeVisible();
  await expect(page.locator("#startBtn")).toHaveCount(0);
});

test("journey cover offers join prominently plus a quiet solo + admin option", async ({ page, request }) => {
  await apiAdmin(request, { create: "Solo-Option" });
  await page.goto("/");
  // Joining is the main action; solo and admin are subtly below.
  await expect(page.locator("#joinBtn")).toBeVisible();
  await expect(page.locator("#soloBtn")).toBeVisible();
  await expect(page.locator("#adminBtn")).toBeVisible();
});

test("player joins and lands in the lobby with an identity", async ({ page, request }) => {
  await apiAdmin(request, { create: "Lobby-Test" });
  await page.goto("/");
  await page.locator("#joinBtn").click();
  await expect(page.getByText("Gleich geht's los")).toBeVisible();
  await expect(page.locator(".identity")).toBeVisible();
  await expect(page.locator(".lobby-count")).toContainText("Lobby");
});

test("player advances automatically when the admin starts", async ({ page, request }) => {
  await apiAdmin(request, { create: "Sync-Test" });
  await page.goto("/");
  await page.locator("#joinBtn").click();
  await expect(page.locator(".identity")).toBeVisible();

  // Moderation starts the journey via the API.
  await apiAdmin(request, { start: true });

  // The background poll (≈4s) switches the lobby to the first lecture.
  await expect(page.locator(".lecture-body")).toBeVisible({ timeout: 12000 });
});

test("admin dashboard shows the joined player", async ({ page, request, browser }) => {
  await apiAdmin(request, { create: "Dash-Test" });

  // Player joins in their own context.
  const playerCtx = await browser.newContext();
  const playerPage = await playerCtx.newPage();
  await playerPage.goto("/");
  await playerPage.locator("#joinBtn").click();
  await expect(playerPage.locator(".identity")).toBeVisible();

  // Admin opens the dashboard and sees one person in the journey.
  await page.goto("/");
  await page.locator("#adminBtn").click();
  await page.locator("#admUser").fill("admin");
  await page.locator("#admPass").fill("secret");
  await page.locator("#admGo").click();
  await expect(page.locator(".admin-table tbody tr")).toHaveCount(1);

  await playerCtx.close();
});
