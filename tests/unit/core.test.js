import test from "node:test";
import assert from "node:assert/strict";
import * as Blockly from "blockly";
import {
  AI_ACTION_TYPES,
  BLOCK_TYPES,
  FREE_PLAY_MODES,
  GAME_MODES,
  GAME_VIEW_MODES,
  MIRROR_RUNNER_EMOJI_WITH_TRANSFORM,
  HUMAN_TURN_BEHAVIORS,
  LEVEL_RESULT,
  LEVEL_STATUS,
  MAIN_GAME_STATES,
  AREA_FREEZE_DURATION_TURNS,
  MOVE_TOWARD_TARGETS,
  SENSOR_OBJECT_TYPES,
  SENSOR_RELATION_TYPES,
  USE_DIRECTIONAL_RUNNER_GLYPHS
} from "../../src/config/constants.js";
import { getLevelDefinitions } from "../../src/config/levels.js";
import { buildMatch } from "../../src/testSupport/builders.js";
import { evaluateCondition, evaluateSensorCondition } from "../../src/core/conditions.js";
import {
  isCellBlockedByImpassables,
  isCellBlockedForRunner,
  translateActionDecision,
  translateMoveTowardDecision
} from "../../src/core/movement.js";
import { resolveCollision } from "../../src/core/collisions.js";
import { checkForFlagPickup, checkForScoring } from "../../src/core/scoring.js";
import { resetRound } from "../../src/core/setup.js";
import { checkInvariants } from "../../src/core/invariants.js";
import { calculateNpcType1Action } from "../../src/ai/npc/npcType1.js";
import { calculateNpcType2Action } from "../../src/ai/npc/npcType2.js";
import { createApp } from "../../src/core/state.js";
import { buildRuntimeTeams, createRandomizedFreePlayTeamSetup } from "../../src/core/teams.js";
import {
  completeLevel,
  enterFreePlay,
  evaluateLevelProgress,
  getLevelGoalCell,
  getLevelStateSnapshot,
  initializeLevelState,
  resetCurrentLevel,
  setGuidedHumanTurnBehavior,
  startLevel
} from "../../src/core/levels.js";
import {
  getToolboxBlockTypesForMode,
  registerBattleBlocklyBlocks
} from "../../src/ai/blockly/blocks.js";
import { getFirstRunnableAction, loadWorkspaceXml, updateBlocklyExecutionHints } from "../../src/ai/blockly/workspace.js";
import { processTurnActions } from "../../src/core/turnEngine.js";
import { Runner } from "../../src/entities/Runner.js";
import { handleKeyInput } from "../../src/ui/controls.js";

function buildBlocklyAppWithXml(xmlText) {
  registerBattleBlocklyBlocks();
  const app = createApp();
  app.blocklyWorkspace = new Blockly.Workspace();
  loadWorkspaceXml(app, xmlText);
  return app;
}

const TEST_P5 = {
  lerp(start, end, amount) {
    return start + (end - start) * amount;
  }
};

function buildSolutionXml(innerBlockXml) {
  return `
    <xml xmlns="https://developers.google.com/blockly/xml">
      <block type="battlegorithms_on_each_turn" x="24" y="24">
        <next>
          ${innerBlockXml}
        </next>
      </block>
    </xml>
  `;
}

const GUIDED_LEVEL_REFERENCE_SOLUTIONS = {
  "move-to-target": buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`),
  "reach-enemy-flag": buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`),
  "score-a-point": buildSolutionXml(`
    <block type="battlegorithms_if_have_enemy_flag_else">
      <statement name="DO">
        <block type="battlegorithms_move_backward"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "barrier-detour": buildSolutionXml(`
    <block type="battlegorithms_if_barrier_in_front_else">
      <statement name="DO">
        <block type="battlegorithms_move_down_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "mirror-forward": buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`),
  "sensor-barrier-branch": buildSolutionXml(`
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
  `),
  "watch-the-wall": buildSolutionXml(`
    <block type="battlegorithms_if_sensor_matches_else">
      <field name="OBJECT">EDGE_OR_WALL</field>
      <field name="RELATION">DIRECTLY_IN_FRONT</field>
      <statement name="DO">
        <block type="battlegorithms_move_down_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "find-the-human": buildSolutionXml(`
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
  `),
  "find-the-enemy-flag": buildSolutionXml(`
    <block type="battlegorithms_if_sensor_matches_else">
      <field name="OBJECT">ENEMY_FLAG</field>
      <field name="RELATION">ANYWHERE_ABOVE</field>
      <statement name="DO">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "move-toward-flag": buildSolutionXml(`
    <block type="battlegorithms_move_toward">
      <field name="TARGET">ENEMY_FLAG</field>
    </block>
  `),
  "bring-it-home": buildSolutionXml(`
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
  `),
  "enemy-nearby": buildSolutionXml(`
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
  `),
  "jump-the-gap": buildSolutionXml(`
    <block type="battlegorithms_jump_forward"></block>
  `),
  "jump-if-ready": buildSolutionXml(`
    <block type="battlegorithms_if_can_jump_else">
      <statement name="DO">
        <block type="battlegorithms_jump_forward"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "build-the-barrier": buildSolutionXml(`<block type="battlegorithms_place_barrier"></block>`),
  "stay-still-can-do-something": buildSolutionXml(`
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
  `),
  "relay-race": buildSolutionXml(`
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
  `),
  "my-side-their-side": buildSolutionXml(`
    <block type="battlegorithms_if_on_my_side_else">
      <statement name="DO">
        <block type="battlegorithms_move_forward"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
    </block>
  `),
  "freeze-the-lane": buildSolutionXml(`
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
  `),
  "closest-threat": buildSolutionXml(`
    <block type="battlegorithms_move_toward">
      <field name="TARGET">CLOSEST_ENEMY</field>
    </block>
  `),
  "how-far-away": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_distance_to_target">
              <field name="TARGET">CLOSEST_ENEMY</field>
            </block>
          </value>
          <field name="OPERATOR">LTE</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">2</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "two-conditions-at-once": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_logic_and">
          <value name="LEFT">
            <block type="battlegorithms_value_compare">
              <value name="LEFT">
                <block type="battlegorithms_value_distance_to_target">
                  <field name="TARGET">CLOSEST_ENEMY</field>
                </block>
              </value>
              <field name="OPERATOR">LTE</field>
              <value name="RIGHT">
                <block type="battlegorithms_value_number">
                  <field name="VALUE">2</field>
                </block>
              </value>
            </block>
          </value>
          <value name="RIGHT">
            <block type="battlegorithms_boolean_area_freeze_ready"></block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_freeze_opponents"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">ENEMY_FLAG</field>
        </block>
      </statement>
    </block>
  `),
  "this-or-that": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_logic_or">
          <value name="LEFT">
            <block type="battlegorithms_boolean_on_enemy_side"></block>
          </value>
          <value name="RIGHT">
            <block type="battlegorithms_boolean_sensor_matches">
              <field name="OBJECT">ENEMY_RUNNER</field>
              <field name="RELATION">WITHIN_2</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "flip-the-answer": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_logic_not">
          <value name="VALUE">
            <block type="battlegorithms_boolean_on_my_side"></block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "enemy-side-decision-making": buildSolutionXml(`
    <block type="battlegorithms_if_on_enemy_side_else">
      <statement name="DO">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "one-program-two-allies": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">0</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">ENEMY_FLAG</field>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_stay_still"></block>
      </statement>
    </block>
  `),
  "index-jobs": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">0</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">ENEMY_FLAG</field>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
    </block>
  `),
  "first-two-defend": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">LT</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">2</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "escort-the-carrier": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_boolean_teammate_has_flag"></block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_if_boolean_else">
          <value name="BOOL">
            <block type="battlegorithms_value_compare">
              <value name="LEFT">
                <block type="battlegorithms_value_runner_index"></block>
              </value>
              <field name="OPERATOR">EQ</field>
              <value name="RIGHT">
                <block type="battlegorithms_value_number">
                  <field name="VALUE">0</field>
                </block>
              </value>
            </block>
          </value>
          <statement name="DO">
            <block type="battlegorithms_move_toward">
              <field name="TARGET">MY_BASE</field>
            </block>
          </statement>
          <statement name="ELSE">
            <block type="battlegorithms_move_forward"></block>
          </statement>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_stay_still"></block>
      </statement>
    </block>
  `),
  "closest-enemy-defender": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">0</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">ENEMY_FLAG</field>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">CLOSEST_ENEMY</field>
        </block>
      </statement>
    </block>
  `),
  "freeze-support": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">1</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_freeze_opponents"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">ENEMY_FLAG</field>
        </block>
      </statement>
    </block>
  `),
  "barrier-specialist": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">1</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_if_can_place_barrier_else">
          <statement name="DO">
            <block type="battlegorithms_place_barrier"></block>
          </statement>
          <statement name="ELSE">
            <block type="battlegorithms_stay_still"></block>
          </statement>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "jump-team": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">0</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_if_can_jump_else">
          <statement name="DO">
            <block type="battlegorithms_jump_forward"></block>
          </statement>
          <statement name="ELSE">
            <block type="battlegorithms_move_forward"></block>
          </statement>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_down_screen"></block>
      </statement>
    </block>
  `),
  "advanced-scrimmage": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">0</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_if_boolean_else">
          <value name="BOOL">
            <block type="battlegorithms_boolean_have_enemy_flag"></block>
          </value>
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
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_if_boolean_else">
          <value name="BOOL">
            <block type="battlegorithms_value_compare">
              <value name="LEFT">
                <block type="battlegorithms_value_runner_index"></block>
              </value>
              <field name="OPERATOR">EQ</field>
              <value name="RIGHT">
                <block type="battlegorithms_value_number">
                  <field name="VALUE">1</field>
                </block>
              </value>
            </block>
          </value>
          <statement name="DO">
            <block type="battlegorithms_move_toward">
              <field name="TARGET">CLOSEST_ENEMY</field>
            </block>
          </statement>
          <statement name="ELSE">
            <block type="battlegorithms_stay_still"></block>
          </statement>
        </block>
      </statement>
    </block>
  `),
  "optional-random-lab": buildSolutionXml(`
    <block type="battlegorithms_move_randomly"></block>
  `)
};

