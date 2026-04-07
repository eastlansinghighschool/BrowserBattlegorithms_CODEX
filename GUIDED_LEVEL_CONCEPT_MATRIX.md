# Guided Level Concept Matrix

This matrix tracks what each guided level introduces so the tutorial copy can avoid assuming ideas too early.

| Level | Focus | New vocabulary / board idea | New Blockly idea | Assumes |
| --- | --- | --- | --- | --- |
| 1 | Move to target | ally runner, enemy runner, target, frozen | `On Each Turn` + one move | none |
| 2 | Reach enemy flag | flag, enemy side | same movement blocks in a new goal | Level 1 board vocabulary |
| 3 | Score a point | bring flag home, score | flag possession condition | Levels 1-2 |
| 4 | Barrier detour | barrier as obstacle | simple conditional branch | Levels 1-3 |
| 5 | Forward works both ways | relative forward / play direction | same block, different orientation | Levels 1-4 |
| 6 | Barrier sensor branch | generic sensor family | sensor object + relation | Level 4 barrier idea |
| 7 | Watch the wall | edge / wall | generic sensor reused on terrain | Level 6 sensor shape |
| 8 | Find the human | support square near teammate | directional sensing | Levels 6-7 |
| 9 | Find the enemy flag | sensing can point at goals | same sensor on a new target | Level 8 |
| 10 | Human runner practice | keyboard control, special actions | no new Blockly concept | beginner controls |
| 11 | Move Toward flag | helper target | `Move Toward enemy flag` | Levels 1-9 |
| 12 | Bring it home | helper target swap | helper + flag condition | Levels 3 and 11 |
| 13 | Enemy nearby | distance in spaces | distance-based sensing | generic sensor idea |
| 14 | Jump the gap | jump lane / landing | `Jump Forward` | movement basics |
| 15 | Jump if ready | one-time jump resource | jump readiness condition | Level 14 |
| 16 | Build the barrier | barrier placement target | place barrier + readiness | Level 4 barrier idea |
| 17 | Stay still can do something | clearing a barrier | `Stay Still` as an action | barrier sensing |
| 18 | Relay race | teammate carrier support | teammate-has-flag | scoring + helper targets |
| 19 | My side, their side | field halves | territory conditions | board orientation |
| 20 | Freeze the lane | team freeze power | freeze readiness + helper return | prior resources |
| 21 | Closest threat | intercepting an enemy | `Move Toward closest enemy` | helper target idea |
| 22 | How far away? | distance as value | numeric compare | Level 13 distance idea |
| 23 | Two conditions at once | two truths required | `AND` | advanced value blocks |
| 24 | This or that | either warning matters | `OR` | advanced value blocks |
| 25 | Flip the answer | opposite condition | `NOT` | advanced value blocks |
| 26 | Enemy-side decision making | explicit enemy-side check | named territory condition in advanced track | Level 19 |
| 27 | One program, two allies | shared program for allies | runner index | advanced value blocks |
| 28 | Index jobs | different ally roles | index comparison | Level 27 |
| 29 | First two defend | grouping allies by range | index `< 2` | Levels 27-28 |
| 30 | Escort the carrier | one ally starts with flag | teammate-has-flag + index | Levels 18, 27-29 |
| 31 | Closest enemy defender | split attack/defense jobs | index + closest enemy | Levels 21, 27-30 |
| 32 | Freeze support | shared team resource by role | index + freeze readiness | Levels 20, 27-31 |
| 33 | Barrier specialist | support wall for teammate | index + barrier readiness | Levels 16, 27-32 |
| 34 | Jump team | role-based jump route | index + jump resource | Levels 14-15, 27-33 |
| 35 | Advanced scrimmage | live team scrimmage | combined capstone | Levels 21-34 |
| Optional lab | Move randomly | randomness in action choice | `Move Randomly` | movement basics |

## Copy Guidelines

- Introduce the board object before naming its state or behavior.
- Use overlays to name the new thing or twist, not to restate the whole lesson card.
- Keep puzzle-facing text descriptive rather than prescriptive; move exact code patterns into optional hints or demos.
- Use demo Blockly only when introducing a reusable pattern, not when the demo is the whole solution.
