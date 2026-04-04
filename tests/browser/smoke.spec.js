import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

async function chooseGuided(page) {
  await page.waitForLoadState("domcontentloaded");
  const guidedButton = page.getByRole("button", { name: "Guided Levels" });
  await expect(guidedButton).toBeVisible({ timeout: 10000 });
  await guidedButton.click();
}

async function dismissTutorial(page) {
  const gotIt = page.locator("#tutorial-overlay").getByRole("button", { name: "Got It" });
  if (await gotIt.isVisible()) {
    await gotIt.click();
  }
}

test("app opens with a mode chooser over the board and Blockly", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByRole("button", { name: "Guided Levels" })).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#tutorial-overlay")).toContainText("How do you want to begin?");
  await expect(page.locator("#game-container")).toHaveCount(1);
  await expect(page.locator("#canvas-container")).toHaveCount(1);
  await expect(page.locator("#blockly-region")).toBeVisible();
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
  await expect(page.locator(".level-picker-popover")).toContainText("Level 3: Score a Point");
  await expect(page.locator(".level-picker-popover")).toContainText("Level 4: Barrier Detour");
  await expect(page.locator(".level-picker-popover")).toContainText("Level 5: Forward Works Both Ways");
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

test("passing level 2 unlocks level 3 and next level advances into it", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.app.state.levelProgress["reach-enemy-flag"] = "AVAILABLE";
    hooks.startLevel("reach-enemy-flag");
    const state = hooks.getState();
    const actor = state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
    const enemyFlag = state.gameFlags[2];
    actor.gridX = enemyFlag.gridX;
    actor.gridY = enemyFlag.gridY;
    hooks.evaluateLevelProgress();
  });

  const levelState = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getLevelState());
  expect(levelState.levelProgress["score-a-point"]).toBe("AVAILABLE");
  await page.locator("#nextLevelButton").click();
  await expect(page.locator("#level-panel")).toContainText("Level 3: Score a Point");
});

test("passing level 3 unlocks level 4 and next level advances into it", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.app.state.levelProgress["reach-enemy-flag"] = "PASSED";
    hooks.app.state.levelProgress["score-a-point"] = "AVAILABLE";
    hooks.startLevel("score-a-point");
    hooks.app.state.teamScores[1] = 1;
    hooks.evaluateLevelProgress();
  });

  const levelState = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getLevelState());
  expect(levelState.levelProgress["barrier-detour"]).toBe("AVAILABLE");
  await expect(page.locator("#level-panel")).toContainText("Scoring a point completed the challenge");
  await page.locator("#nextLevelButton").click();
  await expect(page.locator("#level-panel")).toContainText("Level 4: Barrier Detour");
});

test("passing level 4 unlocks the first sensing-track levels", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.app.state.levelProgress["move-to-target"] = "PASSED";
    hooks.app.state.levelProgress["reach-enemy-flag"] = "PASSED";
    hooks.app.state.levelProgress["score-a-point"] = "PASSED";
    hooks.app.state.levelProgress["barrier-detour"] = "AVAILABLE";
    hooks.startLevel("barrier-detour");
    const actor = hooks.app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
    actor.gridX = 6;
    actor.gridY = 4;
    hooks.evaluateLevelProgress();
  });

  const levelState = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getLevelState());
  expect(levelState.levelProgress["mirror-forward"]).toBe("AVAILABLE");
  await page.locator("#nextLevelButton").click();
  await expect(page.locator("#level-panel")).toContainText("Level 5: Forward Works Both Ways");
});

test("guided toolbox expands correctly for levels 3 and 4", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.app.state.levelProgress["reach-enemy-flag"] = "PASSED";
    hooks.app.state.levelProgress["score-a-point"] = "AVAILABLE";
    hooks.startLevel("score-a-point");
  });

  let toolboxTypes = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getAvailableToolboxBlockTypes());
  expect(toolboxTypes).toContain("battlegorithms_if_have_enemy_flag");
  expect(toolboxTypes).toContain("battlegorithms_if_have_enemy_flag_else");

  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.levelProgress["barrier-detour"] = "AVAILABLE";
    hooks.startLevel("barrier-detour");
  });

  toolboxTypes = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getAvailableToolboxBlockTypes());
  expect(toolboxTypes).toContain("battlegorithms_if_barrier_in_front");
  expect(toolboxTypes).toContain("battlegorithms_if_barrier_in_front_else");
});

