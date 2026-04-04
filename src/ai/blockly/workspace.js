import * as Blockly from "blockly";
import {
  ADVANCED_COMPARE_OPERATORS,
  BLOCK_TYPES,
  GAME_VIEW_MODES,
  MOVE_TOWARD_TARGETS
} from "../../config/constants.js";
import { getCurrentLevel } from "../../core/levels.js";
import { evaluateCondition } from "../../core/conditions.js";
import { getEnemyTeamId, getTeamFlagHome } from "../../core/teams.js";
import {
  getActionTypeForBlockType,
  getBlockDisplayLabel,
  getBlockLibrary,
  getCurrentMoveTowardTargetValues,
  getCurrentSensorObjectValues,
  getCurrentSensorRelationValues,
  getFullToolboxBlockTypes,
  getMoveTowardTargetOptionLabels,
  getSensorObjectOptionLabels,
  getSensorRelationOptionLabels,
  getToolboxBlockTypesForMode,
  isConditionBlockType,
  registerBattleBlocklyBlocks
} from "./blocks.js";
import { setAllowedMoveTowardTargets, setAllowedSensorOptions } from "./blocks.js";

const IGNORED_BLOCK_REASON = "bba_ignored_block";
const GUIDED_WORKSPACE_STORAGE_PREFIX = "bba:guided-workspace:";
const FREE_PLAY_WORKSPACE_STORAGE_KEY = "bba:free-play-workspace";

function buildToolboxXml(blockTypes) {
  const blockLibrary = getBlockLibrary();
  const categories = new Map();
  for (const blockType of blockTypes) {
    const config = blockLibrary[blockType];
    if (!config) {
      continue;
    }
    if (!categories.has(config.category)) {
      categories.set(config.category, { color: config.color, blocks: [] });
    }
    categories.get(config.category).blocks.push(blockType);
  }

  const categoryXml = [...categories.entries()]
    .map(([name, config]) => {
      const blocksXml = config.blocks.map((type) => `        <block type="${type}"></block>`).join("\n");
      return `      <category name="${name}" colour="${config.color}">\n${blocksXml}\n      </category>`;
    })
    .join("\n");

  return `<xml xmlns="https://developers.google.com/blockly/xml">\n${categoryXml}\n    </xml>`;
}

function buildDefaultWorkspaceXml() {
  return `
    <xml xmlns="https://developers.google.com/blockly/xml">
      <block type="${BLOCK_TYPES.ON_EACH_TURN}" x="24" y="24"></block>
    </xml>
  `.trim();
}

function getEventBlock(workspace) {
  return workspace.getBlocksByType(BLOCK_TYPES.ON_EACH_TURN, false)[0] || null;
}

function ensureEventBlock(app) {
  if (!app.blocklyWorkspace) {
    return null;
  }
  let eventBlock = getEventBlock(app.blocklyWorkspace);
  if (eventBlock) {
    eventBlock.setDeletable(false);
    eventBlock.setMovable(false);
    eventBlock.setWarningText(null);
    eventBlock.setDisabledReason(false, IGNORED_BLOCK_REASON);
    return eventBlock;
  }

  const xml = Blockly.utils.xml.textToDom(buildDefaultWorkspaceXml());
  Blockly.Xml.domToWorkspace(xml, app.blocklyWorkspace);
  eventBlock = getEventBlock(app.blocklyWorkspace);
  if (eventBlock) {
    eventBlock.setDeletable(false);
    eventBlock.setMovable(false);
    eventBlock.setDisabledReason(false, IGNORED_BLOCK_REASON);
  }
  return eventBlock;
}

function getConditionChildBlock(block) {
  return typeof block.getInputTargetBlock === "function" ? block.getInputTargetBlock("DO") : null;
}

function getElseChildBlock(block) {
  return typeof block.getInputTargetBlock === "function" ? block.getInputTargetBlock("ELSE") : null;
}

function getValueChildBlock(block, inputName) {
  return typeof block.getInputTargetBlock === "function" ? block.getInputTargetBlock(inputName) : null;
}

