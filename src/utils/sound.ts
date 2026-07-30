import { useUiStore } from "../store/useUiStore";

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  return ctx;
}

function tone(
  freq: number,
  durationMs: number,
  type: OscillatorType = "sine",
  peakGain = 0.05
) {
  const audioCtx = getContext();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(peakGain, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + durationMs / 1000);
}

function playIfEnabled(fn: () => void) {
  if (!useUiStore.getState().soundEnabled) return;
  try {
    fn();
  } catch {

  }
}

export const sound = {

  click: () => playIfEnabled(() => tone(720, 45, "square", 0.02)),

  success: () =>
    playIfEnabled(() => {
      tone(660, 90, "sine", 0.05);
      setTimeout(() => tone(880, 120, "sine", 0.05), 90);
    }),

  error: () => playIfEnabled(() => tone(160, 220, "sawtooth", 0.04)),

  levelUp: () =>
    playIfEnabled(() => {
      tone(523, 90, "square", 0.05);
      setTimeout(() => tone(659, 90, "square", 0.05), 90);
      setTimeout(() => tone(784, 160, "square", 0.05), 180);
    }),
};
