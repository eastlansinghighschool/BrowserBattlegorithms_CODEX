import {
  GAME_MODES,
  MAIN_GAME_STATES,
  TEAM1_AI_ALLY_INITIAL_POS,
  TEAM1_HUMAN_INITIAL_POS,
  TEAM2_AI_ALLY_INITIAL_POS,
  TEAM2_ENEMY1_INITIAL_POS,
  TEAM2_ENEMY2_INITIAL_POS,
  TEAM2_HUMAN_INITIAL_POS,
  TEAM2_NPC1_INITIAL_POS,
  TEAM2_NPC2_INITIAL_POS,
  TEAM_CONFIG,
  TURN_STATES
} from "../config/constants.js";
import { Flag } from "../entities/Flag.js";
import { Barrier } from "../entities/Barrier.js";
import { Runner } from "../entities/Runner.js";

function applyDisplayRunnerOverrides(state, overrides) {
  if (!overrides) {
    return;
  }
  for (const runner of state.allRunners) {
    const override = overrides[runner.id];
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
    if (override.hasEnemyFlag !== undefined) {
      runner.hasEnemyFlag = override.hasEnemyFlag;
    }
  }
}

function applyDisplayFlagOverrides(state, overrides) {
  if (!overrides) {
    return;
  }
  for (const [teamId, override] of Object.entries(overrides)) {
    const flag = state.gameFlags[teamId];
    if (!flag || !override) {
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
  state.allRunners = [];
  state.gameFlags = {};
  state.barriers = [];

  const humanP1 = new Runner(TEAM1_HUMAN_INITIAL_POS.x, TEAM1_HUMAN_INITIAL_POS.y, 1, true, "HumanP1");
  const aiAllyP1 = new Runner(TEAM1_AI_ALLY_INITIAL_POS.x, TEAM1_AI_ALLY_INITIAL_POS.y, 1, false, "AI_AllyP1");
  state.allRunners.push(humanP1, aiAllyP1);

  if (state.currentGameMode === GAME_MODES.PLAYER_VS_PLAYER) {
    const humanP2 = new Runner(TEAM2_HUMAN_INITIAL_POS.x, TEAM2_HUMAN_INITIAL_POS.y, 2, true, "HumanP2");
    const aiAllyP2 = new Runner(TEAM2_AI_ALLY_INITIAL_POS.x, TEAM2_AI_ALLY_INITIAL_POS.y, 2, false, "AI_AllyP2");
    state.allRunners.push(humanP2, aiAllyP2);
  } else {
    const npcEnemy1 = new Runner(TEAM2_NPC1_INITIAL_POS.x, TEAM2_NPC1_INITIAL_POS.y, 2, false, "Npc1", true);
    const npcEnemy2 = new Runner(TEAM2_NPC2_INITIAL_POS.x, TEAM2_NPC2_INITIAL_POS.y, 2, false, "Npc2", true);
    state.allRunners.push(npcEnemy1, npcEnemy2);
  }

  state.gameFlags[1] = new Flag(TEAM_CONFIG[1].initialFlagPos.x, TEAM_CONFIG[1].initialFlagPos.y, 1, TEAM_CONFIG[1].flagEmoji);
  state.gameFlags[2] = new Flag(TEAM_CONFIG[2].initialFlagPos.x, TEAM_CONFIG[2].initialFlagPos.y, 2, TEAM_CONFIG[2].flagEmoji);
  state.activeRunnerIndex = 0;
  state.teamScores = { 1: 0, 2: 0 };
  state.teamAreaFreezeUsed = { 1: false, 2: false };
  state.runnerActionHistory = {};
  state.currentTurnNumber = 1;
  state.currentTurnState = TURN_STATES.AWAITING_INPUT;
  state.queuedActionForCurrentRunner = null;
  state.allRunners.forEach((runner) => runner.resetToInitial());
  applySetupBarriers(state);
}

export function initializeDisplayState(app) {
  const { state } = app;
  state.allRunners = [];
  state.gameFlags = {};
  state.barriers = [];

  const humanPlayer = new Runner(TEAM1_HUMAN_INITIAL_POS.x, TEAM1_HUMAN_INITIAL_POS.y, 1, true, "HumanP1");
  const aiAlly = new Runner(TEAM1_AI_ALLY_INITIAL_POS.x, TEAM1_AI_ALLY_INITIAL_POS.y, 1, false, "AI_AllyP1");
  const npcEnemy1 = new Runner(TEAM2_ENEMY1_INITIAL_POS.x, TEAM2_ENEMY1_INITIAL_POS.y, 2, false, "Npc1", true);
  const npcEnemy2 = new Runner(TEAM2_ENEMY2_INITIAL_POS.x, TEAM2_ENEMY2_INITIAL_POS.y, 2, false, "Npc2", true);
  state.allRunners.push(humanPlayer, aiAlly, npcEnemy1, npcEnemy2);

  state.gameFlags[1] = new Flag(TEAM_CONFIG[1].initialFlagPos.x, TEAM_CONFIG[1].initialFlagPos.y, 1, TEAM_CONFIG[1].flagEmoji);
  state.gameFlags[2] = new Flag(TEAM_CONFIG[2].initialFlagPos.x, TEAM_CONFIG[2].initialFlagPos.y, 2, TEAM_CONFIG[2].flagEmoji);
  state.allRunners.forEach((runner) => runner.resetToInitial());
  applyDisplayRunnerOverrides(state, state.displayRunnerOverrides);
  applyDisplayFlagOverrides(state, state.displayFlagOverrides);
  applySetupBarriers(state);
  state.teamScores = { 1: 0, 2: 0 };
  state.teamAreaFreezeUsed = { 1: false, 2: false };
  state.runnerActionHistory = {};
  state.currentTurnNumber = 1;
  state.activeRunnerIndex = 0;
  state.currentTurnState = TURN_STATES.SETUP_DISPLAY;
  state.mainGameState = MAIN_GAME_STATES.SETUP;
  state.queuedActionForCurrentRunner = null;
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
}

export function startGame(app) {
  initializeMatch(app);
  app.state.mainGameState = MAIN_GAME_STATES.RUNNING;
}

export function resetGameToSetup(app) {
  initializeDisplayState(app);
}
