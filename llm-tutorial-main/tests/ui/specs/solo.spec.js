// Solo play style: a user clicks through the app without a journey.
const { test, expect } = require("@playwright/test");
const { resetStore, dismissConsent } = require("./helpers");

test.beforeEach(() => resetStore());

test("cover shows start + admin entry in solo mode (stacked CTA)", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#startBtn")).toBeVisible();
  await expect(page.locator("#adminBtn")).toBeVisible();
  // No active journey → no join button, no solo extra.
  await expect(page.locator("#joinBtn")).toHaveCount(0);
  await expect(page.locator("#soloBtn")).toHaveCount(0);
  // CTA vertically stacked with a divider (admin subtly below).
  await expect(page.locator(".actionbar .inner.stack")).toBeVisible();
  await expect(page.locator(".cta-sep")).toBeVisible();
});

test("app shell: body doesn't scroll, content scrolls internally (stable mobile toolbars)", async ({ page }) => {
  // The BODY does not scroll (otherwise the URL/navigation bar toggles on mobile
  // and shrinks the viewport). Only the inner .content area scrolls.
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await expect(page.locator(".actionbar")).toBeVisible();
  const r = await page.evaluate(() => ({
    bodyScrolls: document.body.scrollHeight > window.innerHeight + 2,
    contentOverflowY: getComputedStyle(document.querySelector(".content")).overflowY,
    barFixed: getComputedStyle(document.querySelector(".actionbar")).position === "fixed",
  }));
  expect(r.bodyScrolls).toBe(false);
  expect(r.contentOverflowY).toBe("auto");
  expect(r.barFixed).toBe(false);
});

test("'Fork me on GitHub' ribbon: visible on desktop, hidden on mobile (no room)", async ({ page }) => {
  const ribbon = page.locator(".gh-ribbon");
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("/");
  await expect(ribbon).toBeVisible();
  await expect(ribbon).toHaveAttribute("href", /github\.com\/nachtgold\/llm-tutorial/);
  await page.setViewportSize({ width: 393, height: 852 });
  await expect(ribbon).toBeHidden();
});

test("can start the course and reach a lecture", async ({ page }) => {
  await page.goto("/");
  await page.locator("#startBtn").click();
  await dismissConsent(page);
  await expect(page.locator(".lecture-body")).toBeVisible();
  await expect(page.locator(".actionbar #nextBtn")).toBeVisible();
});

test("AI consent appears on the first lecture and can be declined", async ({ page }) => {
  await page.goto("/");
  await page.locator("#startBtn").click();
  await expect(page.locator(".ai-consent")).toBeVisible();
  await page.locator("#aicNo").click();
  await expect(page.locator(".ai-consent")).toHaveCount(0);
  await expect(page.locator(".lecture-body")).toBeVisible();
});

test("can advance into the first minigame", async ({ page }) => {
  await page.goto("/");
  await page.locator("#startBtn").click();      // → Lecture chapter 1 (consent dialog)
  await dismissConsent(page);
  await page.locator("#nextBtn").click();        // → Game chapter 1
  await expect(page.locator("#game")).toBeVisible();
});

test("glossary overlay opens and lists terms", async ({ page }) => {
  await page.goto("/");
  await page.locator("#glossaryBtn").click();
  await expect(page.locator(".glossary-list .gl-item").first()).toBeVisible();
});
