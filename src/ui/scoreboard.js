export function updateScoreDisplay(app) {
  const scoreElement = document.getElementById("scoreDisplay");
  if (!scoreElement) {
    return;
  }
  const { currentTurnNumber, teamScores, pointsToWin, currentModeView, activeLevelResult } = app.state;
  let prefix = `Turn: ${currentTurnNumber} | Scores: Team 1: ${teamScores[1]} - Team 2: ${teamScores[2]} (Win at ${pointsToWin})`;
  if (currentModeView === "GUIDED_LEVELS") {
    const statusText = activeLevelResult === "IN_PROGRESS" ? "Level in progress" : activeLevelResult === "PASSED" ? "Level passed" : activeLevelResult === "FAILED" ? "Level failed" : "Level ready";
    prefix = `${statusText} | ${prefix}`;
  }
  scoreElement.innerHTML = prefix;
}
