import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateParkingPriceByLicensePlate,
  calculateParkingPriceForLot,
} from '../utils/parkingPricing.js';

const DAY_MINUTES = 24 * 60;

test('free lots return zero for any duration', () => {
  const lot = { isFree: true };
  assert.equal(calculateParkingPriceForLot(lot, 3 * DAY_MINUTES), 0);
});

test('zero free-hour lots charge immediately from minute one', () => {
  const lot = { freeFirstHours: 0, pricePerMinute: 0.2 };
  assert.equal(calculateParkingPriceForLot(lot, 30), 600);
});

test('legacy flat-fee lots keep the old total fee behavior', () => {
  const lot = { parkingFeeMinor: 1800 };
  assert.equal(calculateParkingPriceForLot(lot, 30), 1800);
});

test('free hours apply before minute billing starts', () => {
  const lot = {
    freeFirstHours: 2,
    pricePerMinute: 0.3,
  };

  assert.equal(calculateParkingPriceForLot(lot, 60), 0);
  assert.equal(calculateParkingPriceForLot(lot, 180), 1800);
});

test('multi-day stays charge full day blocks plus the remainder', () => {
  const lot = {
    pricePerMinute: 0.2,
    fullDayPriceMinor: 1800,
  };

  const totalMinutes = DAY_MINUTES + 4 * 60;
  const amountMinor = calculateParkingPriceForLot(lot, totalMinutes);

  assert.equal(amountMinor, 1800 + 4800);
});

test('full-day-only lots round to a daily charge', () => {
  const lot = {
    fullDayPriceMinor: 2500,
  };

  assert.equal(calculateParkingPriceForLot(lot, 2 * 60), 0);
  assert.equal(calculateParkingPriceForLot(lot, 3 * DAY_MINUTES + 60), 7500);
});

test('fractional elapsed minutes are rounded to integer minor-unit pricing', () => {
  const lot = {
    freeFirstHours: 0,
    pricePerMinute: 0.2,
  };

  assert.equal(calculateParkingPriceForLot(lot, 30.5), 610);
  assert.equal(calculateParkingPriceForLot(lot, 30.333), 607);
});

test('nested pricing object is treated the same as legacy top-level fields', () => {
  const lot = {
    pricing: {
      freeFirstHours: 1,
      pricePerMinute: 0.25,
      fullDayPriceMinor: 1800,
      parkingFeeMinor: 0,
      isFree: false,
    },
  };

  assert.equal(calculateParkingPriceForLot(lot, 60), 0);
  assert.equal(calculateParkingPriceForLot(lot, 180), 3000);
});

test('paid sessions remain free during the exit window and accrue only new debt afterward', () => {
  const session = {
    _id: 'session-1',
    checkoutStatus: 'paid',
    entryTime: new Date('2026-09-14T10:00:00.000Z'),
    parkingLot: { pricePerMinute: 0.2 },
  };
  const payments = [{
    parkingSession: session._id,
    paypalPaymentStatus: 'COMPLETED',
    amountMinor: 1200,
    paidAt: new Date('2026-09-14T11:00:00.000Z'),
  }];

  assert.equal(calculateParkingPriceByLicensePlate({
    session,
    payments,
    now: () => new Date('2026-09-14T11:14:59.000Z'),
  }), 0);
  assert.equal(calculateParkingPriceByLicensePlate({
    session,
    payments,
    now: () => new Date('2026-09-14T11:30:00.000Z'),
  }), 600);
});

test('authorized vehicle sessions never accrue parking debt', () => {
  const session = {
    _id: 'session-1',
    checkoutStatus: 'pass',
    entryTime: new Date('2026-09-14T10:00:00.000Z'),
    parkingLot: { pricePerMinute: 0.2 },
  };

  assert.equal(calculateParkingPriceByLicensePlate({
    session,
    now: () => new Date('2026-09-15T10:00:00.000Z'),
  }), 0);
});