test("sensing levels gate the generic sensor dropdown options by level", async ({ page }) => {
  await page.goto("/");
  const sensorOptions = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    Object.assign(hooks.app.state.levelProgress, {
      "move-to-target": "PASSED",
      "reach-enemy-flag": "PASSED",
      "score-a-point": "PASSED",
      "barrier-detour": "PASSED",
      "mirror-forward": "PASSED",
      "sensor-barrier-branch": "AVAILABLE",
      "watch-the-wall": "AVAILABLE",
      "find-the-human": "AVAILABLE"
    });
    hooks.startLevel("sensor-barrier-branch");
    const barrierObjects = hooks.getSensorObjectLabels();
    const barrierRelations = hooks.getSensorRelationLabels();
    hooks.startLevel("watch-the-wall");
    const wallObjects = hooks.getSensorObjectLabels();
    hooks.startLevel("find-the-human");
    const humanObjects = hooks.getSensorObjectLabels();
    const humanRelations = hooks.getSensorRelationLabels();
    return { barrierObjects, barrierRelations, wallObjects, humanObjects, humanRelations };
  });

  expect(sensorOptions.barrierObjects).toEqual(["barrier"]);
  expect(sensorOptions.barrierRelations).toEqual(["directly in front"]);
  expect(sensorOptions.wallObjects).toEqual(["edge or wall"]);
  expect(sensorOptions.humanObjects).toEqual(["human runner"]);
  expect(sensorOptions.humanRelations).toEqual([
    "anywhere forward",
    "anywhere behind",
    "anywhere above",
    "anywhere below"
  ]);
});

test("later guided levels gate Move Toward targets and human practice waits for input", async ({ page }) => {
  await page.goto("/");
  const levelData = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    Object.assign(hooks.app.state.levelProgress, {
      "move-to-target": "PASSED",
      "reach-enemy-flag": "PASSED",
      "score-a-point": "PASSED",
      "barrier-detour": "PASSED",
      "mirror-forward": "PASSED",
      "sensor-barrier-branch": "PASSED",
      "watch-the-wall": "PASSED",
      "find-the-human": "PASSED",
      "find-the-enemy-flag": "PASSED",
      "human-runner-practice": "AVAILABLE",
      "move-toward-flag": "AVAILABLE",
      "bring-it-home": "AVAILABLE"
    });
    hooks.startLevel("human-runner-practice");
    const humanLevelState = hooks.getLevelState();
    hooks.startLevel("move-toward-flag");
    const moveTowardFlagTargets = hooks.getMoveTowardTargetLabels();
    hooks.startLevel("bring-it-home");
    const bringItHomeTargets = hooks.getMoveTowardTargetLabels();
    return { humanLevelState, moveTowardFlagTargets, bringItHomeTargets };
  });

  expect(levelData.humanLevelState.humanTurnBehavior).toBe("WAIT_FOR_INPUT");
  expect(levelData.moveTowardFlagTargets).toEqual(["enemy flag"]);
  expect(levelData.bringItHomeTargets).toEqual(["enemy flag", "my base"]);
});

test("level 6 tutorial shows the generic sensor demo preview", async ({ page }) => {
  await page.goto("/");
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
    hooks.startCurrentLevelTutorial(true);
  });

  await expect(page.locator("#tutorial-overlay")).toContainText("One Block Shape, Many Sensor Ideas");
  await expect(page.locator(".tutorial-demo-blockly")).toBeVisible();
  await expect(page.locator(".tutorial-demo")).toContainText("Example sensor branch");
  await expect(page.locator(".tutorial-demo .blocklySvg")).toContainText("barrier");
});

