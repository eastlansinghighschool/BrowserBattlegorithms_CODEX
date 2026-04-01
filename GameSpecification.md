# **Browser Battlegorithms \- Game Specification V1.1**

**Implementation Status Note (2026-03-31):** The live codebase is currently a Phase 6a prototype with a modular ES-module architecture, Vite-based build workflow, command-line rule tests, and Playwright browser smoke tests. This specification still describes the target product vision; not every later-phase feature below is implemented yet.

## **1\. Introduction & Educational Goals**

1.1. Overview

Browser Battlegorithms is a two-player, turn-based, grid-based capture-the-flag game designed as an introductory programming and computational thinking activity. It is intended to be played in a web browser. Players (or students) will primarily interact with the game by constructing strategies for their AI-controlled "Ally" runners using a visual, block-based programming interface (Blockly). The game supports play against built-in NPC opponents or hot-seat multiplayer where two human players, each with their own AI-controlled allies, compete on the same machine.

1.2. Target Audience

This game is primarily aimed at students in introductory computer science courses or those new to programming concepts (e.g., middle school or early high school, or "Hour of Code" participants).

**1.3. Learning Objectives**

* Introduce fundamental programming concepts: sequencing, conditional logic (if/then/else), simple loops (implicit in "each turn"), and event-based thinking.  
* Develop problem-solving and strategic thinking skills within a game context.  
* Foster an understanding of how simple rules and AI behaviors can lead to complex emergent gameplay.  
* Provide a gentle and engaging entry point to computational thinking without the immediate overhead of text-based syntax.  
* Serve as a potential bridge to more advanced programming environments and concepts.

## **2\. Core Gameplay Loop & Mechanics**

**2.1. Game Type**

* Turn-based strategy.  
* Grid-based map.  
* Two teams: "Team 1" (e.g., Blue) and "Team 2" (e.g., Orange).  
* Each team consists of one Human-Controlled Runner and a small number (e.g., 2\) of AI Ally Runners.

**2.2. Game Modes**

* **Player vs. NPC:** One human player controls their team's Human Runner and programs their AI Allies. The opposing team is controlled by built-in NPC logic.  
* **Hot-Seat Multiplayer:** Two human players on the same computer. Each player controls their respective Human Runner using distinct keyboard inputs and programs their own team's AI Allies using separate Blockly workspaces/configurations.

**2.3. Objective & Winning**

* **Capture the Flag:** The primary objective is to capture the opposing team's flag.  
* **Return to Base:** After capturing the enemy flag, a runner must carry it back to their own team's starting base location on the map.  
* **Scoring a Point:** A point is scored when a runner carrying the enemy flag successfully reaches any cell within their team's designated starting base area.  
* **Winning the Game:** The first team to reach a predetermined number of points (e.g., 2 points) wins the match.  
* **Round Reset:** After a point is scored, the game resets for a new round: flags are returned to their starting base positions, all runners are reset to their starting positions and states (e.g., hasEnemyFlag \= false, isFrozen \= false, canJump \= true, canPlaceBarrier \= true, team areaFreezeUsedThisRound \= false). The map itself remains the same for the duration of a match.

2.4. Turn Structure

The game proceeds in turns.

1. **Player Input & AI Plan Collection Phase:**  
   * Human Player 1 determines the action for their Human Runner via keyboard input.  
   * The Blockly programs for Player 1's AI Allies are evaluated to determine their intended actions for the turn.  
   * (If Hot-Seat) Human Player 2 determines the action for their Human Runner via keyboard input.  
   * (If Hot-Seat) The Blockly programs for Player 2's AI Allies are evaluated.  
   * (If Player vs. NPC) The NPC team's AI logic determines their intended actions.  
   * All these intended actions are collected by the game engine.  
2. **Action Resolution Phase (Sequential & Animated):**  
   * The game engine processes the collected actions one runner at a time.  
   * To introduce an element of unpredictability and visual interest, the order of execution for individual runners within a turn is determined as follows:  
     * One runner from Team 1 is chosen (e.g., randomly, or cycling through Human then Allies).  
     * One runner from Team 2 is chosen (similarly).  
     * These two runners' actions are resolved (including visual animation of movement).  
     * This alternates until all active runners from both teams who planned an action have had their action resolved. The exact order within a team can be randomized each turn.  
   * Movement, action execution, collisions, and status updates are applied immediately as each runner's action is resolved. Visuals (including movement animations) reflect these immediate outcomes.  
