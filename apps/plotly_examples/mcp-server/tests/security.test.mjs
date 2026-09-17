import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import test from 'node:test';

const markerPath = path.resolve('tests', 'python-executed.marker');

async function getFreePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).once('error', reject));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function startServer(restToolBridgeEnabled = false) {
  const port = await getFreePort();
  const child = spawn(process.execPath, ['dist/index.js'], {
    env: {
      ...process.env,
      PORT: String(port),
      ENABLE_REST_TOOL_BRIDGE: String(restToolBridgeEnabled),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const token = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server did not start')), 10_000);
    let output = '';
    const onData = data => {
      output += data.toString();
      const tokenMatch = output.match(/Authentication token for this run: ([a-f0-9]{64})/);
      if (output.includes(`Server listening on port ${port}`) && tokenMatch) {
        clearTimeout(timeout);
        child.stdout.off('data', onData);
        resolve(tokenMatch[1]);
      }
    };
    child.stdout.on('data', onData);
    child.once('error', reject);
    child.once('exit', code => reject(new Error(`Server exited before startup with code ${code}`)));
  });

  return { child, port, token };
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill();
  await new Promise(resolve => child.once('exit', resolve));
}

function request(port, { host = `localhost:${port}`, origin, authorization, method = 'GET', route = '/tools', body }) {
  return new Promise((resolve, reject) => {
    const payload = body ? Buffer.from(JSON.stringify(body)) : undefined;
    const headers = { Host: host };
    if (origin) headers.Origin = origin;
    if (authorization) headers.Authorization = authorization;
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = payload.length;
    }

    const req = http.request({ hostname: '127.0.0.1', port, path: route, method, headers }, res => {
      res.resume();
      res.once('end', () => resolve(res.statusCode));
    });
    req.once('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('security checks reject requests before REST tool dispatch', async t => {
  fs.rmSync(markerPath, { force: true });
  const { child, port, token } = await startServer();
  t.after(async () => {
    await stopServer(child);
    fs.rmSync(markerPath, { force: true });
  });

  const executionRequest = {
    method: 'POST',
    route: '/tools/execute-python-and-capture-chart',
    body: { pythonCode: `from pathlib import Path\nPath(${JSON.stringify(markerPath.replaceAll('\\', '/'))}).write_text('executed')` },
  };

  assert.equal(await request(port, executionRequest), 401);
  assert.equal(await request(port, {
    ...executionRequest,
    host: 'attacker.example',
    authorization: `Bearer ${token}`,
  }), 403);
  assert.equal(await request(port, {
    ...executionRequest,
    host: 'attacker.example@localhost',
    authorization: `Bearer ${token}`,
  }), 403);
  assert.equal(await request(port, {
    ...executionRequest,
    origin: 'https://attacker.example',
    authorization: `Bearer ${token}`,
  }), 403);
  assert.equal(await request(port, {
    ...executionRequest,
    authorization: `Bearer ${token}`,
  }), 404);
  assert.equal(fs.existsSync(markerPath), false);
});

test('REST bridge requires explicit opt-in and remains authenticated', async t => {
  const { child, port, token } = await startServer(true);
  t.after(() => stopServer(child));

  assert.equal(await request(port, { route: '/tools' }), 401);
  assert.equal(await request(port, {
    route: '/tools',
    authorization: `Bearer ${token}`,
    origin: `http://localhost:${port}`,
  }), 200);
});