import {
  AI_ACTION_TYPES,
  FREE_PLAY_MODES,
  GAME_VIEW_MODES,
  LEVEL_RESULT,
  MAIN_GAME_STATES,
  P1_KEY_BINDINGS,
  P2_KEY_BINDINGS
} from "../config/constants.js";
import { enterFreePlay, goToNextLevel, startLevel, resetCurrentLevel } from "../core/levels.js";
import { resetGameToSetup, startGame } from "../core/setup.js";
import { handlePlayerInput } from "../core/turnEngine.js";
import { playSound, setSoundEnabled } from "./sound.js";
import { setBlocklyPanelSize } from "./blocklyLayout.js";

export function getAnimationSpeedFactorFromSliderValue(sliderValue) {
  const numericValue = Number.parseInt(sliderValue, 10);
  let speed = ((numericValue - 1) / 19) * (2.0 - 0.1) + 0.1;
  speed = Math.max(0.05, speed);
  return Number.isFinite(speed) ? speed : 1.0;
}

export function bindControls(app) {
  const speedSlider = document.getElementById("speedSlider");
  const speedValueDisplay = document.getElementById("speedValue");
  const controlsPanel = document.getElementById("game-controls");
  const instructionsPanel = document.getElementById("instructions");
  const exportWorkspaceButton = document.getElementById("exportWorkspaceButton");
  const importWorkspaceButton = document.getElementById("importWorkspaceButton");
  const importWorkspaceInput = document.getElementById("importWorkspaceInput");
  const soundToggleButton = document.getElementById("soundToggleButton");
  const blocklyProgramTabs = document.getElementById("blockly-program-tabs");
  const blocklySizeControls = document.getElementById("blockly-size-controls");
  const boardRetryButton = document.getElementById("board-loading-retry");
  const blocklyRetryButton = document.getElementById("blockly-loading-retry");
  if (speedSlider && speedValueDisplay) {
    const updateSpeed = () => {
      app.state.animationSpeedFactor = getAnimationSpeedFactorFromSliderValue(speedSlider.value);
      const value = Number.parseInt(speedSlider.value, 10);
      speedValueDisplay.textContent = value === 10 ? "Normal" : value < 10 ? "Slower" : "Faster";
    };
    speedSlider.addEventListener("input", updateSpeed);
    updateSpeed();
  }

  app.hooks.updateControlsVisibility = () => {
    if (instructionsPanel) {
      instructionsPanel.style.display = app.state.showModePicker ? "none" : "";
    }
    if (controlsPanel) {
      controlsPanel.style.display = app.state.showModePicker ? "none" : "";
    }
  };

  const playResetButton = document.getElementById("playResetButton");
  const showTutorialButton = document.getElementById("showTutorialButton");
  const nextLevelButton = document.getElementById("nextLevelButton");
  if (playResetButton) {
    playResetButton.addEventListener("click", () => {
      if (app.state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS) {
      if (
        app.state.mainGameState === MAIN_GAME_STATES.RUNNING ||
        app.state.activeLevelResult === LEVEL_RESULT.PASSED ||
        app.state.activeLevelResult === LEVEL_RESULT.FAILED
      ) {
        app.hooks.setBlocklyEditable?.(true);
        resetCurrentLevel(app);
      } else {
        startLevel(app, app.state.currentLevelId);
      }
      } else if (app.state.mainGameState === MAIN_GAME_STATES.SETUP || app.state.mainGameState === MAIN_GAME_STATES.GAME_OVER) {
        app.hooks.setBlocklyEditable?.(false);
        startGame(app);
      } else if (app.state.mainGameState === MAIN_GAME_STATES.RUNNING) {
        app.hooks.setBlocklyEditable?.(true);
        resetGameToSetup(app);
      } else {
        app.hooks.setBlocklyEditable?.(true);
        enterFreePlay(app);
      }
      app.syncUi();
    });
  }

  if (nextLevelButton) {
    nextLevelButton.addEventListener("click", () => {
      goToNextLevel(app);
      app.syncUi();
    });
  }

  if (showTutorialButton) {
    showTutorialButton.addEventListener("click", () => {
      app.hooks.startCurrentLevelTutorial?.(true);
    });
  }

  if (exportWorkspaceButton) {
    exportWorkspaceButton.addEventListener("click", () => {
      const xmlText = app.hooks.getWorkspaceXmlText?.() || "";
      const blob = new Blob([xmlText], { type: "text/xml;charset=utf-8" });
      const link = document.createElement("a");
      const modeLabel = app.state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS
        ? app.state.currentLevelId || "guided-level"
        : app.state.freePlayMode === FREE_PLAY_MODES.PLAYER_VS_PLAYER
          ? `free-play-${(app.hooks.getActiveProgramLabel?.() || "player-team").toLowerCase().replace(/\s+/g, "-")}`
          : "free-play-player-team";
      link.href = URL.createObjectURL(blob);
      link.download = `${modeLabel}.xml`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  if (importWorkspaceButton && importWorkspaceInput) {
    importWorkspaceButton.addEventListener("click", () => {
      importWorkspaceInput.click();
    });
    importWorkspaceInput.addEventListener("change", async () => {
      const file = importWorkspaceInput.files?.[0];
      if (!file) {
        return;
      }
      const xmlText = await file.text();
      const result = app.hooks.importWorkspaceXml?.(xmlText);
      app.state.workspaceImportStatus = result?.ok
        ? { tone: "success", message: "Program imported successfully." }
        : { tone: "error", message: `Import failed. ${result?.error || "Please check the XML and try again."}` };
      app.syncUi();
      importWorkspaceInput.value = "";
    });
  }

  if (blocklyProgramTabs) {
    blocklyProgramTabs.addEventListener("click", (event) => {
      const target = event.target.closest("button[data-blockly-team-tab]");
      if (!target) {
        return;
      }
      app.hooks.switchActiveBlocklyTeamTab?.(Number(target.dataset.blocklyTeamTab));
      app.syncUi();
    });
  }

  if (soundToggleButton) {
    const syncSoundButton = () => {
      soundToggleButton.textContent = `Sound: ${app.state.soundEnabled ? "On" : "Off"}`;
    };
    soundToggleButton.addEventListener("click", () => {
      setSoundEnabled(app.state, !app.state.soundEnabled);
      syncSoundButton();
      playSound(app.state, "flag-pickup");
    });
    syncSoundButton();
  }

  if (blocklySizeControls) {
    const syncBlocklySizeControls = () => {
      const selectedSize = app.state.blocklyPanelSize || "standard";
      [...blocklySizeControls.querySelectorAll("button[data-blockly-size]")].forEach((button) => {
        button.disabled = button.dataset.blocklySize === selectedSize;
      });
    };

    blocklySizeControls.addEventListener("click", (event) => {
      const target = event.target.closest("button[data-blockly-size]");
      if (!target) {
        return;
      }
      setBlocklyPanelSize(app, target.dataset.blocklySize);
      syncBlocklySizeControls();
    });

    app.hooks.syncBlocklySizeControls = syncBlocklySizeControls;
    syncBlocklySizeControls();
  }

  if (boardRetryButton) {
    boardRetryButton.addEventListener("click", () => {
      app.hooks.retryBoardLoad?.();
    });
  }

  if (blocklyRetryButton) {
    blocklyRetryButton.addEventListener("click", () => {
      app.hooks.retryEditorLoad?.();
    });
  }
}

export function handleKeyInput(app, rawKey) {
  const state = app.state;
  if (state.activeTutorial) {
    return false;
  }
  if (state.mainGameState !== MAIN_GAME_STATES.RUNNING || state.currentTurnState === "GAME_OVER") {
    return false;
  }

  const currentPlayer = state.allRunners[state.activeRunnerIndex];
  if (!currentPlayer || !currentPlayer.isHumanControlled || currentPlayer.isMoving || currentPlayer.isBouncing || state.currentTurnState !== "AWAITING_INPUT") {
    return false;
  }

  const key = `${rawKey || ""}`.toLowerCase();
  let actionData = {};
  let validKeyPress = false;

  if (currentPlayer.team === 1) {
    if (key === P1_KEY_BINDINGS.UP) { actionData = { type: "MOVE", dy: -1 }; validKeyPress = true; }
    else if (key === P1_KEY_BINDINGS.DOWN) { actionData = { type: "MOVE", dy: 1 }; validKeyPress = true; }
    else if (key === P1_KEY_BINDINGS.LEFT) { actionData = { type: "MOVE", dx: -1 }; validKeyPress = true; }
    else if (key === P1_KEY_BINDINGS.RIGHT) { actionData = { type: "MOVE", dx: 1 }; validKeyPress = true; }
    else if (key === P1_KEY_BINDINGS.JUMP) { actionData = { type: AI_ACTION_TYPES.JUMP_FORWARD }; validKeyPress = true; }
    else if (key === P1_KEY_BINDINGS.PLACE_BARRIER) { actionData = { type: AI_ACTION_TYPES.PLACE_BARRIER_FORWARD }; validKeyPress = true; }
    else if (key === P1_KEY_BINDINGS.STAY_STILL) { actionData = { type: AI_ACTION_TYPES.STAY_STILL }; validKeyPress = true; }
  } else if (currentPlayer.team === 2) {
    if (key === P2_KEY_BINDINGS.UP) { actionData = { type: "MOVE", dy: -1 }; validKeyPress = true; }
    else if (key === P2_KEY_BINDINGS.DOWN) { actionData = { type: "MOVE", dy: 1 }; validKeyPress = true; }
    else if (key === P2_KEY_BINDINGS.LEFT) { actionData = { type: "MOVE", dx: -1 }; validKeyPress = true; }
    else if (rawKey === P2_KEY_BINDINGS.RIGHT) { actionData = { type: "MOVE", dx: 1 }; validKeyPress = true; }
    else if (key === P2_KEY_BINDINGS.JUMP) { actionData = { type: AI_ACTION_TYPES.JUMP_FORWARD }; validKeyPress = true; }
    else if (key === P2_KEY_BINDINGS.PLACE_BARRIER) { actionData = { type: AI_ACTION_TYPES.PLACE_BARRIER_FORWARD }; validKeyPress = true; }
    else if (rawKey === P2_KEY_BINDINGS.STAY_STILL) { actionData = { type: AI_ACTION_TYPES.STAY_STILL }; validKeyPress = true; }
  }

  if (validKeyPress) {
    handlePlayerInput(app, currentPlayer, actionData);
    return true;
  }
  return false;
}
