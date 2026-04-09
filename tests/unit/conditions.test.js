import test from "node:test";
import assert from "node:assert/strict";
import {
  BLOCK_TYPES,
  SENSOR_OBJECT_TYPES,
  SENSOR_RELATION_TYPES
} from "../../src/config/constants.js";
import { buildMatch } from "../../src/testSupport/builders.js";
import { evaluateCondition, evaluateSensorCondition } from "../../src/core/conditions.js";

test("condition helpers detect barrier, enemy, and carried-flag state", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 1;
  actor.gridY = 3;

  app.state.barriers.push({ id: "barrier_test", gridX: 2, gridY: 3, ownerRunnerId: "test" });
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_BARRIER_IN_FRONT), true);

  app.state.barriers = [];
  const enemy = app.state.allRunners.find((runner) => runner.team === 2);
  enemy.gridX = 2;
  enemy.gridY = 3;
  enemy.isFrozen = false;
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_ENEMY_IN_FRONT), true);

  actor.hasEnemyFlag = true;
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_HAVE_ENEMY_FLAG), true);
});

test("resource, team, and territory conditions evaluate correctly", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  const human = app.state.allRunners.find((runner) => runner.team === 1 && runner.isHumanControlled);

  actor.canJump = true;
  actor.canPlaceBarrier = true;
  actor.activeBarrierId = null;
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_CAN_JUMP), true);
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_CAN_PLACE_BARRIER), true);
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_AREA_FREEZE_READY), true);

  human.hasEnemyFlag = true;
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_TEAMMATE_HAS_FLAG), true);

  actor.gridX = 1;
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_ON_MY_SIDE), true);
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_ON_ENEMY_SIDE), false);
  actor.gridX = 8;
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_ON_MY_SIDE), false);
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_ON_ENEMY_SIDE), true);
});

test("generic sensor evaluation supports barrier, edge or wall, enemy flag, and human runner relations", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 1;
  actor.gridY = 3;

  app.state.barriers.push({ id: "barrier_test", gridX: 2, gridY: 3, ownerRunnerId: "test" });
  assert.equal(
    evaluateSensorCondition(app.state, actor, SENSOR_OBJECT_TYPES.BARRIER, SENSOR_RELATION_TYPES.DIRECTLY_IN_FRONT),
    true
  );

  actor.gridX = 11;
  actor.gridY = 3;
  assert.equal(
    evaluateSensorCondition(app.state, actor, SENSOR_OBJECT_TYPES.EDGE_OR_WALL, SENSOR_RELATION_TYPES.DIRECTLY_IN_FRONT),
    true
  );

  actor.gridX = 1;
  actor.gridY = 5;
  const human = app.state.allRunners.find((runner) => runner.team === 1 && runner.isHumanControlled);
  human.gridX = 6;
  human.gridY = 2;
  assert.equal(
    evaluateSensorCondition(app.state, actor, SENSOR_OBJECT_TYPES.HUMAN_RUNNER, SENSOR_RELATION_TYPES.ANYWHERE_FORWARD),
    true
  );
  assert.equal(
    evaluateSensorCondition(app.state, actor, SENSOR_OBJECT_TYPES.HUMAN_RUNNER, SENSOR_RELATION_TYPES.ANYWHERE_ABOVE),
    true
  );

  app.state.gameFlags[2].gridX = 6;
  app.state.gameFlags[2].gridY = 4;
  assert.equal(
    evaluateSensorCondition(app.state, actor, SENSOR_OBJECT_TYPES.ENEMY_FLAG, SENSOR_RELATION_TYPES.WITHIN_6),
    true
  );
});
