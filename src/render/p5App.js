import p5 from "p5";
import { CELL_SIZE, COLS, FPS, MAIN_GAME_STATES, ROWS, TURN_STATES } from "../config/constants.js";
import { processTurnActions } from "../core/turnEngine.js";
import { getCurrentLevel } from "../core/levels.js";
import { drawGrid, drawMapElements } from "./drawBoard.js";
import { drawBarriers, drawFlags, drawGameOverOverlay, drawRunners } from "./drawEntities.js";
import { drawActiveRunnerGlow } from "./effects.js";
import { handleKeyInput } from "../ui/controls.js";

function drawLevelGoal(p, app) {
  const level = getCurrentLevel(app);
  if (!level || app.state.currentModeView !== "GUIDED_LEVELS") {
    return;
  }

  let targetX = null;
  let targetY = null;
  if (level.winCondition.type === "runner_reaches_cell") {
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
  }

  if (targetX === null || targetY === null) {
    return;
  }

  p.push();
  p.noFill();
  p.stroke(0, 140, 255);
  p.strokeWeight(4);
  p.rect(targetX * CELL_SIZE + 4, targetY * CELL_SIZE + 4, CELL_SIZE - 8, CELL_SIZE - 8, 10);
  p.strokeWeight(2);
  p.circle(targetX * CELL_SIZE + CELL_SIZE / 2, targetY * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE * 0.45);
  p.pop();
}

export function initializeP5App(app) {
  app.p5Instance = new p5((p) => {
    p.setup = () => {
      const canvas = p.createCanvas(COLS * CELL_SIZE, ROWS * CELL_SIZE);
      canvas.parent("canvas-container");
      p.frameRate(FPS);
    };

    p.draw = () => {
      p.background(220);
      if (app.state.mainGameState === MAIN_GAME_STATES.RUNNING && app.state.currentTurnState !== TURN_STATES.GAME_OVER) {
        processTurnActions(app, p);
      }

      for (const teamId of Object.keys(app.state.gameFlags)) {
        const flag = app.state.gameFlags[teamId];
        if (flag && flag.carriedByRunnerId) {
          const carrier = app.state.allRunners.find((runner) => runner.id === flag.carriedByRunnerId);
          if (carrier) {
            flag.gridX = carrier.gridX;
            flag.gridY = carrier.gridY;
          }
        }
      }

      drawMapElements(p, app.state.gameMap);
      drawGrid(p);
      drawLevelGoal(p, app);
      drawActiveRunnerGlow(p, app.state);
      drawFlags(p, app.state);
      drawBarriers(p, app.state);
      drawRunners(p, app.state);
      drawGameOverOverlay(p, app.state);
    };

    p.keyPressed = () => {
      handleKeyInput(app, p.key);
      return false;
    };
  });
}
