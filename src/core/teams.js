import {
  CELL_TYPE,
  COLS,
  FLAG1_EMOJI,
  FLAG2_EMOJI,
  GAME_MODES,
  ROWS,
  TEAM_GLOW_COLORS
} from "../config/constants.js";

const DEFAULT_FLAG_ROW = Math.floor(ROWS / 2);
const DEFAULT_HUMAN_ROW = Math.floor(ROWS / 2) - 2;
const DEFAULT_ALLY_ROW = Math.floor(ROWS / 2);
const DEFAULT_ALLY2_ROW = Math.floor(ROWS / 2) - 1;
const DEFAULT_ALLY3_ROW = Math.floor(ROWS / 2) + 1;
const DEFAULT_NPC1_ROW = Math.floor(ROWS / 2) - 1;
const DEFAULT_NPC2_ROW = Math.floor(ROWS / 2) + 1;
const DEFAULT_NPC3_ROW = Math.floor(ROWS / 2);

const TEAM_ID_BY_ROLE = {
  player: 1,
  opponent: 2
};

const TEAM_IDENTITY_DEFAULTS = {
  1: {
    teamId: 1,
    role: "player",
    defaultPlayDirection: 1,
    flagEmoji: FLAG1_EMOJI,
    glowColorFill: TEAM_GLOW_COLORS[1].fill,
    glowColorStroke: TEAM_GLOW_COLORS[1].stroke
  },
  2: {
    teamId: 2,
    role: "opponent",
    defaultPlayDirection: -1,
    flagEmoji: FLAG2_EMOJI,
    glowColorFill: TEAM_GLOW_COLORS[2].fill,
    glowColorStroke: TEAM_GLOW_COLORS[2].stroke
  }
};

const SIDE_DEFAULTS = {
  left: {
    baseCellType: CELL_TYPE.TEAM1_BASE,
    flagHome: { x: 0, y: DEFAULT_FLAG_ROW },
    slots: {
      human: { gridX: 1, gridY: DEFAULT_HUMAN_ROW },
      ally: { gridX: 1, gridY: DEFAULT_ALLY_ROW },
      ally2: { gridX: 1, gridY: DEFAULT_ALLY2_ROW },
      ally3: { gridX: 1, gridY: DEFAULT_ALLY3_ROW },
      npc1: { gridX: 1, gridY: DEFAULT_NPC1_ROW },
      npc2: { gridX: 1, gridY: DEFAULT_NPC2_ROW },
      npc3: { gridX: 1, gridY: DEFAULT_NPC3_ROW }
    }
  },
  right: {
    baseCellType: CELL_TYPE.TEAM2_BASE,
    flagHome: { x: COLS - 1, y: DEFAULT_FLAG_ROW },
    slots: {
      human: { gridX: COLS - 2, gridY: DEFAULT_HUMAN_ROW },
      ally: { gridX: COLS - 2, gridY: DEFAULT_ALLY_ROW },
      ally2: { gridX: COLS - 2, gridY: DEFAULT_ALLY2_ROW },
      ally3: { gridX: COLS - 2, gridY: DEFAULT_ALLY3_ROW },
      npc1: { gridX: COLS - 2, gridY: DEFAULT_NPC1_ROW },
      npc2: { gridX: COLS - 2, gridY: DEFAULT_NPC2_ROW },
      npc3: { gridX: COLS - 2, gridY: DEFAULT_NPC3_ROW }
    }
  }
};

const RUNNER_SLOT_METADATA_BY_TEAM = {
  1: {
    human: { idSuffix: "HumanP1", isHumanControlled: true, isNPC: false },
    ally: { idSuffix: "AI_AllyP1", isHumanControlled: false, isNPC: false },
    ally2: { idSuffix: "AI_AllyP1_2", isHumanControlled: false, isNPC: false },
    ally3: { idSuffix: "AI_AllyP1_3", isHumanControlled: false, isNPC: false },
    npc1: { idSuffix: "Npc1", isHumanControlled: false, isNPC: true },
    npc2: { idSuffix: "Npc2", isHumanControlled: false, isNPC: true },
    npc3: { idSuffix: "Npc3", isHumanControlled: false, isNPC: true }
  },
  2: {
    human: { idSuffix: "HumanP2", isHumanControlled: true, isNPC: false },
    ally: { idSuffix: "AI_AllyP2", isHumanControlled: false, isNPC: false },
    ally2: { idSuffix: "AI_AllyP2_2", isHumanControlled: false, isNPC: false },
    ally3: { idSuffix: "AI_AllyP2_3", isHumanControlled: false, isNPC: false },
    npc1: { idSuffix: "Npc1", isHumanControlled: false, isNPC: true },
    npc2: { idSuffix: "Npc2", isHumanControlled: false, isNPC: true },
    npc3: { idSuffix: "Npc3", isHumanControlled: false, isNPC: true }
  }
};

function clonePosition(position) {
  return { x: position.x, y: position.y };
}

export function getEnemyTeamId(teamId) {
  return Number(teamId) === 1 ? 2 : 1;
}

