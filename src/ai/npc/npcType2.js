import { calculateMoveTowardsTarget } from "./pathing.js";
import {
  AI_ACTION_TYPES,
  NPC_PATROL_RADIUS,
  NPC_THREAT_DETECTION_RADIUS
} from "../../config/constants.js";
import { getOwnFlagApproachCell } from "../../core/movement.js";
import { getTeamFlagHome } from "../../core/teams.js";

export function calculateNpcType2Action(npcRunner, state) {
  const ownTeamId = npcRunner.team;
  const enemyTeamId = ownTeamId === 1 ? 2 : 1;
  const ownFlagInitialPos = getTeamFlagHome(state, ownTeamId) || { x: npcRunner.gridX, y: npcRunner.gridY };
  const ownFlagApproach = getOwnFlagApproachCell(state, npcRunner);
  const enemyRunners = state.allRunners.filter((runner) => runner.team === enemyTeamId && !runner.isFrozen);
  let closestThreat = null;
  let minDistanceToThreat = Infinity;

  for (const enemy of enemyRunners) {
    const distToFlag = Math.hypot(enemy.gridX - ownFlagInitialPos.x, enemy.gridY - ownFlagInitialPos.y);
    if (distToFlag < NPC_THREAT_DETECTION_RADIUS && distToFlag < minDistanceToThreat) {
      minDistanceToThreat = distToFlag;
      closestThreat = enemy;
    }
  }

  if (closestThreat) {
    return calculateMoveTowardsTarget(
      npcRunner,
      closestThreat.gridX,
      closestThreat.gridY,
      state.barriers,
      state.gameMap,
      state
    );
  }

  const distToPatrolCenter = Math.hypot(npcRunner.gridX - ownFlagInitialPos.x, npcRunner.gridY - ownFlagInitialPos.y);
  if (distToPatrolCenter > NPC_PATROL_RADIUS) {
    return calculateMoveTowardsTarget(
      npcRunner,
      ownFlagApproach.x,
      ownFlagApproach.y,
      state.barriers,
      state.gameMap,
      state
    );
  }

  return { actionType: AI_ACTION_TYPES.STAY_STILL };
}
