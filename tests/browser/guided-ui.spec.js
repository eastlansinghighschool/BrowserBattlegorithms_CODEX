import { test, expect } from "@playwright/test";
import { chooseGuided, clearStorageBeforeEach, dismissTutorial, waitForHeavyReady } from "./helpers.js";

clearStorageBeforeEach(test);

test("guided instructions are visible after dismissing the first tutorial", async ({ page }) => {
  await page.goto("/");
  await chooseGuided(page);
  await dismissTutorial(page);

  await expect(page.locator("#level-panel")).toContainText("Level 1: Move to Target");
  await expect(page.locator("#level-panel")).toContainText("What you are looking at");
  await expect(page.locator("#level-panel")).toContainText("Ally runner");
  await expect(page.locator("#showTutorialButton")).toBeVisible();
});

test("guided level picker shows the current level and lets the learner browse ahead", async ({ page }) => {
  await page.goto("/");
  await chooseGuided(page);
  await dismissTutorial(page);

  await expect(page.locator(".level-picker-trigger")).toContainText("Level 1: Move to Target");
  await page.locator(".level-picker-trigger").click();
  await expect(page.locator(".level-picker-popover")).toBeVisible();
  await expect(page.locator(".level-picker-popover")).toContainText("Level 2: Reach Enemy Flag");
  await expect(page.locator(".level-picker-popover")).toContainText("Level 3: Score a Point");
});

test("the guided workspace starts with a visible starter program and becomes read-only during play", async ({
  page
}) => {
  await page.goto("/");
  await chooseGuided(page);
  await dismissTutorial(page);

  await expect(page.locator("#blockly-region")).toContainText("On Each Turn");
  await page.locator("#playResetButton").click();

  await expect(page.locator("#playResetButton")).toContainText("Reset Level");
  await expect(page.locator("#blocklyDiv")).toHaveClass(/blockly-area-read-only/);
});

test("guided panel can switch a level into keyboard practice mode", async ({ page }) => {
  await page.goto("/");
  await chooseGuided(page);
  await dismissTutorial(page);

  await page.locator("#level-panel summary").filter({ hasText: "Human Turn Options" }).click();
  await page.getByRole("button", { name: "Wait For Input" }).click();

  await expect(page.locator("#blockly-region")).toContainText("Keyboard practice");
  await expect(page.locator("#blockly-region")).toContainText("W");
  await expect(page.locator("#blockly-region")).toContainText("F");
});

test("wide layouts can collapse the lesson panel and resize the actual editor workspace", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await chooseGuided(page);
  await dismissTutorial(page);

  const before = await page.evaluate(() => ({
    regionWidth: document.querySelector("#blockly-region").getBoundingClientRect().width,
    svgWidth: document.querySelector(".blocklySvg")?.getBoundingClientRect().width || 0
  }));

  await page.locator('#level-panel button[data-action="toggle-panel-collapse"]').click();
  await page.waitForTimeout(100);

  const after = await page.evaluate(() => ({
    collapsed: document.querySelector("#game-container").classList.contains("lesson-panel-collapsed"),
    regionWidth: document.querySelector("#blockly-region").getBoundingClientRect().width,
    svgWidth: document.querySelector(".blocklySvg")?.getBoundingClientRect().width || 0
  }));

  expect(after.collapsed).toBeTruthy();
  expect(after.regionWidth).toBeGreaterThan(before.regionWidth);
  expect(after.svgWidth).toBeGreaterThan(before.svgWidth);
});

test("desktop workspace size controls resize the editor and persist across reload", async ({ page }) => {
  await page.goto("/");
  await chooseGuided(page);
  await dismissTutorial(page);

  const before = await page.locator("#blockly-region").boundingBox();
  await page.getByRole("button", { name: "Tall" }).click();
  const tall = await page.locator("#blockly-region").boundingBox();
  expect(tall?.height || 0).toBeGreaterThan(before?.height || 0);

  await page.reload();
  await chooseGuided(page);
  await dismissTutorial(page);
  const afterReload = await page.locator("#blockly-region").boundingBox();
  expect(Math.abs((afterReload?.height || 0) - (tall?.height || 0))).toBeLessThan(2);
});

test("guided HUD shows level state, turn, and title instead of scores", async ({ page }) => {
  await page.goto("/");
  await chooseGuided(page);
  await dismissTutorial(page);

  await expect(page.locator("#scoreDisplay")).toContainText("Level ready");
  await expect(page.locator("#scoreDisplay")).toContainText("Turn: 1");
  await expect(page.locator("#scoreDisplay")).toContainText("Level 1: Move to Target");
  await expect(page.locator("#scoreDisplay")).not.toContainText("Scores:");
});

test("guided reset keeps the learner program and returns the level to Start Level", async ({ page }) => {
  await page.goto("/");
  await chooseGuided(page);
  await dismissTutorial(page);

  await page.evaluate(() => {
    window.__BBA_TEST_HOOKS__.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_move_forward"></block>
          </next>
        </block>
      </xml>
    `);
  });

  await page.locator("#playResetButton").click();
  await expect(page.locator("#playResetButton")).toContainText("Reset Level");
  await page.locator("#playResetButton").click();

  await expect(page.locator("#playResetButton")).toContainText("Start Level");
  await expect(page.locator("#blockly-region")).toContainText("Move Forward");
  await expect(page.locator("#blocklyDiv")).not.toHaveClass(/blockly-area-read-only/);
});
