import mongoose from 'mongoose';
import ParkingSession from '../models/ParkingSession.js';

const createSession = async (sessionData) => {
  const session = new ParkingSession(sessionData);
  return await session.save();
};

const findByLicensePlate = async (carLicensePlate) => {
  return await ParkingSession.findOne({ carLicensePlate });
};

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

const findSessionByIdWithLot = async (sessionId) => {
  return await ParkingSession.findById(sessionId).populate('parkingLot');
};

const findByCheckoutIdWithLot = async (checkoutId) => {
  return await ParkingSession.findOne({ checkoutId })
    .select('+checkoutTokenHash')
    .populate('parkingLot');
};

const completeCheckoutOnce = async (sessionId, completedAt) => {
  return await ParkingSession.findOneAndUpdate(
    {
      _id: sessionId,
      checkoutStatus: 'PAYABLE',
      checkoutConsumedAt: null,
    },
    {
      $set: {
        checkoutStatus: 'COMPLETED',
        checkoutConsumedAt: completedAt,
      },
    },
    { new: true },
  );
};

const deleteSession = async (sessionId) => {
  return await ParkingSession.findByIdAndDelete(sessionId);
};

export default {
  findSessionsByLot,
  findSessionByIdWithLot,
  findByCheckoutIdWithLot,
  completeCheckoutOnce,
  createSession,
  findByLicensePlate,
  findRandomSession,
  findRandomSessionByLot,
  deleteSession,
};
