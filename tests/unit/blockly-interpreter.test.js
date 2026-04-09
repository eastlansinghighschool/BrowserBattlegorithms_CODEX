import test from "node:test";
import assert from "node:assert/strict";
import { AI_ACTION_TYPES, BLOCK_TYPES, MOVE_TOWARD_TARGETS } from "../../src/config/constants.js";
import { buildMatch } from "../../src/testSupport/builders.js";
import { getFirstRunnableAction, updateBlocklyExecutionHints } from "../../src/ai/blockly/workspace.js";
import { translateActionDecision } from "../../src/core/movement.js";
import { buildBlocklyAppWithXml } from "./helpers/testHarness.js";
import { buildSolutionXml } from "./fixtures/guidedReferenceSolutions.js";

test("advanced boolean and number inputs stay enabled when attached under If [boolean]", () => {
  const app = buildBlocklyAppWithXml(buildSolutionXml(`
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
