import { CELL_SIZE, COLS, ROWS, CELL_TYPE } from "../config/constants.js";

export function drawGrid(p) {
  p.stroke(180);
  p.strokeWeight(1);
  for (let c = 0; c <= COLS; c += 1) {
    p.line(c * CELL_SIZE, 0, c * CELL_SIZE, ROWS * CELL_SIZE);
  }
  for (let r = 0; r <= ROWS; r += 1) {
    p.line(0, r * CELL_SIZE, COLS * CELL_SIZE, r * CELL_SIZE);
  }
}

export function drawMapElements(p, gameMap) {
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const cellType = gameMap[r][c];
      const xPos = c * CELL_SIZE;
      const yPos = r * CELL_SIZE;
      p.push();
      switch (cellType) {
        case CELL_TYPE.FLOOR:
          p.fill(245, 245, 245);
          p.noStroke();
          break;
        case CELL_TYPE.WALL:
          p.fill(100, 100, 100);
          p.noStroke();
          break;
        case CELL_TYPE.JAIL:
          p.fill(200, 200, 200);
          p.stroke(50);
          p.strokeWeight(2);
          break;
        case CELL_TYPE.TEAM1_BASE:
          p.fill(173, 216, 230, 150);
          p.noStroke();
          break;
        case CELL_TYPE.TEAM2_BASE:
          p.fill(255, 165, 0, 150);
          p.noStroke();
          break;
        default:
          p.fill(255);
          p.noStroke();
      }
      p.rect(xPos, yPos, CELL_SIZE, CELL_SIZE);
      p.pop();
    }
  }
}
