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
  return await City.find({}, 'name'); // Return only the name field (along with _id by default)
};

export default { findCityByName, findCityById, findCitiesByIds, findAllCities };