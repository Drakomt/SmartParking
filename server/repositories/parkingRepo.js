const ParkingLot = require('../models/ParkingLot');
const City = require('../models/City');

const findAllLots = async (query = {}) => {
  return await ParkingLot.find(query).populate('city', 'name');
};

const findLotById = async (id) => {
  return await ParkingLot.findById(id).populate('city', 'name');
};

const findOneLot = async (query = {}) => {
  return await ParkingLot.findOne(query).populate('city', 'name');
};

const findCityByName = async (name) => {
  return await City.findOne({ name });
};

const createLot = async (lotData) => {
  const parkingLot = new ParkingLot(lotData);
  return await parkingLot.save();
};

const updateLot = async (id, updateData) => {
  return await ParkingLot.findByIdAndUpdate(id, updateData, { new: true }).populate('city', 'name');
};

const deleteLot = async (id) => {
  return await ParkingLot.findByIdAndDelete(id);
};

module.exports = {
  findAllLots,
  findLotById,
  findOneLot,
  findCityByName,
  createLot,
  updateLot,
  deleteLot
};
