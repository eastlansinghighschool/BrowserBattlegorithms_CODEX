import {
  CELL_SIZE,
  GLOW_DIAMETER_FACTOR,
  GLOW_PULSE_MAX_ALPHA,
  GLOW_PULSE_MIN_ALPHA,
  GLOW_PULSE_SPEED,
  GLOW_SOLID_ALPHA_ANIMATING,
  GLOW_SOLID_ALPHA_FROZEN_TURN,
  GLOW_STROKE_WEIGHT,
  TEAM_CONFIG
} from "../config/constants.js";

export function drawActiveRunnerGlow(p, state) {
  if (state.mainGameState !== "RUNNING" || !state.allRunners.length || state.activeRunnerIndex >= state.allRunners.length) {
    return;
  }

  const runnerToGlow = state.allRunners[state.activeRunnerIndex];
  if (!runnerToGlow || !TEAM_CONFIG[runnerToGlow.team]) {
    return;
  }

  const teamGlowConfig = TEAM_CONFIG[runnerToGlow.team];
  const [r, g, b] = teamGlowConfig.glowColorFill;
  const [strokeR, strokeG, strokeB] = teamGlowConfig.glowColorStroke;
  let showGlow = false;
  let alpha = GLOW_SOLID_ALPHA_ANIMATING;
  let isPulsing = false;

  if (state.currentTurnState === "AWAITING_INPUT") {
    if (runnerToGlow.isHumanControlled && !runnerToGlow.isFrozen) {
      showGlow = true;
      isPulsing = true;
    } else if (runnerToGlow.isFrozen) {
      showGlow = true;
      alpha = GLOW_SOLID_ALPHA_FROZEN_TURN;
    }
  } else if (state.currentTurnState === "ANIMATING" && (runnerToGlow.isMoving || runnerToGlow.isBouncing)) {
    showGlow = true;
  }

  if (!showGlow) {
    return;
  }

  p.push();
  const glowDiameter = CELL_SIZE * GLOW_DIAMETER_FACTOR;
  const centerX = runnerToGlow.pixelX + CELL_SIZE / 2;
  const centerY = runnerToGlow.pixelY + CELL_SIZE / 2;
  if (isPulsing) {
    const pulseAlpha = p.map(p.sin(p.frameCount * GLOW_PULSE_SPEED), -1, 1, GLOW_PULSE_MIN_ALPHA, GLOW_PULSE_MAX_ALPHA);
    p.fill(r, g, b, pulseAlpha);
  } else {
    p.fill(r, g, b, alpha);
  }
  p.stroke(strokeR, strokeG, strokeB);
  p.strokeWeight(GLOW_STROKE_WEIGHT);
  p.ellipse(centerX, centerY, glowDiameter, glowDiameter);
  p.pop();
}