3. **End of Turn Phase:**  
   * Check for win/scoring conditions. If a point is scored, proceed to round reset.  
   * Update any turn-based effects (e.g., decrement frozenTurnsRemaining).  
   * The next turn begins.

**2.5. Map**

* **Grid-Based:** The game takes place on a 2D grid of cells.  
* **Predefined Maps:** A selection of 3-5 predefined map layouts will be available. These maps will vary in terms of obstacle placement and path complexity.  
  * Example map dimensions: 12 columns wide by 8 rows high.  
  * Maps will contain open floor cells and impassable wall cells (visualized by color).  
* **No Dynamic Generation:** Maps are static for the duration of a match.  
* **Team Starting Areas/Bases:** Each team has a designated starting "base" area on opposite sides of the map (e.g., Team 1 in columns 0-1, Team 2 in columns mapWidth-2 to mapWidth-1). These areas are where their flag starts and where the enemy flag must be returned to score.  
* **Jails:** Simple designated cells, visually distinct (e.g., outlined), typically in corners.

**2.6. Play Direction (Internal Concept)**

* For simplicity in Blockly, blocks like "Move Forward" will be provided.  
* The game engine will internally manage a playDirection for each team (e.g., Team 1 aims for increasing X, Team 2 for decreasing X, or vice-versa depending on the map layout). "Move Forward" blocks will use this internal playDirection to determine the actual change in X or Y coordinates. This concept will not be directly exposed to beginner students via blocks initially.

## **3\. Game Entities**

3.1. Runners

Represented by emoji characters. Each runner object will have:

* id: Unique identifier.  
* team: (TEAM\_1 or TEAM\_2).  
* x**,** y: Current grid coordinates.  
* isHumanControlled: Boolean.  
* emojiChar: The emoji character representing this runner (e.g., 🏃, 🤖).  
* hasEnemyFlag: Boolean.  
* isFrozen: Boolean.  
* frozenTurnsRemaining: Integer.  
* canJump: Boolean (resets each round).  
* canPlaceBarrier: Boolean (resets each round, or when their placed barrier is removed).

3.2. Flags

Represented by emoji characters (e.g., 🚩, 🏳️).

* Attributes:  
  * team: Which team it belongs to.  
  * x**,** y: Current grid coordinates.  
  * emojiChar: The emoji for the flag.  
  * isAtBase: Boolean.  
  * carriedByRunnerId: ID of the runner carrying it, or null.  
* No flag dancing. Flags only move when carried.

3.3. Barriers

Represented by an emoji character (e.g., 🚧, 🧱).

* Attributes:  
  * x**,** y: Grid coordinates.  
  * ownerRunnerId: ID of the runner who placed it.  
  * emojiChar: The emoji for the barrier.  
* A runner can have only one of their barriers active on the map at a time.  
* If a runner's active barrier is removed, their canPlaceBarrier status becomes true again.

**3.4. Traps**

* Traps are not a feature in this version of Browser Battlegorithms. The "Area Effect Freeze" serves as a primary special action.

## **4\. Runner Actions & Resolution**

Each active (not frozen) runner can perform **one** action per turn.

**4.1. Available Actions**

* **For Human Keyboard Control:**  
  * Move Up (Screen): Move one cell towards the top of the screen.  
  * Move Down (Screen): Move one cell towards the bottom of the screen.  
  * Move Left (Screen): Move one cell towards the left of the screen.  
  * Move Right (Screen): Move one cell towards the right of the screen.  
  * Jump Forward: If canJump is true, move two cells "Forward" (engine determines direction). Consumes canJump.  
  * Place Barrier: If canPlaceBarrier is true, place a barrier in the cell directly "Forward." Consumes canPlaceBarrier until removed.  
  * Stay Still: Runner remains in its current cell. Can remove an adjacent barrier.  
* **For AI Ally Blockly Programs:**  
  * Move Forward  
  * Move Backward  
  * Move Up (screen)  
  * Move Down (screen)  
  * Move Randomly (cardinal)  
  * Move Towards \[Target\] (Dropdown: Enemy Flag, My Base) \- *Introduced in later levels.*  
  * Jump Forward  
  * Place Barrier (in front)  
  * Stay Still  
  * Use Area Freeze (at my location): (AI Ally Only) If team's areaFreezeUsedThisRound is false. Freezes opposing runners in a radius for 1-2 turns. Sets team's areaFreezeUsedThisRound to true.

4.2. Action Resolution (Sequential, Per Runner)