function getActionDecisionForBlock(block) {
  const actionType = getActionTypeForBlockType(block.type);
  if (!actionType) {
    return null;
  }

  if (block.type === BLOCK_TYPES.MOVE_TOWARD) {
    return {
      type: actionType,
      actionType,
      targetType: block.getFieldValue("TARGET")
    };
  }

  return { type: actionType, actionType, sourceBlockType: block.type };
}

function getConditionDescriptor(block) {
  if (block.type === BLOCK_TYPES.BOOLEAN_SENSOR_MATCHES) {
    return {
      type: BLOCK_TYPES.IF_SENSOR_MATCHES,
      objectType: block.getFieldValue("OBJECT"),
      relationType: block.getFieldValue("RELATION")
    };
  }
  if (block.type === BLOCK_TYPES.BOOLEAN_HAVE_ENEMY_FLAG) {
    return { type: BLOCK_TYPES.IF_HAVE_ENEMY_FLAG };
  }
  if (block.type === BLOCK_TYPES.BOOLEAN_CAN_JUMP) {
    return { type: BLOCK_TYPES.IF_CAN_JUMP };
  }
  if (block.type === BLOCK_TYPES.BOOLEAN_CAN_PLACE_BARRIER) {
    return { type: BLOCK_TYPES.IF_CAN_PLACE_BARRIER };
  }
  if (block.type === BLOCK_TYPES.BOOLEAN_AREA_FREEZE_READY) {
    return { type: BLOCK_TYPES.IF_AREA_FREEZE_READY };
  }
  if (block.type === BLOCK_TYPES.BOOLEAN_TEAMMATE_HAS_FLAG) {
    return { type: BLOCK_TYPES.IF_TEAMMATE_HAS_FLAG };
  }
  if (block.type === BLOCK_TYPES.BOOLEAN_ON_MY_SIDE) {
    return { type: BLOCK_TYPES.IF_ON_MY_SIDE };
  }
  if (block.type === BLOCK_TYPES.BOOLEAN_ON_ENEMY_SIDE) {
    return { type: BLOCK_TYPES.IF_ON_ENEMY_SIDE };
  }
  if (block.type === BLOCK_TYPES.IF_SENSOR_MATCHES || block.type === BLOCK_TYPES.IF_SENSOR_MATCHES_ELSE) {
    return {
      type: block.type,
      objectType: block.getFieldValue("OBJECT"),
      relationType: block.getFieldValue("RELATION")
    };
  }
  return { type: block.type };
}

function resolveMoveTowardTargetCell(state, runner, targetType) {
  switch (targetType) {
    case MOVE_TOWARD_TARGETS.ENEMY_FLAG: {
      const enemyFlag = state.gameFlags[getEnemyTeamId(runner.team)];
      if (!enemyFlag) {
        return null;
      }
      if (enemyFlag.carriedByRunnerId) {
        const carrier = state.allRunners.find((candidate) => candidate.id === enemyFlag.carriedByRunnerId);
        return carrier ? { x: carrier.gridX, y: carrier.gridY } : null;
      }
      return { x: enemyFlag.gridX, y: enemyFlag.gridY };
    }
    case MOVE_TOWARD_TARGETS.MY_BASE: {
      const flagHome = getTeamFlagHome(state, runner.team);
      return flagHome ? { x: flagHome.x + runner.playDirection, y: flagHome.y } : null;
    }
    case MOVE_TOWARD_TARGETS.HUMAN_RUNNER: {
      const human = state.allRunners.find((candidate) => candidate.team === runner.team && candidate.isHumanControlled);
      return human ? { x: human.gridX, y: human.gridY } : null;
    }
    case MOVE_TOWARD_TARGETS.CLOSEST_ENEMY: {
      const enemies = state.allRunners
        .filter((candidate) => candidate.team !== runner.team)
        .sort((left, right) => {
          const leftDistance = Math.abs(left.gridX - runner.gridX) + Math.abs(left.gridY - runner.gridY);
          const rightDistance = Math.abs(right.gridX - runner.gridX) + Math.abs(right.gridY - runner.gridY);
          return leftDistance - rightDistance || left.id.localeCompare(right.id);
        });
      return enemies[0] ? { x: enemies[0].gridX, y: enemies[0].gridY } : null;
    }
    default:
      return null;
  }
}

