import * as Blockly from "blockly";
import { GAME_VIEW_MODES } from "../../config/constants.js";
import { getCurrentLevel } from "../../core/levels.js";
import { getBlockLibrary, getFullToolboxBlockTypes, getToolboxBlockTypesForMode, registerBattleBlocklyBlocks } from "./blocks.js";

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

export function initBlockly(app) {
  registerBattleBlocklyBlocks();
  const blocklyDiv = document.getElementById("blocklyDiv");
  const initialToolboxXml = buildToolboxXml(getFullToolboxBlockTypes());
  app.blocklyWorkspace = Blockly.inject(blocklyDiv, {
    toolbox: initialToolboxXml,
    scrollbars: true,
    trashcan: true
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
  if (!xmlText) {
    return;
  }
  const xml = Blockly.utils.xml.textToDom(xmlText);
  Blockly.Xml.domToWorkspace(xml, app.blocklyWorkspace);
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
  return blockTypes;
}

export function getAvailableToolboxBlockTypes(app) {
  return [...(app.state.currentToolboxBlockTypes || [])];
}
