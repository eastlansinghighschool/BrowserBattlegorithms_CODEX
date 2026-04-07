# Testing

## Command-Line Tests

- `npm run test:unit`

These tests focus on:

- setup and mode initialization
- movement and collision rules
- scoring and round reset
- core invariants
- NPC legality and simple action selection
- level definitions, pass/fail evaluation, and unlock progression across the 20-level guided campaign
- guided-mode setup details such as toolbox restriction and human-turn behavior defaults
- condition evaluation and Blockly decision selection for the first one-branch conditional blocks and the generic sensing family
- parameterized `Move Toward [target]` decision selection and target tie-break behavior
- free-play-only readiness, teammate, territory, random-move, and Area Freeze behavior

## Browser Tests

- `npm run test:browser`

Playwright tests cover:

- app boot
- visible canvas and Blockly workspace
- first-run mode chooser flow
- guided tutorial overlay behavior
- play/reset flow
- basic input and UI interactions
- required `On Each Turn` Blockly event block
- new guided conditional blocks and their level-specific tutorials
- generic sensing blocks, their level-gated object/relation dropdowns, and the first sensing-track levels
- later guided lessons for human-runner control, `Move Toward`, jump, barrier placement/removal, teammate logic, territory checks, and Area Freeze
- Blockly toolbox restriction in guided levels and broader tooling in free play
- free-play availability of the parameterized `Move Toward` block and its target dropdown options
- free-play availability and behavior of `Move Randomly`, `Freeze Opponents`, and the newer readiness/team/territory condition blocks
- free-play setup controls for mode, team size, and map selection
- PvP free-play team tab switching and separate Blockly programs per side
- PvCPU Easy and PvCPU Tactical startup and behavior smoke coverage
- guided completion flow, including `Next Level`
- Blockly becoming editable again after guided pass/fail results
- guided level picker popover behavior
- test hook access for deterministic browser assertions

## Notes

- The suite is intentionally split between pure JavaScript rule coverage and browser integration coverage.
- Blockly workspace loading for tests uses a narrow test hook to avoid brittle drag-and-drop automation for most scenarios.
- Browser tests currently focus on high-value guided-mode regressions and smoke coverage rather than exhaustive visual or full-playthrough automation.
- Release validation should include `npm test`, `npm run build`, and `npm run test:browser` before shipping or deploying.
