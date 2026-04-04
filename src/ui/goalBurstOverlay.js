import { CELL_SIZE } from "../config/constants.js";
import { getTeamGlowColors } from "../core/teams.js";

let clearBurstTimerId = null;

function buildParticleMarkup() {
  return Array.from({ length: 10 }, (_, index) => {
    const angle = (360 / 10) * index;
    return `<span class="goal-burst-particle" style="--particle-angle:${angle}deg;"></span>`;
  }).join("");
}

function clearOverlay(root) {
  if (root) {
    root.innerHTML = "";
  }
}

export function bindGoalBurstOverlay(app) {
  const rerenderIfActive = () => {
    if (app.state.goalBurstEffect) {
      renderGoalBurstOverlay(app);
    }
  };

  window.addEventListener("resize", rerenderIfActive);
  window.addEventListener("scroll", rerenderIfActive, { passive: true });
}

export function renderGoalBurstOverlay(app) {
  const root = document.getElementById("goal-burst-overlay");
  if (!root) {
    return;
  }

  const effect = app.state.goalBurstEffect;
  if (!effect) {
    root.removeAttribute("data-burst-key");
    if (clearBurstTimerId) {
      clearTimeout(clearBurstTimerId);
      clearBurstTimerId = null;
    }
    clearOverlay(root);
    return;
  }

  const canvasRect = document.getElementById("canvas-container")?.getBoundingClientRect();
  if (!canvasRect) {
    return;
  }

  const centerX = canvasRect.left + effect.cellX * CELL_SIZE + CELL_SIZE / 2;
  const centerY = canvasRect.top + effect.cellY * CELL_SIZE + CELL_SIZE / 2;
  const teamGlowColors = getTeamGlowColors(app.state, effect.teamId) || getTeamGlowColors(app.state, 1);
  const [fillR, fillG, fillB] = teamGlowColors.fill;
  const [strokeR, strokeG, strokeB] = teamGlowColors.stroke;

  if (root.dataset.burstKey === effect.burstKey && root.firstElementChild) {
    root.firstElementChild.style.setProperty("--burst-x", `${centerX}px`);
    root.firstElementChild.style.setProperty("--burst-y", `${centerY}px`);
    return;
  }

  root.dataset.burstKey = effect.burstKey;
  root.innerHTML = `
    <div
      class="goal-burst"
      data-team-id="${effect.teamId}"
      style="
        --burst-x:${centerX}px;
        --burst-y:${centerY}px;
        --burst-fill-r:${fillR};
        --burst-fill-g:${fillG};
        --burst-fill-b:${fillB};
        --burst-stroke-r:${strokeR};
        --burst-stroke-g:${strokeG};
        --burst-stroke-b:${strokeB};
        --burst-duration:${effect.durationMs}ms;
      "
    >
      <div class="goal-burst-halo"></div>
      <div class="goal-burst-ring goal-burst-ring-outer"></div>
      <div class="goal-burst-ring goal-burst-ring-mid"></div>
      <div class="goal-burst-ring goal-burst-ring-inner"></div>
      ${buildParticleMarkup()}
    </div>
  `;

  if (clearBurstTimerId) {
    clearTimeout(clearBurstTimerId);
  }
  clearBurstTimerId = window.setTimeout(() => {
    if (app.state.goalBurstEffect?.burstKey === effect.burstKey) {
      app.state.goalBurstEffect = null;
      app.syncUi();
    }
  }, effect.durationMs);
}
