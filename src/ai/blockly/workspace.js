import * as Blockly from "blockly";
import { BLOCK_TYPES, GAME_VIEW_MODES } from "../../config/constants.js";
import { getCurrentLevel } from "../../core/levels.js";
import { evaluateCondition } from "../../core/conditions.js";
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
  if (block.type === BLOCK_TYPES.IF_SENSOR_MATCHES || block.type === BLOCK_TYPES.IF_SENSOR_MATCHES_ELSE) {
    return {
      type: block.type,
      objectType: block.getFieldValue("OBJECT"),
      relationType: block.getFieldValue("RELATION")
    };
  }
  return { type: block.type };
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
      const conditionPassed = evaluateCondition(state, runner, getConditionDescriptor(current));
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
