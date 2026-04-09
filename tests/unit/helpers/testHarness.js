import * as Blockly from "blockly";
import { AI_ACTION_TYPES, LEVEL_RESULT } from "../../../src/config/constants.js";
import { registerBattleBlocklyBlocks } from "../../../src/ai/blockly/blocks.js";
import { getFirstRunnableAction, loadWorkspaceXml } from "../../../src/ai/blockly/workspace.js";
import { processTurnActions } from "../../../src/core/turnEngine.js";
import { createApp } from "../../../src/core/state.js";
import { initializeLevelState, startLevel } from "../../../src/core/levels.js";

export function buildBlocklyAppWithXml(xmlText) {
  registerBattleBlocklyBlocks();
  const app = createApp();
  app.blocklyWorkspace = new Blockly.Workspace();
  loadWorkspaceXml(app, xmlText);
  app.hooks.getAIAllyAction = (runnerOverride = null) => {
    const runner = runnerOverride || app.state.allRunners.find((candidate) => candidate.team === 1 && !candidate.isHumanControlled && !candidate.isNPC);
    return getFirstRunnableAction(app, runner) || { type: AI_ACTION_TYPES.STAY_STILL };
  };
  return app;
}

export const TEST_P5 = {
  lerp(start, end, amount) {
    return start + (end - start) * amount;
  }
};

export function runGuidedLevelWithSolution(levelId, xmlText) {
  registerBattleBlocklyBlocks();
  const app = createApp();
  app.blocklyWorkspace = new Blockly.Workspace();
  app.hooks.getAIAllyAction = (runnerOverride = null) => {
    const runner = runnerOverride || app.state.allRunners.find((candidate) => candidate.team === 1 && !candidate.isHumanControlled && !candidate.isNPC);
    return getFirstRunnableAction(app, runner) || { type: AI_ACTION_TYPES.STAY_STILL };
  };
  app.state.randomFn = () => 0;
  initializeLevelState(app);
  startLevel(app, levelId);
  loadWorkspaceXml(app, xmlText);

  const trace = [];
  for (let tick = 0; tick < 4000; tick += 1) {
    const activeRunner = app.state.allRunners[app.state.activeRunnerIndex];
    trace.push({
      tick,
      turn: app.state.currentTurnNumber,
      runner: activeRunner?.id || null,
      state: app.state.currentTurnState,
      result: app.state.activeLevelResult
    });
    if (app.state.activeLevelResult === LEVEL_RESULT.PASSED || app.state.activeLevelResult === LEVEL_RESULT.FAILED) {
      break;
    }
    processTurnActions(app, TEST_P5);
  }

  return { app, trace };
}

export function getTeamHuman(state, team = 1) {
  return state.allRunners.find((runner) => runner.team === team && runner.isHumanControlled);
}

export function getTeamProgramRunner(state, team = 1) {
  return state.allRunners.find((runner) => runner.team === team && !runner.isHumanControlled && !runner.isNPC);
}

export function getEnemyRunners(state, team = 1) {
  return state.allRunners.filter((runner) => runner.team !== team);
}
