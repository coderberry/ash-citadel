import { expect, test } from "@playwright/test";

test("mobile layout renders core controls and nonblank canvas", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Power", { exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Deployment controls" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Militia Squad/i })).toBeVisible();

  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box?.width).toBeGreaterThan(200);
  expect(box?.height).toBeGreaterThan(300);

  await page.mouse.click((box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + (box?.height ?? 0) / 2);
  await expect(page.getByText("Power", { exact: true })).toBeVisible();
});

test("manifest is available", async ({ page }) => {
  const response = await page.goto("/manifest.webmanifest");
  expect(response?.ok()).toBe(true);
  expect(await response?.json()).toMatchObject({ name: "Ash Citadel", display: "standalone" });
});