function runGuidedLevelWithSolution(levelId, xmlText) {
  registerBattleBlocklyBlocks();
  const app = createApp();
  app.blocklyWorkspace = new Blockly.Workspace();
  app.state.randomFn = () => 0;
  initializeLevelState(app);
  startLevel(app, levelId);
  loadWorkspaceXml(app, xmlText);

  const trace = [];
  for (let tick = 0; tick < 4000; tick += 1) {
    const activeRunner = app.state.allRunners[app.state.activeRunnerIndex];
    trace.push({
      tick,
      turn: app.state.currentTurnNumber,
      runner: activeRunner?.id || null,
      state: app.state.currentTurnState,
      result: app.state.activeLevelResult
    });

    if (app.state.activeLevelResult === LEVEL_RESULT.PASSED || app.state.activeLevelResult === LEVEL_RESULT.FAILED) {
      break;
    }
    processTurnActions(app, TEST_P5);
  }

  return { app, trace };
}

test("PvP setup creates four runners with two humans", () => {
  const app = buildMatch({ currentGameMode: GAME_MODES.PLAYER_VS_PLAYER });
  assert.equal(app.state.allRunners.length, 4);
  assert.equal(app.state.allRunners.filter((runner) => runner.isHumanControlled).length, 2);
});

test("PvNPC setup creates two NPCs", () => {
  const app = buildMatch({ currentGameMode: GAME_MODES.PLAYER_VS_NPC });
  assert.equal(app.state.allRunners.length, 4);
  assert.equal(app.state.allRunners.filter((runner) => runner.isNPC).length, 2);
});

test("movement helper blocks wall cells", () => {
  const app = buildMatch();
  const blocked = isCellBlockedByImpassables(-1, 0, app.state.barriers, app.state.gameMap);
  assert.equal(blocked, true);
});

test("own team cannot enter its home flag cell while the flag is at base", () => {
  const app = buildMatch();
  const playerRunner = app.state.allRunners.find((runner) => runner.team === 1);
  const enemyRunner = app.state.allRunners.find((runner) => runner.team === 2);
  const playerFlag = app.state.gameFlags[1];

  assert.equal(
    isCellBlockedForRunner(playerFlag.gridX, playerFlag.gridY, app.state.barriers, app.state.gameMap, app.state, playerRunner),
    true
  );
  assert.equal(
    isCellBlockedForRunner(playerFlag.gridX, playerFlag.gridY, app.state.barriers, app.state.gameMap, app.state, enemyRunner),
    false
  );

  playerFlag.isAtBase = false;
  playerFlag.carriedByRunnerId = "runner_2_Npc1";

  assert.equal(
    isCellBlockedForRunner(playerFlag.gridX, playerFlag.gridY, app.state.barriers, app.state.gameMap, app.state, playerRunner),
    false
  );
});

test("translateActionDecision converts move-forward into a target cell", () => {
  const app = buildMatch();
  const runner = app.state.allRunners[1];
  const queued = translateActionDecision(runner, { type: "MOVE_FORWARD" });
  assert.equal(queued.targetGridX, runner.gridX + runner.playDirection);
  assert.equal(queued.targetGridY, runner.gridY);
});

test("collision resolves in favor of defender side", () => {
  const app = buildMatch();
  const attacker = app.state.allRunners[0];
  const defender = app.state.allRunners[2];
  attacker.gridX = 8;
  attacker.gridY = 3;
  defender.gridX = 9;
  defender.gridY = 3;
  const outcome = resolveCollision(app.state, attacker, defender, 9, 3, { x: 8, y: 3 });
  assert.equal(outcome.winner.id, defender.id);
  assert.equal(outcome.loser.id, attacker.id);
  assert.deepEqual(outcome.loserCell, { x: 8, y: 3 });
});

