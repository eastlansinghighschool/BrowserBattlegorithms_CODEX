import { GAME_VIEW_MODES, HUMAN_TURN_BEHAVIORS, LEVEL_RESULT, LEVEL_STATUS } from "../config/constants.js";
import {
  enterFreePlay,
  enterGuidedMode,
  getCurrentLevel,
  goToNextLevel,
  setGuidedHumanTurnBehavior,
  startLevel
} from "../core/levels.js";

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

function getLevelStatusLabel(status) {
  if (status === LEVEL_STATUS.PASSED) {
    return "Passed";
  }
  if (status === LEVEL_STATUS.LOCKED) {
    return "Locked";
  }
  return "Available";
}

function renderLevelPickerItems(app) {
  return app.state.levels
    .map((level) => {
      const status = app.state.levelProgress[level.id];
      const isCurrent = level.id === app.state.currentLevelId;
      const disabled = status === LEVEL_STATUS.LOCKED ? "disabled" : "";
      const currentClass = isCurrent ? " level-picker-item-current" : "";
      return `
        <button class="level-picker-item${currentClass}" data-level-id="${level.id}" ${disabled}>
          <span class="level-picker-item-title">${escapeHtml(level.title)}</span>
          <span class="level-picker-item-meta">${escapeHtml(getLevelStatusLabel(status))}${status === LEVEL_STATUS.PASSED ? " ✓" : ""}</span>
          <span class="level-picker-item-description">${escapeHtml(level.description)}</span>
        </button>
      `;
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
    event.stopPropagation();

    if (target.dataset.action === "enter-free-play") {
      enterFreePlay(app);
    } else if (target.dataset.action === "enter-guided") {
      enterGuidedMode(app);
    } else if (target.dataset.action === "set-human-auto-skip") {
      setGuidedHumanTurnBehavior(app, HUMAN_TURN_BEHAVIORS.AUTO_SKIP);
    } else if (target.dataset.action === "set-human-wait") {
      setGuidedHumanTurnBehavior(app, HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT);
    } else if (target.dataset.action === "toggle-level-picker") {
      app.ui.isLevelPickerOpen = !app.ui.isLevelPickerOpen;
    } else if (target.dataset.action === "next-level") {
      goToNextLevel(app);
    } else if (target.dataset.action === "start-current-level") {
      startLevel(app, app.state.currentLevelId);
    } else if (target.dataset.action === "replay-tutorial") {
      app.hooks.startCurrentLevelTutorial?.(true);
    } else if (target.dataset.levelId) {
      app.state.currentLevelId = target.dataset.levelId;
      app.state.currentLevelStatus = app.state.levelProgress[target.dataset.levelId];
      app.ui.isLevelPickerOpen = false;
      if (app.state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS) {
        enterGuidedMode(app);
      }
    }

    app.syncUi();
  });

  document.addEventListener("click", (event) => {
    if (!panel.contains(event.target)) {
      app.ui.isLevelPickerOpen = false;
      app.syncUi();
    }
  });
}

export function renderLevelPanel(app) {
  const panel = document.getElementById("level-panel");
  if (!panel) {
    return;
  }

  if (app.state.showModePicker) {
    panel.innerHTML = "";
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
  const pickerOpen = Boolean(app.ui.isLevelPickerOpen);

  panel.innerHTML = `
    <div class="level-panel-header">
      <strong>${inGuided ? "Guided Levels" : "Free Play"}</strong>
    </div>
    <div class="level-mode-toggle">
      <button data-action="enter-guided" ${inGuided ? "disabled" : ""}>Guided</button>
      <button data-action="enter-free-play" ${!inGuided ? "disabled" : ""}>Free Play</button>
    </div>
    ${inGuided ? `
      <div class="level-picker">
        <button class="level-picker-trigger" data-action="toggle-level-picker" aria-expanded="${pickerOpen ? "true" : "false"}">
          <span class="level-picker-trigger-label">${escapeHtml(currentLevel.title)}</span>
          <span class="level-picker-trigger-meta">${escapeHtml(getLevelStatusLabel(app.state.currentLevelStatus))}</span>
        </button>
        ${pickerOpen ? `<div class="level-picker-popover">${renderLevelPickerItems(app)}</div>` : ""}
      </div>
      <div class="level-summary">
        <p>${escapeHtml(currentLevel.description)}</p>
        <p class="level-intro">${escapeHtml(currentLevel.introText || "")}</p>
        <p><strong>Goal:</strong> ${currentLevel.winCondition.type === "runner_reaches_cell" ? `Reach (${currentLevel.winCondition.targetCell.x}, ${currentLevel.winCondition.targetCell.y})` : "Reach the enemy flag."}</p>
        <p><strong>Allowed blocks:</strong> ${currentLevel.toolboxBlockTypes.join(", ")}</p>
        <p><strong>Human turns:</strong> ${app.state.humanTurnBehavior === HUMAN_TURN_BEHAVIORS.AUTO_SKIP ? "Auto Skip" : "Wait For Input"}</p>
        <div class="human-turn-toggle">
          <button data-action="set-human-auto-skip" ${app.state.humanTurnBehavior === HUMAN_TURN_BEHAVIORS.AUTO_SKIP ? "disabled" : ""}>Auto Skip Human</button>
          <button data-action="set-human-wait" ${app.state.humanTurnBehavior === HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT ? "disabled" : ""}>Wait For Input</button>
        </div>
        <p><strong>Status:</strong> ${escapeHtml(app.state.currentLevelStatus)}</p>
        ${(currentLevel.tips || []).length ? `<div class="level-tips"><strong>Tips:</strong><ul>${currentLevel.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul></div>` : ""}
        ${resultMessage}
        <div class="level-actions">
          <button data-action="start-current-level">${app.state.activeLevelResult === LEVEL_RESULT.PASSED ? "Replay Level" : app.state.activeLevelResult === LEVEL_RESULT.FAILED ? "Retry Level" : "Start Level"}</button>
          <button data-action="replay-tutorial">Show Tutorial</button>
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
