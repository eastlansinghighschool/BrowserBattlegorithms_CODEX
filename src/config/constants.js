import { CELL_TYPE, MAPS, DEFAULT_MAP_KEY } from "./maps.js";
import { GAME_MODES, DEFAULT_GAME_MODE } from "./gameModes.js";
import { P1_KEY_BINDINGS, P2_KEY_BINDINGS } from "./keybindings.js";

export const COLS = 12;
export const ROWS = 8;
export const CELL_SIZE = 50;
export const FPS = 30;
export const BASE_ANIMATION_SPEED = 0.1;
export const DEFAULT_ANIMATION_SPEED_FACTOR = 1.0;
export const POINTS_TO_WIN = 2;
export const FROZEN_DURATION_TURNS = 3;

export const NPC_BEHAVIORS = {
  SIMPLE_TARGET: "SIMPLE_TARGET",
  PATROL_INTERCEPT: "PATROL_INTERCEPT"
};

export const ACTIVE_TEAM2_NPC_BEHAVIOR = NPC_BEHAVIORS.PATROL_INTERCEPT;
export const NPC_PATROL_RADIUS = 2;
export const NPC_THREAT_DETECTION_RADIUS = 4;

export const AI_ACTION_TYPES = {
  MOVE_FORWARD: "MOVE_FORWARD",
  MOVE_BACKWARD: "MOVE_BACKWARD",
  MOVE_UP_SCREEN: "MOVE_UP_SCREEN",
  MOVE_DOWN_SCREEN: "MOVE_DOWN_SCREEN",
  STAY_STILL: "STAY_STILL",
  JUMP_FORWARD: "JUMP_FORWARD",
  PLACE_BARRIER_FORWARD: "PLACE_BARRIER_FORWARD"
};

export const TURN_STATES = {
  SETUP_DISPLAY: "SETUP_DISPLAY",
  AWAITING_INPUT: "AWAITING_INPUT",
  PROCESSING_ACTION: "PROCESSING_ACTION",
  ANIMATING: "ANIMATING",
  GAME_OVER: "GAME_OVER"
};

export const MAIN_GAME_STATES = {
  SETUP: "SETUP",
  RUNNING: "RUNNING",
  GAME_OVER: "GAME_OVER",
  LEVEL_RESULT: "LEVEL_RESULT"
};

export const GAME_VIEW_MODES = {
  GUIDED_LEVELS: "GUIDED_LEVELS",
  FREE_PLAY: "FREE_PLAY"
};

export const LEVEL_STATUS = {
  LOCKED: "LOCKED",
  AVAILABLE: "AVAILABLE",
  PASSED: "PASSED"
};

export const LEVEL_RESULT = {
  IN_PROGRESS: "IN_PROGRESS",
  PASSED: "PASSED",
  FAILED: "FAILED",
  NONE: "NONE"
};

export const BLOCK_TYPES = {
  MOVE_FORWARD: "battlegorithms_move_forward",
  MOVE_BACKWARD: "battlegorithms_move_backward",
  MOVE_UP_SCREEN: "battlegorithms_move_up_screen",
  MOVE_DOWN_SCREEN: "battlegorithms_move_down_screen",
  JUMP_FORWARD: "battlegorithms_jump_forward",
  STAY_STILL: "battlegorithms_stay_still",
  PLACE_BARRIER: "battlegorithms_place_barrier"
};

export const TEAM1_HUMAN_INITIAL_POS = { x: 1, y: Math.floor(ROWS / 2) - 2 };
export const TEAM1_AI_ALLY_INITIAL_POS = { x: 1, y: Math.floor(ROWS / 2) + 0 };
export const TEAM2_HUMAN_INITIAL_POS = { x: COLS - 2, y: Math.floor(ROWS / 2) - 2 };
export const TEAM2_AI_ALLY_INITIAL_POS = { x: COLS - 2, y: Math.floor(ROWS / 2) + 0 };
export const TEAM2_NPC1_INITIAL_POS = { x: COLS - 2, y: Math.floor(ROWS / 2) - 1 };
export const TEAM2_NPC2_INITIAL_POS = { x: COLS - 2, y: Math.floor(ROWS / 2) + 1 };
export const TEAM2_ENEMY1_INITIAL_POS = { x: COLS - 2, y: Math.floor(ROWS / 2) - 1 };
export const TEAM2_ENEMY2_INITIAL_POS = { x: COLS - 2, y: Math.floor(ROWS / 2) + 1 };
export const TEAM1_FLAG_INITIAL_POS = { x: 0, y: Math.floor(ROWS / 2) };
export const TEAM2_FLAG_INITIAL_POS = { x: COLS - 1, y: Math.floor(ROWS / 2) };

