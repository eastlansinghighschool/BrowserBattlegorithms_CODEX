# Testing

## Command-Line Tests

- `npm run test:unit`

These tests focus on:

- setup and mode initialization
- movement and collision rules
- scoring and round reset
- core invariants
- NPC legality and simple action selection

## Browser Tests

- `npm run test:browser`

Playwright tests cover:

- app boot
- visible canvas and Blockly workspace
- play/reset flow
- basic input and UI interactions
- test hook access for deterministic browser assertions

## Notes

- The suite is intentionally split between pure JavaScript rule coverage and browser integration coverage.
- Blockly workspace loading for tests uses a narrow test hook to avoid brittle drag-and-drop automation for most scenarios.
