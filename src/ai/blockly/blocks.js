import * as Blockly from "blockly";
import {
  ADVANCED_COMPARE_OPERATORS,
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
    phrase: null,
    tooltip: "Checks whether the chosen object matches the chosen relation."
  },
  [BLOCK_TYPES.IF_SENSOR_MATCHES_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If",
    phrase: null,
    tooltip: "Checks whether the chosen object matches the chosen relation and lets you choose a different move when it does not."
  },
  [BLOCK_TYPES.IF_BARRIER_IN_FRONT]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If Barrier Is In Front",
    phrase: "Barrier Is In Front",
    tooltip: "Runs the block inside when the square ahead is blocked by a barrier."
  },
  [BLOCK_TYPES.IF_BARRIER_IN_FRONT_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If Barrier Is In Front",
    phrase: "Barrier Is In Front",
    tooltip: "Runs one move when a barrier is directly ahead, and a different move when the way is clear."
  },
  [BLOCK_TYPES.IF_ENEMY_IN_FRONT]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If Enemy Is In Front",
    phrase: "Enemy Is In Front",
    tooltip: "Runs the block inside when an active enemy is directly ahead."
  },
  [BLOCK_TYPES.IF_HAVE_ENEMY_FLAG]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Have Enemy Flag",
    phrase: "I Have Enemy Flag",
    tooltip: "Runs the block inside after this runner has picked up the enemy flag."
  },
  [BLOCK_TYPES.IF_HAVE_ENEMY_FLAG_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Have Enemy Flag",
    phrase: "I Have Enemy Flag",
    tooltip: "Runs one move if the ally has the enemy flag, and a different move if it does not."
  },
  [BLOCK_TYPES.IF_CAN_JUMP]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Can Jump",
    phrase: "I Can Jump",
    tooltip: "Runs the block inside if this runner still has its jump available."
  },
  [BLOCK_TYPES.IF_CAN_JUMP_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Can Jump",
    phrase: "I Can Jump",
    tooltip: "Chooses one move if jump is still available and another if it has already been used."
  },
  [BLOCK_TYPES.IF_CAN_PLACE_BARRIER]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Can Place Barrier",
    phrase: "I Can Place Barrier",
    tooltip: "Runs the block inside if this runner can place a barrier right now."
  },
  [BLOCK_TYPES.IF_CAN_PLACE_BARRIER_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Can Place Barrier",
    phrase: "I Can Place Barrier",
    tooltip: "Chooses one move if a barrier is ready and another if it is not."
  },
  [BLOCK_TYPES.IF_AREA_FREEZE_READY]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If Area Freeze Is Ready",
    phrase: "Area Freeze Is Ready",
    tooltip: "Runs the block inside if this team has not used Area Freeze this round."
  },
  [BLOCK_TYPES.IF_AREA_FREEZE_READY_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If Area Freeze Is Ready",
    phrase: "Area Freeze Is Ready",
    tooltip: "Chooses one move if Area Freeze is still ready this round and another if it is not."
  },
  [BLOCK_TYPES.IF_TEAMMATE_HAS_FLAG]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If Teammate Has Enemy Flag",
    phrase: "Teammate Has Enemy Flag",
    tooltip: "Runs the block inside if another runner on your team is carrying the enemy flag."
  },
  [BLOCK_TYPES.IF_TEAMMATE_HAS_FLAG_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If Teammate Has Enemy Flag",
    phrase: "Teammate Has Enemy Flag",
    tooltip: "Chooses one move if a teammate has the enemy flag and another if no teammate is carrying it."
  },
  [BLOCK_TYPES.IF_ON_MY_SIDE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Am On My Side",
    phrase: "I Am On My Side",
    tooltip: "Runs the block inside if this runner is currently on its own side of the field."
  },
  [BLOCK_TYPES.IF_ON_MY_SIDE_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Am On My Side",
    phrase: "I Am On My Side",
    tooltip: "Chooses one move on your side of the field and another on the enemy side."
  },
  [BLOCK_TYPES.IF_ON_ENEMY_SIDE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Am On Enemy Side",
    phrase: "I Am On Enemy Side",
    tooltip: "Runs the block inside if this runner is currently on the enemy side of the field."
  },
  [BLOCK_TYPES.IF_ON_ENEMY_SIDE_ELSE]: {
    category: "Conditions",
    color: "%{BKY_LOGIC_HUE}",
    label: "If I Am On Enemy Side",
    phrase: "I Am On Enemy Side",
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
  BLOCK_TYPES.IF_ON_ENEMY_SIDE_ELSE,
  BLOCK_TYPES.IF_BOOLEAN_ELSE
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

const ADVANCED_COMPARE_OPERATOR_OPTIONS = [
  ["=", ADVANCED_COMPARE_OPERATORS.EQ],
  ["!=", ADVANCED_COMPARE_OPERATORS.NEQ],
  ["<", ADVANCED_COMPARE_OPERATORS.LT],
  ["<=", ADVANCED_COMPARE_OPERATORS.LTE],
  [">", ADVANCED_COMPARE_OPERATORS.GT],
  [">=", ADVANCED_COMPARE_OPERATORS.GTE]
];

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

const BOOLEAN_VALUE_LIBRARY = {
  [BLOCK_TYPES.BOOLEAN_SENSOR_MATCHES]: {
    category: "Advanced",
    color: "%{BKY_LOGIC_HUE}",
    label: "sensor",
    tooltip: "Returns true when the chosen object matches the chosen relation."
  },
  [BLOCK_TYPES.BOOLEAN_HAVE_ENEMY_FLAG]: {
    category: "Advanced",
    color: "%{BKY_LOGIC_HUE}",
    label: "I have enemy flag",
    tooltip: "Returns true when this runner is carrying the enemy flag."
  },
  [BLOCK_TYPES.BOOLEAN_CAN_JUMP]: {
    category: "Advanced",
    color: "%{BKY_LOGIC_HUE}",
    label: "I can jump",
    tooltip: "Returns true while this runner still has jump available."
  },
  [BLOCK_TYPES.BOOLEAN_CAN_PLACE_BARRIER]: {
    category: "Advanced",
    color: "%{BKY_LOGIC_HUE}",
    label: "I can place barrier",
    tooltip: "Returns true while this runner can place a barrier."
  },
  [BLOCK_TYPES.BOOLEAN_AREA_FREEZE_READY]: {
    category: "Advanced",
    color: "%{BKY_LOGIC_HUE}",
    label: "Area Freeze is ready",
    tooltip: "Returns true when this team has not used Area Freeze this round."
  },
  [BLOCK_TYPES.BOOLEAN_TEAMMATE_HAS_FLAG]: {
    category: "Advanced",
    color: "%{BKY_LOGIC_HUE}",
    label: "teammate has enemy flag",
    tooltip: "Returns true when another runner on this team has the enemy flag."
  },
  [BLOCK_TYPES.BOOLEAN_ON_MY_SIDE]: {
    category: "Advanced",
    color: "%{BKY_LOGIC_HUE}",
    label: "I am on my side",
    tooltip: "Returns true when this runner is on its home half of the field."
  },
  [BLOCK_TYPES.BOOLEAN_ON_ENEMY_SIDE]: {
    category: "Advanced",
    color: "%{BKY_LOGIC_HUE}",
    label: "I am on enemy side",
    tooltip: "Returns true when this runner is on the opposing half of the field."
  },
  [BLOCK_TYPES.LOGIC_AND]: {
    category: "Advanced",
    color: "%{BKY_LOGIC_HUE}",
    label: "and",
    tooltip: "Returns true only when both inputs are true."
  },
  [BLOCK_TYPES.LOGIC_OR]: {
    category: "Advanced",
    color: "%{BKY_LOGIC_HUE}",
    label: "or",
    tooltip: "Returns true when either input is true."
  },
  [BLOCK_TYPES.LOGIC_NOT]: {
    category: "Advanced",
    color: "%{BKY_LOGIC_HUE}",
    label: "not",
    tooltip: "Flips a true/false value."
  },
  [BLOCK_TYPES.VALUE_COMPARE]: {
    category: "Advanced",
    color: "%{BKY_LOGIC_HUE}",
    label: "compare",
    tooltip: "Compares two values using the selected operator."
  }
};

const VALUE_LIBRARY = {
  [BLOCK_TYPES.VALUE_NUMBER]: {
    category: "Advanced",
    color: "%{BKY_MATH_HUE}",
    label: "number",
    tooltip: "A typed number value."
  },
  [BLOCK_TYPES.VALUE_RUNNER_INDEX]: {
    category: "Advanced",
    color: "%{BKY_MATH_HUE}",
    label: "my runner index",
    tooltip: "The stable index of this Blockly-controlled ally on its team."
  },
  [BLOCK_TYPES.VALUE_DISTANCE_TO_TARGET]: {
    category: "Advanced",
    color: "%{BKY_MATH_HUE}",
    label: "distance to",
    tooltip: "Returns Manhattan distance to the chosen target."
  },
  [BLOCK_TYPES.VALUE_RANDOM_ROLL]: {
    category: "Advanced",
    color: "%{BKY_MATH_HUE}",
    label: "random roll (1-6)",
    tooltip: "Returns a random integer from 1 through 6."
  },
  [BLOCK_TYPES.VALUE_PLAY_DIRECTION]: {
    category: "Advanced",
    color: "%{BKY_MATH_HUE}",
    label: "playDirection value",
    tooltip: "Returns 1 or -1 for this runner's team direction."
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
        input.appendField("If");
        if (type === BLOCK_TYPES.IF_SENSOR_MATCHES || type === BLOCK_TYPES.IF_SENSOR_MATCHES_ELSE) {
          input
            .appendField(new Blockly.FieldDropdown(() => getSensorObjectOptions()), "OBJECT")
            .appendField("is")
            .appendField(new Blockly.FieldDropdown(() => getSensorRelationOptions()), "RELATION");
        } else if (config.phrase) {
          input.appendField(config.phrase);
        }
        this.appendStatementInput("DO");
        if (CONDITION_TYPES_WITH_ELSE.has(type)) {
          this.appendStatementInput("ELSE").appendField("else");
        }
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(config.color);
        this.setTooltip(config.tooltip);
      }
    };
  });

  Blockly.Blocks[BLOCK_TYPES.IF_BOOLEAN] = {
    init() {
      this.appendValueInput("BOOL").setCheck("Boolean").appendField("If");
      this.appendStatementInput("DO");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("%{BKY_LOGIC_HUE}");
      this.setTooltip("Runs the blocks inside when the boolean input is true.");
    }
  };

  Blockly.Blocks[BLOCK_TYPES.IF_BOOLEAN_ELSE] = {
    init() {
      this.appendValueInput("BOOL").setCheck("Boolean").appendField("If");
      this.appendStatementInput("DO");
      this.appendStatementInput("ELSE").appendField("else");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("%{BKY_LOGIC_HUE}");
      this.setTooltip("Chooses one branch when the boolean input is true and another when it is false.");
    }
  };

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

  Object.entries(BOOLEAN_VALUE_LIBRARY).forEach(([type, config]) => {
    Blockly.Blocks[type] = {
      init() {
        if (type === BLOCK_TYPES.BOOLEAN_SENSOR_MATCHES) {
          this.appendDummyInput()
            .appendField("sensor")
            .appendField(new Blockly.FieldDropdown(() => getSensorObjectOptions()), "OBJECT")
            .appendField("is")
            .appendField(new Blockly.FieldDropdown(() => getSensorRelationOptions()), "RELATION");
        } else if (type === BLOCK_TYPES.LOGIC_AND || type === BLOCK_TYPES.LOGIC_OR) {
          this.appendValueInput("LEFT").setCheck("Boolean");
          this.appendValueInput("RIGHT").setCheck("Boolean").appendField(config.label);
        } else if (type === BLOCK_TYPES.LOGIC_NOT) {
          this.appendValueInput("VALUE").setCheck("Boolean").appendField("not");
        } else if (type === BLOCK_TYPES.VALUE_COMPARE) {
          this.appendValueInput("LEFT").setCheck("Number");
          this.appendDummyInput().appendField(new Blockly.FieldDropdown(ADVANCED_COMPARE_OPERATOR_OPTIONS), "OPERATOR");
          this.appendValueInput("RIGHT").setCheck("Number");
        } else {
          this.appendDummyInput().appendField(config.label);
        }
        this.setOutput(true, "Boolean");
        this.setColour(config.color);
        this.setTooltip(config.tooltip);
      }
    };
  });

  Object.entries(VALUE_LIBRARY).forEach(([type, config]) => {
    Blockly.Blocks[type] = {
      init() {
        if (type === BLOCK_TYPES.VALUE_NUMBER) {
          this.appendDummyInput().appendField(new Blockly.FieldNumber(0, -99, 99, 1), "VALUE");
        } else if (type === BLOCK_TYPES.VALUE_DISTANCE_TO_TARGET) {
          this.appendDummyInput()
            .appendField("distance to")
            .appendField(new Blockly.FieldDropdown(() => getMoveTowardTargetOptions()), "TARGET");
        } else {
          this.appendDummyInput().appendField(config.label);
        }
        this.setOutput(true, "Number");
        this.setColour(config.color);
        this.setTooltip(config.tooltip);
      }
    };
  });

  registered = true;
}

