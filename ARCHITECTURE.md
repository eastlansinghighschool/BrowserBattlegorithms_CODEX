# Browser Battlegorithms Architecture

## Goals

This refactor separates game rules from rendering, DOM wiring, and AI integration so the project is easier to extend, test, and navigate in an agentic IDE.

## Folder Roles

- `src/config/`: constants, maps, game modes, keybindings
- `src/core/`: game state, setup, turn engine, rules, invariants
- `src/entities/`: `Runner`, `Flag`, `Barrier`
- `src/ai/`: Blockly setup/interpreter and NPC behavior
- `src/render/`: p5 bootstrapping, board/entity drawing, effects, animation helpers
- `src/ui/`: score display, DOM controls, setup/run UI state
- `src/testSupport/`: small builders and fixtures for Node/browser tests
- `tests/`: command-line and Playwright tests

## Data Flow

1. `src/main.js` creates the app container and shared state.
2. `src/ui/controls.js` binds buttons and sliders to state-changing functions.
3. `src/ai/blockly/` and `src/ai/npc/` produce intended actions.
4. `src/core/turnEngine.js` resolves actions and updates logical state.
5. `src/render/p5App.js` draws the current state via p5.

## Boundaries

- Rule outcomes belong in `src/core/`.
- p5 drawing and animation belong in `src/render/`.
- DOM/button state belongs in `src/ui/`.
- Blockly block definitions and workspace management belong in `src/ai/blockly/`.
- Future level systems, save/load, and expanded Blockly blocks should layer on top of this structure rather than being added back into a monolithic runtime file.
