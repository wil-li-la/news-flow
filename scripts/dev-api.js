import 'dotenv/config';
import net from 'node:net';
import { spawn } from 'node:child_process';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || 'localhost';

function isPortInUse(port, host = 'localhost', timeout = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    const finish = (inUse) => {
      if (done) return;
      done = true;
      try { socket.destroy(); } catch { /* ignore */ }
      resolve(inUse);
    };

    socket.setTimeout(timeout);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

(async () => {
  const inUse = await isPortInUse(PORT, HOST);
  if (inUse) {
    console.log(`[dev:api] Port ${PORT} is already in use; assuming API is running. Skipping dev server.`);
    process.exit(0);
  }

  console.log(`[dev:api] Starting API on port ${PORT}...`);
  const child = spawn(
    'nodemon',
    ['--watch', 'api', '--ext', 'js,json', 'api/index.js'],
    { stdio: 'inherit', shell: false }
  );

  child.on('exit', (code) => process.exit(code ?? 0));
})();