test("condition blocks render consistent If and else labels", async ({ page }) => {
  await page.goto("/");
  const labels = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.enterFreePlay();
    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_if_sensor_matches_else">
              <field name="OBJECT">BARRIER</field>
              <field name="RELATION">DIRECTLY_IN_FRONT</field>
              <statement name="DO">
                <block type="battlegorithms_move_down_screen"></block>
              </statement>
              <statement name="ELSE">
                <block type="battlegorithms_move_forward"></block>
              </statement>
            </block>
          </next>
        </block>
      </xml>
    `);
    const block = hooks.getBlocklyWorkspace().getBlocksByType("battlegorithms_if_sensor_matches_else", false)[0];
    return block.inputList.map((input) => input.fieldRow.map((field) => field.getText?.()).filter(Boolean));
  });

  expect(labels[0]).toEqual(["If", "barrier", "is", "directly in front"]);
  expect(labels[1]).toEqual([]);
  expect(labels[2]).toEqual(["else"]);
});

test("level 3 tutorial introduces scoring and level 4 tutorial introduces barrier logic", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.app.state.levelProgress["reach-enemy-flag"] = "PASSED";
    hooks.app.state.levelProgress["score-a-point"] = "AVAILABLE";
    hooks.startLevel("score-a-point");
    hooks.startCurrentLevelTutorial(true);
  });
  await expect(page.locator("#tutorial-overlay")).toContainText("The Flag Is The New Goal");
  await page.locator('#tutorial-overlay button[data-tutorial-action="next"]').click();
  await expect(page.locator("#tutorial-overlay")).toContainText("Scoring Means Bringing It Home");

  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.levelProgress["barrier-detour"] = "AVAILABLE";
    hooks.startLevel("barrier-detour");
    hooks.startCurrentLevelTutorial(true);
  });
  await expect(page.locator("#tutorial-overlay")).toContainText("A Barrier Blocks The Direct Path");
  await page.locator('#tutorial-overlay button[data-tutorial-action="next"]').click();
  await expect(page.locator("#tutorial-overlay")).toContainText("If Barrier Is In Front");
  await page.locator('#tutorial-overlay button[data-tutorial-action="next"]').click();
  await expect(page.locator("#tutorial-overlay")).toContainText("The First Move Reached Is The One That Runs");
});

test("seeded Blockly conditional programs choose the expected action for new guided levels", async ({ page }) => {
  await page.goto("/");
  const conditionalActions = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.app.state.levelProgress["reach-enemy-flag"] = "PASSED";
    hooks.app.state.levelProgress["score-a-point"] = "AVAILABLE";
    hooks.startLevel("score-a-point");
    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_if_have_enemy_flag_else">
              <statement name="DO">
                <block type="battlegorithms_move_backward"></block>
              </statement>
              <statement name="ELSE">
                <block type="battlegorithms_move_forward"></block>
              </statement>
            </block>
          </next>
        </block>
      </xml>
    `);
    const actor = hooks.app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
    const beforeFlag = hooks.getAIAllyAction().type;
    actor.hasEnemyFlag = true;
    const afterFlag = hooks.getAIAllyAction().type;

    hooks.app.state.levelProgress["barrier-detour"] = "AVAILABLE";
    hooks.startLevel("barrier-detour");
    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_if_barrier_in_front_else">
              <statement name="DO">
                <block type="battlegorithms_move_down_screen"></block>
              </statement>
              <statement name="ELSE">
                <block type="battlegorithms_move_forward"></block>
              </statement>
            </block>
          </next>
        </block>
      </xml>
    `);
    const barrierAction = hooks.getAIAllyAction().type;
    return { beforeFlag, afterFlag, barrierAction };
  });

  expect(conditionalActions.beforeFlag).toBe("MOVE_FORWARD");
  expect(conditionalActions.afterFlag).toBe("MOVE_BACKWARD");
  expect(conditionalActions.barrierAction).toBe("MOVE_DOWN_SCREEN");
});

test("seeded generic sensor programs choose the expected action", async ({ page }) => {
  await page.goto("/");
  const actions = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    Object.assign(hooks.app.state.levelProgress, {
      "move-to-target": "PASSED",
      "reach-enemy-flag": "PASSED",
      "score-a-point": "PASSED",
      "barrier-detour": "PASSED",
      "mirror-forward": "PASSED",
      "sensor-barrier-branch": "AVAILABLE",
      "watch-the-wall": "AVAILABLE",
      "find-the-human": "AVAILABLE"
    });

    hooks.startLevel("sensor-barrier-branch");
    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_if_sensor_matches_else">
              <field name="OBJECT">BARRIER</field>
              <field name="RELATION">DIRECTLY_IN_FRONT</field>
              <statement name="DO">
                <block type="battlegorithms_move_down_screen"></block>
              </statement>
              <statement name="ELSE">
                <block type="battlegorithms_move_forward"></block>
              </statement>
            </block>
          </next>
        </block>
      </xml>
    `);
    const barrierAction = hooks.getAIAllyAction().type;

    hooks.startLevel("find-the-human");
    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_if_sensor_matches">
              <field name="OBJECT">HUMAN_RUNNER</field>
              <field name="RELATION">ANYWHERE_ABOVE</field>
              <statement name="DO">
                <block type="battlegorithms_move_up_screen"></block>
              </statement>
              <next>
                <block type="battlegorithms_move_forward"></block>
              </next>
            </block>
          </next>
        </block>
      </xml>
    `);
    const humanAction = hooks.getAIAllyAction().type;
    return { barrierAction, humanAction };
  });

  expect(actions.barrierAction).toBe("MOVE_DOWN_SCREEN");
  expect(actions.humanAction).toBe("MOVE_UP_SCREEN");
});

test("level 8 tutorial can show a read-only demo program without changing the learner workspace", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    Object.assign(hooks.app.state.levelProgress, {
      "move-to-target": "PASSED",
      "reach-enemy-flag": "PASSED",
      "score-a-point": "PASSED",
      "barrier-detour": "PASSED",
      "mirror-forward": "PASSED",
      "sensor-barrier-branch": "PASSED",
      "watch-the-wall": "PASSED",
      "find-the-human": "AVAILABLE"
    });
    hooks.startLevel("find-the-human");
    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24"></block>
      </xml>
    `);
    hooks.startCurrentLevelTutorial(true);
  });

  await expect(page.locator("#tutorial-overlay")).toContainText("Use A Sensor To Find The Human");
  await expect(page.locator(".tutorial-demo-blockly")).toBeVisible();
  await expect(page.locator(".tutorial-demo")).toContainText("Example support-route program");
  await expect(page.locator(".tutorial-demo .blocklySvg")).toContainText("Move Forward");

  const workspaceState = await page.evaluate(() => {
    const workspace = window.__BBA_TEST_HOOKS__.getBlocklyWorkspace();
    return workspace.getTopBlocks(false).map((block) => ({
      type: block.type,
      childCount: block.getChildren(false).length
    }));
  });

  expect(workspaceState).toEqual([
    {
      type: "battlegorithms_on_each_turn",
      childCount: 0
    }
  ]);
});

