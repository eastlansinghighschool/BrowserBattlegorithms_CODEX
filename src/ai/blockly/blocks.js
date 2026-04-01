import * as Blockly from "blockly";
import { AI_ACTION_TYPES, BLOCK_TYPES, GAME_VIEW_MODES } from "../../config/constants.js";

const EVENT_BLOCK_CONFIG = {
  category: "Events",
  color: 35,
  label: "On Each Turn",
  tooltip: "The ally checks the block underneath this every time it gets a turn."
};

const BLOCK_LIBRARY = {
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
  }
};

let registered = false;

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

  Object.entries(BLOCK_LIBRARY).forEach(([type, config]) => {
    Blockly.Blocks[type] = {
      init() {
        this.appendDummyInput().appendField(config.label);
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
  return Object.keys(BLOCK_LIBRARY);
}

export function getBlockLibrary() {
  return BLOCK_LIBRARY;
}

export function getActionTypeForBlockType(blockType) {
  return BLOCK_LIBRARY[blockType]?.actionType || null;
}

export function getToolboxBlockTypesForMode(app, currentLevel) {
  if (app.state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS && currentLevel) {
    return [...currentLevel.toolboxBlockTypes];
  }
  return getFullToolboxBlockTypes();
}
