import { CELL_TYPE, MAPS, DEFAULT_MAP_KEY, FREE_PLAY_MAP_OPTIONS } from "./maps.js";
import { GAME_MODES, DEFAULT_GAME_MODE, FREE_PLAY_MODES, DEFAULT_FREE_PLAY_MODE } from "./gameModes.js";
import { P1_KEY_ALIASES, P1_KEY_BINDINGS, P2_KEY_BINDINGS } from "./keybindings.js";

export const COLS = 12;
export const ROWS = 8;
export const CELL_SIZE = 50;
export const FPS = 30;
export const BASE_ANIMATION_SPEED = 0.1;
export const DEFAULT_ANIMATION_SPEED_FACTOR = 1.0;
export const POINTS_TO_WIN = 2;
export const FREE_PLAY_TEAM_SIZE_MIN = 2;
export const FREE_PLAY_TEAM_SIZE_MAX = 6;
export const DEFAULT_FREE_PLAY_TEAM_SIZE = 2;
export const FROZEN_DURATION_TURNS = 3;
export const AREA_FREEZE_DURATION_TURNS = 2;
export const AREA_FREEZE_RADIUS = 2;
export const UNLOCK_ALL_GUIDED_LEVELS_FOR_TESTING = true;

export const NPC_BEHAVIORS = {
  SIMPLE_TARGET: "SIMPLE_TARGET",
  PATROL_INTERCEPT: "PATROL_INTERCEPT",
  FREE_PLAY_EASY: "FREE_PLAY_EASY",
  FREE_PLAY_TACTICAL_ATTACKER: "FREE_PLAY_TACTICAL_ATTACKER",
  FREE_PLAY_TACTICAL_DEFENDER: "FREE_PLAY_TACTICAL_DEFENDER"
};

export const ACTIVE_TEAM2_NPC_BEHAVIOR = NPC_BEHAVIORS.PATROL_INTERCEPT;
export const NPC_PATROL_RADIUS = 2;
export const NPC_THREAT_DETECTION_RADIUS = 4;

export const AI_ACTION_TYPES = {
  MOVE_FORWARD: "MOVE_FORWARD",
  MOVE_BACKWARD: "MOVE_BACKWARD",
  MOVE_UP_SCREEN: "MOVE_UP_SCREEN",
  MOVE_DOWN_SCREEN: "MOVE_DOWN_SCREEN",
  MOVE_RANDOMLY: "MOVE_RANDOMLY",
  MOVE_TOWARD: "MOVE_TOWARD",
  STAY_STILL: "STAY_STILL",
  JUMP_FORWARD: "JUMP_FORWARD",
  PLACE_BARRIER_FORWARD: "PLACE_BARRIER_FORWARD",
  FREEZE_OPPONENTS: "FREEZE_OPPONENTS"
};

export const MOVE_TOWARD_TARGETS = {
  ENEMY_FLAG: "ENEMY_FLAG",
  MY_BASE: "MY_BASE",
  HUMAN_RUNNER: "HUMAN_RUNNER",
  CLOSEST_ENEMY: "CLOSEST_ENEMY"
};

export const ADVANCED_COMPARE_OPERATORS = {
  EQ: "EQ",
  NEQ: "NEQ",
  LT: "LT",
  LTE: "LTE",
  GT: "GT",
  GTE: "GTE"
};

export const SENSOR_OBJECT_TYPES = {
  BARRIER: "BARRIER",
  EDGE_OR_WALL: "EDGE_OR_WALL",
  ENEMY_RUNNER: "ENEMY_RUNNER",
  ENEMY_FLAG: "ENEMY_FLAG",
  HUMAN_RUNNER: "HUMAN_RUNNER"
};

