// fx-names.js — the cosmetic events that are allowed on the wire.
//
// The sim emits more kinds than this (bespoke one-off particles, the per-round
// particle clear); those are local-only and always were — the old
// monkeypatch in server-bridge.js wrapped exactly these ten functions plus the
// sfx table, so exactly these ten reached a LAN client. Keeping the list here,
// as data, is what lets the SENDER filter and the RECEIVER validate against the
// same set instead of two lists that drift.
//
// It is an allowlist in both directions on purpose: outbound it keeps local
// chatter off the wire, inbound it keeps a buggy or hostile server from naming
// a handler the client never meant to expose. `sfx` is handled separately at
// both ends because its payload is a cue key, not an argument list.
export const WIRE_FX = new Set([
  'spawnParticles', 'spawnRing', 'spawnText', 'doFlash', 'addShake',
  'slowMo', 'boltVisual', 'setBanner', 'addKillFeed', 'spawnBurst',
]);
