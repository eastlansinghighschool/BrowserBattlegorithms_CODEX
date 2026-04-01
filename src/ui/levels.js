import { GAME_VIEW_MODES, LEVEL_RESULT, LEVEL_STATUS } from "../config/constants.js";
import { enterFreePlay, enterGuidedMode, getCurrentLevel, goToNextLevel, startLevel } from "../core/levels.js";

function escapeHtml(value) {
  return `${value || ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function humanizeResultReason(reason) {
  if (!reason) return "";
  if (reason === "win_condition_met") return "Challenge complete.";
  if (reason === "turn_limit_exceeded") return "The turn limit was reached before the goal was met.";
  if (reason === "manual_reset") return "The level was restarted.";
  return reason;
}

function renderLevelButtons(app) {
  return app.state.levels
    .map((level) => {
      const status = app.state.levelProgress[level.id];
      const isCurrent = level.id === app.state.currentLevelId;
      const disabled = status === LEVEL_STATUS.LOCKED ? "disabled" : "";
      const currentClass = isCurrent ? " level-button-current" : "";
      return `<button class="level-button${currentClass}" data-level-id="${level.id}" ${disabled}>${escapeHtml(level.title)}${status === LEVEL_STATUS.PASSED ? " ✓" : ""}</button>`;
    })
    .join("");
}

export function bindLevelPanel(app) {
  const panel = document.getElementById("level-panel");
  if (!panel) {
    return;
  }

  panel.addEventListener("click", (event) => {
    const target = event.target.closest("button");
    if (!target) {
      return;
    }

    if (target.dataset.action === "enter-free-play") {
      enterFreePlay(app);
    } else if (target.dataset.action === "enter-guided") {
      enterGuidedMode(app);
    } else if (target.dataset.action === "next-level") {
      goToNextLevel(app);
    } else if (target.dataset.action === "start-current-level") {
      startLevel(app, app.state.currentLevelId);
    } else if (target.dataset.levelId) {
      app.state.currentLevelId = target.dataset.levelId;
      app.state.currentLevelStatus = app.state.levelProgress[target.dataset.levelId];
      if (app.state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS) {
        enterGuidedMode(app);
      }
    }

    app.syncUi();
  });
}

export function renderLevelPanel(app) {
  const panel = document.getElementById("level-panel");
  if (!panel) {
    return;
  }

  const currentLevel = getCurrentLevel(app);
  if (!currentLevel) {
    panel.innerHTML = "";
    return;
  }

  const inGuided = app.state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS;
  const resultReason = humanizeResultReason(app.state.lastLevelResultReason);
  const resultMessage = app.state.activeLevelResult === LEVEL_RESULT.PASSED
    ? `<p class="level-result success">Level passed. ${resultReason}</p>`
    : app.state.activeLevelResult === LEVEL_RESULT.FAILED
      ? `<p class="level-result failure">Level failed. ${resultReason}</p>`
      : "";

  const nextLevelButton = app.state.activeLevelResult === LEVEL_RESULT.PASSED && app.state.levelProgress["reach-enemy-flag"] !== LEVEL_STATUS.LOCKED && app.state.currentLevelId !== "reach-enemy-flag"
    ? '<button data-action="next-level">Next Level</button>'
    : "";

  panel.innerHTML = `
    <div class="level-panel-header">
      <strong>${inGuided ? "Guided Levels" : "Free Play"}</strong>
    </div>
    <div class="level-mode-toggle">
      <button data-action="enter-guided" ${inGuided ? "disabled" : ""}>Guided</button>
      <button data-action="enter-free-play" ${!inGuided ? "disabled" : ""}>Free Play</button>
    </div>
    ${inGuided ? `
      <div class="level-list">${renderLevelButtons(app)}</div>
      <div class="level-summary">
        <h3>${escapeHtml(currentLevel.title)}</h3>
        <p>${escapeHtml(currentLevel.description)}</p>
        <p><strong>Goal:</strong> ${currentLevel.winCondition.type === "runner_reaches_cell" ? `Reach (${currentLevel.winCondition.targetCell.x}, ${currentLevel.winCondition.targetCell.y})` : "Reach the enemy flag."}</p>
        <p><strong>Allowed blocks:</strong> ${currentLevel.toolboxBlockTypes.join(", ")}</p>
        <p><strong>Status:</strong> ${escapeHtml(app.state.currentLevelStatus)}</p>
        ${resultMessage}
        <div class="level-actions">
          <button data-action="start-current-level">${app.state.activeLevelResult === LEVEL_RESULT.PASSED ? "Replay Level" : app.state.activeLevelResult === LEVEL_RESULT.FAILED ? "Retry Level" : "Start Level"}</button>
          ${nextLevelButton}
        </div>
      </div>
    ` : `
      <div class="level-summary">
        <h3>Free Play</h3>
        <p>Play the sandbox match with the full current toolbox and existing match flow.</p>
      </div>
    `}
  `;
}
