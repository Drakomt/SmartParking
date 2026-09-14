import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import { sanitizeRegistrationData } from '../services/authService.js';
import { requireRole } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { requireLoraApiKey } from '../middleware/loraAuth.js';
import { getAuthCookieOptions } from '../routes/auth.js';
import { getAuthorizedCityIds } from '../services/parkingService.js';
import { requireSetupApiKey } from '../middleware/setupAuth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const response = () => ({
  statusCode: null,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test('comparePassword validates the bcrypt hash', async () => {
  const password = 'correct horse battery staple';
  const user = new User({ fullName: 'Test', email: 'test@example.com', password: await bcrypt.hash(password, 4) });
  assert.equal(await user.comparePassword(password), true);
  assert.equal(await user.comparePassword('wrong password'), false);
});

test('public registration cannot assign role or authorized cities', () => {
  const result = sanitizeRegistrationData({
    fullName: 'User', email: 'user@example.com', password: 'secret',
    role: 'admin', authorizedCities: ['city-id'],
  });
  assert.equal(result.role, 'user');
  assert.deepEqual(result.authorizedCities, []);
});

test('admin middleware rejects users and accepts admins', () => {
  const denied = response();
  requireRole('admin')({ user: { role: 'user' } }, denied, () => assert.fail('must not continue'));
  assert.equal(denied.statusCode, 403);
  let continued = false;
  requireRole('admin')({ user: { role: 'admin' } }, response(), () => { continued = true; });
  assert.equal(continued, true);
});

test('an admin without assigned cities cannot perform parking administration', () => {
  assert.throws(
    () => getAuthorizedCityIds({ role: 'admin', authorizedCities: [] }),
    (error) => error.statusCode === 403 && error.code === 'FORBIDDEN',
  );
});

test('CSRF requires matching cookie and header for cookie-authenticated mutations', () => {
  const req = {
    headers: { cookie: 'token=jwt; csrfToken=abc123' },
    get: (name) => name === 'x-csrf-token' ? 'abc123' : null,
  };
  let continued = false;
  requireCsrf(req, response(), () => { continued = true; });
  assert.equal(continued, true);

  const denied = response();
  requireCsrf({ ...req, get: () => 'wrong' }, denied, () => assert.fail('must not continue'));
  assert.equal(denied.statusCode, 403);
});

test('production cookie is cross-site compatible and secure', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    assert.deepEqual(getAuthCookieOptions(), { httpOnly: true, sameSite: 'none', secure: true });
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test('LoRa endpoint middleware requires the configured API key', () => {
  const previousKey = process.env.LORA_API_KEY;
  process.env.LORA_API_KEY = 'device-secret';
  try {
    const denied = response();
    requireLoraApiKey({ get: () => 'incorrect' }, denied, () => assert.fail('must not continue'));
    assert.equal(denied.statusCode, 401);
    let continued = false;
    requireLoraApiKey({ get: () => 'device-secret' }, response(), () => { continued = true; });
    assert.equal(continued, true);
  } finally {
    if (previousKey === undefined) delete process.env.LORA_API_KEY;
    else process.env.LORA_API_KEY = previousKey;
  }
});

test('database setup endpoint requires its separate API key', () => {
  const previousKey = process.env.DB_SETUP_API_KEY;
  process.env.DB_SETUP_API_KEY = 'setup-secret';
  try {
    const denied = response();
    requireSetupApiKey({ get: () => null }, denied, () => assert.fail('must not continue'));
    assert.equal(denied.statusCode, 401);
  } finally {
    if (previousKey === undefined) delete process.env.DB_SETUP_API_KEY;
    else process.env.DB_SETUP_API_KEY = previousKey;
  }
});

test('shared rate limiter blocks requests over the configured limit', async () => {
  let count = 0;
  const bucketModel = {
    findByIdAndUpdate: async () => ({ count: ++count, resetAt: new Date(60_000) }),
  };
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1, bucketModel, now: () => 0 });
  const makeRequest = () => ({ ip: '127.0.0.1' });
  let continued = false;
  await limiter(makeRequest(), { ...response(), setHeader() {} }, () => { continued = true; });
  assert.equal(continued, true);
  const denied = { ...response(), setHeader() {} };
  await limiter(makeRequest(), denied, () => assert.fail('must not continue'));
  assert.equal(denied.statusCode, 429);
});
