// camera.js — the fit-to-action camera and the one place the world transform lives.
//
// The arena is exactly one screen (W x H), so this camera never scrolls a larger
// level: it FRAMES. Fights cluster — most of a round happens in a band a few
// hundred px tall near the floor while the top half of the screen is empty sky.
// The camera finds the box the fight actually occupies and zooms into it, which
// is what makes the wizard art legible at all (a wizard is ~35px tall at 1:1).
//
// At zoom 1 the view is mathematically identical to the old fixed framing, so
// nothing about the game's coordinates changes — this is purely a render-side
// transform. The sim, the network snapshots and every draw call still speak
// plain world coordinates.

const CAM = {
  x: W / 2, y: H / 2, zoom: 1,      // current (smoothed)
  tx: W / 2, ty: H / 2, tzoom: 1,   // target
  shakeX: 0, shakeY: 0, rot: 0,
};

const CAM_TUNE = {
  min: 1,            // never zoom out past the arena — there's nothing out there
  max: 2.15,         // past this, knockback outruns the camera and reads as teleporting
  padX: 170,         // breathing room around the action box, world px
  padY: 105,
  headroom: 60,      // extra above the box: spells arc, and you need to see them coming
  lerpIn: 0.035,     // easing toward a tighter shot — slow, so it feels like a push-in
  lerpOut: 0.10,     // easing wider — faster, because being off-screen is unfair
  panLerp: 0.06,
  maxTrauma: 26,     // matches the old addShake ceiling
  shakePx: 22,       // peak translation at full trauma
  shakeRot: 0.012,   // peak rotation (rad) at full trauma
};

let camEnabled = true; // F9 toggles, for A/B and for anyone who hates it

// ---------- targeting ----------
// Points of interest: everyone still standing, plus the boss if one is up.
// Dead players are excluded deliberately — a corpse flying off the map should
// not drag the shot away from the survivors deciding the round.
function cameraPoints() {
  const pts = [];
  if (typeof players !== 'undefined') {
    for (const p of players) {
      if (!p.alive || !p.body) continue;
      pts.push({ x: p.body.position.x, y: p.body.position.y });
    }
  }
  if (typeof game !== 'undefined' && game.boss?.body) {
    pts.push({ x: game.boss.body.position.x, y: game.boss.body.position.y });
  }
  return pts;
}

// Feed the camera an explicit point list (the online client renders ghosts, not
// local players, so net.js hands us the interpolated ghost positions instead).
function cameraTarget(pts) {
  if (!pts || !pts.length) { CAM.tzoom = 1; CAM.tx = W / 2; CAM.ty = H / 2; return; }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  if (!Number.isFinite(minX)) { CAM.tzoom = 1; return; }

  const needW = (maxX - minX) + CAM_TUNE.padX * 2;
  const needH = (maxY - minY) + CAM_TUNE.padY * 2 + CAM_TUNE.headroom;
  const zoom = Math.max(CAM_TUNE.min, Math.min(CAM_TUNE.max, Math.min(W / needW, H / needH)));

  CAM.tzoom = zoom;
  CAM.tx = (minX + maxX) / 2;
  // bias the framing up a little: the action sits on the floor, and a shot with
  // the fighters dead-centre wastes the bottom of the frame on terrain
  CAM.ty = (minY + maxY) / 2 - CAM_TUNE.headroom * 0.35;
  clampCenterToWorld();
}

// the view rect may never leave the arena — no dead space at the edges
function clampCenterToWorld(zoom = CAM.tzoom) {
  const halfW = W / (2 * zoom), halfH = H / (2 * zoom);
  CAM.tx = Math.max(halfW, Math.min(W - halfW, CAM.tx));
  CAM.ty = Math.max(halfH, Math.min(H - halfH, CAM.ty));
}

// ---------- shake ----------
// Trauma-squared with smooth noise, not per-frame white noise. Uniform random
// per frame reads as electrical buzz; trauma with continuous noise reads as a
// physical impact that decays. `shake` (fx.js) stays the input so every existing
// addShake() call site keeps working.
const _nz = (t, seed) => Math.sin(t * 0.043 + seed) * 0.62 + Math.sin(t * 0.0971 + seed * 2.7) * 0.38;

