import test from "node:test";
import assert from "node:assert/strict";
import * as Blockly from "blockly";
import {
  AI_ACTION_TYPES,
  HUMAN_TURN_BEHAVIORS,
  LEVEL_RESULT,
  LEVEL_STATUS,
  MAIN_GAME_STATES
} from "../../src/config/constants.js";
import { checkForFlagPickup, checkForScoring } from "../../src/core/scoring.js";
import {
  completeLevel,
  evaluateLevelProgress,
  getLevelGoalCell,
  initializeLevelState,
  resetCurrentLevel,
  setGuidedHumanTurnBehavior,
  startLevel
} from "../../src/core/levels.js";
import { createApp } from "../../src/core/state.js";
import { registerBattleBlocklyBlocks } from "../../src/ai/blockly/blocks.js";
import { loadWorkspaceXml } from "../../src/ai/blockly/workspace.js";
import { buildMatch } from "../../src/testSupport/builders.js";
import { buildSolutionXml } from "./fixtures/guidedReferenceSolutions.js";

test("flag pickup and scoring update team score", () => {
  const app = buildMatch();
  const runner = app.state.allRunners[0];
  const enemyFlag = app.state.gameFlags[2];
  runner.gridX = enemyFlag.gridX;
  runner.gridY = enemyFlag.gridY;
  checkForFlagPickup(app.state, runner);
  assert.equal(runner.hasEnemyFlag, true);
  runner.gridX = 0;
  runner.gridY = 3;
  const scored = checkForScoring(app.state, runner);
  assert.equal(scored, true);
  assert.equal(app.state.teamScores[1], 1);
  assert.equal(runner.hasEnemyFlag, false);
  assert.equal(enemyFlag.carriedByRunnerId, null);
  assert.equal(enemyFlag.gridX, enemyFlag.initialGridX);
  assert.equal(enemyFlag.gridY, enemyFlag.initialGridY);
  assert.equal(enemyFlag.isAtBase, true);
});

test("level 1 passes when the ally reaches the target cell and unlocks level 2", () => {
  const app = createApp();
  initializeLevelState(app);
  startLevel(app, "move-to-target");

  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 4;
  actor.gridY = 4;

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" });
  assert.equal(app.state.levelProgress["move-to-target"], LEVEL_STATUS.PASSED);
  assert.equal(app.state.levelProgress["reach-enemy-flag"], LEVEL_STATUS.AVAILABLE);
  assert.deepEqual(app.state.goalBurstEffect && {
    cellX: app.state.goalBurstEffect.cellX,
    cellY: app.state.goalBurstEffect.cellY
  }, { cellX: 4, cellY: 4 });
});

test("level 2 passes when the ally reaches the enemy flag", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["reach-enemy-flag"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "reach-enemy-flag");

  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  const enemyFlag = app.state.gameFlags[2];
  actor.gridX = enemyFlag.gridX;
  actor.gridY = enemyFlag.gridY;

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" });
});

test("level 3 passes when team 1 scores a point and unlocks level 4", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["reach-enemy-flag"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["score-a-point"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "score-a-point");

  app.state.teamScores[1] = 1;

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" });
  assert.equal(app.state.levelProgress["barrier-detour"], LEVEL_STATUS.AVAILABLE);
});

test("level 3 goal marker stays on the home flag after the point is scored", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["reach-enemy-flag"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["score-a-point"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "score-a-point");

  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 2;
  actor.gridY = 4;
  actor.hasEnemyFlag = true;
  assert.deepEqual(getLevelGoalCell(app), { x: 1, y: 4 });

  actor.hasEnemyFlag = false;
  actor.gridX = 1;
  app.state.teamScores[1] = 1;
  assert.deepEqual(getLevelGoalCell(app), { x: 1, y: 4 });
});

test("level 3 turn limit allows the intended out-and-back route", () => {
  const app = createApp();
  initializeLevelState(app);
  const level3 = app.state.levels.find((level) => level.id === "score-a-point");
  assert.equal(level3.failureCondition.maxTurns, 20);
});

test("guided auto-skip freezes the parked human runner for a clearer idle visual", () => {
  const app = createApp();
  initializeLevelState(app);
  startLevel(app, "score-a-point");

  const human = app.state.allRunners.find((runner) => runner.id === "runner_1_HumanP1");
  assert.equal(human.isFrozen, true);
  assert.equal(human.isAutoSkipFrozen, true);
  assert.equal(human.frozenTurnsRemaining, Number.POSITIVE_INFINITY);

  setGuidedHumanTurnBehavior(app, HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT);
  assert.equal(human.isFrozen, false);
  assert.equal(human.isAutoSkipFrozen, false);
  assert.equal(human.frozenTurnsRemaining, 0);
});