As each runner's action is processed in the alternating sequence described in 2.4:

1. **Special Action Execution (e.g., Area Freeze):**  
   * If Use Area Freeze is planned by an AI Ally and available for the team:  
     * Apply freeze effect to nearby opponents.  
     * Mark areaFreezeUsedThisRound for the team as true.  
     * This runner's turn ends.  
2. **Barrier Placement:**  
   * If Place Barrier is planned and canPlaceBarrier is true:  
     * Determine target cell "Forward."  
     * Validate: Cell must be on map, not a wall, not occupied by another barrier or any runner.  
     * If valid: Place barrier, set runner's canPlaceBarrier to false.  
     * If invalid: Action fails, runner effectively stays still.  
     * This runner's turn ends.  
3. **Stay Still & Barrier Removal:**  
   * If Stay Still is planned:  
     * Check cell "Forward." If it contains a barrier:  
       * Remove the barrier.  
       * Find the original ownerRunnerId of that barrier.  
       * Set that owner's canPlaceBarrier to true.  
     * Runner remains in place. This runner's turn ends.  
4. **Movement Intention Validation & Execution (for** Move **or** Jump**):**  
   * Determine target cell based on the planned move (e.g., Move Forward, Move Towards \[Target\], Jump Forward).  
   * **Basic Validity:**  
     * Is target cell on map?  
     * Is target cell a wall?  
     * Is target cell occupied by a barrier?  
     * If Jump: Is canJump true? (If so, consume canJump now, regardless of move success). Is landing cell valid as per above? (Intermediate cell is ignored for obstacles).  
     * If any of these checks fail, the move fails. The runner "bounces back" (remains in their original cell for this turn). An animation may show the attempt and return. This runner's turn ends.  
   * **Teammate Occupancy Check:**  
     * If the target cell is valid (passed basic checks) BUT is currently occupied by an *active (not frozen) friendly runner*: The move fails. The runner "bounces back" to their original cell. An animation may show the attempt and return. This runner's turn ends.  
     * *Note: This simplified rule prevents adjacent swaps but is easier to visualize and implement.*  
   * **Opponent Occupancy / Collision Flagging:**  
     * If the target cell is valid AND is currently occupied by an *active (not frozen) opposing runner*: The move is provisionally successful (runner moves to the cell). A collision is flagged for immediate resolution (see Section 5).  
   * **Moving to Empty/Frozen Cell:**  
     * If the target cell is valid AND empty, OR occupied by a *frozen* opposing runner: The runner successfully moves to the target cell. Update runner's x,y. Animate the movement. This runner's turn ends.  
5. **Immediate Collision Resolution (if flagged in step 4c):**  
   * If a collision was flagged, resolve it immediately as per Section 5\. Update statuses (isFrozen, frozenTurnsRemaining, flag position if dropped).  
6. **Immediate Flag Pickup (if applicable):**  
   * If a runner (not frozen) successfully ends their move on the same cell as an opponent's flag (and the flag is not carried by another teammate):  
     * Runner's hasEnemyFlag becomes true.  
     * Flag's carriedByRunnerId is set to this runner.  
     * Flag's x,y updates to the carrier's x,y.  
7. **Animation:** All successful movements should be visually animated (e.g., using an easing function over a short duration) before the next runner's action is processed. "Bounce back" animations should also occur for failed moves due to teammate occupancy or invalid targets.

## **5\. Collision Resolution (Simplified & Immediate)**

When an active runner attempts to move into a cell occupied by an active opposing runner (as determined in Action Resolution Step 4c):

