import {
  DEFAULT_ANIMATION_SPEED_FACTOR,
  DEFAULT_GAME_MODE,
  DEFAULT_MAP_KEY,
  GAME_VIEW_MODES,
  LEVEL_RESULT,
  LEVEL_STATUS,
  MAIN_GAME_STATES,
  MAPS,
  POINTS_TO_WIN,
  TURN_STATES
} from "../config/constants.js";

export function createInitialState() {
  return {
    allRunners: [],
    gameFlags: {},
    barriers: [],
    activeRunnerIndex: 0,
    currentTurnNumber: 1,
    currentTurnState: TURN_STATES.SETUP_DISPLAY,
    queuedActionForCurrentRunner: null,
    mainGameState: MAIN_GAME_STATES.SETUP,
    currentGameMode: DEFAULT_GAME_MODE,
    currentMapKey: DEFAULT_MAP_KEY,
    gameMap: MAPS[DEFAULT_MAP_KEY],
    animationSpeedFactor: DEFAULT_ANIMATION_SPEED_FACTOR,
    teamScores: { 1: 0, 2: 0 },
    pointsToWin: POINTS_TO_WIN,
    currentModeView: GAME_VIEW_MODES.GUIDED_LEVELS,
    levels: [],
    levelProgress: {},
    currentLevelId: null,
    currentLevelStatus: LEVEL_STATUS.LOCKED,
    activeLevelResult: LEVEL_RESULT.NONE,
    levelAttemptCount: 0,
    lastLevelResultReason: null,
    currentToolboxBlockTypes: [],
    autoStayHumanRunnerIds: []
  };
}

export function createApp() {
  return {
    state: createInitialState(),
    ui: {},
    blocklyWorkspace: null,
    p5Instance: null,
    syncUi: () => {},
    hooks: {}
  };
}