test("a seeded level 8 reference solution reaches the revised support target", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    Object.assign(hooks.app.state.levelProgress, {
      "move-to-target": "PASSED",
      "reach-enemy-flag": "PASSED",
      "score-a-point": "PASSED",
      "barrier-detour": "PASSED",
      "mirror-forward": "PASSED",
      "sensor-barrier-branch": "PASSED",
      "watch-the-wall": "PASSED",
      "find-the-human": "AVAILABLE"
    });
    hooks.startLevel("find-the-human");
    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_if_sensor_matches_else">
              <field name="OBJECT">HUMAN_RUNNER</field>
              <field name="RELATION">ANYWHERE_ABOVE</field>
              <statement name="DO">
                <block type="battlegorithms_move_up_screen"></block>
              </statement>
              <statement name="ELSE">
                <block type="battlegorithms_if_sensor_matches_else">
                  <field name="OBJECT">HUMAN_RUNNER</field>
                  <field name="RELATION">ANYWHERE_FORWARD</field>
                  <statement name="DO">
                    <block type="battlegorithms_move_forward"></block>
                  </statement>
                  <statement name="ELSE">
                    <block type="battlegorithms_move_down_screen"></block>
                  </statement>
                </block>
              </statement>
            </block>
          </next>
        </block>
      </xml>
    `);

    const actor = hooks.app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
    let evaluation = null;
    for (let step = 0; step < 10; step += 1) {
      const action = hooks.getAIAllyAction();
      if (action?.type === "MOVE_FORWARD") {
        actor.gridX += actor.playDirection;
      } else if (action?.type === "MOVE_UP_SCREEN") {
        actor.gridY -= 1;
      } else if (action?.type === "MOVE_DOWN_SCREEN") {
        actor.gridY += 1;
      }
      evaluation = hooks.evaluateLevelProgress();
      if (evaluation?.result === "PASSED") {
        break;
      }
    }

    const human = hooks.app.state.allRunners.find((runner) => runner.id === "runner_1_HumanP1");
    return {
      evaluation,
      actor: { x: actor.gridX, y: actor.gridY },
      human: { x: human.gridX, y: human.gridY }
    };
  });

  expect(result.evaluation).toEqual({ result: "PASSED", reason: "win_condition_met" });
  expect(result.actor).toEqual({ x: 5, y: 2 });
  expect(result.human).toEqual({ x: 6, y: 2 });
});

test("guided score completion produces a passed result instead of the generic game-over state", async ({ page }) => {
  await page.goto("/");
  const scoreResult = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.app.state.levelProgress["reach-enemy-flag"] = "PASSED";
    hooks.app.state.levelProgress["score-a-point"] = "AVAILABLE";
    hooks.startLevel("score-a-point");
    hooks.app.state.teamScores[1] = 1;
    return hooks.evaluateLevelProgress();
  });

  expect(scoreResult).toEqual({ result: "PASSED", reason: "win_condition_met" });
  await expect(page.locator("#level-panel")).toContainText("Scoring a point completed the challenge");
  await expect(page.locator("#playResetButton")).toHaveText("Reset Level");
});

test("guided completion triggers a localized goal burst at the tutorial target", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.startLevel("move-to-target");
    const actor = hooks.app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
    actor.gridX = 4;
    actor.gridY = 4;
    hooks.evaluateLevelProgress();
    const effect = hooks.getLevelState().goalBurstEffect;
    const overlay = document.querySelector("#goal-burst-overlay .goal-burst");
    const overlayStyle = overlay ? window.getComputedStyle(overlay) : null;
    return {
      effect,
      overlayExists: Boolean(overlay),
      overlayPosition: overlayStyle?.position || null
    };
  });

  expect(result.effect).toMatchObject({ cellX: 4, cellY: 4, teamId: 1 });
  expect(result.overlayExists).toBe(true);
  expect(result.overlayPosition).toBe("fixed");
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
  await expect(page.locator("#playResetButton")).toHaveText("Reset Level");
});

test("level 10 accepts J as a human jump key", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    Object.assign(hooks.app.state.levelProgress, {
      "move-to-target": "PASSED",
      "reach-enemy-flag": "PASSED",
      "score-a-point": "PASSED",
      "barrier-detour": "PASSED",
      "mirror-forward": "PASSED",
      "sensor-barrier-branch": "PASSED",
      "watch-the-wall": "PASSED",
      "find-the-human": "PASSED",
      "find-the-enemy-flag": "PASSED",
      "human-runner-practice": "AVAILABLE"
    });
    hooks.startLevel("human-runner-practice");
    const human = hooks.app.state.allRunners.find((runner) => runner.id === "runner_1_HumanP1");
    hooks.app.state.activeRunnerIndex = hooks.app.state.allRunners.indexOf(human);
  });

  const jumpState = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    const handled = hooks.sendKey("j");
    return {
      handled,
      turnState: hooks.app.state.currentTurnState,
      queuedActionType: hooks.app.state.queuedActionForCurrentRunner?.actionType || null
    };
  });

  expect(jumpState.handled).toBeTruthy();
  expect(["PROCESSING_ACTION", "ANIMATING"]).toContain(jumpState.turnState);
  expect(jumpState.queuedActionType === "JUMP_FORWARD" || jumpState.turnState === "ANIMATING").toBeTruthy();
});

test("guided reset keeps the workspace code and returns the level to Start Level", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.showModePicker = false;
    hooks.startLevel("move-to-target");
    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_move_forward"></block>
          </next>
        </block>
      </xml>
    `);
  });

  await expect(page.locator("#playResetButton")).toHaveText("Reset Level");
  await page.locator("#playResetButton").click();
  await expect(page.locator("#playResetButton")).toHaveText("Start Level");

  const result = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    const actor = hooks.app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
    const workspace = hooks.getBlocklyWorkspace();
    return {
      mainGameState: hooks.app.state.mainGameState,
      activeLevelResult: hooks.app.state.activeLevelResult,
      actor: { x: actor.gridX, y: actor.gridY, initialX: actor.initialGridX, initialY: actor.initialGridY },
      topBlocks: workspace.getTopBlocks(false).map((block) => ({
        type: block.type,
        childCount: block.getChildren(false).length
      }))
    };
  });

  expect(result.mainGameState).toBe("SETUP");
  expect(result.activeLevelResult).toBe("NONE");
  expect(result.actor).toEqual({ x: 1, y: 4, initialX: 1, initialY: 4 });
  expect(result.topBlocks).toEqual([
    {
      type: "battlegorithms_on_each_turn",
      childCount: 1
    }
  ]);
});

