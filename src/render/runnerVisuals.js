import {
  MIRROR_RUNNER_EMOJI_WITH_TRANSFORM,
  RUNNER_EMOJI_BY_ROLE
} from "../config/constants.js";

export function resolveRunnerDisplayEmoji(runner) {
  const directionKey = runner.playDirection === -1 ? -1 : 1;
  const stateKey = runner.isFrozen ? "frozen" : "active";
  return RUNNER_EMOJI_BY_ROLE[runner.runnerRole]?.[stateKey]?.[directionKey] || "?";
}

export function shouldMirrorRunnerEmoji(runner) {
  return MIRROR_RUNNER_EMOJI_WITH_TRANSFORM && runner.playDirection === 1;
}
