import { initializeBlocklyPanelSize } from "../ui/blocklyLayout.js";

let editorLoadPromise = null;
let boardLoadPromise = null;

function installEditorHooks(app, workspaceApi, interpreterApi) {
  app.hooks.getWorkspaceXmlText = () => workspaceApi.getWorkspaceXmlText(app);
  app.hooks.importWorkspaceXml = (xmlText) => workspaceApi.importWorkspaceXml(app, xmlText);
  app.hooks.setBlocklyEditable = (isEditable) => workspaceApi.setBlocklyEditable(app, isEditable);
  app.hooks.setBlocklyToolboxForCurrentMode = () => workspaceApi.setBlocklyToolboxForCurrentMode(app);
  app.hooks.loadWorkspaceFromLocalStorage = (fallbackXml = "", overrideTeamId = null) =>
    workspaceApi.loadWorkspaceFromLocalStorage(app, fallbackXml, overrideTeamId);
  app.hooks.switchActiveBlocklyTeamTab = (teamId) => workspaceApi.switchActiveBlocklyTeamTab(app, teamId);
  app.hooks.getActiveProgramLabel = () => workspaceApi.getActiveBlocklyProgramLabel(app);
  app.hooks.getAvailableToolboxBlockTypes = () => workspaceApi.getAvailableToolboxBlockTypes(app);
  app.hooks.getAvailableToolboxBlockLabels = () => workspaceApi.getAvailableToolboxBlockLabels(app);
  app.hooks.getMoveTowardTargetLabels = () => workspaceApi.getMoveTowardTargetLabels();
  app.hooks.getSensorObjectLabels = () => workspaceApi.getSensorObjectLabels();
  app.hooks.getSensorRelationLabels = () => workspaceApi.getSensorRelationLabels();
  app.hooks.resizeBlockly = () => workspaceApi.resizeBlocklyWorkspace(app);
  app.hooks.getAIAllyAction = (runnerOverride = null) => interpreterApi.getAIAllyAction(app, runnerOverride);
}

export function ensureEditorLoaded(app) {
  if (editorLoadPromise) {
    return editorLoadPromise;
  }

  editorLoadPromise = (async () => {
    try {
      const [workspaceApi, interpreterApi] = await Promise.all([
        import("../ai/blockly/workspace.js"),
        import("../ai/blockly/interpreter.js")
      ]);
      workspaceApi.initBlockly(app);
      installEditorHooks(app, workspaceApi, interpreterApi);
      initializeBlocklyPanelSize(app);
      app.state.editorReady = true;
      app.state.editorLoadError = null;
      app.hooks.onEditorReady?.();
      app.hooks.syncCurrentModeAfterSubsystemReady?.();
      app.syncUi();
      return { workspaceApi, interpreterApi };
    } catch (error) {
      app.state.editorLoadError = error instanceof Error ? error.message : "The code block editor could not be loaded.";
      app.syncUi();
      throw error;
    }
  })();

  return editorLoadPromise;
}

export function ensureBoardLoaded(app) {
  if (boardLoadPromise) {
    return boardLoadPromise;
  }

  boardLoadPromise = (async () => {
    try {
      const p5Api = await import("../render/p5App.js");
      p5Api.initializeP5App(app);
      app.state.boardReady = true;
      app.state.boardLoadError = null;
      app.hooks.onBoardReady?.();
      app.hooks.syncCurrentModeAfterSubsystemReady?.();
      app.syncUi();
      return p5Api;
    } catch (error) {
      app.state.boardLoadError = error instanceof Error ? error.message : "The game board could not be loaded.";
      app.syncUi();
      throw error;
    }
  })();

  return boardLoadPromise;
}

export function startHeavyBoot(app) {
  app.state.shellReady = true;
  ensureEditorLoaded(app).catch(() => {});
  ensureBoardLoaded(app).catch(() => {});
}

export function retryEditorLoad(app) {
  if (!app.state.editorLoadError) {
    return ensureEditorLoaded(app);
  }
  editorLoadPromise = null;
  app.state.editorLoadError = null;
  app.syncUi();
  return ensureEditorLoaded(app);
}

export function retryBoardLoad(app) {
  if (!app.state.boardLoadError) {
    return ensureBoardLoaded(app);
  }
  boardLoadPromise = null;
  app.state.boardLoadError = null;
  app.syncUi();
  return ensureBoardLoaded(app);
}

export function whenHeavySystemsReady(app) {
  return Promise.allSettled([ensureEditorLoaded(app), ensureBoardLoaded(app)]);
}
