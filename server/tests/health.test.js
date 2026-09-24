import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import express from 'express';

import healthRouter from '../routes/health.js';

test('GET /health returns server reachability status', async (t) => {
  const app = express();
  app.use('/health', healthRouter);

  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  const response = await new Promise((resolve, reject) => {
    const request = http.get({
      hostname: '127.0.0.1',
      port,
      path: '/health',
      headers: { connection: 'close' },
    }, (incomingResponse) => {
      const chunks = [];
      incomingResponse.on('data', (chunk) => chunks.push(chunk));
      incomingResponse.on('end', () => resolve({
        statusCode: incomingResponse.statusCode,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    request.on('error', reject);
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { status: 'ok' });
});
