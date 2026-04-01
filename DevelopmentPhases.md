**Browser Battlegorithms: Revised Phased Development Plan (Aligning with Spec V1.1 and Current Refactor State)**

**Current Implementation Status (2026-03-31)**

* The project is currently in a playable **Phase 6a prototype** state.
* The project now includes a playable **Phase 7 expansion** guided flow with four scaffolded levels, pass/fail evaluation, level unlock progression, and Blockly toolbox restriction by challenge.
* The codebase now also has a modular `src/` architecture, Vite-based build workflow, command-line rule tests, and Playwright browser smoke tests.
* Core gameplay, Blockly integration, NPC foundations, and the first guided learning layer are in place, including a first-run mode chooser, spotlight tutorials, a required `On Each Turn` event block, first one-branch conditional blocks, and a custom level picker popover; broader level content, more advanced Blockly blocks, save/load, and classroom-facing documentation are still future work.

**Phase 1: Specification Document for "Browser Battlegorithms" (Completed)**

* **Objective:** Define the complete "Browser Battlegorithms" game – mechanics, entities, UI, Blockly blocks, level progression, technical stack.
* **Deliverable:** The "Browser Battlegorithms - Game Specification V1.1" document. This serves as the foundational blueprint.
* **Testing / Verification Expectations:**
  * Review the specification for internal consistency before coding begins.
  * Confirm that development phases, mechanics, and winning conditions do not contradict one another.
  * Treat the specification as the source of truth for future regression checks.

**Phase 2: Core Rendering, Basic Entities & Single Human Runner Control**

* **Objective:** Establish the visual environment using p5.js, render basic game elements as emojis/shapes, and allow a single human player to move a runner on the grid.
* **Key Tasks:**
  * Setup p5.js sketch within an HTML structure.
  * Implement grid drawing, and visual representation for walls and jail cells (simple colored rectangles or outlines) based on a predefined map layout.
  * Create basic JavaScript objects/classes for `Runner` and `Flag` with simplified state (position, team, emoji character, `hasEnemyFlag`).
  * Implement rendering functions to display runners and flags as specified emoji characters at their grid coordinates.
  * Implement keyboard controls (Up, Down, Left, Right screen-relative) for a single Human Runner, directly updating its logical grid position and re-rendering. No turn structure or complex move validation yet.
* **Testing / Verification Expectations:**
  * Add command-line tests for map dimensions, basic entity construction, and initial positions.
  * Add a browser smoke test that confirms the canvas renders and a runner appears in the expected starting cell.
  * Perform manual visual checks for grid alignment, emoji readability, and keyboard responsiveness.
* **Outcome:** A visual grid where a single, human-controlled emoji runner can be moved around. Flags are displayed. Static map elements are visible.

**Phase 3: Sequential Turn Structure, Animated Movement & Basic Obstacles**

* **Objective:** Implement the sequential, per-runner turn execution logic with animated movements and introduce static barriers.
* **Key Tasks:**
  * Develop the basic turn management system (initially for one human player and dummy actions for other entities).
  * Implement the sequential action resolution: one runner's action is fully resolved (including animation) before the next begins, alternating teams.
  * Create movement animation using an easing function for runners moving between cells.
  * Implement `Barrier` entity (position, owner, emoji).
  * Allow manual placement/display of barriers on a predefined map for testing.
  * Basic move validation for the human runner against walls and these static barriers (move fails, runner "bounces back" to original cell with animation).
* **Testing / Verification Expectations:**
  * Add unit tests for blocked movement, out-of-bounds movement, and basic turn advancement.
  * Add browser tests covering human movement, bounce-back behavior, and visible animation.
  * Capture a screenshot baseline for the board with walls and a blocked move attempt.
* **Outcome:** A single human runner can take turns moving one cell at a time, with smooth animation. Movement is blocked by walls and manually placed barriers. The concept of alternating turns (even if other team does nothing yet) is established.

**Phase 4: Blockly Integration & First AI Ally Actions**

* **Objective:** Integrate Blockly, define a minimal set of custom action blocks, and enable a single AI Ally to execute a strategy defined by these blocks.
* **Key Tasks:**
  * Integrate the Blockly library into the HTML page structure.
  * Define initial custom Blockly blocks as per Spec V1.1 (e.g., `Move Forward`, `Move Backward`, `Move Up (screen)`, `Move Down (screen)`, `Stay Still`).
  * Develop the JavaScript "interpreter" that:
    * Takes the JavaScript code generated by an AI Ally's Blockly program.
    * Executes it to determine the ally's single intended action for the turn (respecting the "first action block hit is performed" rule).
  * Incorporate one AI Ally for Player 1's team. Its action is determined by its Blockly program and resolved within the sequential turn structure.
