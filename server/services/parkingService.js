const parkingLotRepo = require('../repositories/parkingLotRepo');
const parkingSpotRepo = require('../repositories/parkingSpotRepo');
const cityRepo = require('../repositories/cityRepo');

const fetchParkingLots = async (user) => {
  let query = {};
  if (user && user.authorizedCity) {
    query.city = user.authorizedCity;
  }
  return await parkingLotRepo.findAllLots(query);
};

const fetchLotsByCity = async (cityName) => {
  const city = await cityRepo.findCityByName(cityName);
  if (!city) {
    throw new Error('City not found');
  }
  return await parkingLotRepo.findAllLots({ city: city._id });
};

const fetchAllCities = async () => {
  return await cityRepo.findAllCities();
};

const fetchParkingLotById = async (id) => {
  const parkingLot = await parkingLotRepo.findLotById(id);
  if (!parkingLot) {
    throw new Error('Parking lot not found');
  }
  return parkingLot;
};

const addParkingLot = async (lotData) => {
  return await parkingLotRepo.createLot(lotData);
};

const editParkingLot = async (id, updateData, user) => {
  const existingLot = await parkingLotRepo.findLotById(id);
  
  if (!existingLot) {
    throw new Error('Parking Lot not found');
  }

  // Check authorization: User can only update if it's in their city
  if (user.authorizedCity && existingLot.city._id.toString() !== user.authorizedCity.toString()) {
    throw new Error('Not authorized to update this parking lot');
  }

  return await parkingLotRepo.updateLot(id, updateData);
};

const removeParkingLot = async (id, user) => {
  const existingLot = await parkingLotRepo.findLotById(id);
  
  if (!existingLot) {
     throw new Error('Parking Lot not found');
  }

  if (user.authorizedCity && existingLot.city._id.toString() !== user.authorizedCity.toString()) {
    throw new Error('Not authorized to delete this parking lot');
  }

  return await parkingLotRepo.deleteLot(id);
};

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
  if (user && user.authorizedCity && lot.city._id.toString() !== user.authorizedCity.toString()) {
    throw new Error('Not authorized to add spot to this parking lot');
  }
  return await parkingSpotRepo.createSpot(spotData);
};

const editSpot = async (id, updateData, user) => {
  return await parkingSpotRepo.updateSpot(id, updateData);
};

const removeSpot = async (id, user) => {
  return await parkingSpotRepo.deleteSpot(id);
};

module.exports = {
  fetchParkingLots,
  fetchLotsByCity,
  fetchParkingLotById,
  fetchAllCities,
  addParkingLot,
  editParkingLot,
  removeParkingLot,
  fetchSpotsByLotAndLevel,
  fetchSpotsByLot,
  addSpot,
  editSpot,
  removeSpot
};
