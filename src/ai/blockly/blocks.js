import * as Blockly from "blockly";
import {
  AI_ACTION_TYPES,
  BLOCK_TYPES,
  GAME_VIEW_MODES,
  MOVE_TOWARD_TARGETS,
  SENSOR_OBJECT_TYPES,
  SENSOR_RELATION_TYPES
} from "../../config/constants.js";

const EVENT_BLOCK_CONFIG = {
  category: "Events",
  color: 35,
  label: "On Each Turn",
  tooltip: "The ally checks the block underneath this every time it gets a turn."
};

const CONDITION_BLOCK_LIBRARY = {
  [BLOCK_TYPES.IF_SENSOR_MATCHES]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If",
    tooltip: "Checks whether the chosen object matches the chosen relation."
  },
  [BLOCK_TYPES.IF_SENSOR_MATCHES_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If / Else",
    tooltip: "Checks whether the chosen object matches the chosen relation and lets you choose a different move when it does not."
  },
  [BLOCK_TYPES.IF_BARRIER_IN_FRONT]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If Barrier Is In Front",
    tooltip: "Runs the block inside when the square ahead is blocked by a barrier."
  },
  [BLOCK_TYPES.IF_BARRIER_IN_FRONT_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If Barrier Is In Front / Else",
    tooltip: "Runs one move when a barrier is directly ahead, and a different move when the way is clear."
  },
  [BLOCK_TYPES.IF_ENEMY_IN_FRONT]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If Enemy Is In Front",
    tooltip: "Runs the block inside when an active enemy is directly ahead."
  },
  [BLOCK_TYPES.IF_HAVE_ENEMY_FLAG]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Have Enemy Flag",
    tooltip: "Runs the block inside after this runner has picked up the enemy flag."
  },
  [BLOCK_TYPES.IF_HAVE_ENEMY_FLAG_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Have Enemy Flag / Else",
    tooltip: "Runs one move if the ally has the enemy flag, and a different move if it does not."
  },
  [BLOCK_TYPES.IF_CAN_JUMP]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Can Jump",
    tooltip: "Runs the block inside if this runner still has its jump available."
  },
  [BLOCK_TYPES.IF_CAN_JUMP_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Can Jump / Else",
    tooltip: "Chooses one move if jump is still available and another if it has already been used."
  },
  [BLOCK_TYPES.IF_CAN_PLACE_BARRIER]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Can Place Barrier",
    tooltip: "Runs the block inside if this runner can place a barrier right now."
  },
  [BLOCK_TYPES.IF_CAN_PLACE_BARRIER_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Can Place Barrier / Else",
    tooltip: "Chooses one move if a barrier is ready and another if it is not."
  },
  [BLOCK_TYPES.IF_AREA_FREEZE_READY]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If Area Freeze Is Ready",
    tooltip: "Runs the block inside if this team has not used Area Freeze this round."
  },
  [BLOCK_TYPES.IF_AREA_FREEZE_READY_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If Area Freeze Is Ready / Else",
    tooltip: "Chooses one move if Area Freeze is still ready this round and another if it is not."
  },
  [BLOCK_TYPES.IF_TEAMMATE_HAS_FLAG]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If Teammate Has Enemy Flag",
    tooltip: "Runs the block inside if another runner on your team is carrying the enemy flag."
  },
  [BLOCK_TYPES.IF_TEAMMATE_HAS_FLAG_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If Teammate Has Enemy Flag / Else",
    tooltip: "Chooses one move if a teammate has the enemy flag and another if no teammate is carrying it."
  },
  [BLOCK_TYPES.IF_ON_MY_SIDE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Am On My Side",
    tooltip: "Runs the block inside if this runner is currently on its own side of the field."
  },
  [BLOCK_TYPES.IF_ON_MY_SIDE_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Am On My Side / Else",
    tooltip: "Chooses one move on your side of the field and another on the enemy side."
  },
  [BLOCK_TYPES.IF_ON_ENEMY_SIDE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Am On Enemy Side",
    tooltip: "Runs the block inside if this runner is currently on the enemy side of the field."
  },
  [BLOCK_TYPES.IF_ON_ENEMY_SIDE_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Am On Enemy Side / Else",
    tooltip: "Chooses one move on the enemy side of the field and another on your own side."
  }
};

