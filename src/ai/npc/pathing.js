import { AI_ACTION_TYPES } from "../../config/constants.js";
import { isCellBlockedByImpassables } from "../../core/movement.js";

export function calculateMoveTowardsTarget(runner, targetX, targetY, barriers, gameMap) {
  const deltaX = targetX - runner.gridX;
  const deltaY = targetY - runner.gridY;
  if (deltaX === 0 && deltaY === 0) {
    return { actionType: AI_ACTION_TYPES.STAY_STILL };
  }

  let preferredDx = 0;
  let preferredDy = 0;
  let fallbackDx = 0;
  let fallbackDy = 0;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    preferredDx = Math.sign(deltaX);
    if (deltaY !== 0) {
      fallbackDy = Math.sign(deltaY);
    }
  } else {
    preferredDy = Math.sign(deltaY);
    if (deltaX !== 0) {
      fallbackDx = Math.sign(deltaX);
    }
  }

  let nextX = runner.gridX + preferredDx;
  let nextY = runner.gridY + preferredDy;
  if ((preferredDx !== 0 || preferredDy !== 0) && !isCellBlockedByImpassables(nextX, nextY, barriers, gameMap)) {
    return { actionType: "MOVE", dx: preferredDx, dy: preferredDy };
  }

  nextX = runner.gridX + fallbackDx;
  nextY = runner.gridY + fallbackDy;
  if ((fallbackDx !== 0 || fallbackDy !== 0) && !isCellBlockedByImpassables(nextX, nextY, barriers, gameMap)) {
    return { actionType: "MOVE", dx: fallbackDx, dy: fallbackDy };
  }

  return { actionType: AI_ACTION_TYPES.STAY_STILL };
}