1. **Determine Defender:** The team whose side of the map the collision occurs on is the "defender." (e.g., if collision at X \< mapWidth/2, Team 1 is defender; if X \>= mapWidth/2, Team 2 is defender, assuming Team 1 starts left).  
2. **Collision Outcome:**  
   * If one runner isFrozen and the other is not, the frozen runner automatically loses (this check is more for completeness, as frozen runners shouldn't be initiating moves that cause collisions).  
   * If a runner is carrying the enemy flag and is *not* the defender in the collision cell, they automatically lose.  
   * Otherwise, the **defender always wins** the collision.  
3. **Consequences (applied immediately):**  
   * **Loser:**  
     * Becomes isFrozen \= true.  
     * frozenTurnsRemaining is set (e.g., to 2 turns).  
     * If carrying a flag, the flag is immediately returned to its team's starting base location and its carriedByRunnerId is set to null.  
     * The losing **runner moves into the collision cell** and becomes frozen there. Both the winner (who remains in or moves into the collision cell) and the (now frozen) loser will temporarily occupy this same cell. The attacker's attempted move to the cell is considered completed, regardless of whether they won or lost the collision, but if they lost, they arrive in a frozen state.  
   * **Winner:** Remains on the collision cell (their move to it was successful).  
4. **Passing Through Frozen Opponents:** As stated in 4.1.d, active runners can move into and through cells occupied by isFrozen opposing runners. The frozen runner remains in place.

## **6\. Blockly Interface & Blocks**

*(This section (6.1 UI Layout, 6.2 Block Categories & Specific Blocks, 6.3 Blockly Execution Model) remains largely the same as in the previous version of the spec, focusing on the visual programming environment. Ensure block descriptions match the simplified actions in 4.1.)*

**6.2. Block Categories & Specific Blocks (Example Refinements):**

* **Actions:**  
  * Move Forward (engine handles direction)  
  * Move Backward (engine handles direction)  
  * Move Up (on screen)  
  * Move Down (on screen)  
  * Move Randomly (N,S,E,W)  
  * Stay Still (removes barrier if facing)  
  * Jump Forward (engine handles direction)  
  * Place Barrier (in front)  
  * *Later:* Move Towards \[Enemy Flag / My Base\]  
  * *Later (AI Ally Only):* Use Area Freeze (at my location)  
* **Conditions:**  
  * If I have enemy flag  
  * If enemy is in front  
  * If barrier is in front  
  * If I can jump  
  * If I can place barrier  
  * *Later:* If Area Freeze is ready (for my team)  
  * *Later:* Is enemy within \[1/2/3\] steps? (dropdown)  
  * *Later:* Is \[My Runner / Enemy Flag / My Base\] on \[My Side / Enemy Side\] of map?  
  * Die roll (1-6) \> \[1/2/3/4/5\] (dropdown)  
* **Logic:** If-Then, If-Then-Else, AND, OR, NOT.  
* **Sensing (Later/Advanced):** My X, My Y, Enemy Flag X, Enemy Flag Y, My Base X, My Base Y. The playDirection value block is deferred for advanced use.

## **7\. Scaffolded Levels / Challenges (Initial Outline)**

*(This section remains largely the same, but level objectives should align with the simplified mechanics, e.g., Level 5 introduces human control but against a very basic NPC. Level 6 could be hot-seat or vs. a slightly better NPC, focusing on barrier use.)*

* **Pass Conditions:**  
  * Level 1 (Move to Target): Ally's (x,y) matches target (x,y).  
  * Level 2 (Reach Enemy Flag): Ally's (x,y) matches enemy flag's starting (x,y).  
  * Level 3 (Score a Point): Team score increments.  
  * Level 4 (Obstacle Map Score): Team score increments on a map with pre-set barriers.  
  * Level 5 (First Match): Player's team wins a best-of-3 (or single point) match.  
  * Level 6 (Hot-Seat/Advanced NPC): Player's team wins, or specific strategic goals met (e.g., block X enemy advances with barriers).

## **8\. Technical Stack & Deployment**

* **Core Language:** JavaScript (ES6+).  
* **Application Structure:** Modular ES modules with responsibility split across core game rules, entities, AI integration, rendering, and UI wiring.  
* **Rendering & Game Loop:** p5.js library.  
  * **Visuals:** Emoji characters for runners, flags, and barriers, rendered using p5.js text() function. Game grid, background, wall coloring, and jail outlines drawn using p5.js geometric drawing functions.  
  * **Animation:** Movement of runners between cells should be animated using an easing function over a short duration. "Bounce back" animations for failed moves.  
* **Visual Programming:** Blockly library.  
* **UI Structure:** HTML, CSS (Flexbox/Grid).  
* **Build Tooling:** Vite-based local development and production build pipeline.  
* **Deployment:** Static web hosting.  
* **Saving/Loading Student Work:**  
  * V1: Browser Local Storage for current workspace.  
  * V1: "Export AI Program (XML)" and "Import AI Program (XML)" for portability.
* **Testing Strategy:**  
  * Command-line JavaScript tests should validate pure rule behavior such as setup, movement, collisions, scoring, round reset, and NPC action legality.  
  * Browser tests should validate app boot, Blockly visibility, play/reset flow, keyboard interactions, and representative UI/gameplay states.  

## **9\. "Fun Factor" Enhancements (Post-Core Development)**

*(This section remains the same.)*