function updateCameraShake(now) {
  const trauma = Math.max(0, Math.min(1, shake / CAM_TUNE.maxTrauma));
  const t2 = trauma * trauma; // squared: small hits stay subtle, big ones dominate
  CAM.shakeX = _nz(now, 1.7) * CAM_TUNE.shakePx * t2;
  CAM.shakeY = _nz(now, 8.3) * CAM_TUNE.shakePx * t2;
  CAM.rot = _nz(now, 4.1) * CAM_TUNE.shakeRot * t2;
  shake *= 0.88; // the single decay site — every render path funnels through here
}

// ---------- per-frame update ----------
function updateCamera(now, pts) {
  if (!camEnabled) {
    CAM.x = W / 2; CAM.y = H / 2; CAM.zoom = 1;
    updateCameraShake(now);
    if (typeof syncMouseWorld === 'function') syncMouseWorld();
    return;
  }
  cameraTarget(pts || cameraPoints());
  // zooming out is an urgent correctness move (someone is about to leave frame);
  // zooming in is a taste move, so it eases
  const zl = CAM.tzoom < CAM.zoom ? CAM_TUNE.lerpOut : CAM_TUNE.lerpIn;
  CAM.zoom += (CAM.tzoom - CAM.zoom) * zl;
  CAM.x += (CAM.tx - CAM.x) * CAM_TUNE.panLerp;
  CAM.y += (CAM.ty - CAM.y) * CAM_TUNE.panLerp;
  // re-clamp against the SMOOTHED zoom: mid-ease the view is wider than the
  // target assumed, and without this the edge of the world peeks in
  const halfW = W / (2 * CAM.zoom), halfH = H / (2 * CAM.zoom);
  CAM.x = Math.max(halfW, Math.min(W - halfW, CAM.x));
  CAM.y = Math.max(halfH, Math.min(H - halfH, CAM.y));
  updateCameraShake(now);
  // the cursor sits still on screen while the camera moves under it, so the
  // world-space aim point has to be recomputed every frame, not on mousemove
  if (typeof syncMouseWorld === 'function') syncMouseWorld();
}

// ---------- transforms ----------
// beginWorld: device pixels -> world units, with the camera and shake applied.
// endWorld: back to a plain screen-space transform for HUD/vignette/overlays.
function beginWorld() {
  // exactly one call per frame in every render path, so it's where per-frame
  // world-space layout state gets cleared
  if (typeof resetNameTagSlots === 'function') resetNameTagSlots();
  const s = RENDER_SCALE * CAM.zoom;
  ctx.setTransform(s, 0, 0, s, RENDER_SCALE * (W / 2), RENDER_SCALE * (H / 2));
  if (CAM.rot) ctx.rotate(CAM.rot);
  ctx.translate(-CAM.x + CAM.shakeX / CAM.zoom, -CAM.y + CAM.shakeY / CAM.zoom);
}

function endWorld() {
  ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
}

// full-canvas clear in screen space (called before beginWorld)
function clearFrame(color) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = color || '#16121c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  endWorld();
}

// the world rect currently visible — offscreen pointers and any "is it on
// screen" test must use this, not 0..W/0..H
function cameraViewRect() {
  const halfW = W / (2 * CAM.zoom), halfH = H / (2 * CAM.zoom);
  return { x0: CAM.x - halfW, y0: CAM.y - halfH, x1: CAM.x + halfW, y1: CAM.y + halfH };
}

// screen (1280x720 logical, i.e. what input.js produces) -> world
function screenToWorld(sx, sy) {
  const r = cameraViewRect();
  return { x: r.x0 + (sx / W) * (r.x1 - r.x0), y: r.y0 + (sy / H) * (r.y1 - r.y0) };
}

// how much the backdrop should slide against the camera, for parallax
function cameraParallax() {
  return { dx: (CAM.x - W / 2), dy: (CAM.y - H / 2), zoom: CAM.zoom };
}
