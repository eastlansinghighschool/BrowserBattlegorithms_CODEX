import test from "node:test";
import assert from "node:assert/strict";
import {
  AI_ACTION_TYPES,
  BLOCK_TYPES,
  GAME_VIEW_MODES,
  HUMAN_TURN_BEHAVIORS,
  LEVEL_RESULT,
  LEVEL_STATUS,
  MOVE_TOWARD_TARGETS,
  SENSOR_OBJECT_TYPES,
  SENSOR_RELATION_TYPES
} from "../../src/config/constants.js";
import { getLevelDefinitions } from "../../src/config/levels.js";
import { getToolboxBlockTypesForMode } from "../../src/ai/blockly/blocks.js";
import { createApp } from "../../src/core/state.js";
import { evaluateLevelProgress, getLevelStateSnapshot, initializeLevelState, startLevel } from "../../src/core/levels.js";
import { buildSolutionXml, GUIDED_LEVEL_REFERENCE_SOLUTIONS } from "./fixtures/guidedReferenceSolutions.js";
import { runGuidedLevelWithSolution } from "./helpers/testHarness.js";

test("level definitions load with the expected starter and advanced level order", () => {
  const levels = getLevelDefinitions();
  assert.equal(levels.length, 36);
  assert.deepEqual(
    levels.map((level) => level.id),
    [
      "move-to-target", "reach-enemy-flag", "score-a-point", "barrier-detour", "mirror-forward",
      "sensor-barrier-branch", "watch-the-wall", "find-the-human", "find-the-enemy-flag", "human-runner-practice",
      "move-toward-flag", "bring-it-home", "enemy-nearby", "jump-the-gap", "jump-if-ready",
      "build-the-barrier", "stay-still-can-do-something", "relay-race", "my-side-their-side", "freeze-the-lane",
      "closest-threat", "how-far-away", "two-conditions-at-once", "this-or-that", "flip-the-answer",
      "enemy-side-decision-making", "one-program-two-allies", "index-jobs", "first-two-defend", "escort-the-carrier",
      "closest-enemy-defender", "freeze-support", "barrier-specialist", "jump-team", "advanced-scrimmage",
      "optional-random-lab"
    ]
  );
});

test("guided mode initializes with all levels available during testing", () => {
  const app = createApp();
  initializeLevelState(app);
  const snapshot = getLevelStateSnapshot(app);
  assert.equal(snapshot.currentModeView, GAME_VIEW_MODES.GUIDED_LEVELS);
  assert.equal(snapshot.currentLevelId, "move-to-target");
  assert.equal(snapshot.levelProgress["move-to-target"], LEVEL_STATUS.AVAILABLE);
  assert.equal(snapshot.levelProgress["reach-enemy-flag"], LEVEL_STATUS.AVAILABLE);
  assert.equal(snapshot.levelProgress["score-a-point"], LEVEL_STATUS.AVAILABLE);
  assert.equal(snapshot.levelProgress["barrier-detour"], LEVEL_STATUS.AVAILABLE);
  assert.equal(snapshot.levelProgress["mirror-forward"], LEVEL_STATUS.AVAILABLE);
  assert.equal(snapshot.levelProgress["freeze-the-lane"], LEVEL_STATUS.AVAILABLE);
  assert.equal(snapshot.humanTurnBehavior, HUMAN_TURN_BEHAVIORS.AUTO_SKIP);
});

