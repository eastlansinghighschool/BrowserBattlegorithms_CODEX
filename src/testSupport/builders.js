import { createApp } from "../core/state.js";
import { initializeMatch } from "../core/setup.js";
import { createRandomizedFreePlayTeamSetup } from "../core/teams.js";

export function buildMatch(options = {}) {
  const app = createApp();
  if (options.currentGameMode) {
    app.state.currentGameMode = options.currentGameMode;
  }
  app.state.activeTeamSetup = createRandomizedFreePlayTeamSetup(app.state.currentGameMode, () => 0);
  initializeMatch(app);
  return app;
}
