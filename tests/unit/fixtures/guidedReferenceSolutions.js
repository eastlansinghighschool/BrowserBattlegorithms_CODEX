function buildSolutionXml(innerBlockXml) {
  return `
    <xml xmlns="https://developers.google.com/blockly/xml">
      <block type="battlegorithms_on_each_turn" x="24" y="24">
        <next>
          ${innerBlockXml}
        </next>
      </block>
    </xml>
  `;
}

export { buildSolutionXml };

export const GUIDED_LEVEL_REFERENCE_SOLUTIONS = {
  "move-to-target": buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`),
  "reach-enemy-flag": buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`),
  "score-a-point": buildSolutionXml(`
    <block type="battlegorithms_if_have_enemy_flag_else">
      <statement name="DO">
        <block type="battlegorithms_move_backward"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "barrier-detour": buildSolutionXml(`
    <block type="battlegorithms_if_barrier_in_front_else">
      <statement name="DO">
        <block type="battlegorithms_move_down_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "mirror-forward": buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`),
  "sensor-barrier-branch": buildSolutionXml(`
    <block type="battlegorithms_if_sensor_matches_else">
      <field name="OBJECT">BARRIER</field>
      <field name="RELATION">DIRECTLY_IN_FRONT</field>
      <statement name="DO">
        <block type="battlegorithms_move_down_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "watch-the-wall": buildSolutionXml(`
    <block type="battlegorithms_if_sensor_matches_else">
      <field name="OBJECT">EDGE_OR_WALL</field>
      <field name="RELATION">DIRECTLY_IN_FRONT</field>
      <statement name="DO">
        <block type="battlegorithms_move_down_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "find-the-human": buildSolutionXml(`
    <block type="battlegorithms_if_sensor_matches_else">
      <field name="OBJECT">HUMAN_RUNNER</field>
      <field name="RELATION">ANYWHERE_ABOVE</field>
      <statement name="DO">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_if_sensor_matches_else">
          <field name="OBJECT">HUMAN_RUNNER</field>
          <field name="RELATION">ANYWHERE_FORWARD</field>
          <statement name="DO">
            <block type="battlegorithms_move_forward"></block>
          </statement>
          <statement name="ELSE">
            <block type="battlegorithms_move_down_screen"></block>
          </statement>
        </block>
      </statement>
    </block>
  `),
  "find-the-enemy-flag": buildSolutionXml(`
    <block type="battlegorithms_if_sensor_matches_else">
      <field name="OBJECT">ENEMY_FLAG</field>
      <field name="RELATION">ANYWHERE_ABOVE</field>
      <statement name="DO">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "move-toward-flag": buildSolutionXml(`
    <block type="battlegorithms_move_toward">
      <field name="TARGET">ENEMY_FLAG</field>
    </block>
  `),
  "bring-it-home": buildSolutionXml(`
    <block type="battlegorithms_if_have_enemy_flag_else">
      <statement name="DO">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">MY_BASE</field>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">ENEMY_FLAG</field>
        </block>
      </statement>
    </block>
  `),
  "enemy-nearby": buildSolutionXml(`
    <block type="battlegorithms_if_sensor_matches_else">
      <field name="OBJECT">ENEMY_RUNNER</field>
      <field name="RELATION">WITHIN_2</field>
      <statement name="DO">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "jump-the-gap": buildSolutionXml(`
    <block type="battlegorithms_jump_forward"></block>
  `),
  "jump-if-ready": buildSolutionXml(`
    <block type="battlegorithms_if_can_jump_else">
      <statement name="DO">
        <block type="battlegorithms_jump_forward"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "build-the-barrier": buildSolutionXml(`<block type="battlegorithms_place_barrier"></block>`),
  "stay-still-can-do-something": buildSolutionXml(`
    <block type="battlegorithms_if_sensor_matches_else">
      <field name="OBJECT">BARRIER</field>
      <field name="RELATION">DIRECTLY_IN_FRONT</field>
      <statement name="DO">
        <block type="battlegorithms_stay_still"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "relay-race": buildSolutionXml(`
    <block type="battlegorithms_if_teammate_has_flag_else">
      <statement name="DO">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">HUMAN_RUNNER</field>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "my-side-their-side": buildSolutionXml(`
    <block type="battlegorithms_if_on_my_side_else">
      <statement name="DO">
        <block type="battlegorithms_move_forward"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
    </block>
  `),
  "freeze-the-lane": buildSolutionXml(`
    <block type="battlegorithms_if_area_freeze_ready_else">
      <statement name="DO">
        <block type="battlegorithms_freeze_opponents"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">ENEMY_FLAG</field>
        </block>
      </statement>
    </block>
  `),
  "closest-threat": buildSolutionXml(`
    <block type="battlegorithms_move_toward">
      <field name="TARGET">CLOSEST_ENEMY</field>
    </block>
  `),
  "how-far-away": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_distance_to_target">
              <field name="TARGET">CLOSEST_ENEMY</field>
            </block>
          </value>
          <field name="OPERATOR">LTE</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">2</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "two-conditions-at-once": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_logic_and">
          <value name="LEFT">
            <block type="battlegorithms_value_compare">
              <value name="LEFT">
                <block type="battlegorithms_value_distance_to_target">
                  <field name="TARGET">CLOSEST_ENEMY</field>
                </block>
              </value>
              <field name="OPERATOR">LTE</field>
              <value name="RIGHT">
                <block type="battlegorithms_value_number">
                  <field name="VALUE">2</field>
                </block>
              </value>
            </block>
          </value>
          <value name="RIGHT">
            <block type="battlegorithms_boolean_area_freeze_ready"></block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_freeze_opponents"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">ENEMY_FLAG</field>
        </block>
      </statement>
    </block>
  `),
  "this-or-that": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_logic_or">
          <value name="LEFT">
            <block type="battlegorithms_boolean_on_enemy_side"></block>
          </value>
          <value name="RIGHT">
            <block type="battlegorithms_boolean_sensor_matches">
              <field name="OBJECT">ENEMY_RUNNER</field>
              <field name="RELATION">WITHIN_2</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "flip-the-answer": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_logic_not">
          <value name="VALUE">
            <block type="battlegorithms_boolean_on_my_side"></block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "enemy-side-decision-making": buildSolutionXml(`
    <block type="battlegorithms_if_on_enemy_side_else">
      <statement name="DO">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "one-program-two-allies": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">0</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">ENEMY_FLAG</field>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_stay_still"></block>
      </statement>
    </block>
  `),
  "index-jobs": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">0</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">ENEMY_FLAG</field>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
    </block>
  `),
  "first-two-defend": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">LT</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">2</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_up_screen"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "escort-the-carrier": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_boolean_teammate_has_flag"></block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_if_boolean_else">
          <value name="BOOL">
            <block type="battlegorithms_value_compare">
              <value name="LEFT">
                <block type="battlegorithms_value_runner_index"></block>
              </value>
              <field name="OPERATOR">EQ</field>
              <value name="RIGHT">
                <block type="battlegorithms_value_number">
                  <field name="VALUE">0</field>
                </block>
              </value>
            </block>
          </value>
          <statement name="DO">
            <block type="battlegorithms_move_toward">
              <field name="TARGET">MY_BASE</field>
            </block>
          </statement>
          <statement name="ELSE">
            <block type="battlegorithms_move_forward"></block>
          </statement>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_stay_still"></block>
      </statement>
    </block>
  `),
  "closest-enemy-defender": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">0</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">ENEMY_FLAG</field>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">CLOSEST_ENEMY</field>
        </block>
      </statement>
    </block>
  `),
  "freeze-support": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">1</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_freeze_opponents"></block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_toward">
          <field name="TARGET">ENEMY_FLAG</field>
        </block>
      </statement>
    </block>
  `),
  "barrier-specialist": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">1</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_if_can_place_barrier_else">
          <statement name="DO">
            <block type="battlegorithms_place_barrier"></block>
          </statement>
          <statement name="ELSE">
            <block type="battlegorithms_stay_still"></block>
          </statement>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_forward"></block>
      </statement>
    </block>
  `),
  "jump-team": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">0</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_if_can_jump_else">
          <statement name="DO">
            <block type="battlegorithms_jump_forward"></block>
          </statement>
          <statement name="ELSE">
            <block type="battlegorithms_move_forward"></block>
          </statement>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_move_down_screen"></block>
      </statement>
    </block>
  `),
  "advanced-scrimmage": buildSolutionXml(`
    <block type="battlegorithms_if_boolean_else">
      <value name="BOOL">
        <block type="battlegorithms_value_compare">
          <value name="LEFT">
            <block type="battlegorithms_value_runner_index"></block>
          </value>
          <field name="OPERATOR">EQ</field>
          <value name="RIGHT">
            <block type="battlegorithms_value_number">
              <field name="VALUE">0</field>
            </block>
          </value>
        </block>
      </value>
      <statement name="DO">
        <block type="battlegorithms_if_boolean_else">
          <value name="BOOL">
            <block type="battlegorithms_boolean_have_enemy_flag"></block>
          </value>
          <statement name="DO">
            <block type="battlegorithms_move_toward">
              <field name="TARGET">MY_BASE</field>
            </block>
          </statement>
          <statement name="ELSE">
            <block type="battlegorithms_move_toward">
              <field name="TARGET">ENEMY_FLAG</field>
            </block>
          </statement>
        </block>
      </statement>
      <statement name="ELSE">
        <block type="battlegorithms_if_boolean_else">
          <value name="BOOL">
            <block type="battlegorithms_value_compare">
              <value name="LEFT">
                <block type="battlegorithms_value_runner_index"></block>
              </value>
              <field name="OPERATOR">EQ</field>
              <value name="RIGHT">
                <block type="battlegorithms_value_number">
                  <field name="VALUE">1</field>
                </block>
              </value>
            </block>
          </value>
          <statement name="DO">
            <block type="battlegorithms_move_toward">
              <field name="TARGET">CLOSEST_ENEMY</field>
            </block>
          </statement>
          <statement name="ELSE">
            <block type="battlegorithms_stay_still"></block>
          </statement>
        </block>
      </statement>
    </block>
  `),
  "optional-random-lab": buildSolutionXml(`
    <block type="battlegorithms_move_randomly"></block>
  `)
};