test("collision processing leaves one runner on the collision cell and freezes the loser on the origin cell", () => {
  const app = buildMatch();
  const attacker = app.state.allRunners[0];
  const defender = app.state.allRunners[2];

  attacker.gridX = 8;
  attacker.gridY = 3;
  attacker.pixelX = attacker.gridX * 50;
  attacker.pixelY = attacker.gridY * 50;
  defender.gridX = 9;
  defender.gridY = 3;
  defender.pixelX = defender.gridX * 50;
  defender.pixelY = defender.gridY * 50;

  app.state.mainGameState = MAIN_GAME_STATES.RUNNING;
  app.state.currentTurnState = "PROCESSING_ACTION";
  app.state.activeRunnerIndex = app.state.allRunners.indexOf(attacker);
  app.state.queuedActionForCurrentRunner = {
    runner: attacker,
    actionType: AI_ACTION_TYPES.MOVE_FORWARD,
    targetGridX: 9,
    targetGridY: 3
  };

  processTurnActions(app, TEST_P5);

  assert.deepEqual({ x: defender.gridX, y: defender.gridY }, { x: 9, y: 3 });
  assert.deepEqual({ x: attacker.gridX, y: attacker.gridY }, { x: 8, y: 3 });
  assert.equal(attacker.isFrozen, true);
  assert.equal(defender.isFrozen, false);
  assert.equal(checkInvariants(app.state), true);
});

test("flag pickup and scoring update team score", () => {
  const app = buildMatch();
  const runner = app.state.allRunners[0];
  const enemyFlag = app.state.gameFlags[2];
  runner.gridX = enemyFlag.gridX;
  runner.gridY = enemyFlag.gridY;
  checkForFlagPickup(app.state, runner);
  assert.equal(runner.hasEnemyFlag, true);
  runner.gridX = 0;
  runner.gridY = 3;
  const scored = checkForScoring(app.state, runner);
  assert.equal(scored, true);
  assert.equal(app.state.teamScores[1], 1);
  assert.equal(runner.hasEnemyFlag, false);
  assert.equal(enemyFlag.carriedByRunnerId, null);
  assert.equal(enemyFlag.gridX, enemyFlag.initialGridX);
  assert.equal(enemyFlag.gridY, enemyFlag.initialGridY);
  assert.equal(enemyFlag.isAtBase, true);
});

test("resetRound restores runners and clears barriers", () => {
  const app = buildMatch();
  const runner = app.state.allRunners[0];
  runner.gridX = 5;
  runner.isFrozen = true;
  app.state.barriers.push({ id: "b1", ownerRunnerId: runner.id, gridX: 4, gridY: 4 });
  resetRound(app.state);
  assert.equal(runner.gridX, runner.initialGridX);
  assert.equal(runner.isFrozen, false);
  assert.equal(app.state.barriers.length, 0);
});

test("invariants pass for default match state", () => {
  const app = buildMatch();
  assert.equal(checkInvariants(app.state), true);
});

test("runtime teams reject matches where both teams share the same playDirection", () => {
  assert.throws(
    () => buildRuntimeTeams({
      player: { playDirection: 1, runners: [] },
      opponent: { playDirection: 1, runners: [] }
    }),
    /different playDirection/
  );
});

test("free-play team setup randomizes which team attacks right or left while keeping one of each", () => {
  const leftFirst = createRandomizedFreePlayTeamSetup(GAME_MODES.PLAYER_VS_PLAYER, () => 0.25);
  const rightFirst = createRandomizedFreePlayTeamSetup(GAME_MODES.PLAYER_VS_PLAYER, () => 0.75);

  assert.equal(leftFirst.player.playDirection, 1);
  assert.equal(leftFirst.opponent.playDirection, -1);
  assert.equal(rightFirst.player.playDirection, -1);
  assert.equal(rightFirst.opponent.playDirection, 1);
});

test("free-play PvP team setup supports team sizes up to six with one human plus allies per side", () => {
  const setup = createRandomizedFreePlayTeamSetup(FREE_PLAY_MODES.PLAYER_VS_PLAYER, 6, () => 0.25);

  assert.equal(setup.player.runners.length, 6);
  assert.equal(setup.opponent.runners.length, 6);
  assert.equal(setup.player.runners.filter((runner) => runner.isHumanControlled).length, 1);
  assert.equal(setup.opponent.runners.filter((runner) => runner.isHumanControlled).length, 1);
  assert.equal(setup.player.runners.filter((runner) => !runner.isHumanControlled && !runner.isNPC).length, 5);
  assert.equal(setup.opponent.runners.filter((runner) => !runner.isHumanControlled && !runner.isNPC).length, 5);
});

test("free-play PvCPU setups create the expected player and CPU runner counts", () => {
  const easySetup = createRandomizedFreePlayTeamSetup(FREE_PLAY_MODES.PLAYER_VS_CPU_EASY, 4, () => 0.25);
  const tacticalSetup = createRandomizedFreePlayTeamSetup(FREE_PLAY_MODES.PLAYER_VS_CPU_TACTICAL, 5, () => 0.25);

  assert.equal(easySetup.player.runners.filter((runner) => runner.isHumanControlled).length, 1);
  assert.equal(easySetup.player.runners.filter((runner) => !runner.isHumanControlled && !runner.isNPC).length, 3);
  assert.equal(easySetup.opponent.runners.filter((runner) => runner.isNPC).length, 4);

  assert.equal(tacticalSetup.player.runners.filter((runner) => runner.isHumanControlled).length, 1);
  assert.equal(tacticalSetup.player.runners.filter((runner) => !runner.isHumanControlled && !runner.isNPC).length, 4);
  assert.equal(tacticalSetup.opponent.runners.filter((runner) => runner.cpuRole === "attacker").length, 2);
  assert.equal(tacticalSetup.opponent.runners.filter((runner) => runner.cpuRole === "defender").length, 3);
});

test("npc type 1 returns a legal action shape", () => {
  const app = buildMatch({ currentGameMode: GAME_MODES.PLAYER_VS_NPC });
  const npc = app.state.allRunners.find((runner) => runner.isNPC);
  const action = calculateNpcType1Action(npc, app.state);
  assert.ok(action.actionType);
});

test("npc type 2 returns a legal action shape", () => {
  const app = buildMatch({ currentGameMode: GAME_MODES.PLAYER_VS_NPC });
  const npc = app.state.allRunners.find((runner) => runner.isNPC);
  const action = calculateNpcType2Action(npc, app.state);
  assert.ok(action.actionType);
});

