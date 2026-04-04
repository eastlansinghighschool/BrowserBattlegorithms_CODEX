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

## Team-First Runtime

- Active matches now build an explicit `state.teams` object before creating runners or flags.
- Team identity is the authoritative source for:
  - `playDirection`
  - home side / base area
  - flag home location
  - flag emoji
  - team glow colors
- Runners still carry a runtime `playDirection`, but it is derived from their team's active configuration during setup and reset, not authored independently per runner.
- Free play now generates fresh active teams on entry, randomizing which team attacks left-to-right versus right-to-left while enforcing one `1` direction and one `-1` direction.

## Setup Pipeline

1. `src/core/levels.js` or free-play entry selects an active semantic team setup.
2. `src/core/teams.js` validates that the two teams use opposing `playDirection` values and derives side-dependent base/flag metadata.
3. `src/core/setup.js` builds runtime teams first, then flags, then runners from team-owned runner slots.
4. Guided level extras such as carried-flag starts, frozen teaching props, and barriers are applied from the active setup data.
5. Downstream systems such as scoring, sensing, NPC logic, and visual effects read active team state instead of global static team defaults.

## Phase 8 Additions

- Blockly now has two layers:
  - beginner statement blocks for Levels 1-20
  - advanced boolean/value blocks for Levels 21-35 and free play
- Advanced Blockly evaluation still ends in a single action per ally turn, but now supports:
  - boolean-producing sensor/resource/territory checks
  - `AND`, `OR`, `NOT`
  - numeric literals, comparisons, runner index, distance-to-target, random roll, and playDirection values
- One workspace can now drive multiple allied runners. Each Blockly-controlled ally receives a stable `allyIndex` within its team.
- Guided and free-play Blockly workspaces now persist through `src/ai/blockly/workspace.js` using:
  - one Local Storage key per guided level
  - one Local Storage key for free play
  - XML import/export helpers layered on top of the same workspace serialization path
- Sound feedback is centralized in `src/ui/sound.js`, keeping audio triggers out of rendering code and letting the core engine emit semantic events such as freeze, flag pickup, score, and level pass/fail.

## Boundaries

- Rule outcomes belong in `src/core/`.
- p5 drawing and animation belong in `src/render/`.
- DOM/button state belongs in `src/ui/`.
- Blockly block definitions and workspace management belong in `src/ai/blockly/`.
- Future level systems, save/load, and expanded Blockly blocks should layer on top of this structure rather than being added back into a monolithic runtime file.
