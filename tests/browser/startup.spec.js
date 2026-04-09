import { test, expect } from "@playwright/test";
import { chooseFreePlay, chooseGuided, clearStorageBeforeEach, waitForHeavyReady } from "./helpers.js";

clearStorageBeforeEach(test);

test("app opens with the welcome chooser and loading placeholders", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  await expect(page.locator("#tutorial-overlay")).toContainText("Welcome");
  await expect(page.locator("#tutorial-overlay")).toContainText("Hour of Code experience");
  await expect(page.locator("#tutorial-overlay").getByRole("button", { name: "Guided Levels" })).toBeVisible({
    timeout: 20000
  });
  await expect(page.locator("#tutorial-overlay").getByRole("button", { name: "Free Play" })).toBeVisible();
  await expect(page.locator("#canvas-container")).toBeVisible();
  await expect(page.locator("#blockly-region")).toBeVisible();
  await expect(page.locator("#playResetButton")).toBeHidden();
});

test("loading placeholders disappear once the heavy systems are ready", async ({ page }) => {
  await page.goto("/");
  await waitForHeavyReady(page);

  await expect(page.locator("#tutorial-overlay")).toContainText("Guided Levels");
  await expect(page.locator("#board-loading-placeholder")).toBeHidden();
  await expect(page.locator("#blockly-loading-placeholder")).toBeHidden();
  await expect(page.locator("#blocklyDiv")).toBeVisible();
});

test("choosing guided immediately keeps the mode chooser usable during first-load", async ({ page }) => {
  await page.goto("/");
  await chooseGuided(page);

  await expect(page.locator("#tutorial-overlay .tutorial-card")).toBeVisible();
  await expect(page.locator("#tutorial-overlay")).toContainText("Meet The Board");
  await expect(page.locator("#board-loading-placeholder")).toBeHidden();
  await expect(page.locator("#blockly-loading-placeholder")).toBeHidden();
});

test("choosing free play immediately opens the setup view after lazy loading completes", async ({ page }) => {
  await page.goto("/");
  await chooseFreePlay(page);

  await expect(page.locator("#level-panel")).toContainText("Free Play");
  await expect(page.locator('select[data-action="free-play-mode"]')).toBeVisible();
  await expect(page.locator("#board-loading-placeholder")).toBeHidden();
  await expect(page.locator("#blockly-loading-placeholder")).toBeHidden();
});