test("level definitions load with the expected starter levels", () => {
  const levels = getLevelDefinitions();
  assert.equal(levels.length, 36);
  assert.deepEqual(
    levels.map((level) => level.id),
    [
      "move-to-target",
      "reach-enemy-flag",
      "score-a-point",
      "barrier-detour",
      "mirror-forward",
      "sensor-barrier-branch",
      "watch-the-wall",
      "find-the-human",
      "find-the-enemy-flag",
      "human-runner-practice",
      "move-toward-flag",
      "bring-it-home",
      "enemy-nearby",
      "jump-the-gap",
      "jump-if-ready",
      "build-the-barrier",
      "stay-still-can-do-something",
      "relay-race",
      "my-side-their-side",
      "freeze-the-lane",
      "closest-threat",
      "how-far-away",
      "two-conditions-at-once",
      "this-or-that",
      "flip-the-answer",
      "enemy-side-decision-making",
      "one-program-two-allies",
      "index-jobs",
      "first-two-defend",
      "escort-the-carrier",
      "closest-enemy-defender",
      "freeze-support",
      "barrier-specialist",
      "jump-team",
      "advanced-scrimmage",
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

test("advanced boolean and number inputs stay enabled when attached under If [boolean]", () => {
  registerBattleBlocklyBlocks();
  const app = createApp();
  app.blocklyWorkspace = new Blockly.Workspace();
  loadWorkspaceXml(app, buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">0</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_forward"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_stay_still"></block>
      </statement>
    </block>
  `));

  updateBlocklyExecutionHints(app);

  const compareBlock = app.blocklyWorkspace.getBlocksByType(BLOCK_TYPES.VALUE_COMPARE, false)[0];
  const indexBlock = app.blocklyWorkspace.getBlocksByType(BLOCK_TYPES.VALUE_RUNNER_INDEX, false)[0];
  const numberBlock = app.blocklyWorkspace.getBlocksByType(BLOCK_TYPES.VALUE_NUMBER, false)[0];

  assert.equal(compareBlock.isEnabled(), true);
  assert.equal(indexBlock.isEnabled(), true);
  assert.equal(numberBlock.isEnabled(), true);
  numberBlock.setFieldValue("3", "VALUE");
  assert.equal(numberBlock.getFieldValue("VALUE"), 3);
});

test("trivial advanced solutions no longer pass the redesigned levels", () => {
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

test("advanced scrimmage opens the full guided capstone toolbox and uses active enemies", () => {
  const level = getLevelDefinitions().find((entry) => entry.id === "advanced-scrimmage");
  assert.ok(level.toolboxBlockTypes.includes(BLOCK_TYPES.MOVE_RANDOMLY));
  assert.ok(level.toolboxBlockTypes.includes(BLOCK_TYPES.PLACE_BARRIER));
  assert.ok(level.toolboxBlockTypes.includes(BLOCK_TYPES.JUMP_FORWARD));
  assert.ok(level.toolboxBlockTypes.includes(BLOCK_TYPES.FREEZE_OPPONENTS));
  assert.equal(level.setup.teams.opponent.runners.every((runner) => !runner.isFrozen), true);
});

test("optional Move Randomly lab is present after the capstone", () => {
  const level = getLevelDefinitions().find((entry) => entry.id === "optional-random-lab");
  assert.ok(level);
  assert.equal(level.toolboxBlockTypes.includes(BLOCK_TYPES.MOVE_RANDOMLY), true);
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

test("guided toolbox restriction reflects each level's allowed blocks", () => {
  const app = createApp();
  initializeLevelState(app);

  const firstLevelToolbox = getToolboxBlockTypesForMode(app, app.state.levels[0]);
  assert.deepEqual(firstLevelToolbox, [
    BLOCK_TYPES.MOVE_FORWARD,
    BLOCK_TYPES.MOVE_UP_SCREEN,
    BLOCK_TYPES.MOVE_DOWN_SCREEN,
    BLOCK_TYPES.STAY_STILL
  ]);

  app.state.currentLevelId = "reach-enemy-flag";
  const secondLevel = app.state.levels.find((level) => level.id === "reach-enemy-flag");
  const secondLevelToolbox = getToolboxBlockTypesForMode(app, secondLevel);
  assert.ok(secondLevelToolbox.includes(BLOCK_TYPES.MOVE_BACKWARD));

  const thirdLevel = app.state.levels.find((level) => level.id === "score-a-point");
  const thirdLevelToolbox = getToolboxBlockTypesForMode(app, thirdLevel);
  assert.ok(thirdLevelToolbox.includes(BLOCK_TYPES.IF_HAVE_ENEMY_FLAG));

  const fourthLevel = app.state.levels.find((level) => level.id === "barrier-detour");
  const fourthLevelToolbox = getToolboxBlockTypesForMode(app, fourthLevel);
  assert.ok(fourthLevelToolbox.includes(BLOCK_TYPES.IF_BARRIER_IN_FRONT));
  assert.ok(fourthLevelToolbox.includes(BLOCK_TYPES.IF_BARRIER_IN_FRONT_ELSE));

  const sixthLevel = app.state.levels.find((level) => level.id === "sensor-barrier-branch");
  const sixthLevelToolbox = getToolboxBlockTypesForMode(app, sixthLevel);
  assert.ok(sixthLevelToolbox.includes(BLOCK_TYPES.IF_SENSOR_MATCHES));
  assert.ok(sixthLevelToolbox.includes(BLOCK_TYPES.IF_SENSOR_MATCHES_ELSE));
  assert.deepEqual(sixthLevel.sensorObjectTypes, [SENSOR_OBJECT_TYPES.BARRIER]);
  assert.deepEqual(sixthLevel.sensorRelationTypes, [SENSOR_RELATION_TYPES.DIRECTLY_IN_FRONT]);

  const eleventhLevel = app.state.levels.find((level) => level.id === "move-toward-flag");
  const eleventhLevelToolbox = getToolboxBlockTypesForMode(app, eleventhLevel);
  assert.ok(eleventhLevelToolbox.includes(BLOCK_TYPES.MOVE_TOWARD));
});

test("later sensing levels expose the intended object and relation unlocks", () => {
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

test("later guided levels expose the intended Move Toward and advanced condition restrictions", () => {
  const levels = getLevelDefinitions();
  const moveTowardFlag = levels.find((level) => level.id === "move-toward-flag");
  assert.deepEqual(moveTowardFlag.moveTowardTargetTypes, [MOVE_TOWARD_TARGETS.ENEMY_FLAG]);

  const bringItHome = levels.find((level) => level.id === "bring-it-home");
  assert.deepEqual(bringItHome.moveTowardTargetTypes, [
    MOVE_TOWARD_TARGETS.ENEMY_FLAG,
    MOVE_TOWARD_TARGETS.MY_BASE
  ]);
  assert.ok(bringItHome.toolboxBlockTypes.includes(BLOCK_TYPES.IF_HAVE_ENEMY_FLAG_ELSE));

  const humanPractice = levels.find((level) => level.id === "human-runner-practice");
  assert.equal(humanPractice.humanTurnBehavior, HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT);
  assert.equal(humanPractice.failureCondition.maxTurns, 200);

  const freezeLane = levels.find((level) => level.id === "freeze-the-lane");
  assert.ok(freezeLane.toolboxBlockTypes.includes(BLOCK_TYPES.FREEZE_OPPONENTS));
  assert.ok(freezeLane.toolboxBlockTypes.includes(BLOCK_TYPES.IF_AREA_FREEZE_READY_ELSE));
  assert.deepEqual(freezeLane.sensorObjectTypes, [SENSOR_OBJECT_TYPES.ENEMY_RUNNER]);
  assert.deepEqual(freezeLane.sensorRelationTypes, [SENSOR_RELATION_TYPES.WITHIN_2, SENSOR_RELATION_TYPES.WITHIN_3]);
});

test("level 6 tutorial includes the generic sensor demo preview", () => {
  const level6 = getLevelDefinitions().find((level) => level.id === "sensor-barrier-branch");
  const demoStep = level6.tutorialSteps.find((step) => step.id === "level-6-generic-sensor");
  assert.match(demoStep.demoBlocklyXml, /battlegorithms_if_sensor_matches_else/);
  assert.equal(demoStep.demoTitle, "Example sensor branch");
});

test("level 12 setup makes Move Toward use both horizontal and vertical movement", () => {
  const { app } = runGuidedLevelWithSolution("bring-it-home", GUIDED_LEVEL_REFERENCE_SOLUTIONS["bring-it-home"]);
  const allyHistory = app.state.runnerActionHistory["runner_1_AI_AllyP1"] || [];
  assert.ok(allyHistory.includes(AI_ACTION_TYPES.MOVE_FORWARD));
  assert.ok(allyHistory.includes(AI_ACTION_TYPES.MOVE_UP_SCREEN));
});

test("level 1 passes when the ally reaches the target cell and unlocks level 2", () => {
  const app = createApp();
  initializeLevelState(app);
  startLevel(app, "move-to-target");

  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 4;
  actor.gridY = 4;

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" });
  assert.equal(app.state.levelProgress["move-to-target"], LEVEL_STATUS.PASSED);
  assert.equal(app.state.levelProgress["reach-enemy-flag"], LEVEL_STATUS.AVAILABLE);
  assert.deepEqual(app.state.goalBurstEffect && {
    cellX: app.state.goalBurstEffect.cellX,
    cellY: app.state.goalBurstEffect.cellY
  }, { cellX: 4, cellY: 4 });
});

test("level 2 passes when the ally reaches the enemy flag", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["reach-enemy-flag"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "reach-enemy-flag");

  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  const enemyFlag = app.state.gameFlags[2];
  actor.gridX = enemyFlag.gridX;
  actor.gridY = enemyFlag.gridY;

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" });
});

test("level 4 target matches the intended detour lane", () => {
  const level4 = getLevelDefinitions().find((level) => level.id === "barrier-detour");
  assert.deepEqual(level4.winCondition.targetCell, { x: 6, y: 4 });
  assert.ok(level4.toolboxBlockTypes.includes(BLOCK_TYPES.IF_BARRIER_IN_FRONT_ELSE));
});

test("level 3 passes when team 1 scores a point and unlocks level 4", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["reach-enemy-flag"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["score-a-point"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "score-a-point");

  app.state.teamScores[1] = 1;

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" });
  assert.equal(app.state.levelProgress["barrier-detour"], LEVEL_STATUS.AVAILABLE);
});

test("level 3 goal marker stays on the home flag after the point is scored", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["reach-enemy-flag"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["score-a-point"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "score-a-point");

  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 2;
  actor.gridY = 4;
  actor.hasEnemyFlag = true;
  assert.deepEqual(getLevelGoalCell(app), { x: 1, y: 4 });

  actor.hasEnemyFlag = false;
  actor.gridX = 1;
  app.state.teamScores[1] = 1;
  assert.deepEqual(getLevelGoalCell(app), { x: 1, y: 4 });
});

test("level 3 turn limit allows the intended out-and-back route", () => {
  const level3 = getLevelDefinitions().find((level) => level.id === "score-a-point");
  assert.equal(level3.failureCondition.maxTurns, 20);
});

test("guided auto-skip freezes the parked human runner for a clearer idle visual", () => {
  const app = createApp();
  initializeLevelState(app);
  startLevel(app, "score-a-point");

  const human = app.state.allRunners.find((runner) => runner.id === "runner_1_HumanP1");
  assert.equal(human.isFrozen, true);
  assert.equal(human.isAutoSkipFrozen, true);
  assert.equal(human.frozenTurnsRemaining, Number.POSITIVE_INFINITY);

  setGuidedHumanTurnBehavior(app, HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT);
  assert.equal(human.isFrozen, false);
  assert.equal(human.isAutoSkipFrozen, false);
  assert.equal(human.frozenTurnsRemaining, 0);
});

test("completing a guided score level anchors the goal burst to the scoring square", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["score-a-point"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "score-a-point");

  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 1;
  actor.gridY = 4;
  app.state.teamScores[1] = 1;

  completeLevel(app, LEVEL_RESULT.PASSED, "win_condition_met");
  assert.deepEqual(app.state.goalBurstEffect && {
    cellX: app.state.goalBurstEffect.cellX,
    cellY: app.state.goalBurstEffect.cellY
  }, { cellX: 1, cellY: 4 });
});

test("human practice level requires reaching the goal after a special action", () => {
  const app = createApp();
  initializeLevelState(app);
  Object.keys(app.state.levelProgress).forEach((levelId, index) => {
    app.state.levelProgress[levelId] = index === 9 ? LEVEL_STATUS.AVAILABLE : LEVEL_STATUS.PASSED;
  });
  startLevel(app, "human-runner-practice");

  const human = app.state.allRunners.find((runner) => runner.id === "runner_1_HumanP1");
  human.gridX = 4;
  human.gridY = 4;
  app.state.runnerActionHistory[human.id] = [AI_ACTION_TYPES.STAY_STILL];

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" });
});

test("human practice level accepts both J and F as jump keys", () => {
  const app = createApp();
  initializeLevelState(app);
  Object.keys(app.state.levelProgress).forEach((levelId, index) => {
    app.state.levelProgress[levelId] = index === 9 ? LEVEL_STATUS.AVAILABLE : LEVEL_STATUS.PASSED;
  });

  startLevel(app, "human-runner-practice");
  const human = app.state.allRunners.find((runner) => runner.id === "runner_1_HumanP1");
  app.state.activeRunnerIndex = app.state.allRunners.indexOf(human);
  const acceptedJ = handleKeyInput(app, "j");
  assert.equal(acceptedJ, true);
  assert.equal(app.state.queuedActionForCurrentRunner.actionType, AI_ACTION_TYPES.JUMP_FORWARD);

  startLevel(app, "human-runner-practice");
  const restartedHuman = app.state.allRunners.find((runner) => runner.id === "runner_1_HumanP1");
  app.state.activeRunnerIndex = app.state.allRunners.indexOf(restartedHuman);
  const acceptedF = handleKeyInput(app, "f");
  assert.equal(acceptedF, true);
  assert.equal(app.state.queuedActionForCurrentRunner.actionType, AI_ACTION_TYPES.JUMP_FORWARD);
});

test("resetting a guided level preserves workspace code and restores the ready state", () => {
  registerBattleBlocklyBlocks();
  const app = createApp();
  app.blocklyWorkspace = new Blockly.Workspace();
  initializeLevelState(app);
  loadWorkspaceXml(app, buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`));
  startLevel(app, "move-to-target");

  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 3;
  actor.gridY = 4;

  resetCurrentLevel(app);

  const restoredActor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  const xmlText = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(app.blocklyWorkspace));

  assert.equal(app.state.mainGameState, MAIN_GAME_STATES.SETUP);
  assert.equal(app.state.activeLevelResult, LEVEL_RESULT.NONE);
  assert.equal(restoredActor.gridX, restoredActor.initialGridX);
  assert.equal(restoredActor.gridY, restoredActor.initialGridY);
  assert.match(xmlText, /battlegorithms_move_forward/);
});

test("level 20 keeps the midfield enemy runner authored as an NPC", () => {
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

test("level 20 reference solution uses freeze, passes, and never overlaps runners", () => {
  const { app } = runGuidedLevelWithSolution(
    "freeze-the-lane",
    GUIDED_LEVEL_REFERENCE_SOLUTIONS["freeze-the-lane"]
  );

  assert.equal(app.state.activeLevelResult, LEVEL_RESULT.PASSED);
  assert.ok(app.state.runnerActionHistory.runner_1_AI_AllyP1.includes(AI_ACTION_TYPES.FREEZE_OPPONENTS));
  assert.equal(checkInvariants(app.state), true);
});

test("build the barrier level passes when the target barrier cell is occupied", () => {
  const app = createApp();
  initializeLevelState(app);
  Object.keys(app.state.levelProgress).forEach((levelId, index) => {
    app.state.levelProgress[levelId] = index < 15 ? LEVEL_STATUS.PASSED : LEVEL_STATUS.LOCKED;
  });
  app.state.levelProgress["build-the-barrier"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "build-the-barrier");

  app.state.barriers.push({ id: "test_barrier", ownerRunnerId: "runner_1_AI_AllyP1", gridX: 4, gridY: 4 });

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" });
});

test("level 4 passes when the ally reaches the detour target cell", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["score-a-point"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["barrier-detour"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "barrier-detour");

  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 6;
  actor.gridY = 4;

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" });
  assert.equal(app.state.levelProgress["mirror-forward"], LEVEL_STATUS.AVAILABLE);
});

test("level 5 teaches playDirection from the opposite side of the map", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["move-to-target"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["reach-enemy-flag"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["score-a-point"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["barrier-detour"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["mirror-forward"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "mirror-forward");

  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  assert.equal(actor.playDirection, -1);
  actor.gridX = 7;
  actor.gridY = 4;

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.PASSED, reason: "win_condition_met" });
  assert.equal(app.state.levelProgress["sensor-barrier-branch"], LEVEL_STATUS.AVAILABLE);
});

test("runner display emoji follows current playDirection for active and frozen states", () => {
  const ally = new Runner(1, 1, 1, false, "ally_test", false);
  assert.equal(ally.getDisplayEmoji(), USE_DIRECTIONAL_RUNNER_GLYPHS ? "🏃🏿‍♂️‍➡️" : "🏃🏿‍♂️");
  assert.equal(ally.shouldMirrorEmojiDisplay(), MIRROR_RUNNER_EMOJI_WITH_TRANSFORM);
  ally.playDirection = -1;
  assert.equal(ally.getDisplayEmoji(), "🏃🏿‍♂️");
  assert.equal(ally.shouldMirrorEmojiDisplay(), false);
  ally.setFrozen(2);
  assert.equal(ally.getDisplayEmoji(), "🧎🏾‍♂️");

  const human = new Runner(1, 1, 1, true, "human_test", false);
  assert.equal(human.shouldMirrorEmojiDisplay(), MIRROR_RUNNER_EMOJI_WITH_TRANSFORM);
  human.playDirection = -1;
  assert.equal(human.getDisplayEmoji(), "🏃🏾‍♀️");
  assert.equal(human.shouldMirrorEmojiDisplay(), false);
});

test("generic sensing levels unlock sequentially through the first sensing track", () => {
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
});

test("find-the-human uses an open support target beside the human", () => {
  const level = getLevelDefinitions().find((entry) => entry.id === "find-the-human");
  assert.deepEqual(level.winCondition.targetCell, { x: 5, y: 2 });
  const humanSetup = level.setup.teams.player.runners.find((runner) => runner.slot === "human");
  assert.equal(humanSetup.gridX, 6);
  assert.equal(humanSetup.gridY, 2);
  assert.ok(level.setup.barriers.some((barrier) => barrier.gridX === 7 && barrier.gridY === 2));
  assert.ok(level.tutorialSteps.some((step) => step.demoBlocklyXml?.includes("ANYWHERE_FORWARD")));

  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["move-to-target"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["reach-enemy-flag"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["score-a-point"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["barrier-detour"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["mirror-forward"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["sensor-barrier-branch"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["watch-the-wall"] = LEVEL_STATUS.PASSED;
  app.state.levelProgress["find-the-human"] = LEVEL_STATUS.AVAILABLE;
  startLevel(app, "find-the-human");

  const occupiedRunner = app.state.allRunners.find((runner) => runner.gridX === 5 && runner.gridY === 2);
  assert.equal(occupiedRunner, undefined);
});

test("relay-race uses an open support target beside the human flag carrier", () => {
  const level = getLevelDefinitions().find((entry) => entry.id === "relay-race");
  assert.deepEqual(level.winCondition.targetCell, { x: 6, y: 3 });
  const humanSetup = level.setup.teams.player.runners.find((runner) => runner.slot === "human");
  assert.equal(humanSetup.gridX, 6);
  assert.equal(humanSetup.gridY, 2);

  const app = createApp();
  initializeLevelState(app);
  startLevel(app, "relay-race");

  const occupiedRunner = app.state.allRunners.find((runner) => runner.gridX === 6 && runner.gridY === 3);
  assert.equal(occupiedRunner, undefined);
});

test("every non-human guided level has a reference Blockly solvability solution", () => {
  const nonHumanLevels = getLevelDefinitions().filter((level) => level.humanTurnBehavior !== HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT);
  const missing = nonHumanLevels
    .map((level) => level.id)
    .filter((levelId) => !GUIDED_LEVEL_REFERENCE_SOLUTIONS[levelId]);

  assert.deepEqual(missing, []);
});

test("reference Blockly programs solve every non-human guided level", () => {
  const nonHumanLevels = getLevelDefinitions().filter((level) => level.humanTurnBehavior !== HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT);

  for (const level of nonHumanLevels) {
    const xmlText = GUIDED_LEVEL_REFERENCE_SOLUTIONS[level.id];
    const { app, trace } = runGuidedLevelWithSolution(level.id, xmlText);
    assert.equal(
      app.state.activeLevelResult,
      LEVEL_RESULT.PASSED,
      `Level ${level.id} did not pass. Final turn=${app.state.currentTurnNumber}, state=${app.state.currentTurnState}, lastReason=${app.state.lastLevelResultReason}, traceTail=${JSON.stringify(trace.slice(-8))}`
    );
  }
});

test("guided levels fail when the turn limit is exceeded", () => {
  const app = createApp();
  initializeLevelState(app);
  startLevel(app, "move-to-target");
  app.state.currentTurnNumber = 9;

  const result = evaluateLevelProgress(app);
  assert.deepEqual(result, { result: LEVEL_RESULT.FAILED, reason: "turn_limit_exceeded" });
  assert.equal(app.state.activeLevelResult, LEVEL_RESULT.FAILED);
});

test("free play keeps full toolbox access and leaves level progress intact", () => {
  const app = createApp();
  initializeLevelState(app);
  app.state.levelProgress["move-to-target"] = LEVEL_STATUS.PASSED;
  app.state.randomFn = () => 0.75;
  enterFreePlay(app);

  const toolbox = getToolboxBlockTypesForMode(app, null);
  assert.equal(app.state.currentModeView, GAME_VIEW_MODES.FREE_PLAY);
  assert.ok(toolbox.includes(BLOCK_TYPES.JUMP_FORWARD));
  assert.ok(toolbox.includes(BLOCK_TYPES.MOVE_TOWARD));
  assert.ok(toolbox.includes(BLOCK_TYPES.MOVE_RANDOMLY));
  assert.ok(toolbox.includes(BLOCK_TYPES.FREEZE_OPPONENTS));
  assert.ok(toolbox.includes(BLOCK_TYPES.IF_CAN_JUMP_ELSE));
  assert.ok(toolbox.includes(BLOCK_TYPES.IF_AREA_FREEZE_READY_ELSE));
  assert.equal(app.state.levelProgress["move-to-target"], LEVEL_STATUS.PASSED);
  assert.equal(app.state.teams[1].playDirection, -1);
  assert.equal(app.state.teams[2].playDirection, 1);
});

test("Move Toward enemy flag chooses a forward step in the open lane", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  const decision = translateMoveTowardDecision(app.state, actor, MOVE_TOWARD_TARGETS.ENEMY_FLAG);
  assert.equal(decision.type, AI_ACTION_TYPES.MOVE_FORWARD);
});

test("Move Toward my base chooses a backward step when carrying the flag home", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 8;
  actor.gridY = 4;
  const decision = translateMoveTowardDecision(app.state, actor, MOVE_TOWARD_TARGETS.MY_BASE);
  assert.equal(decision.type, AI_ACTION_TYPES.MOVE_BACKWARD);
});

test("Move Toward human runner targets the allied human", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 5;
  actor.gridY = 4;
  const human = app.state.allRunners.find((runner) => runner.team === 1 && runner.isHumanControlled);
  human.gridX = 5;
  human.gridY = 2;
  const decision = translateMoveTowardDecision(app.state, actor, MOVE_TOWARD_TARGETS.HUMAN_RUNNER);
  assert.equal(decision.type, AI_ACTION_TYPES.MOVE_UP_SCREEN);
});

test("Move Toward closest enemy selects the nearest active enemy deterministically", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 5;
  actor.gridY = 4;
  const enemies = app.state.allRunners.filter((runner) => runner.team === 2);
  enemies[0].gridX = 7;
  enemies[0].gridY = 4;
  enemies[1].gridX = 5;
  enemies[1].gridY = 1;
  const decision = translateMoveTowardDecision(app.state, actor, MOVE_TOWARD_TARGETS.CLOSEST_ENEMY);
  assert.equal(decision.type, AI_ACTION_TYPES.MOVE_FORWARD);
});

test("Move Toward breaks equal-axis ties by preferring forward or behind before vertical movement", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 4;
  actor.gridY = 4;
  const human = app.state.allRunners.find((runner) => runner.team === 1 && runner.isHumanControlled);
  human.gridX = 6;
  human.gridY = 2;
  const decision = translateMoveTowardDecision(app.state, actor, MOVE_TOWARD_TARGETS.HUMAN_RUNNER);
  assert.equal(decision.type, AI_ACTION_TYPES.MOVE_FORWARD);
});

test("Move Randomly returns a deterministic legal action when randomFn is stubbed", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  app.state.randomFn = () => 0.74;
  const queued = translateActionDecision(actor, { type: AI_ACTION_TYPES.MOVE_RANDOMLY }, app.state);
  assert.equal(queued.actionType, AI_ACTION_TYPES.MOVE_UP_SCREEN);
});

test("condition helpers detect barrier, enemy, and carried-flag state", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 1;
  actor.gridY = 3;

  app.state.barriers.push({ id: "barrier_test", gridX: 2, gridY: 3, ownerRunnerId: "test" });
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_BARRIER_IN_FRONT), true);

  app.state.barriers = [];
  const enemy = app.state.allRunners.find((runner) => runner.team === 2);
  enemy.gridX = 2;
  enemy.gridY = 3;
  enemy.isFrozen = false;
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_ENEMY_IN_FRONT), true);

  actor.hasEnemyFlag = true;
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_HAVE_ENEMY_FLAG), true);
});

