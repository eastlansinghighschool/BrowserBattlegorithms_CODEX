# Testing

## Command-Line Tests

- `npm run test:unit`

These tests focus on:

- team/setup contracts and free-play roster generation
- movement, collision, and own-flag occupancy rules
- scoring, reset, and guided level-state progression
- authored guided-level contracts, unlock matrices, and content metadata
- Blockly interpreter semantics and execution-hint behavior
- condition and generic sensor evaluation
- reference solution existence and solvability across the guided campaign
- free-play-only toolbox, random-move, and Area Freeze contracts
- pure display and keyboard-mapping logic

## Browser Tests

- `npm run test:browser`

Playwright tests cover:

- startup shell, welcome chooser, and lazy-load placeholders
- guided tutorial overlay behavior and level-picker interaction
- guided start/reset/next-level flow and HUD behavior
- actual keyboard input in representative guided and PvP scenarios
- panel collapse, Blockly resizing, and desktop workspace size controls
- free-play setup controls for mode, team size, and map selection
- PvP free-play team tab switching and separate programs per side
- free-play mode smoke coverage for PvP, PvCPU Easy, and PvCPU Tactical
- Local Storage persistence across reload for guided and free-play programs
- sound preference persistence and malformed XML import feedback
- help-link behavior and standalone help-page navigation

## Notes

- The suite is intentionally split between pure JavaScript rule coverage and browser integration coverage.
- Unit tests are now split by subsystem under `tests/unit/` instead of living in one catch-all file.
- Browser tests now focus on student-visible journeys and breakable UI transitions, not exhaustive authored-level or engine-detail assertions.
- Blockly workspace loading for tests still uses a narrow test hook to avoid brittle drag-and-drop automation for most scenarios.
- Authored level contracts, toolbox gates, engine invariants, and decision-selection details belong in `npm run test:unit` unless the learner can directly see the behavior in the browser.
- Release validation should include `npm test`, `npm run build`, and `npm run test:browser` before shipping or deploying.
