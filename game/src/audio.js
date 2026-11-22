// audio.js — every sound is synthesized with WebAudio, no audio files.
// A soft pluck for a pickup, a low two-tone warning as the alarm climbs,
// a short siren sting when the thief is caught, and a bright arpeggio for
// the getaway. Nothing plays until the first key press or click, so the
// browser's autoplay rules are never in the way.
let ctx = null;
let muted = false;

export function unlockAudio() {
  if (ctx) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioContext();
  } catch {
    ctx = null;
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, seconds, type, gain, when = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.05);
}

export const sfx = {
  pickup() { tone(660, 0.12, 'triangle', 0.18); tone(990, 0.18, 'triangle', 0.14, 0.08); },
  coin() { tone(1200, 0.07, 'square', 0.08); },
  smoke() { tone(180, 0.3, 'sine', 0.12); tone(120, 0.35, 'sine', 0.1, 0.05); },
  emp() { tone(880, 0.1, 'sawtooth', 0.08); tone(440, 0.2, 'sawtooth', 0.08, 0.09); },
  lockpick() { tone(520, 0.05, 'square', 0.06); },
  warn() { tone(220, 0.16, 'sawtooth', 0.1); tone(174, 0.2, 'sawtooth', 0.1, 0.16); },
  caught() { tone(392, 0.22, 'sawtooth', 0.16); tone(311, 0.22, 'sawtooth', 0.16, 0.2); tone(233, 0.4, 'sawtooth', 0.16, 0.4); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.11)); },
  step() { tone(90, 0.04, 'sine', 0.03); },
};