function evaluateBlocklyNumberValue(state, runner, block) {
  if (!block) {
    return 0;
  }
  switch (block.type) {
    case BLOCK_TYPES.VALUE_NUMBER:
      return Number(block.getFieldValue("VALUE") || 0);
    case BLOCK_TYPES.VALUE_RUNNER_INDEX:
      return Number.isInteger(runner?.allyIndex) ? runner.allyIndex : 0;
    case BLOCK_TYPES.VALUE_DISTANCE_TO_TARGET: {
      const target = resolveMoveTowardTargetCell(state, runner, block.getFieldValue("TARGET"));
      return target ? Math.abs(target.x - runner.gridX) + Math.abs(target.y - runner.gridY) : 0;
    }
    case BLOCK_TYPES.VALUE_RANDOM_ROLL: {
      const randomFn = typeof state.randomFn === "function" ? state.randomFn : Math.random;
      return Math.floor(randomFn() * 6) + 1;
    }
    case BLOCK_TYPES.VALUE_PLAY_DIRECTION:
      return runner?.playDirection || 0;
    default:
      return 0;
  }
}

function evaluateBlocklyBooleanValue(state, runner, block) {
  if (!block) {
    return false;
  }

  if (
    block.type === BLOCK_TYPES.BOOLEAN_SENSOR_MATCHES ||
    block.type === BLOCK_TYPES.BOOLEAN_HAVE_ENEMY_FLAG ||
    block.type === BLOCK_TYPES.BOOLEAN_CAN_JUMP ||
    block.type === BLOCK_TYPES.BOOLEAN_CAN_PLACE_BARRIER ||
    block.type === BLOCK_TYPES.BOOLEAN_AREA_FREEZE_READY ||
    block.type === BLOCK_TYPES.BOOLEAN_TEAMMATE_HAS_FLAG ||
    block.type === BLOCK_TYPES.BOOLEAN_ON_MY_SIDE ||
    block.type === BLOCK_TYPES.BOOLEAN_ON_ENEMY_SIDE
  ) {
    return evaluateCondition(state, runner, getConditionDescriptor(block));
  }

  if (block.type === BLOCK_TYPES.LOGIC_AND) {
    return (
      evaluateBlocklyBooleanValue(state, runner, getValueChildBlock(block, "LEFT")) &&
      evaluateBlocklyBooleanValue(state, runner, getValueChildBlock(block, "RIGHT"))
    );
  }
  if (block.type === BLOCK_TYPES.LOGIC_OR) {
    return (
      evaluateBlocklyBooleanValue(state, runner, getValueChildBlock(block, "LEFT")) ||
      evaluateBlocklyBooleanValue(state, runner, getValueChildBlock(block, "RIGHT"))
    );
  }
  if (block.type === BLOCK_TYPES.LOGIC_NOT) {
    return !evaluateBlocklyBooleanValue(state, runner, getValueChildBlock(block, "VALUE"));
  }
  if (block.type === BLOCK_TYPES.VALUE_COMPARE) {
    const left = evaluateBlocklyNumberValue(state, runner, getValueChildBlock(block, "LEFT"));
    const right = evaluateBlocklyNumberValue(state, runner, getValueChildBlock(block, "RIGHT"));
    switch (block.getFieldValue("OPERATOR")) {
      case ADVANCED_COMPARE_OPERATORS.EQ:
        return left === right;
      case ADVANCED_COMPARE_OPERATORS.NEQ:
        return left !== right;
      case ADVANCED_COMPARE_OPERATORS.LT:
        return left < right;
      case ADVANCED_COMPARE_OPERATORS.LTE:
        return left <= right;
      case ADVANCED_COMPARE_OPERATORS.GT:
        return left > right;
      case ADVANCED_COMPARE_OPERATORS.GTE:
        return left >= right;
      default:
        return false;
    }
  }

  return false;
}

function collectStaticallyReachableBlocks(block, reachableIds) {
  let current = block;
  let canFallThrough = true;

  while (current && canFallThrough) {
    reachableIds.add(current.id);

    if (getActionTypeForBlockType(current.type)) {
      canFallThrough = false;
      break;
    }

    if (isConditionBlockType(current.type)) {
      const childBlock = getConditionChildBlock(current);
      if (childBlock) {
        collectStaticallyReachableBlocks(childBlock, reachableIds);
      }
      const elseChildBlock = getElseChildBlock(current);
      if (elseChildBlock) {
        collectStaticallyReachableBlocks(elseChildBlock, reachableIds);
      }
    }

    current = current.getNextBlock();
  }
}