* **Testing / Verification Expectations:**
  * Add command-line tests that map Blockly-generated actions to the expected internal action types.
  * Add a browser test hook for loading Blockly XML programmatically.
  * Add Playwright tests proving that a simple Blockly program changes ally behavior.
* **Outcome:** An AI Ally moves on the grid based on a simple Blockly program, with its movements animated one at a time, in sequence with the human player.

**Phase 5: Implementing Core Game Rules & Interactions**

* **Objective:** Implement the core rules: flag pickup, scoring, simplified collisions, jump, barrier placement by runners, and barrier removal.
* **Key Tasks:**
  * Flag Mechanics: Implement `isAtBase`, `carriedByRunnerId` for flags. Implement logic for a runner (human or AI) to pick up the enemy flag when on its cell.
  * Scoring: Implement scoring logic (runner with enemy flag reaches their team's starting base area).
  * Round Reset: On score, reset flags to base, runners to start, `canJump` to true, `canPlaceBarrier` to true, team `areaFreezeUsedThisRound` to false.
  * `Jump Forward` Action: Implement for Human and as a Blockly block. Update and use `canJump` state.
  * `Place Barrier` Action: Implement for Human and as a Blockly block. Update and use `canPlaceBarrier`. Max one active barrier per runner.
  * `Stay Still` to Remove Barrier: Implement logic for a runner (human or AI) to remove an adjacent, faced barrier when planning `Stay Still`. Restore `canPlaceBarrier` to the barrier's owner.
  * "Frozen" State: Implement `isFrozen` and `frozenTurnsRemaining` for runners.
  * Collision Resolution:
    * Implement the deterministic "defender on home side wins" rule.
    * Losing runner becomes frozen, drops flag (returns to base), and "bounces back" (remains in original cell).
    * Winner takes the cell.
  * Same-Team Occupancy: Enforce the rule that a move fails (runner "bounces back") if their target cell is already occupied by an active friendly runner.
  * Pass Through Frozen Opponents: Allow active runners to move into cells occupied by frozen opponents.
* **Testing / Verification Expectations:**
  * Add command-line rule tests for jump, barrier placement/removal, collision outcomes, frozen state, flag pickup, scoring, and round reset.
  * Add invariant tests ensuring no runner leaves bounds, no barrier sits on a wall, and no flag is both carried and at base.
  * Add browser tests for play/reset flow, score display updates, and representative gameplay interactions.
* **Outcome:** A fully playable core game loop with flag mechanics, scoring, basic obstacles, and simplified but clear collision rules.

**Phase 6: NPC Opponents & Hot-Seat Multiplayer Foundation**

* **Objective:** Introduce two simple, hardcoded NPC opponent types and enable basic hot-seat multiplayer.
* **Key Tasks:**
  * Design and implement "NPC Type 1" (e.g., always moves towards player's flag if uncarried, or towards its base if carrying). JavaScript AI.
  * Design and implement "NPC Type 2" (e.g., patrols its own base area, moves to intercept enemies near its flag). JavaScript AI.
  * Allow game setup to choose between Player vs. NPC (selecting NPC type) or Hot-Seat.
  * For Hot-Seat: Implement distinct keyboard controls for Player 2's Human Runner. Allow separate Blockly workspaces (or save/load mechanism) for Player 1's AI Allies and Player 2's AI Allies.
  * Implement team-wide `areaFreezeUsedThisRound` state, reset each round.
* **Testing / Verification Expectations:**
  * Add unit tests that confirm PvP and PvNPC initialization create the correct runner types and roles.
  * Add rule tests ensuring NPC actions are legal and do not target blocked cells when avoidable.
  * Add browser tests for Player 2 controls, NPC match startup, and stable turn progression in both modes.
  * Keep a manual playtest checklist for “does the NPC feel obviously broken?” in addition to deterministic legality tests.
* **Outcome:** Game is playable against different simple AIs or in a two-player hot-seat mode where each player programs their own allies.

**Phase 7: UI Development, Blockly Block Progression & Scaffolded Levels**

* **Objective:** Build out the primary UI panels, implement the system for scaffolded learning by limiting/unlocking Blockly blocks, and create the initial set of student challenges.
* **Key Tasks:**
  * Develop UI panels using HTML/CSS/JS: Block Palette (categorized), Blockly Workspace, Game Simulation Region, Instructions Panel.
  * Implement basic resizability/collapsibility for UI panels.
  * Implement logic for managing available Blockly blocks based on the current level.
  * Design and implement the first 3-4 scaffolded levels as per Spec V1.1, including predefined maps and specific "pass" conditions.
* Add learner-facing onboarding such as first-run mode choice, spotlight tutorials, level intros/tips, and clear explanation of tutorial-specific constraints.
* Add a more explicit Blockly execution model for beginners, including a required event block and visible treatment of ignored early-phase code.
* Replace one-button-per-level navigation with a scalable guided level picker UI.
* Introduce the first conditional Blockly blocks through guided levels (currently `If enemy is in front`, `If barrier is in front`, and `If I have enemy flag`).
* **Testing / Verification Expectations:**
  * Add command-line tests for level pass conditions, block-unlock rules, and level configuration loading.
  * Add browser tests confirming the toolbox changes correctly by level, that onboarding overlays behave correctly, and that the guided navigation UI works as intended.
  * Add screenshot baselines for level-specific UI states and narrow/mobile layouts.
  * Perform manual playtests focused on instructional clarity and whether the active challenge is understandable to a student.
* **Outcome:** A structured learning experience where students are gradually introduced to more complex programming concepts through targeted challenges, explicit onboarding, a more understandable Blockly execution model, and a full 20-level beginner campaign spanning movement, scoring, sensing, helper actions, jump, barrier use, teammate logic, territory checks, and Area Freeze. A more complete user interface.

**Phase 8: Advanced Blockly, More Levels, Save/Load & "Fun" Features**

* **Objective:** Expand the strategic possibilities with more advanced Blockly blocks, create more diverse levels, implement save/load functionality, and add initial "fun factor" elements.
* **Key Tasks:**
  * Add advanced Blockly blocks: `Move Towards [Target]`, `Is [Entity] on [Side of Map]?`, `Is enemy within [X] steps?`, `Die roll > X`, logical operators (`AND`, `OR`, `NOT`).
  * Introduce the `playDirection value` block for more advanced students in free-play.
  * Implement the "Area Effect Freeze" Blockly action for AI Allies, respecting the team-wide per-round limit.
  * Create additional predefined maps for "free-play" mode.
  * Implement robust Local Storage for saving/loading the current Blockly workspace.
  * Implement "Export AI Program (XML)" and "Import AI Program (XML)" features.
  * Add basic sound effects for key game events.
* **Testing / Verification Expectations:**
  * Add semantic tests for every new Blockly block so generated actions and conditions map correctly into engine behavior.
  * Add round-trip tests for save/load and export/import, including malformed-input handling.
  * Add browser tests for Area Freeze, advanced sensing blocks, and workspace persistence across reloads.
  * Add audio and accessibility sanity checks where sound and motion become more prominent.
* **Outcome:** A richer game experience with more tools for students to create sophisticated AI. Portability of student creations.

**Phase 9: Final Polish, Testing, Documentation & Deployment**

* **Objective:** Ensure a stable, polished, well-documented, and easily deployable application.
* **Key Tasks:**
  * Thorough playtesting of all levels, features, NPC behaviors, and hot-seat mode.
  * Bug fixing and performance optimization.
  * Refine UI/UX based on testing.
  * Write a concise "Student Guide" (how to use the interface, explanation of all Blockly blocks, tips for strategy).
  * Write a concise "Teacher Guide" (how to share/use the activity, learning objectives, level overview).
  * Prepare and deploy the application to the chosen static web hosting platform.
* **Testing / Verification Expectations:**
  * Run the full command-line regression suite and browser suite on every release candidate.
  * Perform cross-browser and responsive checks on the supported deployment targets.
  * Do structured manual playtests of each level, free-play, PvNPC, and hot-seat flows.
  * Verify deployment output from the Vite build and ensure production assets are self-contained.
* **Outcome:** A complete, robust, and ready-to-use educational tool.

This revised plan prioritizes the sequential, animated nature of the game early on, adds explicit testing expectations at every phase, and aligns with both the current modular refactor and the "Browser Battlegorithms - Game Specification V1.1."
