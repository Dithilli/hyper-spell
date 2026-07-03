// audio.js — Web Audio synth SFX, no assets.
// Layered voices (sub thump + noise body + crackle), a master compressor so
// 8 wizards casting at once glues instead of clipping, a soft echo send for
// the magical sounds, and ±4% pitch variation so repeats don't machine-gun.
let audioCtx = null;
let master = null, echo = null, noiseBuf = null;

function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();

    // master bus: gain -> compressor -> speakers
    master = audioCtx.createGain();
    master.gain.value = 0.9;
    const comp = audioCtx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 12;
    comp.ratio.value = 5;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;
    master.connect(comp).connect(audioCtx.destination);

    // echo send: short lowpassed feedback delay for the "magic" sounds
    echo = audioCtx.createGain();
    echo.gain.value = 0.9;
    const dly = audioCtx.createDelay(1);
    dly.delayTime.value = 0.16;
    const fb = audioCtx.createGain();
    fb.gain.value = 0.3;
    const damp = audioCtx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 2200;
    echo.connect(dly);
    dly.connect(damp).connect(fb).connect(dly);
    dly.connect(master);

    // 2s of cached white noise, sliced at random offsets per play
    const len = audioCtx.sampleRate * 2;
    noiseBuf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

const vary = (f, pct = 0.04) => f * (1 + (Math.random() * 2 - 1) * pct);

// ---- voice management: with 8 wizards the mix drowns without discipline.
// Each sfx key has a minimum gap (identical sounds inside it are skipped) and a
// pile-up window: extra plays inside the window come in progressively quieter.
let volScale = 1;
const _plays = {};
const GATES = {
  jump:      { gap: 55, window: 320, free: 2, duck: 0.45 },
  cast:      { gap: 40, window: 350, free: 3, duck: 0.55 },
  explosion: { gap: 60, window: 450, free: 2, duck: 0.5 },
  lightning: { gap: 70, window: 400, free: 2, duck: 0.5 },
  thud:      { gap: 60, window: 400, free: 2, duck: 0.5 },
  squeak:    { gap: 60, window: 400, free: 2, duck: 0.5 },
  pickup:    { gap: 50, window: 400, free: 3, duck: 0.6 },
  default:   { gap: 30, window: 400, free: 4, duck: 0.7 },
};
function gateScale(key) {
  const g = GATES[key] || GATES.default;
  const now = performance.now();
  const arr = _plays[key] ??= [];
  while (arr.length && now - arr[0] > g.window) arr.shift();
  if (arr.length && now - arr[arr.length - 1] < g.gap) return 0; // too tight — skip
  arr.push(now);
  const over = arr.length - g.free;
  return over > 0 ? Math.pow(g.duck, over) : 1;
}

function voiceOut(g, { pan = 0, send = 0 }) {
  let node = g;
  if (pan && audioCtx.createStereoPanner) {
    const p = audioCtx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan + (Math.random() - 0.5) * 0.2));
    g.connect(p);
    node = p;
  }
  node.connect(master);
  if (send > 0) {
    const s = audioCtx.createGain();
    s.gain.value = send;
    node.connect(s).connect(echo);
  }
}

// oscillator voice with click-free envelope; detune adds a thick second osc
function tone({ type = 'sine', freq = 440, freqEnd, dur = 0.1, vol = 0.2, delay = 0,
                attack = 0.005, detuneCents = 0, curve = 'exp', pan = 0, send = 0 }) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + delay;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol * volScale, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  voiceOut(g, { pan, send });
  const oscs = detuneCents ? [-detuneCents, detuneCents] : [0];
  for (const dt of oscs) {
    const osc = audioCtx.createOscillator();
    osc.type = type;
    osc.detune.value = dt;
    osc.frequency.setValueAtTime(Math.max(freq, 1), t0);
    if (freqEnd) {
      if (curve === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + dur);
      else osc.frequency.linearRampToValueAtTime(Math.max(freqEnd, 1), t0 + dur);
    }
    const og = audioCtx.createGain();
    og.gain.value = 1 / oscs.length;
    osc.connect(og).connect(g);
    osc.start(t0);
    osc.stop(t0 + dur + 0.06);
  }
}

