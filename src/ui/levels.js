import {
  FREE_PLAY_MAP_OPTIONS,
  FREE_PLAY_MODES,
  FREE_PLAY_TEAM_SIZE_MAX,
  FREE_PLAY_TEAM_SIZE_MIN,
  GAME_VIEW_MODES,
  HUMAN_TURN_BEHAVIORS,
  LEVEL_RESULT,
  LEVEL_STATUS
} from "../config/constants.js";
import {
  getBlockDisplayLabel,
  getMoveTowardTargetLabel,
  getSensorObjectLabel,
  getSensorRelationLabel
} from "../ai/blockly/blocks.js";
import {
  configureFreePlay,
  enterFreePlay,
  enterGuidedMode,
  getCurrentLevel,
  goToNextLevel,
  resetCurrentLevel,
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

function describeGoal(level) {
  if (level.winCondition.type === "runner_reaches_cell") {
    return `Reach (${level.winCondition.targetCell.x}, ${level.winCondition.targetCell.y})`;
  }
  if (level.winCondition.type === "runner_reaches_enemy_flag") {
    return "Reach the enemy flag.";
  }
  if (level.winCondition.type === "team_scores_point") {
    return "Carry the enemy flag back home to score a point.";
  }
  return "Complete the challenge.";
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

function getResultStateLabel(app) {
  if (app.state.activeLevelResult === LEVEL_RESULT.PASSED) {
    return "Passed";
  }
  if (app.state.activeLevelResult === LEVEL_RESULT.FAILED) {
    return "Try Again";
  }
  if (app.state.mainGameState === "RUNNING") {
    return "In Progress";
  }
  return "Ready";
}

function renderLegendItems(level) {
  if (!(level.legendItems || []).length) {
    return "";
  }

  return `
    <div class="lesson-legend">
      <p class="lesson-legend-title">What you are looking at</p>
      <div class="lesson-legend-grid">
        ${level.legendItems.map((item) => `
          <div class="lesson-legend-item">
            <span class="lesson-legend-emoji" aria-hidden="true">${escapeHtml(item.emoji || "")}</span>
            <div>
              <span class="lesson-legend-label">${escapeHtml(item.label)}</span>
              <span class="lesson-legend-description">${escapeHtml(item.description)}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderAvailableTools(level) {
  const rows = [
    level.toolboxBlockTypes?.length
      ? `<p class="lesson-inline-list"><strong>Blocks:</strong> ${level.toolboxBlockTypes.map((blockType) => escapeHtml(getBlockDisplayLabel(blockType))).join(", ")}</p>`
      : "",
    level.moveTowardTargetTypes?.length
      ? `<p class="lesson-inline-list"><strong>Move Toward:</strong> ${level.moveTowardTargetTypes.map((value) => escapeHtml(getMoveTowardTargetLabel(value))).join(", ")}</p>`
      : "",
    level.sensorObjectTypes?.length
      ? `<p class="lesson-inline-list"><strong>Sensors:</strong> ${level.sensorObjectTypes.map((value) => escapeHtml(getSensorObjectLabel(value))).join(", ")}</p>`
      : "",
    level.sensorRelationTypes?.length
      ? `<p class="lesson-inline-list"><strong>Relations:</strong> ${level.sensorRelationTypes.map((value) => escapeHtml(getSensorRelationLabel(value))).join(", ")}</p>`
      : ""
  ].filter(Boolean);

  if (!rows.length) {
    return "";
  }

  return `
    <details class="lesson-disclosure">
      <summary>Available Tools</summary>
      <div class="lesson-disclosure-content">
        ${rows.join("")}
      </div>
    </details>
  `;
}

function renderLessonDetails(app, level) {
  const detailItems = [
    `<li><strong>Goal:</strong> ${escapeHtml(describeGoal(level))}</li>`,
    app.state.humanTurnBehavior === HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT
      ? "<li><strong>Human turns:</strong> This level waits for keyboard input from the human runner.</li>"
      : "<li><strong>Human turns:</strong> Human turns auto-skip so you can focus on the puzzle.</li>"
  ];

  return `
    <details class="lesson-disclosure">
      <summary>More Details</summary>
      <div class="lesson-disclosure-content">
        <ul class="lesson-detail-list">
          ${detailItems.join("")}
        </ul>
      </div>
    </details>
  `;
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

function getFreePlayModeLabel(mode) {
  if (mode === FREE_PLAY_MODES.PLAYER_VS_PLAYER) {
    return "Player vs Player";
  }
  if (mode === FREE_PLAY_MODES.PLAYER_VS_CPU_EASY) {
    return "Player vs CPU (Easy)";
  }
  if (mode === FREE_PLAY_MODES.PLAYER_VS_CPU_TACTICAL) {
    return "Player vs CPU (Tactical)";
  }
  return mode;
}

function renderFreePlayOptions(app) {
  const modeOptions = [
    FREE_PLAY_MODES.PLAYER_VS_PLAYER,
    FREE_PLAY_MODES.PLAYER_VS_CPU_EASY,
    FREE_PLAY_MODES.PLAYER_VS_CPU_TACTICAL
  ]
    .map((mode) => `<option value="${mode}" ${mode === app.state.freePlayMode ? "selected" : ""}>${escapeHtml(getFreePlayModeLabel(mode))}</option>`)
    .join("");

  const sizeOptions = Array.from(
    { length: FREE_PLAY_TEAM_SIZE_MAX - FREE_PLAY_TEAM_SIZE_MIN + 1 },
    (_, index) => FREE_PLAY_TEAM_SIZE_MIN + index
  )
    .map((size) => `<option value="${size}" ${size === app.state.freePlayTeamSize ? "selected" : ""}>${size} runners per side</option>`)
    .join("");

  const mapOptions = FREE_PLAY_MAP_OPTIONS
    .map((option) => `<option value="${option.key}" ${option.key === app.state.freePlayMapKey ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
    .join("");

  const currentMapLabel = FREE_PLAY_MAP_OPTIONS.find((option) => option.key === app.state.freePlayMapKey)?.label || app.state.freePlayMapKey;
  const programSummary = app.state.freePlayMode === FREE_PLAY_MODES.PLAYER_VS_PLAYER
    ? `Editing Team ${app.state.activeBlocklyTeamTab || 1} Program`
    : "Editing Player Team Program";

  return `
    <div class="free-play-setup">
      <label>Mode
        <select data-action="free-play-mode">${modeOptions}</select>
      </label>
      <label>Team Size
        <select data-action="free-play-team-size">${sizeOptions}</select>
      </label>
      <label>Map
        <select data-action="free-play-map">${mapOptions}</select>
      </label>
    </div>
    <p class="student-lesson-goal">Build a sandbox match, then test ideas with humans, Blockly allies, and CPU teams.</p>
    <p class="lesson-inline-list"><strong>Current setup:</strong> ${escapeHtml(getFreePlayModeLabel(app.state.freePlayMode))} | ${escapeHtml(currentMapLabel)} | ${escapeHtml(`${app.state.freePlayTeamSize} runners per side`)}</p>
    <p class="lesson-inline-list"><strong>Blockly:</strong> ${escapeHtml(programSummary)}</p>
    <details class="lesson-disclosure" open>
      <summary>Controls</summary>
      <div class="lesson-disclosure-content">
        <p class="lesson-support-note">Team 1 uses WASD to move, J/F to jump, B to place a barrier, and X to stay still.</p>
        <p class="lesson-support-note">Team 2 uses O K L ; to move, M to jump, I to place a barrier, and . to stay still.</p>
      </div>
    </details>
  `;
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
      if (
        app.state.activeLevelResult === LEVEL_RESULT.PASSED ||
        app.state.activeLevelResult === LEVEL_RESULT.FAILED ||
        app.state.mainGameState === "RUNNING"
      ) {
        resetCurrentLevel(app);
      } else {
        startLevel(app, app.state.currentLevelId);
      }
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

  panel.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    if (target.dataset.action === "free-play-mode") {
      configureFreePlay(app, { freePlayMode: target.value, activeBlocklyTeamTab: 1 });
    } else if (target.dataset.action === "free-play-team-size") {
      configureFreePlay(app, { freePlayTeamSize: Number(target.value) });
    } else if (target.dataset.action === "free-play-map") {
      configureFreePlay(app, { freePlayMapKey: target.value });
    } else {
      return;
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
  const successLead = currentLevel.winCondition.type === "team_scores_point"
    ? "Level passed. Scoring a point completed the challenge."
    : "Level passed.";
  const resultMessage = app.state.activeLevelResult === LEVEL_RESULT.PASSED
    ? `<p class="level-result success">${successLead} ${resultReason}</p>`
    : app.state.activeLevelResult === LEVEL_RESULT.FAILED
      ? `<p class="level-result failure">Level failed. ${resultReason}</p>`
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
      <div class="level-summary student-lesson-card">
        <div class="student-lesson-topline">
          <span class="lesson-status-pill">${escapeHtml(getResultStateLabel(app))}</span>
          ${app.state.humanTurnBehavior === HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT ? '<span class="lesson-mode-pill">Keyboard practice level</span>' : ""}
        </div>
        <div>
          <h3 class="student-lesson-title">${escapeHtml(currentLevel.title)}</h3>
          <p class="student-lesson-goal">${escapeHtml(currentLevel.description)}</p>
        </div>
        ${currentLevel.introText ? `<p class="level-intro">${escapeHtml(currentLevel.introText)}</p>` : ""}
        ${renderLegendItems(currentLevel)}
        ${app.state.humanTurnBehavior === HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT ? `
          <div class="lesson-alert">
            This level teaches direct keyboard control. Use the controls shown in the Blockly panel while the human runner is active.
          </div>
        ` : ""}
        ${resultMessage}
        <div class="level-actions">
          <button data-action="start-current-level">${
            app.state.mainGameState === "RUNNING" ||
            app.state.activeLevelResult === LEVEL_RESULT.PASSED ||
            app.state.activeLevelResult === LEVEL_RESULT.FAILED
              ? "Reset Level"
              : "Start Level"
            }</button>
          </div>
        ${(currentLevel.tips || []).length ? `
          <details class="lesson-disclosure">
            <summary>Hints</summary>
            <div class="lesson-disclosure-content">
              <ul class="lesson-detail-list">${currentLevel.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
            </div>
          </details>
        ` : ""}
        ${renderAvailableTools(currentLevel)}
        ${renderLessonDetails(app, currentLevel)}
        <details class="lesson-disclosure">
          <summary>Human Turn Options</summary>
          <div class="lesson-disclosure-content">
            <p class="lesson-support-note">Use auto-skip for programming-focused lessons, or wait-for-input when you want the human runner to act.</p>
            <div class="human-turn-toggle">
              <button data-action="set-human-auto-skip" ${app.state.humanTurnBehavior === HUMAN_TURN_BEHAVIORS.AUTO_SKIP ? "disabled" : ""}>Auto Skip Human</button>
              <button data-action="set-human-wait" ${app.state.humanTurnBehavior === HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT ? "disabled" : ""}>Wait For Input</button>
            </div>
          </div>
        </details>
      </div>
    ` : `
      <div class="level-summary free-play-card">
        <h3>Free Play</h3>
        <p>Set up a sandbox match with the map, team size, and opponents you want.</p>
        ${renderFreePlayOptions(app)}
      </div>
    `}
  `;
}
