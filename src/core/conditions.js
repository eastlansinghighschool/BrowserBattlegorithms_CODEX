import {
  AREA_FREEZE_DURATION_TURNS,
  BLOCK_TYPES,
  CELL_TYPE,
  COLS,
  ROWS,
  SENSOR_OBJECT_TYPES,
  SENSOR_RELATION_TYPES
} from "../config/constants.js";
import { getBarrierAtCell, getForwardCell, getRunnerAtCell } from "./movement.js";

function normalizeConditionDescriptor(condition) {
  if (typeof condition === "string") {
    return { type: condition };
  }
  return condition || { type: null };
}

function buildPerimeterCandidates() {
  const candidates = [];
  for (let x = 0; x < COLS; x += 1) {
    candidates.push({ x, y: -1 });
    candidates.push({ x, y: ROWS });
  }
  for (let y = 0; y < ROWS; y += 1) {
    candidates.push({ x: -1, y });
    candidates.push({ x: COLS, y });
  }
  return candidates;
}

function getEnemyFlagCandidate(state, runner) {
  const enemyTeamId = runner.team === 1 ? 2 : 1;
  const enemyFlag = state.gameFlags[enemyTeamId];
  if (!enemyFlag) {
    return [];
  }

  if (enemyFlag.carriedByRunnerId) {
    const carrier = state.allRunners.find((candidate) => candidate.id === enemyFlag.carriedByRunnerId);
    if (carrier) {
      return [{ x: carrier.gridX, y: carrier.gridY }];
    }
  }

  return [{ x: enemyFlag.gridX, y: enemyFlag.gridY }];
}

export function getSensorCandidates(state, runner, objectType) {
  switch (objectType) {
    case SENSOR_OBJECT_TYPES.BARRIER:
      return state.barriers.map((barrier) => ({ x: barrier.gridX, y: barrier.gridY }));
    case SENSOR_OBJECT_TYPES.EDGE_OR_WALL: {
      const wallCells = [];
      for (let y = 0; y < state.gameMap.length; y += 1) {
        for (let x = 0; x < state.gameMap[y].length; x += 1) {
          if (state.gameMap[y][x] === CELL_TYPE.WALL) {
            wallCells.push({ x, y });
          }
        }
      }
      return [...wallCells, ...buildPerimeterCandidates()];
    }
    case SENSOR_OBJECT_TYPES.ENEMY_RUNNER:
      return state.allRunners
        .filter((candidate) => candidate.team !== runner.team && !candidate.isFrozen)
        .map((candidate) => ({ x: candidate.gridX, y: candidate.gridY }));
    case SENSOR_OBJECT_TYPES.ENEMY_FLAG:
      return getEnemyFlagCandidate(state, runner);
    case SENSOR_OBJECT_TYPES.HUMAN_RUNNER:
      return state.allRunners
        .filter((candidate) => candidate.team === runner.team && candidate.isHumanControlled)
        .map((candidate) => ({ x: candidate.gridX, y: candidate.gridY }));
    default:
      return [];
  }
}

function relationDistanceLimit(relationType) {
  switch (relationType) {
    case SENSOR_RELATION_TYPES.WITHIN_2:
      return 2;
    case SENSOR_RELATION_TYPES.WITHIN_3:
      return 3;
    case SENSOR_RELATION_TYPES.WITHIN_4:
      return 4;
    case SENSOR_RELATION_TYPES.WITHIN_5:
      return 5;
    case SENSOR_RELATION_TYPES.WITHIN_6:
      return 6;
    default:
      return null;
  }
}

export function matchesSensorRelation(runner, candidate, relationType) {
  const deltaX = candidate.x - runner.gridX;
  const deltaY = candidate.y - runner.gridY;
  const forwardDelta = deltaX * runner.playDirection;

  switch (relationType) {
    case SENSOR_RELATION_TYPES.DIRECTLY_IN_FRONT:
      return forwardDelta === 1 && deltaY === 0;
    case SENSOR_RELATION_TYPES.DIRECTLY_BEHIND:
      return forwardDelta === -1 && deltaY === 0;
    case SENSOR_RELATION_TYPES.DIRECTLY_ABOVE:
      return deltaX === 0 && deltaY === -1;
    case SENSOR_RELATION_TYPES.DIRECTLY_BELOW:
      return deltaX === 0 && deltaY === 1;
    case SENSOR_RELATION_TYPES.ANYWHERE_FORWARD:
      return forwardDelta > 0;
    case SENSOR_RELATION_TYPES.ANYWHERE_BEHIND:
      return forwardDelta < 0;
    case SENSOR_RELATION_TYPES.ANYWHERE_ABOVE:
      return deltaY < 0;
    case SENSOR_RELATION_TYPES.ANYWHERE_BELOW:
      return deltaY > 0;
    default: {
      const limit = relationDistanceLimit(relationType);
      return limit === null ? false : Math.abs(deltaX) + Math.abs(deltaY) <= limit;
    }
  }
}

