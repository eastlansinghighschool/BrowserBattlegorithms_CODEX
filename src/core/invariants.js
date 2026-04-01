export function checkInvariants(state) {
  const runnerBarrierOwners = new Set();

  for (const runner of state.allRunners) {
    if (runner.gridX < 0 || runner.gridY < 0) {
      return false;
    }
  }

  for (const barrier of state.barriers) {
    if (state.gameMap[barrier.gridY]?.[barrier.gridX] === 1) {
      return false;
    }
    const ownerKey = barrier.ownerRunnerId;
    if (runnerBarrierOwners.has(ownerKey)) {
      return false;
    }
    runnerBarrierOwners.add(ownerKey);
  }

  for (const teamId of Object.keys(state.gameFlags)) {
    const flag = state.gameFlags[teamId];
    if (flag.isAtBase && flag.carriedByRunnerId) {
      return false;
    }
  }

  return true;
}