const CONDITION_TYPES_WITH_ELSE = new Set([
  BLOCK_TYPES.IF_SENSOR_MATCHES_ELSE,
  BLOCK_TYPES.IF_HAVE_ENEMY_FLAG_ELSE,
  BLOCK_TYPES.IF_BARRIER_IN_FRONT_ELSE,
  BLOCK_TYPES.IF_CAN_JUMP_ELSE,
  BLOCK_TYPES.IF_CAN_PLACE_BARRIER_ELSE,
  BLOCK_TYPES.IF_AREA_FREEZE_READY_ELSE,
  BLOCK_TYPES.IF_TEAMMATE_HAS_FLAG_ELSE,
  BLOCK_TYPES.IF_ON_MY_SIDE_ELSE,
  BLOCK_TYPES.IF_ON_ENEMY_SIDE_ELSE
]);

const FULL_SENSOR_OBJECT_OPTIONS = [
  ["barrier", SENSOR_OBJECT_TYPES.BARRIER],
  ["edge or wall", SENSOR_OBJECT_TYPES.EDGE_OR_WALL],
  ["enemy runner", SENSOR_OBJECT_TYPES.ENEMY_RUNNER],
  ["enemy flag", SENSOR_OBJECT_TYPES.ENEMY_FLAG],
  ["human runner", SENSOR_OBJECT_TYPES.HUMAN_RUNNER]
];

const FULL_SENSOR_RELATION_OPTIONS = [
  ["directly in front", SENSOR_RELATION_TYPES.DIRECTLY_IN_FRONT],
  ["directly behind", SENSOR_RELATION_TYPES.DIRECTLY_BEHIND],
  ["directly above", SENSOR_RELATION_TYPES.DIRECTLY_ABOVE],
  ["directly below", SENSOR_RELATION_TYPES.DIRECTLY_BELOW],
  ["anywhere forward", SENSOR_RELATION_TYPES.ANYWHERE_FORWARD],
  ["anywhere behind", SENSOR_RELATION_TYPES.ANYWHERE_BEHIND],
  ["anywhere above", SENSOR_RELATION_TYPES.ANYWHERE_ABOVE],
  ["anywhere below", SENSOR_RELATION_TYPES.ANYWHERE_BELOW],
  ["within 2 spaces", SENSOR_RELATION_TYPES.WITHIN_2],
  ["within 3 spaces", SENSOR_RELATION_TYPES.WITHIN_3],
  ["within 4 spaces", SENSOR_RELATION_TYPES.WITHIN_4],
  ["within 5 spaces", SENSOR_RELATION_TYPES.WITHIN_5],
  ["within 6 spaces", SENSOR_RELATION_TYPES.WITHIN_6]
];

let currentSensorObjectValues = FULL_SENSOR_OBJECT_OPTIONS.map(([, value]) => value);
let currentSensorRelationValues = FULL_SENSOR_RELATION_OPTIONS.map(([, value]) => value);

const MOVE_TOWARD_TARGET_OPTIONS = [
  ["enemy flag", MOVE_TOWARD_TARGETS.ENEMY_FLAG],
  ["my base", MOVE_TOWARD_TARGETS.MY_BASE],
  ["human runner", MOVE_TOWARD_TARGETS.HUMAN_RUNNER],
  ["closest enemy", MOVE_TOWARD_TARGETS.CLOSEST_ENEMY]
];

let currentMoveTowardTargetValues = MOVE_TOWARD_TARGET_OPTIONS.map(([, value]) => value);