test("switching to free play restores the full toolbox", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Free Play" }).click();

  const state = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getLevelState());
  const toolbox = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getAvailableToolboxBlockTypes());
  const moveTowardTargets = await page.evaluate(() => window.__BBA_TEST_HOOKS__.getMoveTowardTargetLabels());

  expect(state.currentModeView).toBe("FREE_PLAY");
  expect(state.showModePicker).toBe(false);
  expect([state.teams["1"].playDirection, state.teams["2"].playDirection].sort()).toEqual([-1, 1]);
  expect(toolbox).toContain("battlegorithms_jump_forward");
  expect(toolbox).toContain("battlegorithms_place_barrier");
  expect(toolbox).toContain("battlegorithms_move_toward");
  expect(toolbox).toContain("battlegorithms_move_randomly");
  expect(toolbox).toContain("battlegorithms_freeze_opponents");
  expect(toolbox).toContain("battlegorithms_if_can_jump_else");
  expect(toolbox).toContain("battlegorithms_if_can_place_barrier_else");
  expect(toolbox).toContain("battlegorithms_if_area_freeze_ready_else");
  expect(toolbox).toContain("battlegorithms_if_teammate_has_flag_else");
  expect(toolbox).toContain("battlegorithms_if_on_my_side_else");
  expect(toolbox).toContain("battlegorithms_if_on_enemy_side_else");
  expect(moveTowardTargets).toEqual(["enemy flag", "my base", "human runner", "closest enemy"]);
});

