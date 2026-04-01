import { AI_ACTION_TYPES } from "../../config/constants.js";
import { getFirstRunnableAction } from "./workspace.js";

export function getAIAllyAction(app, runnerOverride = null) {
  const runner = runnerOverride || app.state.allRunners.find((candidate) => candidate.team === 1 && !candidate.isHumanControlled && !candidate.isNPC);
  const action = getFirstRunnableAction(app, runner);
  return action || { type: AI_ACTION_TYPES.STAY_STILL };
}
