const ParkingSpot = require('../models/ParkingSpot');

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

module.exports = {
  findSpotsByLotAndLevel,
  findSpotsByLot,
  createSpot,
  updateSpot,
  deleteSpot
};