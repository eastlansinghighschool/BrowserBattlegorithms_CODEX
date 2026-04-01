import { CELL_SIZE, GAME_VIEW_MODES, POINTS_TO_WIN } from "../config/constants.js";

export function drawFlags(p, state) {
  for (const teamId of Object.keys(state.gameFlags)) {
    const flag = state.gameFlags[teamId];
    if (flag && !flag.carriedByRunnerId) {
      flag.display(p);
    }
  }
}

export function drawBarriers(p, state) {
  for (const barrier of state.barriers) {
    barrier.display(p);
  }
}

export function drawRunners(p, state) {
  const runnersToDisplay = [...state.allRunners].sort((a, b) => {
    if (a.gridY !== b.gridY) {
      return a.gridY - b.gridY;
    }
    if (a.gridX !== b.gridX) {
      return a.gridX - b.gridX;
    }
    const aIsHomeSide = (a.team === 1 && a.gridX < state.gameMap[0].length / 2) || (a.team === 2 && a.gridX >= state.gameMap[0].length / 2);
    const bIsHomeSide = (b.team === 1 && b.gridX < state.gameMap[0].length / 2) || (b.team === 2 && b.gridX >= state.gameMap[0].length / 2);
    if (aIsHomeSide && !bIsHomeSide) return 1;
    if (!aIsHomeSide && bIsHomeSide) return -1;
    return 0;
  });

  for (const runner of runnersToDisplay) {
    runner.display(p);
  }
}

export function drawGameOverOverlay(p, state) {
  if (
    state.currentTurnState !== "GAME_OVER" ||
    state.mainGameState === "SETUP" ||
    state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS
  ) {
    return;
  }
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, p.width, p.height);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  const winner = state.teamScores[1] >= POINTS_TO_WIN ? 1 : (state.teamScores[2] >= POINTS_TO_WIN ? 2 : 0);
  p.text(winner ? `Team ${winner} Wins!` : "Match Complete", p.width / 2, p.height / 2 - 20);
  p.textSize(16);
  p.text("Press Reset Game to try another match.", p.width / 2, p.height / 2 + 20);
}
