# BrowserBattlegorithms_CODEX

Browser-based version of the Battlegorithms AP CSA lab.

## Current State

- Playable **Phase 8 expansion** build with guided-first level flow
- Thirty-five guided levels with pass/fail evaluation and sequential unlock progression
- Guided onboarding now includes a first-run mode chooser, spotlight tutorials, and explanatory level tips
- Blockly now includes a beginner track plus an advanced boolean/value layer with logic operators, comparisons, typed number inputs, runner index, and distance-to-target values
- Guided Phase 8 now introduces multi-ally shared-program strategy levels where Blockly-controlled allies can branch on stable runner indices
- Free play now supports `Player vs Player`, `Player vs CPU (Easy)`, and `Player vs CPU (Tactical)` sandbox matches
- Free play now includes a setup panel for mode, team size (`2-6` runners per side), and map selection across multiple wall layouts
- PvP free play now supports separate Team 1 / Team 2 Blockly programs through one shared editor with team tabs, independent Local Storage, and independent XML import/export
- Free play now includes the broader sandbox block set, including `Move Randomly`, jump/barrier readiness checks, teammate/territory checks, `Freeze Opponents`, and advanced value blocks such as random roll and playDirection
- Match setup is now team-first: active teams own direction, base side, flag home, and visual identity, while runners inherit `playDirection` from their team
- Free play now randomizes which team attacks left-to-right versus right-to-left each time it is loaded while enforcing one `1` and one `-1` direction
- Blockly workspaces now persist per guided level and for free play via Local Storage, with XML export/import controls in the Blockly panel
- First-pass sound feedback is now available for freeze, flag pickup, scoring, and level pass/fail, with a persisted sound toggle
- Ignored/unattached early-phase blocks are visually marked for beginners
- Level-based Blockly toolbox restriction plus free-play sandbox mode
- Guided level navigation now uses a custom picker popover instead of a growing row of buttons
- Modular ES-module codebase under `src/`
- Vite-based dev/build workflow
- Command-line rule tests and Playwright browser smoke tests in place
- Static Vite build is ready for deployment to static hosting, with CI configured to require tests plus production build

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
- [StudentGuide.md](D:/ai/Codex/BrowserBattlegorithms_CODEX/StudentGuide.md)
- [TeacherGuide.md](D:/ai/Codex/BrowserBattlegorithms_CODEX/TeacherGuide.md)