test("free play re-randomizes team directions each time it is entered while keeping one of each direction", async ({ page }) => {
  await page.goto("/");
  const teamDirections = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.randomFn = () => 0.25;
    const first = hooks.enterFreePlay().teams;
    hooks.app.state.randomFn = () => 0.75;
    const second = hooks.enterFreePlay().teams;
    return {
      first: [first["1"].playDirection, first["2"].playDirection],
      second: [second["1"].playDirection, second["2"].playDirection]
    };
  });

  expect([...teamDirections.first].sort()).toEqual([-1, 1]);
  expect([...teamDirections.second].sort()).toEqual([-1, 1]);
  expect(teamDirections.first).not.toEqual(teamDirections.second);
});

test("seeded free-play Move Toward programs choose the expected helper direction", async ({ page }) => {
  await page.goto("/");
  const actions = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.randomFn = () => 0.25;
    hooks.enterFreePlay();
    const actor = hooks.app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");

    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_move_toward">
              <field name="TARGET">ENEMY_FLAG</field>
            </block>
          </next>
        </block>
      </xml>
    `);
    const towardFlag = hooks.getAIAllyAction();

    actor.gridX = 8;
    actor.gridY = 4;
    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_move_toward">
              <field name="TARGET">MY_BASE</field>
            </block>
          </next>
        </block>
      </xml>
    `);
    const towardBase = hooks.getAIAllyAction();

    return { towardFlag, towardBase };
  });

  expect(actions.towardFlag.type).toBe("MOVE_TOWARD");
  expect(actions.towardFlag.targetType).toBe("ENEMY_FLAG");
  expect(actions.towardBase.type).toBe("MOVE_TOWARD");
  expect(actions.towardBase.targetType).toBe("MY_BASE");
});

