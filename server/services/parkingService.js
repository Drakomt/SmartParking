import parkingLotRepo from '../repositories/parkingLotRepo.js';
import parkingSpotRepo from '../repositories/parkingSpotRepo.js';
import cityRepo from '../repositories/cityRepo.js';
import parkingSessionRepo from '../repositories/parkingSessionRepo.js';
import { emitParkingSpotUpdate, emitParkingSpotUpdateToAuthorizedUsers } from './socketService.js';
import { calculateHaversineDistanceKm } from '../utils/geo.js';
import { normalizeLicensePlate } from '../utils/licensePlate.js';
import AppError from '../errors/AppError.js';

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

const publishSpotUpdate = async (parkingLot, spot) => {
  if (!parkingLot || !parkingLot.city || !spot) {
    return;
  }

  const payload = {
    parkingLot: {
      id: parkingLot._id.toString(),
      name: parkingLot.name,
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
      currentCarLicensePlate: spot.currentCarLicensePlate,
    },
  };

  emitParkingSpotUpdate(parkingLot.city.name, payload);
  await emitParkingSpotUpdateToAuthorizedUsers(parkingLot.city._id, payload);
};

// ==========================================
//               CITY SERVICES
// ==========================================

const fetchAllCities = async () => {
  return await cityRepo.findAllCities();
};

const fetchAuthorizedCities = async (user) => {
  if (!user) {
    throw new Error('Not authorized');
  }

  const authorizedCities = user.authorizedCities || [];
  if (!authorizedCities.length) {
    return [];
  }

  return await cityRepo.findCitiesByIds(authorizedCities);
};

// ==========================================
//           PARKING LOT SERVICES
// ==========================================

const fetchParkingLots = async (user) => {
  let query = {};
  if (user && (user.authorizedCities?.length > 0 || user.authorizedCity)) {
    const authorizedCities = user.authorizedCities?.length > 0 ? user.authorizedCities : [user.authorizedCity];
    query.city = { $in: authorizedCities };
  }
  return await parkingLotRepo.findAllLots(query, { includeAuthorizedVehicles: true });
};

const fetchAllParkingLotsWithSpots = async () => {
  const parkingLots = await parkingLotRepo.findAllLots();

  return await Promise.all(
    parkingLots.map(async (parkingLot) => {
      const spots = await parkingSpotRepo.findSpotsByLot(parkingLot._id);
      return {
        ...parkingLot.toObject(),
        spots: spots.map((spot) => spot.toObject()),
      };
    })
  );
};

const fetchNearbyParkingLots = async (lat, lng) => {
  const parkingLots = await parkingLotRepo.findAllLots();
  const lotsWithDetails = await Promise.all(
    parkingLots.map(async (parkingLot) => {
      const spots = await parkingSpotRepo.findSpotsByLot(parkingLot._id);

      return {
        ...parkingLot.toObject(),
        spots: spots.map((spot) => spot.toObject()),
      };
    })
  );

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
  if (!user) {
    throw new Error('Not authorized');
  }

  const authorizedCities = user.authorizedCities || [];
  if (!authorizedCities.length) {
    return [];
  }

  const parkingLots = await parkingLotRepo.findAllLots(
    { city: { $in: authorizedCities } }, { includeAuthorizedVehicles: true },
  );

  return await Promise.all(
    parkingLots.map(async (parkingLot) => {
      const spots = await parkingSpotRepo.findSpotsByLot(parkingLot._id);
      const sessions = await parkingSessionRepo.findSessionsByLot(parkingLot._id);

      return {
        ...parkingLot.toObject(),
        spots: spots.map((spot) => spot.toObject()),
        sessions: sessions.map((session) => session.toObject()),
      };
    })
  );
};

const fetchLotsByCity = async (cityName) => {
  const city = await cityRepo.findCityByName(cityName);
  if (!city) {
    throw new Error('City not found');
  }

  const parkingLots = await parkingLotRepo.findAllLots({ city: city._id });

  const lotsWithSpots = await Promise.all(
    parkingLots.map(async (parkingLot) => {
      const spots = await parkingSpotRepo.findSpotsByLot(parkingLot._id);

      return {
        ...parkingLot.toObject(),
        spots: spots.map((spot) => spot.toObject()),
      };
    })
  );

  return lotsWithSpots;
};

const fetchAuthorizedLotsByCity = async (cityId, user) => {
  if (!user) {
    throw new Error('Not authorized');
  }

  const authorizedCities = user.authorizedCities || [];
  if (!authorizedCities.length || !authorizedCities.some((id) => id.toString() === cityId.toString())) {
    throw new Error('Not authorized to access this city');
  }

  const city = await cityRepo.findCityById(cityId);
  if (!city) {
    throw new Error('City not found');
  }

  const parkingLots = await parkingLotRepo.findAllLots({ city: city._id });

  const lotsWithDetails = await Promise.all(
    parkingLots.map(async (parkingLot) => {
      const spots = await parkingSpotRepo.findSpotsByLot(parkingLot._id);
      const sessions = await parkingSessionRepo.findSessionsByLot(parkingLot._id);

      return {
        ...parkingLot.toObject(),
        spots: spots.map((spot) => spot.toObject()),
        sessions: sessions.map((session) => session.toObject()),
      };
    })
  );

  return { city: city.toObject(), lots: lotsWithDetails };
};