export const HUMAN_RUNNER_TEAM1_PD1_EMOJI = "🏃🏾‍♀️‍➡️";
export const AI_ALLY_TEAM1_PD1_EMOJI = "🏃🏿‍♂️‍➡️";
export const HUMAN_RUNNER_TEAM2_PD_MINUS1_EMOJI = "🏃🏻‍♂️";
export const AI_ALLY_TEAM2_PD_MINUS1_EMOJI = "🏃";
export const NPC_ENEMY_TEAM2_PD_MINUS1_EMOJI = "🏃";
export const HUMAN_FROZEN_PD1_EMOJI = "🧎🏽‍♀️‍➡️";
export const AI_ALLY_FROZEN_PD1_EMOJI = "🧎🏾‍♂️‍➡️";
export const HUMAN_FROZEN_TEAM2_PD_MINUS1_EMOJI = "🧎🏻‍♂️";
export const AI_ALLY_FROZEN_TEAM2_PD_MINUS1_EMOJI = "🧎";
export const NPC_ENEMY_FROZEN_PD_MINUS1_EMOJI = "🧎";
export const BARRIER_EMOJI = "🚧";
export const FLAG1_EMOJI = "🚩";
export const FLAG2_EMOJI = "🏳️";

export const TEAM_CONFIG = {
  1: {
    playDirection: 1,
    humanEmoji: HUMAN_RUNNER_TEAM1_PD1_EMOJI,
    humanFrozenEmoji: HUMAN_FROZEN_PD1_EMOJI,
    aiAllyEmoji: AI_ALLY_TEAM1_PD1_EMOJI,
    aiAllyFrozenEmoji: AI_ALLY_FROZEN_PD1_EMOJI,
    baseCellType: CELL_TYPE.TEAM1_BASE,
    flagEmoji: FLAG1_EMOJI,
    initialFlagPos: TEAM1_FLAG_INITIAL_POS,
    glowColorFill: [173, 216, 230],
    glowColorStroke: [100, 149, 237]
  },
  2: {
    playDirection: -1,
    npcEnemyEmoji: NPC_ENEMY_TEAM2_PD_MINUS1_EMOJI,
    npcEnemyFrozenEmoji: NPC_ENEMY_FROZEN_PD_MINUS1_EMOJI,
    humanEmoji: HUMAN_RUNNER_TEAM2_PD_MINUS1_EMOJI,
    humanFrozenEmoji: HUMAN_FROZEN_TEAM2_PD_MINUS1_EMOJI,
    aiAllyEmoji: AI_ALLY_TEAM2_PD_MINUS1_EMOJI,
    aiAllyFrozenEmoji: AI_ALLY_FROZEN_TEAM2_PD_MINUS1_EMOJI,
    baseCellType: CELL_TYPE.TEAM2_BASE,
    flagEmoji: FLAG2_EMOJI,
    initialFlagPos: TEAM2_FLAG_INITIAL_POS,
    glowColorFill: [255, 200, 100],
    glowColorStroke: [255, 165, 0]
  }
};

export const GLOW_DIAMETER_FACTOR = 0.9;
export const GLOW_STROKE_WEIGHT = 2;
export const GLOW_PULSE_SPEED = 0.08;
export const GLOW_PULSE_MIN_ALPHA = 20;
export const GLOW_PULSE_MAX_ALPHA = 250;
export const GLOW_SOLID_ALPHA_ANIMATING = 160;
export const GLOW_SOLID_ALPHA_FROZEN_TURN = 80;

export {
  CELL_TYPE,
  MAPS,
  DEFAULT_MAP_KEY,
  GAME_MODES,
  DEFAULT_GAME_MODE,
  P1_KEY_BINDINGS,
  P2_KEY_BINDINGS
};
