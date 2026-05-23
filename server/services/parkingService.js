const parkingRepo = require('../repositories/parkingRepo');

const fetchParkingLots = async (user) => {
  let query = {};
  if (user && user.authorizedCity) {
    query.city = user.authorizedCity;
  }
  return await parkingRepo.findAllLots(query);
};

const fetchLotsByCity = async (cityName) => {
  const city = await parkingRepo.findCityByName(cityName);
  if (!city) {
    throw new Error('City not found');
  }
  return await parkingRepo.findAllLots({ city: city._id });
};

const fetchParkingByName = async (name) => {
  const parkingLot = await parkingRepo.findOneLot({ name });
  if (!parkingLot) {
    throw new Error('Parking not found');
  }
  return parkingLot;
};

const addParkingLot = async (lotData) => {
  return await parkingRepo.createLot(lotData);
};

const editParkingLot = async (id, updateData, user) => {
  const existingLot = await parkingRepo.findLotById(id);
  
  if (!existingLot) {
    throw new Error('Parking Lot not found');
  }

  // Check authorization: User can only update if it's in their city
  if (user.authorizedCity && existingLot.city._id.toString() !== user.authorizedCity.toString()) {
    throw new Error('Not authorized to update this parking lot');
  }

  return await parkingRepo.updateLot(id, updateData);
};

const removeParkingLot = async (id, user) => {
  const existingLot = await parkingRepo.findLotById(id);
  
  if (!existingLot) {
     throw new Error('Parking Lot not found');
  }

  if (user.authorizedCity && existingLot.city._id.toString() !== user.authorizedCity.toString()) {
    throw new Error('Not authorized to delete this parking lot');
  }

  return await parkingRepo.deleteLot(id);
};

module.exports = {
  fetchParkingLots,
  fetchLotsByCity,
  fetchParkingByName,
  addParkingLot,
  editParkingLot,
  removeParkingLot
};