const BLOCK_LIBRARY = {
  [BLOCK_TYPES.MOVE_TOWARD]: {
    category: "Movement",
    color: "%{BKY_MATH_HUE}",
    label: "Move Toward",
    tooltip: "Moves one step toward the chosen target. This is a helper, not full pathfinding.",
    actionType: AI_ACTION_TYPES.MOVE_TOWARD
  },
  [BLOCK_TYPES.MOVE_FORWARD]: {
    category: "Movement",
    color: "%{BKY_MATH_HUE}",
    label: "Move Forward",
    tooltip: "Moves the runner one step in its current play direction.",
    actionType: AI_ACTION_TYPES.MOVE_FORWARD
  },
  [BLOCK_TYPES.MOVE_BACKWARD]: {
    category: "Movement",
    color: "%{BKY_MATH_HUE}",
    label: "Move Backward",
    tooltip: "Moves the runner one step opposite to its current play direction.",
    actionType: AI_ACTION_TYPES.MOVE_BACKWARD
  },
  [BLOCK_TYPES.MOVE_UP_SCREEN]: {
    category: "Movement",
    color: "%{BKY_MATH_HUE}",
    label: "Move Up (screen)",
    tooltip: "Moves the runner one step towards the top of the screen.",
    actionType: AI_ACTION_TYPES.MOVE_UP_SCREEN
  },
  [BLOCK_TYPES.MOVE_DOWN_SCREEN]: {
    category: "Movement",
    color: "%{BKY_MATH_HUE}",
    label: "Move Down (screen)",
    tooltip: "Moves the runner one step towards the bottom of the screen.",
    actionType: AI_ACTION_TYPES.MOVE_DOWN_SCREEN
  },
  [BLOCK_TYPES.MOVE_RANDOMLY]: {
    category: "Movement",
    color: "%{BKY_MATH_HUE}",
    label: "Move Randomly",
    tooltip: "Chooses one cardinal move at random. The usual movement rules still apply.",
    actionType: AI_ACTION_TYPES.MOVE_RANDOMLY
  },
  [BLOCK_TYPES.JUMP_FORWARD]: {
    category: "Movement",
    color: "%{BKY_MATH_HUE}",
    label: "Jump Forward",
    tooltip: "Jumps two cells forward, if able.",
    actionType: AI_ACTION_TYPES.JUMP_FORWARD
  },
  [BLOCK_TYPES.STAY_STILL]: {
    category: "Movement",
    color: "%{BKY_MATH_HUE}",
    label: "Stay Still",
    tooltip: "The runner does not move this turn.",
    actionType: AI_ACTION_TYPES.STAY_STILL
  },
  [BLOCK_TYPES.PLACE_BARRIER]: {
    category: "Actions",
    color: "%{BKY_LOGIC_HUE}",
    label: "Place Barrier (in front)",
    tooltip: "Places a barrier in the cell directly forward, if able.",
    actionType: AI_ACTION_TYPES.PLACE_BARRIER_FORWARD
  },
  [BLOCK_TYPES.FREEZE_OPPONENTS]: {
    category: "Actions",
    color: "%{BKY_LOGIC_HUE}",
    label: "Freeze Opponents",
    tooltip: "Freezes nearby active enemies for 2 turns. This can only be used once per team each round.",
    actionType: AI_ACTION_TYPES.FREEZE_OPPONENTS
  }
};

let registered = false;

function filterOptions(fullOptions, allowedValues) {
  const filtered = fullOptions.filter(([, value]) => allowedValues.includes(value));
  return filtered.length ? filtered : fullOptions;
}

export function registerBattleBlocklyBlocks() {
  if (registered) {
    return;
  }

  Blockly.Blocks[BLOCK_TYPES.ON_EACH_TURN] = {
    init() {
      this.appendDummyInput().appendField(EVENT_BLOCK_CONFIG.label);
      this.setNextStatement(true, null);
      this.setColour(EVENT_BLOCK_CONFIG.color);
      this.setTooltip(EVENT_BLOCK_CONFIG.tooltip);
      this.setDeletable(false);
      this.setMovable(false);
    }
  };

  Object.entries(CONDITION_BLOCK_LIBRARY).forEach(([type, config]) => {
    Blockly.Blocks[type] = {
      init() {
        const input = this.appendDummyInput();
        input.appendField(config.label);
        if (type === BLOCK_TYPES.IF_SENSOR_MATCHES || type === BLOCK_TYPES.IF_SENSOR_MATCHES_ELSE) {
          input
            .appendField(new Blockly.FieldDropdown(() => getSensorObjectOptions()), "OBJECT")
            .appendField("is")
            .appendField(new Blockly.FieldDropdown(() => getSensorRelationOptions()), "RELATION");
        }
        if (CONDITION_TYPES_WITH_ELSE.has(type)) {
          this.appendDummyInput("IF_LABEL").appendField("if");
        }
        this.appendStatementInput("DO").appendField("do");
        if (CONDITION_TYPES_WITH_ELSE.has(type)) {
          this.appendDummyInput("ELSE_LABEL").appendField("else");
          this.appendStatementInput("ELSE");
        }
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(config.color);
        this.setTooltip(config.tooltip);
      }
    };
  });

  Object.entries(BLOCK_LIBRARY).forEach(([type, config]) => {
    Blockly.Blocks[type] = {
      init() {
        const input = this.appendDummyInput();
        input.appendField(config.label);
        if (type === BLOCK_TYPES.MOVE_TOWARD) {
          input.appendField(new Blockly.FieldDropdown(() => getMoveTowardTargetOptions()), "TARGET");
        }
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(config.color);
        this.setTooltip(config.tooltip);
      }
    };
  });

  registered = true;
}

