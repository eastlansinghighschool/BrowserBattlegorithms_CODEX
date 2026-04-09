import { test, expect } from "@playwright/test";
import {
  buildSolutionXml,
  chooseGuided,
  clearStorageBeforeEach,
  dismissTutorial,
  loadWorkspaceXml,
  waitForHeavyReady
} from "./helpers.js";

clearStorageBeforeEach(test);

test("passing an early guided level unlocks the next one and Next Level advances into it", async ({ page }) => {
  await page.goto("/");
  await waitForHeavyReady(page);
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.startLevel("move-to-target");
    const actor = hooks.app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
    actor.gridX = 4;
    actor.gridY = 4;
    hooks.evaluateLevelProgress();
  });

  await expect(page.locator("#level-panel")).toContainText("Level passed");
  await expect(page.locator("#nextLevelButton")).toBeVisible();
  await page.locator("#nextLevelButton").click();
  await expect(page.locator("#level-panel")).toContainText("Level 2: Reach Enemy Flag");
});

test("level 6 tutorial can open a read-only demo without replacing the learner workspace", async ({ page }) => {
  await page.goto("/");
  await waitForHeavyReady(page);
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    Object.assign(hooks.app.state.levelProgress, {
      "move-to-target": "PASSED",
      "reach-enemy-flag": "PASSED",
      "score-a-point": "PASSED",
      "barrier-detour": "PASSED",
      "mirror-forward": "PASSED",
      "sensor-barrier-branch": "AVAILABLE"
    });
    hooks.startLevel("sensor-barrier-branch");
    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_move_forward"></block>
          </next>
        </block>
      </xml>
    `);
    hooks.startCurrentLevelTutorial(true);
  });

  await expect(page.locator("#tutorial-overlay")).toContainText("One Block Shape, Many Sensor Ideas");
  await expect(page.locator(".tutorial-demo-blockly")).toBeVisible();
  await expect(page.locator("#blockly-region")).toContainText("Move Forward");
});

test("level 10 explains the special-action requirement and does not pass before it is used", async ({ page }) => {
  await page.goto("/");
  await waitForHeavyReady(page);
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.startLevel("human-runner-practice");
  });

  await expect(page.locator("#level-panel")).toContainText("Jump or Place Barrier");

  const progressWithoutSpecialAction = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    const human = hooks.app.state.allRunners.find((runner) => runner.team === 1 && runner.isHumanControlled);
    human.gridX = 10;
    human.gridY = 4;
    return hooks.evaluateLevelProgress();
  });

  expect(progressWithoutSpecialAction?.result || null).toBe(null);
  await expect(page.locator("#level-panel")).not.toContainText("Level passed");
});

test("guided keyboard-practice level responds to actual Team 1 key presses", async ({ page }) => {
  await page.goto("/");
  await waitForHeavyReady(page);
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.startLevel("human-runner-practice");
  });

  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    const human = hooks.app.state.allRunners.find((runner) => runner.team === 1 && runner.isHumanControlled);
    hooks.app.state.mainGameState = "RUNNING";
    hooks.app.state.currentTurnState = "AWAITING_INPUT";
    hooks.app.state.activeRunnerIndex = hooks.app.state.allRunners.indexOf(human);
  });

  const before = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    const human = hooks.app.state.allRunners.find((runner) => runner.team === 1 && runner.isHumanControlled);
    return { x: human.gridX, y: human.gridY };
  });

  await page.locator("#canvas-container canvas").click();
  await page.keyboard.press("d");
  const queuedAction = await page.waitForFunction(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    const queued = hooks.app.state.queuedActionForCurrentRunner;
    if (!queued) {
      return null;
    }
    return {
      actionType: queued.actionType,
      targetGridX: queued.targetGridX,
      targetGridY: queued.targetGridY,
      currentTurnState: hooks.app.state.currentTurnState
    };
  });

  const queuedValue = await queuedAction.jsonValue();
  expect(queuedValue.actionType).toBe("MOVE");
  expect(queuedValue.currentTurnState).toBe("PROCESSING_ACTION");
  expect(queuedValue.targetGridX).toBeGreaterThan(before.x);
  expect(queuedValue.targetGridY).toBe(before.y);
});

test("a representative advanced teamwork level can pass through the visible guided flow", async ({ page }) => {
  await page.goto("/");
  await waitForHeavyReady(page);
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.startLevel("one-program-two-allies");
  });

  await loadWorkspaceXml(
    page,
    buildSolutionXml(`
      <block type="battlegorithms_if_boolean_else">
        <value name="BOOL">
          <block type="battlegorithms_value_compare">
            <value name="LEFT">
              <block type="battlegorithms_value_runner_index"></block>
            </value>
            <field name="OPERATOR">EQ</field>
            <value name="RIGHT">
              <block type="battlegorithms_value_number">
                <field name="VALUE">0</field>
              </block>
            </value>
          </block>
        </value>
        <statement name="DO">
          <block type="battlegorithms_move_toward">
            <field name="TARGET">ENEMY_FLAG</field>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="battlegorithms_stay_still"></block>
        </statement>
      </block>
    `)
  );

  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    for (let tick = 0; tick < 300; tick += 1) {
      hooks.processTurn();
      if (hooks.app.state.activeLevelResult === "PASSED" || hooks.app.state.activeLevelResult === "FAILED") {
        break;
      }
    }
  });

  await expect(page.locator("#level-panel")).toContainText("Level passed");
});
