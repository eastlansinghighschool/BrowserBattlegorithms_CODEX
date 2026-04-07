# Development Log

## 2026-04-06 - Phase 9 Free Play Productization

Free play is no longer just the guided campaign's sandbox leftover. This pass turns it into a configurable product surface with three out-of-the-box modes: `Player vs Player`, `Player vs CPU (Easy)`, and `Player vs CPU (Tactical)`.

The runtime now supports team sizes from two to six total runners per side, multiple selectable free-play maps, and a dedicated free-play setup panel. PvP now uses one Blockly editor with separate Team 1 / Team 2 program tabs, and each side's XML persists independently so two students can sit at one keyboard and program/play against one another without overwriting each other's code.

To support that, free play now has its own CPU strategy layer instead of reusing the guided NPC teaching behaviors. The easy CPU is intentionally chaotic and low-skill, while the tactical CPU splits into attacker and defender roles, pursues flags, places midfield barriers, and uses freeze when appropriate. The docs and smoke coverage were updated in parallel so this is also a release-hardening step, not just a feature addition.

## 2026-04-04 - Phase 8 Advanced Blockly and Team Strategy Expansion

Phase 8 is now live in the codebase rather than just planned in the Markdown. The guided campaign has expanded from twenty beginner levels to thirty-five total levels, with Levels 21-35 introducing advanced Blockly reasoning and the first multi-ally shared-program strategy arc.

The Blockly system now supports a parallel advanced layer instead of replacing the beginner blocks. That advanced layer adds boolean wrappers, boolean-producing value blocks, typed numbers, comparisons, `AND`/`OR`/`NOT`, `runner index`, `distance to [target]`, `random roll`, and a free-play `playDirection value`. The runtime also now assigns stable ally indices so one Blockly workspace can drive more than one allied runner.

Phase 8 also completed the persistence and portability goals that had been sitting in the phase plan: guided workspaces now persist per level, free play has its own saved workspace, XML export/import controls are available in the Blockly panel, and malformed XML imports roll back safely. A first-pass sound system was added as well, including a persisted sound toggle and lightweight effects for freeze, flag pickup, scoring, and level pass/fail.

While implementing this pass, several integration bugs were fixed along the way:

- team-first level definitions now normalize correctly instead of dropping advanced team-owned runners
- advanced boolean output blocks now map into the existing condition evaluator instead of silently evaluating false
- `Move Toward closest enemy` now works in guided levels that use frozen teaching props
- the first advanced teamwork levels were re-authored so their intended reference solutions are actually solvable

## 2026-04-03 - Team-First Match Setup Refactor

The runtime no longer treats teams as a thin bootstrap layer that gets immediately overridden by per-runner direction mutations. Active matches now build explicit team state first, and that team state owns the concepts that are actually team-level in the game design: `playDirection`, home side, scoring base cells, flag home location, flag emoji, and team glow colors.

This refactor was prompted by repeated confusion around mirrored tutorial levels and runner-facing visuals. The old architecture allowed levels to mutate individual runners after construction, which made it too easy to create split ownership between `TEAM_CONFIG`, runner instances, and level-specific overrides. The new architecture makes runners inherit `playDirection` from their active team instead, validates that the two teams always point in opposite directions, and makes downstream systems such as scoring, sensing, NPC logic, and visual effects read the active runtime teams.

Free play also now randomizes which team attacks left-to-right versus right-to-left each time it is entered, while still enforcing one `1` direction and one `-1` direction. That keeps the "forward is relative" idea alive outside the guided campaign without allowing invalid same-direction matches.

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

## Additional Gameplay Rules Update

- Collision resolution was revised so only one runner can occupy the collision cell after contact. The winner stays on the collision square, while the loser is frozen back on the attacker's origin square.
- Home-flag cells are now blocked for their own team while that flag is still at base. This removes direct flag camping and keeps captures visually legible.

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
