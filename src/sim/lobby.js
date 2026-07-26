// lobby.js — the wizard-naming state the lobby shares between three layers.
//
// The name editor itself is browser UI (src/platform/join.js drives it and owns
// the localStorage), the lobby panel draws it (src/render/hud.js), and stepSim
// consults it before letting anyone start a match — so the state has to live in
// the layer all three can import, which is this one. Headless nameEdit is always
// null and the two guards below are no-ops, exactly as before.
export let nameEdit = null;      // { p, buffer, storeKey, pad?, letter? }
export let nameEditEndAt = 0;    // brief join/start lockout after a name is confirmed

export function setNameEdit(v) { nameEdit = v; }
export function setNameEditEndAt(v) { nameEditEndAt = v; }

export function cleanName(s) {
  return String(s || '').replace(/[^\w \-'!.]/g, '').slice(0, 12); // case is kept — Alinea is Alinea
}

// custom colors must stay visible against the dark arenas: colors darker than
// a floor luminance get blended toward white just enough to read (black → charcoal)
export function readableColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const MIN = 96;
  if (lum >= MIN) return hex;
  const t = (MIN - lum) / (255 - lum);
  const up = c => Math.round(c + (255 - c) * t).toString(16).padStart(2, '0');
  return `#${up(r)}${up(g)}${up(b)}`;
}

// gamepad players have no keyboard, so they name their wizard with an on-screen
// letter ribbon: ◀ ▶ pick a letter, A appends it, B deletes, START confirms.
export const PAD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -!';
