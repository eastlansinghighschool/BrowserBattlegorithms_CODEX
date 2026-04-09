import { test, expect } from "@playwright/test";
import { buildSolutionXml, chooseFreePlay, clearStorageBeforeEach, loadWorkspaceXml, waitForHeavyReady } from "./helpers.js";

clearStorageBeforeEach(test);

test("free play setup panel exposes mode, team size, and map selectors", async ({ page }) => {
  await page.goto("/");
  await chooseFreePlay(page);

  await expect(page.locator('select[data-action="free-play-mode"]')).toBeVisible();
  await expect(page.locator('select[data-action="free-play-team-size"]')).toBeVisible();
  await expect(page.locator('select[data-action="free-play-map"]')).toBeVisible();
});

test("free play shows Team 2 controls with a semicolon keycap in the options panel", async ({ page }) => {
  await page.goto("/");
  await chooseFreePlay(page);

  await expect(page.locator("#level-panel")).toContainText("Team 2 Human");
  const team2MoveRow = page.locator("#level-panel .control-chip-row").filter({ hasText: "Move" }).nth(1);
  await expect(team2MoveRow).toContainText("O");
  await expect(team2MoveRow).toContainText("K");
  await expect(team2MoveRow).toContainText("L");
  await expect(team2MoveRow).toContainText(";");
  await expect(page.locator("#blockly-region")).not.toContainText("Team 2 Human");
});

test("free play PvP uses separate program tabs that preserve different team programs", async ({ page }) => {
  await page.goto("/");
  await chooseFreePlay(page);

  await page.locator('select[data-action="free-play-mode"]').selectOption("PVP");
  await loadWorkspaceXml(page, buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`));
  await page.getByRole("button", { name: "Team 2 Program" }).click();
  await loadWorkspaceXml(page, buildSolutionXml(`<block type="battlegorithms_stay_still"></block>`));

  await page.getByRole("button", { name: "Team 1 Program" }).click();
  await expect(page.locator("#blockly-region")).toContainText("Move Forward");
  await page.getByRole("button", { name: "Team 2 Program" }).click();
  await expect(page.locator("#blockly-region")).toContainText("Stay Still");
});

test("free play selectors update the visible setup summary and rebuild the match", async ({ page }) => {
  await page.goto("/");
  await chooseFreePlay(page);

  await page.locator('select[data-action="free-play-mode"]').selectOption("PVCPU_TACTICAL");
  await page.locator('select[data-action="free-play-team-size"]').selectOption("5");
  await page.locator('select[data-action="free-play-map"]').selectOption("midfieldPressure");

  await expect(page.locator("#level-panel")).toContainText("Player vs CPU (Tactical)");
  await expect(page.locator("#level-panel")).toContainText("5 runners per side");
  await expect(page.locator("#level-panel")).toContainText("Midfield Pressure");

  const runnerCounts = await page.evaluate(() => {
    const runners = window.__BBA_TEST_HOOKS__.app.state.allRunners;
    return {
      playerTeam: runners.filter((runner) => runner.team === 1).length,
      cpuTeam: runners.filter((runner) => runner.team === 2).length
    };
  });

  expect(runnerCounts.playerTeam).toBe(5);
  expect(runnerCounts.cpuTeam).toBe(5);
});

test("PvCPU Easy and Tactical both create active sandbox opponents", async ({ page }) => {
  await page.goto("/");
  await chooseFreePlay(page);

  await page.locator('select[data-action="free-play-mode"]').selectOption("PVCPU_EASY");
  const easy = await page.evaluate(() => {
    const runners = window.__BBA_TEST_HOOKS__.app.state.allRunners;
    return {
      cpuCount: runners.filter((runner) => runner.team === 2 && runner.isNPC).length,
      allCpu: runners.filter((runner) => runner.team === 2).every((runner) => runner.isNPC)
    };
  });

  await page.locator('select[data-action="free-play-mode"]').selectOption("PVCPU_TACTICAL");
  const tactical = await page.evaluate(() => {
    const runners = window.__BBA_TEST_HOOKS__.app.state.allRunners.filter((runner) => runner.team === 2);
    return {
      cpuCount: runners.filter((runner) => runner.isNPC).length,
      anyFrozen: runners.some((runner) => runner.isFrozen)
    };
  });

  expect(easy.cpuCount).toBeGreaterThan(0);
  expect(easy.allCpu).toBeTruthy();
  expect(tactical.cpuCount).toBeGreaterThan(0);
  expect(tactical.anyFrozen).toBeFalsy();
});

test("Team 2 keyboard movement works in PvP including the semicolon move key", async ({ page }) => {
  await page.goto("/");
  await chooseFreePlay(page);
  await page.locator('select[data-action="free-play-mode"]').selectOption("PVP");

  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    const team2Human = hooks.app.state.allRunners.find((runner) => runner.team === 2 && runner.isHumanControlled);
    hooks.app.state.mainGameState = "RUNNING";
    hooks.app.state.currentTurnState = "AWAITING_INPUT";
    hooks.app.state.activeRunnerIndex = hooks.app.state.allRunners.indexOf(team2Human);
  });

  const before = await page.evaluate(() => {
    const team2Human = window.__BBA_TEST_HOOKS__.app.state.allRunners.find(
      (runner) => runner.team === 2 && runner.isHumanControlled
    );
    return { x: team2Human.gridX, y: team2Human.gridY };
  });

  await page.keyboard.press(";");
  await page.waitForFunction(
    (start) => {
      const team2Human = window.__BBA_TEST_HOOKS__.app.state.allRunners.find(
        (runner) => runner.team === 2 && runner.isHumanControlled
      );
      return team2Human.gridX !== start.x || team2Human.gridY !== start.y;
    },
    before
  );

  const after = await page.evaluate(() => {
    const team2Human = window.__BBA_TEST_HOOKS__.app.state.allRunners.find(
      (runner) => runner.team === 2 && runner.isHumanControlled
    );
    return { x: team2Human.gridX, y: team2Human.gridY };
  });

  expect(after.x).toBeGreaterThan(before.x);
});
