import { createApp } from "./core/state.js";
import { initializeDisplayState } from "./core/setup.js";
import { bindControls, handleKeyInput } from "./ui/controls.js";
import { bindGoalBurstOverlay, renderGoalBurstOverlay } from "./ui/goalBurstOverlay.js";
import { initializeSoundState } from "./ui/sound.js";
import { updateScoreDisplay } from "./ui/scoreboard.js";
import { setPlayButtonState } from "./ui/gameStateUI.js";
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
import { bindLevelPanel, renderLevelPanel } from "./ui/levels.js";
import { renderBlocklyPanel } from "./ui/blocklyPanel.js";
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
import { startHeavyBoot, retryBoardLoad, retryEditorLoad, whenHeavySystemsReady } from "./startup/loaders.js";

const app = createApp();
app.ui.isLevelPickerOpen = false;
initializeSoundState(app.state);

function renderLoadingPanels() {
  const boardPlaceholder = document.getElementById("board-loading-placeholder");
  const boardMessage = document.getElementById("board-loading-message");
  const boardError = document.getElementById("board-loading-error-message");
  const boardRetry = document.getElementById("board-loading-retry");
  const canvasContainer = document.getElementById("canvas-container");
  const blocklyPlaceholder = document.getElementById("blockly-loading-placeholder");
  const blocklyMessage = document.getElementById("blockly-loading-message");
  const blocklyError = document.getElementById("blockly-loading-error-message");
  const blocklyRetry = document.getElementById("blockly-loading-retry");
  const blocklyDiv = document.getElementById("blocklyDiv");

  if (boardPlaceholder && canvasContainer) {
    boardPlaceholder.hidden = app.state.boardReady;
    canvasContainer.classList.toggle("panel-live", app.state.boardReady);
    if (boardMessage) {
      boardMessage.textContent = app.state.boardLoadError ? "The game board did not finish loading." : "Preparing game board...";
    }
    if (boardError) {
      boardError.textContent = app.state.boardLoadError || "";
    }
    if (boardRetry) {
      boardRetry.hidden = !app.state.boardLoadError;
    }
  }

  if (blocklyPlaceholder && blocklyDiv) {
    blocklyPlaceholder.hidden = app.state.editorReady;
    blocklyDiv.hidden = !app.state.editorReady;
    if (blocklyMessage) {
      blocklyMessage.textContent = app.state.editorLoadError ? "The code block editor did not finish loading." : "Loading code blocks...";
    }
    if (blocklyError) {
      blocklyError.textContent = app.state.editorLoadError || "";
    }
    if (blocklyRetry) {
      blocklyRetry.hidden = !app.state.editorLoadError;
    }
  }
}

function loadCurrentLevelWorkspace() {
  const currentLevel = getCurrentLevel(app);
  if (!currentLevel || !app.hooks.loadWorkspaceFromLocalStorage) {
    return;
  }
  app.hooks.loadWorkspaceFromLocalStorage(currentLevel.initialBlocklyXml || "");
}

function syncEditorForCurrentMode() {
  if (!app.state.editorReady) {
    return;
  }

  if (app.state.currentModeView === "GUIDED_LEVELS") {
    const shouldBeEditable = app.state.mainGameState !== "RUNNING";
    app.hooks.setBlocklyEditable?.(shouldBeEditable);
    app.hooks.setBlocklyToolboxForCurrentMode?.();
    loadCurrentLevelWorkspace();
    return;
  }

  closeTutorial(app, false);
  app.hooks.setBlocklyEditable?.(true);
  app.hooks.setBlocklyToolboxForCurrentMode?.();
  app.hooks.loadWorkspaceFromLocalStorage?.("");
}

function maybeStartCurrentTutorial() {
  if (app.state.showModePicker || !app.state.editorReady || !app.state.boardReady || app.state.mainGameState !== "SETUP") {
    return;
  }
  const currentLevel = getCurrentLevel(app);
  if (app.state.currentModeView === "GUIDED_LEVELS" && currentLevel) {
    maybeStartLevelTutorial(app, currentLevel);
  }
}

