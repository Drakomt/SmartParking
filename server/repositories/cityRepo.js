import City from '../models/City.js';

const findCityByName = async (name) => {
  return await City.findOne({ name });
};

const findCityById = async (id) => {
  return await City.findById(id);
};

const findCitiesByIds = async (ids) => {
  return await City.find({ _id: { $in: ids } }, 'name');
};

const findAllCities = async () => {
  return await City.find({}, 'name');
};

const addParkingLot = async (cityId, parkingLotId, session = null) => (
  City.findByIdAndUpdate(cityId, { $addToSet: { parkingLots: parkingLotId } }, { session })
);

const removeParkingLot = async (cityId, parkingLotId, session = null) => (
  City.findByIdAndUpdate(cityId, { $pull: { parkingLots: parkingLotId } }, { session })
);

export default { findCityByName, findCityById, findCitiesByIds, findAllCities, addParkingLot, removeParkingLot };
