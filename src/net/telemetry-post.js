// telemetry-post.js — the browser's telemetry sink: one POST per finished round.
// Headless the server bridge installs its own sink instead (it owns the file).
export function postTelemetryHttp(rec) {
  try {
    if (!/^https?:$/.test(location.protocol)) return; // file:// couch mode: nowhere to POST
    fetch('/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rec),
      keepalive: true, // survive a page unload mid-flush
    }).catch(() => {});
  } catch { /* logging must never break the game */ }
}