export function deriveHomeSideFromPlayDirection(playDirection) {
  return playDirection === -1 ? "right" : "left";
}

export function createRunnerSpec(slot, overrides = {}) {
  return { slot, ...overrides };
}

export function createTeamSetup({ playDirection, runners = [], ...rest } = {}) {
  return {
    playDirection,
    runners: runners.map((runner) => ({ ...runner })),
    ...rest
  };
}

export function createPlayerOpponentTeamSetup({ player, opponent }) {
  return {
    player: createTeamSetup(player),
    opponent: createTeamSetup(opponent)
  };
}

export function createRandomizedFreePlayTeamSetup(gameMode, randomFn = Math.random) {
  const playerDirection = randomFn() < 0.5 ? 1 : -1;
  const opponentDirection = -playerDirection;

  return createPlayerOpponentTeamSetup({
    player: {
      playDirection: playerDirection,
      runners: [
        createRunnerSpec("human"),
        createRunnerSpec("ally")
      ]
    },
    opponent: {
      playDirection: opponentDirection,
      runners: gameMode === GAME_MODES.PLAYER_VS_PLAYER
        ? [
            createRunnerSpec("human"),
            createRunnerSpec("ally")
          ]
        : [
            createRunnerSpec("npc1"),
            createRunnerSpec("npc2")
          ]
    }
  });
}

export function validateOpposingTeamDirections(teamEntries) {
  const directions = Object.values(teamEntries || {}).map((team) => team?.playDirection);
  if (directions.length !== 2 || directions.some((direction) => direction !== 1 && direction !== -1)) {
    throw new Error("Matches must define exactly two teams with playDirection values of 1 and -1.");
  }
  if (directions[0] === directions[1]) {
    throw new Error("Opposing teams must have different playDirection values.");
  }
}

function createRuntimeTeam(teamId, role, setup = {}) {
  const identityDefaults = TEAM_IDENTITY_DEFAULTS[teamId];
  const playDirection = setup.playDirection ?? identityDefaults.defaultPlayDirection;
  const homeSide = setup.homeSide ?? deriveHomeSideFromPlayDirection(playDirection);
  const expectedSide = deriveHomeSideFromPlayDirection(playDirection);

  if (homeSide !== expectedSide) {
    throw new Error(`Team ${teamId} uses home side ${homeSide} but playDirection ${playDirection} expects ${expectedSide}.`);
  }

  const sideDefaults = SIDE_DEFAULTS[homeSide];
  return {
    teamId,
    role,
    playDirection,
    homeSide,
    baseCellType: setup.baseCellType ?? sideDefaults.baseCellType,
    flagHome: clonePosition(setup.flagHome ?? sideDefaults.flagHome),
    flagEmoji: setup.flagEmoji ?? identityDefaults.flagEmoji,
    glowColorFill: [...(setup.glowColorFill ?? identityDefaults.glowColorFill)],
    glowColorStroke: [...(setup.glowColorStroke ?? identityDefaults.glowColorStroke)],
    runners: (setup.runners || []).map((runner) => ({ ...runner }))
  };
}

export function buildRuntimeTeams(teamSetupByRole = {}) {
  const teams = {
    1: createRuntimeTeam(TEAM_ID_BY_ROLE.player, "player", teamSetupByRole.player),
    2: createRuntimeTeam(TEAM_ID_BY_ROLE.opponent, "opponent", teamSetupByRole.opponent)
  };

  validateOpposingTeamDirections(teams);
  return teams;
}

export function getTeamConfig(state, teamId) {
  return state.teams?.[teamId] || null;
}

export function getTeamFlagHome(state, teamId) {
  return getTeamConfig(state, teamId)?.flagHome || null;
}

export function getTeamBaseCellType(state, teamId) {
  return getTeamConfig(state, teamId)?.baseCellType || null;
}

export function getTeamGlowColors(state, teamId) {
  const team = getTeamConfig(state, teamId);
  if (!team) {
    return null;
  }

  return {
    fill: [...team.glowColorFill],
    stroke: [...team.glowColorStroke]
  };
}

export function getFlagEmojiForTeam(state, teamId) {
  return getTeamConfig(state, teamId)?.flagEmoji || null;
}

export function isOnHomeSide(state, runner) {
  const team = getTeamConfig(state, runner.team);
  if (!team) {
    return false;
  }

  return team.homeSide === "left" ? runner.gridX < COLS / 2 : runner.gridX >= COLS / 2;
}

export function getDefaultSlotPosition(homeSide, slot) {
  return SIDE_DEFAULTS[homeSide]?.slots?.[slot]
    ? { ...SIDE_DEFAULTS[homeSide].slots[slot] }
    : { gridX: 0, gridY: 0 };
}

export function getRunnerSlotMetadata(teamId, slot) {
  return RUNNER_SLOT_METADATA_BY_TEAM[teamId]?.[slot] || {
    idSuffix: `${slot}_${teamId}`,
    isHumanControlled: false,
    isNPC: false
  };
}
