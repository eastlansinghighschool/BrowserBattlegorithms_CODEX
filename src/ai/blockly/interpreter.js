import { AI_ACTION_TYPES } from "../../config/constants.js";
import { getFirstRunnableAction } from "./workspace.js";

export function getAIAllyAction(app) {
  const action = getFirstRunnableAction(app);
  return action || { type: AI_ACTION_TYPES.STAY_STILL };
}
