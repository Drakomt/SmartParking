const City = require('../models/City');

const findCityByName = async (name) => {
  return await City.findOne({ name });
};

const findAllCities = async () => {
  return await City.find({}, 'name'); // Return only the name field (along with _id by default)
};

module.exports = {
  findCityByName,
  findAllCities
};