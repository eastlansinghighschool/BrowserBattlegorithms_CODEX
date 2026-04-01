import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

async function chooseGuided(page) {
  await page.getByRole("button", { name: "Guided Levels" }).click();
}

async function dismissTutorial(page) {
  const gotIt = page.locator("#tutorial-overlay").getByRole("button", { name: "Got It" });
  if (await gotIt.isVisible()) {
    await gotIt.click();
  }
}

test("app opens with a mode chooser over the board and Blockly", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#canvas-container")).toBeVisible();
  await expect(page.locator("#blockly-region")).toBeVisible();
  await expect(page.locator("#tutorial-overlay .tutorial-card")).toContainText("How do you want to begin?");
  await expect(page.locator("#playResetButton")).toBeHidden();
});

test("choosing guided mode opens the first tutorial overlay", async ({ page }) => {
  await page.goto("/");
  await chooseGuided(page);
  await expect(page.locator("#tutorial-overlay .tutorial-card")).toBeVisible();
  await expect(page.locator("#tutorial-overlay")).toContainText("Meet the Game Board");
});

test("guided instructions are visible after dismissing the tutorial", async ({ page }) => {
  await page.goto("/");
  await chooseGuided(page);
  await dismissTutorial(page);
  await expect(page.locator("#level-panel")).toContainText("Level 1: Move to Target");
  await expect(page.locator("#level-panel")).toContainText("Allowed blocks");
  await expect(page.locator("#level-panel")).toContainText("Human turns:");
  await expect(page.locator("#level-panel")).toContainText("Tips:");
  await expect(page.locator("#level-panel")).toContainText("Show Tutorial");
});

test("guided level picker shows the current level and opens a popover", async ({ page }) => {
  await page.goto("/");
  await chooseGuided(page);
  await dismissTutorial(page);
  await expect(page.locator(".level-picker-trigger")).toContainText("Level 1: Move to Target");
  await page.locator(".level-picker-trigger").click();
  await expect(page.locator(".level-picker-popover")).toBeVisible();
  await expect(page.locator(".level-picker-popover")).toContainText("Level 2: Reach Enemy Flag");
});

test("workspace starts with the On Each Turn event block", async ({ page }) => {
  await page.goto("/");
  await chooseGuided(page);
  await dismissTutorial(page);
  const topBlocks = await page.evaluate(() => {
    const workspace = window.__BBA_TEST_HOOKS__.getBlocklyWorkspace();
    return workspace.getTopBlocks(false).map((block) => ({
      type: block.type,
      movable: block.isMovable(),
      deletable: block.isDeletable()
    }));
  });

  expect(topBlocks).toEqual([
    {
      type: "battlegorithms_on_each_turn",
      movable: false,
      deletable: false
    }
  ]);
});

test("starting a level locks Blockly to the expected subset", async ({ page }) => {
  await page.goto("/");
  await chooseGuided(page);
  await dismissTutorial(page);
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

test("guided panel lets the user switch human turn behavior", async ({ page }) => {
  await page.goto("/");
  await chooseGuided(page);
  await dismissTutorial(page);
  await page.getByRole("button", { name: "Wait For Input" }).click();

  const levelState = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getLevelState());
  expect(levelState.humanTurnBehavior).toBe("WAIT_FOR_INPUT");
  await expect(page.locator("#level-panel")).toContainText("Human turns: Wait For Input");
});

test("passing level 1 unlocks level 2", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.startLevel("move-to-target");
    const state = hooks.getState();
    const actor = state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
    actor.gridX = 4;
    actor.gridY = 4;
    hooks.evaluateLevelProgress();
  });

  const levelState = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getLevelState());
  const readOnly = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getBlocklyWorkspace().readOnly);
  expect(levelState.activeLevelResult).toBe("PASSED");
  expect(levelState.levelProgress["reach-enemy-flag"]).toBe("AVAILABLE");
  expect(readOnly).toBeFalsy();
  await expect(page.locator("#level-panel")).toContainText("Level passed");
  await expect(page.locator('#level-panel button[data-action="next-level"]')).toBeVisible();
  await expect(page.locator("#nextLevelButton")).toBeVisible();
});

test("failing a guided level restores Blockly editing", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.startLevel("move-to-target");
    hooks.app.state.currentTurnNumber = 9;
    hooks.evaluateLevelProgress();
  });

  const result = await page.evaluate(() => ({
    levelState: window.__BBA_TEST_HOOKS__.getLevelState(),
    readOnly: window.__BBA_TEST_HOOKS__.getBlocklyWorkspace().readOnly
  }));

  expect(result.levelState.activeLevelResult).toBe("FAILED");
  expect(result.readOnly).toBeFalsy();
  await expect(page.locator("#playResetButton")).toHaveText("Retry Level");
});

test("switching to free play restores the full toolbox", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Free Play" }).click();

  const state = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getLevelState());
  const toolbox = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getAvailableToolboxBlockTypes());

  expect(state.currentModeView).toBe("FREE_PLAY");
  expect(state.showModePicker).toBe(false);
  expect(toolbox).toContain("battlegorithms_jump_forward");
  expect(toolbox).toContain("battlegorithms_place_barrier");
});

test("test hooks expose deterministic level and tutorial controls", async ({ page }) => {
  await page.goto("/");
  const hookData = await page.evaluate(() => ({
    hasHooks: Boolean(window.__BBA_TEST_HOOKS__),
    hasStartLevel: typeof window.__BBA_TEST_HOOKS__.startLevel === "function",
    hasEnterFreePlay: typeof window.__BBA_TEST_HOOKS__.enterFreePlay === "function",
    hasToolboxReader: typeof window.__BBA_TEST_HOOKS__.getAvailableToolboxBlockTypes === "function",
    hasTutorialStarter: typeof window.__BBA_TEST_HOOKS__.startCurrentLevelTutorial === "function"
  }));

  expect(hookData.hasHooks).toBeTruthy();
  expect(hookData.hasStartLevel).toBeTruthy();
  expect(hookData.hasEnterFreePlay).toBeTruthy();
  expect(hookData.hasToolboxReader).toBeTruthy();
  expect(hookData.hasTutorialStarter).toBeTruthy();
});
