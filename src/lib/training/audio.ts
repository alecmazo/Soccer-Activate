let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

export async function unlockAudio() {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === "suspended") await audio.resume();
}

function tone(freq: number, duration: number, gain = 0.08, type: OscillatorType = "sine") {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.value = gain;
  amp.gain.setValueAtTime(gain, audio.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

export function beepWork() {
  tone(880, 0.16, 0.09, "triangle");
}

export function beepRest() {
  tone(392, 0.18, 0.07, "sine");
}

export function beepCount() {
  tone(660, 0.09, 0.06, "square");
}

export function beepDone() {
  tone(523, 0.12, 0.08, "triangle");
  window.setTimeout(() => tone(784, 0.18, 0.08, "triangle"), 120);
}

export function tickMetronome() {
  tone(920, 0.04, 0.05, "square");
}

export function pulseVibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