function clearBlocklyWarningsAndIgnoreState(block) {
  block.setDisabledReason(false, IGNORED_BLOCK_REASON);
  block.setWarningText(null);
}

function applyIgnoredState(block, message) {
  block.setDisabledReason(true, IGNORED_BLOCK_REASON);
  block.setWarningText(message);
}

export function updateBlocklyExecutionHints(app) {
  if (!app.blocklyWorkspace) {
    return;
  }

  const eventBlock = ensureEventBlock(app);
  const allBlocks = app.blocklyWorkspace.getAllBlocks(false);
  const reachableIds = new Set();
  if (!eventBlock) {
    return;
  }

  reachableIds.add(eventBlock.id);
  collectStaticallyReachableBlocks(eventBlock.getNextBlock(), reachableIds);

  for (const currentBlock of allBlocks) {
    if (currentBlock.id === eventBlock.id) {
      clearBlocklyWarningsAndIgnoreState(currentBlock);
      continue;
    }

    if (!reachableIds.has(currentBlock.id)) {
      const isAttachedSomewhere = Boolean(currentBlock.getParent());
      applyIgnoredState(
        currentBlock,
        isAttachedSomewhere
          ? "Ignored for now: another action will happen before this block can run."
          : "Ignored for now: attach this under 'On Each Turn' to run it."
      );
      continue;
    }

    clearBlocklyWarningsAndIgnoreState(currentBlock);
    if (
      isConditionBlockType(currentBlock.type) &&
      !getConditionChildBlock(currentBlock) &&
      !getElseChildBlock(currentBlock)
    ) {
      currentBlock.setWarningText("Add a move inside this block so it can do something.");
    }
  }
}

function resolveFirstRunnableAction(state, runner, block) {
  let current = block;

  while (current) {
    const actionDecision = getActionDecisionForBlock(current);
    if (actionDecision) {
      return actionDecision;
    }

    if (isConditionBlockType(current.type)) {
      const conditionPassed = current.type === BLOCK_TYPES.IF_BOOLEAN || current.type === BLOCK_TYPES.IF_BOOLEAN_ELSE
        ? evaluateBlocklyBooleanValue(state, runner, getValueChildBlock(current, "BOOL"))
        : evaluateCondition(state, runner, getConditionDescriptor(current));
      if (conditionPassed) {
        const branchAction = resolveFirstRunnableAction(state, runner, getConditionChildBlock(current));
        if (branchAction) {
          return branchAction;
        }
      } else {
        const elseAction = resolveFirstRunnableAction(state, runner, getElseChildBlock(current));
        if (elseAction) {
          return elseAction;
        }
      }
    }

    current = current.getNextBlock();
  }

  return null;
}

export function getFirstRunnableAction(app, runner) {
  if (!app.blocklyWorkspace) {
    return null;
  }
  const eventBlock = ensureEventBlock(app);
  return resolveFirstRunnableAction(app.state, runner, eventBlock?.getNextBlock() || null);
}

export function initBlockly(app) {
  registerBattleBlocklyBlocks();
  const blocklyDiv = document.getElementById("blocklyDiv");
  const initialToolboxXml = buildToolboxXml(getFullToolboxBlockTypes());
  app.blocklyWorkspace = Blockly.inject(blocklyDiv, {
    toolbox: initialToolboxXml,
    scrollbars: true,
    trashcan: true
  });
  loadWorkspaceXml(app, "");
  app.blocklyWorkspace.addChangeListener(() => {
    updateBlocklyExecutionHints(app);
    saveWorkspaceToLocalStorage(app);
  });
}

export function setBlocklyEditable(app, isEditable) {
  const blocklyContainer = document.getElementById("blocklyDiv");
  if (!app.blocklyWorkspace) {
    return;
  }
  app.blocklyWorkspace.readOnly = !isEditable;
  if (blocklyContainer) {
    blocklyContainer.classList.toggle("blockly-area-read-only", !isEditable);
  }
  if (!isEditable) {
    Blockly.hideChaff();
  }
}