export const SENSOR_RELATION_TYPES = {
  DIRECTLY_IN_FRONT: "DIRECTLY_IN_FRONT",
  DIRECTLY_BEHIND: "DIRECTLY_BEHIND",
  DIRECTLY_ABOVE: "DIRECTLY_ABOVE",
  DIRECTLY_BELOW: "DIRECTLY_BELOW",
  ANYWHERE_FORWARD: "ANYWHERE_FORWARD",
  ANYWHERE_BEHIND: "ANYWHERE_BEHIND",
  ANYWHERE_ABOVE: "ANYWHERE_ABOVE",
  ANYWHERE_BELOW: "ANYWHERE_BELOW",
  WITHIN_2: "WITHIN_2",
  WITHIN_3: "WITHIN_3",
  WITHIN_4: "WITHIN_4",
  WITHIN_5: "WITHIN_5",
  WITHIN_6: "WITHIN_6"
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

export const HUMAN_TURN_BEHAVIORS = {
  AUTO_SKIP: "AUTO_SKIP",
  WAIT_FOR_INPUT: "WAIT_FOR_INPUT"
};

export const BLOCK_TYPES = {
  ON_EACH_TURN: "battlegorithms_on_each_turn",
  IF_SENSOR_MATCHES: "battlegorithms_if_sensor_matches",
  IF_SENSOR_MATCHES_ELSE: "battlegorithms_if_sensor_matches_else",
  IF_BARRIER_IN_FRONT: "battlegorithms_if_barrier_in_front",
  IF_BARRIER_IN_FRONT_ELSE: "battlegorithms_if_barrier_in_front_else",
  IF_ENEMY_IN_FRONT: "battlegorithms_if_enemy_in_front",
  IF_HAVE_ENEMY_FLAG: "battlegorithms_if_have_enemy_flag",
  IF_HAVE_ENEMY_FLAG_ELSE: "battlegorithms_if_have_enemy_flag_else",
  IF_CAN_JUMP: "battlegorithms_if_can_jump",
  IF_CAN_JUMP_ELSE: "battlegorithms_if_can_jump_else",
  IF_CAN_PLACE_BARRIER: "battlegorithms_if_can_place_barrier",
  IF_CAN_PLACE_BARRIER_ELSE: "battlegorithms_if_can_place_barrier_else",
  IF_AREA_FREEZE_READY: "battlegorithms_if_area_freeze_ready",
  IF_AREA_FREEZE_READY_ELSE: "battlegorithms_if_area_freeze_ready_else",
  IF_TEAMMATE_HAS_FLAG: "battlegorithms_if_teammate_has_flag",
  IF_TEAMMATE_HAS_FLAG_ELSE: "battlegorithms_if_teammate_has_flag_else",
  IF_ON_MY_SIDE: "battlegorithms_if_on_my_side",
  IF_ON_MY_SIDE_ELSE: "battlegorithms_if_on_my_side_else",
  IF_ON_ENEMY_SIDE: "battlegorithms_if_on_enemy_side",
  IF_ON_ENEMY_SIDE_ELSE: "battlegorithms_if_on_enemy_side_else",
  IF_BOOLEAN: "battlegorithms_if_boolean",
  IF_BOOLEAN_ELSE: "battlegorithms_if_boolean_else",
  MOVE_TOWARD: "battlegorithms_move_toward",
  MOVE_FORWARD: "battlegorithms_move_forward",
  MOVE_BACKWARD: "battlegorithms_move_backward",
  MOVE_UP_SCREEN: "battlegorithms_move_up_screen",
  MOVE_DOWN_SCREEN: "battlegorithms_move_down_screen",
  MOVE_RANDOMLY: "battlegorithms_move_randomly",
  JUMP_FORWARD: "battlegorithms_jump_forward",
  STAY_STILL: "battlegorithms_stay_still",
  PLACE_BARRIER: "battlegorithms_place_barrier",
  FREEZE_OPPONENTS: "battlegorithms_freeze_opponents",
  BOOLEAN_SENSOR_MATCHES: "battlegorithms_boolean_sensor_matches",
  BOOLEAN_HAVE_ENEMY_FLAG: "battlegorithms_boolean_have_enemy_flag",
  BOOLEAN_CAN_JUMP: "battlegorithms_boolean_can_jump",
  BOOLEAN_CAN_PLACE_BARRIER: "battlegorithms_boolean_can_place_barrier",
  BOOLEAN_AREA_FREEZE_READY: "battlegorithms_boolean_area_freeze_ready",
  BOOLEAN_TEAMMATE_HAS_FLAG: "battlegorithms_boolean_teammate_has_flag",
  BOOLEAN_ON_MY_SIDE: "battlegorithms_boolean_on_my_side",
  BOOLEAN_ON_ENEMY_SIDE: "battlegorithms_boolean_on_enemy_side",
  LOGIC_AND: "battlegorithms_logic_and",
  LOGIC_OR: "battlegorithms_logic_or",
  LOGIC_NOT: "battlegorithms_logic_not",
  VALUE_NUMBER: "battlegorithms_value_number",
  VALUE_RUNNER_INDEX: "battlegorithms_value_runner_index",
  VALUE_DISTANCE_TO_TARGET: "battlegorithms_value_distance_to_target",
  VALUE_RANDOM_ROLL: "battlegorithms_value_random_roll",
  VALUE_PLAY_DIRECTION: "battlegorithms_value_play_direction",
  VALUE_COMPARE: "battlegorithms_value_compare"
};

export const HUMAN_RUNNER_PD1_EMOJI = "🏃🏾‍♀️‍➡️";
export const HUMAN_RUNNER_PD_MINUS1_EMOJI = "🏃🏾‍♀️";
export const AI_ALLY_PD1_EMOJI = "🏃🏿‍♂️‍➡️";
export const AI_ALLY_PD_MINUS1_EMOJI = "🏃🏿‍♂️";
export const NPC_ENEMY_PD1_EMOJI = "🏃‍➡️";
export const NPC_ENEMY_PD_MINUS1_EMOJI = "🏃";
export const HUMAN_FROZEN_PD1_EMOJI = "🧎🏽‍♀️‍➡️";
export const HUMAN_FROZEN_PD_MINUS1_EMOJI = "🧎🏽‍♀️";
export const AI_ALLY_FROZEN_PD1_EMOJI = "🧎🏾‍♂️‍➡️";
export const AI_ALLY_FROZEN_PD_MINUS1_EMOJI = "🧎🏾‍♂️";
export const NPC_ENEMY_FROZEN_PD1_EMOJI = "🧎‍➡️";
export const NPC_ENEMY_FROZEN_PD_MINUS1_EMOJI = "🧎";
export const BARRIER_EMOJI = "🚧";
export const FLAG1_EMOJI = "🚩";
export const FLAG2_EMOJI = "🏳️";
export const TEAM_GLOW_COLORS = {
  1: {
    fill: [173, 216, 230],
    stroke: [100, 149, 237]
  },
  2: {
    fill: [255, 200, 100],
    stroke: [255, 165, 0]
  }
};

// Runner emoji rendering strategy:
// - When USE_DIRECTIONAL_RUNNER_GLYPHS is true, select the PD1/PD-1 Unicode sequence by playDirection.
// - When MIRROR_RUNNER_EMOJI_WITH_TRANSFORM is true, the selected glyph is mirrored in canvas for playDirection 1.
// Recommended experiments:
// - Old p5.js behavior guess: USE_DIRECTIONAL_RUNNER_GLYPHS=true, MIRROR_RUNNER_EMOJI_WITH_TRANSFORM=false
// - Transform-only fallback: USE_DIRECTIONAL_RUNNER_GLYPHS=false, MIRROR_RUNNER_EMOJI_WITH_TRANSFORM=true
export const USE_DIRECTIONAL_RUNNER_GLYPHS = true;
export const MIRROR_RUNNER_EMOJI_WITH_TRANSFORM = false;

export const RUNNER_EMOJI_BY_ROLE = {
  human: {
    active: {
      1: USE_DIRECTIONAL_RUNNER_GLYPHS ? HUMAN_RUNNER_PD1_EMOJI : HUMAN_RUNNER_PD_MINUS1_EMOJI,
      [-1]: HUMAN_RUNNER_PD_MINUS1_EMOJI
    },
    frozen: {
      1: USE_DIRECTIONAL_RUNNER_GLYPHS ? HUMAN_FROZEN_PD1_EMOJI : HUMAN_FROZEN_PD_MINUS1_EMOJI,
      [-1]: HUMAN_FROZEN_PD_MINUS1_EMOJI
    }
  },
  ally: {
    active: {
      1: USE_DIRECTIONAL_RUNNER_GLYPHS ? AI_ALLY_PD1_EMOJI : AI_ALLY_PD_MINUS1_EMOJI,
      [-1]: AI_ALLY_PD_MINUS1_EMOJI
    },
    frozen: {
      1: USE_DIRECTIONAL_RUNNER_GLYPHS ? AI_ALLY_FROZEN_PD1_EMOJI : AI_ALLY_FROZEN_PD_MINUS1_EMOJI,
      [-1]: AI_ALLY_FROZEN_PD_MINUS1_EMOJI
    }
  },
  npc: {
    active: {
      1: USE_DIRECTIONAL_RUNNER_GLYPHS ? NPC_ENEMY_PD1_EMOJI : NPC_ENEMY_PD_MINUS1_EMOJI,
      [-1]: NPC_ENEMY_PD_MINUS1_EMOJI
    },
    frozen: {
      1: USE_DIRECTIONAL_RUNNER_GLYPHS ? NPC_ENEMY_FROZEN_PD1_EMOJI : NPC_ENEMY_FROZEN_PD_MINUS1_EMOJI,
      [-1]: NPC_ENEMY_FROZEN_PD_MINUS1_EMOJI
    }
  }
};

export const GLOW_DIAMETER_FACTOR = 0.9;
export const GLOW_STROKE_WEIGHT = 2;
export const GLOW_PULSE_SPEED = 0.08;
export const GLOW_PULSE_MIN_ALPHA = 20;
export const GLOW_PULSE_MAX_ALPHA = 250;
export const GLOW_SOLID_ALPHA_ANIMATING = 160;
export const GLOW_SOLID_ALPHA_FROZEN_TURN = 80;
export const GOAL_BURST_DURATION_MS = 1000;

export {
  CELL_TYPE,
  MAPS,
  DEFAULT_MAP_KEY,
  FREE_PLAY_MAP_OPTIONS,
  GAME_MODES,
  DEFAULT_GAME_MODE,
  FREE_PLAY_MODES,
  DEFAULT_FREE_PLAY_MODE,
  P1_KEY_ALIASES,
  P1_KEY_BINDINGS,
  P2_KEY_BINDINGS
};
