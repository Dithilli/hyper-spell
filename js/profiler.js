// profiler.js — frame-time instrumentation for hunting stutter.
//
// This exists because "every once in a while it goes staccato" is the one class
// of performance bug you cannot fix by reading code. A hitch that fires once
// every few hundred frames has to be caught in the act, on the machine it
// happens on, with the phase breakdown of that exact frame preserved — by the
// time you look up, it's over.
//
//   F7          toggle the overlay
//   Shift+F7    dump the whole ring buffer to the console as CSV
//   ?perf=1     start with it on
//
// The number that matters most is OUTSIDE: the gap between the end of one
// frame's work and the start of the next. Our draw code cannot run during that
// window, so if a 50ms frame only did 8ms of work, the other 42ms went to
// garbage collection or the compositor — and no amount of draw-call tuning will
// touch it. Allocation is the fix for a big OUTSIDE; draw cost is the fix for a
// big WORK. The overlay separates them on every bar of the graph.
//
// The profiler itself allocates nothing per frame (fixed ring buffer, typed
// arrays keyed by interned phase id), because a profiler that adds GC pressure
// changes the very thing it is measuring.

const PERF_CAP = 240;        // ~4s of history at 60fps
const PERF_MAX_SLOTS = 32;   // distinct phase / counter names
const PERF_HITCH_MS = 22;    // an interval above this is a dropped frame
const PERF_KEEP_HITCHES = 6;

// ---------- interned names, so the hot path indexes arrays instead of objects ----------
function _slots() {
  const ids = new Map(), names = [];
  return {
    names,
    id(name) {
      let i = ids.get(name);
      if (i === undefined) {
        if (names.length >= PERF_MAX_SLOTS) return -1;
        i = names.length; ids.set(name, i); names.push(name);
      }
      return i;
    },
  };
}
const _phaseSlots = _slots();
const _countSlots = _slots();

function _mkFrame() {
  return {
    t: 0, interval: 0, work: 0, outside: 0, heap: 0,
    ph: new Float64Array(PERF_MAX_SLOTS),   // top-level phases; these sum to ~work
    sub: new Float64Array(PERF_MAX_SLOTS),  // nested phases; already inside a parent
    cn: new Float64Array(PERF_MAX_SLOTS),   // counters (particle count, body count, …)
  };
}

const PERF = {
  on: false,
  buf: null, // allocated on first enable — the headless sim loads this file too
  head: 0, n: 0,
  cur: null, lastStart: 0, lastEnd: 0,
  hitches: [],        // worst few of the session, newest-worst first
  hitchTimes: [],      // timestamps of every hitch, for the "in the last 5s" rate
  heapDrops: 0,        // times the JS heap shrank — i.e. a GC ran
};
globalThis.PERF = PERF; // pokeable from the console

const _stack = [];
const _nestedPhase = new Uint8Array(PERF_MAX_SLOTS); // phase ids seen inside another phase

// ---------- hooks (all no-ops when the profiler is off) ----------
function perfFrameStart() {
  if (!PERF.on) return;
  const t = performance.now();
  const f = PERF.buf[PERF.head];
  f.ph.fill(0); f.sub.fill(0); f.cn.fill(0);
  f.t = t;
  f.interval = PERF.lastStart ? t - PERF.lastStart : 0;
  f.outside = PERF.lastEnd ? t - PERF.lastEnd : 0;
  f.work = 0;
  const mem = performance.memory; // Chrome only; absent elsewhere and that's fine
  f.heap = mem ? mem.usedJSHeapSize : 0;
  PERF.cur = f;
  PERF.lastStart = t;
  _stack.length = 0;
}

