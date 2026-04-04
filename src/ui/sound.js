const SOUND_PREF_KEY = "bba:sound-enabled";

let audioContext = null;

function getAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }
  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioContext = Ctx ? new Ctx() : null;
  }
  return audioContext;
}

function tone(frequency, durationMs, volume = 0.03, type = "sine") {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = volume;
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  const now = ctx.currentTime;
  oscillator.start(now);
  gainNode.gain.setValueAtTime(volume, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  oscillator.stop(now + durationMs / 1000);
}

export function initializeSoundState(state) {
  let enabled = true;
  if (typeof window !== "undefined" && window.localStorage) {
    const stored = window.localStorage.getItem(SOUND_PREF_KEY);
    enabled = stored === null ? true : stored === "true";
  }
  state.soundEnabled = enabled;
}

export function setSoundEnabled(state, enabled) {
  state.soundEnabled = Boolean(enabled);
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(SOUND_PREF_KEY, `${state.soundEnabled}`);
  }
}

export function playSound(state, soundId) {
  if (!state?.soundEnabled) {
    return;
  }
  switch (soundId) {
    case "freeze":
      tone(260, 140, 0.035, "triangle");
      tone(190, 180, 0.02, "sine");
      break;
    case "flag-pickup":
      tone(440, 90, 0.03, "square");
      tone(554, 110, 0.025, "square");
      break;
    case "score":
      tone(523, 120, 0.04, "triangle");
      tone(659, 160, 0.035, "triangle");
      break;
    case "level-pass":
      tone(659, 120, 0.04, "triangle");
      tone(784, 180, 0.035, "triangle");
      break;
    case "level-fail":
      tone(220, 220, 0.04, "sawtooth");
      break;
    default:
      break;
  }
}
