import { GAME_VIEW_MODES, LEVEL_RESULT } from "../config/constants.js";
import { getNextAvailableLevelId } from "../core/levels.js";

export function setPlayButtonState(app) {
  const button = document.getElementById("playResetButton");
  const nextLevelButton = document.getElementById("nextLevelButton");
  if (!button) {
    return;
  }

  if (app.state.showModePicker) {
    button.style.display = "none";
    if (nextLevelButton) {
      nextLevelButton.style.display = "none";
    }
    return;
  }

  button.style.display = "";
  if (nextLevelButton) {
    nextLevelButton.style.display = "none";
  }

  if (app.state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS) {
    if (app.state.mainGameState === "RUNNING") {
      button.textContent = "Reset Level";
    } else if (app.state.activeLevelResult === LEVEL_RESULT.PASSED) {
      button.textContent = "Replay Level";
      if (nextLevelButton && getNextAvailableLevelId(app)) {
        nextLevelButton.style.display = "";
      }
    } else if (app.state.activeLevelResult === LEVEL_RESULT.FAILED) {
      button.textContent = "Retry Level";
    } else {
      button.textContent = "Start Level";
    }
    return;
  }

  if (app.state.mainGameState === "RUNNING") {
    button.textContent = "Reset";
  } else if (app.state.mainGameState === "GAME_OVER") {
    button.textContent = "Reset Game";
  } else {
    button.textContent = "Play";
  }
}
