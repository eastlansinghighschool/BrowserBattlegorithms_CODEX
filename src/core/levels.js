import {
  DEFAULT_GAME_MODE,
  DEFAULT_MAP_KEY,
  DEFAULT_FREE_PLAY_MODE,
  DEFAULT_FREE_PLAY_TEAM_SIZE,
  FREE_PLAY_MODES,
  GAME_VIEW_MODES,
  GOAL_BURST_DURATION_MS,
  HUMAN_TURN_BEHAVIORS,
  LEVEL_RESULT,
  LEVEL_STATUS,
  MAIN_GAME_STATES,
  MAPS,
  TURN_STATES
} from "../config/constants.js";
import { createInitialLevelProgress, getLevelDefinitions } from "../config/levels.js";
import { initializeDisplayState, initializeMatch, syncHumanTurnBehaviorVisuals } from "./setup.js";
import { createRandomizedFreePlayTeamSetup, getGameModeForFreePlayMode, getTeamFlagHome } from "./teams.js";
import { playSound } from "../ui/sound.js";

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

function applyLevelToState(state, level) {
  const levelSetup = level.setup || {};
  state.currentGameMode = level.mode;
  state.currentMapKey = level.mapKey;
  state.gameMap = MAPS[level.mapKey];
  state.pointsToWin = levelSetup.pointsToWin || 1;
  state.autoStayHumanRunnerIds = levelSetup.autoStayHumanRunnerIds || [];
  state.activeTeamSetup = structuredClone(levelSetup.teams || null);
  state.activeFlagSetup = structuredClone(levelSetup.flags || null);
  state.setupBarriers = levelSetup.barriers || [];
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
  state.humanTurnBehavior = HUMAN_TURN_BEHAVIORS.AUTO_SKIP;
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
    showModePicker: state.showModePicker,
    currentLevelId: state.currentLevelId,
    currentLevelStatus: state.currentLevelStatus,
    activeLevelResult: state.activeLevelResult,
    levelAttemptCount: state.levelAttemptCount,
    lastLevelResultReason: state.lastLevelResultReason,
    levelProgress: { ...state.levelProgress },
    humanTurnBehavior: state.humanTurnBehavior,
    teams: structuredClone(state.teams || {}),
    currentSensorObjectTypes: [...(state.currentSensorObjectTypes || [])],
    currentSensorRelationTypes: [...(state.currentSensorRelationTypes || [])],
    currentMoveTowardTargetTypes: [...(state.currentMoveTowardTargetTypes || [])],
    goalBurstEffect: state.goalBurstEffect ? { ...state.goalBurstEffect } : null,
    activeTutorial: state.activeTutorial ? {
      key: state.activeTutorial.key,
      currentIndex: state.activeTutorial.currentIndex
    } : null
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
  state.humanTurnBehavior = currentLevel?.humanTurnBehavior || HUMAN_TURN_BEHAVIORS.AUTO_SKIP;
  if (typeof app.hooks.onGuidedLevelSelected === "function" && currentLevel) {
    app.hooks.onGuidedLevelSelected(currentLevel);
  }
}

export function enterFreePlay(app) {
  const { state } = app;
  state.currentModeView = GAME_VIEW_MODES.FREE_PLAY;
  state.freePlayMode = state.freePlayMode || DEFAULT_FREE_PLAY_MODE;
  state.freePlayTeamSize = state.freePlayTeamSize || DEFAULT_FREE_PLAY_TEAM_SIZE;
  state.freePlayMapKey = state.freePlayMapKey || DEFAULT_MAP_KEY;
  state.activeBlocklyTeamTab = state.activeBlocklyTeamTab || 1;
  state.currentGameMode = getGameModeForFreePlayMode(state.freePlayMode);
  state.currentMapKey = state.freePlayMapKey;
  state.gameMap = MAPS[state.freePlayMapKey];
  state.pointsToWin = 2;
  state.autoStayHumanRunnerIds = [];
  state.activeTeamSetup = createRandomizedFreePlayTeamSetup(state.freePlayMode, state.freePlayTeamSize, state.randomFn);
  state.activeFlagSetup = null;
  state.setupBarriers = [];
  state.humanTurnBehavior = HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT;
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
  state.humanTurnBehavior = level.humanTurnBehavior || HUMAN_TURN_BEHAVIORS.AUTO_SKIP;
  initializeMatch(app);
  syncHumanTurnBehaviorVisuals(state);
  state.mainGameState = MAIN_GAME_STATES.RUNNING;
  if (typeof app.hooks.onLevelStarted === "function") {
    app.hooks.onLevelStarted(level);
  }
  return level;
}

