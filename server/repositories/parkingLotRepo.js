import ParkingLot from '../models/ParkingLot.js';

const findAllLots = async (query = {}) => {
  return await ParkingLot.find(query).populate('_id', 'name');
};

const findLotById = async (id) => {
  return await ParkingLot.findById(id).populate('city', 'name');
};

const findOneLot = async (query = {}) => {
  return await ParkingLot.findOne(query).populate('city', 'name');
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

export default { findAllLots, findLotById, findOneLot, createLot, updateLot, deleteLot };