export function getFullToolboxBlockTypes() {
  return [
    ...Object.keys(CONDITION_BLOCK_LIBRARY),
    BLOCK_TYPES.IF_BOOLEAN,
    BLOCK_TYPES.IF_BOOLEAN_ELSE,
    ...Object.keys(BLOCK_LIBRARY),
    ...Object.keys(BOOLEAN_VALUE_LIBRARY),
    ...Object.keys(VALUE_LIBRARY)
  ];
}

export function getBlockLibrary() {
  return {
    ...CONDITION_BLOCK_LIBRARY,
    [BLOCK_TYPES.IF_BOOLEAN]: {
      category: "Advanced",
      color: "%{BKY_LOGIC_HUE}",
      label: "If [boolean]"
    },
    [BLOCK_TYPES.IF_BOOLEAN_ELSE]: {
      category: "Advanced",
      color: "%{BKY_LOGIC_HUE}",
      label: "If [boolean] else"
    },
    ...BLOCK_LIBRARY,
    ...BOOLEAN_VALUE_LIBRARY,
    ...VALUE_LIBRARY
  };
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
  return Boolean(CONDITION_BLOCK_LIBRARY[blockType] || blockType === BLOCK_TYPES.IF_BOOLEAN || blockType === BLOCK_TYPES.IF_BOOLEAN_ELSE);
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
