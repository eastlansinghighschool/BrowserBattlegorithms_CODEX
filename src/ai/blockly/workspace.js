import * as Blockly from "blockly";
import { BLOCK_TYPES, GAME_VIEW_MODES } from "../../config/constants.js";
import { getCurrentLevel } from "../../core/levels.js";
import {
  getActionTypeForBlockType,
  getBlockLibrary,
  getFullToolboxBlockTypes,
  getToolboxBlockTypesForMode,
  registerBattleBlocklyBlocks
} from "./blocks.js";

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

export function updateBlocklyExecutionHints(app) {
  if (!app.blocklyWorkspace) {
    return;
  }

  const eventBlock = ensureEventBlock(app);
  const allBlocks = app.blocklyWorkspace.getAllBlocks(false);
  const activeIds = new Set();
  if (!eventBlock) {
    return;
  }

  activeIds.add(eventBlock.id);
  let block = eventBlock.getNextBlock();
  let firstActionSeen = false;
  while (block) {
    activeIds.add(block.id);
    if (!firstActionSeen && getActionTypeForBlockType(block.type)) {
      firstActionSeen = true;
      block.setDisabledReason(false, IGNORED_BLOCK_REASON);
      block.setWarningText(null);
    } else {
      block.setDisabledReason(true, IGNORED_BLOCK_REASON);
      block.setWarningText("Ignored for now: only the first action under 'On Each Turn' runs each turn.");
    }
    block = block.getNextBlock();
  }

  for (const currentBlock of allBlocks) {
    if (currentBlock.id === eventBlock.id) {
      currentBlock.setDisabledReason(false, IGNORED_BLOCK_REASON);
      currentBlock.setWarningText(null);
      continue;
    }
    if (!activeIds.has(currentBlock.id)) {
      currentBlock.setDisabledReason(true, IGNORED_BLOCK_REASON);
      currentBlock.setWarningText("Ignored for now: attach this under 'On Each Turn' to run it.");
    } else if (!firstActionSeen && getActionTypeForBlockType(currentBlock.type)) {
      currentBlock.setDisabledReason(false, IGNORED_BLOCK_REASON);
      currentBlock.setWarningText(null);
      firstActionSeen = true;
    }
  }
}

export function getFirstRunnableAction(app) {
  if (!app.blocklyWorkspace) {
    return null;
  }
  const eventBlock = ensureEventBlock(app);
  let block = eventBlock?.getNextBlock();
  while (block) {
    const actionType = getActionTypeForBlockType(block.type);
    if (actionType) {
      return { type: actionType };
    }
    block = block.getNextBlock();
  }
  return null;
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
