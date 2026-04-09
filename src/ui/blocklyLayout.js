const BLOCKLY_PANEL_SIZE_STORAGE_KEY = "bba:blockly-panel-size";
const BLOCKLY_PANEL_SIZES = {
  compact: 340,
  standard: 420,
  tall: 560
};

function getStoredBlocklyPanelSize() {
  if (typeof window === "undefined" || !window.localStorage) {
    return "standard";
  }
  const storedValue = window.localStorage.getItem(BLOCKLY_PANEL_SIZE_STORAGE_KEY);
  return Object.hasOwn(BLOCKLY_PANEL_SIZES, storedValue) ? storedValue : "standard";
}

export function applyBlocklyPanelSize(app) {
  const blocklyDiv = document.getElementById("blocklyDiv");
  if (!blocklyDiv) {
    return;
  }

  const viewportIsCompact = window.innerWidth <= 900;
  if (viewportIsCompact) {
    blocklyDiv.style.removeProperty("height");
  } else {
    const selectedSize = app.state.blocklyPanelSize || "standard";
    const selectedHeight = BLOCKLY_PANEL_SIZES[selectedSize] || BLOCKLY_PANEL_SIZES.standard;
    blocklyDiv.style.height = `${selectedHeight}px`;
  }

  app.hooks.resizeBlockly?.();
}

export function initializeBlocklyPanelSize(app) {
  app.state.blocklyPanelSize = getStoredBlocklyPanelSize();
  applyBlocklyPanelSize(app);
  window.addEventListener("resize", () => {
    applyBlocklyPanelSize(app);
  });
}

export function setBlocklyPanelSize(app, size) {
  const nextSize = Object.hasOwn(BLOCKLY_PANEL_SIZES, size) ? size : "standard";
  app.state.blocklyPanelSize = nextSize;
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(BLOCKLY_PANEL_SIZE_STORAGE_KEY, nextSize);
  }
  applyBlocklyPanelSize(app);
}
