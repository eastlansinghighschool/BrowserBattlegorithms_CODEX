import { createApp } from "./core/state.js";
import { initializeDisplayState } from "./core/setup.js";
import {
  getAvailableToolboxBlockLabels,
  getAvailableToolboxBlockTypes,
  getMoveTowardTargetLabels,
  getSensorObjectLabels,
  getSensorRelationLabels,
  getWorkspaceXmlText,
  importWorkspaceXml,
  initBlockly,
  loadWorkspaceFromLocalStorage,
  setBlocklyEditable,
  setBlocklyToolboxForCurrentMode
} from "./ai/blockly/workspace.js";
import { bindControls, handleKeyInput } from "./ui/controls.js";
import { bindGoalBurstOverlay, renderGoalBurstOverlay } from "./ui/goalBurstOverlay.js";
import { initializeSoundState } from "./ui/sound.js";
import { updateScoreDisplay } from "./ui/scoreboard.js";
import { setPlayButtonState } from "./ui/gameStateUI.js";
import { initializeP5App } from "./render/p5App.js";
import {
  configureFreePlay,
  enterFreePlay,
  enterGuidedMode,
  evaluateLevelProgress,
  getCurrentLevel,
  getLevelStateSnapshot,
  initializeLevelState,
  startLevel
} from "./core/levels.js";
import { switchActiveBlocklyTeamTab } from "./ai/blockly/workspace.js";
import { bindLevelPanel, renderLevelPanel } from "./ui/levels.js";
import { renderBlocklyPanel } from "./ui/blocklyPanel.js";
import { getAIAllyAction } from "./ai/blockly/interpreter.js";
import { processTurnActions } from "./core/turnEngine.js";
import {
  bindTutorialOverlay,
  closeTutorial,
  initializeTutorialState,
  maybeStartLevelTutorial,
  renderTutorialOverlay,
  startCurrentLevelTutorial,
  updateSpotlight
} from "./ui/tutorialOverlay.js";

const app = createApp();
app.ui.isLevelPickerOpen = false;
initializeSoundState(app.state);

function loadCurrentLevelWorkspace() {
  const currentLevel = getCurrentLevel(app);
  if (!currentLevel) {
    return;
  }
  loadWorkspaceFromLocalStorage(app, currentLevel.initialBlocklyXml || "");
}

app.hooks.onGuidedLevelSelected = () => {
  setBlocklyEditable(app, true);
  setBlocklyToolboxForCurrentMode(app);
  loadCurrentLevelWorkspace();
  maybeStartLevelTutorial(app, getCurrentLevel(app));
};

app.hooks.onFreePlayEntered = () => {
  closeTutorial(app, false);
  setBlocklyEditable(app, true);
  setBlocklyToolboxForCurrentMode(app);
  loadWorkspaceFromLocalStorage(app, "");
};

app.hooks.onLevelStarted = () => {
  closeTutorial(app, true);
  setBlocklyToolboxForCurrentMode(app);
  setBlocklyEditable(app, false);
};
app.hooks.onLevelEnded = () => {
  setBlocklyEditable(app, true);
};
app.hooks.startCurrentLevelTutorial = (force = false) => {
  startCurrentLevelTutorial(app, force);
};
app.hooks.chooseInitialMode = (mode) => {
  if (mode === "guided") {
    enterGuidedMode(app);
  } else {
    enterFreePlay(app);
  }
};

app.syncUi = () => {
  app.hooks.updateControlsVisibility?.();
  updateScoreDisplay(app);
  setPlayButtonState(app);
  renderLevelPanel(app);
  renderBlocklyPanel(app);
  renderGoalBurstOverlay(app);
  updateSpotlight(app);
  renderTutorialOverlay(app);
};

initializeLevelState(app);
initializeTutorialState(app);
initBlockly(app);
bindControls(app);
bindGoalBurstOverlay(app);
bindLevelPanel(app);
bindTutorialOverlay(app);
initializeDisplayState(app);
initializeP5App(app);
app.syncUi();

window.__BBA_TEST_HOOKS__ = {
  getState: () => app.state,
  getLevelState: () => getLevelStateSnapshot(app),
  getBlocklyWorkspace: () => app.blocklyWorkspace,
  getAvailableToolboxBlockTypes: () => getAvailableToolboxBlockTypes(app),
  getAvailableToolboxBlockLabels: () => getAvailableToolboxBlockLabels(app),
  getMoveTowardTargetLabels: () => getMoveTowardTargetLabels(),
  getSensorObjectLabels: () => getSensorObjectLabels(),
  getSensorRelationLabels: () => getSensorRelationLabels(),
  loadWorkspaceXml: (xmlText) => importWorkspaceXml(app, xmlText),
  getWorkspaceXmlText: () => getWorkspaceXmlText(app),
  getAIAllyAction: () => getAIAllyAction(app),
  startCurrentLevelTutorial: (force = false) => {
    startCurrentLevelTutorial(app, force);
    app.syncUi();
  },
  startLevel: (levelId) => {
    const level = startLevel(app, levelId);
    app.syncUi();
    return level ? getLevelStateSnapshot(app) : null;
  },
  enterFreePlay: () => {
    enterFreePlay(app);
    app.syncUi();
    return getLevelStateSnapshot(app);
  },
  configureFreePlay: (updates) => {
    configureFreePlay(app, updates);
    app.syncUi();
    return getLevelStateSnapshot(app);
  },
  switchBlocklyTeamTab: (teamId) => {
    switchActiveBlocklyTeamTab(app, teamId);
    app.syncUi();
    return getLevelStateSnapshot(app);
  },
  evaluateLevelProgress: () => {
    const result = evaluateLevelProgress(app);
    app.syncUi();
    return result;
  },
  processTurn: () => {
    processTurnActions(app, app.p5Instance);
    app.syncUi();
    return app.state;
  },
  sendKey: (key) => {
    const handled = handleKeyInput(app, key);
    app.syncUi();
    return handled;
  },
  app
};
