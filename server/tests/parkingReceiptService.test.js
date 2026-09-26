import test from 'node:test';
import assert from 'node:assert/strict';

import { createParkingReceiptService } from '../services/parkingReceiptService.js';
import { validateReceiptBody } from '../utils/paymentValidation.js';
import { hashCheckoutToken } from '../utils/checkoutCredentials.js';

test('receipt content is built only from the completed server-side payment and session', async () => {
  const checkoutId = 'a'.repeat(32);
  const checkoutToken = 'b'.repeat(43);
  const session = {
    _id: 'session-1',
    carLicensePlate: '12345678',
    parkingLot: { name: 'חניון בדיקה' },
    checkoutTokenHash: hashCheckoutToken(checkoutToken),
  };
  const payment = {
    parkingSession: 'session-1',
    checkoutTokenHash: hashCheckoutToken(checkoutToken),
    paypalPaymentStatus: 'COMPLETED',
    amountMinor: 1250,
    currency: 'ILS',
    paidAt: new Date('2026-09-26T10:00:00.000Z'),
  };
  let sentMessage;
  const service = createParkingReceiptService({
    paymentRepo: { findByCheckoutId: async () => payment },
    sessionRepo: {
      findByCheckoutIdWithLot: async () => session,
      findSessionByIdWithLot: async () => session,
    },
    mailer: {
      sendMail: async (message) => {
        sentMessage = message;
        return { success: true, message: 'EMAIL_SENT' };
      },
    },
  });

  await service.sendReceipt({
    email: 'customer@example.com',
    checkoutId,
    checkoutToken,
  });

  assert.equal(sentMessage.to, 'customer@example.com');
  assert.equal(sentMessage.subject, 'Your Smart Parking payment receipt');
  assert.match(sentMessage.html, /12345678/);
  assert.match(sentMessage.html, /12\.50 ILS/);
  assert.match(sentMessage.html, /חניון בדיקה/);
});

test('receipt request validation rejects caller-supplied payment details', () => {
  assert.throws(
    () => validateReceiptBody({
      email: 'customer@example.com',
      checkoutId: 'a'.repeat(32),
      checkoutToken: 'b'.repeat(43),
      amountMinor: 1,
    }),
    (error) => error.statusCode === 400 && error.code === 'VALIDATION_ERROR',
  );
});
