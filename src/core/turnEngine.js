import {
  ACTIVE_TEAM2_NPC_BEHAVIOR,
  AI_ACTION_TYPES,
  GAME_VIEW_MODES,
  MAIN_GAME_STATES,
  NPC_BEHAVIORS,
  TURN_STATES
} from "../config/constants.js";
import { createQueuedHumanAction } from "./actions.js";
import { resolveCollision } from "./collisions.js";
import {
  getBarrierAtCell,
  getForwardCell,
  getRunnerAtCell,
  isCellBlockedByImpassables,
  translateActionDecision
} from "./movement.js";
import { checkForFlagPickup, checkForScoring } from "./scoring.js";
import { resetRound } from "./setup.js";
import { calculateNpcType1Action } from "../ai/npc/npcType1.js";
import { calculateNpcType2Action } from "../ai/npc/npcType2.js";
import { getAIAllyAction } from "../ai/blockly/interpreter.js";
import { Barrier } from "../entities/Barrier.js";
import { evaluateLevelProgress } from "./levels.js";

function sync(app) {
  if (typeof app.syncUi === "function") {
    app.syncUi();
  }
}

export function handlePlayerInput(app, runner, actionData) {
  const { state } = app;
  if (
    runner !== state.allRunners[state.activeRunnerIndex] ||
    !runner.isHumanControlled ||
    state.currentTurnState !== TURN_STATES.AWAITING_INPUT ||
    runner.isMoving ||
    runner.isBouncing
  ) {
    return;
  }

  if (actionData.type === AI_ACTION_TYPES.JUMP_FORWARD && !runner.canJump) {
    return;
  }
  if (actionData.type === AI_ACTION_TYPES.PLACE_BARRIER_FORWARD && (!runner.canPlaceBarrier || runner.activeBarrierId)) {
    return;
  }

  state.queuedActionForCurrentRunner = createQueuedHumanAction(runner, actionData);
  state.currentTurnState = TURN_STATES.PROCESSING_ACTION;
}

function planActionForActiveRunner(app, runner) {
  const { state } = app;
  if (runner.isNPC) {
    const decision = ACTIVE_TEAM2_NPC_BEHAVIOR === NPC_BEHAVIORS.SIMPLE_TARGET
      ? calculateNpcType1Action(runner, state)
      : calculateNpcType2Action(runner, state);
    state.queuedActionForCurrentRunner = translateActionDecision(runner, decision);
    state.currentTurnState = TURN_STATES.PROCESSING_ACTION;
    return;
  }

  let aiDecision;
  if (runner.team === 1) {
    aiDecision = getAIAllyAction(app, runner);
  } else {
    aiDecision = { type: AI_ACTION_TYPES.MOVE_FORWARD };
  }

  let queued = translateActionDecision(runner, aiDecision);
  if (queued.actionType === AI_ACTION_TYPES.JUMP_FORWARD && !runner.canJump) {
    queued = translateActionDecision(runner, { type: AI_ACTION_TYPES.STAY_STILL });
  }
  if (queued.actionType === AI_ACTION_TYPES.PLACE_BARRIER_FORWARD && (!runner.canPlaceBarrier || runner.activeBarrierId)) {
    queued = translateActionDecision(runner, { type: AI_ACTION_TYPES.STAY_STILL });
  }

  state.queuedActionForCurrentRunner = queued;
  state.currentTurnState = TURN_STATES.PROCESSING_ACTION;
}

function advanceToNextRunner(state) {
  const previousActiveRunnerIndex = state.activeRunnerIndex;
  state.activeRunnerIndex = (state.activeRunnerIndex + 1) % state.allRunners.length;
  state.currentTurnState = TURN_STATES.AWAITING_INPUT;

  if (state.activeRunnerIndex === 0 && previousActiveRunnerIndex === state.allRunners.length - 1) {
    state.currentTurnNumber += 1;
  }
}

function handleFrozenRunnerTurn(app, runner) {
  runner.frozenTurnsRemaining -= 1;
  if (runner.frozenTurnsRemaining <= 0) {
    runner.isFrozen = false;
    runner.isGracePeriod = true;
  }
  handleActionCompletion(app, runner);
}

