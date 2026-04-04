import { AI_ACTION_TYPES, CELL_TYPE, COLS, MOVE_TOWARD_TARGETS, ROWS } from "../config/constants.js";
import { getTeamBaseCellType, getTeamFlagHome } from "./teams.js";

const RANDOM_MOVE_ACTIONS = [
  AI_ACTION_TYPES.MOVE_FORWARD,
  AI_ACTION_TYPES.MOVE_BACKWARD,
  AI_ACTION_TYPES.MOVE_UP_SCREEN,
  AI_ACTION_TYPES.MOVE_DOWN_SCREEN
];

export function isCellOccupiedByBarrier(gridX, gridY, barriersArray) {
  return barriersArray.some((barrier) => barrier.gridX === gridX && barrier.gridY === gridY);
}

export function getBarrierAtCell(gridX, gridY, barriersArray) {
  return barriersArray.find((barrier) => barrier.gridX === gridX && barrier.gridY === gridY) || null;
}

export function getRunnerAtCell(gridX, gridY, runnersArray, excludeRunnerId = null) {
  return (
    runnersArray.find(
      (runner) => runner.id !== excludeRunnerId && runner.gridX === gridX && runner.gridY === gridY
    ) || null
  );
}

export function isCellBlockedByImpassables(targetGridX, targetGridY, barriersArray, gameMap) {
  if (targetGridX < 0 || targetGridX >= COLS || targetGridY < 0 || targetGridY >= ROWS) {
    return true;
  }
  if (gameMap[targetGridY][targetGridX] === CELL_TYPE.WALL) {
    return true;
  }
  return isCellOccupiedByBarrier(targetGridX, targetGridY, barriersArray);
}

export function isFlagAtHomeCell(state, targetGridX, targetGridY, teamId = null) {
  if (!state?.gameFlags) {
    return false;
  }

  const teamIds = teamId === null ? Object.keys(state.gameFlags) : [teamId];
  return teamIds.some((candidateTeamId) => {
    const flag = state.gameFlags[candidateTeamId];
    return (
      flag &&
      flag.isAtBase &&
      !flag.carriedByRunnerId &&
      flag.gridX === targetGridX &&
      flag.gridY === targetGridY
    );
  });
}

export function isOwnFlagHomeCellBlockedForRunner(state, runner, targetGridX, targetGridY) {
  if (!runner) {
    return false;
  }

  return isFlagAtHomeCell(state, targetGridX, targetGridY, runner.team);
}

export function isCellBlockedForRunner(targetGridX, targetGridY, barriersArray, gameMap, state, runner) {
  return (
    isCellBlockedByImpassables(targetGridX, targetGridY, barriersArray, gameMap) ||
    isOwnFlagHomeCellBlockedForRunner(state, runner, targetGridX, targetGridY)
  );
}

export function isCellBlockedForBarrierPlacement(targetGridX, targetGridY, barriersArray, gameMap, state) {
  return (
    isCellBlockedByImpassables(targetGridX, targetGridY, barriersArray, gameMap) ||
    isFlagAtHomeCell(state, targetGridX, targetGridY)
  );
}

export function getForwardCell(runner, steps = 1) {
  return {
    x: runner.gridX + runner.playDirection * steps,
    y: runner.gridY
  };
}

export function getOwnFlagApproachCell(state, runner) {
  const flagHome = getTeamFlagHome(state, runner.team);
  if (!flagHome) {
    return { x: runner.gridX, y: runner.gridY };
  }

  return {
    x: flagHome.x + runner.playDirection,
    y: flagHome.y
  };
}

function getEnemyFlagTarget(state, runner) {
  const enemyTeamId = runner.team === 1 ? 2 : 1;
  const enemyFlag = state.gameFlags[enemyTeamId];
  if (!enemyFlag) {
    return null;
  }
  if (enemyFlag.carriedByRunnerId) {
    const carrier = state.allRunners.find((candidate) => candidate.id === enemyFlag.carriedByRunnerId);
    if (carrier) {
      return { x: carrier.gridX, y: carrier.gridY };
    }
  }
  return { x: enemyFlag.gridX, y: enemyFlag.gridY };
}

function getMyBaseTarget(state, runner) {
  const baseCellType = getTeamBaseCellType(state, runner.team);
  let bestCell = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let y = 0; y < state.gameMap.length; y += 1) {
    for (let x = 0; x < state.gameMap[y].length; x += 1) {
      if (state.gameMap[y][x] !== baseCellType) {
        continue;
      }
      const distance = Math.abs(x - runner.gridX) + Math.abs(y - runner.gridY);
      if (
        distance < bestDistance ||
        (
          distance === bestDistance &&
          Math.abs(x - runner.gridX) < Math.abs((bestCell?.x ?? x) - runner.gridX)
        )
      ) {
        bestCell = { x, y };
        bestDistance = distance;
      }
    }
  }

  return bestCell;
}

function getHumanRunnerTarget(state, runner) {
  const humanRunner = state.allRunners.find(
    (candidate) => candidate.team === runner.team && candidate.isHumanControlled
  );
  return humanRunner ? { x: humanRunner.gridX, y: humanRunner.gridY } : null;
}

