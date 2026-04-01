import {
  DEFAULT_GAME_MODE,
  DEFAULT_MAP_KEY,
  GAME_VIEW_MODES,
  LEVEL_RESULT,
  LEVEL_STATUS,
  MAIN_GAME_STATES,
  MAPS,
  TURN_STATES
} from "../config/constants.js";
import { createInitialLevelProgress, getLevelDefinitions } from "../config/levels.js";
import { initializeDisplayState, initializeMatch } from "./setup.js";

function findCurrentLevel(state) {
  return state.levels.find((level) => level.id === state.currentLevelId) || null;
}

function getNextLevelId(state, currentLevelId) {
  const index = state.levels.findIndex((level) => level.id === currentLevelId);
  if (index === -1 || index === state.levels.length - 1) {
    return null;
  }
  return state.levels[index + 1].id;
}

function applyRunnerOverrides(state, setupOverrides) {
  const runnerOverrides = setupOverrides?.runnerOverrides || {};
  for (const runner of state.allRunners) {
    const override = runnerOverrides[runner.id];
    if (!override) {
      continue;
    }
    if (override.gridX !== undefined) {
      runner.gridX = override.gridX;
      runner.initialGridX = override.gridX;
      runner.pixelX = override.gridX * 50;
      runner.targetGridX = override.gridX;
      runner.targetPixelX = runner.pixelX;
    }
    if (override.gridY !== undefined) {
      runner.gridY = override.gridY;
      runner.initialGridY = override.gridY;
      runner.pixelY = override.gridY * 50;
      runner.targetGridY = override.gridY;
      runner.targetPixelY = runner.pixelY;
    }
    if (override.isFrozen) {
      runner.setFrozen(override.frozenTurnsRemaining || 1);
    }
    if (override.canJump !== undefined) {
      runner.canJump = override.canJump;
    }
    if (override.canPlaceBarrier !== undefined) {
      runner.canPlaceBarrier = override.canPlaceBarrier;
    }
  }
}

function applyLevelToState(state, level) {
  state.currentGameMode = level.mode;
  state.currentMapKey = level.mapKey;
  state.gameMap = MAPS[level.mapKey];
  state.pointsToWin = level.setupOverrides?.pointsToWin || 1;
  state.autoStayHumanRunnerIds = level.setupOverrides?.autoStayHumanRunnerIds || [];
  state.displayRunnerOverrides = level.setupOverrides?.runnerOverrides || null;
}

export function initializeLevelState(app) {
  const { state } = app;
  state.currentModeView = GAME_VIEW_MODES.GUIDED_LEVELS;
  state.levels = getLevelDefinitions();
  state.levelProgress = createInitialLevelProgress();
  state.currentLevelId = state.levels[0].id;
  state.currentLevelStatus = state.levelProgress[state.currentLevelId];
  state.activeLevelResult = LEVEL_RESULT.NONE;
  state.levelAttemptCount = 0;
  state.lastLevelResultReason = null;
  state.currentToolboxBlockTypes = [];
  const currentLevel = findCurrentLevel(state);
  if (currentLevel) {
    applyLevelToState(state, currentLevel);
  }
}

export function getCurrentLevel(app) {
  return findCurrentLevel(app.state);
}

export function getLevelStateSnapshot(app) {
  const { state } = app;
  return {
    currentModeView: state.currentModeView,
    currentLevelId: state.currentLevelId,
    currentLevelStatus: state.currentLevelStatus,
    activeLevelResult: state.activeLevelResult,
    levelAttemptCount: state.levelAttemptCount,
    lastLevelResultReason: state.lastLevelResultReason,
    levelProgress: { ...state.levelProgress }
  };
}

export function enterGuidedMode(app) {
  const { state } = app;
  state.currentModeView = GAME_VIEW_MODES.GUIDED_LEVELS;
  const currentLevel = getCurrentLevel(app);
  if (currentLevel) {
    applyLevelToState(state, currentLevel);
  }
  initializeDisplayState(app);
  state.activeLevelResult = LEVEL_RESULT.NONE;
  state.lastLevelResultReason = null;
  state.currentLevelStatus = state.levelProgress[state.currentLevelId];
  if (typeof app.hooks.onGuidedLevelSelected === "function" && currentLevel) {
    app.hooks.onGuidedLevelSelected(currentLevel);
  }
}

