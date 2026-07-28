// net-mode.js — who owns the match this process is showing.
//
// 'couch'  — this machine runs the sim, everyone plays locally
// 'online' — the server runs the sim; this browser sends inputs and renders
//            snapshots
//
// It lives in sim/ because the per-round telemetry flush consults it before
// POSTing (an online browser must not log a match it did not simulate), and
// sim/ cannot reach into net/. src/net/client.js flips it on a successful join.
export let netMode = 'couch';

export function setNetMode(mode) { netMode = mode; }