function perfFrameEnd() {
  if (!PERF.on || !PERF.cur) return;
  const t = performance.now();
  const f = PERF.cur;
  f.work = t - f.t;
  PERF.lastEnd = t;

  // a shrinking heap means a collection happened between the two samples
  const prev = PERF.buf[(PERF.head + PERF_CAP - 1) % PERF_CAP];
  if (PERF.n > 0 && f.heap && prev.heap && f.heap < prev.heap - 65536) PERF.heapDrops++;

  if (PERF.n > 5 && f.interval > PERF_HITCH_MS) _recordHitch(f);

  PERF.head = (PERF.head + 1) % PERF_CAP;
  if (PERF.n < PERF_CAP) PERF.n++;
  PERF.cur = null;
}

// Begin/end a timed section. Sections nest: anything opened inside another is
// recorded separately so the top-level numbers still add up to the frame's work
// instead of double-counting.
function perfBegin(name) {
  if (!PERF.on) return;
  _stack.push(name, performance.now(), _stack.length > 0 ? 1 : 0);
}

function perfEnd() {
  if (!PERF.on || !_stack.length) return;
  const nested = _stack.pop(), t0 = _stack.pop(), name = _stack.pop();
  const f = PERF.cur;
  if (!f) return;
  const id = _phaseSlots.id(name);
  if (id < 0) return;
  if (nested) _nestedPhase[id] = 1; // remembered, so the overlay can mark it even at 0.0ms
  (nested ? f.sub : f.ph)[id] += performance.now() - t0;
}

// Record a scalar alongside the frame — particle count, body count, whatever
// might explain the spike. Cheap enough to call unconditionally.
function perfCount(name, value) {
  if (!PERF.on || !PERF.cur) return;
  const id = _countSlots.id(name);
  if (id >= 0) PERF.cur.cn[id] = value;
}

function _recordHitch(f) {
  PERF.hitchTimes.push(f.t);
  if (PERF.hitchTimes.length > 600) PERF.hitchTimes.splice(0, 300);
  // snapshot, because the ring buffer entry gets recycled in ~4 seconds
  const snap = {
    t: f.t, interval: f.interval, work: f.work, outside: f.outside,
    ph: Array.from(f.ph), sub: Array.from(f.sub), cn: Array.from(f.cn),
  };
  PERF.hitches.push(snap);
  PERF.hitches.sort((a, b) => b.interval - a.interval);
  if (PERF.hitches.length > PERF_KEEP_HITCHES) PERF.hitches.length = PERF_KEEP_HITCHES;
}

// ---------- stats ----------
const _scratch = new Float64Array(PERF_CAP);
function _pct(pick, p) {
  const n = PERF.n;
  if (!n) return 0;
  for (let i = 0; i < n; i++) _scratch[i] = pick(PERF.buf[(PERF.head - n + i + PERF_CAP * 2) % PERF_CAP]);
  const view = _scratch.subarray(0, n);
  view.sort();
  return view[Math.min(n - 1, Math.floor(n * p))];
}
const _byInterval = f => f.interval, _byWork = f => f.work, _byOutside = f => f.outside;

function _frameAt(back) { return PERF.buf[(PERF.head - 1 - back + PERF_CAP * 2) % PERF_CAP]; }

// p95 of one phase across the window — the "which phase is spiky" column
function _phaseP95(id) { return _pct(f => f.ph[id] + f.sub[id], 0.95); }

// ---------- overlay ----------
const PERF_PANEL_W = 268;
const _fmt = v => (v < 10 ? v.toFixed(1) : Math.round(v).toString());