const fetchParkingLotById = async (id) => {
  const parkingLot = await parkingLotRepo.findLotById(id);
  if (!parkingLot) {
    throw new Error('Parking lot not found');
  }
  return parkingLot;
};

const addParkingLot = async (lotData, user) => {
  const authorizedCities = user && user.authorizedCities?.length > 0 ? user.authorizedCities : user && user.authorizedCity ? [user.authorizedCity] : [];
  if (authorizedCities.length > 0) {
    if (lotData.city && !authorizedCities.some((id) => id.toString() === lotData.city.toString())) {
      throw new Error('Not authorized to create a parking lot in this city');
    }
    if (!lotData.city) {
      lotData.city = authorizedCities[0];
    }
  }
  return await parkingLotRepo.createLot(normalizeAuthorizedVehicles(lotData));
};

const editParkingLot = async (id, updateData, user) => {
  const existingLot = await parkingLotRepo.findLotById(id);
  
  if (!existingLot) {
    throw new Error('Parking Lot not found');
  }

  // Check authorization: User can only update if it's in their city
  const authorizedCities = user && user.authorizedCities?.length > 0 ? user.authorizedCities : user && user.authorizedCity ? [user.authorizedCity] : [];
  if (authorizedCities.length > 0 && !authorizedCities.some((id) => id.toString() === existingLot.city._id.toString())) {
    throw new Error('Not authorized to update this parking lot');
  }

  const normalizedUpdate = normalizeAuthorizedVehicles(updateData);
  const updatedLot = await parkingLotRepo.updateLot(id, normalizedUpdate);

  if (updatedLot && normalizedUpdate.authorizedVehicles !== undefined) {
    // Reconcile the entire saved list, not only newly added plates, so a retry
    // also repairs stale sessions. Preserve credentials and payment history.
    await parkingSessionRepo.grantPassToAuthorizedVehicles(
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

  const authorizedCities = user && user.authorizedCities?.length > 0 ? user.authorizedCities : user && user.authorizedCity ? [user.authorizedCity] : [];
  if (authorizedCities.length > 0 && !authorizedCities.some((id) => id.toString() === existingLot.city._id.toString())) {
    throw new Error('Not authorized to delete this parking lot');
  }

  return await parkingLotRepo.deleteLot(id);
};

// ==========================================
//          PARKING SPOT SERVICES
// ==========================================

const fetchSpotsByLotAndLevel = async (lotId, level, includeLot = false) => {
  const spots = await parkingSpotRepo.findSpotsByLotAndLevel(lotId, level);
  if (includeLot) {
    const parkingLot = await parkingLotRepo.findLotById(lotId);
    return { parkingLot, spots };
  }
  return spots;
};

const fetchSpotsByLot = async (lotId) => {
  return await parkingSpotRepo.findSpotsByLot(lotId);
};

const addSpot = async (spotData, user) => {
  const lot = await parkingLotRepo.findLotById(spotData.parkingLot);
  if (!lot) {
    throw new Error('Parking Lot not found');
  }
  const authorizedCities = user && user.authorizedCities?.length > 0 ? user.authorizedCities : user && user.authorizedCity ? [user.authorizedCity] : [];
  if (authorizedCities.length > 0 && !authorizedCities.some((id) => id.toString() === lot.city._id.toString())) {
    throw new Error('Not authorized to add spot to this parking lot');
  }

  const createdSpot = await parkingSpotRepo.createSpot(spotData);
  await publishSpotUpdate(lot, createdSpot);
  return createdSpot;
};

const editSpot = async (id, updateData, user) => {
  const existingSpot = await parkingSpotRepo.findSpotById(id);
  if (!existingSpot) throw new Error('Parking Spot not found');

  const lot = await parkingLotRepo.findLotById(existingSpot.parkingLot);
  if (!lot) throw new Error('Associated parking lot not found');

  const authorizedCities = user && user.authorizedCities?.length > 0 ? user.authorizedCities : user && user.authorizedCity ? [user.authorizedCity] : [];
  if (authorizedCities.length > 0 && !authorizedCities.some((id) => id.toString() === lot.city._id.toString())) {
    throw new Error('Not authorized to update this parking spot');
  }

  // If attempting to change parkingLot, verify authorization for the target lot as well
  if (updateData.parkingLot) {
    const targetLot = await parkingLotRepo.findLotById(updateData.parkingLot);
    if (!targetLot) throw new Error('Target parking lot not found');
    const authorizedCities = user && user.authorizedCities?.length > 0 ? user.authorizedCities : user && user.authorizedCity ? [user.authorizedCity] : [];
    if (authorizedCities.length > 0 && !authorizedCities.some((id) => id.toString() === targetLot.city._id.toString())) {
      throw new Error('Not authorized to move this spot to the target parking lot');
    }
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

  const authorizedCities = user && user.authorizedCities?.length > 0 ? user.authorizedCities : user && user.authorizedCity ? [user.authorizedCity] : [];
  if (authorizedCities.length > 0 && !authorizedCities.some((id) => id.toString() === lot.city._id.toString())) {
    throw new Error('Not authorized to delete this parking spot');
  }

  const deletedSpot = await parkingSpotRepo.deleteSpot(id);
  await publishSpotUpdate(lot, existingSpot);
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
  addParkingLot,
  editParkingLot,
  removeParkingLot,
  fetchSpotsByLotAndLevel,
  fetchSpotsByLot,
  addSpot,
  editSpot,
  removeSpot,
};
