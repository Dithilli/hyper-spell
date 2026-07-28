// server.js — an isolated HyperSpell server per online spec file.
//
// server/serve.js keeps ONE room. Every connected browser shares that lobby, so
// parallel workers pointed at a single server would add each other's bots, start
// each other's matches and reset each other's state. Each online spec file gets
// its own process on its own port instead; nothing they do can be seen by
// another worker.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Ask the OS for a port it is willing to give out, then let go of it. */
function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

/**
 * Start a real server (real static files, real authoritative sim) and wait until
 * it says it is listening.
 *
 * @param {{ env?: Record<string,string>, port?: number }} opts
 * @returns {Promise<{ url: string, port: number, proc: import('node:child_process').ChildProcess,
 *                     stderr: () => string, stop: () => Promise<void> }>}
 */
export async function startServer({ env = {}, port } = {}) {
  const chosen = port ?? await freePort();
  const proc = spawn('node', ['server/serve.js'], {
    cwd: REPO,
    env: { ...process.env, PORT: String(chosen), ...env },
  });

  let stdout = '', stderr = '';
  proc.stdout.on('data', d => { stdout += d; });
  proc.stderr.on('data', d => { stderr += d; });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`server did not start in 20s\n${stderr}`)), 20_000);
    const check = setInterval(() => {
      if (stdout.includes('running')) { clearInterval(check); clearTimeout(timer); resolve(); }
    }, 50);
    proc.on('exit', code => {
      clearInterval(check); clearTimeout(timer);
      reject(new Error(`server exited with ${code} before it was ready\n${stderr}`));
    });
  });

  return {
    url: `http://127.0.0.1:${chosen}`,
    port: chosen,
    proc,
    stderr: () => stderr,
    stop: () => new Promise(resolve => {
      if (proc.exitCode !== null) return resolve();
      proc.once('exit', () => resolve());
      proc.kill('SIGTERM');
      setTimeout(() => { proc.kill('SIGKILL'); resolve(); }, 3000);
    }),
  };
}
