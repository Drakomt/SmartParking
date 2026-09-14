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
  const service = createPayPalCheckoutService({
    sessionRepo: {
      findByCheckoutIdWithLot: async () => parkingSession,
      completeCheckoutOnce: async () => parkingSession,
    },
    paymentRepo: { findByPayPalOrderId: async () => payment },
  });
  const result = await service.captureOrder({
    paypalOrderId: payment.paypalOrderId,
    checkoutId: payment.checkoutId,
    checkoutToken,
  });
  assert.equal(result.graceExpiresAt, '2026-09-14T12:15:00.000Z');
});