function handleActionCompletion(app, completedRunner) {
  const { state } = app;
  if (completedRunner.isGracePeriod) {
    completedRunner.isGracePeriod = false;
  }

  if (!completedRunner.isBouncing) {
    checkForFlagPickup(state, completedRunner);
    const levelResult = evaluateLevelProgress(app);
    if (levelResult) {
      sync(app);
      return;
    }

    if (completedRunner.hasEnemyFlag && checkForScoring(state, completedRunner)) {
      const postScoreLevelResult = evaluateLevelProgress(app);
      if (postScoreLevelResult) {
        sync(app);
        return;
      }
      if (state.currentTurnState === TURN_STATES.GAME_OVER) {
        state.mainGameState = MAIN_GAME_STATES.GAME_OVER;
        sync(app);
        return;
      }
      resetRound(state);
      sync(app);
      return;
    }
  }

  if (state.currentTurnState === TURN_STATES.GAME_OVER) {
    state.mainGameState = MAIN_GAME_STATES.GAME_OVER;
    sync(app);
    return;
  }

  const endOfTurnLevelResult = evaluateLevelProgress(app);
  if (endOfTurnLevelResult) {
    sync(app);
    return;
  }

  advanceToNextRunner(state);
  const advancedLevelResult = evaluateLevelProgress(app);
  if (advancedLevelResult) {
    sync(app);
    return;
  }
  sync(app);
}

function executeQueuedAction(app, actionRunner, queuedAction) {
  const { state } = app;
  const actionType = queuedAction.actionType;
  let targetGridX = queuedAction.targetGridX;
  let targetGridY = queuedAction.targetGridY;
  let actionResolvedAndAnimating = false;
  let actionCompletedImmediately = false;
  let performRegularMoveOrJump = false;

  switch (actionType) {
    case "MOVE":
    case AI_ACTION_TYPES.MOVE_FORWARD:
    case AI_ACTION_TYPES.MOVE_BACKWARD:
    case AI_ACTION_TYPES.MOVE_UP_SCREEN:
    case AI_ACTION_TYPES.MOVE_DOWN_SCREEN:
    case AI_ACTION_TYPES.JUMP_FORWARD:
      performRegularMoveOrJump = true;
      break;
    case AI_ACTION_TYPES.STAY_STILL: {
      const forwardCell = getForwardCell(actionRunner, 1);
      const barrierInFront = getBarrierAtCell(forwardCell.x, forwardCell.y, state.barriers);
      if (barrierInFront) {
        state.barriers = state.barriers.filter((barrier) => barrier.id !== barrierInFront.id);
        const ownerRunner = state.allRunners.find((runner) => runner.id === barrierInFront.ownerRunnerId);
        if (ownerRunner) {
          ownerRunner.canPlaceBarrier = true;
          ownerRunner.activeBarrierId = null;
        }
      }
      actionCompletedImmediately = true;
      break;
    }
    case AI_ACTION_TYPES.PLACE_BARRIER_FORWARD: {
      const forwardCell = getForwardCell(actionRunner, 1);
      targetGridX = forwardCell.x;
      targetGridY = forwardCell.y;
      if (
        actionRunner.canPlaceBarrier &&
        !actionRunner.activeBarrierId &&
        !isCellBlockedByImpassables(targetGridX, targetGridY, state.barriers, state.gameMap) &&
        !getRunnerAtCell(targetGridX, targetGridY, state.allRunners)
      ) {
        const barrier = new Barrier(targetGridX, targetGridY, actionRunner.id);
        state.barriers.push(barrier);
        actionRunner.activeBarrierId = barrier.id;
        actionRunner.canPlaceBarrier = false;
      }
      actionCompletedImmediately = true;
      break;
    }
    default:
      actionCompletedImmediately = true;
      break;
  }

  if (performRegularMoveOrJump) {
    const isJump = actionType === AI_ACTION_TYPES.JUMP_FORWARD;
    if (isJump) {
      if (!actionRunner.canJump) {
        actionRunner.startBounceAnimation(actionRunner.gridX + actionRunner.playDirection, actionRunner.gridY);
        actionResolvedAndAnimating = true;
      } else {
        targetGridX = actionRunner.gridX + actionRunner.playDirection * 2;
        targetGridY = actionRunner.gridY;
      }
    }

    if (!actionResolvedAndAnimating) {
      if (isCellBlockedByImpassables(targetGridX, targetGridY, state.barriers, state.gameMap)) {
        if (isJump) {
          actionRunner.canJump = false;
        }
        actionRunner.startBounceAnimation(targetGridX, targetGridY);
        actionResolvedAndAnimating = true;
      } else {
        const runnerInTargetCell = getRunnerAtCell(targetGridX, targetGridY, state.allRunners, actionRunner.id);
        if (runnerInTargetCell) {
          if (runnerInTargetCell.team === actionRunner.team) {
            if (isJump) {
              actionRunner.canJump = false;
            }
            actionRunner.startBounceAnimation(targetGridX, targetGridY);
            actionResolvedAndAnimating = true;
          } else if (runnerInTargetCell.isFrozen) {
            if (isJump) {
              actionRunner.startJumpAnimation(targetGridX, targetGridY);
            } else {
              actionRunner.startMoveAnimation(targetGridX, targetGridY);
            }
            actionResolvedAndAnimating = true;
          } else {
            resolveCollision(state, actionRunner, runnerInTargetCell, targetGridX, targetGridY);
            actionRunner.gridX = targetGridX;
            actionRunner.gridY = targetGridY;
            actionRunner.pixelX = actionRunner.gridX * 50;
            actionRunner.pixelY = actionRunner.gridY * 50;
            actionRunner.isMoving = false;
            actionRunner.isBouncing = false;
            if (isJump) {
              actionRunner.canJump = false;
            }
            actionCompletedImmediately = true;
          }
        } else {
          if (isJump) {
            actionRunner.startJumpAnimation(targetGridX, targetGridY);
          } else {
            actionRunner.startMoveAnimation(targetGridX, targetGridY);
          }
          actionResolvedAndAnimating = true;
        }
      }
    }
  }

  state.queuedActionForCurrentRunner = null;
  if (actionCompletedImmediately) {
    handleActionCompletion(app, actionRunner);
  } else if (actionResolvedAndAnimating) {
    state.currentTurnState = TURN_STATES.ANIMATING;
  } else {
    handleActionCompletion(app, actionRunner);
  }
}