test("resource, team, and territory conditions evaluate correctly", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  const human = app.state.allRunners.find((runner) => runner.team === 1 && runner.isHumanControlled);

  actor.canJump = true;
  actor.canPlaceBarrier = true;
  actor.activeBarrierId = null;
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_CAN_JUMP), true);
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_CAN_PLACE_BARRIER), true);
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_AREA_FREEZE_READY), true);

  human.hasEnemyFlag = true;
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_TEAMMATE_HAS_FLAG), true);

  actor.gridX = 1;
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_ON_MY_SIDE), true);
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_ON_ENEMY_SIDE), false);
  actor.gridX = 8;
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_ON_MY_SIDE), false);
  assert.equal(evaluateCondition(app.state, actor, BLOCK_TYPES.IF_ON_ENEMY_SIDE), true);
});

test("generic sensor evaluation supports barrier, edge or wall, enemy flag, and human runner relations", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 1;
  actor.gridY = 3;

  app.state.barriers.push({ id: "barrier_test", gridX: 2, gridY: 3, ownerRunnerId: "test" });
  assert.equal(
    evaluateSensorCondition(app.state, actor, SENSOR_OBJECT_TYPES.BARRIER, SENSOR_RELATION_TYPES.DIRECTLY_IN_FRONT),
    true
  );

  actor.gridX = 11;
  actor.gridY = 3;
  assert.equal(
    evaluateSensorCondition(app.state, actor, SENSOR_OBJECT_TYPES.EDGE_OR_WALL, SENSOR_RELATION_TYPES.DIRECTLY_IN_FRONT),
    true
  );

  actor.gridX = 1;
  actor.gridY = 5;
  const human = app.state.allRunners.find((runner) => runner.team === 1 && runner.isHumanControlled);
  human.gridX = 6;
  human.gridY = 2;
  assert.equal(
    evaluateSensorCondition(app.state, actor, SENSOR_OBJECT_TYPES.HUMAN_RUNNER, SENSOR_RELATION_TYPES.ANYWHERE_FORWARD),
    true
  );
  assert.equal(
    evaluateSensorCondition(app.state, actor, SENSOR_OBJECT_TYPES.HUMAN_RUNNER, SENSOR_RELATION_TYPES.ANYWHERE_ABOVE),
    true
  );

  app.state.gameFlags[2].gridX = 6;
  app.state.gameFlags[2].gridY = 4;
  assert.equal(
    evaluateSensorCondition(app.state, actor, SENSOR_OBJECT_TYPES.ENEMY_FLAG, SENSOR_RELATION_TYPES.WITHIN_6),
    true
  );
});

