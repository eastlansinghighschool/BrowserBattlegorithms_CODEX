import test from "node:test";
import assert from "node:assert/strict";
import { AI_ACTION_TYPES, MOVE_TOWARD_TARGETS, MAIN_GAME_STATES } from "../../src/config/constants.js";
import { buildMatch } from "../../src/testSupport/builders.js";
import { checkInvariants } from "../../src/core/invariants.js";
import {
  isCellBlockedByImpassables,
  isCellBlockedForRunner,
  translateActionDecision,
  translateMoveTowardDecision
} from "../../src/core/movement.js";
import { resolveCollision } from "../../src/core/collisions.js";
import { processTurnActions } from "../../src/core/turnEngine.js";
import { TEST_P5, getTeamHuman } from "./helpers/testHarness.js";

test("movement helper blocks wall cells", () => {
  const app = buildMatch();
  const blocked = isCellBlockedByImpassables(-1, 0, app.state.barriers, app.state.gameMap);
  assert.equal(blocked, true);
});

test("own team cannot enter its home flag cell while the flag is at base", () => {
  const app = buildMatch();
  const playerRunner = app.state.allRunners.find((runner) => runner.team === 1);
  const enemyRunner = app.state.allRunners.find((runner) => runner.team === 2);
  const playerFlag = app.state.gameFlags[1];

  assert.equal(
    isCellBlockedForRunner(playerFlag.gridX, playerFlag.gridY, app.state.barriers, app.state.gameMap, app.state, playerRunner),
    true
  );
  assert.equal(
    isCellBlockedForRunner(playerFlag.gridX, playerFlag.gridY, app.state.barriers, app.state.gameMap, app.state, enemyRunner),
    false
  );

  playerFlag.isAtBase = false;
  playerFlag.carriedByRunnerId = "runner_2_Npc1";

  assert.equal(
    isCellBlockedForRunner(playerFlag.gridX, playerFlag.gridY, app.state.barriers, app.state.gameMap, app.state, playerRunner),
    false
  );
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
  const outcome = resolveCollision(app.state, attacker, defender, 9, 3, { x: 8, y: 3 });
  assert.equal(outcome.winner.id, defender.id);
  assert.equal(outcome.loser.id, attacker.id);
  assert.deepEqual(outcome.loserCell, { x: 8, y: 3 });
});

test("collision processing leaves one runner on the collision cell and freezes the loser on the origin cell", () => {
  const app = buildMatch();
  const attacker = app.state.allRunners[0];
  const defender = app.state.allRunners[2];

  attacker.gridX = 8;
  attacker.gridY = 3;
  attacker.pixelX = attacker.gridX * 50;
  attacker.pixelY = attacker.gridY * 50;
  defender.gridX = 9;
  defender.gridY = 3;
  defender.pixelX = defender.gridX * 50;
  defender.pixelY = defender.gridY * 50;

  app.state.mainGameState = MAIN_GAME_STATES.RUNNING;
  app.state.currentTurnState = "PROCESSING_ACTION";
  app.state.activeRunnerIndex = app.state.allRunners.indexOf(attacker);
  app.state.queuedActionForCurrentRunner = {
    runner: attacker,
    actionType: AI_ACTION_TYPES.MOVE_FORWARD,
    targetGridX: 9,
    targetGridY: 3
  };

  processTurnActions(app, TEST_P5);

  assert.deepEqual({ x: defender.gridX, y: defender.gridY }, { x: 9, y: 3 });
  assert.deepEqual({ x: attacker.gridX, y: attacker.gridY }, { x: 8, y: 3 });
  assert.equal(attacker.isFrozen, true);
  assert.equal(defender.isFrozen, false);
  assert.equal(checkInvariants(app.state), true);
});

test("Move Toward enemy flag chooses a forward step in the open lane", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  const decision = translateMoveTowardDecision(app.state, actor, MOVE_TOWARD_TARGETS.ENEMY_FLAG);
  assert.equal(decision.type, AI_ACTION_TYPES.MOVE_FORWARD);
});

test("Move Toward my base chooses a backward step when carrying the flag home", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 8;
  actor.gridY = 4;
  const decision = translateMoveTowardDecision(app.state, actor, MOVE_TOWARD_TARGETS.MY_BASE);
  assert.equal(decision.type, AI_ACTION_TYPES.MOVE_BACKWARD);
});

test("Move Toward human runner targets the allied human", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 5;
  actor.gridY = 4;
  const human = getTeamHuman(app.state, 1);
  human.gridX = 5;
  human.gridY = 2;
  const decision = translateMoveTowardDecision(app.state, actor, MOVE_TOWARD_TARGETS.HUMAN_RUNNER);
  assert.equal(decision.type, AI_ACTION_TYPES.MOVE_UP_SCREEN);
});

test("Move Toward closest enemy selects the nearest active enemy deterministically", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 5;
  actor.gridY = 4;
  const enemies = app.state.allRunners.filter((runner) => runner.team === 2);
  enemies[0].gridX = 7;
  enemies[0].gridY = 4;
  enemies[1].gridX = 5;
  enemies[1].gridY = 1;
  const decision = translateMoveTowardDecision(app.state, actor, MOVE_TOWARD_TARGETS.CLOSEST_ENEMY);
  assert.equal(decision.type, AI_ACTION_TYPES.MOVE_FORWARD);
});

test("Move Toward breaks equal-axis ties by preferring forward or behind before vertical movement", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 4;
  actor.gridY = 4;
  const human = getTeamHuman(app.state, 1);
  human.gridX = 6;
  human.gridY = 2;
  const decision = translateMoveTowardDecision(app.state, actor, MOVE_TOWARD_TARGETS.HUMAN_RUNNER);
  assert.equal(decision.type, AI_ACTION_TYPES.MOVE_FORWARD);
});
