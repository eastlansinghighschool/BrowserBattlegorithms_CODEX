import { AI_ACTION_TYPES } from "../config/constants.js";

export function createQueuedHumanAction(runner, actionData) {
  if (actionData.type === AI_ACTION_TYPES.JUMP_FORWARD) {
    return { runner, actionType: AI_ACTION_TYPES.JUMP_FORWARD };
  }

  if (actionData.type === AI_ACTION_TYPES.PLACE_BARRIER_FORWARD) {
    return { runner, actionType: AI_ACTION_TYPES.PLACE_BARRIER_FORWARD };
  }

  if (actionData.type === AI_ACTION_TYPES.STAY_STILL) {
    return {
      runner,
      actionType: AI_ACTION_TYPES.STAY_STILL,
      targetGridX: runner.gridX,
      targetGridY: runner.gridY
    };
  }

  return {
    runner,
    actionType: "MOVE",
    targetGridX: runner.gridX + (actionData.dx || 0),
    targetGridY: runner.gridY + (actionData.dy || 0)
  };
}
