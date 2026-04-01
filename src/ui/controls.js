import {
  AI_ACTION_TYPES,
  GAME_VIEW_MODES,
  MAIN_GAME_STATES,
  P1_KEY_BINDINGS,
  P2_KEY_BINDINGS
} from "../config/constants.js";
import { setBlocklyEditable } from "../ai/blockly/workspace.js";
import { enterFreePlay, startLevel, resetCurrentLevel } from "../core/levels.js";
import { resetGameToSetup, startGame } from "../core/setup.js";
import { handlePlayerInput } from "../core/turnEngine.js";

export function getAnimationSpeedFactorFromSliderValue(sliderValue) {
  const numericValue = Number.parseInt(sliderValue, 10);
  let speed = ((numericValue - 1) / 19) * (2.0 - 0.1) + 0.1;
  speed = Math.max(0.05, speed);
  return Number.isFinite(speed) ? speed : 1.0;
}

export function bindControls(app) {
  const speedSlider = document.getElementById("speedSlider");
  const speedValueDisplay = document.getElementById("speedValue");
  if (speedSlider && speedValueDisplay) {
    const updateSpeed = () => {
      app.state.animationSpeedFactor = getAnimationSpeedFactorFromSliderValue(speedSlider.value);
      const value = Number.parseInt(speedSlider.value, 10);
      speedValueDisplay.textContent = value === 10 ? "Normal" : value < 10 ? "Slower" : "Faster";
    };
    speedSlider.addEventListener("input", updateSpeed);
    updateSpeed();
  }

  const playResetButton = document.getElementById("playResetButton");
  if (playResetButton) {
    playResetButton.addEventListener("click", () => {
      if (app.state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS) {
        if (app.state.mainGameState === MAIN_GAME_STATES.RUNNING) {
          setBlocklyEditable(app, true);
          resetCurrentLevel(app);
        } else {
          startLevel(app, app.state.currentLevelId);
        }
      } else if (app.state.mainGameState === MAIN_GAME_STATES.SETUP || app.state.mainGameState === MAIN_GAME_STATES.GAME_OVER) {
        setBlocklyEditable(app, false);
        startGame(app);
      } else if (app.state.mainGameState === MAIN_GAME_STATES.RUNNING) {
        setBlocklyEditable(app, true);
        resetGameToSetup(app);
      } else {
        setBlocklyEditable(app, true);
        enterFreePlay(app);
      }
      app.syncUi();
    });
  }
}

export function handleKeyInput(app, rawKey) {
  const state = app.state;
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
