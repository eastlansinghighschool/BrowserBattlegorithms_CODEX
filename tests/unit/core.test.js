import test from "node:test";
import assert from "node:assert/strict";
import {
  BLOCK_TYPES,
  GAME_MODES,
  GAME_VIEW_MODES,
  LEVEL_RESULT,
  LEVEL_STATUS
} from "../../src/config/constants.js";
import { getLevelDefinitions } from "../../src/config/levels.js";
import { buildMatch } from "../../src/testSupport/builders.js";
import { isCellBlockedByImpassables, translateActionDecision } from "../../src/core/movement.js";
import { resolveCollision } from "../../src/core/collisions.js";
import { checkForFlagPickup, checkForScoring } from "../../src/core/scoring.js";
import { resetRound } from "../../src/core/setup.js";
import { checkInvariants } from "../../src/core/invariants.js";
import { calculateNpcType1Action } from "../../src/ai/npc/npcType1.js";
import { calculateNpcType2Action } from "../../src/ai/npc/npcType2.js";
import { createApp } from "../../src/core/state.js";
import {
  enterFreePlay,
  evaluateLevelProgress,
  getLevelStateSnapshot,
  initializeLevelState,
  startLevel
} from "../../src/core/levels.js";
import { getToolboxBlockTypesForMode } from "../../src/ai/blockly/blocks.js";

test("PvP setup creates four runners with two humans", () => {
  const app = buildMatch({ currentGameMode: GAME_MODES.PLAYER_VS_PLAYER });
  assert.equal(app.state.allRunners.length, 4);
  assert.equal(app.state.allRunners.filter((runner) => runner.isHumanControlled).length, 2);
});

test("PvNPC setup creates two NPCs", () => {
  const app = buildMatch({ currentGameMode: GAME_MODES.PLAYER_VS_NPC });
  assert.equal(app.state.allRunners.length, 4);
  assert.equal(app.state.allRunners.filter((runner) => runner.isNPC).length, 2);
});

test("movement helper blocks wall cells", () => {
  const app = buildMatch();
  const blocked = isCellBlockedByImpassables(-1, 0, app.state.barriers, app.state.gameMap);
  assert.equal(blocked, true);
});

test("translateActionDecision converts move-forward into a target cell", () => {
  const app = buildMatch();
  const runner = app.state.allRunners[1];
  const queued = translateActionDecision(runner, { type: "MOVE_FORWARD" });
  assert.equal(queued.targetGridX, runner.gridX + runner.playDirection);
  assert.equal(queued.targetGridY, runner.gridY);
});

test("collision resolves in favor of defender side", () => {
  const app = buildMatch();
  const attacker = app.state.allRunners[0];
  const defender = app.state.allRunners[2];
  attacker.gridX = 8;
  attacker.gridY = 3;
  defender.gridX = 9;
  defender.gridY = 3;
  const outcome = resolveCollision(app.state, attacker, defender, 9, 3);
  assert.equal(outcome.winner.id, defender.id);
  assert.equal(outcome.loser.id, attacker.id);
});

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
});

test("resetRound restores runners and clears barriers", () => {
  const app = buildMatch();
  const runner = app.state.allRunners[0];
  runner.gridX = 5;
  runner.isFrozen = true;
  app.state.barriers.push({ id: "b1", ownerRunnerId: runner.id, gridX: 4, gridY: 4 });
  resetRound(app.state);
  assert.equal(runner.gridX, runner.initialGridX);
  assert.equal(runner.isFrozen, false);
  assert.equal(app.state.barriers.length, 0);
});

test("invariants pass for default match state", () => {
  const app = buildMatch();
  assert.equal(checkInvariants(app.state), true);
});

test("npc type 1 returns a legal action shape", () => {
  const app = buildMatch({ currentGameMode: GAME_MODES.PLAYER_VS_NPC });
  const npc = app.state.allRunners.find((runner) => runner.isNPC);
  const action = calculateNpcType1Action(npc, app.state);
  assert.ok(action.actionType);
});

test("npc type 2 returns a legal action shape", () => {
  const app = buildMatch({ currentGameMode: GAME_MODES.PLAYER_VS_NPC });
  const npc = app.state.allRunners.find((runner) => runner.isNPC);
  const action = calculateNpcType2Action(npc, app.state);
  assert.ok(action.actionType);
});

test("level definitions load with the expected starter levels", () => {
  const levels = getLevelDefinitions();
  assert.equal(levels.length, 2);
  assert.deepEqual(
    levels.map((level) => level.id),
    ["move-to-target", "reach-enemy-flag"]
  );
});

test("guided mode initializes with level 1 available and level 2 locked", () => {
  const app = createApp();
  initializeLevelState(app);
  const snapshot = getLevelStateSnapshot(app);
  assert.equal(snapshot.currentModeView, GAME_VIEW_MODES.GUIDED_LEVELS);
  assert.equal(snapshot.currentLevelId, "move-to-target");
  assert.equal(snapshot.levelProgress["move-to-target"], LEVEL_STATUS.AVAILABLE);
  assert.equal(snapshot.levelProgress["reach-enemy-flag"], LEVEL_STATUS.LOCKED);
});

test("guided toolbox restriction reflects each level's allowed blocks", () => {
  const app = createApp();
  initializeLevelState(app);

  const firstLevelToolbox = getToolboxBlockTypesForMode(app, app.state.levels[0]);
  assert.deepEqual(firstLevelToolbox, [
    BLOCK_TYPES.MOVE_FORWARD,
    BLOCK_TYPES.MOVE_UP_SCREEN,
    BLOCK_TYPES.MOVE_DOWN_SCREEN,
    BLOCK_TYPES.STAY_STILL
  ]);

  app.state.currentLevelId = "reach-enemy-flag";
  const secondLevel = app.state.levels.find((level) => level.id === "reach-enemy-flag");
  const secondLevelToolbox = getToolboxBlockTypesForMode(app, secondLevel);
  assert.ok(secondLevelToolbox.includes(BLOCK_TYPES.MOVE_BACKWARD));
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

test("guided levels fail when the turn limit is exceeded", () => {
  const app = createApp();
  initializeLevelState(app);
  startLevel(app, "move-to-target");
  app.state.currentTurnNumber = 9;

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.FAILED, reason: "turn_limit_exceeded" });
  assert.equal(app.state.activeLevelResult, LEVEL_RESULT.FAILED);
});

test("free play keeps full toolbox access and leaves level progress intact", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["move-to-target"] = LEVEL_STATUS.PASSED;
  enterFreePlay(app);

  const toolbox = getToolboxBlockTypesForMode(app, null);
  assert.equal(app.state.currentModeView, GAME_VIEW_MODES.FREE_PLAY);
  assert.ok(toolbox.includes(BLOCK_TYPES.JUMP_FORWARD));
  assert.equal(app.state.levelProgress["move-to-target"], LEVEL_STATUS.PASSED);
});
