import { createApp } from "./core/state.js";
import { initializeDisplayState } from "./core/setup.js";
import {
  getAvailableToolboxBlockTypes,
  initBlockly,
  loadWorkspaceXml,
  setBlocklyEditable,
  setBlocklyToolboxForCurrentMode
} from "./ai/blockly/workspace.js";
import { bindControls } from "./ui/controls.js";
import { updateScoreDisplay } from "./ui/scoreboard.js";
import { setPlayButtonState } from "./ui/gameStateUI.js";
import { initializeP5App } from "./render/p5App.js";
import {
  enterFreePlay,
  enterGuidedMode,
  evaluateLevelProgress,
  getCurrentLevel,
  getLevelStateSnapshot,
  initializeLevelState,
  startLevel
} from "./core/levels.js";
import { bindLevelPanel, renderLevelPanel } from "./ui/levels.js";
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

function loadCurrentLevelWorkspace() {
  const currentLevel = getCurrentLevel(app);
  if (!currentLevel) {
    return;
  }
  loadWorkspaceXml(app, currentLevel.initialBlocklyXml || "");
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
  updateSpotlight(app);
  renderTutorialOverlay(app);
};

initializeLevelState(app);
initializeTutorialState(app);
initBlockly(app);
bindControls(app);
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
  loadWorkspaceXml: (xmlText) => loadWorkspaceXml(app, xmlText),
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
  evaluateLevelProgress: () => {
    const result = evaluateLevelProgress(app);
    app.syncUi();
    return result;
  },
  app
};
