import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateParkingPriceForLot } from '../utils/parkingPricing.js';

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
