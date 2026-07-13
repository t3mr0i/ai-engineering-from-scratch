// Admin role: login, dashboard, create/start/unlock/end a journey.
const { test, expect } = require("@playwright/test");
const { resetStore } = require("./helpers");

test.beforeEach(() => resetStore());

test("admin login rejects wrong password", async ({ page }) => {
  await page.goto("/");
  await page.locator("#adminBtn").click();
  await page.locator("#admUser").fill("admin");
  await page.locator("#admPass").fill("wrong");
  await page.locator("#admGo").click();
  await expect(page.locator("#admErr")).toBeVisible();
});

test("admin can log in and see the dashboard", async ({ page }) => {
  await page.goto("/");
  await page.locator("#adminBtn").click();
  await page.locator("#admUser").fill("admin");
  await page.locator("#admPass").fill("secret");
  await page.locator("#admGo").click();
  await expect(page.getByText("Admin-Dashboard")).toBeVisible();
  // The solo cohort is always present.
  await expect(page.locator(".cohort-tab", { hasText: "Ohne Journey" })).toBeVisible();
});

test("admin creates, starts, unlocks and ends a journey", async ({ page }) => {
  await page.goto("/");
  await page.locator("#adminBtn").click();
  await page.locator("#admUser").fill("admin");
  await page.locator("#admPass").fill("secret");
  await page.locator("#admGo").click();
  await expect(page.getByText("Admin-Dashboard")).toBeVisible();

  // Create a new journey.
  await page.locator("#jNew").click();
  await page.locator("#jName").fill("UI-Workshop");
  await page.locator("#jCreate").click();

  // Lobby status + start button appear.
  await expect(page.locator(".ct-badge.s-lobby").first()).toBeVisible();
  await page.locator("#jStart").click();

  // Live: unlock pills visible, click one.
  await expect(page.locator(".unlock-pill").first()).toBeVisible();
  await page.locator('.unlock-pill[data-ch="1"]').click();
  await expect(page.getByText(/freigeschaltet bis/)).toBeVisible();

  // End the journey (auto-accept the confirmation dialog).
  page.on("dialog", (d) => d.accept());
  await page.locator("#jArchive").click();
  // Afterwards there is again the option to create a new journey.
  await expect(page.locator("#jNew")).toBeVisible();
});
