import ParkingPayment from '../models/ParkingPayment.js';

const findByParkingSession = async (parkingSessionId) => (
  ParkingPayment.findOne({ parkingSession: parkingSessionId }).sort({ createdAt: -1, _id: -1 })
);

const findCompletedByParkingSession = async (parkingSessionId) => (
  ParkingPayment.find({ parkingSession: parkingSessionId, paypalPaymentStatus: 'COMPLETED' })
    .sort({ paidAt: -1, _id: -1 })
);

const findByPayPalOrderId = async (paypalOrderId) => (
  ParkingPayment.findOne({ paypalOrderId }).select('+checkoutTokenHash')
);

const findByPayPalCaptureId = async (paypalCaptureId) => (
  ParkingPayment.findOne({ paypalCaptureId })
);

const findByCheckoutId = async (checkoutId) => (
  ParkingPayment.findOne({ checkoutId }).select('+checkoutTokenHash')
);

const createPayment = async (paymentData) => ParkingPayment.create(paymentData);

const claimOperation = async (paymentId, now, lockUntil) => (
  ParkingPayment.findOneAndUpdate(
    {
      _id: paymentId,
      $or: [
        { operationLockUntil: null },
        { operationLockUntil: { $lt: now } },
      ],
    },
    { $set: { operationLockUntil: lockUntil } },
    { new: true },
  )
);

const updatePayment = async (paymentId, update, additionalQuery = {}) => (
  ParkingPayment.findOneAndUpdate(
    { _id: paymentId, ...additionalQuery },
    { $set: update },
    { new: true, runValidators: true },
  )
);

const completePaymentOnce = async (paymentId, completionData) => (
  ParkingPayment.findOneAndUpdate(
    { _id: paymentId, fulfilledAt: null },
    {
      $set: {
        ...completionData,
        paypalPaymentStatus: 'COMPLETED',
        operationLockUntil: null,
      },
    },
    { new: true, runValidators: true },
  )
);

const deleteByParkingLot = async (parkingLotId, session = null) => (
  ParkingPayment.deleteMany({ parkingLot: parkingLotId }, { session })
);

export default {
  findByParkingSession,
  findCompletedByParkingSession,
  findByPayPalOrderId,
  findByPayPalCaptureId,
  findByCheckoutId,
  createPayment,
  claimOperation,
  updatePayment,
  completePaymentOnce,
  deleteByParkingLot,
};
