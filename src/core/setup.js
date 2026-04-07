import {
  GAME_VIEW_MODES,
  HUMAN_TURN_BEHAVIORS,
  MAIN_GAME_STATES,
  TURN_STATES
} from "../config/constants.js";
import { Flag } from "../entities/Flag.js";
import { Barrier } from "../entities/Barrier.js";
import { Runner } from "../entities/Runner.js";
import {
  buildRuntimeTeams,
  createRandomizedFreePlayTeamSetup,
  getGameModeForFreePlayMode,
  getDefaultSlotPosition,
  getEnemyTeamId,
  getRunnerSlotMetadata
} from "./teams.js";

export function syncHumanTurnBehaviorVisuals(state) {
  const shouldAutoFreezeHumans =
    state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS &&
    state.humanTurnBehavior === HUMAN_TURN_BEHAVIORS.AUTO_SKIP;

  for (const runner of state.allRunners) {
    if (!runner.isHumanControlled) {
      continue;
    }

    const shouldFreezeRunner = shouldAutoFreezeHumans && state.autoStayHumanRunnerIds.includes(runner.id);
    if (shouldFreezeRunner) {
      if (!runner.isAutoSkipFrozen) {
        runner.setFrozen(Number.POSITIVE_INFINITY);
        runner.isAutoSkipFrozen = true;
      } else {
        runner.frozenTurnsRemaining = Number.POSITIVE_INFINITY;
      }
      continue;
    }

    if (runner.isAutoSkipFrozen) {
      runner.isAutoSkipFrozen = false;
      runner.isFrozen = false;
      runner.frozenTurnsRemaining = 0;
      runner.isGracePeriod = false;
    }
  }
}

function getSemanticRoleForTeamId(teamId) {
  return Number(teamId) === 1 ? "player" : "opponent";
}

function resolveActiveTeamSetup(state) {
  if (state.activeTeamSetup) {
    return structuredClone(state.activeTeamSetup);
  }

  return createRandomizedFreePlayTeamSetup(state.freePlayMode, state.freePlayTeamSize, state.randomFn);
}

function resolveFlagOverrideForTeam(state, teamId) {
  const role = getSemanticRoleForTeamId(teamId);
  return state.activeFlagSetup?.[role] || state.activeFlagSetup?.[teamId] || null;
}

function applyRunnerSetup(runner, teamConfig, runnerSpec) {
  const position = {
    gridX: runnerSpec.gridX ?? runner.gridX,
    gridY: runnerSpec.gridY ?? runner.gridY
  };

  runner.gridX = position.gridX;
  runner.gridY = position.gridY;
  runner.initialGridX = position.gridX;
  runner.initialGridY = position.gridY;
  runner.pixelX = position.gridX * 50;
  runner.pixelY = position.gridY * 50;
  runner.targetGridX = position.gridX;
  runner.targetGridY = position.gridY;
  runner.targetPixelX = runner.pixelX;
  runner.targetPixelY = runner.pixelY;
  runner.playDirection = teamConfig.playDirection;
  runner.canJump = runnerSpec.canJump ?? true;
  runner.canPlaceBarrier = runnerSpec.canPlaceBarrier ?? true;
  runner.hasEnemyFlag = runnerSpec.hasEnemyFlag ?? false;
  runner.cpuBehavior = runnerSpec.cpuBehavior ?? null;
  runner.cpuRole = runnerSpec.cpuRole ?? null;

  if (runnerSpec.isFrozen) {
    runner.setFrozen(runnerSpec.frozenTurnsRemaining || 1);
  }
}

function buildRunnersFromTeams(state) {
  state.allRunners = [];

  for (const teamId of [1, 2]) {
    const teamConfig = state.teams[teamId];
    let allyIndex = 0;
    for (const runnerSpec of teamConfig.runners) {
      const slotMetadata = getRunnerSlotMetadata(teamId, runnerSpec.slot);
      const defaultPosition = getDefaultSlotPosition(teamConfig.homeSide, runnerSpec.slot);
      const gridX = runnerSpec.gridX ?? defaultPosition.gridX;
      const gridY = runnerSpec.gridY ?? defaultPosition.gridY;
      const isHumanControlled = runnerSpec.isHumanControlled ?? slotMetadata.isHumanControlled;
      const isNPC = runnerSpec.isNPC ?? slotMetadata.isNPC;
      const idSuffix = runnerSpec.idSuffix ?? slotMetadata.idSuffix;
      const runner = new Runner(gridX, gridY, teamId, isHumanControlled, idSuffix, isNPC);
      applyRunnerSetup(runner, teamConfig, runnerSpec);
      if (!runner.isHumanControlled && !runner.isNPC) {
        runner.allyIndex = allyIndex;
        allyIndex += 1;
      }
      state.allRunners.push(runner);
    }
  }

  for (const runner of state.allRunners) {
    runner.carriedFlagEmoji = state.teams[getEnemyTeamId(runner.team)]?.flagEmoji || null;
  }
}

