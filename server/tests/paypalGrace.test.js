import test from 'node:test';
import assert from 'node:assert/strict';

import { createPayPalCheckoutService } from '../services/paypalCheckoutService.js';
import { hashCheckoutToken } from '../utils/checkoutCredentials.js';

test('completed capture response includes the 15-minute grace expiry', async () => {
  const checkoutToken = 'checkout-token';
  const paidAt = new Date('2026-09-14T12:00:00.000Z');
  const payment = {
    _id: 'payment-1', parkingSession: 'session-1', checkoutId: 'a'.repeat(32),
    checkoutTokenHash: hashCheckoutToken(checkoutToken), paypalOrderId: 'ORDER123',
    paypalCaptureId: 'CAPTURE123', paypalPaymentStatus: 'COMPLETED', paidAt,
  };
  const parkingSession = {
    _id: 'session-1', checkoutId: payment.checkoutId,
    checkoutTokenHash: payment.checkoutTokenHash, parkingLot: { _id: 'lot-1' },
  };
  let captureRequests = 0;
  const service = createPayPalCheckoutService({
    sessionRepo: {
      findByCheckoutIdWithLot: async () => parkingSession,
      completeCheckoutOnce: async () => parkingSession,
    },
    paymentRepo: { findByPayPalOrderId: async () => payment },
    paypalApi: { captureOrder: async () => { captureRequests += 1; } },
  });
  const result = await service.captureOrder({
    paypalOrderId: payment.paypalOrderId,
    checkoutId: payment.checkoutId,
    checkoutToken,
  });
  assert.equal(result.graceExpiresAt, '2026-09-14T12:15:00.000Z');
  assert.equal(captureRequests, 0);
});

test('duplicate PayPal webhooks are acknowledged without processing the payment twice', async () => {
  let verified = 0;
  let processed = 0;
  const service = createPayPalCheckoutService({
    paypalApi: {
      verifyWebhook: async () => {
        verified += 1;
        return true;
      },
    },
    webhookEventRepo: {
      claimEvent: async () => null,
      markProcessed: async () => { processed += 1; },
      markFailed: async () => {},
    },
  });
  const headers = {
    'paypal-auth-algo': 'SHA256withRSA',
    'paypal-cert-url': 'https://example.com/cert',
    'paypal-transmission-id': 'transmission-id',
    'paypal-transmission-sig': 'signature',
    'paypal-transmission-time': '2026-09-14T12:00:00Z',
  };

  const result = await service.processWebhook({
    headers,
    event: {
      id: 'WH-TEST-12345678',
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: {},
    },
  });

  assert.deepEqual(result, { received: true, duplicate: true });
  assert.equal(verified, 1);
  assert.equal(processed, 0);
});