function drawPerfHud(now) {
  if (!PERF.on || !PERF.n) return;
  perfBegin('perfhud'); // the overlay is not free — measure it so you can subtract it

  const s = typeof RENDER_SCALE === 'number' ? RENDER_SCALE : 1;
  ctx.save();
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.textAlign = 'left';
  ctx.font = '11px Menlo, monospace';

  const x0 = W - PERF_PANEL_W - 8;
  // starts below the Art Gallery / Spell Guide corner links in index.html —
  // those are DOM, so they paint over the canvas and would sit on the readout
  const y0 = 76;
  const rows = _phaseSlots.names.length;
  const panelH = 96 + 64 + 26 + rows * 13 + (PERF.hitches.length ? 46 : 0);
  ctx.fillStyle = 'rgba(10,6,16,0.82)';
  ctx.fillRect(x0, y0, PERF_PANEL_W, panelH);
  ctx.strokeStyle = 'rgba(120,90,170,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, PERF_PANEL_W - 1, panelH - 1);

  let y = y0 + 16;
  const line = (txt, col) => { ctx.fillStyle = col || '#c8b8e8'; ctx.fillText(txt, x0 + 10, y); y += 13; };

  // ---- headline ----
  const p50 = _pct(_byInterval, 0.5), p95 = _pct(_byInterval, 0.95), pmax = _pct(_byInterval, 0.999);
  const fps = p50 > 0 ? Math.round(1000 / p50) : 0;
  ctx.font = 'bold 11px Menlo, monospace';
  line(`PERF  F7  ·  ${fps} fps`, fps >= 58 ? '#7bd88f' : fps >= 45 ? '#ffd166' : '#ff6b81');
  ctx.font = '11px Menlo, monospace';
  line(`frame  p50 ${_fmt(p50)}  p95 ${_fmt(p95)}  max ${_fmt(pmax)} ms`);
  line(`work   p50 ${_fmt(_pct(_byWork, 0.5))}  p95 ${_fmt(_pct(_byWork, 0.95))} ms`, '#9ef0f0');
  line(`out    p50 ${_fmt(_pct(_byOutside, 0.5))}  p95 ${_fmt(_pct(_byOutside, 0.95))} ms`, '#b98cff');

  // hitch rate over the last 5s — the direct measure of "it went staccato"
  const cut = now - 5000;
  let recent = 0;
  for (let i = PERF.hitchTimes.length - 1; i >= 0 && PERF.hitchTimes[i] >= cut; i--) recent++;
  line(`hitches >${PERF_HITCH_MS}ms: ${recent} in last 5s   GC: ${PERF.heapDrops}`,
    recent > 4 ? '#ff6b81' : recent ? '#ffd166' : '#675a7d');

  // ---- the graph ----
  // Each column is one frame: bright = work we did, dim = the gap before it.
  // A wall of dim purple spikes is GC or compositor; tall cyan is our own code.
  // full scale is two 60Hz frames: a healthy frame sits in the bottom quarter and
  // anything that clips the top has already cost you a frame, no squinting needed
  const gx = x0 + 10, gy = y + 2, gw = PERF_CAP, gh = 56, full = 33.3;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(gx, gy, gw, gh);
  for (const ms of [16.7, 33.3]) { // 60fps and 30fps guides
    const ly = gy + gh - (ms / full) * gh;
    ctx.strokeStyle = ms < 20 ? 'rgba(123,216,143,0.35)' : 'rgba(255,209,102,0.3)';
    ctx.beginPath(); ctx.moveTo(gx, ly + 0.5); ctx.lineTo(gx + gw, ly + 0.5); ctx.stroke();
  }
  for (let i = 0; i < PERF.n; i++) {
    const f = _frameAt(PERF.n - 1 - i);
    const cx = gx + gw - PERF.n + i;
    const wpx = Math.min(gh, (f.work / full) * gh);
    const opx = Math.min(gh - wpx, (f.outside / full) * gh);
    ctx.fillStyle = '#4ad2d2';
    ctx.fillRect(cx, gy + gh - wpx, 1, wpx);
    ctx.fillStyle = f.outside > PERF_HITCH_MS ? '#ff6b81' : '#6b4b9e';
    ctx.fillRect(cx, gy + gh - wpx - opx, 1, opx);
  }
  ctx.strokeStyle = 'rgba(120,90,170,0.4)';
  ctx.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1);
  y = gy + gh + 14;

  // ---- per-phase: this frame vs the window's p95 ----
  line('phase           last    p95', '#675a7d');
  const last = _frameAt(0);
  for (let id = 0; id < _phaseSlots.names.length; id++) {
    const name = _phaseSlots.names[id];
    const cur = last.ph[id] + last.sub[id];
    const hi = _phaseP95(id);
    line(`${(_nestedPhase[id] ? ' ·' + name : name).padEnd(14)} ${_fmt(cur).padStart(5)}  ${_fmt(hi).padStart(5)}`,
      hi > 8 ? '#ff6b81' : hi > 4 ? '#ffd166' : '#9c8ab8');
  }

  // ---- counters ----
  y += 3;
  let cline = '';
  for (let id = 0; id < _countSlots.names.length; id++) cline += `${_countSlots.names[id]} ${Math.round(last.cn[id])}  `;
  if (cline) line(cline.trim(), '#8fa6d8');
  line(`buf ${canvas.width}x${canvas.height} @${(typeof RENDER_SCALE === 'number' ? RENDER_SCALE : 1).toFixed(2)}  zoom ${(typeof CAM !== 'undefined' ? CAM.zoom : 1).toFixed(2)}`, '#675a7d');

  // ---- worst hitch of the session, held so you can read it after the fact ----
  const worst = PERF.hitches[0];
  if (worst) {
    y += 3;
    line(`worst ${_fmt(worst.interval)}ms  ${((now - worst.t) / 1000).toFixed(0)}s ago`, '#ff6b81');
    // the two biggest contributors at the moment it happened
    const parts = [];
    for (let id = 0; id < _phaseSlots.names.length; id++) {
      const v = (worst.ph[id] || 0) + (worst.sub[id] || 0);
      if (v > 0.5) parts.push([_phaseSlots.names[id], v]);
    }
    parts.push(['outside', worst.outside]);
    parts.sort((a, b) => b[1] - a[1]);
    line('  ' + parts.slice(0, 3).map(([n, v]) => `${n} ${_fmt(v)}`).join('  '), '#c8b8e8');
  }

  ctx.restore();
  perfEnd();
}