export function loadWorkspaceXml(app, xmlText) {
  if (!app.blocklyWorkspace) {
    return;
  }
  app.blocklyWorkspace.clear();
  const workspaceXml = xmlText || buildDefaultWorkspaceXml();
  const xml = Blockly.utils.xml.textToDom(workspaceXml);
  Blockly.Xml.domToWorkspace(xml, app.blocklyWorkspace);
  ensureEventBlock(app);
  updateBlocklyExecutionHints(app);
}

export function getWorkspaceXmlText(app) {
  if (!app.blocklyWorkspace) {
    return "";
  }
  const xml = Blockly.Xml.workspaceToDom(app.blocklyWorkspace);
  return Blockly.Xml.domToText(xml);
}

export function setBlocklyToolboxForCurrentMode(app) {
  if (!app.blocklyWorkspace) {
    return [];
  }
  const currentLevel = app.state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS ? getCurrentLevel(app) : null;
  const sensorObjectTypes = currentLevel?.sensorObjectTypes || [];
  const sensorRelationTypes = currentLevel?.sensorRelationTypes || [];
  const moveTowardTargetTypes = currentLevel?.moveTowardTargetTypes || [];
  setAllowedSensorOptions(sensorObjectTypes, sensorRelationTypes);
  setAllowedMoveTowardTargets(moveTowardTargetTypes);
  app.state.currentSensorObjectTypes = getCurrentSensorObjectValues();
  app.state.currentSensorRelationTypes = getCurrentSensorRelationValues();
  app.state.currentMoveTowardTargetTypes = getCurrentMoveTowardTargetValues();
  const blockTypes = getToolboxBlockTypesForMode(app, currentLevel);
  const toolboxXml = buildToolboxXml(blockTypes);
  app.blocklyWorkspace.updateToolbox(toolboxXml);
  app.state.currentToolboxBlockTypes = [...blockTypes];
  updateBlocklyExecutionHints(app);
  return blockTypes;
}

export function getAvailableToolboxBlockTypes(app) {
  return [...(app.state.currentToolboxBlockTypes || [])];
}

export function getAvailableToolboxBlockLabels(app) {
  return getAvailableToolboxBlockTypes(app).map((blockType) => getBlockDisplayLabel(blockType));
}

export function getMoveTowardTargetLabels() {
  return getMoveTowardTargetOptionLabels();
}

export function getSensorObjectLabels() {
  return getSensorObjectOptionLabels();
}

export function getSensorRelationLabels() {
  return getSensorRelationOptionLabels();
}

function getWorkspaceStorageKey(app) {
  if (app.state.currentModeView === GAME_VIEW_MODES.GUIDED_LEVELS) {
    return `${GUIDED_WORKSPACE_STORAGE_PREFIX}${app.state.currentLevelId || "unknown"}`;
  }
  return FREE_PLAY_WORKSPACE_STORAGE_KEY;
}

export function saveWorkspaceToLocalStorage(app) {
  if (!app.blocklyWorkspace || typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(getWorkspaceStorageKey(app), getWorkspaceXmlText(app));
}

export function loadWorkspaceFromLocalStorage(app, fallbackXml = "") {
  if (typeof window === "undefined" || !window.localStorage) {
    loadWorkspaceXml(app, fallbackXml);
    return fallbackXml;
  }
  const savedXml = window.localStorage.getItem(getWorkspaceStorageKey(app));
  const xmlToLoad = savedXml || fallbackXml;
  loadWorkspaceXml(app, xmlToLoad);
  return xmlToLoad;
}

export function importWorkspaceXml(app, xmlText) {
  if (!app.blocklyWorkspace) {
    return { ok: false, error: "Workspace is not ready." };
  }
  const previousXml = getWorkspaceXmlText(app);
  try {
    loadWorkspaceXml(app, xmlText);
    saveWorkspaceToLocalStorage(app);
    return { ok: true };
  } catch (error) {
    loadWorkspaceXml(app, previousXml);
    return { ok: false, error: error instanceof Error ? error.message : "Invalid XML." };
  }
}
