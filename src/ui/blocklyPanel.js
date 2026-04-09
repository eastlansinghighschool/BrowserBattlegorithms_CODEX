import { FREE_PLAY_MODES, GAME_VIEW_MODES } from "../config/constants.js";
import { getActiveProgramLabel } from "./programContext.js";
import { renderControlRows } from "./keycaps.js";

function escapeHtml(value) {
  return `${value || ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getFreePlayModeLabel(mode) {
  if (mode === FREE_PLAY_MODES.PLAYER_VS_PLAYER) {
    return "Player vs Player";
  }
  if (mode === FREE_PLAY_MODES.PLAYER_VS_CPU_EASY) {
    return "Player vs CPU (Easy)";
  }
  if (mode === FREE_PLAY_MODES.PLAYER_VS_CPU_TACTICAL) {
    return "Player vs CPU (Tactical)";
  }
  return mode;
}

export function renderBlocklyPanel(app) {
  const title = document.getElementById("blocklyPanelTitle");
  const tabs = document.getElementById("blockly-program-tabs");
  const summary = document.getElementById("blockly-program-summary");
  const importStatus = document.getElementById("workspace-import-status");
  const exportWorkspaceButton = document.getElementById("exportWorkspaceButton");
  const importWorkspaceButton = document.getElementById("importWorkspaceButton");
  const blocklyToolbar = document.getElementById("blockly-toolbar");
  const programShell = document.getElementById("blockly-workspace-shell");
  const blocklyPlaceholder = document.getElementById("blockly-loading-placeholder");
  const blocklyErrorMessage = document.getElementById("blockly-loading-error-message");
  const blocklyRetryButton = document.getElementById("blockly-loading-retry");

  if (!title || !tabs || !summary) {
    return;
  }

  if (importStatus) {
    importStatus.textContent = app.state.workspaceImportStatus?.message || "";
    importStatus.className = app.state.workspaceImportStatus
      ? `workspace-import-status workspace-import-status-${app.state.workspaceImportStatus.tone}`
      : "workspace-import-status";
    importStatus.hidden = !app.state.workspaceImportStatus;
  }

  const editorReady = Boolean(app.state.editorReady);
  if (exportWorkspaceButton) {
    exportWorkspaceButton.disabled = !editorReady;
  }
  if (importWorkspaceButton) {
    importWorkspaceButton.disabled = !editorReady;
  }
  if (blocklyToolbar) {
    blocklyToolbar.classList.toggle("blockly-toolbar-disabled", !editorReady);
  }
  if (programShell) {
    programShell.classList.toggle("blockly-shell-loading", !editorReady);
  }
  if (blocklyPlaceholder) {
    blocklyPlaceholder.hidden = editorReady;
  }
  if (blocklyErrorMessage) {
    blocklyErrorMessage.textContent = app.state.editorLoadError || "";
  }
  if (blocklyRetryButton) {
    blocklyRetryButton.hidden = !app.state.editorLoadError;
  }

  if (app.state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS) {
    title.textContent = "AI Ally Program";
    tabs.innerHTML = "";
    summary.innerHTML = app.state.humanTurnBehavior === "WAIT_FOR_INPUT"
      ? `
        <p><strong>Keyboard practice:</strong> Use these keys when it is the human runner's turn.</p>
        ${renderControlRows([
          { label: "Move", keys: ["W", "A", "S", "D"], description: "move on the board" },
          { label: "Jump", keys: ["F"], description: "jump forward" },
          { label: "Barrier", keys: ["B"], description: "place a barrier" },
          { label: "Stay", keys: ["X"], description: "stay still" }
        ])}
      `
      : "";
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
      <p><strong>Editing:</strong> ${escapeHtml(app.hooks.getActiveProgramLabel?.() || getActiveProgramLabel(app.state))}</p>
      <p class="lesson-support-note">Keyboard controls live in the Free Play options panel so the workspace can stay focused on your team program.</p>
    `;
    return;
  }

  title.textContent = "Player Team Program";
  tabs.innerHTML = "";
  summary.innerHTML = `
    <p><strong>Mode:</strong> ${escapeHtml(getFreePlayModeLabel(app.state.freePlayMode))}</p>
    <p class="lesson-support-note">Use the Free Play options panel for the human-control reminder and keep this panel open for your code blocks.</p>
  `;
}