test("Blockly conditionals select the first matching action and fall through when false", () => {
  const app = buildBlocklyAppWithXml(`
    <xml xmlns="https://developers.google.com/blockly/xml">
      <block type="battlegorithms_on_each_turn" x="24" y="24">
        <next>
          <block type="battlegorithms_if_have_enemy_flag">
            <statement name="DO">
              <block type="battlegorithms_move_backward"></block>
            </statement>
            <next>
              <block type="battlegorithms_move_forward"></block>
            </next>
          </block>
        </next>
      </block>
    </xml>
  `);
  const match = buildMatch();
  app.state = match.state;
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");

  let action = getFirstRunnableAction(app, actor);
  assert.equal(action.type, "MOVE_FORWARD");

  actor.hasEnemyFlag = true;
  action = getFirstRunnableAction(app, actor);
  assert.equal(action.type, "MOVE_BACKWARD");
});

test("Blockly if/else block selects the else branch when the flag is not carried", () => {
  const app = buildBlocklyAppWithXml(`
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
  `);
  const match = buildMatch();
  app.state = match.state;
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");

  let action = getFirstRunnableAction(app, actor);
  assert.equal(action.type, "MOVE_FORWARD");

  actor.hasEnemyFlag = true;
  action = getFirstRunnableAction(app, actor);
  assert.equal(action.type, "MOVE_BACKWARD");
});

