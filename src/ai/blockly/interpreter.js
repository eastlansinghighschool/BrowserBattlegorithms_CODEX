import { javascriptGenerator } from "blockly/javascript";
import { AI_ACTION_TYPES } from "../../config/constants.js";

export function getAIAllyAction(app, runner) {
  if (!app.blocklyWorkspace) {
    return { type: AI_ACTION_TYPES.STAY_STILL };
  }

  let lastAIAction = null;
  const __bbaSetRunnerAction = (actionType, params = {}) => {
    if (lastAIAction === null) {
      lastAIAction = { type: actionType, params };
    }
  };

  try {
    const code = javascriptGenerator.workspaceToCode(app.blocklyWorkspace);
    eval(code);
  } catch (error) {
    console.error(`Error executing Blockly code for runner ${runner.id}:`, error);
    return { type: AI_ACTION_TYPES.STAY_STILL };
  }

  return lastAIAction || { type: AI_ACTION_TYPES.STAY_STILL };
}