// filtered noise voice — the body of every impact, whoosh and crackle
function noise({ dur = 0.3, vol = 0.3, delay = 0, type = 'lowpass', from = 1000, to,
                 q = 0.8, attack = 0.004, pan = 0, send = 0 }) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + delay;
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  src.loopStart = 0;
  src.loopEnd = 2;
  const filt = audioCtx.createBiquadFilter();
  filt.type = type;
  filt.Q.value = q;
  filt.frequency.setValueAtTime(Math.max(from, 10), t0);
  if (to) filt.frequency.exponentialRampToValueAtTime(Math.max(to, 10), t0 + dur);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol * volScale, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filt).connect(g);
  voiceOut(g, { pan, send });
  const off = Math.random() * 1.5;
  src.start(t0, off);
  src.stop(t0 + dur + 0.06);
}

// legacy helpers (a few callers use these directly) on the new engine
function blip(o) { tone(o); }
function boom({ dur = 0.35, from = 900, to = 120, vol = 0.5, highpass = false, delay = 0 } = {}) {
  noise({ dur, from, to, vol, delay, type: highpass ? 'highpass' : 'lowpass' });
}

const SFX_DEFS = {
  jump: () => {
    tone({ type: 'sine', freq: vary(190), freqEnd: 330, dur: 0.09, vol: 0.09 });
    noise({ dur: 0.07, from: 600, to: 1400, type: 'bandpass', vol: 0.05, q: 1.2 });
  },
  cast: () => {
    noise({ dur: 0.16, from: vary(500), to: 2600, type: 'bandpass', vol: 0.14, q: 1.6 }); // whoosh
    tone({ type: 'triangle', freq: vary(880), freqEnd: 1500, dur: 0.1, vol: 0.05, delay: 0.03, send: 0.3 });
  },
  explosion: () => {
    tone({ type: 'sine', freq: vary(95), freqEnd: 30, dur: 0.5, vol: 0.5 });               // sub thump
    noise({ dur: 0.45, from: vary(1400), to: 70, vol: 0.42 });                              // body
    noise({ dur: 0.1, from: 4200, to: 900, type: 'highpass', vol: 0.16, delay: 0.005 });    // crack
  },
  lightning: () => {
    noise({ dur: 0.05, from: 5200, type: 'highpass', vol: 0.42, attack: 0.001 });           // snap
    noise({ dur: 0.28, from: 2600, to: 420, type: 'bandpass', vol: 0.2, q: 1.1 });          // crackle tail
    tone({ type: 'sine', freq: 120, freqEnd: 55, dur: 0.18, vol: 0.18 });                   // thunder knock
  },
  death: () => {
    tone({ type: 'sawtooth', freq: vary(290), freqEnd: 52, dur: 0.45, vol: 0.18, detuneCents: 12 });
    noise({ dur: 0.3, from: 900, to: 90, vol: 0.2, delay: 0.04 });
    tone({ type: 'sine', freq: 75, freqEnd: 34, dur: 0.35, vol: 0.24, delay: 0.02 });
  },
  pickup: () => {
    tone({ type: 'triangle', freq: 660, dur: 0.09, vol: 0.13, send: 0.25 });
    tone({ type: 'triangle', freq: 990, dur: 0.12, vol: 0.13, delay: 0.07, send: 0.25 });
    tone({ type: 'sine', freq: 1980, dur: 0.1, vol: 0.04, delay: 0.1, send: 0.4 });         // sparkle
  },
  blackhole: () => {
    tone({ type: 'sine', freq: 220, freqEnd: 26, dur: 1.2, vol: 0.26, detuneCents: 9 });
    noise({ dur: 1.1, from: 300, to: 45, vol: 0.14, send: 0.3 });
  },
  freeze: () => {
    tone({ type: 'triangle', freq: vary(1400), freqEnd: 480, dur: 0.22, vol: 0.12, send: 0.35 });
    noise({ dur: 0.3, from: 5000, to: 2400, type: 'highpass', vol: 0.06 });                 // frost hiss
    tone({ type: 'sine', freq: 2093, dur: 0.12, vol: 0.05, delay: 0.05, send: 0.5 });       // ice bell
  },
  fight: () => {
    tone({ type: 'square', freq: 392, freqEnd: 784, dur: 0.14, vol: 0.17, detuneCents: 8 });
    noise({ dur: 0.09, from: 1800, to: 500, type: 'bandpass', vol: 0.12, q: 1 });           // snare hit
  },
  boing: () => {
    tone({ type: 'sine', freq: vary(140), freqEnd: 900, dur: 0.2, vol: 0.17, curve: 'exp' });
    tone({ type: 'sine', freq: 900, freqEnd: 620, dur: 0.1, vol: 0.08, delay: 0.18 });      // wobble back
  },
  clang: () => {
    tone({ type: 'square', freq: vary(880), dur: 0.2, vol: 0.1, attack: 0.001 });           // two inharmonic
    tone({ type: 'square', freq: vary(1244), dur: 0.13, vol: 0.07, attack: 0.001 });        // partials = metal
    noise({ dur: 0.08, from: 4500, to: 1500, type: 'highpass', vol: 0.14, attack: 0.001 });
  },
  squeak: () => {
    tone({ type: 'sine', freq: vary(1200), freqEnd: 1900, dur: 0.11, vol: 0.14 });
    tone({ type: 'sine', freq: 1700, freqEnd: 2100, dur: 0.07, vol: 0.07, delay: 0.09 });
  },
  oink: () => {
    tone({ type: 'sawtooth', freq: vary(220), freqEnd: 380, dur: 0.09, vol: 0.15 });
    tone({ type: 'sawtooth', freq: 380, freqEnd: 170, dur: 0.12, vol: 0.15, delay: 0.09 });
    noise({ dur: 0.1, from: 700, to: 350, type: 'bandpass', vol: 0.07, q: 2, delay: 0.05 }); // snort
  },
  hyper: () => {
    [392, 523, 659, 784, 1047].forEach((f, i) =>
      tone({ type: 'square', freq: f, dur: 0.11, vol: 0.13, delay: i * 0.05, detuneCents: 7, send: 0.35 }));
    noise({ dur: 0.4, from: 250, to: 3200, type: 'bandpass', vol: 0.16, q: 1.4 });          // riser
    tone({ type: 'sine', freq: 98, freqEnd: 45, dur: 0.35, vol: 0.3, delay: 0.25 });        // landing thump
  },
  event: () => {
    tone({ type: 'triangle', freq: 330, freqEnd: 660, dur: 0.2, vol: 0.18, detuneCents: 10, send: 0.5 });
    tone({ type: 'triangle', freq: 660, freqEnd: 495, dur: 0.26, vol: 0.16, delay: 0.16, detuneCents: 10, send: 0.5 });
    noise({ dur: 0.5, from: 700, to: 3400, type: 'bandpass', vol: 0.06, q: 1.5, send: 0.4 }); // omen shimmer
  },
  thud: () => {
    tone({ type: 'sine', freq: vary(80), freqEnd: 36, dur: 0.16, vol: 0.28 });
    noise({ dur: 0.09, from: 380, to: 70, vol: 0.16 });
  },
  boss: () => {
    tone({ type: 'sawtooth', freq: 92, freqEnd: 42, dur: 0.9, vol: 0.24, detuneCents: 14 }); // growl
    tone({ type: 'sine', freq: 55, freqEnd: 30, dur: 1.1, vol: 0.32 });                      // dread sub
    noise({ dur: 0.9, from: 500, to: 60, vol: 0.22 });                                       // rumble
    noise({ dur: 0.7, from: 220, to: 110, type: 'bandpass', vol: 0.14, q: 2, delay: 0.3, send: 0.4 }); // distant roar
  },
  roundWin: () => [523, 659, 784].forEach((f, i) =>
    tone({ type: 'triangle', freq: f, dur: 0.2, vol: 0.16, delay: i * 0.12, detuneCents: 6, send: 0.35 })),
  victory: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone({ type: 'triangle', freq: f, dur: 0.28, vol: 0.17, delay: i * 0.15, detuneCents: 8, send: 0.45 }));
    noise({ dur: 0.8, from: 900, to: 4200, type: 'bandpass', vol: 0.06, q: 1.2, delay: 0.45, send: 0.5 }); // shimmer
  },
};

// public sfx table: every play passes the anti-clutter gate first
const sfx = {};
for (const [key, fn] of Object.entries(SFX_DEFS)) {
  sfx[key] = () => {
    if (!audioCtx) return;
    const s = gateScale(key);
    if (!s) return;
    volScale = s;
    try { fn(); } finally { volScale = 1; }
  };
}
