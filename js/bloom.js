// bloom.js — one additive light pass over the finished world.
//
// This replaces the scattered per-draw `ctx.shadowBlur` calls that used to fake
// glow. Those had two problems: canvas shadows are the slowest primitive in the
// 2D API (they re-rasterise the shape into a blurred mask, per draw, per frame),
// and they don't compose — two overlapping glows looked like two stickers rather
// than one brighter region of light.
//
// Method, all on the GPU via drawImage: downscale the frame, crush the midtones
// so only genuinely bright pixels survive, blur, then composite back with
// 'lighter'. Cost is fixed per frame regardless of how many things are glowing.

let bloomEnabled = true;
const BLOOM = {
  div: 4,          // buffer is 1/4 the device resolution per axis (1/16 the pixels)
  strength: 0.55,  // final additive opacity
  blurPx: 7,       // blur radius in BUFFER px, so ~28px at full res
  // Each pass squares the colour, so N passes leaves c^(2^N). Three passes
  // (c^8) is the point where lit-but-not-emissive surfaces — pale ice, snow
  // crust — stop blooming and only spell cores, embers and lava survive.
  passes: 3,
};

let _bufA = null, _bufB = null, _bctxA = null, _bctxB = null, _bufW = 0, _bufH = 0;

function _ensureBloomBuffers() {
  const w = Math.max(1, Math.floor(canvas.width / BLOOM.div));
  const h = Math.max(1, Math.floor(canvas.height / BLOOM.div));
  if (_bufA && _bufW === w && _bufH === h) return true;
  if (typeof document === 'undefined' || !document.createElement) return false;
  _bufA = document.createElement('canvas');
  _bufB = document.createElement('canvas');
  _bufA.width = _bufB.width = w;
  _bufA.height = _bufB.height = h;
  _bctxA = _bufA.getContext('2d');
  _bctxB = _bufB.getContext('2d');
  if (!_bctxA || !_bctxB) return false;
  _bufW = w; _bufH = h;
  return true;
}

// Blur the buffer in place. ctx.filter is the fast path; where it's missing
// (older Safari) fall back to averaging four offset copies, which is a coarser
// blur but reads fine at this scale because the buffer is already tiny.
function _blurBuffer() {
  if ('filter' in _bctxB) {
    _bctxB.setTransform(1, 0, 0, 1, 0, 0);
    _bctxB.clearRect(0, 0, _bufW, _bufH);
    _bctxB.filter = `blur(${BLOOM.blurPx}px)`;
    _bctxB.drawImage(_bufA, 0, 0);
    _bctxB.filter = 'none';
  } else {
    _bctxB.setTransform(1, 0, 0, 1, 0, 0);
    _bctxB.clearRect(0, 0, _bufW, _bufH);
    _bctxB.globalAlpha = 0.25;
    const r = BLOOM.blurPx * 0.6;
    for (const [dx, dy] of [[-r, 0], [r, 0], [0, -r], [0, r]]) _bctxB.drawImage(_bufA, dx, dy);
    _bctxB.globalAlpha = 1;
  }
}

// Call in SCREEN space, after the world is drawn and before the vignette/HUD —
// the vignette should darken the glow, and HUD text should never bloom.
function applyBloom(now) {
  if (!bloomEnabled || !_ensureBloomBuffers()) return;

  // 1. downscale the frame into the buffer
  _bctxA.setTransform(1, 0, 0, 1, 0, 0);
  _bctxA.globalCompositeOperation = 'copy';
  _bctxA.drawImage(canvas, 0, 0, _bufW, _bufH);

  // 2. crush midtones: drawing the buffer onto itself with 'multiply' squares
  // every channel, so 0.9 stays 0.81 while 0.3 collapses to 0.09. Two passes
  // leaves essentially only the emissive stuff — spell cores, embers, lava.
  _bctxA.globalCompositeOperation = 'multiply';
  for (let i = 0; i < BLOOM.passes; i++) _bctxA.drawImage(_bufA, 0, 0);
  _bctxA.globalCompositeOperation = 'source-over';

  // 3. blur (A -> B)
  _blurBuffer();

  // 4. add it back over the frame
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = BLOOM.strength;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(_bufB, 0, 0, canvas.width, canvas.height);
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
