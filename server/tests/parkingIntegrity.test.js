import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSpotUpdatePayloads,
  deleteParkingLotRelations,
  validateSpotDefinitions,
} from '../services/parkingService.js';
import ParkingSpot from '../models/ParkingSpot.js';
import ParkingSession from '../models/ParkingSession.js';

test('spot identity is unique within a parking lot and level', () => {
  const uniqueIndex = ParkingSpot.schema.indexes().find(([fields, options]) => (
    fields.parkingLot === 1 && fields.level === 1 && fields.spotNumber === 1 && options.unique
  ));
  assert.ok(uniqueIndex);
});

test('new parking sessions require a real parking spot', () => {
  assert.equal(ParkingSession.schema.path('parkingSpot').isRequired, true);
});

test('bulk spot validation normalizes valid spots before a transaction starts', async () => {
  const spots = await validateSpotDefinitions([
    { spotNumber: 201, status: 'free', type: 'regular' },
  ], { requiredLevel: 2 });

  assert.deepEqual(spots, [{
    level: 2,
    spotNumber: '201',
    status: 'free',
    type: 'regular',
    currentCarLicensePlate: null,
  }]);
});

test('bulk spot validation rejects duplicate spot identities', async () => {
  await assert.rejects(
    validateSpotDefinitions([
      { level: 1, spotNumber: '101' },
      { level: 1, spotNumber: '101' },
    ], { allowedLevels: 1 }),
    (error) => error.statusCode === 400 && error.code === 'VALIDATION_ERROR',
  );
});

test('public socket payload omits license plate while authorized payload includes it', () => {
  const lot = { _id: 'lot-1', name: 'Lot', totalSpots: 5, city: { _id: 'city-1', name: 'City' } };
  const spot = {
    _id: 'spot-1', status: 'occupied', type: 'regular', level: 1,
    spotNumber: '101', currentCarLicensePlate: '12345678',
  };
  const { publicPayload, authorizedPayload } = buildSpotUpdatePayloads(lot, spot);
  assert.equal('currentCarLicensePlate' in publicPayload.spot, false);
  assert.equal(authorizedPayload.spot.currentCarLicensePlate, '12345678');
});

test('parking lot cascade removes payments, sessions, spots, then the lot', async () => {
  const calls = [];
  const makeRepo = (method, label) => ({ [method]: async (id, session) => calls.push([label, id, session]) });
  const repositories = {
    payment: makeRepo('deleteByParkingLot', 'payments'),
    parkingSession: makeRepo('deleteByParkingLot', 'sessions'),
    spot: makeRepo('deleteByParkingLot', 'spots'),
    lot: makeRepo('deleteLot', 'lot'),
  };
  const session = { id: 'transaction' };
  await deleteParkingLotRelations('lot-1', session, repositories);
  assert.deepEqual(calls.map(([label]) => label), ['payments', 'sessions', 'spots', 'lot']);
  assert.ok(calls.every(([, id, passedSession]) => id === 'lot-1' && passedSession === session));
});
