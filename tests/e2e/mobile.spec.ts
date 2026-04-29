import { expect, test } from "@playwright/test";

const saveKey = "ash-citadel-save:ash-citadel";

function makeSavedState(overrides: Record<string, unknown> = {}) {
  return {
    configId: "ash-citadel",
    configVersion: 1,
    currentZoneId: "block-01-broken-market",
    resources: { power: 20, scrap: 0, rations: 5, intel: 0 },
    totals: { power: 20, scrap: 0, rations: 5, intel: 0 },
    upgradeRanks: {},
    unlockedUnitIds: ["militia-squad"],
    completedZoneIds: [],
    entities: [
      {
        id: "entity-1",
        configId: "raider",
        side: "enemy",
        x: 550,
        y: 260,
        health: 24,
        maxHealth: 24,
        attackCooldown: 0,
      },
    ],
    nextEntityId: 2,
    zoneCompleted: false,
    runStatus: "active",
    runStats: { defeatedEnemies: 0, earned: {} },
    lastSavedAt: Date.now(),
    ...overrides,
  };
}

test("mobile layout renders core controls and nonblank canvas", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Power", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Run status" })).toContainText("Break the Broken Market");
  await expect(page.getByRole("navigation", { name: "Deployment controls" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Militia Squad/i })).toBeVisible();
  await expect(page.getByRole("status", { name: "Deployment hint" })).toContainText("Tap district");

  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box?.width).toBeGreaterThan(200);
  expect(box?.height).toBeGreaterThan(300);

  await page.mouse.click((box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + (box?.height ?? 0) / 2);
  await expect(page.getByText("Power", { exact: true })).toBeVisible();
});

test("deployment controls explain why a selected crew is unaffordable", async ({ page }) => {
  await page.addInitScript(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    { key: saveKey, state: makeSavedState({ resources: { power: 0, scrap: 0, rations: 5, intel: 0 } }) },
  );

  await page.goto("/");

  await expect(page.getByRole("button", { name: /Militia Squad/i })).toBeDisabled();
  await expect(page.getByRole("status", { name: "Deployment hint" })).toContainText("Need 6 power");
});

test("failed push can be retried from the outcome dialog", async ({ page }) => {
  await page.addInitScript(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    {
      key: saveKey,
      state: makeSavedState({
        resources: { power: 0, scrap: 8, rations: 0, intel: 0 },
        totals: { power: 20, scrap: 8, rations: 5, intel: 0 },
        entities: [],
        runStatus: "failed",
        runStats: { defeatedEnemies: 2, earned: { scrap: 8 } },
      }),
    },
  );

  await page.goto("/");

  await expect(page.getByRole("dialog", { name: "Push failed" })).toContainText("8 scrap recovered");
  await page.getByRole("button", { name: "Retry Push" }).click();
  await expect(page.getByRole("dialog", { name: "Push failed" })).toBeHidden();
  await expect(page.getByRole("region", { name: "Run status" })).toContainText("7 hostiles remain");
});

test("manifest is available", async ({ page }) => {
  const response = await page.goto("/manifest.webmanifest");
  expect(response?.ok()).toBe(true);
  expect(await response?.json()).toMatchObject({ name: "Ash Citadel", display: "standalone" });
});
