import parkingLotRepo from '../repositories/parkingLotRepo.js';
import parkingSpotRepo from '../repositories/parkingSpotRepo.js';
import cityRepo from '../repositories/cityRepo.js';
import mongoose from 'mongoose';
import parkingSessionRepo from '../repositories/parkingSessionRepo.js';
import parkingPaymentRepo from '../repositories/parkingPaymentRepo.js';
import { emitParkingSpotUpdate, emitParkingSpotUpdateToAuthorizedUsers } from './socketService.js';
import { calculateHaversineDistanceKm } from '../utils/geo.js';
import { normalizeLicensePlate } from '../utils/licensePlate.js';
import AppError from '../errors/AppError.js';
import ParkingLot from '../models/ParkingLot.js';
import ParkingSpot from '../models/ParkingSpot.js';

const throwValidationError = (message) => {
  throw new AppError(message, { statusCode: 400, code: 'VALIDATION_ERROR' });
};

const validateDocument = async (document, label) => {
  try {
    await document.validate();
  } catch (validationError) {
    const message = Object.values(validationError.errors || {})[0]?.message || validationError.message;
    throwValidationError(`${label}: ${message}`);
  }
};

export const validateSpotDefinitions = async (
  spotDefinitions,
  { allowedLevels, requiredLevel, requireSpots = true } = {},
) => {
  if (!Array.isArray(spotDefinitions)) throwValidationError('spots must be an array');
  if (requireSpots && spotDefinitions.length === 0) {
    throwValidationError('At least one parking spot is required');
  }

  const spotKeys = new Set();
  const normalizedSpots = spotDefinitions.map((definition, index) => {
    if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
      throwValidationError(`spots[${index}] must be an object`);
    }

    const level = Number(definition.level ?? requiredLevel);
    const spotNumber = String(definition.spotNumber ?? '').trim();
    if (!Number.isSafeInteger(level) || level < 1) {
      throwValidationError(`spots[${index}].level must be a positive integer`);
    }
    if (requiredLevel !== undefined && level !== requiredLevel) {
      throwValidationError(`All spots must belong to level ${requiredLevel}`);
    }
    if (allowedLevels !== undefined && level > allowedLevels) {
      throwValidationError(`spots[${index}].level exceeds the parking lot level count`);
    }

    const key = `${level}:${spotNumber}`;
    if (!spotNumber || spotKeys.has(key)) {
      throwValidationError('Each spot must have a unique non-empty number on its level');
    }
    spotKeys.add(key);

    const spot = {
      level,
      spotNumber,
      status: definition.status ?? 'free',
      type: definition.type ?? 'regular',
      currentCarLicensePlate: definition.currentCarLicensePlate ?? null,
    };
    return spot;
  });

  await Promise.all(normalizedSpots.map((spot, index) => validateDocument(
    new ParkingSpot({ ...spot, parkingLot: new mongoose.Types.ObjectId() }),
    `Invalid parking spot at index ${index}`,
  )));
  return normalizedSpots;
};

