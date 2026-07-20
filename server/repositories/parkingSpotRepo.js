import ParkingSpot from '../models/ParkingSpot.js';

const findAllSpots = async () => {
  return await ParkingSpot.find({});
};

const findSpotById = async (id) => {
  return await ParkingSpot.findById(id);
};

const findSpotsByLotAndLevel = async (parkingLotId, level) => {
  return await ParkingSpot.find({ parkingLot: parkingLotId, level });
};

const findSpotsByLot = async (parkingLotId) => {
  return await ParkingSpot.find({ parkingLot: parkingLotId });
};

const createSpot = async (spotData) => {
  const spot = new ParkingSpot(spotData);
  return await spot.save();
};

const updateSpot = async (id, updateData) => {
  return await ParkingSpot.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteSpot = async (id) => {
  return await ParkingSpot.findByIdAndDelete(id);
};

export default { findAllSpots, findSpotById, findSpotsByLotAndLevel, findSpotsByLot, createSpot, updateSpot, deleteSpot };