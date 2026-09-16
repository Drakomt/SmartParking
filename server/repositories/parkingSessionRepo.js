import mongoose from 'mongoose';
import ParkingSession from '../models/ParkingSession.js';

const createSession = async (sessionData) => {
  const session = new ParkingSession(sessionData);
  return await session.save();
};

const findByLicensePlate = async (carLicensePlate) => {
  return await ParkingSession.findOne({ carLicensePlate });
};

const findActiveByLicensePlateWithLot = async (carLicensePlate) => {
  return await ParkingSession.findOne({
    carLicensePlate,
    checkoutStatus: { $in: ['Payable', 'paid', 'pass'] },
  })
    .sort({ entryTime: -1 })
    .populate('parkingLot');
};

const updateCheckoutCredentials = async (sessionId, checkoutCredentials, previousCheckoutId) => {
  return await ParkingSession.findOneAndUpdate(
    {
      _id: sessionId,
      checkoutId: previousCheckoutId ?? { $exists: false },
      checkoutPaymentStarted: { $ne: true },
      checkoutStatus: { $in: ['Payable', 'paid'] },
    },
    {
      $set: {
        checkoutId: checkoutCredentials.checkoutId,
        checkoutTokenHash: checkoutCredentials.checkoutTokenHash,
        checkoutExpiresAt: checkoutCredentials.checkoutExpiresAt,
        checkoutConsumedAt: null,
      },
    },
    { new: true, runValidators: true },
  ).populate('parkingLot');
};

const claimCheckoutForPayment = async (sessionId, checkoutId) => (
  ParkingSession.findOneAndUpdate(
    { _id: sessionId, checkoutId, checkoutConsumedAt: null, checkoutStatus: { $in: ['Payable', 'paid'] } },
    { $set: { checkoutPaymentStarted: true } },
    { new: true, runValidators: true },
  )
);

const findRandomSession = async () => {
  const result = await ParkingSession.aggregate([{ $sample: { size: 1 } }]);
  return result[0] || null;
};

const findRandomSessionByLot = async (parkingLotId) => {
  const lotObjectId = mongoose.Types.ObjectId.isValid(parkingLotId)
    ? new mongoose.Types.ObjectId(parkingLotId)
    : parkingLotId;

  const result = await ParkingSession.aggregate([
    { $match: { parkingLot: lotObjectId } },
    { $sample: { size: 1 } },
  ]);
  return result[0] || null;
};

const findSessionsByLot = async (parkingLotId) => {
  return await ParkingSession.find({ parkingLot: parkingLotId });
};

const findSessionsByLots = async (parkingLotIds) => (
  ParkingSession.find({ parkingLot: { $in: parkingLotIds } })
);

const grantPassToAuthorizedVehicles = async (parkingLotId, licensePlates) => {
  if (licensePlates.length === 0) return { modifiedCount: 0 };

  return await ParkingSession.updateMany(
    {
      parkingLot: parkingLotId,
      carLicensePlate: { $in: licensePlates },
      checkoutStatus: { $in: ['Payable', 'paid'] },
    },
    { $set: { checkoutStatus: 'pass' } },
    { runValidators: true },
  );
};

const findSessionByIdWithLot = async (sessionId) => {
  return await ParkingSession.findById(sessionId).populate('parkingLot');
};

const findByCheckoutIdWithLot = async (checkoutId) => {
  return await ParkingSession.findOne({ checkoutId })
    .select('+checkoutTokenHash')
    .populate('parkingLot');
};

const completeCheckoutOnce = async (sessionId, completedAt, checkoutId) => {
  return await ParkingSession.findOneAndUpdate(
    {
      _id: sessionId,
      checkoutId,
      checkoutStatus: { $in: ['Payable', 'paid'] },
      checkoutConsumedAt: null,
    },
    {
      $set: {
        checkoutStatus: 'paid',
        checkoutConsumedAt: completedAt,
        checkoutPaymentStarted: false,
      },
    },
    { new: true },
  );
};

const deleteSession = async (sessionId) => {
  return await ParkingSession.findByIdAndDelete(sessionId);
};

const deleteByParkingLot = async (parkingLotId, session = null) => (
  ParkingSession.deleteMany({ parkingLot: parkingLotId }, { session })
);

const countByParkingSpots = async (parkingSpotIds, session = null) => (
  ParkingSession.countDocuments({ parkingSpot: { $in: parkingSpotIds } }).session(session)
);

export default {
  findSessionsByLot,
  findSessionsByLots,
  grantPassToAuthorizedVehicles,
  findSessionByIdWithLot,
  findByCheckoutIdWithLot,
  findActiveByLicensePlateWithLot,
  updateCheckoutCredentials,
  claimCheckoutForPayment,
  completeCheckoutOnce,
  createSession,
  findByLicensePlate,
  findRandomSession,
  findRandomSessionByLot,
  deleteSession,
  deleteByParkingLot,
  countByParkingSpots,
};
