import { BLOCK_TYPES, GAME_MODES, HUMAN_TURN_BEHAVIORS, LEVEL_STATUS } from "./constants.js";

const STARTER_EVENT_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="battlegorithms_on_each_turn" x="24" y="24"></block>
</xml>
`.trim();

const LEVEL_DEFINITIONS = [
  {
    id: "move-to-target",
    title: "Level 1: Move to Target",
    description: "Program the ally runner to reach the highlighted target cell.",
    introText: "This first level is a safe practice space. The enemy runners are frozen on purpose so you can focus on programming your ally.",
    tips: [
      "Only the ally runner needs to finish the challenge.",
      "The highlighted square shows the goal cell.",
      "Your program runs every time the ally gets a turn."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [
      BLOCK_TYPES.MOVE_FORWARD,
      BLOCK_TYPES.MOVE_UP_SCREEN,
      BLOCK_TYPES.MOVE_DOWN_SCREEN,
      BLOCK_TYPES.STAY_STILL
    ],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_cell",
      runnerId: "runner_1_AI_AllyP1",
      targetCell: { x: 4, y: 4 }
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 8
    },
    tutorialSteps: [
      {
        id: "level-1-board",
        title: "Meet the Game Board",
        body: "This grid is where the match happens. Your ally starts on the left, and the highlighted square shows the goal for this challenge.",
        targetSelector: "#canvas-container"
      },
      {
        id: "level-1-frozen-enemies",
        title: "Why Are The Enemies Frozen?",
        body: "These enemy runners are intentionally frozen so you can practice programming without pressure. They are teaching props in this level.",
        targetSelector: "#canvas-container"
      },
      {
        id: "level-1-event",
        title: "Programs Start With On Each Turn",
        body: "Every ally program begins with the On Each Turn block. Put the move you want underneath it so the ally knows what to do each time it gets a turn.",
        targetSelector: "#blockly-region"
      },
      {
        id: "level-1-show-tutorial",
        title: "Need A Reminder Later?",
        body: "You can reopen these teaching steps any time by pressing Show Tutorial here.",
        targetSelector: "[data-action=\"replay-tutorial\"]"
      }
    ],
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
    introText: "This level introduces a new goal and a new block. You can now use Move Backward if your ally needs to correct its path.",
    tips: [
      "The flag on the far side is now the target.",
      "Move Backward is newly available in this level.",
      "Only the first action under On Each Turn runs for now."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [
      BLOCK_TYPES.MOVE_FORWARD,
      BLOCK_TYPES.MOVE_BACKWARD,
      BLOCK_TYPES.MOVE_UP_SCREEN,
      BLOCK_TYPES.MOVE_DOWN_SCREEN,
      BLOCK_TYPES.STAY_STILL
    ],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_enemy_flag",
      runnerId: "runner_1_AI_AllyP1"
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 14
    },
    tutorialSteps: [
      {
        id: "level-2-goal",
        title: "New Goal: Reach The Enemy Flag",
        body: "This time the ally must reach the enemy flag on the right side of the board instead of a practice target square.",
        targetSelector: "#canvas-container"
      },
      {
        id: "level-2-new-block",
        title: "New Blockly Tool",
        body: "Move Backward is now available. That lets you recover if your ally overshoots or needs to step back into position.",
        targetSelector: "#blockly-region"
      }
    ],
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
    tips: [...(level.tips || [])],
    tutorialSteps: structuredClone(level.tutorialSteps || []),
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
