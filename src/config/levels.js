import {
  BLOCK_TYPES,
  GAME_MODES,
  HUMAN_TURN_BEHAVIORS,
  UNLOCK_ALL_GUIDED_LEVELS_FOR_TESTING,
  LEVEL_STATUS,
  MOVE_TOWARD_TARGETS,
  SENSOR_OBJECT_TYPES,
  SENSOR_RELATION_TYPES
} from "./constants.js";

const STARTER_EVENT_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="battlegorithms_on_each_turn" x="24" y="24"></block>
</xml>
`.trim();

const SCORE_SWITCH_DEMO_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="battlegorithms_on_each_turn" x="24" y="24">
    <next>
      <block type="battlegorithms_if_have_enemy_flag_else">
        <statement name="DO">
          <block type="battlegorithms_move_backward"></block>
        </statement>
        <statement name="ELSE">
          <block type="battlegorithms_move_forward"></block>
        </statement>
      </block>
    </next>
  </block>
</xml>
`.trim();

const BARRIER_DETOUR_DEMO_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="battlegorithms_on_each_turn" x="24" y="24">
    <next>
      <block type="battlegorithms_if_barrier_in_front_else">
        <statement name="DO">
          <block type="battlegorithms_move_down_screen"></block>
        </statement>
        <statement name="ELSE">
          <block type="battlegorithms_move_forward"></block>
        </statement>
      </block>
    </next>
  </block>
</xml>
`.trim();

const SENSOR_BARRIER_DEMO_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="battlegorithms_on_each_turn" x="24" y="24">
    <next>
      <block type="battlegorithms_if_sensor_matches_else">
        <field name="OBJECT">BARRIER</field>
        <field name="RELATION">DIRECTLY_IN_FRONT</field>
        <statement name="DO">
          <block type="battlegorithms_move_down_screen"></block>
        </statement>
        <statement name="ELSE">
          <block type="battlegorithms_move_forward"></block>
        </statement>
      </block>
    </next>
  </block>
</xml>
`.trim();

const FIND_HUMAN_DEMO_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="battlegorithms_on_each_turn" x="24" y="24">
    <next>
      <block type="battlegorithms_if_sensor_matches_else">
        <field name="OBJECT">HUMAN_RUNNER</field>
        <field name="RELATION">ANYWHERE_ABOVE</field>
        <statement name="DO">
          <block type="battlegorithms_move_up_screen"></block>
        </statement>
        <statement name="ELSE">
          <block type="battlegorithms_if_sensor_matches_else">
            <field name="OBJECT">HUMAN_RUNNER</field>
            <field name="RELATION">ANYWHERE_FORWARD</field>
            <statement name="DO">
              <block type="battlegorithms_move_forward"></block>
            </statement>
            <statement name="ELSE">
              <block type="battlegorithms_move_down_screen"></block>
            </statement>
          </block>
        </statement>
      </block>
    </next>
  </block>
</xml>
`.trim();

const BRING_IT_HOME_DEMO_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="battlegorithms_on_each_turn" x="24" y="24">
    <next>
      <block type="battlegorithms_if_have_enemy_flag_else">
        <statement name="DO">
          <block type="battlegorithms_move_toward">
            <field name="TARGET">MY_BASE</field>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="battlegorithms_move_toward">
            <field name="TARGET">ENEMY_FLAG</field>
          </block>
        </statement>
      </block>
    </next>
  </block>
</xml>
`.trim();

const ENEMY_NEARBY_DEMO_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="battlegorithms_on_each_turn" x="24" y="24">
    <next>
      <block type="battlegorithms_if_sensor_matches_else">
        <field name="OBJECT">ENEMY_RUNNER</field>
        <field name="RELATION">WITHIN_2</field>
        <statement name="DO">
          <block type="battlegorithms_move_up_screen"></block>
        </statement>
        <statement name="ELSE">
          <block type="battlegorithms_move_forward"></block>
        </statement>
      </block>
    </next>
  </block>
</xml>
`.trim();

const JUMP_THE_GAP_DEMO_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="battlegorithms_on_each_turn" x="24" y="24">
    <next>
      <block type="battlegorithms_jump_forward"></block>
    </next>
  </block>
</xml>
`.trim();

const JUMP_IF_READY_DEMO_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="battlegorithms_on_each_turn" x="24" y="24">
    <next>
      <block type="battlegorithms_if_can_jump_else">
        <statement name="DO">
          <block type="battlegorithms_jump_forward"></block>
        </statement>
        <statement name="ELSE">
          <block type="battlegorithms_move_forward"></block>
        </statement>
      </block>
    </next>
  </block>
</xml>
`.trim();

const STAY_STILL_DEMO_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="battlegorithms_on_each_turn" x="24" y="24">
    <next>
      <block type="battlegorithms_if_sensor_matches_else">
        <field name="OBJECT">BARRIER</field>
        <field name="RELATION">DIRECTLY_IN_FRONT</field>
        <statement name="DO">
          <block type="battlegorithms_stay_still"></block>
        </statement>
        <statement name="ELSE">
          <block type="battlegorithms_move_forward"></block>
        </statement>
      </block>
    </next>
  </block>
</xml>
`.trim();

const RELAY_RACE_DEMO_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="battlegorithms_on_each_turn" x="24" y="24">
    <next>
      <block type="battlegorithms_if_teammate_has_flag_else">
        <statement name="DO">
          <block type="battlegorithms_move_toward">
            <field name="TARGET">HUMAN_RUNNER</field>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="battlegorithms_move_forward"></block>
        </statement>
      </block>
    </next>
  </block>
</xml>
`.trim();

const FREEZE_THE_LANE_DEMO_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="battlegorithms_on_each_turn" x="24" y="24">
    <next>
      <block type="battlegorithms_if_area_freeze_ready_else">
        <statement name="DO">
          <block type="battlegorithms_freeze_opponents"></block>
        </statement>
        <statement name="ELSE">
          <block type="battlegorithms_move_toward">
            <field name="TARGET">ENEMY_FLAG</field>
          </block>
        </statement>
      </block>
    </next>
  </block>
</xml>
`.trim();

const BASIC_MOVEMENT_BLOCKS = [
  BLOCK_TYPES.MOVE_FORWARD,
  BLOCK_TYPES.MOVE_UP_SCREEN,
  BLOCK_TYPES.MOVE_DOWN_SCREEN,
  BLOCK_TYPES.STAY_STILL
];

const EXTENDED_MOVEMENT_BLOCKS = [
  BLOCK_TYPES.MOVE_FORWARD,
  BLOCK_TYPES.MOVE_BACKWARD,
  BLOCK_TYPES.MOVE_UP_SCREEN,
  BLOCK_TYPES.MOVE_DOWN_SCREEN,
  BLOCK_TYPES.STAY_STILL
];

const GENERIC_SENSOR_BLOCKS = [
  BLOCK_TYPES.IF_SENSOR_MATCHES,
  BLOCK_TYPES.IF_SENSOR_MATCHES_ELSE
];

const MOVE_TOWARD_BLOCKS = [BLOCK_TYPES.MOVE_TOWARD];

const JUMP_BLOCKS = [BLOCK_TYPES.JUMP_FORWARD];

const JUMP_CONDITION_BLOCKS = [
  BLOCK_TYPES.IF_CAN_JUMP,
  BLOCK_TYPES.IF_CAN_JUMP_ELSE
];

const BARRIER_PLACEMENT_BLOCKS = [BLOCK_TYPES.PLACE_BARRIER];

const BARRIER_READY_BLOCKS = [
  BLOCK_TYPES.IF_CAN_PLACE_BARRIER,
  BLOCK_TYPES.IF_CAN_PLACE_BARRIER_ELSE
];

const TEAMMATE_FLAG_BLOCKS = [
  BLOCK_TYPES.IF_TEAMMATE_HAS_FLAG,
  BLOCK_TYPES.IF_TEAMMATE_HAS_FLAG_ELSE
];

const TERRITORY_BLOCKS = [
  BLOCK_TYPES.IF_ON_MY_SIDE,
  BLOCK_TYPES.IF_ON_MY_SIDE_ELSE,
  BLOCK_TYPES.IF_ON_ENEMY_SIDE,
  BLOCK_TYPES.IF_ON_ENEMY_SIDE_ELSE
];

const AREA_FREEZE_BLOCKS = [
  BLOCK_TYPES.FREEZE_OPPONENTS,
  BLOCK_TYPES.IF_AREA_FREEZE_READY,
  BLOCK_TYPES.IF_AREA_FREEZE_READY_ELSE
];

const ADVANCED_BOOLEAN_WRAPPERS = [
  BLOCK_TYPES.IF_BOOLEAN,
  BLOCK_TYPES.IF_BOOLEAN_ELSE
];

