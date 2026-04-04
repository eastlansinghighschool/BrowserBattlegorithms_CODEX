export function checkInvariants(state) {
  const runnerBarrierOwners = new Set();
  const runnerCells = new Set();
  const teamDirections = Object.values(state.teams || {}).map((team) => team?.playDirection);

  if (
    teamDirections.length === 2 &&
    (teamDirections.some((direction) => direction !== 1 && direction !== -1) || teamDirections[0] === teamDirections[1])
  ) {
    return false;
  }

  for (const runner of state.allRunners) {
    if (runner.gridX < 0 || runner.gridY < 0) {
      return false;
    }

    const runnerCellKey = `${runner.gridX},${runner.gridY}`;
    if (runnerCells.has(runnerCellKey)) {
      return false;
    }
    runnerCells.add(runnerCellKey);

    const runnerTeamDirection = state.teams?.[runner.team]?.playDirection;
    if (runnerTeamDirection !== undefined && runner.playDirection !== runnerTeamDirection) {
      return false;
    }

    const ownFlag = state.gameFlags?.[runner.team];
    if (
      ownFlag &&
      ownFlag.isAtBase &&
      !ownFlag.carriedByRunnerId &&
      runner.gridX === ownFlag.gridX &&
      runner.gridY === ownFlag.gridY
    ) {
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
    if (flag.carriedByRunnerId) {
      const carrier = state.allRunners.find((runner) => runner.id === flag.carriedByRunnerId);
      if (!carrier || !carrier.hasEnemyFlag) {
        return false;
      }
    }
  }

  return true;
}
