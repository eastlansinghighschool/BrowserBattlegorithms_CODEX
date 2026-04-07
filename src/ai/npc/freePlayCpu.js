import {
  AI_ACTION_TYPES,
  AREA_FREEZE_RADIUS,
  MOVE_TOWARD_TARGETS,
  NPC_BEHAVIORS
} from "../../config/constants.js";
import {
  getBarrierAtCell,
  getForwardCell,
  isCellBlockedForBarrierPlacement,
  isCellBlockedForRunner,
  resolveMoveTowardTarget,
  translateActionDecision
} from "../../core/movement.js";
import { getEnemyTeamId, getTeamConfig } from "../../core/teams.js";
import { calculateMoveTowardsTarget } from "./pathing.js";

function getRandomFn(state) {
  return typeof state.randomFn === "function" ? state.randomFn : Math.random;
}

function getRandomItem(items, randomFn) {
  if (!items.length) {
    return null;
  }
  const index = Math.max(0, Math.min(items.length - 1, Math.floor(randomFn() * items.length)));
  return items[index];
}

function getLegalActionCandidates(runner, state) {
  const candidates = [];
  const movementDecisions = [
    { type: AI_ACTION_TYPES.MOVE_FORWARD },
    { type: AI_ACTION_TYPES.MOVE_BACKWARD },
    { type: AI_ACTION_TYPES.MOVE_UP_SCREEN },
    { type: AI_ACTION_TYPES.MOVE_DOWN_SCREEN }
  ];

  for (const decision of movementDecisions) {
    const translated = translateActionDecision(runner, decision, state);
    if (!isCellBlockedForRunner(translated.targetGridX, translated.targetGridY, state.barriers, state.gameMap, state, runner)) {
      candidates.push(decision);
    }
  }

  if (runner.canJump) {
    const jumpCell = getForwardCell(runner, 2);
    if (!isCellBlockedForRunner(jumpCell.x, jumpCell.y, state.barriers, state.gameMap, state, runner)) {
      candidates.push({ type: AI_ACTION_TYPES.JUMP_FORWARD });
    }
  }

  if (runner.canPlaceBarrier && !runner.activeBarrierId) {
    const forwardCell = getForwardCell(runner, 1);
    if (!isCellBlockedForBarrierPlacement(forwardCell.x, forwardCell.y, state.barriers, state.gameMap, state)) {
      candidates.push({ type: AI_ACTION_TYPES.PLACE_BARRIER_FORWARD });
    }
  }

  if (!state.teamAreaFreezeUsed?.[runner.team]) {
    candidates.push({ type: AI_ACTION_TYPES.FREEZE_OPPONENTS });
  }

  candidates.push({ type: AI_ACTION_TYPES.STAY_STILL });
  return candidates;
}

function getEnemyFlagCarrier(state, teamId) {
  return state.allRunners.find((runner) => runner.team === teamId && runner.hasEnemyFlag) || null;
}

function getNearestEnemyOnMySide(runner, state) {
  const myTeam = getTeamConfig(state, runner.team);
  const enemies = state.allRunners
    .filter((candidate) => candidate.team !== runner.team && !candidate.isFrozen)
    .filter((candidate) => myTeam.homeSide === "left" ? candidate.gridX < state.gameMap[0].length / 2 : candidate.gridX >= state.gameMap[0].length / 2)
    .sort((left, right) => {
      const leftDistance = Math.abs(left.gridX - runner.gridX) + Math.abs(left.gridY - runner.gridY);
      const rightDistance = Math.abs(right.gridX - runner.gridX) + Math.abs(right.gridY - runner.gridY);
      return leftDistance - rightDistance || left.id.localeCompare(right.id);
    });
  return enemies[0] || null;
}

function getMidfieldDefenseCell(runner, state) {
  const homeSide = getTeamConfig(state, runner.team)?.homeSide || "left";
  const anchorX = homeSide === "left" ? Math.floor(state.gameMap[0].length / 2) - 2 : Math.floor(state.gameMap[0].length / 2) + 1;
  return { x: anchorX, y: runner.initialGridY };
}

function getRandomLegalFallbackMove(runner, state, target) {
  const randomFn = getRandomFn(state);
  const options = [
    { type: AI_ACTION_TYPES.MOVE_FORWARD },
    { type: AI_ACTION_TYPES.MOVE_BACKWARD },
    { type: AI_ACTION_TYPES.MOVE_UP_SCREEN },
    { type: AI_ACTION_TYPES.MOVE_DOWN_SCREEN }
  ]
    .map((decision) => translateActionDecision(runner, decision, state))
    .filter((translated) => !isCellBlockedForRunner(translated.targetGridX, translated.targetGridY, state.barriers, state.gameMap, state, runner))
    .sort((left, right) => {
      if (!target) {
        return 0;
      }
      const leftDistance = Math.abs(target.x - left.targetGridX) + Math.abs(target.y - left.targetGridY);
      const rightDistance = Math.abs(target.x - right.targetGridX) + Math.abs(target.y - right.targetGridY);
      return leftDistance - rightDistance;
    });

  const bestDistance = target && options.length
    ? Math.abs(target.x - options[0].targetGridX) + Math.abs(target.y - options[0].targetGridY)
    : null;
  const shortlisted = bestDistance === null
    ? options
    : options.filter((option) => Math.abs(target.x - option.targetGridX) + Math.abs(target.y - option.targetGridY) === bestDistance);
  return getRandomItem(shortlisted, randomFn) || { actionType: AI_ACTION_TYPES.STAY_STILL };
}

