import { FREE_PLAY_MODES, GAME_VIEW_MODES, P1_KEY_BINDINGS, P2_KEY_BINDINGS } from "../config/constants.js";
import { getActiveBlocklyProgramLabel } from "../ai/blockly/workspace.js";

function escapeHtml(value) {
  return `${value || ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderBlocklyPanel(app) {
  const title = document.getElementById("blocklyPanelTitle");
  const tabs = document.getElementById("blockly-program-tabs");
  const summary = document.getElementById("blockly-program-summary");

  if (!title || !tabs || !summary) {
    return;
  }

  if (app.state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS) {
    title.textContent = "AI Ally Program";
    tabs.innerHTML = "";
    summary.innerHTML = "";
    return;
  }

  if (app.state.freePlayMode === FREE_PLAY_MODES.PLAYER_VS_PLAYER) {
    title.textContent = "Free Play Programs";
    const activeTab = Number(app.state.activeBlocklyTeamTab || 1);
    tabs.innerHTML = `
      <div class="blockly-program-tab-row">
        <button data-blockly-team-tab="1" ${activeTab === 1 ? "disabled" : ""}>Team 1 Program</button>
        <button data-blockly-team-tab="2" ${activeTab === 2 ? "disabled" : ""}>Team 2 Program</button>
      </div>
    `;
    summary.innerHTML = `
      <p><strong>Editing:</strong> ${escapeHtml(getActiveBlocklyProgramLabel(app))}</p>
      <p><strong>Team 1 Human:</strong> ${escapeHtml(`W A S D move, J/F jump, B barrier, X stay`)}</p>
      <p><strong>Team 2 Human:</strong> ${escapeHtml(`${P2_KEY_BINDINGS.UP.toUpperCase()} ${P2_KEY_BINDINGS.LEFT.toUpperCase()} ${P2_KEY_BINDINGS.DOWN.toUpperCase()} ${P2_KEY_BINDINGS.RIGHT} move, ${P2_KEY_BINDINGS.JUMP.toUpperCase()} jump, ${P2_KEY_BINDINGS.PLACE_BARRIER.toUpperCase()} barrier, ${P2_KEY_BINDINGS.STAY_STILL} stay`)}</p>
    `;
    return;
  }

  title.textContent = "Player Team Program";
  tabs.innerHTML = "";
  summary.innerHTML = `<p><strong>Mode:</strong> ${escapeHtml(app.state.freePlayMode)}</p>`;
}