export const getAuthorizedCityIds = (user) => {
  if (!user) {
    throw new AppError('Authentication is required', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  const cityIds = user.authorizedCities || [];
  if (cityIds.length === 0) {
    throw new AppError('No authorized cities are assigned', { statusCode: 403, code: 'FORBIDDEN' });
  }
  return cityIds;
};

const assertAuthorizedForCity = (user, cityId) => {
  const cityIds = getAuthorizedCityIds(user);
  if (!cityIds.some((id) => id.toString() === cityId.toString())) {
    throw new AppError('Not authorized for this city', { statusCode: 403, code: 'FORBIDDEN' });
  }
};

const groupByParkingLot = (documents) => documents.reduce((groups, document) => {
  const key = document.parkingLot.toString();
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(document);
  return groups;
}, new Map());

const attachSpots = async (parkingLots, { includeLicensePlate = false } = {}) => {
  const spots = await parkingSpotRepo.findSpotsByLots(
    parkingLots.map((lot) => lot._id), { includeLicensePlate },
  );
  const spotsByLot = groupByParkingLot(spots);
  return parkingLots.map((lot) => ({
    ...lot.toObject(),
    totalSpots: (spotsByLot.get(lot._id.toString()) || []).length,
    spots: (spotsByLot.get(lot._id.toString()) || []).map((spot) => spot.toObject()),
  }));
};

const normalizeAuthorizedVehicles = (lotData) => {
  if (lotData.authorizedVehicles === undefined) return lotData;
  if (
    !Array.isArray(lotData.authorizedVehicles)
    || lotData.authorizedVehicles.some((plate) => (
      typeof plate !== 'string' || normalizeLicensePlate(plate) === ''
    ))
  ) {
    throw new AppError('authorizedVehicles must be a list of license plate strings', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }
  return {
    ...lotData,
    authorizedVehicles: [...new Set(lotData.authorizedVehicles.map(normalizeLicensePlate))],
  };
};

export const buildSpotUpdatePayloads = (parkingLot, spot, action = 'updated') => {
  const publicPayload = {
    parkingLot: {
      id: parkingLot._id.toString(),
      name: parkingLot.name,
      totalSpots: parkingLot.totalSpots,
    },
    city: {
      id: parkingLot.city._id.toString(),
      name: parkingLot.city.name,
    },
    spot: {
      id: spot._id.toString(),
      status: spot.status,
      type: spot.type,
      level: spot.level,
      spotNumber: spot.spotNumber,
    },
    action,
  };
  return {
    publicPayload,
    authorizedPayload: {
      ...publicPayload,
      spot: { ...publicPayload.spot, currentCarLicensePlate: spot.currentCarLicensePlate },
    },
  };
};

export const deleteParkingLotRelations = async (
  parkingLotId,
  dbSession,
  repositories = {
    payment: parkingPaymentRepo,
    parkingSession: parkingSessionRepo,
    spot: parkingSpotRepo,
    lot: parkingLotRepo,
    city: cityRepo,
  },
  cityId,
) => {
  await repositories.payment.deleteByParkingLot(parkingLotId, dbSession);
  await repositories.parkingSession.deleteByParkingLot(parkingLotId, dbSession);
  await repositories.spot.deleteByParkingLot(parkingLotId, dbSession);
  if (cityId) await repositories.city.removeParkingLot(cityId, parkingLotId, dbSession);
  await repositories.lot.deleteLot(parkingLotId, dbSession);
};

const publishSpotUpdate = async (parkingLot, spot, action = 'updated') => {
  if (!parkingLot || !parkingLot.city || !spot) {
    return;
  }

  const { publicPayload, authorizedPayload } = buildSpotUpdatePayloads(parkingLot, spot, action);
  emitParkingSpotUpdate(parkingLot.city.name, publicPayload);
  await emitParkingSpotUpdateToAuthorizedUsers(parkingLot.city._id, authorizedPayload);
};

// ==========================================
//               CITY SERVICES
// ==========================================

const fetchAllCities = async () => {
  return await cityRepo.findAllCities();
};

const fetchAuthorizedCities = async (user) => {
  const authorizedCities = getAuthorizedCityIds(user);

  return await cityRepo.findCitiesByIds(authorizedCities);
};

// ==========================================
//           PARKING LOT SERVICES
// ==========================================

const fetchParkingLots = async (user) => {
  const authorizedCities = getAuthorizedCityIds(user);
  return await parkingLotRepo.findAllLots({ city: { $in: authorizedCities } }, { includeAuthorizedVehicles: true });
};

const fetchAllParkingLotsWithSpots = async () => {
  const parkingLots = await parkingLotRepo.findAllLots();
  return attachSpots(parkingLots);
};

const fetchNearbyParkingLots = async (lat, lng) => {
  const parkingLots = await parkingLotRepo.findAllLots();
  const lotsWithDetails = await attachSpots(parkingLots);

  return lotsWithDetails
    .filter((parkingLot) => (
      Number.isFinite(parkingLot.location?.lat)
      && Number.isFinite(parkingLot.location?.lng)
    ))
    .map((parkingLot) => {
      const distanceKm = calculateHaversineDistanceKm(
        { lat, lng },
        parkingLot.location,
      );

      return {
        ...parkingLot,
        distanceKm: Number(distanceKm.toFixed(3)),
      };
    })
    .sort((firstLot, secondLot) => firstLot.distanceKm - secondLot.distanceKm);
};

const fetchAuthorizedLotsWithDetails = async (user) => {
  const authorizedCities = getAuthorizedCityIds(user);

  const parkingLots = await parkingLotRepo.findAllLots(
    { city: { $in: authorizedCities } }, { includeAuthorizedVehicles: true },
  );

  const [lotsWithSpots, sessions] = await Promise.all([
    attachSpots(parkingLots, { includeLicensePlate: true }),
    parkingSessionRepo.findSessionsByLots(parkingLots.map((lot) => lot._id)),
  ]);
  const sessionsByLot = groupByParkingLot(sessions);
  return lotsWithSpots.map((lot) => ({
    ...lot,
    sessions: (sessionsByLot.get(lot._id.toString()) || []).map((session) => session.toObject()),
  }));
};

const fetchLotsByCity = async (cityName) => {
  const city = await cityRepo.findCityByName(cityName);
  if (!city) {
    throw new Error('City not found');
  }

  const parkingLots = await parkingLotRepo.findAllLots({ city: city._id });

  return attachSpots(parkingLots);
};

const fetchAuthorizedLotsByCity = async (cityId, user) => {
  assertAuthorizedForCity(user, cityId);

  const city = await cityRepo.findCityById(cityId);
  if (!city) {
    throw new Error('City not found');
  }

  const parkingLots = await parkingLotRepo.findAllLots({ city: city._id });

  const [lotsWithSpots, sessions] = await Promise.all([
    attachSpots(parkingLots, { includeLicensePlate: true }),
    parkingSessionRepo.findSessionsByLots(parkingLots.map((lot) => lot._id)),
  ]);
  const sessionsByLot = groupByParkingLot(sessions);
  const lotsWithDetails = lotsWithSpots.map((lot) => ({
    ...lot,
    sessions: (sessionsByLot.get(lot._id.toString()) || []).map((session) => session.toObject()),
  }));

  return { city: city.toObject(), lots: lotsWithDetails };
};

const fetchParkingLotById = async (id) => {
  const parkingLot = await parkingLotRepo.findLotById(id);
  if (!parkingLot) {
    throw new Error('Parking lot not found');
  }
  return (await attachSpots([parkingLot]))[0];
};

const addParkingLot = async (lotData, user, spotDefinitions = []) => {
  const authorizedCities = getAuthorizedCityIds(user);
  if (lotData.city) assertAuthorizedForCity(user, lotData.city);
  if (!lotData.city) lotData.city = authorizedCities[0];
  const levelCount = Number(lotData.levels);
  if (!Number.isSafeInteger(levelCount) || levelCount < 1) {
    throwValidationError('levels must be a positive integer');
  }
  const normalizedSpots = await validateSpotDefinitions(spotDefinitions, { allowedLevels: levelCount });
  const normalizedLotData = normalizeAuthorizedVehicles({
    ...lotData,
    levels: levelCount,
    totalSpots: normalizedSpots.length,
  });
  await validateDocument(new ParkingLot(normalizedLotData), 'Invalid parking lot');

  const city = await cityRepo.findCityById(normalizedLotData.city);
  if (!city) throwValidationError('city must reference an existing city');

  const dbSession = await mongoose.startSession();
  let parkingLot;
  try {
    await dbSession.withTransaction(async () => {
      parkingLot = await parkingLotRepo.createLot(normalizedLotData, dbSession);
      await parkingSpotRepo.createSpots(normalizedSpots.map((spot) => ({
        ...spot,
        parkingLot: parkingLot._id,
      })), dbSession);
      await cityRepo.addParkingLot(parkingLot.city, parkingLot._id, dbSession);

      const stats = await parkingSpotRepo.getSpotStatsByLot(parkingLot._id, dbSession);
      if (parkingLot.totalSpots !== stats.totalSpots) {
        parkingLot = await parkingLotRepo.updateLot(
          parkingLot._id,
          { totalSpots: stats.totalSpots },
          dbSession,
        );
      }
    });
  } finally {
    await dbSession.endSession();
  }

  const createdLot = await parkingLotRepo.findLotById(parkingLot._id);
  const spots = await parkingSpotRepo.findSpotsByLot(parkingLot._id);
  return {
    ...createdLot.toObject(),
    totalSpots: spots.length,
    availableSpots: spots.filter((spot) => spot.status === 'free').length,
    spots: spots.map((spot) => spot.toObject()),
  };
};

const fetchPriceList = async () => parkingLotRepo.findPriceList();

const editParkingLot = async (id, updateData, user) => {
  const existingLot = await parkingLotRepo.findLotById(id);
  
  if (!existingLot) {
    throw new Error('Parking Lot not found');
  }

  // Check authorization: User can only update if it's in their city
  assertAuthorizedForCity(user, existingLot.city._id);

  const normalizedUpdate = normalizeAuthorizedVehicles(updateData);
  if (normalizedUpdate.city) assertAuthorizedForCity(user, normalizedUpdate.city);
  delete normalizedUpdate.totalSpots;
  delete normalizedUpdate.levels;
  const updatedLot = await parkingLotRepo.updateLot(id, normalizedUpdate);

  if (updatedLot && normalizedUpdate.authorizedVehicles !== undefined) {
    // Reconcile both additions and removals so active sessions always reflect
    // the complete saved list. Preserve checkout credentials and payment history.
    await parkingSessionRepo.reconcileAuthorizedVehicleStatuses(
      updatedLot._id,
      updatedLot.authorizedVehicles || [],
    );
  }

  return updatedLot;
};

const removeParkingLot = async (id, user) => {
  const existingLot = await parkingLotRepo.findLotById(id);
  
  if (!existingLot) {
     throw new Error('Parking Lot not found');
  }

  assertAuthorizedForCity(user, existingLot.city._id);

  const dbSession = await mongoose.startSession();
  try {
    await dbSession.withTransaction(async () => {
      await deleteParkingLotRelations(id, dbSession, undefined, existingLot.city._id);
    });
  } finally {
    await dbSession.endSession();
  }
};

const addLevel = async (lotId, spotInput, user) => {
  const lot = await parkingLotRepo.findLotById(lotId);
  if (!lot) throw new AppError('Parking Lot not found', { statusCode: 404, code: 'NOT_FOUND' });
  assertAuthorizedForCity(user, lot.city._id);
  const level = lot.levels + 1;
  let requestedSpots = spotInput;
  if (!Array.isArray(requestedSpots)) {
    const spotCount = Number(requestedSpots);
    if (!Number.isSafeInteger(spotCount) || spotCount < 1 || spotCount > 32) {
      throwValidationError('spots must be an array (or spotCount must be an integer between 1 and 32)');
    }
    requestedSpots = Array.from({ length: spotCount }, (_, index) => ({
      level,
      spotNumber: String(level * 100 + index + 1),
      status: 'free',
      type: 'regular',
    }));
  }
  if (requestedSpots.length > 32) throwValidationError('A level cannot contain more than 32 spots');
  const normalizedSpots = await validateSpotDefinitions(requestedSpots, { requiredLevel: level });

  const dbSession = await mongoose.startSession();
  let stats;
  try {
    await dbSession.withTransaction(async () => {
      await parkingSpotRepo.createSpots(normalizedSpots.map((spot) => ({
        ...spot,
        parkingLot: lot._id,
      })), dbSession);
      stats = await parkingSpotRepo.getSpotStatsByLot(lot._id, dbSession);
      await parkingLotRepo.updateLot(
        lot._id,
        { levels: level, totalSpots: stats.totalSpots },
        dbSession,
      );
    });
  } finally {
    await dbSession.endSession();
  }

  const [updatedLot, spots] = await Promise.all([
    parkingLotRepo.findLotById(lot._id),
    parkingSpotRepo.findSpotsByLotAndLevel(lot._id, level),
  ]);
  return {
    parkingLot: updatedLot,
    level,
    totalSpots: stats.totalSpots,
    availableSpots: stats.availableSpots,
    spots,
  };
};

const removeLevel = async (lotId, level, user) => {
  const lot = await parkingLotRepo.findLotById(lotId);
  if (!lot) throw new AppError('Parking Lot not found', { statusCode: 404, code: 'NOT_FOUND' });
  assertAuthorizedForCity(user, lot.city._id);
  if (!Number.isSafeInteger(level) || level !== lot.levels || level <= 1) {
    throw new AppError('Only the last level can be removed', { statusCode: 400, code: 'VALIDATION_ERROR' });
  }
  const dbSession = await mongoose.startSession();
  let removedSpots = 0;
  let stats;
  try {
    await dbSession.withTransaction(async () => {
      const spots = await parkingSpotRepo.findSpotsByLotAndLevel(lotId, level, dbSession);
      const linkedSessions = await parkingSessionRepo.countByParkingSpots(spots.map((spot) => spot._id), dbSession);
      if (linkedSessions > 0) {
        throw new AppError('Cannot remove a level with parking sessions', { statusCode: 409, code: 'LEVEL_IN_USE' });
      }
      removedSpots = spots.length;
      await parkingSpotRepo.deleteByLevel(lotId, level, dbSession);
      stats = await parkingSpotRepo.getSpotStatsByLot(lot._id, dbSession);
      await parkingLotRepo.updateLot(lotId, {
        levels: level - 1,
        totalSpots: stats.totalSpots,
      }, dbSession);
    });
  } finally {
    await dbSession.endSession();
  }

  return {
    parkingLot: await parkingLotRepo.findLotById(lot._id),
    removedLevel: level,
    levels: level - 1,
    removedSpots,
    totalSpots: stats.totalSpots,
    availableSpots: stats.availableSpots,
    spots: [],
  };
};

// ==========================================
//          PARKING SPOT SERVICES
// ==========================================

const fetchSpotsByLotAndLevel = async (lotId, level, includeLot = false) => {
  const spots = await parkingSpotRepo.findPublicSpotsByLot(lotId, level);
  if (includeLot) {
    const parkingLot = await parkingLotRepo.findLotById(lotId);
    return { parkingLot, spots };
  }
  return spots;
};

const fetchSpotsByLot = async (lotId) => {
  return await parkingSpotRepo.findPublicSpotsByLot(lotId);
};

const addSpot = async (spotData, user) => {
  const lot = await parkingLotRepo.findLotById(spotData.parkingLot);
  if (!lot) {
    throw new Error('Parking Lot not found');
  }
  assertAuthorizedForCity(user, lot.city._id);

  const dbSession = await mongoose.startSession();
  let createdSpot;
  let updatedLot;
  try {
    await dbSession.withTransaction(async () => {
      createdSpot = await parkingSpotRepo.createSpot(spotData, dbSession);
      const totalSpots = await parkingSpotRepo.countSpotsByLot(lot._id, dbSession);
      updatedLot = await parkingLotRepo.updateLot(lot._id, { totalSpots }, dbSession);
    });
  } finally {
    await dbSession.endSession();
  }
  await publishSpotUpdate(updatedLot || lot, createdSpot, 'created');
  return createdSpot;
};

const editSpot = async (id, updateData, user) => {
  const existingSpot = await parkingSpotRepo.findSpotById(id);
  if (!existingSpot) throw new Error('Parking Spot not found');

  const lot = await parkingLotRepo.findLotById(existingSpot.parkingLot);
  if (!lot) throw new Error('Associated parking lot not found');

  assertAuthorizedForCity(user, lot.city._id);

  // If attempting to change parkingLot, verify authorization for the target lot as well
  if (updateData.parkingLot) {
    const targetLot = await parkingLotRepo.findLotById(updateData.parkingLot);
    if (!targetLot) throw new Error('Target parking lot not found');
    assertAuthorizedForCity(user, targetLot.city._id);
  }

  const movedToAnotherLot = updateData.parkingLot
    && updateData.parkingLot.toString() !== existingSpot.parkingLot.toString();

  if (movedToAnotherLot) {
    const dbSession = await mongoose.startSession();
    let updatedSpot;
    let targetLot;
    try {
      await dbSession.withTransaction(async () => {
        updatedSpot = await parkingSpotRepo.updateSpot(id, updateData, dbSession);
        const sourceTotal = await parkingSpotRepo.countSpotsByLot(existingSpot.parkingLot, dbSession);
        const targetTotal = await parkingSpotRepo.countSpotsByLot(updateData.parkingLot, dbSession);
        await parkingLotRepo.updateLot(existingSpot.parkingLot, { totalSpots: sourceTotal }, dbSession);
        targetLot = await parkingLotRepo.updateLot(updateData.parkingLot, { totalSpots: targetTotal }, dbSession);
      });
    } finally {
      await dbSession.endSession();
    }
    const sourceLot = await parkingLotRepo.findLotById(existingSpot.parkingLot);
    await publishSpotUpdate(sourceLot || lot, existingSpot, 'deleted');
    await publishSpotUpdate(targetLot, updatedSpot, 'created');
    return updatedSpot;
  }

  const updatedSpot = await parkingSpotRepo.updateSpot(id, updateData);
  await publishSpotUpdate(lot, updatedSpot);
  return updatedSpot;
};

const removeSpot = async (id, user) => {
  const existingSpot = await parkingSpotRepo.findSpotById(id);
  if (!existingSpot) throw new Error('Parking Spot not found');

  const lot = await parkingLotRepo.findLotById(existingSpot.parkingLot);
  if (!lot) throw new Error('Associated parking lot not found');

  assertAuthorizedForCity(user, lot.city._id);

  const dbSession = await mongoose.startSession();
  let deletedSpot;
  let updatedLot;
  try {
    await dbSession.withTransaction(async () => {
      const linkedSessions = await parkingSessionRepo.countByParkingSpots([existingSpot._id], dbSession);
      if (linkedSessions > 0) {
        throw new AppError('Cannot delete a spot with parking sessions', { statusCode: 409, code: 'SPOT_IN_USE' });
      }
      deletedSpot = await parkingSpotRepo.deleteSpot(id, dbSession);
      if (existingSpot.spotNumber) {
        await parkingSpotRepo.renumberSpotsAfterDeletion(
          existingSpot.parkingLot, existingSpot.level, existingSpot.spotNumber, dbSession,
        );
      }
      const totalSpots = await parkingSpotRepo.countSpotsByLot(lot._id, dbSession);
      updatedLot = await parkingLotRepo.updateLot(lot._id, { totalSpots }, dbSession);
    });
  } finally {
    await dbSession.endSession();
  }
  await publishSpotUpdate(updatedLot || lot, existingSpot, 'deleted');
  return deletedSpot;
};

export default {
  fetchAllCities,
  fetchAuthorizedCities,
  fetchParkingLots,
  fetchAllParkingLotsWithSpots,
  fetchNearbyParkingLots,
  fetchAuthorizedLotsWithDetails,
  fetchAuthorizedLotsByCity,
  fetchLotsByCity,
  fetchParkingLotById,
  fetchPriceList,
  addParkingLot,
  editParkingLot,
  removeParkingLot,
  addLevel,
  removeLevel,
  fetchSpotsByLotAndLevel,
  fetchSpotsByLot,
  addSpot,
  editSpot,
  removeSpot,
};