app.hooks.onGuidedLevelSelected = () => {
  syncEditorForCurrentMode();
  maybeStartCurrentTutorial();
};

app.hooks.onFreePlayEntered = () => {
  syncEditorForCurrentMode();
};

app.hooks.onLevelStarted = () => {
  closeTutorial(app, true);
  app.hooks.setBlocklyToolboxForCurrentMode?.();
  app.hooks.setBlocklyEditable?.(false);
};

app.hooks.onLevelEnded = () => {
  app.hooks.setBlocklyEditable?.(true);
};

app.hooks.startCurrentLevelTutorial = (force = false) => {
  if (!app.state.boardReady || !app.state.editorReady) {
    return;
  }
  startCurrentLevelTutorial(app, force);
};

app.hooks.chooseInitialMode = (mode) => {
  if (mode === "guided") {
    enterGuidedMode(app);
  } else {
    enterFreePlay(app);
  }
};

app.hooks.onEditorReady = () => {
  syncEditorForCurrentMode();
  maybeStartCurrentTutorial();
};

app.hooks.onBoardReady = () => {
  maybeStartCurrentTutorial();
};

app.hooks.syncCurrentModeAfterSubsystemReady = () => {
  maybeStartCurrentTutorial();
};

app.hooks.retryBoardLoad = () => retryBoardLoad(app);
app.hooks.retryEditorLoad = () => retryEditorLoad(app);

app.syncUi = () => {
  renderLoadingPanels();
  app.hooks.updateControlsVisibility?.();
  app.hooks.syncBlocklySizeControls?.();
  updateScoreDisplay(app);
  setPlayButtonState(app);
  renderLevelPanel(app);
  renderBlocklyPanel(app);
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => {
      app.hooks.resizeBlockly?.();
    });
  } else {
    app.hooks.resizeBlockly?.();
  }
  renderGoalBurstOverlay(app);
  updateSpotlight(app);
  renderTutorialOverlay(app);
};

initializeLevelState(app);
initializeTutorialState(app);
bindControls(app);
bindGoalBurstOverlay(app);
bindLevelPanel(app);
bindTutorialOverlay(app);
initializeDisplayState(app);
app.syncUi();
startHeavyBoot(app);

window.__BBA_TEST_HOOKS__ = {
  getState: () => app.state,
  getLevelState: () => getLevelStateSnapshot(app),
  getBlocklyWorkspace: () => app.blocklyWorkspace,
  getAvailableToolboxBlockTypes: () => app.hooks.getAvailableToolboxBlockTypes?.() || [],
  getAvailableToolboxBlockLabels: () => app.hooks.getAvailableToolboxBlockLabels?.() || [],
  getMoveTowardTargetLabels: () => app.hooks.getMoveTowardTargetLabels?.() || [],
  getSensorObjectLabels: () => app.hooks.getSensorObjectLabels?.() || [],
  getSensorRelationLabels: () => app.hooks.getSensorRelationLabels?.() || [],
  loadWorkspaceXml: (xmlText) => app.hooks.importWorkspaceXml?.(xmlText),
  getWorkspaceXmlText: () => app.hooks.getWorkspaceXmlText?.() || "",
  getAIAllyAction: (runnerOverride = null) => app.hooks.getAIAllyAction?.(runnerOverride),
  isEditorReady: () => Boolean(app.state.editorReady),
  isBoardReady: () => Boolean(app.state.boardReady),
  waitForHeavyReady: () => whenHeavySystemsReady(app),
  startCurrentLevelTutorial: (force = false) => {
    app.hooks.startCurrentLevelTutorial?.(force);
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
    app.hooks.switchActiveBlocklyTeamTab?.(teamId);
    app.syncUi();
    return getLevelStateSnapshot(app);
  },
  evaluateLevelProgress: () => {
    const result = evaluateLevelProgress(app);
    app.syncUi();
    return result;
  },
  processTurn: () => {
    processTurnActions(app, app.p5Instance || {
      lerp(start, end, amount) {
        return start + (end - start) * amount;
      }
    });
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