// ---------- console dump ----------
function perfDump() {
  const head = ['t', 'interval', 'work', 'outside', 'heapKB',
    ..._phaseSlots.names, ..._countSlots.names.map(n => `#${n}`)];
  const rows = [head.join(',')];
  for (let i = PERF.n - 1; i >= 0; i--) {
    const f = _frameAt(i);
    rows.push([
      f.t.toFixed(1), f.interval.toFixed(2), f.work.toFixed(2), f.outside.toFixed(2),
      Math.round(f.heap / 1024),
      ..._phaseSlots.names.map((_, id) => (f.ph[id] + f.sub[id]).toFixed(2)),
      ..._countSlots.names.map((_, id) => Math.round(f.cn[id])),
    ].join(','));
  }
  const csv = rows.join('\n');
  console.log(csv);
  console.log(`— ${PERF.n} frames, ${PERF.hitches.length} hitches kept, ${PERF.heapDrops} GC drops`);
  navigator.clipboard?.writeText(csv).then(
    () => console.log('(copied to clipboard)'),
    () => {},
  );
  return csv;
}
globalThis.perfDump = perfDump;

function perfSetEnabled(on) {
  if (on && !PERF.buf) PERF.buf = Array.from({ length: PERF_CAP }, _mkFrame);
  PERF.on = on && !!PERF.buf;
  // start clean: stale frames from before the toggle would skew every percentile
  PERF.head = 0; PERF.n = 0; PERF.cur = null;
  PERF.lastStart = 0; PERF.lastEnd = 0;
  PERF.hitches.length = 0; PERF.hitchTimes.length = 0; PERF.heapDrops = 0;
  _stack.length = 0;
}

if (typeof addEventListener === 'function') {
  addEventListener('keydown', e => {
    if (e.code !== 'F7') return;
    e.preventDefault();
    if (e.shiftKey) perfDump();
    else perfSetEnabled(!PERF.on);
  });
  if (typeof location !== 'undefined' && /(\?|&)perf=1/.test(location.search)) perfSetEnabled(true);
}
