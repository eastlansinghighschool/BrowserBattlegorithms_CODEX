import { TURN_STATES, MAIN_GAME_STATES } from "../config/constants.js";
import { getTeamBaseCellType } from "./teams.js";

export function checkForFlagPickup(state, runner) {
  if (runner.hasEnemyFlag) {
    return;
  }
  const enemyTeamId = runner.team === 1 ? 2 : 1;
  const enemyFlag = state.gameFlags[enemyTeamId];
  if (enemyFlag && !enemyFlag.carriedByRunnerId) {
    if (runner.gridX === enemyFlag.gridX && runner.gridY === enemyFlag.gridY) {
      runner.pickupFlag(enemyFlag);
    }
  }
}

export function checkForScoring(state, runner) {
  if (!runner.hasEnemyFlag) {
    return false;
  }

  const runnerBaseCellType = getTeamBaseCellType(state, runner.team);
  const currentCellType = state.gameMap[runner.gridY][runner.gridX];
  if (currentCellType !== runnerBaseCellType) {
    return false;
  }

  const enemyTeamId = runner.team === 1 ? 2 : 1;
  const scoredFlag = state.gameFlags[enemyTeamId];
  if (scoredFlag && scoredFlag.carriedByRunnerId === runner.id) {
    runner.dropFlag(scoredFlag);
    scoredFlag.resetToInitialPosition();
  } else {
    runner.hasEnemyFlag = false;
  }

  scorePointForTeam(state, runner.team);
  return true;
}

export function scorePointForTeam(state, teamId) {
  state.teamScores[teamId] += 1;
  if (state.teamScores[teamId] >= state.pointsToWin) {
    state.currentTurnState = TURN_STATES.GAME_OVER;
    state.mainGameState = MAIN_GAME_STATES.GAME_OVER;
  }
}
