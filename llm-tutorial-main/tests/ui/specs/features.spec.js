// New minigames & features (60-minute expansion): real tokenizer, embeddings,
// attention, cost, prompt injection, on-device fallback, easter egg, results.
// We jump directly to the flow position via localStorage (solo mode).
const { test, expect } = require("@playwright/test");
const { resetStore, seedState, soloAt, POS } = require("./helpers");

test.beforeEach(() => resetStore());

test("real GPT tokenizer splits text into tokens", async ({ page }) => {
  await seedState(page, soloAt(POS.tokenizer));
  await page.goto("/");
  await expect(page.locator(".tok").first()).toBeVisible();
  const n = Number(await page.locator("#tokN").textContent());
  expect(n).toBeGreaterThan(3); // real cl100k split, not 0/empty
});

test("embedding map renders all words and a vector", async ({ page }) => {
  await seedState(page, soloAt(POS.embedding));
  await page.goto("/");
  await expect(page.locator(".emap-dot")).toHaveCount(9);
  await expect(page.locator(".evec-word")).toContainText("Hund");
  await expect(page.locator(".vecbars .vb").first()).toBeVisible();
});

test("attention reveals which word the pronoun attends to", async ({ page }) => {
  await seedState(page, soloAt(POS.attention));
  await page.goto("/");
  await page.locator(".attn-tok.focus").click();
  await expect(page.locator(".attn-top").first()).toBeVisible();
  await expect(page.locator("#anote")).toContainText("Pokal");
});

test("cost calculator shows a monthly figure in euros", async ({ page }) => {
  await seedState(page, soloAt(POS.cost));
  await page.goto("/");
  await expect(page.locator("#coMonth")).toContainText("€");
  await expect(page.locator("#coDay")).toContainText("€");
});

test("prompt injection: tapping the malicious line reveals the warning", async ({ page }) => {
  await seedState(page, soloAt(POS.injection));
  await page.goto("/");
  await page.locator(".inj-line", { hasText: "Ignoriere alle" }).click();
  await expect(page.locator("#ifb.ok")).toBeVisible();
});

test("opted-in cover does NOT load the on-device model (avoids OOM crash on reload)", async ({ page }) => {
  // Regression: the model was loaded on start/on every (background) reload
  // → ~1 GB in the mobile tab → crash. It may only load in the last chapter.
  await seedState(page, soloAt(0, { aiOptIn: true }));
  let aiReq = 0;
  page.on("request", (r) => { if (/esm\.sh|huggingface|transformers|onnxruntime|\.onnx/i.test(r.url())) aiReq++; });
  await page.goto("/");
  await expect(page.locator("#startBtn")).toBeVisible();
  await page.waitForTimeout(800);
  expect(aiReq).toBe(0);
});

test("on-device chapter shows load button + static example when declined", async ({ page }) => {
  await seedState(page, soloAt(POS.ondevice));
  await page.goto("/");
  await expect(page.locator("#magLoad")).toBeVisible();
  await expect(page.locator(".mag-static")).toBeVisible(); // static example as placeholder
});

test("temperature easter egg unlocks at max temp after several rerolls", async ({ page }) => {
  await seedState(page, soloAt(POS.temperature));
  await page.goto("/");
  await page.evaluate(() => {
    const r = document.getElementById("trange");
    r.value = "1.5"; r.dispatchEvent(new Event("input"));
    const b = document.getElementById("reroll");
    for (let i = 0; i < 7; i++) b.click();
  });
  await expect(page.locator(".egg-ov")).toBeVisible();
  await expect(page.locator(".egg-code")).toContainText("STOCHASTISCHER PAPAGEI");
});

test("temperature reroll: touch-action guards double-tap zoom, fast clicks just roll", async ({ page }) => {
  // Regression: fast rerolling accidentally triggered double-tap zoom on mobile.
  // touch-action: manipulation prevents that (globally), rerolling stays normal.
  await seedState(page, soloAt(POS.temperature));
  await page.goto("/");
  const ta = await page.evaluate(() => ({
    reroll: getComputedStyle(document.getElementById("reroll")).touchAction,
    body: getComputedStyle(document.body).touchAction,
  }));
  expect(ta.reroll).toBe("manipulation");
  expect(ta.body).toBe("manipulation");
  const reroll = page.locator("#reroll");
  for (let i = 0; i < 6; i++) await reroll.click(); // fast, repeated rerolling
  await expect(page.locator("#tsample")).toContainText("Leuchtturm");
  await expect(page.locator(".egg-ov")).toHaveCount(0); // no egg at default temperature
});

test("results: consolation card + hidden egg reveals a teaser on tap", async ({ page }) => {
  await seedState(page, soloAt(POS.results, { quiz: { 0: 1 } }));
  await page.goto("/");
  await expect(page.locator(".prize-card")).toBeVisible();
  await page.locator("#hiddenEgg").click();
  await expect(page.locator("#eggTeaser")).toHaveClass(/show/);
});

test("results: a found egg shows the codeword", async ({ page }) => {
  await seedState(page, soloAt(POS.results, { quiz: { 0: 1 }, eggFound: true }));
  await page.goto("/");
  await expect(page.locator(".egg-found .egg-code")).toContainText("STOCHASTISCHER PAPAGEI");
});
