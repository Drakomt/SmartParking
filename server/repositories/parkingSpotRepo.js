import ParkingSpot from '../models/ParkingSpot.js';

const findAllSpots = async () => {
  return await ParkingSpot.find({});
};

const findSpotById = async (id) => {
  return await ParkingSpot.findById(id);
};

const findSpotsByLotAndLevel = async (parkingLotId, level, session = null) => {
  return await ParkingSpot.find({ parkingLot: parkingLotId, level }).session(session);
};

const findSpotsByLot = async (parkingLotId) => {
  return await ParkingSpot.find({ parkingLot: parkingLotId });
};

const findPublicSpotsByLot = async (parkingLotId, level) => {
  const query = { parkingLot: parkingLotId };
  if (level !== undefined) query.level = level;
  return ParkingSpot.find(query).select('-currentCarLicensePlate');
};

const findSpotsByLots = async (parkingLotIds, { includeLicensePlate = false } = {}) => {
  const query = ParkingSpot.find({ parkingLot: { $in: parkingLotIds } });
  if (!includeLicensePlate) query.select('-currentCarLicensePlate');
  return query;
};

const countSpotsByLot = async (parkingLotId, session = null) => (
  ParkingSpot.countDocuments({ parkingLot: parkingLotId }).session(session)
);

const getSpotStatsByLot = async (parkingLotId, session = null) => {
  const [stats] = await ParkingSpot.aggregate([
    { $match: { parkingLot: parkingLotId } },
    {
      $group: {
        _id: null,
        totalSpots: { $sum: 1 },
        availableSpots: {
          $sum: { $cond: [{ $eq: ['$status', 'free'] }, 1, 0] },
        },
      },
    },
  ]).session(session);

  return stats
    ? { totalSpots: stats.totalSpots, availableSpots: stats.availableSpots }
    : { totalSpots: 0, availableSpots: 0 };
};

const createSpot = async (spotData, session = null) => {
  const spot = new ParkingSpot(spotData);
  return await spot.save({ session });
};

const createSpots = async (spots, session = null) => (
  spots.length ? ParkingSpot.insertMany(spots, { session }) : []
);

const updateSpot = async (id, updateData, session = null) => {
  return await ParkingSpot.findByIdAndUpdate(id, updateData, { new: true, runValidators: true, session });
};

const deleteSpot = async (id, session = null) => {
  return await ParkingSpot.findByIdAndDelete(id, { session });
};

const deleteByParkingLot = async (parkingLotId, session = null) => (
  ParkingSpot.deleteMany({ parkingLot: parkingLotId }, { session })
);

const deleteByLevel = async (parkingLotId, level, session = null) => (
  ParkingSpot.deleteMany({ parkingLot: parkingLotId, level }, { session })
);

const renumberSpotsAfterDeletion = async (parkingLotId, level, deletedSpotNumber, session = null) => {
  const deletedNumber = Number(deletedSpotNumber);
  if (!Number.isFinite(deletedNumber)) return;

  const spots = await ParkingSpot.find({
    parkingLot: parkingLotId,
    level: Number(level),
  }).sort({ spotNumber: 1 }).session(session);

  for (const spot of spots.filter((candidate) => Number(candidate.spotNumber) > deletedNumber)) {
    await ParkingSpot.findByIdAndUpdate(
      spot._id,
      { spotNumber: String(Number(spot.spotNumber) - 1) },
      { session },
    );
  }
};

export default {
  findAllSpots,
  findSpotById,
  findSpotsByLotAndLevel,
  findSpotsByLot,
  findPublicSpotsByLot,
  findSpotsByLots,
  countSpotsByLot,
  getSpotStatsByLot,
  createSpot,
  createSpots,
  updateSpot,
  deleteSpot,
  deleteByParkingLot,
  deleteByLevel,
  renumberSpotsAfterDeletion,
};
