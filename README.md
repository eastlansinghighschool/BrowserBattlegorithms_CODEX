# BrowserBattlegorithms_CODEX

Browser-based version of the Battlegorithms AP CSA lab.

## Current State

- Playable **Phase 7 expansion** build with guided-first level flow
- Twenty guided levels with pass/fail evaluation and sequential unlock progression
- Guided onboarding now includes a first-run mode chooser, spotlight tutorials, and explanatory level tips
- Blockly now uses a required `On Each Turn` event block, conditional blocks for resources/team/territory checks, a parameterized `Move Toward [target]` helper block, and a generic sensing family with object/relation dropdowns
- Free play now includes the broader sandbox block set, including `Move Randomly`, jump/barrier readiness checks, teammate/territory checks, and `Freeze Opponents`
- Ignored/unattached early-phase blocks are visually marked for beginners
- Level-based Blockly toolbox restriction plus free-play sandbox mode
- Guided level navigation now uses a custom picker popover instead of a growing row of buttons
- Modular ES-module codebase under `src/`
- Vite-based dev/build workflow
- Command-line rule tests and Playwright browser smoke tests in place

## Key Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm test`
- `npm run test:browser`

## Main Project Docs

- [GameSpecification.md](D:/ai/Codex/BrowserBattlegorithms_CODEX/GameSpecification.md)
- [DevelopmentPhases.md](D:/ai/Codex/BrowserBattlegorithms_CODEX/DevelopmentPhases.md)
- [DevelopmentLog.md](D:/ai/Codex/BrowserBattlegorithms_CODEX/DevelopmentLog.md)
- [ARCHITECTURE.md](D:/ai/Codex/BrowserBattlegorithms_CODEX/ARCHITECTURE.md)
- [TESTING.md](D:/ai/Codex/BrowserBattlegorithms_CODEX/TESTING.md)