export function enterFreePlay(app) {
  const { state } = app;
  state.currentModeView = GAME_VIEW_MODES.FREE_PLAY;
  state.currentGameMode = DEFAULT_GAME_MODE;
  state.currentMapKey = DEFAULT_MAP_KEY;
  state.gameMap = MAPS[DEFAULT_MAP_KEY];
  state.pointsToWin = 2;
  state.autoStayHumanRunnerIds = [];
  state.displayRunnerOverrides = null;
  state.activeLevelResult = LEVEL_RESULT.NONE;
  state.lastLevelResultReason = null;
  initializeDisplayState(app);
  if (typeof app.hooks.onFreePlayEntered === "function") {
    app.hooks.onFreePlayEntered();
  }
}

export function startLevel(app, levelId = app.state.currentLevelId) {
  const { state } = app;
  const level = state.levels.find((entry) => entry.id === levelId);
  if (!level) {
    return null;
  }

  state.currentModeView = GAME_VIEW_MODES.GUIDED_LEVELS;
  state.currentLevelId = level.id;
  state.currentLevelStatus = state.levelProgress[level.id];
  state.activeLevelResult = LEVEL_RESULT.IN_PROGRESS;
  state.levelAttemptCount += 1;
  state.lastLevelResultReason = null;

  applyLevelToState(state, level);
  initializeMatch(app);
  applyRunnerOverrides(state, level.setupOverrides);
  state.mainGameState = MAIN_GAME_STATES.RUNNING;
  if (typeof app.hooks.onLevelStarted === "function") {
    app.hooks.onLevelStarted(level);
  }
  return level;
}

export function resetCurrentLevel(app, reason = "manual_reset") {
  const { state } = app;
  state.lastLevelResultReason = reason;
  enterGuidedMode(app);
  return getCurrentLevel(app);
}

export function completeLevel(app, result, reason) {
  const { state } = app;
  state.activeLevelResult = result;
  state.lastLevelResultReason = reason;
  state.mainGameState = MAIN_GAME_STATES.LEVEL_RESULT;
  state.currentTurnState = TURN_STATES.SETUP_DISPLAY;

  if (result === LEVEL_RESULT.PASSED) {
    state.levelProgress[state.currentLevelId] = LEVEL_STATUS.PASSED;
    const nextLevelId = getNextLevelId(state, state.currentLevelId);
    if (nextLevelId && state.levelProgress[nextLevelId] === LEVEL_STATUS.LOCKED) {
      state.levelProgress[nextLevelId] = LEVEL_STATUS.AVAILABLE;
    }
  }

  state.currentLevelStatus = state.levelProgress[state.currentLevelId];
}

export function goToNextLevel(app) {
  const nextLevelId = getNextLevelId(app.state, app.state.currentLevelId);
  if (!nextLevelId) {
    return null;
  }
  app.state.currentLevelId = nextLevelId;
  app.state.currentLevelStatus = app.state.levelProgress[nextLevelId];
  app.state.activeLevelResult = LEVEL_RESULT.NONE;
  app.state.lastLevelResultReason = null;
  enterGuidedMode(app);
  return nextLevelId;
}

export function evaluateLevelProgress(app) {
  const { state } = app;
  if (state.currentModeView !== GAME_VIEW_MODES.GUIDED_LEVELS) {
    return null;
  }
  if (state.mainGameState !== MAIN_GAME_STATES.RUNNING) {
    return null;
  }

  const level = getCurrentLevel(app);
  if (!level) {
    return null;
  }

  const actor = state.allRunners.find((runner) => runner.id === level.winCondition.runnerId);
  if (!actor) {
    return null;
  }

  let passed = false;
  if (level.winCondition.type === "runner_reaches_cell") {
    passed = actor.gridX === level.winCondition.targetCell.x && actor.gridY === level.winCondition.targetCell.y;
  } else if (level.winCondition.type === "runner_reaches_enemy_flag") {
    const enemyTeamId = actor.team === 1 ? 2 : 1;
    const enemyFlag = state.gameFlags[enemyTeamId];
    passed = actor.hasEnemyFlag || (enemyFlag && actor.gridX === enemyFlag.gridX && actor.gridY === enemyFlag.gridY);
  }

  if (passed) {
    completeLevel(app, LEVEL_RESULT.PASSED, "win_condition_met");
    return { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" };
  }

  if (level.failureCondition?.type === "turn_limit_exceeded" && state.currentTurnNumber > level.failureCondition.maxTurns) {
    completeLevel(app, LEVEL_RESULT.FAILED, "turn_limit_exceeded");
    return { result: LEVEL_RESULT.FAILED, reason: "turn_limit_exceeded" };
  }

  return null;
}
