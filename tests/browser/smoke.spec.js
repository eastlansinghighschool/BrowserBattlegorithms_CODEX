import { test, expect } from "@playwright/test";

test("guided mode is the default entry experience", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#canvas-container")).toBeVisible();
  await expect(page.locator("#blockly-region")).toBeVisible();
  await expect(page.locator("#level-panel")).toContainText("Guided Levels");
  await expect(page.locator("#playResetButton")).toHaveText("Start Level");
});

test("level instructions are visible on load", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#level-panel")).toContainText("Level 1: Move to Target");
  await expect(page.locator("#level-panel")).toContainText("Allowed blocks");
  await expect(page.locator("#level-panel")).toContainText("Goal:");
});

test("starting a level locks Blockly to the expected subset", async ({ page }) => {
  await page.goto("/");
  const beforeStart = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getAvailableToolboxBlockTypes());
  expect(beforeStart).toEqual([
    "battlegorithms_move_forward",
    "battlegorithms_move_up_screen",
    "battlegorithms_move_down_screen",
    "battlegorithms_stay_still"
  ]);

  await page.locator("#playResetButton").click();

  const afterStart = await page.evaluate(() => ({
    toolbox: window.__BBA_TEST_HOOKS__.getAvailableToolboxBlockTypes(),
    readOnly: window.__BBA_TEST_HOOKS__.getBlocklyWorkspace().readOnly
  }));

  expect(afterStart.toolbox).toEqual(beforeStart);
  expect(afterStart.readOnly).toBeTruthy();
});

test("passing level 1 unlocks level 2", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.startLevel("move-to-target");
    const state = hooks.getState();
    const actor = state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
    actor.gridX = 4;
    actor.gridY = 4;
    hooks.evaluateLevelProgress();
  });

  const levelState = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getLevelState());
  expect(levelState.activeLevelResult).toBe("PASSED");
  expect(levelState.levelProgress["reach-enemy-flag"]).toBe("AVAILABLE");
  await expect(page.locator("#level-panel")).toContainText("Level passed");
  await expect(page.getByRole("button", { name: "Next Level" })).toBeVisible();
});

test("switching to free play restores the full toolbox", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Free Play" }).click();

  const state = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getLevelState());
  const toolbox = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getAvailableToolboxBlockTypes());

  expect(state.currentModeView).toBe("FREE_PLAY");
  expect(toolbox).toContain("battlegorithms_jump_forward");
  expect(toolbox).toContain("battlegorithms_place_barrier");
});

test("reset level returns the current guided level to setup state", async ({ page }) => {
  await page.goto("/");
  await page.locator("#playResetButton").click();
  await page.locator("#playResetButton").click();

  const levelState = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getLevelState());
  const readOnly = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getBlocklyWorkspace().readOnly);

  expect(levelState.activeLevelResult).toBe("NONE");
  expect(levelState.currentModeView).toBe("GUIDED_LEVELS");
  expect(readOnly).toBeFalsy();
  await expect(page.locator("#playResetButton")).toHaveText("Start Level");
});

test("test hooks expose deterministic level controls", async ({ page }) => {
  await page.goto("/");
  const hookData = await page.evaluate(() => ({
    hasHooks: Boolean(window.__BBA_TEST_HOOKS__),
    hasStartLevel: typeof window.__BBA_TEST_HOOKS__.startLevel === "function",
    hasEnterFreePlay: typeof window.__BBA_TEST_HOOKS__.enterFreePlay === "function",
    hasToolboxReader: typeof window.__BBA_TEST_HOOKS__.getAvailableToolboxBlockTypes === "function"
  }));

  expect(hookData.hasHooks).toBeTruthy();
  expect(hookData.hasStartLevel).toBeTruthy();
  expect(hookData.hasEnterFreePlay).toBeTruthy();
  expect(hookData.hasToolboxReader).toBeTruthy();
});