test("Blockly barrier if/else block selects detour vs forward movement correctly", () => {
  const app = buildBlocklyAppWithXml(`
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
  `);
  const match = buildMatch();
  app.state = match.state;
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 1;
  actor.gridY = 3;

  let action = getFirstRunnableAction(app, actor);
  assert.equal(action.type, "MOVE_FORWARD");

  app.state.barriers.push({ id: "barrier_test", gridX: 2, gridY: 3, ownerRunnerId: "test" });
  action = getFirstRunnableAction(app, actor);
  assert.equal(action.type, "MOVE_DOWN_SCREEN");
});

test("generic sensor if/else block chooses branches from object and relation dropdowns", () => {
  const app = buildBlocklyAppWithXml(`
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
  `);
  const match = buildMatch();
  app.state = match.state;
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 1;
  actor.gridY = 3;

  let action = getFirstRunnableAction(app, actor);
  assert.equal(action.type, "MOVE_FORWARD");

  app.state.barriers.push({ id: "barrier_test", gridX: 2, gridY: 3, ownerRunnerId: "test" });
  action = getFirstRunnableAction(app, actor);
  assert.equal(action.type, "MOVE_DOWN_SCREEN");
});

test("generic sensor if block can use distance relations", () => {
  const app = buildBlocklyAppWithXml(`
    <xml xmlns="https://developers.google.com/blockly/xml">
      <block type="battlegorithms_on_each_turn" x="24" y="24">
        <next>
          <block type="battlegorithms_if_sensor_matches">
            <field name="OBJECT">HUMAN_RUNNER</field>
            <field name="RELATION">WITHIN_4</field>
            <statement name="DO">
              <block type="battlegorithms_move_up_screen"></block>
            </statement>
            <next>
              <block type="battlegorithms_move_forward"></block>
            </next>
          </block>
        </next>
      </block>
    </xml>
  `);
  const match = buildMatch();
  app.state = match.state;
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  const human = app.state.allRunners.find((runner) => runner.team === 1 && runner.isHumanControlled);
  actor.gridX = 3;
  actor.gridY = 4;
  human.gridX = 5;
  human.gridY = 3;

  const action = getFirstRunnableAction(app, actor);
  assert.equal(action.type, "MOVE_UP_SCREEN");
});