export function processTurnActions(app, p) {
  const { state } = app;
  if (state.mainGameState !== MAIN_GAME_STATES.RUNNING || state.currentTurnState === TURN_STATES.GAME_OVER) {
    return;
  }

  const runner = state.allRunners[state.activeRunnerIndex];
  if (!runner) {
    return;
  }

  if (state.currentTurnState === TURN_STATES.AWAITING_INPUT) {
    if (runner.isFrozen) {
      handleFrozenRunnerTurn(app, runner);
      return;
    }

    if (runner.isHumanControlled) {
      if (state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS && state.autoStayHumanRunnerIds.includes(runner.id)) {
        handlePlayerInput(app, runner, { type: AI_ACTION_TYPES.STAY_STILL });
      }
      return;
    }

    planActionForActiveRunner(app, runner);
  }

  if (state.currentTurnState === TURN_STATES.PROCESSING_ACTION && state.queuedActionForCurrentRunner) {
    if (state.queuedActionForCurrentRunner.runner === runner) {
      executeQueuedAction(app, runner, state.queuedActionForCurrentRunner);
    } else {
      state.queuedActionForCurrentRunner = null;
      state.currentTurnState = TURN_STATES.AWAITING_INPUT;
    }
  }

  if (state.currentTurnState === TURN_STATES.ANIMATING && (runner.isMoving || runner.isBouncing)) {
    const animationComplete = runner.updateAnimation(state.animationSpeedFactor, p);
    if (animationComplete) {
      handleActionCompletion(app, runner);
    }
  }
}