export function resetCurrentLevel(app, reason = "manual_reset") {
  const { state } = app;
  const preservedWorkspaceXml = app.hooks.getWorkspaceXmlText?.() || "";
  state.lastLevelResultReason = reason;
  enterGuidedMode(app);
  if (preservedWorkspaceXml) {
    app.hooks.importWorkspaceXml?.(preservedWorkspaceXml);
  }
  return getCurrentLevel(app);
}

export function setGuidedHumanTurnBehavior(app, behavior) {
  app.state.humanTurnBehavior = behavior;
  syncHumanTurnBehaviorVisuals(app.state);
}

export function completeLevel(app, result, reason) {
  const { state } = app;
  if (result === LEVEL_RESULT.PASSED) {
    playSound(state, "level-pass");
    const goalCell = getLevelGoalCell(app);
    if (goalCell) {
      triggerGoalBurst(state, goalCell, getCurrentLevel(app)?.winCondition?.teamId || 1);
    }
  }
  if (result === LEVEL_RESULT.FAILED) {
    playSound(state, "level-fail");
  }
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
  if (typeof app.hooks.onLevelEnded === "function") {
    app.hooks.onLevelEnded(result, reason);
  }
}

export function configureFreePlay(app, updates = {}) {
  const { state } = app;
  state.currentModeView = GAME_VIEW_MODES.FREE_PLAY;
  state.freePlayMode = updates.freePlayMode ?? state.freePlayMode ?? DEFAULT_FREE_PLAY_MODE;
  state.freePlayTeamSize = updates.freePlayTeamSize ?? state.freePlayTeamSize ?? DEFAULT_FREE_PLAY_TEAM_SIZE;
  state.freePlayMapKey = updates.freePlayMapKey ?? state.freePlayMapKey ?? DEFAULT_MAP_KEY;
  state.activeBlocklyTeamTab = updates.activeBlocklyTeamTab ?? (
    state.freePlayMode === FREE_PLAY_MODES.PLAYER_VS_PLAYER ? (state.activeBlocklyTeamTab || 1) : 1
  );
  state.currentGameMode = getGameModeForFreePlayMode(state.freePlayMode);
  state.currentMapKey = state.freePlayMapKey;
  state.gameMap = MAPS[state.freePlayMapKey];
  state.pointsToWin = 2;
  state.autoStayHumanRunnerIds = [];
  state.activeTeamSetup = createRandomizedFreePlayTeamSetup(state.freePlayMode, state.freePlayTeamSize, state.randomFn);
  state.activeFlagSetup = null;
  state.setupBarriers = [];
  state.humanTurnBehavior = HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT;
  state.activeLevelResult = LEVEL_RESULT.NONE;
  state.lastLevelResultReason = null;
  initializeDisplayState(app);
  if (typeof app.hooks.onFreePlayEntered === "function") {
    app.hooks.onFreePlayEntered();
  }
}

export function triggerGoalBurst(state, cell, teamId = 1) {
  if (!cell) {
    return;
  }
  state.goalBurstEffect = {
    cellX: cell.x,
    cellY: cell.y,
    teamId,
    durationMs: GOAL_BURST_DURATION_MS,
    burstKey: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  };
}

