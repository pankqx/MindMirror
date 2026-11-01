// Soft sounds for the Play room, made with Web Audio (nothing to download).
// One shared AudioContext, created on the first tap.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

export const buzz = (ms = 10) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* not supported */
  }
};

function noiseBurst(seconds: number, freq: number, gain: number, type: BiquadFilterType = "lowpass") {
  const a = audio();
  if (!a) return;
  const buf = a.createBuffer(1, Math.max(1, Math.floor(a.sampleRate * seconds)), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  const f = a.createBiquadFilter();
  const g = a.createGain();
  src.buffer = buf;
  f.type = type;
  f.frequency.value = freq;
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + seconds);
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

/** Bubble pop (Merel's sound, a little rounder). */
export function pop() {
  noiseBurst(0.05, 900 + Math.random() * 500, 0.18);
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  const t = a.currentTime;
  o.frequency.setValueAtTime(420 + Math.random() * 120, t);
  o.frequency.exponentialRampToValueAtTime(140, t + 0.06);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + 0.1);
}

/** A water drop: a quick falling sine. */
export function drop(pitch = 1) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(1100 * pitch, t);
  o.frequency.exponentialRampToValueAtTime(320 * pitch, t + 0.18);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.1, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.5);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + 0.55);
}

/** Paper going through the shredder. */
export function shred(seconds = 1.4) {
  noiseBurst(seconds, 2400, 0.06, "bandpass");
  noiseBurst(seconds * 0.8, 300, 0.05);
}

/** A soft bell, for "done". */
export function chime(note = 0) {
  const a = audio();
  if (!a) return;
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880];
  const f = PENTA[note % PENTA.length];
  const t = a.currentTime;
  for (const [mul, gain, dur] of [[1, 0.12, 2.2], [2, 0.03, 1.2]] as const) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.frequency.value = f * mul;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur);
  }
}
