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

const renumberSpotsAfterDeletion = async (parkingLotId, level, deletedSpotNumber) => {
  const deletedNumber = Number(deletedSpotNumber);
  if (!Number.isFinite(deletedNumber)) return;

  const spots = await ParkingSpot.find({
    parkingLot: parkingLotId,
    level: Number(level),
  });

  const updates = spots
    .filter((spot) => Number(spot.spotNumber) > deletedNumber)
    .map((spot) => ParkingSpot.findByIdAndUpdate(
      spot._id,
      { spotNumber: String(Number(spot.spotNumber) - 1) },
    ));

  await Promise.all(updates);
};

export default {
  findAllSpots,
  findSpotById,
  findSpotsByLotAndLevel,
  findSpotsByLot,
  createSpot,
  updateSpot,
  deleteSpot,
  renumberSpotsAfterDeletion,
};