export function evaluateSensorCondition(state, runner, objectType, relationType) {
  if (!runner) {
    return false;
  }
  const candidates = getSensorCandidates(state, runner, objectType);
  return candidates.some((candidate) => matchesSensorRelation(runner, candidate, relationType));
}

export function evaluateCondition(state, runner, condition) {
  if (!runner) {
    return false;
  }

  const descriptor = normalizeConditionDescriptor(condition);

  if (
    descriptor.type === BLOCK_TYPES.IF_SENSOR_MATCHES ||
    descriptor.type === BLOCK_TYPES.IF_SENSOR_MATCHES_ELSE
  ) {
    return evaluateSensorCondition(state, runner, descriptor.objectType, descriptor.relationType);
  }

  if (descriptor.type === BLOCK_TYPES.IF_HAVE_ENEMY_FLAG || descriptor.type === BLOCK_TYPES.IF_HAVE_ENEMY_FLAG_ELSE) {
    return Boolean(runner.hasEnemyFlag);
  }

  if (descriptor.type === BLOCK_TYPES.IF_CAN_JUMP || descriptor.type === BLOCK_TYPES.IF_CAN_JUMP_ELSE) {
    return Boolean(runner.canJump);
  }

  if (
    descriptor.type === BLOCK_TYPES.IF_CAN_PLACE_BARRIER ||
    descriptor.type === BLOCK_TYPES.IF_CAN_PLACE_BARRIER_ELSE
  ) {
    return Boolean(runner.canPlaceBarrier && !runner.activeBarrierId);
  }

  if (
    descriptor.type === BLOCK_TYPES.IF_AREA_FREEZE_READY ||
    descriptor.type === BLOCK_TYPES.IF_AREA_FREEZE_READY_ELSE
  ) {
    return !state.teamAreaFreezeUsed?.[runner.team];
  }

  if (
    descriptor.type === BLOCK_TYPES.IF_TEAMMATE_HAS_FLAG ||
    descriptor.type === BLOCK_TYPES.IF_TEAMMATE_HAS_FLAG_ELSE
  ) {
    return state.allRunners.some(
      (candidate) => candidate.team === runner.team && candidate.id !== runner.id && candidate.hasEnemyFlag
    );
  }

  if (descriptor.type === BLOCK_TYPES.IF_ON_MY_SIDE || descriptor.type === BLOCK_TYPES.IF_ON_MY_SIDE_ELSE) {
    return runner.team === 1 ? runner.gridX < COLS / 2 : runner.gridX >= COLS / 2;
  }

  if (descriptor.type === BLOCK_TYPES.IF_ON_ENEMY_SIDE || descriptor.type === BLOCK_TYPES.IF_ON_ENEMY_SIDE_ELSE) {
    return runner.team === 1 ? runner.gridX >= COLS / 2 : runner.gridX < COLS / 2;
  }

  const forwardCell = getForwardCell(runner, 1);
  if (descriptor.type === BLOCK_TYPES.IF_BARRIER_IN_FRONT || descriptor.type === BLOCK_TYPES.IF_BARRIER_IN_FRONT_ELSE) {
    return Boolean(getBarrierAtCell(forwardCell.x, forwardCell.y, state.barriers));
  }

  if (descriptor.type === BLOCK_TYPES.IF_ENEMY_IN_FRONT) {
    const runnerInFront = getRunnerAtCell(forwardCell.x, forwardCell.y, state.allRunners, runner.id);
    return Boolean(runnerInFront && runnerInFront.team !== runner.team && !runnerInFront.isFrozen);
  }

  return false;
}