function getAttackerAction(runner, state) {
  const moveTarget = runner.hasEnemyFlag
    ? resolveMoveTowardTarget(state, runner, MOVE_TOWARD_TARGETS.MY_BASE)
    : resolveMoveTowardTarget(state, runner, MOVE_TOWARD_TARGETS.ENEMY_FLAG);
  const preferred = runner.hasEnemyFlag
    ? calculateMoveTowardsTarget(runner, moveTarget?.x ?? runner.gridX, moveTarget?.y ?? runner.gridY, state.barriers, state.gameMap, state)
    : calculateMoveTowardsTarget(
        runner,
        state.gameFlags[getEnemyTeamId(runner.team)]?.gridX ?? runner.gridX,
        state.gameFlags[getEnemyTeamId(runner.team)]?.gridY ?? runner.gridY,
        state.barriers,
        state.gameMap,
        state
      );

  if (preferred.actionType !== AI_ACTION_TYPES.STAY_STILL) {
    return preferred;
  }

  const forwardCell = getForwardCell(runner, 1);
  if (getBarrierAtCell(forwardCell.x, forwardCell.y, state.barriers)) {
    return { actionType: AI_ACTION_TYPES.STAY_STILL };
  }

  const fallbackMove = getRandomLegalFallbackMove(runner, state, moveTarget);
  return fallbackMove;
}

function getDefenderAction(runner, state) {
  const enemyCarrier = getEnemyFlagCarrier(state, getEnemyTeamId(runner.team));
  if (enemyCarrier) {
    const carrierDistance = Math.abs(enemyCarrier.gridX - runner.gridX) + Math.abs(enemyCarrier.gridY - runner.gridY);
    if (!state.teamAreaFreezeUsed?.[runner.team] && carrierDistance <= AREA_FREEZE_RADIUS) {
      return { actionType: AI_ACTION_TYPES.FREEZE_OPPONENTS };
    }
    return calculateMoveTowardsTarget(runner, enemyCarrier.gridX, enemyCarrier.gridY, state.barriers, state.gameMap, state);
  }

  const nearbyIntruder = getNearestEnemyOnMySide(runner, state);
  if (nearbyIntruder) {
    const intruderDistance = Math.abs(nearbyIntruder.gridX - runner.gridX) + Math.abs(nearbyIntruder.gridY - runner.gridY);
    if (!state.teamAreaFreezeUsed?.[runner.team] && intruderDistance <= AREA_FREEZE_RADIUS) {
      return { actionType: AI_ACTION_TYPES.FREEZE_OPPONENTS };
    }
    return calculateMoveTowardsTarget(runner, nearbyIntruder.gridX, nearbyIntruder.gridY, state.barriers, state.gameMap, state);
  }

  const defenseCell = getMidfieldDefenseCell(runner, state);
  if (runner.gridX !== defenseCell.x || runner.gridY !== defenseCell.y) {
    return calculateMoveTowardsTarget(runner, defenseCell.x, defenseCell.y, state.barriers, state.gameMap, state);
  }

  const barrierCell = getForwardCell(runner, 1);
  if (
    runner.canPlaceBarrier &&
    !runner.activeBarrierId &&
    !isCellBlockedForBarrierPlacement(barrierCell.x, barrierCell.y, state.barriers, state.gameMap, state)
  ) {
    return { actionType: AI_ACTION_TYPES.PLACE_BARRIER_FORWARD };
  }

  return { actionType: AI_ACTION_TYPES.STAY_STILL };
}

export function calculateFreePlayCpuAction(runner, state) {
  if (runner.cpuBehavior === NPC_BEHAVIORS.FREE_PLAY_EASY) {
    const randomFn = getRandomFn(state);
    const choice = getRandomItem(getLegalActionCandidates(runner, state), randomFn);
    return choice || { type: AI_ACTION_TYPES.STAY_STILL };
  }

  if (runner.cpuBehavior === NPC_BEHAVIORS.FREE_PLAY_TACTICAL_ATTACKER) {
    return getAttackerAction(runner, state);
  }

  if (runner.cpuBehavior === NPC_BEHAVIORS.FREE_PLAY_TACTICAL_DEFENDER) {
    return getDefenderAction(runner, state);
  }

  return { actionType: AI_ACTION_TYPES.STAY_STILL };
}