export function getFullToolboxBlockTypes() {
  return [...Object.keys(CONDITION_BLOCK_LIBRARY), ...Object.keys(BLOCK_LIBRARY)];
}

export function getBlockLibrary() {
  return { ...CONDITION_BLOCK_LIBRARY, ...BLOCK_LIBRARY };
}

export function getActionTypeForBlockType(blockType) {
  return BLOCK_LIBRARY[blockType]?.actionType || null;
}

export function getMoveTowardTargetOptions() {
  return filterOptions(MOVE_TOWARD_TARGET_OPTIONS, currentMoveTowardTargetValues);
}

export function getMoveTowardTargetOptionLabels() {
  return getMoveTowardTargetOptions().map(([label]) => label);
}

export function getCurrentMoveTowardTargetValues() {
  return getMoveTowardTargetOptions().map(([, value]) => value);
}

export function getMoveTowardTargetLabel(value) {
  return MOVE_TOWARD_TARGET_OPTIONS.find(([, optionValue]) => optionValue === value)?.[0] || value;
}

export function getSensorObjectOptions() {
  return filterOptions(FULL_SENSOR_OBJECT_OPTIONS, currentSensorObjectValues);
}

export function getSensorRelationOptions() {
  return filterOptions(FULL_SENSOR_RELATION_OPTIONS, currentSensorRelationValues);
}

export function getSensorObjectOptionLabels() {
  return getSensorObjectOptions().map(([label]) => label);
}

export function getSensorRelationOptionLabels() {
  return getSensorRelationOptions().map(([label]) => label);
}

export function getCurrentSensorObjectValues() {
  return getSensorObjectOptions().map(([, value]) => value);
}

export function getCurrentSensorRelationValues() {
  return getSensorRelationOptions().map(([, value]) => value);
}

export function getSensorObjectLabel(value) {
  return FULL_SENSOR_OBJECT_OPTIONS.find(([, optionValue]) => optionValue === value)?.[0] || value;
}

export function getSensorRelationLabel(value) {
  return FULL_SENSOR_RELATION_OPTIONS.find(([, optionValue]) => optionValue === value)?.[0] || value;
}

export function setAllowedSensorOptions(objectTypes = [], relationTypes = []) {
  currentSensorObjectValues = objectTypes.length
    ? [...objectTypes]
    : FULL_SENSOR_OBJECT_OPTIONS.map(([, value]) => value);
  currentSensorRelationValues = relationTypes.length
    ? [...relationTypes]
    : FULL_SENSOR_RELATION_OPTIONS.map(([, value]) => value);
}

export function setAllowedMoveTowardTargets(targetTypes = []) {
  currentMoveTowardTargetValues = targetTypes.length
    ? [...targetTypes]
    : MOVE_TOWARD_TARGET_OPTIONS.map(([, value]) => value);
}

export function isConditionBlockType(blockType) {
  return Boolean(CONDITION_BLOCK_LIBRARY[blockType]);
}

export function getBlockDisplayLabel(blockType) {
  return getBlockLibrary()[blockType]?.label || blockType;
}

export function getToolboxBlockTypesForMode(app, currentLevel) {
  if (app.state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS && currentLevel) {
    return [...currentLevel.toolboxBlockTypes];
  }
  return getFullToolboxBlockTypes();
}
