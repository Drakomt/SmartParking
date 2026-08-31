import ParkingLot from '../models/ParkingLot.js';

const findAllLots = async (query = {}, { includeAuthorizedVehicles = false } = {}) => {
  const lots = ParkingLot.find(query);
  if (includeAuthorizedVehicles) lots.select('+authorizedVehicles');
  return await lots;
};

const findLotForEntry = async (id) => (
  ParkingLot.findById(id).select('+authorizedVehicles').populate('city', 'name')
);

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
  return await ParkingLot.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    .select('+authorizedVehicles').populate('city', 'name');
};

const deleteLot = async (id) => {
  return await ParkingLot.findByIdAndDelete(id);
};

export default { findAllLots, findLotById, findLotForEntry, findOneLot, createLot, updateLot, deleteLot };