function getClosestEnemyTarget(state, runner) {
  const enemies = state.allRunners
    .filter((candidate) => candidate.team !== runner.team)
    .sort((a, b) => {
      const distanceA = Math.abs(a.gridX - runner.gridX) + Math.abs(a.gridY - runner.gridY);
      const distanceB = Math.abs(b.gridX - runner.gridX) + Math.abs(b.gridY - runner.gridY);
      if (distanceA !== distanceB) {
        return distanceA - distanceB;
      }

      const verticalA = Math.abs(a.gridY - runner.gridY);
      const verticalB = Math.abs(b.gridY - runner.gridY);
      if (verticalA !== verticalB) {
        return verticalA - verticalB;
      }

      const forwardBehindA = Math.abs(a.gridX - runner.gridX);
      const forwardBehindB = Math.abs(b.gridX - runner.gridX);
      if (forwardBehindA !== forwardBehindB) {
        return forwardBehindA - forwardBehindB;
      }

      return a.id.localeCompare(b.id);
    });

  return enemies[0] ? { x: enemies[0].gridX, y: enemies[0].gridY } : null;
}

export function resolveMoveTowardTarget(state, runner, targetType) {
  switch (targetType) {
    case MOVE_TOWARD_TARGETS.ENEMY_FLAG:
      return getEnemyFlagTarget(state, runner);
    case MOVE_TOWARD_TARGETS.MY_BASE:
      return getMyBaseTarget(state, runner);
    case MOVE_TOWARD_TARGETS.HUMAN_RUNNER:
      return getHumanRunnerTarget(state, runner);
    case MOVE_TOWARD_TARGETS.CLOSEST_ENEMY:
      return getClosestEnemyTarget(state, runner);
    default:
      return null;
  }
}

export function translateMoveTowardDecision(state, runner, targetType) {
  const target = resolveMoveTowardTarget(state, runner, targetType);
  if (!target) {
    return { type: AI_ACTION_TYPES.STAY_STILL, actionType: AI_ACTION_TYPES.STAY_STILL };
  }

  const deltaX = target.x - runner.gridX;
  const deltaY = target.y - runner.gridY;

  if (deltaX === 0 && deltaY === 0) {
    return { type: AI_ACTION_TYPES.STAY_STILL, actionType: AI_ACTION_TYPES.STAY_STILL };
  }

  if (Math.abs(deltaX) >= Math.abs(deltaY) && deltaX !== 0) {
    return {
      type: deltaX * runner.playDirection > 0 ? AI_ACTION_TYPES.MOVE_FORWARD : AI_ACTION_TYPES.MOVE_BACKWARD,
      actionType: deltaX * runner.playDirection > 0 ? AI_ACTION_TYPES.MOVE_FORWARD : AI_ACTION_TYPES.MOVE_BACKWARD,
      targetType
    };
  }

  return {
    type: deltaY < 0 ? AI_ACTION_TYPES.MOVE_UP_SCREEN : AI_ACTION_TYPES.MOVE_DOWN_SCREEN,
    actionType: deltaY < 0 ? AI_ACTION_TYPES.MOVE_UP_SCREEN : AI_ACTION_TYPES.MOVE_DOWN_SCREEN,
    targetType
  };
}

export function translateActionDecision(runner, decision, state = null) {
  const actionType = decision.actionType || decision.type || AI_ACTION_TYPES.STAY_STILL;
  if (actionType === AI_ACTION_TYPES.MOVE_TOWARD && state) {
    return translateActionDecision(runner, translateMoveTowardDecision(state, runner, decision.targetType), state);
  }
  if (actionType === AI_ACTION_TYPES.MOVE_RANDOMLY && state) {
    const randomFn = typeof state.randomFn === "function" ? state.randomFn : Math.random;
    const randomIndex = Math.max(0, Math.min(RANDOM_MOVE_ACTIONS.length - 1, Math.floor(randomFn() * RANDOM_MOVE_ACTIONS.length)));
    return translateActionDecision(runner, { type: RANDOM_MOVE_ACTIONS[randomIndex] }, state);
  }
  let dx = decision.dx || 0;
  let dy = decision.dy || 0;

  if (!decision.dx && !decision.dy) {
    switch (actionType) {
      case AI_ACTION_TYPES.MOVE_FORWARD:
        dx = runner.playDirection;
        break;
      case AI_ACTION_TYPES.MOVE_BACKWARD:
        dx = -runner.playDirection;
        break;
      case AI_ACTION_TYPES.MOVE_UP_SCREEN:
        dy = -1;
        break;
      case AI_ACTION_TYPES.MOVE_DOWN_SCREEN:
        dy = 1;
        break;
      default:
        break;
    }
  }

  return {
    runner,
    actionType,
    targetType: decision.targetType || null,
    targetGridX: actionType === AI_ACTION_TYPES.STAY_STILL ? runner.gridX : runner.gridX + dx,
    targetGridY: actionType === AI_ACTION_TYPES.STAY_STILL ? runner.gridY : runner.gridY + dy
  };
}
