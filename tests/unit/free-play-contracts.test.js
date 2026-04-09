import test from "node:test";
import assert from "node:assert/strict";
import {
  AI_ACTION_TYPES,
  AREA_FREEZE_DURATION_TURNS,
  BLOCK_TYPES,
  GAME_VIEW_MODES,
  LEVEL_STATUS,
  MAIN_GAME_STATES
} from "../../src/config/constants.js";
import { createApp } from "../../src/core/state.js";
import { enterFreePlay, initializeLevelState } from "../../src/core/levels.js";
import { getToolboxBlockTypesForMode } from "../../src/ai/blockly/blocks.js";
import { buildMatch } from "../../src/testSupport/builders.js";
import { resetRound } from "../../src/core/setup.js";
import { translateActionDecision } from "../../src/core/movement.js";
import { processTurnActions } from "../../src/core/turnEngine.js";
import { TEST_P5 } from "./helpers/testHarness.js";

test("free play keeps full toolbox access and leaves level progress intact", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["move-to-target"] = LEVEL_STATUS.PASSED;
  app.state.randomFn = () => 0.75;
  enterFreePlay(app);

  const toolbox = getToolboxBlockTypesForMode(app, null);
  assert.equal(app.state.currentModeView, GAME_VIEW_MODES.FREE_PLAY);
  assert.ok(toolbox.includes(BLOCK_TYPES.JUMP_FORWARD));
  assert.ok(toolbox.includes(BLOCK_TYPES.MOVE_TOWARD));
  assert.ok(toolbox.includes(BLOCK_TYPES.MOVE_RANDOMLY));
  assert.ok(toolbox.includes(BLOCK_TYPES.FREEZE_OPPONENTS));
  assert.ok(toolbox.includes(BLOCK_TYPES.IF_CAN_JUMP_ELSE));
  assert.ok(toolbox.includes(BLOCK_TYPES.IF_AREA_FREEZE_READY_ELSE));
  assert.equal(app.state.levelProgress["move-to-target"], LEVEL_STATUS.PASSED);
  assert.equal(app.state.teams[1].playDirection, -1);
  assert.equal(app.state.teams[2].playDirection, 1);
});

test("Move Randomly returns a deterministic legal action when randomFn is stubbed", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  app.state.randomFn = () => 0.74;
  const queued = translateActionDecision(actor, { type: AI_ACTION_TYPES.MOVE_RANDOMLY }, app.state);
  assert.equal(queued.actionType, AI_ACTION_TYPES.MOVE_UP_SCREEN);
});

test("area freeze freezes nearby enemies once per round and resets on round reset", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  const enemies = app.state.allRunners.filter((runner) => runner.team === 2);
  actor.gridX = 5;
  actor.gridY = 4;
  enemies[0].gridX = 6;
  enemies[0].gridY = 4;
  enemies[1].gridX = 10;
  enemies[1].gridY = 6;

  app.state.mainGameState = MAIN_GAME_STATES.RUNNING;
  app.state.currentTurnState = "PROCESSING_ACTION";
  app.state.activeRunnerIndex = app.state.allRunners.indexOf(actor);
  app.state.queuedActionForCurrentRunner = {
    runner: actor,
    actionType: AI_ACTION_TYPES.FREEZE_OPPONENTS,
    targetGridX: actor.gridX,
    targetGridY: actor.gridY
  };
  processTurnActions(app, TEST_P5);

  assert.equal(app.state.teamAreaFreezeUsed[1], true);
  assert.equal(enemies[0].isFrozen, true);
  assert.equal(enemies[0].frozenTurnsRemaining, AREA_FREEZE_DURATION_TURNS);
  assert.equal(enemies[1].isFrozen, false);

  resetRound(app.state);
  assert.equal(app.state.teamAreaFreezeUsed[1], false);
});