export function getLevelGoalCell(app) {
  const level = getCurrentLevel(app);
  if (!level || app.state.currentModeView !== GAME_VIEW_MODES.GUIDED_LEVELS) {
    return null;
  }

  let targetX = null;
  let targetY = null;
  if (level.winCondition.type === "runner_reaches_cell") {
    targetX = level.winCondition.targetCell.x;
    targetY = level.winCondition.targetCell.y;
  } else if (level.winCondition.type === "runner_reaches_cell_after_action") {
    targetX = level.winCondition.targetCell.x;
    targetY = level.winCondition.targetCell.y;
  } else if (level.winCondition.type === "barrier_exists_at_cell") {
    targetX = level.winCondition.targetCell.x;
    targetY = level.winCondition.targetCell.y;
  } else if (level.winCondition.type === "runner_reaches_enemy_flag") {
    const actor = app.state.allRunners.find((runner) => runner.id === level.winCondition.runnerId);
    const enemyTeamId = actor?.team === 1 ? 2 : 1;
    const enemyFlag = app.state.gameFlags[enemyTeamId];
    if (enemyFlag) {
      targetX = enemyFlag.gridX;
      targetY = enemyFlag.gridY;
    }
  } else if (level.winCondition.type === "team_scores_point") {
    const actor = app.state.allRunners.find((runner) => runner.id === level.winCondition.runnerId || runner.id === "runner_1_AI_AllyP1");
    const scoredAlready = (app.state.teamScores[level.winCondition.teamId] || 0) > 0;
    if (actor && scoredAlready) {
      targetX = actor.gridX;
      targetY = actor.gridY;
    } else if (actor?.hasEnemyFlag) {
      const teamFlagHome = getTeamFlagHome(app.state, actor.team);
      const scoringEntryX = (teamFlagHome?.x ?? actor.gridX) + actor.playDirection;
      targetX = scoringEntryX;
      targetY = actor.gridY;
    } else {
      const enemyTeamId = actor?.team === 1 ? 2 : 1;
      const enemyFlag = app.state.gameFlags[enemyTeamId];
      if (enemyFlag) {
        targetX = enemyFlag.gridX;
        targetY = enemyFlag.gridY;
      }
    }
  }

  return targetX === null || targetY === null ? null : { x: targetX, y: targetY };
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

export function getNextAvailableLevelId(app) {
  const nextLevelId = getNextLevelId(app.state, app.state.currentLevelId);
  if (!nextLevelId) {
    return null;
  }
  return app.state.levelProgress[nextLevelId] === LEVEL_STATUS.LOCKED ? null : nextLevelId;
}

export function evaluateLevelProgress(app) {
  const { state } = app;
  if (state.currentModeView !== GAME_VIEW_MODES.GUIDED_LEVELS) {
    return null;
  }
  if (state.mainGameState !== MAIN_GAME_STATES.RUNNING && state.mainGameState !== MAIN_GAME_STATES.GAME_OVER) {
    return null;
  }

  const level = getCurrentLevel(app);
  if (!level) {
    return null;
  }

  const actor = level.winCondition.runnerId
    ? state.allRunners.find((runner) => runner.id === level.winCondition.runnerId)
    : null;
  if (level.winCondition.runnerId && !actor) {
    return null;
  }

  let passed = false;
  if (level.winCondition.type === "runner_reaches_cell") {
    passed = actor.gridX === level.winCondition.targetCell.x && actor.gridY === level.winCondition.targetCell.y;
  } else if (level.winCondition.type === "runner_reaches_enemy_flag") {
    const enemyTeamId = actor.team === 1 ? 2 : 1;
    const enemyFlag = state.gameFlags[enemyTeamId];
    passed = actor.hasEnemyFlag || (enemyFlag && actor.gridX === enemyFlag.gridX && actor.gridY === enemyFlag.gridY);
  } else if (level.winCondition.type === "team_scores_point") {
    passed = (state.teamScores[level.winCondition.teamId] || 0) > 0;
  } else if (level.winCondition.type === "runner_reaches_cell_after_action") {
    const actionHistory = state.runnerActionHistory?.[level.winCondition.runnerId] || [];
    const requiredActionTypes = level.winCondition.actionTypes || [];
    passed = actor.gridX === level.winCondition.targetCell.x &&
      actor.gridY === level.winCondition.targetCell.y &&
      requiredActionTypes.some((actionType) => actionHistory.includes(actionType));
  } else if (level.winCondition.type === "barrier_exists_at_cell") {
    passed = state.barriers.some(
      (barrier) =>
        barrier.gridX === level.winCondition.targetCell.x &&
        barrier.gridY === level.winCondition.targetCell.y
    );
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
