import test from 'node:test';
import assert from 'node:assert/strict';

import { createMailService } from '../services/mailService.js';

const configProvider = () => ({
  url: 'https://script.google.com/macros/s/test-deployment/exec',
  secret: 'server-only-secret',
});

test('mail service sends the receipt to Apps Script and follows redirects', async () => {
  let captured;
  const mailer = createMailService({
    configProvider,
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'EMAIL_SENT' }),
      };
    },
  });

  const result = await mailer.sendMail({
    to: 'customer@example.com',
    subject: 'Receipt',
    html: '<p>Receipt</p>',
    text: 'Receipt',
  });

  assert.equal(captured.url, configProvider().url);
  assert.equal(captured.options.method, 'POST');
  assert.equal(captured.options.redirect, 'follow');
  assert.deepEqual(JSON.parse(captured.options.body), {
    secret: 'server-only-secret',
    to: 'customer@example.com',
    subject: 'Receipt',
    html: '<p>Receipt</p>',
    text: 'Receipt',
  });
  assert.deepEqual(result, { success: true, message: 'EMAIL_SENT' });
});

test('mail service rejects an HTTP 200 response when Apps Script reports failure', async () => {
  let requestCount = 0;
  const mailer = createMailService({
    configProvider,
    fetchImpl: async () => {
      requestCount += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: false, error: 'INVALID_SECRET' }),
      };
    },
  });

  await assert.rejects(
    mailer.sendMail({
      to: 'customer@example.com', subject: 'Receipt', html: '<p>Receipt</p>', text: 'Receipt',
    }),
    (error) => error.statusCode === 502 && error.code === 'RECEIPT_DELIVERY_FAILED',
  );
  assert.equal(requestCount, 1);
});

test('mail service does not retry an uncertain connection failure', async () => {
  let requestCount = 0;
  const mailer = createMailService({
    configProvider,
    fetchImpl: async () => {
      requestCount += 1;
      throw new Error('Connection closed after request was sent');
    },
  });

  await assert.rejects(
    mailer.sendMail({
      to: 'customer@example.com', subject: 'Receipt', html: '<p>Receipt</p>', text: 'Receipt',
    }),
    (error) => error.statusCode === 503 && error.code === 'EMAIL_CONNECTION_FAILED',
  );
  assert.equal(requestCount, 1);
});
