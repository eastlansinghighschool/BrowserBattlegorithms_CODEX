import { BLOCK_TYPES, GAME_MODES, LEVEL_STATUS } from "./constants.js";

const STARTER_FORWARD_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="battlegorithms_move_forward" x="20" y="20"></block>
</xml>
`.trim();

const LEVEL_DEFINITIONS = [
  {
    id: "move-to-target",
    title: "Level 1: Move to Target",
    description: "Program the ally runner to reach the highlighted target cell.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    toolboxBlockTypes: [
      BLOCK_TYPES.MOVE_FORWARD,
      BLOCK_TYPES.MOVE_UP_SCREEN,
      BLOCK_TYPES.MOVE_DOWN_SCREEN,
      BLOCK_TYPES.STAY_STILL
    ],
    initialBlocklyXml: STARTER_FORWARD_XML,
    winCondition: {
      type: "runner_reaches_cell",
      runnerId: "runner_1_AI_AllyP1",
      targetCell: { x: 4, y: 4 }
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 8
    },
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 1, gridY: 1 },
        runner_1_AI_AllyP1: { gridX: 1, gridY: 4 },
        runner_2_Npc1: { gridX: 10, gridY: 1, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      }
    }
  },
  {
    id: "reach-enemy-flag",
    title: "Level 2: Reach Enemy Flag",
    description: "Expand the program so the ally reaches the enemy flag cell on the far side of the map.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    toolboxBlockTypes: [
      BLOCK_TYPES.MOVE_FORWARD,
      BLOCK_TYPES.MOVE_BACKWARD,
      BLOCK_TYPES.MOVE_UP_SCREEN,
      BLOCK_TYPES.MOVE_DOWN_SCREEN,
      BLOCK_TYPES.STAY_STILL
    ],
    initialBlocklyXml: STARTER_FORWARD_XML,
    winCondition: {
      type: "runner_reaches_enemy_flag",
      runnerId: "runner_1_AI_AllyP1"
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 14
    },
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 1, gridY: 1 },
        runner_1_AI_AllyP1: { gridX: 1, gridY: 4 },
        runner_2_Npc1: { gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      }
    }
  }
];

export function getLevelDefinitions() {
  return LEVEL_DEFINITIONS.map((level) => ({
    ...level,
    toolboxBlockTypes: [...level.toolboxBlockTypes],
    winCondition: { ...level.winCondition },
    failureCondition: level.failureCondition ? { ...level.failureCondition } : null,
    setupOverrides: structuredClone(level.setupOverrides)
  }));
}

export function createInitialLevelProgress() {
  return {
    "move-to-target": LEVEL_STATUS.AVAILABLE,
    "reach-enemy-flag": LEVEL_STATUS.LOCKED
  };
}
