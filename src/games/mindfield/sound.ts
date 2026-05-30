"use client";

// Synthesized SFX via WebAudio — no asset shipping. Lazy-init the context so
// browsers that block audio before a gesture don't throw on import.

let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
  }
  // Some browsers suspend the context until a user gesture — resume opportunistically.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

interface ToneOpts {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  slide?: number;
  delay?: number;
}

function tone(opts: ToneOpts) {
  if (muted) return;
  const a = ac(); if (!a) return;
  const t = a.currentTime + (opts.delay ?? 0);
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, t);
  if (opts.slide) osc.frequency.exponentialRampToValueAtTime(opts.slide, t + opts.dur);
  const peak = opts.gain ?? 0.12;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + (opts.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + opts.dur + 0.02);
}

function chord(freqs: number[], dur: number, opts: Partial<ToneOpts> = {}) {
  freqs.forEach((f, i) => tone({ freq: f, dur, gain: 0.07, type: "triangle", delay: i * 0.06, ...opts }));
}

function noiseBurst(dur: number, gain = 0.25) {
  if (muted) return;
  const a = ac(); if (!a) return;
  const t = a.currentTime;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = a.createBufferSource();
  src.buffer = buf;
  const g = a.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  // Lowpass for thud-ier feel
  const lp = a.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 800;
  src.connect(lp).connect(g).connect(a.destination);
  src.start(t);
}

export const sfx = {
  flag()    { tone({ freq: 880, dur: 0.07, type: "triangle", gain: 0.08 }); },
  unflag()  { tone({ freq: 520, dur: 0.06, type: "triangle", gain: 0.06 }); },
  holdTick(){ tone({ freq: 1400, dur: 0.03, type: "square", gain: 0.025 }); },
  cancel()  { tone({ freq: 300, dur: 0.08, type: "sawtooth", gain: 0.05, slide: 180 }); },
  flip()    { tone({ freq: 1100, dur: 0.05, type: "square", gain: 0.04 }); },
  revealOwn()      { chord([523.25, 659.25, 783.99], 0.28); },          // C–E–G ascending
  revealOpponent() { chord([392, 311.13], 0.25, { type: "sine", gain: 0.08 }); }, // G–Eb descending
  revealNeutral()  { tone({ freq: 392, dur: 0.18, type: "sine", gain: 0.07 }); },
  bomb() {
    if (muted) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime;
    // Sub-bass thud
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.6);
    g.gain.setValueAtTime(0.45, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(g).connect(a.destination);
    osc.start(t); osc.stop(t + 0.75);
    noiseBurst(0.45, 0.35);
  },
  roundWin() { chord([523.25, 659.25, 783.99, 1046.5], 0.5, { gain: 0.09 }); },
};

export function haptic(pattern: number | number[]) {
  if (typeof window === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate === "function") { try { nav.vibrate(pattern); } catch { /* ignore */ } }
}

export function setMuted(v: boolean) { muted = v; }
export function isMuted() { return muted; }