const ADVANCED_BOOLEAN_VALUES = [
  BLOCK_TYPES.BOOLEAN_SENSOR_MATCHES,
  BLOCK_TYPES.BOOLEAN_HAVE_ENEMY_FLAG,
  BLOCK_TYPES.BOOLEAN_CAN_JUMP,
  BLOCK_TYPES.BOOLEAN_CAN_PLACE_BARRIER,
  BLOCK_TYPES.BOOLEAN_AREA_FREEZE_READY,
  BLOCK_TYPES.BOOLEAN_TEAMMATE_HAS_FLAG,
  BLOCK_TYPES.BOOLEAN_ON_MY_SIDE,
  BLOCK_TYPES.BOOLEAN_ON_ENEMY_SIDE,
  BLOCK_TYPES.LOGIC_AND,
  BLOCK_TYPES.LOGIC_OR,
  BLOCK_TYPES.LOGIC_NOT,
  BLOCK_TYPES.VALUE_COMPARE
];

const ADVANCED_NUMBER_VALUES = [
  BLOCK_TYPES.VALUE_NUMBER,
  BLOCK_TYPES.VALUE_RUNNER_INDEX,
  BLOCK_TYPES.VALUE_DISTANCE_TO_TARGET,
  BLOCK_TYPES.VALUE_RANDOM_ROLL,
  BLOCK_TYPES.VALUE_PLAY_DIRECTION
];

const ADVANCED_ALL_BLOCKS = [
  ...ADVANCED_BOOLEAN_WRAPPERS,
  ...ADVANCED_BOOLEAN_VALUES,
  ...ADVANCED_NUMBER_VALUES
];

const ADVANCED_CAPSTONE_BLOCKS = [
  ...ADVANCED_ALL_BLOCKS,
  ...GENERIC_SENSOR_BLOCKS,
  ...MOVE_TOWARD_BLOCKS,
  ...TEAMMATE_FLAG_BLOCKS,
  ...TERRITORY_BLOCKS,
  ...AREA_FREEZE_BLOCKS,
  ...BARRIER_READY_BLOCKS,
  ...BARRIER_PLACEMENT_BLOCKS,
  ...JUMP_CONDITION_BLOCKS,
  ...JUMP_BLOCKS,
  ...EXTENDED_MOVEMENT_BLOCKS,
  BLOCK_TYPES.MOVE_RANDOMLY
];

function getSemanticRoleForTeamId(teamId) {
  return Number(teamId) === 1 ? "player" : "opponent";
}

function getDefaultPlayDirectionForRole(role) {
  return role === "player" ? 1 : -1;
}

function deriveRunnerSlotFromId(runnerId) {
  if (runnerId.includes("HumanP")) {
    return "human";
  }
  if (runnerId.includes("AI_AllyP") && runnerId.endsWith("_3")) {
    return "ally3";
  }
  if (runnerId.includes("AI_AllyP") && runnerId.endsWith("_2")) {
    return "ally2";
  }
  if (runnerId.includes("AI_Ally")) {
    return "ally";
  }
  if (runnerId.includes("Npc1")) {
    return "npc1";
  }
  if (runnerId.includes("Npc2")) {
    return "npc2";
  }
  if (runnerId.includes("Npc3")) {
    return "npc3";
  }
  throw new Error(`Unsupported runner id in level setup: ${runnerId}`);
}

