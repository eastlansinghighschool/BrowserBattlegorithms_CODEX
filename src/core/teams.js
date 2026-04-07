import {
  CELL_TYPE,
  COLS,
  FLAG1_EMOJI,
  FLAG2_EMOJI,
  FREE_PLAY_MODES,
  GAME_MODES,
  NPC_BEHAVIORS,
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

const INNER_BASE_COLUMN_BY_SIDE = {
  left: 1,
  right: COLS - 2
};

const OUTER_BASE_COLUMN_BY_SIDE = {
  left: 0,
  right: COLS - 1
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

function createNamedRunnerSpec({
  slot,
  idSuffix,
  gridX,
  gridY,
  isHumanControlled,
  isNPC,
  cpuBehavior = null,
  cpuRole = null
}) {
  return {
    slot,
    idSuffix,
    gridX,
    gridY,
    isHumanControlled,
    isNPC,
    cpuBehavior,
    cpuRole
  };
}

function getPreferredFreePlaySpawnCells(homeSide) {
  const innerX = INNER_BASE_COLUMN_BY_SIDE[homeSide];
  const outerX = OUTER_BASE_COLUMN_BY_SIDE[homeSide];
  const rowPreference = [3, 4, 2, 5, 1, 6, 0, 7];
  const cells = [];

  for (const x of [innerX, outerX]) {
    for (const y of rowPreference) {
      if (x === outerX && y === DEFAULT_FLAG_ROW) {
        continue;
      }
      cells.push({ gridX: x, gridY: y });
    }
  }

  return cells;
}

function buildFreePlayRunnerPositions(homeSide, totalRunnerCount) {
  const preferredCells = getPreferredFreePlaySpawnCells(homeSide);
  return preferredCells.slice(0, totalRunnerCount).map((cell) => ({ ...cell }));
}

function buildFreePlayPlayerRunners(teamId, homeSide, totalRunnerCount) {
  const positions = buildFreePlayRunnerPositions(homeSide, totalRunnerCount);
  const playerSuffix = teamId === 1 ? "P1" : "P2";
  const runners = [
    createNamedRunnerSpec({
      slot: "human",
      idSuffix: `Human${playerSuffix}`,
      gridX: positions[0].gridX,
      gridY: positions[0].gridY,
      isHumanControlled: true,
      isNPC: false
    })
  ];

  for (let index = 1; index < totalRunnerCount; index += 1) {
    runners.push(
      createNamedRunnerSpec({
        slot: index === 1 ? "ally" : `ally${index}`,
        idSuffix: index === 1 ? `AI_Ally${playerSuffix}` : `AI_Ally${playerSuffix}_${index}`,
        gridX: positions[index].gridX,
        gridY: positions[index].gridY,
        isHumanControlled: false,
        isNPC: false
      })
    );
  }

  return runners;
}

function buildFreePlayCpuRunners(homeSide, totalRunnerCount, freePlayMode) {
  const positions = buildFreePlayRunnerPositions(homeSide, totalRunnerCount);
  const cpuRunners = [];
  const attackerCount = freePlayMode === FREE_PLAY_MODES.PLAYER_VS_CPU_TACTICAL
    ? Math.floor(totalRunnerCount / 2)
    : 0;

  for (let index = 0; index < totalRunnerCount; index += 1) {
    let cpuBehavior = NPC_BEHAVIORS.FREE_PLAY_EASY;
    let cpuRole = "easy";
    if (freePlayMode === FREE_PLAY_MODES.PLAYER_VS_CPU_TACTICAL) {
      const isAttacker = index < attackerCount;
      cpuBehavior = isAttacker ? NPC_BEHAVIORS.FREE_PLAY_TACTICAL_ATTACKER : NPC_BEHAVIORS.FREE_PLAY_TACTICAL_DEFENDER;
      cpuRole = isAttacker ? "attacker" : "defender";
    }

    cpuRunners.push(
      createNamedRunnerSpec({
        slot: index === 0 ? "npc1" : `npc${index + 1}`,
        idSuffix: `Npc${index + 1}`,
        gridX: positions[index].gridX,
        gridY: positions[index].gridY,
        isHumanControlled: false,
        isNPC: true,
        cpuBehavior,
        cpuRole
      })
    );
  }

  return cpuRunners;
}

export function getGameModeForFreePlayMode(freePlayMode) {
  return normalizeFreePlayMode(freePlayMode) === FREE_PLAY_MODES.PLAYER_VS_PLAYER
    ? GAME_MODES.PLAYER_VS_PLAYER
    : GAME_MODES.PLAYER_VS_NPC;
}
function normalizeFreePlayMode(mode) {
  if (mode === GAME_MODES.PLAYER_VS_PLAYER) {
    return FREE_PLAY_MODES.PLAYER_VS_PLAYER;
  }
  if (mode === GAME_MODES.PLAYER_VS_NPC) {
    return FREE_PLAY_MODES.PLAYER_VS_CPU_EASY;
  }
  return mode;
}

export function createRandomizedFreePlayTeamSetup(freePlayMode, teamSizeOrRandomFn = 2, randomFn = Math.random) {
  const normalizedMode = normalizeFreePlayMode(freePlayMode);
  const resolvedRandomFn = typeof teamSizeOrRandomFn === "function" ? teamSizeOrRandomFn : randomFn;
  const requestedTeamSize = typeof teamSizeOrRandomFn === "function" ? 2 : teamSizeOrRandomFn;
  const playerDirection = resolvedRandomFn() < 0.5 ? 1 : -1;
  const opponentDirection = -playerDirection;
  const playerHomeSide = deriveHomeSideFromPlayDirection(playerDirection);
  const opponentHomeSide = deriveHomeSideFromPlayDirection(opponentDirection);
  const normalizedTeamSize = Math.max(2, Math.min(6, Number(requestedTeamSize) || 2));

  return createPlayerOpponentTeamSetup({
    player: {
      playDirection: playerDirection,
      runners: buildFreePlayPlayerRunners(1, playerHomeSide, normalizedTeamSize)
    },
    opponent: {
      playDirection: opponentDirection,
      runners: normalizedMode === FREE_PLAY_MODES.PLAYER_VS_PLAYER
        ? buildFreePlayPlayerRunners(2, opponentHomeSide, normalizedTeamSize)
        : buildFreePlayCpuRunners(opponentHomeSide, normalizedTeamSize, normalizedMode)
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
