import { AI_ACTION_TYPES, TEAM_CONFIG } from "../../config/constants.js";
import { isCellBlockedByImpassables } from "../../core/movement.js";

export function calculateNpcType1Action(npcRunner, state) {
  let targetX;
  let targetY;
  const enemyTeamId = npcRunner.team === 1 ? 2 : 1;
  const ownTeamId = npcRunner.team;
  const enemyFlag = state.gameFlags[enemyTeamId];

  if (npcRunner.hasEnemyFlag) {
    targetX = TEAM_CONFIG[ownTeamId].initialFlagPos.x;
    targetY = TEAM_CONFIG[ownTeamId].initialFlagPos.y;
  } else if (enemyFlag && !enemyFlag.carriedByRunnerId) {
    targetX = enemyFlag.gridX;
    targetY = enemyFlag.gridY;
  } else if (enemyFlag && enemyFlag.carriedByRunnerId) {
    const flagCarrier = state.allRunners.find((runner) => runner.id === enemyFlag.carriedByRunnerId);
    if (!flagCarrier) {
      return { actionType: AI_ACTION_TYPES.STAY_STILL };
    }
    targetX = flagCarrier.gridX;
    targetY = flagCarrier.gridY;
  } else {
    return { actionType: AI_ACTION_TYPES.STAY_STILL };
  }

  const deltaX = targetX - npcRunner.gridX;
  const deltaY = targetY - npcRunner.gridY;
  let preferredDx = 0;
  let preferredDy = 0;
  let fallbackDx = 0;
  let fallbackDy = 0;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    preferredDx = Math.sign(deltaX);
    fallbackDy = Math.sign(deltaY);
  } else {
    preferredDy = Math.sign(deltaY);
    fallbackDx = Math.sign(deltaX);
  }

  let nextX = npcRunner.gridX + preferredDx;
  let nextY = npcRunner.gridY + preferredDy;
  if ((preferredDx !== 0 || preferredDy !== 0) && !isCellBlockedByImpassables(nextX, nextY, state.barriers, state.gameMap)) {
    return { actionType: "MOVE", dx: preferredDx, dy: preferredDy };
  }

  nextX = npcRunner.gridX + fallbackDx;
  nextY = npcRunner.gridY + fallbackDy;
  if ((fallbackDx !== 0 || fallbackDy !== 0) && !isCellBlockedByImpassables(nextX, nextY, state.barriers, state.gameMap)) {
    return { actionType: "MOVE", dx: fallbackDx, dy: fallbackDy };
  }

  return { actionType: AI_ACTION_TYPES.STAY_STILL };
}