function normalizeLegacyLevelSetup(setupOverrides = {}) {
  if (setupOverrides.teams) {
    const normalizedTeams = structuredClone(setupOverrides.teams);
    const playerDirection = normalizedTeams.player?.playDirection ?? getDefaultPlayDirectionForRole("player");
    const opponentDirection = normalizedTeams.opponent?.playDirection ?? getDefaultPlayDirectionForRole("opponent");

    if (playerDirection === opponentDirection) {
      throw new Error("Level setup requires player and opponent teams to use different playDirection values.");
    }

    return {
      pointsToWin: setupOverrides.pointsToWin || 1,
      autoStayHumanRunnerIds: [...(setupOverrides.autoStayHumanRunnerIds || [])],
      teams: {
        player: {
          playDirection: playerDirection,
          runners: structuredClone(normalizedTeams.player?.runners || [])
        },
        opponent: {
          playDirection: opponentDirection,
          runners: structuredClone(normalizedTeams.opponent?.runners || [])
        }
      },
      flags: structuredClone(setupOverrides.flags || {}),
      barriers: structuredClone(setupOverrides.barriers || [])
    };
  }

  const teams = {
    player: {
      playDirection: getDefaultPlayDirectionForRole("player"),
      runners: []
    },
    opponent: {
      playDirection: getDefaultPlayDirectionForRole("opponent"),
      runners: []
    }
  };

  for (const [runnerId, override] of Object.entries(setupOverrides.runnerOverrides || {})) {
    const teamId = Number(runnerId.split("_")[1]);
    const role = getSemanticRoleForTeamId(teamId);
    const playDirection = override.playDirection ?? teams[role].playDirection;
    if (teams[role].runners.length > 0 && teams[role].playDirection !== playDirection) {
      throw new Error(`Level setup mixes playDirection values within ${role} team.`);
    }
    teams[role].playDirection = playDirection;
    teams[role].runners.push({
      slot: deriveRunnerSlotFromId(runnerId),
      ...override
    });
  }

  const flags = Object.fromEntries(
    Object.entries(setupOverrides.flagOverrides || {}).map(([teamId, override]) => [
      getSemanticRoleForTeamId(teamId),
      { ...override }
    ])
  );

  return {
    pointsToWin: setupOverrides.pointsToWin || 1,
    autoStayHumanRunnerIds: [...(setupOverrides.autoStayHumanRunnerIds || [])],
    teams,
    flags,
    barriers: structuredClone(setupOverrides.barriers || [])
  };
}

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
    toolboxBlockTypes: [...BASIC_MOVEMENT_BLOCKS],
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
    toolboxBlockTypes: [...EXTENDED_MOVEMENT_BLOCKS],
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
  },
  {
    id: "score-a-point",
    title: "Level 3: Score a Point",
    description: "Bring the enemy flag back to your home base so your team scores.",
    introText: "Now the ally needs two different ideas: go get the flag, then head home once it has it.",
    tips: [
      "The ally scores by carrying the enemy flag back into the blue home area.",
      "You can use either If I Have Enemy Flag or the new else version to switch plans after pickup.",
      "Only the first move the ally reaches each turn is the one it will perform.",
      "The practice enemies are still frozen so you can focus on the scoring idea."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [
      BLOCK_TYPES.IF_HAVE_ENEMY_FLAG,
      BLOCK_TYPES.IF_HAVE_ENEMY_FLAG_ELSE,
      ...EXTENDED_MOVEMENT_BLOCKS
    ],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "team_scores_point",
      teamId: 1,
      runnerId: "runner_1_AI_AllyP1"
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 20
    },
    tutorialSteps: [
      {
        id: "level-3-flag",
        title: "The Flag Is The New Goal",
        body: "This time, reaching the enemy flag is only the first half of the job. Your ally has to bring it all the way back home.",
        targetSelector: "#canvas-container"
      },
      {
        id: "level-3-score",
        title: "Scoring Means Bringing It Home",
        body: "A point is scored when the ally carries the enemy flag back into the blue home area on the left side.",
        targetSelector: "#canvas-container"
      },
      {
        id: "level-3-condition",
        title: "New Blockly Tool: If I Have Enemy Flag",
        body: "This level adds two versions of the flag check. You can use the simple If block, or the else version to choose one move before pickup and another after pickup.",
        targetSelector: "#blockly-region",
        demoBlocklyXml: SCORE_SWITCH_DEMO_XML,
        demoTitle: "Example flag switch",
        demoCaption: "Before pickup, move out toward the flag. After pickup, switch to the homeward move."
      },
      {
        id: "level-3-first-action",
        title: "Only The First Move Runs",
        body: "Each ally turn, the game follows your blocks until it reaches the first move to perform. That means a smart setup can work with either If or the else version.",
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
  },
  {
    id: "barrier-detour",
    title: "Level 4: Barrier Detour",
    description: "Use a condition so the ally reacts when a barrier blocks the path ahead.",
    introText: "The direct lane is blocked now. Your ally needs a backup move when the way forward is not clear.",
    tips: [
      "The obstacle in front of the ally is intentional.",
      "You can use either If Barrier Is In Front or the new else version.",
      "This level is about choosing between a detour move and a normal forward move.",
      "You still only get one action each ally turn."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [
      BLOCK_TYPES.IF_BARRIER_IN_FRONT,
      BLOCK_TYPES.IF_BARRIER_IN_FRONT_ELSE,
      ...EXTENDED_MOVEMENT_BLOCKS
    ],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_cell",
      runnerId: "runner_1_AI_AllyP1",
      targetCell: { x: 6, y: 4 }
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 12
    },
    tutorialSteps: [
      {
        id: "level-4-barrier",
        title: "A Barrier Blocks The Direct Path",
        body: "The ally cannot keep moving straight ahead this time. It needs to notice the obstacle and choose another move.",
        targetSelector: "#canvas-container"
      },
      {
        id: "level-4-condition",
        title: "New Blockly Tool: If Barrier Is In Front",
        body: "This level adds two versions of the barrier check. You can use the simple If block, or the else version to choose a detour move when blocked and a forward move when clear.",
        targetSelector: "#blockly-region",
        demoBlocklyXml: BARRIER_DETOUR_DEMO_XML,
        demoTitle: "Example detour program",
        demoCaption: "When the path ahead is blocked, this program dips down. Otherwise it keeps moving forward."
      },
      {
        id: "level-4-first-action",
        title: "The First Move Reached Is The One That Runs",
        body: "Each turn, the ally follows your blocks until it reaches the first move to perform. The else version can make that choice easier to see.",
        targetSelector: "#blockly-region"
      }
    ],
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 1, gridY: 1 },
        runner_1_AI_AllyP1: { gridX: 1, gridY: 3 },
        runner_2_Npc1: { gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      },
      barriers: [
        { gridX: 2, gridY: 3, ownerRunnerId: "level_barrier_1" }
      ]
    }
  },
  {
    id: "mirror-forward",
    title: "Level 5: Forward Works Both Ways",
    description: "Use the same Move Forward idea even when the ally starts on the opposite side of the board.",
    introText: "Forward does not mean right on the screen. Forward means toward this runner's goal direction.",
    tips: [
      "The ally starts on the right this time.",
      "Move Forward still means toward the runner's forward direction.",
      "This level teaches the playDirection idea before the new sensing blocks."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...BASIC_MOVEMENT_BLOCKS],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_cell",
      runnerId: "runner_1_AI_AllyP1",
      targetCell: { x: 7, y: 4 }
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 6
    },
    tutorialSteps: [
      {
        id: "level-5-mirror",
        title: "Forward Is Relative",
        body: "This ally starts on the opposite side. Forward still works because it follows the runner's own goal direction, not the screen.",
        targetSelector: "#canvas-container"
      },
      {
        id: "level-5-forward",
        title: "The Same Block, A Different Facing",
        body: "Try using Move Forward again. This is the same idea as before, even though the ally is starting from the right side.",
        targetSelector: "#blockly-region"
      }
    ],
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 10, gridY: 1, playDirection: -1 },
        runner_1_AI_AllyP1: { gridX: 10, gridY: 4, playDirection: -1 },
        runner_2_Npc1: { gridX: 1, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999, playDirection: 1 },
        runner_2_Npc2: { gridX: 1, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999, playDirection: 1 }
      }
    }
  },
  {
    id: "sensor-barrier-branch",
    title: "Level 6: Barrier Sensor Branch",
    description: "Use the new generic sensor block to check for a barrier directly in front.",
    introText: "Now the sensing system becomes more flexible. The same block shape can check different objects and different relations.",
    tips: [
      "In this level, the sensor block is only set up for barriers directly in front.",
      "You can use either the simple sensor If block or the else version.",
      "This is the first step toward a more flexible sensing language."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...GENERIC_SENSOR_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    sensorObjectTypes: [SENSOR_OBJECT_TYPES.BARRIER],
    sensorRelationTypes: [SENSOR_RELATION_TYPES.DIRECTLY_IN_FRONT],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_cell",
      runnerId: "runner_1_AI_AllyP1",
      targetCell: { x: 6, y: 4 }
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 12
    },
    tutorialSteps: [
      {
        id: "level-6-generic-sensor",
        title: "One Block Shape, Many Sensor Ideas",
        body: "The new sensor block lets you pick what to look for and how to describe its position. Here it is focused on a barrier directly in front.",
        targetSelector: "#blockly-region",
        demoBlocklyXml: SENSOR_BARRIER_DEMO_XML,
        demoTitle: "Example sensor branch",
        demoCaption: "This version uses the new generic sensor block to detect a barrier directly in front, then detours only when needed."
      },
      {
        id: "level-6-barrier",
        title: "Notice The Barrier Before Moving",
        body: "If a barrier is directly in front, choose a detour move. If not, the ally can keep moving forward.",
        targetSelector: "#canvas-container"
      }
    ],
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 1, gridY: 1 },
        runner_1_AI_AllyP1: { gridX: 1, gridY: 3 },
        runner_2_Npc1: { gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      },
      barriers: [
        { gridX: 2, gridY: 3, ownerRunnerId: "level_barrier_sensor_1" }
      ]
    }
  },
  {
    id: "watch-the-wall",
    title: "Level 7: Watch the Wall",
    description: "Use the generic sensor to detect an edge or wall and steer around it.",
    introText: "The same sensor family can notice map walls too, not just placed barriers.",
    tips: [
      "Edge or wall is a single beginner-friendly sensing target in this phase.",
      "This map uses real wall cells instead of a temporary barrier.",
      "You still only get one move each ally turn."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "complex",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...GENERIC_SENSOR_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    sensorObjectTypes: [SENSOR_OBJECT_TYPES.EDGE_OR_WALL],
    sensorRelationTypes: [SENSOR_RELATION_TYPES.DIRECTLY_IN_FRONT],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_cell",
      runnerId: "runner_1_AI_AllyP1",
      targetCell: { x: 5, y: 5 }
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 10
    },
    tutorialSteps: [
      {
        id: "level-7-wall",
        title: "Walls Count Too",
        body: "The Edge or Wall option can notice map geometry. Here, the ally needs to react to wall cells in the way.",
        targetSelector: "#canvas-container"
      },
      {
        id: "level-7-relation",
        title: "Relation Means How The Object Is Positioned",
        body: "The relation dropdown tells the sensor what kind of position to check. This level uses directly in front.",
        targetSelector: "#blockly-region"
      }
    ],
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 1, gridY: 1 },
        runner_1_AI_AllyP1: { gridX: 2, gridY: 3 },
        runner_2_Npc1: { gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      }
    }
  },
  {
    id: "find-the-human",
    title: "Level 8: Find the Human",
    description: "Use directional sensing to move the ally toward the human runner.",
    introText: "Now the sensor can describe where a target is anywhere on the board, not just one square away.",
    tips: [
      "Use the human runner as the sensed object.",
      "The highlighted support square next to the human is the goal, not the occupied human cell.",
      "Anywhere forward and anywhere above are especially helpful here.",
      "This is a good level for chaining several sensor checks in order."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...GENERIC_SENSOR_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    sensorObjectTypes: [SENSOR_OBJECT_TYPES.HUMAN_RUNNER],
    sensorRelationTypes: [
      SENSOR_RELATION_TYPES.ANYWHERE_FORWARD,
      SENSOR_RELATION_TYPES.ANYWHERE_BEHIND,
      SENSOR_RELATION_TYPES.ANYWHERE_ABOVE,
      SENSOR_RELATION_TYPES.ANYWHERE_BELOW
    ],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_cell",
      runnerId: "runner_1_AI_AllyP1",
      targetCell: { x: 5, y: 2 }
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 10
    },
    tutorialSteps: [
      {
        id: "level-8-human",
        title: "Use A Sensor To Find The Human",
        body: "The sensor block can now look for the human runner and describe whether that runner is forward, behind, above, or below. Your goal is to guide the ally to the marked support square beside the human.",
        targetSelector: "#blockly-region",
        demoBlocklyXml: FIND_HUMAN_DEMO_XML,
        demoTitle: "Example support-route program",
        demoCaption: "This pattern lines up with the human first, then moves forward into the marked support square beside them."
      },
      {
        id: "level-8-axes",
        title: "Forward And Above Are Different Ideas",
        body: "Forward and behind use the ally's play direction. Above and below still use the screen.",
        targetSelector: "#canvas-container"
      }
    ],
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 6, gridY: 2 },
        runner_1_AI_AllyP1: { gridX: 1, gridY: 5 },
        runner_2_Npc1: { gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      },
      barriers: [
        { gridX: 6, gridY: 1, ownerRunnerId: "level_find_human_barrier_1" },
        { gridX: 7, gridY: 2, ownerRunnerId: "level_find_human_barrier_2" },
        { gridX: 6, gridY: 3, ownerRunnerId: "level_find_human_barrier_3" }
      ]
    }
  },
  {
    id: "find-the-enemy-flag",
    title: "Level 9: Find the Enemy Flag",
    description: "Use directional sensing to guide the ally to the enemy flag.",
    introText: "The same sensing pattern can point at goals like the enemy flag, not just runners.",
    tips: [
      "This time the target is the enemy flag instead of the human runner.",
      "The relation dropdown still describes the flag's position relative to the ally.",
      "Notice how the same block shape can work on different objects."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...GENERIC_SENSOR_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    sensorObjectTypes: [SENSOR_OBJECT_TYPES.ENEMY_FLAG],
    sensorRelationTypes: [
      SENSOR_RELATION_TYPES.ANYWHERE_FORWARD,
      SENSOR_RELATION_TYPES.ANYWHERE_BEHIND,
      SENSOR_RELATION_TYPES.ANYWHERE_ABOVE,
      SENSOR_RELATION_TYPES.ANYWHERE_BELOW
    ],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_enemy_flag",
      runnerId: "runner_1_AI_AllyP1"
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 12
    },
    tutorialSteps: [
      {
        id: "level-9-flag-sensor",
        title: "Sense The Flag's Position",
        body: "The sensor block can also look for the enemy flag. Use the same forward, behind, above, and below ideas to steer toward it.",
        targetSelector: "#blockly-region"
      },
      {
        id: "level-9-reuse",
        title: "Reusable Thinking",
        body: "You are reusing the same condition pattern on a different object. That is a big step toward more flexible programs.",
        targetSelector: "#canvas-container"
      }
    ],
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 1, gridY: 1 },
        runner_1_AI_AllyP1: { gridX: 1, gridY: 6 },
        runner_2_Npc1: { gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      },
      flagOverrides: {
        2: { gridX: 8, gridY: 3 }
      }
    }
  },
  {
    id: "human-runner-practice",
    title: "Level 10: Human Runner Practice",
    description: "Try the human runner controls so you know what you can do during free play.",
    introText: "This level is about you, not the Blockly ally. Move the human runner with the keyboard and try at least one special action before reaching the goal.",
    tips: [
      "Use W A S D to move the human runner on screen.",
      "Press J or F to jump, B to place a barrier, and X to stay still.",
      "The goal only counts after you have used at least one special action first.",
      "Blockly still exists beside the board, but this lesson is teaching direct player control."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT,
    toolboxBlockTypes: [...BASIC_MOVEMENT_BLOCKS],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_cell_after_action",
      runnerId: "runner_1_HumanP1",
      targetCell: { x: 4, y: 4 },
      actionTypes: [
        "JUMP_FORWARD",
        "PLACE_BARRIER_FORWARD",
        "STAY_STILL"
      ]
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 200
    },
    tutorialSteps: [
      {
        id: "level-10-human-focus",
        title: "Now You Control The Human Runner",
        body: "This lesson pauses the ally idea for a moment so you can practice what the human runner does in the match.",
        targetSelector: "#canvas-container"
      },
      {
        id: "level-10-human-keys",
        title: "Keyboard Controls",
        body: "Use W A S D to move. Press J or F to jump, B to place a barrier, and X to stay still. In free play, these human actions happen alongside your ally program.",
        targetSelector: "#score-display"
      },
      {
        id: "level-10-human-special",
        title: "Try One Special Action First",
        body: "This challenge only passes if you reach the goal after using at least one special action like jump, place barrier, or stay still.",
        targetSelector: "#canvas-container"
      }
    ],
    setupOverrides: {
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 1, gridY: 4 },
        runner_1_AI_AllyP1: { gridX: 1, gridY: 1, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc1: { gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      },
      barriers: [
        { gridX: 2, gridY: 4, ownerRunnerId: "level_human_barrier_1" }
      ]
    }
  },
  {
    id: "move-toward-flag",
    title: "Level 11: Shortcut Block - Move Toward the Flag",
    description: "Use the Move Toward helper block to take one smart step toward the enemy flag.",
    introText: "Move Toward is a shortcut block. It chooses one step toward a target, but it does not magically find a full path.",
    tips: [
      "This helper chooses one move each turn, not a whole route.",
      "It works best on open maps and simple corridors.",
      "You can still compare it with the regular movement blocks."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...MOVE_TOWARD_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    moveTowardTargetTypes: [MOVE_TOWARD_TARGETS.ENEMY_FLAG],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_enemy_flag",
      runnerId: "runner_1_AI_AllyP1"
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 12
    },
    tutorialSteps: [
      {
        id: "level-11-helper",
        title: "Meet Move Toward",
        body: "This block takes one step toward the target you choose. Here the only target is the enemy flag.",
        targetSelector: "#blockly-region"
      },
      {
        id: "level-11-not-pathfinding",
        title: "It Is A Helper, Not Magic",
        body: "Move Toward is useful on open maps like this one. Later you will learn when helper moves work well and when you need more detailed logic.",
        targetSelector: "#canvas-container"
      }
    ],
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 1, gridY: 1 },
        runner_1_AI_AllyP1: { gridX: 1, gridY: 6 },
        runner_2_Npc1: { gridX: 10, gridY: 1, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      },
      flagOverrides: {
        2: { gridX: 8, gridY: 3 }
      }
    }
  },
  {
    id: "bring-it-home",
    title: "Level 12: Bring It Home",
    description: "Combine Move Toward with the flag condition so the ally goes out for the flag and then brings it back.",
    introText: "Now the helper block gets two jobs: chase the enemy flag first, then chase your home base after pickup.",
    tips: [
      "Use If I Have Enemy Flag with else to switch the target.",
      "Move Toward enemy flag works on the way out, even when the helper needs both horizontal and vertical steps.",
      "Move Toward my base works on the way home."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [
      BLOCK_TYPES.IF_HAVE_ENEMY_FLAG,
      BLOCK_TYPES.IF_HAVE_ENEMY_FLAG_ELSE,
      ...MOVE_TOWARD_BLOCKS,
      ...EXTENDED_MOVEMENT_BLOCKS
    ],
    moveTowardTargetTypes: [MOVE_TOWARD_TARGETS.ENEMY_FLAG, MOVE_TOWARD_TARGETS.MY_BASE],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "team_scores_point",
      teamId: 1,
      runnerId: "runner_1_AI_AllyP1"
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 28
    },
    tutorialSteps: [
      {
        id: "level-12-two-targets",
        title: "One Helper, Two Targets",
        body: "This helper block can point at different goals. Here the ally should chase the enemy flag first and then head for home.",
        targetSelector: "#blockly-region",
        demoBlocklyXml: BRING_IT_HOME_DEMO_XML,
        demoTitle: "Example two-target program",
        demoCaption: "The same helper block can aim at the enemy flag on the way out and your base on the way back."
      },
      {
        id: "level-12-switch",
        title: "Switch Targets After Pickup",
        body: "The If I Have Enemy Flag condition is the bridge that tells the ally when to stop chasing the flag and start going home.",
        targetSelector: "#canvas-container"
      }
    ],
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 1, gridY: 1 },
        runner_1_AI_AllyP1: { gridX: 1, gridY: 6 },
        runner_2_Npc1: { gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      },
      flagOverrides: {
        2: { gridX: 7, gridY: 2 }
      }
    }
  },
  {
    id: "enemy-nearby",
    title: "Level 13: Enemy Nearby",
    description: "Use distance sensing to react when an enemy runner gets close.",
    introText: "Distance sensors use ideal move count, not line-of-sight. That means the game measures how many grid steps away something is.",
    tips: [
      "Within 2 spaces and within 3 spaces use Manhattan distance.",
      "A clean beginner solution is: dodge up when the enemy is nearby, otherwise keep advancing.",
      "This level is easier if you think about ideal grid moves, not straight-line distance.",
      "The enemy is frozen so you can focus on the new sensing idea."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...GENERIC_SENSOR_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    sensorObjectTypes: [SENSOR_OBJECT_TYPES.ENEMY_RUNNER],
    sensorRelationTypes: [SENSOR_RELATION_TYPES.WITHIN_2, SENSOR_RELATION_TYPES.WITHIN_3],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_cell",
      runnerId: "runner_1_AI_AllyP1",
      targetCell: { x: 5, y: 2 }
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 12
    },
    tutorialSteps: [
      {
        id: "level-13-distance",
        title: "Distance Uses Grid Steps",
        body: "Within 2 spaces means the target is close in ideal grid moves. It does not mean the target is visible in a straight line.",
        targetSelector: "#blockly-region",
        demoBlocklyXml: ENEMY_NEARBY_DEMO_XML,
        demoTitle: "Example nearby-enemy reaction",
        demoCaption: "When the enemy gets within 2 spaces, this program reacts by stepping up. Otherwise it keeps moving forward toward the target."
      },
      {
        id: "level-13-nearby-enemy",
        title: "Notice The Enemy Before It Is Too Close",
        body: "Use the distance check to change the ally's move when the enemy runner gets nearby, then fall back to forward progress when the lane feels safe.",
        targetSelector: "#canvas-container"
      }
    ],
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 1, gridY: 1 },
        runner_1_AI_AllyP1: { gridX: 1, gridY: 4 },
        runner_2_Npc1: { gridX: 5, gridY: 4, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      }
    }
  },
  {
    id: "jump-the-gap",
    title: "Level 14: Jump the Gap",
    description: "Use Jump Forward as the one decisive action that clears a wall and lands on the goal side.",
    introText: "This lesson is about a single leap. One Jump Forward should carry the ally over the wall and into the winning lane.",
    tips: [
      "Jump Forward only goes forward.",
      "There is no backward jump in this game.",
      "The landing space still needs to be open.",
      "Because Blockly only performs the first action it reaches, this level works best with a very short program."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...JUMP_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_cell",
      runnerId: "runner_1_AI_AllyP1",
      targetCell: { x: 3, y: 4 }
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 6
    },
    tutorialSteps: [
      {
        id: "level-14-jump",
        title: "Jump Is A One-Time Leap",
        body: "Jump Forward moves two cells ahead and ignores the space in between, but you only get one jump each round. For this lesson, a single jump block is enough.",
        targetSelector: "#blockly-region",
        demoBlocklyXml: JUMP_THE_GAP_DEMO_XML,
        demoTitle: "Example one-jump solution",
        demoCaption: "This lesson is intentionally simple: one Jump Forward clears the wall and reaches the goal side."
      },
      {
        id: "level-14-no-backward-jump",
        title: "No Backward Jump",
        body: "This game only supports jumping forward. The wall blocks the whole column, so the dramatic move here is to leap straight across it.",
        targetSelector: "#canvas-container"
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
      },
      barriers: [
        { gridX: 2, gridY: 0, ownerRunnerId: "level_jump_barrier_1" },
        { gridX: 2, gridY: 1, ownerRunnerId: "level_jump_barrier_2" },
        { gridX: 2, gridY: 2, ownerRunnerId: "level_jump_barrier_3" },
        { gridX: 2, gridY: 3, ownerRunnerId: "level_jump_barrier_4" },
        { gridX: 2, gridY: 4, ownerRunnerId: "level_jump_barrier_5" },
        { gridX: 2, gridY: 5, ownerRunnerId: "level_jump_barrier_6" },
        { gridX: 2, gridY: 6, ownerRunnerId: "level_jump_barrier_7" },
        { gridX: 2, gridY: 7, ownerRunnerId: "level_jump_barrier_8" }
      ]
    }
  },
  {
    id: "jump-if-ready",
    title: "Level 15: Jump If Ready",
    description: "Use a condition so the ally jumps once and then switches back to normal movement.",
    introText: "Conditions can check the runner's resources too. In this level, the ally should jump when it can and walk after the jump has been spent.",
    tips: [
      "Use If I Can Jump with else for the clearest version of this idea.",
      "After the jump is used, the condition changes and the else move takes over.",
      "This is your first resource-aware Blockly lesson."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...JUMP_CONDITION_BLOCKS, ...JUMP_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_cell",
      runnerId: "runner_1_AI_AllyP1",
      targetCell: { x: 6, y: 4 }
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 8
    },
    tutorialSteps: [
      {
        id: "level-15-ready",
        title: "Blockly Can Check What Is Ready",
        body: "The If I Can Jump condition lets the ally behave one way before the jump is used and another way after it is gone. This is the right place for a jump first, then walking later.",
        targetSelector: "#blockly-region",
        demoBlocklyXml: JUMP_IF_READY_DEMO_XML,
        demoTitle: "Example ready-check program",
        demoCaption: "Jump once while the resource is ready, then let the else branch switch the ally back to normal forward movement."
      },
      {
        id: "level-15-resource",
        title: "Resources Can Change During A Match",
        body: "Jump is not permanent. The wall blocks the whole column, so this level teaches how to leap once and then keep walking after the jump resource is gone.",
        targetSelector: "#canvas-container"
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
      },
      barriers: [
        { gridX: 2, gridY: 0, ownerRunnerId: "level_jump_ready_barrier_1" },
        { gridX: 2, gridY: 1, ownerRunnerId: "level_jump_ready_barrier_2" },
        { gridX: 2, gridY: 2, ownerRunnerId: "level_jump_ready_barrier_3" },
        { gridX: 2, gridY: 3, ownerRunnerId: "level_jump_ready_barrier_4" },
        { gridX: 2, gridY: 4, ownerRunnerId: "level_jump_ready_barrier_5" },
        { gridX: 2, gridY: 5, ownerRunnerId: "level_jump_ready_barrier_6" },
        { gridX: 2, gridY: 6, ownerRunnerId: "level_jump_ready_barrier_7" },
        { gridX: 2, gridY: 7, ownerRunnerId: "level_jump_ready_barrier_8" }
      ]
    }
  },
  {
    id: "build-the-barrier",
    title: "Level 16: Build the Barrier",
    description: "Place a barrier in front of the ally to learn how barrier placement works.",
    introText: "Barrier placement is another one-time resource. This level focuses on what the action does and when it is ready.",
    tips: [
      "A runner can only keep one active barrier on the map.",
      "Place Barrier always targets the square directly in front.",
      "The highlighted square shows where the barrier should appear."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...BARRIER_PLACEMENT_BLOCKS, ...BARRIER_READY_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "barrier_exists_at_cell",
      targetCell: { x: 4, y: 4 }
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 4
    },
    tutorialSteps: [
      {
        id: "level-16-place-barrier",
        title: "Place A Barrier In Front",
        body: "This action creates a barrier in the square directly ahead of the runner if that space is open.",
        targetSelector: "#blockly-region"
      },
      {
        id: "level-16-barrier-ready",
        title: "Barrier Placement Has A Ready State",
        body: "The If I Can Place Barrier condition helps the ally know whether that one-time action is still available.",
        targetSelector: "#canvas-container"
      }
    ],
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 1, gridY: 1 },
        runner_1_AI_AllyP1: { gridX: 3, gridY: 4 },
        runner_2_Npc1: { gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      }
    }
  },
  {
    id: "stay-still-can-do-something",
    title: "Level 17: Stay Still Can Do Something",
    description: "Use Stay Still to remove a barrier that is directly in front of the ally.",
    introText: "Stay Still is not just a do-nothing block. When a barrier is in front, it can change the board by clearing that obstacle.",
    tips: [
      "If a barrier is directly in front, Stay Still removes it.",
      "After the barrier is gone, the ally can continue moving.",
      "This is a good level for combining sensing with a non-movement action."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...GENERIC_SENSOR_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    sensorObjectTypes: [SENSOR_OBJECT_TYPES.BARRIER],
    sensorRelationTypes: [SENSOR_RELATION_TYPES.DIRECTLY_IN_FRONT],
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
        id: "level-17-stay-still",
        title: "Stay Still Can Change The Board",
        body: "If a barrier is directly ahead, Stay Still removes it. This is one of the first times that not moving is the smart move.",
        targetSelector: "#blockly-region",
        demoBlocklyXml: STAY_STILL_DEMO_XML,
        demoTitle: "Example removal program",
        demoCaption: "This pattern removes the barrier first, then resumes forward movement after the lane is clear."
      },
      {
        id: "level-17-after-removal",
        title: "Then Keep Going",
        body: "Once the barrier is gone, the ally can go back to its normal path.",
        targetSelector: "#canvas-container"
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
      },
      barriers: [
        { gridX: 2, gridY: 4, ownerRunnerId: "level_remove_barrier_1" }
      ]
    }
  },
  {
    id: "relay-race",
    title: "Level 18: Relay Race",
    description: "Use the teammate flag condition so the ally reacts when another runner on the team has the enemy flag.",
    introText: "Programs can pay attention to teammates too. Here, the human runner already has the enemy flag, so the ally should switch into support mode and reach the marked support square next to the carrier.",
    tips: [
      "The human runner starts this level already carrying the enemy flag.",
      "The teammate condition is true when another runner on your team has the flag.",
      "Move Toward human runner is a helpful support action here.",
      "The highlighted support square next to the human is the goal, not the occupied human cell."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...TEAMMATE_FLAG_BLOCKS, ...MOVE_TOWARD_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    moveTowardTargetTypes: [MOVE_TOWARD_TARGETS.HUMAN_RUNNER],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_cell",
      runnerId: "runner_1_AI_AllyP1",
      targetCell: { x: 6, y: 3 }
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 10
    },
    tutorialSteps: [
      {
        id: "level-18-teammate",
        title: "A Teammate Already Has The Flag",
        body: "The human runner begins with the enemy flag, so this level is about how the ally should react when someone else becomes the carrier. Guide the ally into the marked support square next to the human.",
        targetSelector: "#canvas-container"
      },
      {
        id: "level-18-support",
        title: "Support Mode",
        body: "Use the teammate flag condition to switch into a support move. The Move Toward human runner helper is one clean way to do that.",
        targetSelector: "#blockly-region",
        demoBlocklyXml: RELAY_RACE_DEMO_XML,
        demoTitle: "Example support program",
        demoCaption: "When a teammate already has the flag, this program switches from chasing forward to supporting the human runner."
      }
    ],
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 6, gridY: 2, hasEnemyFlag: true },
        runner_1_AI_AllyP1: { gridX: 1, gridY: 5 },
        runner_2_Npc1: { gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      },
      flagOverrides: {
        2: { carriedByRunnerId: "runner_1_HumanP1", isAtBase: false }
      }
    }
  },
  {
    id: "my-side-their-side",
    title: "Level 19: My Side, Their Side",
    description: "Use territory conditions so the ally changes behavior after crossing into the enemy half.",
    introText: "Some smart programs care about which side of the field they are on. This level teaches that field position can change what move makes sense.",
    tips: [
      "For Team 1, the left half is your side and the right half is the enemy side.",
      "Try a plan that moves forward on your side and then changes behavior after crossing the middle.",
      "This level is about territory awareness, not flag carrying yet."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...TERRITORY_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_cell",
      runnerId: "runner_1_AI_AllyP1",
      targetCell: { x: 6, y: 2 }
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 12
    },
    tutorialSteps: [
      {
        id: "level-19-territory",
        title: "The Field Has Sides",
        body: "Your side and the enemy side are different spaces. Blockly can check which half of the field the ally is in.",
        targetSelector: "#canvas-container"
      },
      {
        id: "level-19-switch-sides",
        title: "Change Your Plan After Crossing",
        body: "Use a territory block with else to do one move on your side and a different move on the enemy side.",
        targetSelector: "#blockly-region"
      }
    ],
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 1, gridY: 1 },
        runner_1_AI_AllyP1: { gridX: 1, gridY: 6 },
        runner_2_Npc1: { gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      }
    }
  },
  {
    id: "freeze-the-lane",
    title: "Level 20: Freeze the Lane",
    description: "Spend Area Freeze once, then let the ally keep moving toward the flag while the lane is safe.",
    introText: "Area Freeze is a team power, not a normal move. In this level, use it once while it is ready, then switch back to Move Toward so the ally keeps advancing.",
    tips: [
      "Area Freeze affects nearby active enemies.",
      "If Area Freeze Is Ready can help you decide when that one-time power is still available.",
      "After this level, free play is the best place to combine all the tools you have learned."
    ],
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...AREA_FREEZE_BLOCKS, ...GENERIC_SENSOR_BLOCKS, ...MOVE_TOWARD_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    moveTowardTargetTypes: [MOVE_TOWARD_TARGETS.ENEMY_FLAG],
    sensorObjectTypes: [SENSOR_OBJECT_TYPES.ENEMY_RUNNER],
    sensorRelationTypes: [SENSOR_RELATION_TYPES.WITHIN_2, SENSOR_RELATION_TYPES.WITHIN_3],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: {
      type: "runner_reaches_enemy_flag",
      runnerId: "runner_1_AI_AllyP1"
    },
    failureCondition: {
      type: "turn_limit_exceeded",
      maxTurns: 10
    },
    tutorialSteps: [
      {
        id: "level-20-freeze",
        title: "One Team Freeze Per Round",
        body: "Area Freeze can lock nearby enemies in place for a short time, but your team only gets one use each round. A simple if/else can spend it once, then switch back to movement.",
        targetSelector: "#blockly-region",
        demoBlocklyXml: FREEZE_THE_LANE_DEMO_XML,
        demoTitle: "Example freeze-then-go program",
        demoCaption: "Use the freeze while it is still ready. After that one-time action is spent, the else branch keeps the ally moving toward the enemy flag."
      },
      {
        id: "level-20-timing",
        title: "Use It At The Right Moment",
        body: "This lane is dangerous because an enemy starts nearby. Freeze is strongest when you use it before that runner can block your path.",
        targetSelector: "#canvas-container"
      },
      {
        id: "level-20-free-play",
        title: "You Are Ready For Free Play",
        body: "After this challenge, free play is where you can mix movement, sensing, helper blocks, barriers, jumping, and freeze powers however you want.",
        targetSelector: "#level-panel"
      }
    ],
    setupOverrides: {
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      pointsToWin: 1,
      runnerOverrides: {
        runner_1_HumanP1: { gridX: 1, gridY: 1 },
        runner_1_AI_AllyP1: { gridX: 6, gridY: 4 },
        runner_2_Npc1: { gridX: 7, gridY: 3 },
        runner_2_Npc2: { gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }
      },
      flagOverrides: {
        2: { gridX: 9, gridY: 4 }
      }
    }
  },
  {
    id: "closest-threat",
    title: "Level 21: Closest Threat",
    description: "Use Move Toward closest enemy to intercept a nearby defender.",
    introText: "Closest enemy is a different kind of target. This board is arranged so the ally has to bend upward before the intercept works.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...MOVE_TOWARD_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    moveTowardTargetTypes: [MOVE_TOWARD_TARGETS.CLOSEST_ENEMY],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_cell", runnerId: "runner_1_AI_AllyP1", targetCell: { x: 5, y: 3 } },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 8 },
    tutorialSteps: [
      { id: "level-21-target", title: "A New Move Toward Target", body: "Closest enemy picks the nearest active opponent and steps toward them.", targetSelector: "#blockly-region" },
      { id: "level-21-board", title: "Intercept The Runner", body: "This challenge is about chasing a threat, not chasing a flag. A straight forward march will miss the intercept.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      teams: {
        player: { playDirection: 1, runners: [{ slot: "human", gridX: 1, gridY: 1 }, { slot: "ally", gridX: 2, gridY: 5 }] },
        opponent: { playDirection: -1, runners: [{ slot: "npc1", gridX: 5, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 }, { slot: "npc2", gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }] }
      }
    }
  },
  {
    id: "how-far-away",
    title: "Level 22: How Far Away?",
    description: "Use a number comparison with distance to closest enemy.",
    introText: "Distance can become a real value in Blockly now. Compare it to a number and choose a different move when the enemy gets close enough.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...ADVANCED_ALL_BLOCKS, ...MOVE_TOWARD_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    moveTowardTargetTypes: [MOVE_TOWARD_TARGETS.CLOSEST_ENEMY],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_cell", runnerId: "runner_1_AI_AllyP1", targetCell: { x: 2, y: 3 } },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 6 },
    tutorialSteps: [
      { id: "level-22-distance", title: "Distance Is A Number Now", body: "Distance to closest enemy can be compared with <, <=, >, and the other operator choices.", targetSelector: "#blockly-region" },
      { id: "level-22-compare", title: "Choose A Move By Range", body: "This level wants a range check that turns upward when the threat gets close enough.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      teams: {
        player: { playDirection: 1, runners: [{ slot: "human", gridX: 1, gridY: 1 }, { slot: "ally", gridX: 1, gridY: 4 }] },
        opponent: { playDirection: -1, runners: [{ slot: "npc1", gridX: 4, gridY: 4, isFrozen: true, frozenTurnsRemaining: 999 }, { slot: "npc2", gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }] }
      }
    }
  },
  {
    id: "two-conditions-at-once",
    title: "Level 23: Two Conditions At Once",
    description: "Use AND so freeze only happens when the enemy is close and the team power is still ready.",
    introText: "Logic blocks can combine ideas. This level is about requiring two truths before the ally spends its one team freeze.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...ADVANCED_ALL_BLOCKS, ...AREA_FREEZE_BLOCKS, ...MOVE_TOWARD_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    moveTowardTargetTypes: [MOVE_TOWARD_TARGETS.CLOSEST_ENEMY, MOVE_TOWARD_TARGETS.ENEMY_FLAG],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_enemy_flag", runnerId: "runner_1_AI_AllyP1" },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 10 },
    tutorialSteps: [
      { id: "level-23-and", title: "Both Must Be True", body: "AND is useful for a one-time power: close enough to matter, and still ready to use.", targetSelector: "#blockly-region" },
      { id: "level-23-lane", title: "Freeze Then Continue", body: "After the freeze is spent, the ally should keep moving toward the flag.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      teams: {
        player: { playDirection: 1, runners: [{ slot: "human", gridX: 1, gridY: 1 }, { slot: "ally", gridX: 6, gridY: 4 }] },
        opponent: { playDirection: -1, runners: [{ slot: "npc1", gridX: 7, gridY: 3 }, { slot: "npc2", gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }] }
      },
      flags: { opponent: { gridX: 9, gridY: 4 } }
    }
  },
  {
    id: "this-or-that",
    title: "Level 24: This Or That",
    description: "Use OR to react when either danger condition becomes true.",
    introText: "OR lets a single branch respond to more than one warning sign.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "midfieldPressure",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...ADVANCED_ALL_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_cell", runnerId: "runner_1_AI_AllyP1", targetCell: { x: 6, y: 2 } },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 12 },
    tutorialSteps: [
      { id: "level-24-or", title: "Either Warning Works", body: "OR is true when either of its inputs is true. That makes one branch react to two different kinds of danger.", targetSelector: "#blockly-region" },
      { id: "level-24-path", title: "Cross Then Turn", body: "The ally should change path once it crosses over or gets too close to the enemy.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      teams: {
        player: { playDirection: 1, runners: [{ slot: "human", gridX: 1, gridY: 1 }, { slot: "ally", gridX: 1, gridY: 4 }] },
        opponent: { playDirection: -1, runners: [{ slot: "npc1", gridX: 6, gridY: 4, isFrozen: true, frozenTurnsRemaining: 999 }, { slot: "npc2", gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }] }
      }
    }
  },
  {
    id: "flip-the-answer",
    title: "Level 25: Flip The Answer",
    description: "Use NOT to reverse a boolean check.",
    introText: "NOT is the simplest logic block, but it is powerful. It turns a true check into a false one and vice versa.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...ADVANCED_ALL_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_cell", runnerId: "runner_1_AI_AllyP1", targetCell: { x: 6, y: 2 } },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 12 },
    tutorialSteps: [
      { id: "level-25-not", title: "Reverse The Boolean", body: "NOT is useful when the easier idea to say is the opposite of what you want to test.", targetSelector: "#blockly-region" },
      { id: "level-25-side", title: "Change After Crossing", body: "Use NOT with a side check so the ally behaves differently after it leaves home territory.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      teams: {
        player: { playDirection: 1, runners: [{ slot: "human", gridX: 1, gridY: 1 }, { slot: "ally", gridX: 1, gridY: 4 }] },
        opponent: { playDirection: -1, runners: [{ slot: "npc1", gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 }, { slot: "npc2", gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }] }
      }
    }
  },
  {
    id: "enemy-side-decision-making",
    title: "Level 26: Enemy-Side Decision Making",
    description: "Use If On Enemy Side as an explicit advanced territory check.",
    introText: "Sometimes a named condition is still clearer than a value block. This level uses the existing enemy-side condition directly.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [BLOCK_TYPES.IF_ON_ENEMY_SIDE, BLOCK_TYPES.IF_ON_ENEMY_SIDE_ELSE, ...EXTENDED_MOVEMENT_BLOCKS],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_cell", runnerId: "runner_1_AI_AllyP1", targetCell: { x: 6, y: 2 } },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 12 },
    tutorialSteps: [
      { id: "level-26-enemy-side", title: "A Named Territory Check", body: "This block asks directly whether the runner is on the enemy side of the field.", targetSelector: "#blockly-region" },
      { id: "level-26-shift", title: "Cross Then Change", body: "Move one way on your side, then switch behavior once you cross midfield.", targetSelector: "#canvas-container" }
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
  },
  {
    id: "one-program-two-allies",
    title: "Level 27: One Program, Two Allies",
    description: "Two allies now share one workspace. Use runner index so one moves and the other waits.",
    introText: "This is the beginning of team programming. The lower ally is closer to the flag, so runner index has to tell only the top ally to go.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...ADVANCED_ALL_BLOCKS, ...MOVE_TOWARD_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    moveTowardTargetTypes: [MOVE_TOWARD_TARGETS.ENEMY_FLAG],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_enemy_flag", runnerId: "runner_1_AI_AllyP1" },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 16 },
    tutorialSteps: [
      { id: "level-27-shared-program", title: "One Workspace, Two Allies", body: "Both allies run the same blocks. Runner index is how the program can tell them apart.", targetSelector: "#blockly-region" },
      { id: "level-27-index", title: "Index 0 And Index 1", body: "In this level, runner 0 should move toward the flag while runner 1 stays out of the lane. If both go, the wrong ally gets there first.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      teams: {
        player: { playDirection: 1, runners: [{ slot: "human", gridX: 1, gridY: 1 }, { slot: "ally", gridX: 1, gridY: 2 }, { slot: "ally2", gridX: 1, gridY: 5 }] },
        opponent: { playDirection: -1, runners: [{ slot: "npc1", gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 }, { slot: "npc2", gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }] }
      },
      flags: { opponent: { gridX: 9, gridY: 5 } }
    }
  },
  {
    id: "index-jobs",
    title: "Level 28: Index Jobs",
    description: "Use runner index comparisons so one ally attacks and the other patrols upward.",
    introText: "This level still has one real goal. Runner index decides which ally is the attacker and which ally should peel upward instead of stealing the job.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...ADVANCED_ALL_BLOCKS, ...MOVE_TOWARD_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    moveTowardTargetTypes: [MOVE_TOWARD_TARGETS.ENEMY_FLAG],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_enemy_flag", runnerId: "runner_1_AI_AllyP1" },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 10 },
    tutorialSteps: [
      { id: "level-28-index-compare", title: "Compare The Index", body: "You can compare runner index to a number to choose different branches for different allies.", targetSelector: "#blockly-region" },
      { id: "level-28-jobs", title: "Attacker And Patrol", body: "This level has one true attacker. The other ally should patrol upward so the wrong runner does not reach the flag first.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      teams: {
        player: { playDirection: 1, runners: [{ slot: "human", gridX: 1, gridY: 1 }, { slot: "ally", gridX: 1, gridY: 5 }, { slot: "ally2", gridX: 7, gridY: 5 }] },
        opponent: { playDirection: -1, runners: [{ slot: "npc1", gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 }, { slot: "npc2", gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }] }
      },
      flags: { opponent: { gridX: 9, gridY: 5 } }
    }
  },
  {
    id: "first-two-defend",
    title: "Level 29: First Two Defend",
    description: "Teach range checks on runner index so two allies take one job and the third takes another.",
    introText: "Now the team has three Blockly-controlled allies. Index < 2 is a clean way to group the first two together.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...ADVANCED_ALL_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_cell", runnerId: "runner_1_AI_AllyP1_3", targetCell: { x: 4, y: 4 } },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 6 },
    tutorialSteps: [
      { id: "level-29-range", title: "Index Ranges Create Teams", body: "Index < 2 can group the first two allies together while index 2 takes a separate job.", targetSelector: "#blockly-region" },
      { id: "level-29-three-allies", title: "Three Allies, One Program", body: "The first two allies are parked in the lane. Move them up together so runner 2 can advance to the target.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      barriers: [{ gridX: 5, gridY: 4, ownerRunnerId: "phase8_first_two_defend_wall" }],
      teams: {
        player: { playDirection: 1, runners: [{ slot: "human", gridX: 1, gridY: 1 }, { slot: "ally", gridX: 2, gridY: 4 }, { slot: "ally2", gridX: 3, gridY: 4 }, { slot: "ally3", gridX: 1, gridY: 4 }] },
        opponent: { playDirection: -1, runners: [{ slot: "npc1", gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 }, { slot: "npc2", gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }] }
      }
    }
  },
  {
    id: "escort-the-carrier",
    title: "Level 30: Escort The Carrier",
    description: "Combine teammate-has-flag with runner index to send one ally home and another into support mode.",
    introText: "Once a teammate has the flag, different allies can take different jobs in the same turn cycle.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...ADVANCED_ALL_BLOCKS, ...MOVE_TOWARD_BLOCKS, ...TEAMMATE_FLAG_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    moveTowardTargetTypes: [MOVE_TOWARD_TARGETS.MY_BASE, MOVE_TOWARD_TARGETS.HUMAN_RUNNER],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_cell", runnerId: "runner_1_AI_AllyP1_2", targetCell: { x: 5, y: 5 } },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 10 },
    tutorialSteps: [
      { id: "level-30-teammate", title: "One Ally Has The Flag", body: "The lead ally begins as the carrier. Use teammate-has-flag plus index to send the second ally into position.", targetSelector: "#blockly-region" },
      { id: "level-30-support", title: "Escort The Return", body: "This challenge is about support movement, not chasing a new flag.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      teams: {
        player: { playDirection: 1, runners: [{ slot: "human", gridX: 1, gridY: 1 }, { slot: "ally", gridX: 7, gridY: 2, hasEnemyFlag: true }, { slot: "ally2", gridX: 2, gridY: 5 }] },
        opponent: { playDirection: -1, runners: [{ slot: "npc1", gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 }, { slot: "npc2", gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }] }
      },
      flags: { opponent: { carriedByRunnerId: "runner_1_AI_AllyP1", isAtBase: false } }
    }
  },
  {
    id: "closest-enemy-defender",
    title: "Level 31: Closest Enemy Defender",
    description: "One ally attacks while another uses closest-enemy targeting as a defender.",
    introText: "This is the first advanced level where one ally chases the goal and another reacts to live enemies that have already crossed onto your side.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...ADVANCED_ALL_BLOCKS, ...MOVE_TOWARD_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    moveTowardTargetTypes: [MOVE_TOWARD_TARGETS.ENEMY_FLAG, MOVE_TOWARD_TARGETS.CLOSEST_ENEMY],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_enemy_flag", runnerId: "runner_1_AI_AllyP1" },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 14 },
    tutorialSteps: [
      { id: "level-31-split", title: "Split The Team Jobs", body: "Use runner index to make the first ally attack and the second react to the closest enemy.", targetSelector: "#blockly-region" },
      { id: "level-31-pressure", title: "Defend Your Side First", body: "The enemies are already on your half of the map. The defender should react there while the attacker keeps the scoring plan moving.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      teams: {
        player: { playDirection: 1, runners: [{ slot: "human", gridX: 1, gridY: 7 }, { slot: "ally", gridX: 1, gridY: 4 }, { slot: "ally2", gridX: 1, gridY: 2 }] },
        opponent: { playDirection: -1, runners: [{ slot: "npc1", gridX: 5, gridY: 1 }, { slot: "npc2", gridX: 5, gridY: 2 }] }
      },
      flags: { opponent: { gridX: 8, gridY: 4 } }
    }
  },
  {
    id: "freeze-support",
    title: "Level 32: Freeze Support",
    description: "One ally spends the freeze while another keeps advancing.",
    introText: "The strongest team plays are role-based. In this level, one ally is the freezer and one is the runner.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...ADVANCED_ALL_BLOCKS, ...AREA_FREEZE_BLOCKS, ...MOVE_TOWARD_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    moveTowardTargetTypes: [MOVE_TOWARD_TARGETS.ENEMY_FLAG],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_enemy_flag", runnerId: "runner_1_AI_AllyP1" },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 10 },
    tutorialSteps: [
      { id: "level-32-role", title: "A Team Freeze Specialist", body: "Use runner index so only one ally spends the team freeze while the other keeps advancing.", targetSelector: "#blockly-region" },
      { id: "level-32-timing", title: "Support The Run", body: "The freezer should act early enough to open the lane for the attacker.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      teams: {
        player: { playDirection: 1, runners: [{ slot: "human", gridX: 1, gridY: 1 }, { slot: "ally", gridX: 6, gridY: 4 }, { slot: "ally2", gridX: 6, gridY: 5 }] },
        opponent: { playDirection: -1, runners: [{ slot: "npc1", gridX: 7, gridY: 3 }, { slot: "npc2", gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }] }
      },
      flags: { opponent: { gridX: 9, gridY: 4 } }
    }
  },
  {
    id: "barrier-specialist",
    title: "Level 33: Barrier Specialist",
    description: "One ally places the team barrier while the other keeps moving.",
    introText: "Barrier placement becomes more strategic when only one ally on the team is responsible for it. The attacker still has to keep moving on the same short clock.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...ADVANCED_ALL_BLOCKS, ...BARRIER_PLACEMENT_BLOCKS, ...BARRIER_READY_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_cell", runnerId: "runner_1_AI_AllyP1", targetCell: { x: 5, y: 4 } },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 3 },
    tutorialSteps: [
      { id: "level-33-index-barrier", title: "Only One Ally Should Place", body: "Use runner index together with barrier readiness so one ally becomes the barrier specialist while the attacker keeps advancing.", targetSelector: "#blockly-region" },
      { id: "level-33-cell", title: "Build The Support Wall", body: "The barrier goes on the lower lane while the tracked attacker reaches the highlighted square above it.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      teams: {
        player: { playDirection: 1, runners: [{ slot: "human", gridX: 1, gridY: 1 }, { slot: "ally", gridX: 3, gridY: 4 }, { slot: "ally2", gridX: 3, gridY: 5 }] },
        opponent: { playDirection: -1, runners: [{ slot: "npc1", gridX: 8, gridY: 5 }, { slot: "npc2", gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 }] }
      }
    }
  },
  {
    id: "jump-team",
    title: "Level 34: Jump Team",
    description: "One ally uses the jump route while another takes a support path.",
    introText: "Resources can be assigned by role too. This level gives one ally the dramatic jump job, but that jumper still has to keep moving afterward.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...ADVANCED_ALL_BLOCKS, ...JUMP_CONDITION_BLOCKS, ...JUMP_BLOCKS, ...EXTENDED_MOVEMENT_BLOCKS],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_cell", runnerId: "runner_1_AI_AllyP1", targetCell: { x: 5, y: 4 } },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 3 },
    tutorialSteps: [
      { id: "level-34-jump-role", title: "Give The Jump To One Ally", body: "Index can decide which ally gets the jump path and which ally avoids the obstacle.", targetSelector: "#blockly-region" },
      { id: "level-34-wall", title: "One Dramatic Leap", body: "The wall blocks the lane, so the lead ally needs one good jump and then one more normal move to finish.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      barriers: [
        { gridX: 2, gridY: 3, ownerRunnerId: "phase8_jump_wall_top" },
        { gridX: 2, gridY: 4, ownerRunnerId: "phase8_jump_wall_mid" },
        { gridX: 2, gridY: 5, ownerRunnerId: "phase8_jump_wall_low" }
      ],
      teams: {
        player: { playDirection: 1, runners: [{ slot: "human", gridX: 1, gridY: 1 }, { slot: "ally", gridX: 1, gridY: 4 }, { slot: "ally2", gridX: 1, gridY: 6 }] },
        opponent: { playDirection: -1, runners: [{ slot: "npc1", gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 }, { slot: "npc2", gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }] }
      }
    }
  },
  {
    id: "advanced-scrimmage",
    title: "Level 35: Advanced Scrimmage",
    description: "Use one shared program for three allies in a real capture-the-flag scrimmage.",
    introText: "This capstone brings together indexing, comparisons, movement helpers, and team strategy in one bigger match.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "wideScrimmage",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [...ADVANCED_CAPSTONE_BLOCKS],
    moveTowardTargetTypes: [MOVE_TOWARD_TARGETS.ENEMY_FLAG, MOVE_TOWARD_TARGETS.CLOSEST_ENEMY, MOVE_TOWARD_TARGETS.MY_BASE],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "team_scores_point", teamId: 1, runnerId: "runner_1_AI_AllyP1" },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 32 },
    tutorialSteps: [
      { id: "level-35-capstone", title: "A Full Team Script", body: "This final level expects one shared program to divide attacking, defending, and support jobs across three allies.", targetSelector: "#blockly-region" },
      { id: "level-35-real-score", title: "Score For Real", body: "This time the level only passes when your team actually scores a point.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      teams: {
        player: {
          playDirection: 1,
          runners: [
            { slot: "human", gridX: 1, gridY: 1 },
            { slot: "ally", gridX: 1, gridY: 3 },
            { slot: "ally2", gridX: 1, gridY: 4 },
            { slot: "ally3", gridX: 1, gridY: 5 }
          ]
        },
        opponent: {
          playDirection: -1,
          runners: [
            { slot: "npc1", gridX: 9, gridY: 1 },
            { slot: "npc2", gridX: 10, gridY: 4 },
            { slot: "npc3", gridX: 9, gridY: 6 }
          ]
        }
      },
      flags: { opponent: { gridX: 8, gridY: 3 } }
    }
  },
  {
    id: "optional-random-lab",
    title: "Optional Lab: Move Randomly",
    description: "Try the Move Randomly block in a small sandbox challenge.",
    introText: "This optional lab is here to show the random movement block directly. It is not part of the main advanced unlock path.",
    mode: GAME_MODES.PLAYER_VS_NPC,
    mapKey: "simpleAisle",
    humanTurnBehavior: HUMAN_TURN_BEHAVIORS.AUTO_SKIP,
    toolboxBlockTypes: [BLOCK_TYPES.MOVE_RANDOMLY, BLOCK_TYPES.STAY_STILL],
    initialBlocklyXml: STARTER_EVENT_XML,
    winCondition: { type: "runner_reaches_cell", runnerId: "runner_1_AI_AllyP1", targetCell: { x: 2, y: 4 } },
    failureCondition: { type: "turn_limit_exceeded", maxTurns: 12 },
    tutorialSteps: [
      { id: "level-36-random", title: "Optional Randomness Lab", body: "Move Randomly picks one of the four cardinal directions each turn. This lab is optional because randomness is harder to predict.", targetSelector: "#blockly-region" },
      { id: "level-36-lab", title: "Try A Few Runs", body: "Some attempts will finish faster than others. That is the point of the lab: to see how a random action feels in the game.", targetSelector: "#canvas-container" }
    ],
    setup: {
      pointsToWin: 1,
      autoStayHumanRunnerIds: ["runner_1_HumanP1"],
      teams: {
        player: { playDirection: 1, runners: [{ slot: "human", gridX: 1, gridY: 1 }, { slot: "ally", gridX: 1, gridY: 4 }] },
        opponent: { playDirection: -1, runners: [{ slot: "npc1", gridX: 10, gridY: 2, isFrozen: true, frozenTurnsRemaining: 999 }, { slot: "npc2", gridX: 10, gridY: 6, isFrozen: true, frozenTurnsRemaining: 999 }] }
      }
    }
  }
];

export function getLevelDefinitions() {
  return LEVEL_DEFINITIONS.map((level) => ({
    ...level,
    toolboxBlockTypes: [...level.toolboxBlockTypes],
    sensorObjectTypes: [...(level.sensorObjectTypes || [])],
    sensorRelationTypes: [...(level.sensorRelationTypes || [])],
    moveTowardTargetTypes: [...(level.moveTowardTargetTypes || [])],
    tips: [...(level.tips || [])],
    tutorialSteps: structuredClone(level.tutorialSteps || []),
    winCondition: { ...level.winCondition },
    failureCondition: level.failureCondition ? { ...level.failureCondition } : null,
    setup: normalizeLegacyLevelSetup(level.setup || level.setupOverrides)
  }));
}

export function createInitialLevelProgress() {
  return Object.fromEntries(
    LEVEL_DEFINITIONS.map((level, index) => [
      level.id,
      UNLOCK_ALL_GUIDED_LEVELS_FOR_TESTING
        ? LEVEL_STATUS.AVAILABLE
        : (index === 0 ? LEVEL_STATUS.AVAILABLE : LEVEL_STATUS.LOCKED)
    ])
  );
}