test("completing a guided score level anchors the goal burst to the scoring square", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["score-a-point"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "score-a-point");

  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 1;
  actor.gridY = 4;
  app.state.teamScores[1] = 1;

  completeLevel(app, LEVEL_RESULT.PASSED, "win_condition_met");
  assert.deepEqual(app.state.goalBurstEffect && {
    cellX: app.state.goalBurstEffect.cellX,
    cellY: app.state.goalBurstEffect.cellY
  }, { cellX: 1, cellY: 4 });
});

test("human practice level requires reaching the goal after Jump or Place Barrier", () => {
  const app = createApp();
  initializeLevelState(app);
  Object.keys(app.state.levelProgress).forEach((levelId, index) => {
    app.state.levelProgress[levelId] = index === 9 ? LEVEL_STATUS.AVAILABLE : LEVEL_STATUS.PASSED;
  });
  startLevel(app, "human-runner-practice");

  const human = app.state.allRunners.find((runner) => runner.id === "runner_1_HumanP1");
  human.gridX = 4;
  human.gridY = 4;
  app.state.runnerActionHistory[human.id] = [AI_ACTION_TYPES.STAY_STILL];

  const result = evaluateLevelProgress(app);
  assert.equal(result, null);

  app.state.runnerActionHistory[human.id] = [AI_ACTION_TYPES.JUMP_FORWARD];
  const jumpResult = evaluateLevelProgress(app);
  assert.deepEqual(jumpResult, { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" });
});

test("build the barrier level passes when the target barrier cell is occupied", () => {
  const app = createApp();
  initializeLevelState(app);
  Object.keys(app.state.levelProgress).forEach((levelId, index) => {
    app.state.levelProgress[levelId] = index < 15 ? LEVEL_STATUS.PASSED : LEVEL_STATUS.LOCKED;
  });
  app.state.levelProgress["build-the-barrier"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "build-the-barrier");

  app.state.barriers.push({ id: "test_barrier", ownerRunnerId: "runner_1_AI_AllyP1", gridX: 4, gridY: 4 });

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" });
});

test("level 4 passes when the ally reaches the detour target cell", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["score-a-point"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["barrier-detour"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "barrier-detour");

  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 6;
  actor.gridY = 4;

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" });
  assert.equal(app.state.levelProgress["mirror-forward"], LEVEL_STATUS.AVAILABLE);
});

test("level 5 teaches playDirection from the opposite side of the map", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["move-to-target"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["reach-enemy-flag"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["score-a-point"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["barrier-detour"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["mirror-forward"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "mirror-forward");

  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  assert.equal(actor.playDirection, -1);
  actor.gridX = 7;
  actor.gridY = 4;

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" });
  assert.equal(app.state.levelProgress["sensor-barrier-branch"], LEVEL_STATUS.AVAILABLE);
});

test("guided levels fail when the turn limit is exceeded", () => {
  const app = createApp();
  initializeLevelState(app);
  startLevel(app, "move-to-target");
  app.state.currentTurnNumber = 9;

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.FAILED, reason: "turn_limit_exceeded" });
  assert.equal(app.state.activeLevelResult, LEVEL_RESULT.FAILED);
});

test("resetting a guided level preserves workspace code and restores the ready state", () => {
  registerBattleBlocklyBlocks();
  const app = createApp();
  app.blocklyWorkspace = new Blockly.Workspace();
  initializeLevelState(app);
  loadWorkspaceXml(app, buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`));
  startLevel(app, "move-to-target");

  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 3;
  actor.gridY = 4;

  resetCurrentLevel(app);

  const restoredActor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  const xmlText = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(app.blocklyWorkspace));

  assert.equal(app.state.mainGameState, MAIN_GAME_STATES.SETUP);
  assert.equal(app.state.activeLevelResult, LEVEL_RESULT.NONE);
  assert.equal(restoredActor.gridX, restoredActor.initialGridX);
  assert.equal(restoredActor.gridY, restoredActor.initialGridY);
  assert.match(xmlText, /battlegorithms_move_forward/);
});