test("new free-play if/else blocks choose readiness and teammate branches correctly", () => {
  const app = buildBlocklyAppWithXml(`
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
            <next>
              <block type="battlegorithms_if_teammate_has_flag_else">
                <statement name="DO">
                  <block type="battlegorithms_move_backward"></block>
                </statement>
                <statement name="ELSE">
                  <block type="battlegorithms_move_down_screen"></block>
                </statement>
              </block>
            </next>
          </block>
        </next>
      </block>
    </xml>
  `);
  const match = buildMatch();
  app.state = match.state;
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  const human = app.state.allRunners.find((runner) => runner.team === 1 && runner.isHumanControlled);

  let action = getFirstRunnableAction(app, actor);
  assert.equal(action.type, "JUMP_FORWARD");

  actor.canJump = false;
  action = getFirstRunnableAction(app, actor);
  assert.equal(action.type, "MOVE_FORWARD");

  const teammateApp = buildBlocklyAppWithXml(`
    <xml xmlns="https://developers.google.com/blockly/xml">
      <block type="battlegorithms_on_each_turn" x="24" y="24">
        <next>
          <block type="battlegorithms_if_teammate_has_flag_else">
            <statement name="DO">
              <block type="battlegorithms_move_backward"></block>
            </statement>
            <statement name="ELSE">
              <block type="battlegorithms_move_down_screen"></block>
            </statement>
          </block>
        </next>
      </block>
    </xml>
  `);
  teammateApp.state = match.state;
  action = getFirstRunnableAction(teammateApp, actor);
  assert.equal(action.type, "MOVE_DOWN_SCREEN");
  human.hasEnemyFlag = true;
  action = getFirstRunnableAction(teammateApp, actor);
  assert.equal(action.type, "MOVE_BACKWARD");
});

test("area freeze freezes nearby enemies once per round and resets on round reset", () => {
  const app = buildMatch();
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  const enemies = app.state.allRunners.filter((runner) => runner.team === 2);
  actor.gridX = 5;
  actor.gridY = 4;
  enemies[0].gridX = 6;
  enemies[0].gridY = 4;
  enemies[1].gridX = 10;
  enemies[1].gridY = 6;

  app.state.mainGameState = "RUNNING";
  app.state.currentTurnState = "PROCESSING_ACTION";
  app.state.activeRunnerIndex = app.state.allRunners.indexOf(actor);
  app.state.queuedActionForCurrentRunner = {
    runner: actor,
    actionType: AI_ACTION_TYPES.FREEZE_OPPONENTS,
    targetGridX: actor.gridX,
    targetGridY: actor.gridY
  };
  processTurnActions(app);

  assert.equal(app.state.teamAreaFreezeUsed[1], true);
  assert.equal(enemies[0].isFrozen, true);
  assert.equal(enemies[0].frozenTurnsRemaining, AREA_FREEZE_DURATION_TURNS);
  assert.equal(enemies[1].isFrozen, false);

  resetRound(app.state);
  assert.equal(app.state.teamAreaFreezeUsed[1], false);
});

test("condition blocks without an action body fall through safely", () => {
  const app = buildBlocklyAppWithXml(`
    <xml xmlns="https://developers.google.com/blockly/xml">
      <block type="battlegorithms_on_each_turn" x="24" y="24">
        <next>
          <block type="battlegorithms_if_barrier_in_front">
            <next>
              <block type="battlegorithms_move_down_screen"></block>
            </next>
          </block>
        </next>
      </block>
    </xml>
  `);
  const match = buildMatch();
  app.state = match.state;
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  app.state.barriers.push({ id: "barrier_test", gridX: actor.gridX + 1, gridY: actor.gridY, ownerRunnerId: "test" });

  const action = getFirstRunnableAction(app, actor);
  assert.equal(action.type, "MOVE_DOWN_SCREEN");
});

test("ignored unattached Blockly blocks are disabled with a warning", () => {
  const app = buildBlocklyAppWithXml(`
    <xml xmlns="https://developers.google.com/blockly/xml">
      <block type="battlegorithms_on_each_turn" x="24" y="24">
        <next>
          <block type="battlegorithms_move_forward"></block>
        </next>
      </block>
      <block type="battlegorithms_move_backward" x="220" y="24"></block>
    </xml>
  `);

  updateBlocklyExecutionHints(app);
  const unattached = app.blocklyWorkspace.getBlocksByType(BLOCK_TYPES.MOVE_BACKWARD, false)[0];
  assert.equal(unattached.isEnabled(), false);
});

test("Blockly Move Toward block returns an action with the selected target", () => {
  const app = buildBlocklyAppWithXml(`
    <xml xmlns="https://developers.google.com/blockly/xml">
      <block type="battlegorithms_on_each_turn" x="24" y="24">
        <next>
          <block type="battlegorithms_move_toward">
            <field name="TARGET">MY_BASE</field>
          </block>
        </next>
      </block>
    </xml>
  `);
  const match = buildMatch();
  app.state = match.state;
  const actor = app.state.allRunners.find((runner) => runner.id === "runner_1_AI_AllyP1");
  actor.gridX = 8;
  actor.gridY = 4;

  const action = getFirstRunnableAction(app, actor);
  assert.equal(action.type, AI_ACTION_TYPES.MOVE_TOWARD);
  assert.equal(action.targetType, MOVE_TOWARD_TARGETS.MY_BASE);

  const queued = translateActionDecision(actor, action, app.state);
  assert.equal(queued.actionType, AI_ACTION_TYPES.MOVE_BACKWARD);
});