function buildFlagsFromTeams(state) {
  state.gameFlags = {};

  for (const teamId of [1, 2]) {
    const teamConfig = state.teams[teamId];
    state.gameFlags[teamId] = new Flag(
      teamConfig.flagHome.x,
      teamConfig.flagHome.y,
      teamId,
      teamConfig.flagEmoji
    );
  }

  for (const teamId of [1, 2]) {
    const flag = state.gameFlags[teamId];
    const override = resolveFlagOverrideForTeam(state, teamId);
    if (!override) {
      continue;
    }

    if (override.gridX !== undefined) {
      flag.gridX = override.gridX;
      flag.initialGridX = override.gridX;
    }
    if (override.gridY !== undefined) {
      flag.gridY = override.gridY;
      flag.initialGridY = override.gridY;
    }
    if (override.isAtBase !== undefined) {
      flag.isAtBase = override.isAtBase;
    }
    if (override.carriedByRunnerId !== undefined) {
      flag.carriedByRunnerId = override.carriedByRunnerId;
    }
    if (flag.carriedByRunnerId) {
      const carrier = state.allRunners.find((runner) => runner.id === flag.carriedByRunnerId);
      if (carrier) {
        carrier.hasEnemyFlag = true;
        flag.gridX = carrier.gridX;
        flag.gridY = carrier.gridY;
      }
    }
  }
}

function applySetupBarriers(state) {
  state.barriers = (state.setupBarriers || []).map(
    (barrier) => new Barrier(barrier.gridX, barrier.gridY, barrier.ownerRunnerId)
  );
}

export function initializeMatch(app) {
  const { state } = app;
  if (state.currentModeView === GAME_VIEW_MODES.FREE_PLAY) {
    state.currentGameMode = getGameModeForFreePlayMode(state.freePlayMode);
  }
  state.teams = buildRuntimeTeams(resolveActiveTeamSetup(state));
  buildRunnersFromTeams(state);
  buildFlagsFromTeams(state);
  state.barriers = [];
  state.activeRunnerIndex = 0;
  state.teamScores = { 1: 0, 2: 0 };
  state.teamAreaFreezeUsed = { 1: false, 2: false };
  state.runnerActionHistory = {};
  state.currentTurnNumber = 1;
  state.currentTurnState = TURN_STATES.AWAITING_INPUT;
  state.queuedActionForCurrentRunner = null;
  state.goalBurstEffect = null;
  applySetupBarriers(state);
  syncHumanTurnBehaviorVisuals(state);
}

export function initializeDisplayState(app) {
  const { state } = app;
  if (state.currentModeView === GAME_VIEW_MODES.FREE_PLAY) {
    state.currentGameMode = getGameModeForFreePlayMode(state.freePlayMode);
  }
  state.teams = buildRuntimeTeams(resolveActiveTeamSetup(state));
  buildRunnersFromTeams(state);
  buildFlagsFromTeams(state);
  state.barriers = [];
  applySetupBarriers(state);
  state.teamScores = { 1: 0, 2: 0 };
  state.teamAreaFreezeUsed = { 1: false, 2: false };
  state.runnerActionHistory = {};
  state.currentTurnNumber = 1;
  state.activeRunnerIndex = 0;
  state.currentTurnState = TURN_STATES.SETUP_DISPLAY;
  state.mainGameState = MAIN_GAME_STATES.SETUP;
  state.queuedActionForCurrentRunner = null;
  state.goalBurstEffect = null;
  syncHumanTurnBehaviorVisuals(state);
}

export function resetRound(state) {
  state.allRunners.forEach((runner) => runner.resetToInitial());
  Object.values(state.gameFlags).forEach((flag) => flag.resetToInitialPosition());
  state.barriers = [];
  state.teamAreaFreezeUsed = { 1: false, 2: false };
  state.runnerActionHistory = {};
  state.activeRunnerIndex = 0;
  state.currentTurnState = TURN_STATES.AWAITING_INPUT;
  state.queuedActionForCurrentRunner = null;
  state.goalBurstEffect = null;
}

export function startGame(app) {
  initializeMatch(app);
  app.state.mainGameState = MAIN_GAME_STATES.RUNNING;
}

export function resetGameToSetup(app) {
  initializeDisplayState(app);
}
