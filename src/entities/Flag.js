import { CELL_SIZE } from "../config/constants.js";

export class Flag {
  constructor(x, y, teamId, emojiChar) {
    this.initialGridX = x;
    this.initialGridY = y;
    this.gridX = x;
    this.gridY = y;
    this.teamId = teamId;
    this.emojiChar = emojiChar;
    this.isAtBase = true;
    this.carriedByRunnerId = null;
  }

  display(p) {
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(CELL_SIZE * 0.6);
    p.text(this.emojiChar, this.gridX * CELL_SIZE + CELL_SIZE / 2, this.gridY * CELL_SIZE + CELL_SIZE / 2);
  }

  resetToInitialPosition() {
    this.gridX = this.initialGridX;
    this.gridY = this.initialGridY;
    this.carriedByRunnerId = null;
    this.isAtBase = true;
  }
}
