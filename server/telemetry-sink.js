// telemetry-sink.js — one capped appender for balance telemetry, shared by the
// HTTP endpoint (couch-mode browsers POST /telemetry) and the server-side sim
// (which writes directly, no HTTP hop). Past the cap we silently drop new
// rounds so a long-lived server can't fill its disk.
'use strict';
const fs = require('fs');
const path = require('path');

const TEL_DIR = path.join(__dirname, 'telemetry');
const TEL_FILE = path.join(TEL_DIR, 'rounds.jsonl');
const TEL_MAX_BYTES = 50 * 1024 * 1024;
let telFullLogged = false;

// rec: already-parsed object. cb(errMessage|null) optional.
function appendTelemetryRecord(rec, cb) {
  fs.mkdir(TEL_DIR, { recursive: true }, (mkErr) => {
    if (mkErr) { cb?.('mkdir failed'); return; }
    fs.stat(TEL_FILE, (stErr, st) => {
      if (!stErr && st.size > TEL_MAX_BYTES) {
        if (!telFullLogged) { telFullLogged = true; console.log(`telemetry file over ${TEL_MAX_BYTES / 1e6}MB — dropping new rounds`); }
        cb?.(null); // acked but not written, same contract as before
        return;
      }
      fs.appendFile(TEL_FILE, JSON.stringify(rec) + '\n', (err) => cb?.(err ? 'write failed' : null));
    });
  });
}

module.exports = { appendTelemetryRecord, TEL_FILE };