test("seeded free-play programs choose the expected new action and condition branches", async ({ page }) => {
  await page.goto("/");
  const actions = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.app.state.randomFn = () => 0.25;
    hooks.enterFreePlay();
    const actor = hooks.app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
    const human = hooks.app.state.allRunners.find((runner) => runner.team === 1 && runner.isHumanControlled);

    hooks.app.state.randomFn = () => 0.74;
    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_move_randomly"></block>
          </next>
        </block>
      </xml>
    `);
    const randomAction = hooks.getAIAllyAction().type;

    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_if_can_jump_else">
              <statement name="DO">
                <block type="battlegorithms_jump_forward"></block>
              </statement>
              <statement name="ELSE">
                <block type="battlegorithms_move_forward"></block>
              </statement>
            </block>
          </next>
        </block>
      </xml>
    `);
    const jumpReady = hooks.getAIAllyAction().type;
    actor.canJump = false;
    const jumpSpent = hooks.getAIAllyAction().type;
    actor.canJump = true;

    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_if_can_place_barrier_else">
              <statement name="DO">
                <block type="battlegorithms_place_barrier"></block>
              </statement>
              <statement name="ELSE">
                <block type="battlegorithms_move_forward"></block>
              </statement>
            </block>
          </next>
        </block>
      </xml>
    `);
    const barrierReady = hooks.getAIAllyAction().type;
    actor.canPlaceBarrier = false;
    const barrierSpent = hooks.getAIAllyAction().type;
    actor.canPlaceBarrier = true;

    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_if_area_freeze_ready_else">
              <statement name="DO">
                <block type="battlegorithms_freeze_opponents"></block>
              </statement>
              <statement name="ELSE">
                <block type="battlegorithms_move_forward"></block>
              </statement>
            </block>
          </next>
        </block>
      </xml>
    `);
    const freezeReady = hooks.getAIAllyAction().type;
    hooks.app.state.teamAreaFreezeUsed[1] = true;
    const freezeSpent = hooks.getAIAllyAction().type;
    hooks.app.state.teamAreaFreezeUsed[1] = false;

    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_if_teammate_has_flag_else">
              <statement name="DO">
                <block type="battlegorithms_move_backward"></block>
              </statement>
              <statement name="ELSE">
                <block type="battlegorithms_move_down_screen"></block>
              </statement>
            </block>
          </next>
        </block>
      </xml>
    `);
    const teammateNoFlag = hooks.getAIAllyAction().type;
    human.hasEnemyFlag = true;
    const teammateHasFlag = hooks.getAIAllyAction().type;
    human.hasEnemyFlag = false;

    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_if_on_my_side_else">
              <statement name="DO">
                <block type="battlegorithms_move_forward"></block>
              </statement>
              <statement name="ELSE">
                <block type="battlegorithms_move_backward"></block>
              </statement>
            </block>
          </next>
        </block>
      </xml>
    `);
    actor.gridX = 1;
    const onMySide = hooks.getAIAllyAction().type;
    actor.gridX = 8;
    const onEnemySide = hooks.getAIAllyAction().type;

    return {
      randomAction,
      jumpReady,
      jumpSpent,
      barrierReady,
      barrierSpent,
      freezeReady,
      freezeSpent,
      teammateNoFlag,
      teammateHasFlag,
      onMySide,
      onEnemySide
    };
  });

  expect(actions.randomAction).toBe("MOVE_RANDOMLY");
  expect(actions.jumpReady).toBe("JUMP_FORWARD");
  expect(actions.jumpSpent).toBe("MOVE_FORWARD");
  expect(actions.barrierReady).toBe("PLACE_BARRIER_FORWARD");
  expect(actions.barrierSpent).toBe("MOVE_FORWARD");
  expect(actions.freezeReady).toBe("FREEZE_OPPONENTS");
  expect(actions.freezeSpent).toBe("MOVE_FORWARD");
  expect(actions.teammateNoFlag).toBe("MOVE_DOWN_SCREEN");
  expect(actions.teammateHasFlag).toBe("MOVE_BACKWARD");
  expect(actions.onMySide).toBe("MOVE_FORWARD");
  expect(actions.onEnemySide).toBe("MOVE_BACKWARD");
});

