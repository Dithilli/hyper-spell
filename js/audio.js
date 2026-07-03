// audio.js — Web Audio synth SFX, no assets
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function blip({ type = 'sine', freq = 440, freqEnd, dur = 0.1, vol = 0.2, delay = 0 }) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function boom({ dur = 0.35, from = 900, to = 120, vol = 0.5, highpass = false, delay = 0 } = {}) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + delay;
  const len = Math.ceil(audioCtx.sampleRate * dur);
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const filt = audioCtx.createBiquadFilter();
  filt.type = highpass ? 'highpass' : 'lowpass';
  filt.frequency.setValueAtTime(from, t0);
  filt.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t0 + dur);
  const g = audioCtx.createGain();
  g.gain.value = vol;
  src.connect(filt).connect(g).connect(audioCtx.destination);
  src.start(t0);
}

const sfx = {
  jump: () => blip({ type: 'square', freq: 250, freqEnd: 480, dur: 0.09, vol: 0.1 }),
  cast: () => blip({ type: 'sawtooth', freq: 600, freqEnd: 180, dur: 0.15, vol: 0.13 }),
  explosion: () => { boom({ dur: 0.35, from: 900, to: 120, vol: 0.45 }); blip({ type: 'sine', freq: 80, freqEnd: 40, dur: 0.3, vol: 0.35 }); },
  lightning: () => boom({ dur: 0.2, from: 1500, to: 6000, vol: 0.35, highpass: true }),
  death: () => blip({ type: 'sawtooth', freq: 300, freqEnd: 60, dur: 0.4, vol: 0.22 }),
  pickup: () => { blip({ freq: 660, dur: 0.08, vol: 0.14 }); blip({ freq: 990, dur: 0.1, vol: 0.14, delay: 0.08 }); },
  blackhole: () => blip({ type: 'sine', freq: 220, freqEnd: 28, dur: 1.2, vol: 0.28 }),
  freeze: () => blip({ type: 'triangle', freq: 1200, freqEnd: 400, dur: 0.2, vol: 0.14 }),
  fight: () => blip({ type: 'square', freq: 392, freqEnd: 784, dur: 0.15, vol: 0.2 }),
  boing: () => blip({ type: 'sine', freq: 150, freqEnd: 900, dur: 0.22, vol: 0.18 }),
  clang: () => { boom({ dur: 0.15, from: 3000, to: 400, vol: 0.3 }); blip({ type: 'square', freq: 880, freqEnd: 440, dur: 0.2, vol: 0.12 }); },
  squeak: () => blip({ type: 'sine', freq: 1200, freqEnd: 1800, dur: 0.12, vol: 0.15 }),
  oink: () => { blip({ type: 'sawtooth', freq: 220, freqEnd: 380, dur: 0.09, vol: 0.15 }); blip({ type: 'sawtooth', freq: 380, freqEnd: 180, dur: 0.11, vol: 0.15, delay: 0.09 }); },
  hyper: () => { [392, 523, 659, 784, 1047].forEach((f, i) => blip({ type: 'square', freq: f, dur: 0.1, vol: 0.16, delay: i * 0.05 })); boom({ dur: 0.4, from: 200, to: 2500, vol: 0.3, highpass: true }); },
  event: () => { blip({ type: 'triangle', freq: 330, freqEnd: 660, dur: 0.18, vol: 0.2 }); blip({ type: 'triangle', freq: 660, freqEnd: 495, dur: 0.24, vol: 0.18, delay: 0.16 }); },
  roundWin: () => [523, 659, 784].forEach((f, i) => blip({ freq: f, dur: 0.18, vol: 0.18, delay: i * 0.12 })),
  victory: () => [523, 659, 784, 1047, 1319].forEach((f, i) => blip({ freq: f, dur: 0.25, vol: 0.2, delay: i * 0.15 })),
};
