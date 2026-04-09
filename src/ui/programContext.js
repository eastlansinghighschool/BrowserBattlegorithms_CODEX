import { FREE_PLAY_MODES, GAME_VIEW_MODES } from "../config/constants.js";

export function getActiveProgramLabel(state) {
  if (state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS) {
    return "Guided";
  }
  if (state.freePlayMode === FREE_PLAY_MODES.PLAYER_VS_PLAYER) {
    return `Team ${state.activeBlocklyTeamTab || 1}`;
  }
  return "Player Team";
}