test("advanced campaign authored levels enforce their intended mechanic family", () => {
  const trivialPrograms = [
    ["closest-threat", buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`)],
    ["one-program-two-allies", buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`)],
    ["first-two-defend", buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`)],
    ["barrier-specialist", buildSolutionXml(`<block type="battlegorithms_place_barrier"></block>`)],
    ["jump-team", buildSolutionXml(`<block type="battlegorithms_jump_forward"></block>`)]
  ];

  for (const [levelId, xmlText] of trivialPrograms) {
    const { app } = runGuidedLevelWithSolution(levelId, xmlText);
    assert.equal(app.state.activeLevelResult, LEVEL_RESULT.FAILED, `${levelId} should reject the trivial program`);
  }
});

test("advanced campaign contract exposes capstone and optional lab tools as authored", () => {
  const advancedScrimmage = getLevelDefinitions().find((entry) => entry.id === "advanced-scrimmage");
  assert.ok(advancedScrimmage.toolboxBlockTypes.includes(BLOCK_TYPES.MOVE_RANDOMLY));
  assert.ok(advancedScrimmage.toolboxBlockTypes.includes(BLOCK_TYPES.PLACE_BARRIER));
  assert.ok(advancedScrimmage.toolboxBlockTypes.includes(BLOCK_TYPES.JUMP_FORWARD));
  assert.ok(advancedScrimmage.toolboxBlockTypes.includes(BLOCK_TYPES.FREEZE_OPPONENTS));
  assert.equal(advancedScrimmage.setup.teams.opponent.runners.every((runner) => !runner.isFrozen), true);

  const optionalRandomLab = getLevelDefinitions().find((entry) => entry.id === "optional-random-lab");
  assert.ok(optionalRandomLab);
  assert.equal(optionalRandomLab.toolboxBlockTypes.includes(BLOCK_TYPES.MOVE_RANDOMLY), true);
});

test("starter levels include onboarding copy and tutorial steps", () => {
  const [firstLevel, secondLevel] = getLevelDefinitions();
  assert.ok(firstLevel.introText.includes("quiet practice board"));
  assert.ok(firstLevel.tutorialSteps.length >= 3);
  assert.ok(secondLevel.tutorialSteps.some((step) => step.body.includes("flag")));
  const thirdLevel = getLevelDefinitions().find((level) => level.id === "score-a-point");
  assert.ok(thirdLevel.toolboxBlockTypes.includes(BLOCK_TYPES.IF_HAVE_ENEMY_FLAG_ELSE));
  assert.ok(thirdLevel.tutorialSteps.some((step) => step.body.includes("carry")));
});

test("guided toolbox restriction reflects the curriculum unlock path", () => {
  const app = createApp();
  initializeLevelState(app);

  const expectations = [
    ["move-to-target", [BLOCK_TYPES.MOVE_FORWARD, BLOCK_TYPES.MOVE_UP_SCREEN, BLOCK_TYPES.MOVE_DOWN_SCREEN, BLOCK_TYPES.STAY_STILL]],
    ["reach-enemy-flag", [BLOCK_TYPES.MOVE_BACKWARD]],
    ["score-a-point", [BLOCK_TYPES.IF_HAVE_ENEMY_FLAG]],
    ["barrier-detour", [BLOCK_TYPES.IF_BARRIER_IN_FRONT, BLOCK_TYPES.IF_BARRIER_IN_FRONT_ELSE]],
    ["sensor-barrier-branch", [BLOCK_TYPES.IF_SENSOR_MATCHES, BLOCK_TYPES.IF_SENSOR_MATCHES_ELSE]],
    ["move-toward-flag", [BLOCK_TYPES.MOVE_TOWARD]]
  ];

  for (const [levelId, expectedBlocks] of expectations) {
    const level = app.state.levels.find((entry) => entry.id === levelId);
    const toolbox = getToolboxBlockTypesForMode(app, level);
    for (const blockType of expectedBlocks) {
      assert.ok(toolbox.includes(blockType), `${levelId} should include ${blockType}`);
    }
  }

  const sensingLevel = app.state.levels.find((level) => level.id === "sensor-barrier-branch");
  assert.deepEqual(sensingLevel.sensorObjectTypes, [SENSOR_OBJECT_TYPES.BARRIER]);
  assert.deepEqual(sensingLevel.sensorRelationTypes, [SENSOR_RELATION_TYPES.DIRECTLY_IN_FRONT]);
});

test("guided sensing unlocks progress in authored stages", () => {
  const levels = getLevelDefinitions();
  const watchTheWall = levels.find((level) => level.id === "watch-the-wall");
  assert.deepEqual(watchTheWall.sensorObjectTypes, [SENSOR_OBJECT_TYPES.EDGE_OR_WALL]);
  assert.deepEqual(watchTheWall.sensorRelationTypes, [SENSOR_RELATION_TYPES.DIRECTLY_IN_FRONT]);

  const findTheHuman = levels.find((level) => level.id === "find-the-human");
  assert.deepEqual(findTheHuman.sensorObjectTypes, [SENSOR_OBJECT_TYPES.HUMAN_RUNNER]);
  assert.deepEqual(findTheHuman.sensorRelationTypes, [
    SENSOR_RELATION_TYPES.ANYWHERE_FORWARD,
    SENSOR_RELATION_TYPES.ANYWHERE_BEHIND,
    SENSOR_RELATION_TYPES.ANYWHERE_ABOVE,
    SENSOR_RELATION_TYPES.ANYWHERE_BELOW
  ]);
});

test("guided Move Toward and human-input levels keep their authored restrictions and copy", () => {
  const levels = getLevelDefinitions();
  const moveTowardFlag = levels.find((level) => level.id === "move-toward-flag");
  assert.deepEqual(moveTowardFlag.moveTowardTargetTypes, [MOVE_TOWARD_TARGETS.ENEMY_FLAG]);
  assert.deepEqual(moveTowardFlag.setupOverrides.flagOverrides[2], { gridX: 11, gridY: 3 });

  const bringItHome = levels.find((level) => level.id === "bring-it-home");
  assert.deepEqual(bringItHome.moveTowardTargetTypes, [MOVE_TOWARD_TARGETS.ENEMY_FLAG, MOVE_TOWARD_TARGETS.MY_BASE]);
  assert.ok(bringItHome.toolboxBlockTypes.includes(BLOCK_TYPES.IF_HAVE_ENEMY_FLAG_ELSE));

  const humanPractice = levels.find((level) => level.id === "human-runner-practice");
  assert.equal(humanPractice.humanTurnBehavior, HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT);
  assert.equal(humanPractice.failureCondition.maxTurns, 200);
  assert.deepEqual(humanPractice.winCondition.actionTypes, [
    AI_ACTION_TYPES.JUMP_FORWARD,
    AI_ACTION_TYPES.PLACE_BARRIER_FORWARD
  ]);
  assert.match(humanPractice.description, /Jump or Place Barrier/i);
});

test("later guided resource levels expose the intended freeze tools and sensing options", () => {
  const freezeLane = getLevelDefinitions().find((level) => level.id === "freeze-the-lane");
  assert.ok(freezeLane.toolboxBlockTypes.includes(BLOCK_TYPES.FREEZE_OPPONENTS));
  assert.ok(freezeLane.toolboxBlockTypes.includes(BLOCK_TYPES.IF_AREA_FREEZE_READY_ELSE));
  assert.deepEqual(freezeLane.sensorObjectTypes, [SENSOR_OBJECT_TYPES.ENEMY_RUNNER]);
  assert.deepEqual(freezeLane.sensorRelationTypes, [SENSOR_RELATION_TYPES.WITHIN_2, SENSOR_RELATION_TYPES.WITHIN_3]);
});

test("guided tutorial and authored board contracts remain consistent", () => {
  const level6 = getLevelDefinitions().find((level) => level.id === "sensor-barrier-branch");
  const demoStep = level6.tutorialSteps.find((step) => step.id === "level-6-generic-sensor");
  assert.match(demoStep.demoBlocklyXml, /battlegorithms_if_sensor_matches_else/);
  assert.equal(demoStep.demoTitle, "Example sensor branch");

  const level4 = getLevelDefinitions().find((level) => level.id === "barrier-detour");
  assert.deepEqual(level4.winCondition.targetCell, { x: 6, y: 4 });
  assert.ok(level4.toolboxBlockTypes.includes(BLOCK_TYPES.IF_BARRIER_IN_FRONT_ELSE));

  const moveTowardLevel = getLevelDefinitions().find((level) => level.id === "move-toward-flag");
  assert.deepEqual(moveTowardLevel.setupOverrides.flagOverrides[2], { gridX: 11, gridY: 3 });
});

test("level 12 reference route requires both horizontal and vertical movement", () => {
  const { app } = runGuidedLevelWithSolution("bring-it-home", GUIDED_LEVEL_REFERENCE_SOLUTIONS["bring-it-home"]);
  const allyHistory = app.state.runnerActionHistory["runner_1_AI_AllyP1"] || [];
  assert.ok(allyHistory.includes(AI_ACTION_TYPES.MOVE_FORWARD));
  assert.ok(allyHistory.includes(AI_ACTION_TYPES.MOVE_UP_SCREEN));
});

test("level 20 authored setup keeps the midfield enemy as an NPC runner", () => {
  const app = createApp();
  initializeLevelState(app);
  Object.keys(app.state.levelProgress).forEach((levelId) => {
    app.state.levelProgress[levelId] = LEVEL_STATUS.PASSED;
  });
  app.state.levelProgress["freeze-the-lane"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "freeze-the-lane");

  const laneEnemy = app.state.allRunners.find((runner) => runner.id === "runner_2_Npc1");
  assert.equal(laneEnemy.isNPC, true);
  assert.equal(laneEnemy.runnerRole, "npc");
});

test("generic sensing authored levels keep their support targets open", () => {
  const findTheHuman = getLevelDefinitions().find((entry) => entry.id === "find-the-human");
  assert.deepEqual(findTheHuman.winCondition.targetCell, { x: 5, y: 2 });
  const humanSetup = findTheHuman.setup.teams.player.runners.find((runner) => runner.slot === "human");
  assert.equal(humanSetup.gridX, 6);
  assert.equal(humanSetup.gridY, 2);
  assert.ok(findTheHuman.setup.barriers.some((barrier) => barrier.gridX === 7 && barrier.gridY === 2));
  assert.ok(findTheHuman.tutorialSteps.some((step) => step.demoBlocklyXml?.includes("ANYWHERE_FORWARD")));

  const relayRace = getLevelDefinitions().find((entry) => entry.id === "relay-race");
  assert.deepEqual(relayRace.winCondition.targetCell, { x: 6, y: 3 });
  const relayHuman = relayRace.setup.teams.player.runners.find((runner) => runner.slot === "human");
  assert.equal(relayHuman.gridX, 6);
  assert.equal(relayHuman.gridY, 2);
});

test("generic sensing authored levels unlock sequentially and preserve open target cells at runtime", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["move-to-target"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["reach-enemy-flag"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["score-a-point"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["barrier-detour"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["mirror-forward"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["sensor-barrier-branch"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "sensor-barrier-branch");
  let actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 6;
  actor.gridY = 4;
  evaluateLevelProgress(app);
  assert.equal(app.state.levelProgress["watch-the-wall"], LEVEL_STATUS.AVAILABLE);

  app.state.levelProgress["watch-the-wall"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "watch-the-wall");
  actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 5;
  actor.gridY = 5;
  evaluateLevelProgress(app);
  assert.equal(app.state.levelProgress["find-the-human"], LEVEL_STATUS.AVAILABLE);

  app.state.levelProgress["find-the-human"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "find-the-human");
  assert.equal(app.state.allRunners.find((runner) => runner.gridX === 5 && runner.gridY === 2), undefined);

  startLevel(app, "relay-race");
  assert.equal(app.state.allRunners.find((runner) => runner.gridX === 6 && runner.gridY === 3), undefined);
});
