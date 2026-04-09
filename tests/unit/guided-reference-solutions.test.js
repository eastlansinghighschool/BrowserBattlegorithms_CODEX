import test from "node:test";
import assert from "node:assert/strict";
import { AI_ACTION_TYPES, HUMAN_TURN_BEHAVIORS, LEVEL_RESULT } from "../../src/config/constants.js";
import { getLevelDefinitions } from "../../src/config/levels.js";
import { checkInvariants } from "../../src/core/invariants.js";
import { GUIDED_LEVEL_REFERENCE_SOLUTIONS } from "./fixtures/guidedReferenceSolutions.js";
import { runGuidedLevelWithSolution } from "./helpers/testHarness.js";

test("every non-human guided level has a reference code-block solution", () => {
  const nonHumanLevels = getLevelDefinitions().filter((level) => level.humanTurnBehavior !== HUMAN_TURN_BEHAVIORS.WAIT_FOR_INPUT);
  const missing = nonHumanLevels
    .map((level) => level.id)
    .filter((levelId) => !GUIDED_LEVEL_REFERENCE_SOLUTIONS[levelId]);

  assert.deepEqual(missing, []);
});

test("reference code-block programs solve every non-human guided level", () => {
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

test("level 20 reference solution uses freeze, passes, and never overlaps runners", () => {
  const { app } = runGuidedLevelWithSolution(
    "freeze-the-lane",
    GUIDED_LEVEL_REFERENCE_SOLUTIONS["freeze-the-lane"]
  );

  assert.equal(app.state.activeLevelResult, LEVEL_RESULT.PASSED);
  assert.ok(app.state.runnerActionHistory.runner_1_AI_AllyP1.includes(AI_ACTION_TYPES.FREEZE_OPPONENTS));
  assert.equal(checkInvariants(app.state), true);
});
