import test from "node:test";
import assert from "node:assert/strict";
import { FREE_PLAY_MODES, GAME_MODES } from "../../src/config/constants.js";
import { buildMatch } from "../../src/testSupport/builders.js";
import { resetRound } from "../../src/core/setup.js";
import { checkInvariants } from "../../src/core/invariants.js";
import { calculateNpcType1Action } from "../../src/ai/npc/npcType1.js";
import { calculateNpcType2Action } from "../../src/ai/npc/npcType2.js";
import { buildRuntimeTeams, createRandomizedFreePlayTeamSetup } from "../../src/core/teams.js";

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
