import { COLS, FROZEN_DURATION_TURNS } from "../config/constants.js";

export function resolveCollision(state, attacker, defenderInCell, collisionX, collisionY, attackerOriginCell) {
  const mapSideDefenderTeam = collisionX < COLS / 2 ? 1 : 2;
  let winner;
  let loser;

  if (attacker.hasEnemyFlag && attacker.team !== mapSideDefenderTeam) {
    winner = defenderInCell;
    loser = attacker;
  } else if (defenderInCell.hasEnemyFlag && defenderInCell.team !== mapSideDefenderTeam) {
    winner = attacker;
    loser = defenderInCell;
  } else if (attacker.team === mapSideDefenderTeam) {
    winner = attacker;
    loser = defenderInCell;
  } else if (defenderInCell.team === mapSideDefenderTeam) {
    winner = defenderInCell;
    loser = attacker;
  } else {
    winner = defenderInCell;
    loser = attacker;
  }

  if (!loser.isGracePeriod) {
    loser.setFrozen(FROZEN_DURATION_TURNS);
  }

  if (loser.hasEnemyFlag) {
    const enemyTeamOfLoser = loser.team === 1 ? 2 : 1;
    const flagCarriedByLoser = state.gameFlags[enemyTeamOfLoser];
    if (flagCarriedByLoser) {
      loser.dropFlag(flagCarriedByLoser);
      flagCarriedByLoser.resetToInitialPosition();
    }
  }

  const loserCell = {
    x: attackerOriginCell?.x ?? attacker.gridX,
    y: attackerOriginCell?.y ?? attacker.gridY
  };

  return {
    winner,
    loser,
    loserCell,
    attackerWon: winner === attacker,
    loserAvoidedFreezeDueToGrace: loser.isGracePeriod && !loser.isFrozen
  };
}
