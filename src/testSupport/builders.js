import { createApp } from "../core/state.js";
import { initializeMatch } from "../core/setup.js";

export function buildMatch(options = {}) {
  const app = createApp();
  if (options.currentGameMode) {
    app.state.currentGameMode = options.currentGameMode;
  }
  initializeMatch(app);
  return app;
}
