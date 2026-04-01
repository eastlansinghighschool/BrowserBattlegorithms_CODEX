import { AI_ACTION_TYPES, CELL_TYPE, COLS, ROWS } from "../config/constants.js";

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

export function getForwardCell(runner, steps = 1) {
  return {
    x: runner.gridX + runner.playDirection * steps,
    y: runner.gridY
  };
}

export function translateActionDecision(runner, decision) {
  const actionType = decision.actionType || decision.type || AI_ACTION_TYPES.STAY_STILL;
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
    targetGridX: actionType === AI_ACTION_TYPES.STAY_STILL ? runner.gridX : runner.gridX + dx,
    targetGridY: actionType === AI_ACTION_TYPES.STAY_STILL ? runner.gridY : runner.gridY + dy
  };
}
