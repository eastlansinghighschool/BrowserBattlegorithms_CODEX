# Development Log

## 2026-03-31 - Current Project State Assessment

The project is now in a playable **Phase 7 expansion** state. Relative to the goals in [GameSpecification.md](D:/ai/Codex/BrowserBattlegorithms_CODEX/GameSpecification.md), the game now includes not only the core sandbox match loop, but also a guided-first learning flow with twenty authored guided levels, level pass/fail evaluation, level unlock progression, Blockly toolbox restriction by challenge, and a first-pass onboarding/tutorial system aimed at beginners.

The project has also advanced beyond its earlier monolithic prototype structure. It now has a modular `src/` architecture, a Vite-based build workflow, command-line Node tests for core rules, and Playwright browser smoke tests. That means the project has moved out of the earlier late **Phase 5 / early Phase 6** prototype state and into the first meaningful **Phase 7** learning-product milestone, with additional Phase 7 content and Phase 8 features still ahead.

## Evidence From the Current Codebase

### Gameplay and Product State

- Core rendering, score display, play/reset flow, and Blockly UI are present.
- PvP and PvNPC foundations are implemented.
- Core match rules are implemented: movement, jump, barrier placement/removal, collisions, freezing, flag pickup, scoring, and round reset.
- Blockly currently supports the initial action set needed for the first ally-programming loop.
- Two NPC behaviors exist and are wired into the runtime.
- Guided mode is now the default entry view.
- Twenty scaffolded guided levels are authored and playable.
- Level pass conditions, failure conditions, and unlock progression are implemented.
- The Blockly toolbox now adapts to the active level while free-play retains the full action set.
- First-run onboarding now begins with an explicit mode chooser instead of assuming the user knows the UI layout.
- Guided levels now include spotlight-style tutorial overlays, explanatory intros, and student-facing tips.
- Blockly now starts from a required `On Each Turn` event block so students can see that the ally program runs on each ally turn.
- First conditional blocks are now implemented for beginner decision-making: `If I Have Enemy Flag`, `If Barrier Is In Front`, and `If Enemy Is In Front`.
- A parameterized `Move Toward [target]` helper block is now implemented for `Enemy Flag`, `My Base`, `Human Runner`, and `Closest Enemy`.
- A generic sensing family is now implemented as `If [object] is [relation]` and `If [object] is [relation] / else`, with level-gated sensor objects and relations.
- The guided campaign now spans basic movement, scoring, generic sensing, human-runner control, `Move Toward`, jump, barrier placement/removal, teammate logic, territory logic, and Area Freeze.
- Free play now exposes a broader sandbox block set, including `Move Randomly`, readiness checks for jump/barrier/Area Freeze, teammate-flag checks, territory checks, and the `Freeze Opponents` action.
- Unattached or extra sequential blocks are now visually marked as ignored in the current early-phase execution model.
- Guided level selection now uses a custom picker popover that also shows the current level state.

### Engineering and Tooling State

- The runtime now boots through [src/main.js](D:/ai/Codex/BrowserBattlegorithms_CODEX/src/main.js).
- Responsibilities are split across `src/config`, `src/core`, `src/entities`, `src/ai`, `src/render`, and `src/ui`.
- The build pipeline is defined in [package.json](D:/ai/Codex/BrowserBattlegorithms_CODEX/package.json) and [vite.config.js](D:/ai/Codex/BrowserBattlegorithms_CODEX/vite.config.js).
- Runtime libraries are now managed through npm, with p5 pinned to the current 1.x line and Blockly imported as ES modules.
- Core regression tests are in [tests/unit/core.test.js](D:/ai/Codex/BrowserBattlegorithms_CODEX/tests/unit/core.test.js).
- Browser smoke tests are in [tests/browser/smoke.spec.js](D:/ai/Codex/BrowserBattlegorithms_CODEX/tests/browser/smoke.spec.js).

## Phase Assessment

Based on [DevelopmentPhases.md](D:/ai/Codex/BrowserBattlegorithms_CODEX/DevelopmentPhases.md), the project appears to have:

- Fully or mostly completed **Phase 2**, **Phase 3**, **Phase 4**, and much of **Phase 5**
- Entered **Phase 6** with both game modes and NPC foundations in place
- Entered **Phase 7** with a first guided-level MVP, pass-condition framework, level-based Blockly restriction, explicit onboarding UX, and a more student-readable Blockly execution model
- Completed an important cross-cutting engineering refactor that was not originally called out in the phase plan:
  - modular architecture
  - build tooling
  - test foundations
- Not yet meaningfully entered the later parts of **Phase 7** or **Phase 8** such as expanded level content, advanced Blockly conditions/sensing, or save/load/export

## Highest-Priority Remaining Gaps

- Post-campaign enrichment levels or optional side challenges beyond the current 20-level guided campaign
- Progressive Blockly unlocks for richer conditional and sensing concepts
- More advanced Blockly logic/sensing blocks beyond the current generic sensing starter set and one-branch conditionals
- Proximity-based sensing levels and richer use of Manhattan-distance relations in later guided puzzles
- Guided-level integration for the newer free-play-only sandbox blocks
- Save/load and XML import/export of Blockly workspaces
- Classroom-facing documentation such as student and teacher guides
- Broader browser integration coverage beyond the current smoke suite
- Further refinement of guided navigation and onboarding as the number of levels grows

## Verification Snapshot

Verified during the current refactor pass:

- `npm run test:unit`
- `npm test`
- `npm run build`
- `npm run test:browser`

This is a strong core gameplay build with a now-solid engineering foundation. The next major milestone should continue Phase 7 by adding more guided content, fuller conditional logic, and richer student-facing curriculum support.