test("free-play Freeze Opponents affects nearby enemies and consumes the team use", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.enterFreePlay();
    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_freeze_opponents"></block>
          </next>
        </block>
      </xml>
    `);
    const actor = hooks.app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
    const enemies = hooks.app.state.allRunners.filter((runner) => runner.team === 2);
    actor.gridX = 5;
    actor.gridY = 4;
    enemies[0].gridX = 6;
    enemies[0].gridY = 4;
    enemies[1].gridX = 10;
    enemies[1].gridY = 6;
    hooks.app.state.mainGameState = "RUNNING";
    hooks.app.state.currentTurnState = "PROCESSING_ACTION";
    hooks.app.state.activeRunnerIndex = hooks.app.state.allRunners.indexOf(actor);
    hooks.app.state.queuedActionForCurrentRunner = {
      runner: actor,
      actionType: "FREEZE_OPPONENTS",
      targetGridX: actor.gridX,
      targetGridY: actor.gridY
    };
    hooks.processTurn();
    return {
      used: hooks.app.state.teamAreaFreezeUsed[1],
      nearbyFrozen: enemies[0].isFrozen,
      farFrozen: enemies[1].isFrozen
    };
  });

  expect(result.used).toBeTruthy();
  expect(result.nearbyFrozen).toBeTruthy();
  expect(result.farFrozen).toBeFalsy();
});

test("guided Level 20 uses freeze and avoids overlapping runners", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.startLevel("freeze-the-lane");
    hooks.loadWorkspaceXml(`
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="battlegorithms_on_each_turn" x="24" y="24">
          <next>
            <block type="battlegorithms_if_area_freeze_ready_else">
              <statement name="DO">
                <block type="battlegorithms_freeze_opponents"></block>
              </statement>
              <statement name="ELSE">
                <block type="battlegorithms_move_toward">
                  <field name="TARGET">ENEMY_FLAG</field>
                </block>
              </statement>
            </block>
          </next>
        </block>
      </xml>
    `);

    const snapshots = [];
    for (let tick = 0; tick < 120; tick += 1) {
      hooks.processTurn();
      const runnerCells = hooks.app.state.allRunners.map((runner) => `${runner.gridX},${runner.gridY}`);
      snapshots.push({
        tick,
        freezeUsed: hooks.app.state.teamAreaFreezeUsed[1],
        uniqueRunnerCells: new Set(runnerCells).size === runnerCells.length,
        result: hooks.app.state.activeLevelResult
      });
      if (hooks.app.state.activeLevelResult === "PASSED" || hooks.app.state.activeLevelResult === "FAILED") {
        break;
      }
    }

    return {
      result: hooks.app.state.activeLevelResult,
      freezeUsed: hooks.app.state.teamAreaFreezeUsed[1],
      everyTickUnique: snapshots.every((snapshot) => snapshot.uniqueRunnerCells)
    };
  });

  expect(result.result).toBe("PASSED");
  expect(result.freezeUsed).toBeTruthy();
  expect(result.everyTickUnique).toBeTruthy();
});

test("same-team runners cannot step onto their own home flag in live play", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(() => {
    const hooks = window.__BBA_TEST_HOOKS__;
    hooks.enterFreePlay();

    const playerRunner = hooks.app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
    const playerFlag = hooks.app.state.gameFlags[1];
    playerRunner.gridX = 1;
    playerRunner.gridY = playerFlag.gridY;
    playerRunner.pixelX = playerRunner.gridX * 50;
    playerRunner.pixelY = playerRunner.gridY * 50;

    hooks.app.state.mainGameState = "RUNNING";
    hooks.app.state.currentTurnState = "PROCESSING_ACTION";
    hooks.app.state.activeRunnerIndex = hooks.app.state.allRunners.indexOf(playerRunner);
    hooks.app.state.queuedActionForCurrentRunner = {
      runner: playerRunner,
      actionType: "MOVE_BACKWARD",
      targetGridX: 0,
      targetGridY: playerFlag.gridY
    };

    hooks.processTurn();

    return {
      playerCell: { x: playerRunner.gridX, y: playerRunner.gridY },
      flagCell: { x: playerFlag.gridX, y: playerFlag.gridY }
    };
  });

  expect(result.playerCell).not.toEqual(result.flagCell);
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
